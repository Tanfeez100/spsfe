import React from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import BillSlipCard from '../../Components/Fees/BillSlipCard'
import {
  getInvoiceDetails,
  downloadInvoicePDF as downloadInvoiceBackendPDF,
  getCachedBillPdfApi,
  uploadCachedBillPdfApi,
} from '../../Api/fees'

const triggerDirectCdnDownload = async (url, targetFilename) => {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Fetch status ' + res.status)
    const blob = await res.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = targetFilename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500)
    return true
  } catch (err) {
    console.warn('Direct blob fetch failed, opening URL directly:', err)
    window.open(url, '_blank')
    return true
  }
}

/**
 * Normalizes bill/invoice object so BillSlipCard receives all expected fields
 */
export const normalizeInvoiceForSlip = (data) => {
  if (!data) return null
  return {
    ...data,
    bill_number:
      data.invoice_number ||
      data.receipt_number ||
      data.receipt_no ||
      data.bill_number ||
      data.bill_id ||
      '-',
    student_name: data.student?.name || data.student_name || data.name || 'Student',
    father_name: data.student?.father_name || data.father_name || '-',
    class: data.student?.class || data.class || '-',
    section: data.student?.section || data.section || '',
    roll_no: data.student?.roll_no || data.roll_no || data.roll || '-',
    installment: data.month || data.installment || '--',
    items: Array.isArray(data.items) ? data.items : [],
    payments: Array.isArray(data.payments) ? data.payments : [],
    date: data.date || data.created_at || (data.payments?.[0]?.payment_date) || new Date().toISOString(),
    payment_mode: data.payment_mode || (data.payments?.[0]?.payment_mode) || '',
    receipt_no: data.receipt_no || (data.payments?.[0]?.receipt_no) || data.invoice_number || '',
    summary: data.summary || {
      total_amount: data.total_amount,
      total_paid: data.total_paid,
      advance_used: data.advance_used,
      remaining: data.remaining,
      status: data.bill_status || data.status,
    },
    bill_status: data.summary?.status || data.bill_status || data.status,
    status: data.summary?.status || data.bill_status || data.status,
    isBill: Boolean(data.isBill || data.type === 'bill'),
    isReceipt: data.isReceipt !== undefined ? Boolean(data.isReceipt) : !Boolean(data.isBill || data.type === 'bill'),
  }
}

/**
 * Downloads official pixel-perfect Canva fee receipt PDF for a single bill
 * @param {string|Object} billIdOrInvoice - Bill UUID string or invoice object
 * @param {string} customFileName - optional custom filename
 */
export const downloadInvoiceSlipPDF = async (billIdOrInvoice, customFileName = null) => {
  if (!billIdOrInvoice) {
    throw new Error('No bill ID or invoice data provided')
  }

  let invoiceObj = typeof billIdOrInvoice === 'object' ? billIdOrInvoice : null
  const billIdString = typeof billIdOrInvoice === 'string'
    ? billIdOrInvoice.trim()
    : (billIdOrInvoice.bill_id || billIdOrInvoice.id || billIdOrInvoice.bill_number || '')

  // If only a bill_id string was passed, fetch the invoice details from backend
  if (!invoiceObj && billIdString) {
    try {
      const res = await getInvoiceDetails(billIdString)
      invoiceObj = res?.invoice || res
    } catch (fetchErr) {
      console.warn('Failed to fetch invoice details for client PDF, falling back to server PDF:', fetchErr)
      return downloadBackendPDFFile(billIdString, customFileName)
    }
  }

  const billForCard = normalizeInvoiceForSlip(invoiceObj)
  if (!billForCard) {
    throw new Error('Could not format invoice data for PDF')
  }

  const receiptNo =
    billForCard.bill_number ||
    billForCard.receipt_number ||
    billForCard.receipt_no ||
    billForCard.bill_id ||
    'fee_receipt'
  const cleanNo = String(receiptNo).replace(/[^a-zA-Z0-9_-]/g, '_')
  const filePrefix = billForCard.isBill ? 'Fee_Bill' : 'Fee_Receipt'
  const resolvedFileName = customFileName || `${filePrefix}_${cleanNo}.pdf`

  // 0. Check if already cached in Cloudinary/local storage for instant download
  const targetBillId = billForCard.bill_id || billIdString
  let cachedUrl = billForCard.cached_pdf_url || null
  if (!cachedUrl && targetBillId) {
    try {
      const cachedData = await getCachedBillPdfApi(targetBillId)
      if (cachedData?.url) {
        cachedUrl = cachedData.url
      }
    } catch (_) {}
  }

  if (cachedUrl) {
    try {
      const downloaded = await triggerDirectCdnDownload(cachedUrl, resolvedFileName)
      if (downloaded) return true
    } catch (cdnErr) {
      console.warn('Failed to stream cached bill PDF, re-generating freshly:', cdnErr)
    }
  }

  // Create an off-screen container mounted in DOM
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '0px'
  container.style.top = '0px'
  container.style.width = '430px'
  container.style.zIndex = '-99999'
  container.style.backgroundColor = '#ffffff'
  container.style.padding = '8px'
  container.style.pointerEvents = 'none'
  document.body.appendChild(container)

  const root = createRoot(container)

  try {
    // 1. Render BillSlipCard inside off-screen container
    await new Promise((resolve) => {
      root.render(React.createElement(BillSlipCard, { bill: billForCard, isPrint: false }))
      setTimeout(resolve, 250)
    })

    // 2. Wait for images to load
    const images = Array.from(container.querySelectorAll('img'))
    if (images.length > 0) {
      await Promise.all(
        images.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) return resolve()
              img.onload = () => resolve()
              img.onerror = () => resolve()
              setTimeout(resolve, 350)
            })
        )
      )
    }

    const cardEl = container.querySelector('.bill-receipt-card') || container

    // 3. Capture with html2canvas-pro with oklch conversion
    const canvas = await html2canvas(cardEl, {
      scale: 2.8,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      onclone: (clonedDoc) => {
        const scratchCanvas = document.createElement('canvas')
        const ctx = scratchCanvas.getContext('2d')
        const toRgb = (val) => {
          if (!val || typeof val !== 'string' || !val.includes('oklch')) return val
          try {
            ctx.fillStyle = '#000000'
            ctx.fillStyle = val
            return ctx.fillStyle
          } catch (_) {
            return '#000000'
          }
        }
        const colorProps = [
          'color',
          'backgroundColor',
          'borderColor',
          'borderTopColor',
          'borderRightColor',
          'borderBottomColor',
          'borderLeftColor',
          'outlineColor',
        ]
        clonedDoc.querySelectorAll('*').forEach((el) => {
          try {
            const comp = (clonedDoc.defaultView || window).getComputedStyle(el)
            colorProps.forEach((prop) => {
              const val = comp[prop]
              if (val && typeof val === 'string' && val.includes('oklch')) {
                el.style[prop] = toRgb(val)
              }
            })
            if (comp.boxShadow && comp.boxShadow.includes('oklch')) {
              el.style.boxShadow = 'none'
            }
          } catch (_) {}
        })
      },
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageW = 210
    // Center the receipt on A4 page (width ~ 135mm)
    const targetW = 135
    const targetH = (canvas.height * targetW) / canvas.width
    const xPos = (pageW - targetW) / 2
    const yPos = 20 // Top margin

    pdf.addImage(imgData, 'PNG', xPos, yPos, targetW, targetH, undefined, 'FAST')

    const fileName = resolvedFileName
    pdf.save(fileName)

    // Background upload to cache for instant future downloads
    try {
      if (targetBillId) {
        const pdfBase64 = pdf.output('datauristring')
        uploadCachedBillPdfApi(targetBillId, {
          pdfBase64,
          filename: fileName.replace(/\.pdf$/i, ''),
        })
      }
    } catch (bgErr) {
      console.warn('Background bill PDF upload to cache server failed:', bgErr)
    }

    return true
  } catch (err) {
    console.error('Client PDF generation failed, executing server PDF fallback:', err)
    if (billIdString) {
      return downloadBackendPDFFile(billIdString, customFileName)
    }
    throw err
  } finally {
    try {
      root.unmount()
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    } catch {
      // ignore cleanup errors
    }
  }
}

/**
 * Downloads invoice PDF directly from backend API and triggers browser download
 */
async function downloadBackendPDFFile(billId, customFileName = null) {
  const blob = await downloadInvoiceBackendPDF(billId)
  const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', customFileName || `Fee_Receipt-${String(billId).slice(0, 8)}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.parentNode.removeChild(link)
  window.URL.revokeObjectURL(url)
  return true
}

export default downloadInvoiceSlipPDF
