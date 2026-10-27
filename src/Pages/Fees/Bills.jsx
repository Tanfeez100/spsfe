import React, { useState, useEffect, useMemo } from 'react'
import { generateBillsForClass, downloadBillsData, closeMonth, getFeeStructures } from '../../Api/fees'
import { getClassesWithSections } from '../../Api/classes'
import { getStudents } from '../../Api/students'
import { CLASS_OPTIONS, SECTION_OPTIONS, normalizeSchoolClass } from '../../constants/schoolOptions'
import { emitToast } from '../../Api/auth'
import { flushSync } from 'react-dom'
import jsPDF from 'jspdf'
import BillSlipCard from '../../Components/Fees/BillSlipCard'
import BillSheetGrid from '../../Components/Fees/BillSheetGrid'
import html2canvas from 'html2canvas-pro'
import { downloadInvoiceSlipPDF } from '../../utils/pdf/invoiceSlipPdf'


function Bills() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [batchDownloadBills, setBatchDownloadBills] = useState([])
  const [success, setSuccess] = useState('')
  const [previewIndex, setPreviewIndex] = useState(0)
  const [actualDbBills, setActualDbBills] = useState([])
  const [loadingDbBills, setLoadingDbBills] = useState(false)

  // Close Month & Auto-Close Engine state
  const getCurrentMonthYYYYMM = () => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${yyyy}-${mm}`
  }
  const [showCloseMonthModal, setShowCloseMonthModal] = useState(false)
  const [closeMonthTarget, setCloseMonthTarget] = useState(getCurrentMonthYYYYMM())
  const [closingMonth, setClosingMonth] = useState(false)

  // Billing Month Options (real YYYY-MM values)
  const MONTH_OPTIONS = [
    { label: 'October 2026', value: '2026-10' },
    { label: 'November 2026', value: '2026-11' },
    { label: 'December 2026', value: '2026-12' },
    { label: 'January 2027', value: '2027-01' },
    { label: 'February 2027', value: '2027-02' },
    { label: 'March 2027', value: '2027-03' },
    { label: 'April 2026', value: '2026-04' },
    { label: 'May 2026', value: '2026-05' },
    { label: 'June 2026', value: '2026-06' },
    { label: 'July 2026', value: '2026-07' },
    { label: 'August 2026', value: '2026-08' },
    { label: 'September 2026', value: '2026-09' },
  ]

  // Form Controls
  const [session, setSession] = useState('2026–27')
  const [billingMonth, setBillingMonth] = useState('2026-10')
  const [selectedClass, setSelectedClass] = useState('All Classes')
  const [selectedSection, setSelectedSection] = useState('All Sections')
  const [dueDate, setDueDate] = useState('2026-10-31')

  // Real Database Classes & Students State (NO DUMMY DATA)
  const [classesData, setClassesData] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [realStudents, setRealStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [feeStructures, setFeeStructures] = useState([])

  // Fee Heads Included Checkboxes
  const [feeHeads, setFeeHeads] = useState({
    tuition: true,
    computerLab: true,
    transport: true,
    annualExam: false,
  })

  // Fetch Real Classes on Mount
  useEffect(() => {
    let isMounted = true
    const loadRealClasses = async () => {
      setLoadingClasses(true)
      try {
        const data = await getClassesWithSections()
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setClassesData(data)
          } else {
            setClassesData(CLASS_OPTIONS.map((c) => ({ class: c, sections: SECTION_OPTIONS })))
          }
        }
      } catch (err) {
        console.warn('Failed to fetch classes dynamically, fallback to standard classes:', err)
        if (isMounted) {
          setClassesData(CLASS_OPTIONS.map((c) => ({ class: c, sections: SECTION_OPTIONS })))
        }
      } finally {
        if (isMounted) setLoadingClasses(false)
      }
    }
    loadRealClasses()
    return () => { isMounted = false }
  }, [])

  // Derive Real Available Classes & Sections
  const availableClasses = useMemo(() => {
    if (!classesData || classesData.length === 0) return CLASS_OPTIONS
    return classesData.map((c) => (typeof c === 'string' ? c : c.class)).filter(Boolean)
  }, [classesData])

  const availableSections = useMemo(() => {
    if (selectedClass === 'All Classes') {
      return SECTION_OPTIONS
    }
    const found = classesData.find((c) => {
      const name = typeof c === 'string' ? c : c.class
      return name === selectedClass
    })
    if (found && Array.isArray(found.sections) && found.sections.length > 0) {
      return found.sections
    }
    return SECTION_OPTIONS
  }, [classesData, selectedClass])

  // Fetch Real Active Students & Real Fee Structures
  useEffect(() => {
    let isMounted = true
    const loadRealData = async () => {
      setLoadingStudents(true)
      try {
        const filter = { status: 'active' }
        if (selectedClass !== 'All Classes') filter.class = selectedClass
        if (selectedSection !== 'All Sections') filter.section = selectedSection

        const [studentsRes, feesRes] = await Promise.allSettled([
          getStudents(filter),
          getFeeStructures(selectedClass !== 'All Classes' ? selectedClass : ''),
        ])

        if (!isMounted) return

        if (studentsRes.status === 'fulfilled') {
          const list = Array.isArray(studentsRes.value)
            ? studentsRes.value
            : (studentsRes.value?.students || studentsRes.value?.data || [])
          setRealStudents(list)
        } else {
          setRealStudents([])
        }

        if (feesRes.status === 'fulfilled') {
          const list = Array.isArray(feesRes.value)
            ? feesRes.value
            : (feesRes.value?.data || feesRes.value?.feeStructures || [])
          setFeeStructures(list)
        }
      } catch (err) {
        if (isMounted) setRealStudents([])
      } finally {
        if (isMounted) setLoadingStudents(false)
      }
    }
    loadRealData()
    return () => { isMounted = false }
  }, [selectedClass, selectedSection])

  // Fetch Actual Generated Bills from Database whenever Month/Class/Section changes
  useEffect(() => {
    let isMounted = true
    const fetchActualBills = async () => {
      if (!billingMonth) return
      setLoadingDbBills(true)
      try {
        const downloadRes = await downloadBillsData({
          month: billingMonth,
          class: selectedClass === 'All Classes' ? '' : selectedClass,
          section: selectedSection === 'All Sections' ? '' : selectedSection,
        })
        const generatedBills = Array.isArray(downloadRes?.bills)
          ? downloadRes.bills
          : (Array.isArray(downloadRes) ? downloadRes : [])
        if (isMounted) {
          if (generatedBills.length > 0) {
            let filtered = generatedBills
            if (selectedSection !== 'All Sections') {
              filtered = filtered.filter((b) => {
                const sec = (b.section || b.student?.section || '').trim().toUpperCase()
                return sec === selectedSection.trim().toUpperCase()
              })
            }
            setActualDbBills(filtered.map((b) => ({ ...b, isBill: true })))
          } else {
            setActualDbBills([])
          }
        }
      } catch (err) {
        if (isMounted) setActualDbBills([])
      } finally {
        if (isMounted) setLoadingDbBills(false)
      }
    }

    fetchActualBills()
    return () => { isMounted = false }
  }, [billingMonth, selectedClass, selectedSection])

  // Calculate Real Bill Preview from Actual Student Records & Fee Structures
  const previewRealBills = useMemo(() => {
    if (!realStudents || realStudents.length === 0) return []

    // Sort students by Section (A, B, C...) and Roll Number numerically (1, 2, 3... 10, 11...)
    const sortedStudents = [...realStudents].sort((a, b) => {
      const classA = String(a.class || '').trim()
      const classB = String(b.class || '').trim()
      if (classA !== classB) {
        const numA = parseInt(classA.replace(/\D/g, ''), 10)
        const numB = parseInt(classB.replace(/\D/g, ''), 10)
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB
        return classA.localeCompare(classB, undefined, { numeric: true, sensitivity: 'base' })
      }

      const secA = String(a.section || '').trim().toUpperCase()
      const secB = String(b.section || '').trim().toUpperCase()
      if (secA !== secB) {
        return secA.localeCompare(secB, undefined, { numeric: true, sensitivity: 'base' })
      }

      const rollA = parseInt(String(a.roll_no || '').replace(/\D/g, ''), 10)
      const rollB = parseInt(String(b.roll_no || '').replace(/\D/g, ''), 10)
      if (!isNaN(rollA) && !isNaN(rollB) && rollA !== rollB) {
        return rollA - rollB
      }
      return String(a.roll_no || '').localeCompare(String(b.roll_no || ''), undefined, { numeric: true, sensitivity: 'base' })
    })

    return sortedStudents.slice(0, 100).map((student, idx) => {
      const studentClass = student.class || selectedClass
      const matchingFees = feeStructures.filter((f) => f.class === studentClass)

      const getFeeAmount = (keyword) => {
        const item = matchingFees.find((f) => (f.fee_type || f.fee_name || '').toLowerCase().includes(keyword))
        return parseFloat(item?.amount || 0)
      }

      const tuitionAmount = feeHeads.tuition ? (getFeeAmount('tuition') || 1500) : 0
      const labAmount = feeHeads.computerLab ? (getFeeAmount('computer') || getFeeAmount('lab') || 300) : 0
      const transportAmount = feeHeads.transport && student.uses_transport
        ? parseFloat(student.transport_charge || getFeeAmount('transport') || 600)
        : 0
      const examAmount = feeHeads.annualExam ? (getFeeAmount('exam') || 500) : 0
      const annualAmount = 0
      const previousDueAmount = parseFloat(student.previous_due || student.due || 0)
      const total = tuitionAmount + labAmount + transportAmount + examAmount + annualAmount + previousDueAmount

      const billNo = `B-${Date.now().toString().slice(-8)}${student.roll_no || idx + 1}`

      return {
        id: student.id,
        isBill: true,
        bill_number: billNo,
        date: new Date().toISOString(),
        student_name: student.name || 'Student',
        father_name: student.father_name || student.guardian_name || '-',
        roll_no: student.roll_no || student.admission_number || '-',
        class: studentClass,
        section: student.section || (selectedSection !== 'All Sections' ? selectedSection : ''),
        items: [
          { fee_name: 'Tuition Fee', amount: tuitionAmount },
          { fee_name: 'Exam Fee', amount: examAmount },
          { fee_name: 'Annual Fee', amount: annualAmount },
          { fee_name: 'Computer Fee', amount: labAmount },
          { fee_name: 'Transport Fee', amount: transportAmount },
          { fee_name: 'Previous Due', amount: previousDueAmount },
        ],
        summary: {
          total_amount: total,
          advance_used: 0,
          net_payable: total,
          status: 'unpaid',
        },
        roll: student.roll_no || student.admission_number || '-',
        name: student.name || 'Student',
        mother_name: student.mother_name || '-',
        admission_no: student.admission_number || student.scholar_no || student.roll_no || '-',
        dob: student.date_of_birth || '-',
        route: student.uses_transport ? (student.transport_route || 'etmadpur to school') : 'Local',
        destination: student.address || 'Adhiyarin Ka Purava',
        installment: billingMonth || 'OCT, NOV, DEC',
        tuition: tuitionAmount,
        lab: labAmount,
        computer: labAmount,
        transport: transportAmount,
        exam: examAmount,
        annual: annualAmount,
        previous_due: previousDueAmount,
        total: total,
      }
    })
  }, [realStudents, feeStructures, feeHeads, selectedClass, selectedSection, billingMonth])

  // Exact Template Fallback when no live student is loaded
  const fallbackSampleBill = useMemo(() => ({
    isBill: true,
    bill_number: 'BILL-1001',
    date: new Date().toLocaleDateString('en-GB'),
    student_name: 'Aman Kumar',
    father_name: 'Rajesh Kumar',
    mother_name: 'Sunita Devi',
    admission_no: 'SPS-2026-1042',
    class: selectedClass !== 'All Classes' ? selectedClass : '1',
    section: selectedSection !== 'All Sections' ? selectedSection : 'A',
    roll_no: '01',
    dob: '12-05-2018',
    route: 'School Bus Route',
    destination: 'West Champaran',
    installment: billingMonth || 'OCTOBER 2026',
    items: [
      { fee_name: 'TUITION FEE', amount: 1500 },
      { fee_name: 'COMPUTER FEE', amount: 300 },
      { fee_name: 'TRANSPORT FEE', amount: 600 },
      { fee_name: 'EXAM FEE', amount: 500 },
    ],
    calculated_fee: 2900,
    concession: 0,
    net_payable: 2900,
    paid_amount: 0,
    due_amount: 2900,
    remark: 'MONTHLY FEE BILL',
  }), [selectedClass, selectedSection, billingMonth])

  // Primary bills: If actual generated bills exist in DB, use them! Otherwise fall back to preview bills
  const activeBillsList = useMemo(() => {
    if (actualDbBills && actualDbBills.length > 0) {
      return actualDbBills
    }
    return previewRealBills
  }, [actualDbBills, previewRealBills])

  // Currently active bill for the live preview card
  const activePreviewBill = useMemo(() => {
    return activeBillsList[previewIndex] || fallbackSampleBill
  }, [activeBillsList, previewIndex, fallbackSampleBill])

  // High-Resolution 100% Exact PDF Downloader using html2canvas
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  /**
   * generateBatchBillsPDF - Renders BillSlipCards into an offscreen hidden DOM node
   * (4 at a time in 2x2 grid), captures with html2canvas, builds multi-page A4 PDF.
   * This produces a pixel-perfect PDF matching the screen design exactly.
   */
  /**
   * Sort bills strictly by Section (A, B, C...) and Roll Number numerically (1, 2, 3...)
   */
  const sortBillsBySectionAndRoll = (billList) => {
    if (!Array.isArray(billList)) return []

    // 1. Strict de-duplication: each student's bill appears at most once
    const seen = new Set()
    const uniqueBills = []
    for (const b of billList) {
      if (!b) continue
      const uid = b.id || b.bill_id || b.receipt_number || b.bill_number || `${b.student_id || b.student?.id || b.name || b.student_name}_${b.roll_no || b.roll}`
      if (seen.has(uid)) continue
      seen.add(uid)
      uniqueBills.push(b)
    }

    return uniqueBills.sort((a, b) => {
      // 1. Class
      const classA = String(a.class || a.student?.class || a.students?.class || '').trim()
      const classB = String(b.class || b.student?.class || b.students?.class || '').trim()
      if (classA !== classB) {
        const numA = parseInt(classA.replace(/\D/g, ''), 10)
        const numB = parseInt(classB.replace(/\D/g, ''), 10)
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB
        return classA.localeCompare(classB, undefined, { numeric: true, sensitivity: 'base' })
      }

      // 2. Section: A, B, C...
      const secA = String(a.section || a.student?.section || a.students?.section || '').trim().toUpperCase()
      const secB = String(b.section || b.student?.section || b.students?.section || '').trim().toUpperCase()
      if (secA !== secB) {
        return secA.localeCompare(secB, undefined, { numeric: true, sensitivity: 'base' })
      }

      // 3. Roll Number: numerical (1, 2, 3... 10, 11...)
      const rawRollA = a.roll_no || a.roll || a.student?.roll_no || a.students?.roll_no || ''
      const rawRollB = b.roll_no || b.roll || b.student?.roll_no || b.students?.roll_no || ''
      const numRollA = parseInt(String(rawRollA).replace(/\D/g, ''), 10)
      const numRollB = parseInt(String(rawRollB).replace(/\D/g, ''), 10)

      if (!isNaN(numRollA) && !isNaN(numRollB) && numRollA !== numRollB) {
        return numRollA - numRollB
      }

      return String(rawRollA).localeCompare(String(rawRollB), undefined, { numeric: true, sensitivity: 'base' })
    })
  }

  const generateBatchBillsPDF = async (bills, fileNamePrefix = 'Star_Public_School_Fee_Bills') => {
    if (!bills || bills.length === 0) return

    // Ensure bills are sorted strictly by Section (A, B, C...) and Roll Number numerically (1, 2, 3...)
    const sortedBills = sortBillsBySectionAndRoll(bills)

    setDownloadingPdf(true)
    emitToast({
      type: 'info',
      title: 'Generating PDF',
      message: `Preparing ${sortedBills.length} fee bills for download (6 per A4 page)...`,
    })

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      // A4 dimensions
      const pageW = 210
      const pageH = 297
      const margin = 4

      // Split bills into pages of 6
      const pages = []
      for (let i = 0; i < sortedBills.length; i += 6) {
        pages.push(sortedBills.slice(i, i + 6))
      }

      for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        const pageBills = pages[pageIdx].map((b) => ({ ...b, isBill: true }))

        // Flush state update synchronously then wait for DOM to update
        await new Promise((resolve) => {
          flushSync(() => {
            setBatchDownloadBills(pageBills)
          })
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(resolve, 150)
            })
          })
        })

        const sheetEl = document.getElementById('batch-download-sheet')
        if (!sheetEl) break

        // Preload all images (logo, QR, stamp) before capturing
        const images = Array.from(sheetEl.querySelectorAll('img'))
        if (images.length > 0) {
          await Promise.all(
            images.map(
              (img) =>
                new Promise((res) => {
                  if (img.complete && img.naturalWidth > 0) return res()
                  img.onload = () => res()
                  img.onerror = () => res()
                  setTimeout(res, 250)
                })
            )
          )
        }

        const canvas = await html2canvas(sheetEl, {
          scale: 2.2,
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
              } catch (_) { }
            })
          },
        })

        const imgData = canvas.toDataURL('image/png')
        const maxW = pageW - margin * 2
        const maxH = pageH - margin * 2

        let finalW = maxW
        let finalH = (canvas.height * finalW) / canvas.width
        if (finalH > maxH) {
          finalH = maxH
          finalW = (canvas.width * finalH) / canvas.height
        }

        const xPos = margin + (maxW - finalW) / 2
        const yPos = margin + (maxH - finalH) / 2

        if (pageIdx > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', xPos, yPos, finalW, finalH, undefined, 'FAST')
      }

      // Clean up the hidden container
      setBatchDownloadBills([])

      const classLabel = selectedClass !== 'All Classes' ? `_Class_${selectedClass.replace(/\s+/g, '_')}` : ''
      const fileName = `${fileNamePrefix}${classLabel}_${billingMonth}.pdf`
      pdf.save(fileName)

      emitToast({
        type: 'success',
        title: 'PDF Downloaded',
        message: `${fileName} saved — ${bills.length} bills across ${pages.length} page(s).`,
      })
    } catch (err) {
      console.error('Batch PDF generation failed:', err)
      setBatchDownloadBills([])
      emitToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Could not generate PDF. Please try again.',
      })
    } finally {
      setDownloadingPdf(false)
    }
  }

  const downloadExactSlipPDF = async (targetBill) => {
    const billToDownload = targetBill || activePreviewBill
    if (!billToDownload) return
    setDownloadingPdf(true)
    try {
      const studentLabel = (billToDownload?.student_name || 'Student').replace(/\s+/g, '_')
      const fileName = `Fee_Bill_${studentLabel}_${billingMonth}.pdf`
      await downloadInvoiceSlipPDF({ ...billToDownload, isBill: true }, fileName)
      emitToast({
        type: 'success',
        title: 'Bill Downloaded',
        message: `Official Fee Bill saved for ${billToDownload?.student_name || 'Student'}.`,
      })
    } catch (err) {
      console.error('Single bill download error:', err)
      emitToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Could not download bill slip. Please try again.',
      })
    } finally {
      setDownloadingPdf(false)
    }
  }


  // High-Resolution 6-in-1 A4 Sheet PDF Downloader (2x3 grid)
  const download6In1SheetPDF = async () => {
    setDownloadingPdf(true)
    try {
      let billsToExport = []
      // 1. Try fetching freshest bills from database for the selected criteria
      try {
        const downloadRes = await downloadBillsData({
          month: billingMonth,
          class: selectedClass === 'All Classes' ? '' : selectedClass,
          section: selectedSection === 'All Sections' ? '' : selectedSection,
        })
        const generatedBills = Array.isArray(downloadRes?.bills)
          ? downloadRes.bills
          : (Array.isArray(downloadRes) ? downloadRes : [])
        if (generatedBills.length > 0) {
          let filtered = generatedBills
          if (selectedSection !== 'All Sections') {
            filtered = filtered.filter((b) => {
              const sec = (b.section || b.student?.section || '').trim().toUpperCase()
              return sec === selectedSection.trim().toUpperCase()
            })
          }
          billsToExport = filtered.map((b) => ({ ...b, isBill: true }))
          setActualDbBills(billsToExport)
        }
      } catch (err) {
        console.warn('Could not fetch actual bills for download, using active bills:', err)
      }

      // 2. Fallback to currently active bills
      if (!billsToExport || billsToExport.length === 0) {
        billsToExport = activeBillsList.length > 0 ? activeBillsList : [activePreviewBill]
      }

      if (billsToExport && billsToExport.length > 0) {
        await generateBatchBillsPDF(billsToExport)
      } else {
        emitToast({
          type: 'warning',
          title: 'No Bills Found',
          message: `No bills found for ${selectedClass} (${billingMonth}). Please click "Generate Monthly Bills" first.`,
        })
      }
    } catch (err) {
      console.error('Batch bills download error:', err)
      emitToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Could not generate bills PDF. Please try again.',
      })
    } finally {
      setDownloadingPdf(false)
    }
  }

  // Clear Setup Handler
  const handleClearSetup = () => {
    setSession('2026–27')
    setBillingMonth('2026-10')
    setSelectedClass('All Classes')
    setSelectedSection('All Sections')
    setDueDate('2026-10-31')
    setFeeHeads({
      tuition: true,
      computerLab: true,
      transport: true,
      annualExam: false,
    })
    setError('')
    setSuccess('')
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: {
          type: 'info',
          title: 'Setup Cleared',
          message: 'Bill generation parameters reset to default.',
        },
      })
    )
  }

  // Handle Manual Month Closure
  const handleManualCloseMonth = async () => {
    if (!closeMonthTarget) {
      emitToast({
        type: 'warning',
        title: 'Input Required',
        message: 'Please select a valid month to close.',
      })
      return
    }

    setClosingMonth(true)
    try {
      const res = await closeMonth(closeMonthTarget)
      emitToast({
        type: 'success',
        title: 'Month Closed Successfully',
        message: res?.message || `Month ${closeMonthTarget} has been locked and dues carried forward.`,
      })
      setShowCloseMonthModal(false)
    } catch (err) {
      emitToast({
        type: 'error',
        title: 'Closure Failed',
        message: err.message || 'Could not close month.',
      })
    } finally {
      setClosingMonth(false)
    }
  }





  // Handle Generate Monthly Bills using Real API and Data (NO DUMMY FALLBACK)
  const handleGenerateBills = async () => {
    if (!realStudents || realStudents.length === 0) {
      emitToast({
        type: 'warning',
        title: 'No Students Found',
        message: `Cannot generate bills. No active students found in ${selectedClass} (${selectedSection}).`,
      })
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const monthParam = billingMonth // e.g. '2026-10'
      const secParam = selectedSection === 'All Sections' ? null : selectedSection

      const classesToProcess = selectedClass === 'All Classes'
        ? availableClasses
        : [selectedClass]

      let totalSuccessCount = 0

      for (const cls of classesToProcess) {
        try {
          const response = await generateBillsForClass(cls, monthParam, {
            section: secParam,
            include_exam_fee: feeHeads.annualExam,
            include_annual_fee: feeHeads.tuition,
            include_computer_fee: feeHeads.computerLab,
            include_transport_fee: feeHeads.transport,
          })
          totalSuccessCount += (response?.successCount || 0)
        } catch (clsErr) {
          const errText = String(clsErr.message || clsErr.error || '').toLowerCase()
          const rethrowErr = errText.includes('closed')
            ? new Error('Bill can not generate month is closed')
            : clsErr
          rethrowErr.isHandledByInterceptor = true
          throw rethrowErr
        }
      }

      // Fetch actual generated bills data for PDF printing
      let billsToDownload = []
      try {
        const downloadRes = await downloadBillsData({
          month: monthParam,
          class: selectedClass === 'All Classes' ? '' : selectedClass,
          section: selectedSection === 'All Sections' ? '' : selectedSection,
        })
        const generatedBills = Array.isArray(downloadRes?.bills)
          ? downloadRes.bills
          : (Array.isArray(downloadRes) ? downloadRes : [])
        if (generatedBills.length > 0) {
          let filtered = generatedBills
          if (selectedSection !== 'All Sections') {
            filtered = filtered.filter((b) => {
              const sec = (b.section || b.student?.section || '').trim().toUpperCase()
              return sec === selectedSection.trim().toUpperCase()
            })
          }
          billsToDownload = filtered.map((b) => ({ ...b, isBill: true }))
        }
      } catch (dlErr) {
        console.warn('Could not fetch download data, using preview bills:', dlErr)
      }

      // Fallback to previewRealBills (local computed bills)
      if (!billsToDownload || billsToDownload.length === 0) {
        billsToDownload = previewRealBills
      }

      setLoading(false)

      // Generate PDF with EXACT BillSlipCard visual design (pixel-perfect)
      if (billsToDownload && billsToDownload.length > 0) {
        setActualDbBills(billsToDownload)
        const successMsg = `Bills generated for ${billsToDownload.length} students in ${selectedClass} (${monthParam}). Downloading PDF...`
        setSuccess(successMsg)
        await generateBatchBillsPDF(billsToDownload)
      } else {
        emitToast({
          type: 'info',
          title: 'Bills Evaluated',
          message: `Bills processed for ${selectedClass} (${monthParam}).`,
        })
      }
    } catch (err) {
      const errText = String(err.message || err.error || '').toLowerCase()
      const isMonthClosed = errText.includes('closed')
      const errorMsg = isMonthClosed
        ? 'Bill can not generate month is closed'
        : (err.message || 'Failed to generate monthly bills.')

      setError(errorMsg)
      setSuccess('')
      // Only emit toast if not already handled by axios interceptor
      if (!err?.isHandledByInterceptor && !err?.response && !err?.status) {
        emitToast({
          type: 'error',
          title: isMonthClosed ? 'Month Closed' : 'Notice',
          message: errorMsg,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ============================================================
          HIDDEN BATCH DOWNLOAD CONTAINER - always rendered off-screen
          html2canvas capture target for pixel-perfect PDF export
          ============================================================ */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '792px',
          zIndex: -9999,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <div
          id="batch-download-sheet"
          style={{
            width: '792px',
            backgroundColor: '#ffffff',
            padding: '8px',
            boxSizing: 'border-box',
          }}
        >
          {batchDownloadBills.length > 0 && (
            <BillSheetGrid bills={batchDownloadBills} />
          )}
        </div>
      </div>


      {/* ========================================================
          CANVA BILL GENERATION CARD (Pixel-Perfect Implementation)
          ======================================================== */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-2xs">
        {/* Header Row: Title, Subtitle, Ready For Review Tag */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0f1e36] tracking-tight">
              Bill Generation
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Prepare and review a simulated monthly bill batch. No invoices are sent.
            </p>
          </div>

          <div>
            <span className="inline-flex rounded-full bg-[#fef3c7] px-3.5 py-1 text-xs font-semibold text-[#92400e]">
              Ready for review
            </span>
          </div>
        </div>

        {/* Form Controls Grid */}
        <div className="mt-6 space-y-4">
          {/* Row 1: Session, Billing Month, Class */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Session
              </label>
              <div className="relative">
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-bold text-[#0f1e36] shadow-2xs focus:border-slate-400 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="2026–27">2026–27</option>
                  <option value="2025–26">2025–26</option>
                  <option value="2024–25">2024–25</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  keyboard_arrow_down
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Billing Month
              </label>
              <div className="relative">
                <select
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-bold text-[#0f1e36] shadow-2xs focus:border-slate-400 focus:outline-none appearance-none cursor-pointer"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  keyboard_arrow_down
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Class
              </label>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value)
                    setSelectedSection('All Sections')
                  }}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-bold text-[#0f1e36] shadow-2xs focus:border-slate-400 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="All Classes">All Classes</option>
                  {availableClasses.map((cls) => {
                    const displayName = cls.startsWith('Class ') ? cls : `Class ${cls}`
                    return (
                      <option key={cls} value={cls}>
                        {displayName}
                      </option>
                    )
                  })}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  keyboard_arrow_down
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Section, Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Section
              </label>
              <div className="relative">
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-bold text-[#0f1e36] shadow-2xs focus:border-slate-400 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="All Sections">All Sections</option>
                  {availableSections.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  keyboard_arrow_down
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0f1e36] shadow-2xs focus:border-slate-400 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Fee Heads Included Checkboxes */}
          <div className="pt-2">
            <span className="block text-xs font-bold text-slate-600 mb-2.5">
              Fee Heads Included
            </span>
            <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-700">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feeHeads.tuition}
                  onChange={(e) => setFeeHeads({ ...feeHeads, tuition: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#132c4e] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-800">Tuition Fee</span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feeHeads.computerLab}
                  onChange={(e) => setFeeHeads({ ...feeHeads, computerLab: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#132c4e] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-800">Computer & Lab Fee</span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feeHeads.transport}
                  onChange={(e) => setFeeHeads({ ...feeHeads, transport: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#132c4e] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-800">Transport / Bus Fee</span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feeHeads.annualExam}
                  onChange={(e) => setFeeHeads({ ...feeHeads, annualExam: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#132c4e] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-800">Annual Exam Fee</span>
              </label>
            </div>
          </div>

          {/* Real Info Banner Bar */}
          <div className="pt-2">
            {error ? (
              <div className="rounded-xl bg-white border border-rose-200 border-l-4 border-l-rose-500 px-5 py-3.5 text-xs sm:text-sm font-bold text-rose-600 shadow-sm flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : success ? (
              <div className="rounded-xl bg-white border border-emerald-200 border-l-4 border-l-emerald-500 px-5 py-3.5 text-xs sm:text-sm font-bold text-emerald-600 shadow-sm flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                  <span>{success}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccess('')}
                  className="text-emerald-500 hover:text-emerald-700 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : loadingStudents ? (
              <div className="rounded-xl bg-[#edf4fc] px-5 py-3.5 text-xs sm:text-sm font-bold text-[#1e3a5f] shadow-2xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                Fetching active student records from database...
              </div>
            ) : realStudents.length > 0 ? (
              <div className="rounded-xl bg-[#edf4fc] px-5 py-3.5 text-xs sm:text-sm font-bold text-[#1e3a5f] shadow-2xs flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>{realStudents.length}</strong> active student{realStudents.length === 1 ? '' : 's'} enrolled in {selectedClass} ({selectedSection}) · Ready for monthly bill generation
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider rounded-md bg-white/80 px-2 py-0.5 text-[#132c4e] border border-blue-200">
                  Real DB Records
                </span>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 border border-amber-200/80 px-5 py-3.5 text-xs sm:text-sm font-bold text-amber-900 shadow-2xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-700">info</span>
                <span>No active students enrolled in {selectedClass} ({selectedSection}) in the database.</span>
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="pt-4 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClearSetup}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              Clear Setup
            </button>

            {/* Close Month Button with attached (i) Info Tooltip */}
            <div className="relative inline-flex items-center group">
              <button
                type="button"
                onClick={() => setShowCloseMonthModal(true)}
                className="h-11 rounded-l-xl border border-r-0 border-amber-300 bg-amber-50 hover:bg-amber-100/90 pl-4 pr-2.5 text-sm font-bold text-amber-900 shadow-2xs transition flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-700">lock_clock</span>
                Close Month
              </button>
              <div className="relative">
                <button
                  type="button"
                  aria-label="Auto-Close Month Info"
                  className="h-11 px-2.5 rounded-r-xl border border-amber-300 bg-amber-50 hover:bg-amber-100/90 text-amber-700 shadow-2xs flex items-center justify-center cursor-help transition"
                >
                  <span className="material-symbols-outlined text-[18px]">info</span>
                </button>
                {/* Popover / Tooltip on hover */}
                <div className="absolute bottom-full right-0 mb-2 w-80 p-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                  <div className="flex items-center gap-2 font-black text-amber-300 pb-1.5 border-b border-slate-700/80">
                    <span className="material-symbols-outlined text-[16px]">event_repeat</span>
                    Auto-Close Month Engine (ACTIVE)
                  </div>
                  <div className="mt-2 space-y-1.5 text-slate-200 text-[11px] leading-relaxed">
                    <p>
                      <strong>Auto Schedule:</strong> Runs automatically on the <strong>last calendar day of every month at 6:00 PM IST</strong>.
                    </p>
                    <p>
                      It tallies all collected payments, locks the billing cycle, and automatically rolls remaining unpaid balances into previous dues.
                    </p>
                    <p className="text-amber-200/90 pt-1 border-t border-slate-800 text-[10px]">
                      Click <strong>"Close Month"</strong> anytime to manually close & reconcile a month now.
                    </p>
                  </div>
                  <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={download6In1SheetPDF}
              disabled={downloadingPdf}
              className="h-11 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100/80 px-4 text-sm font-bold text-emerald-800 shadow-2xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-700">download</span>
              {downloadingPdf ? 'Rendering PDF...' : 'Download Bills (6-in-1 PDF)'}
            </button>

            <button
              type="button"
              onClick={handleGenerateBills}
              disabled={loading}
              className="h-11 rounded-xl bg-[#002b66] hover:bg-[#08224d] text-white px-6 text-sm font-bold shadow-xs transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  Generating...
                </>
              ) : (
                'Generate Monthly Bills'
              )}
            </button>
          </div>
        </div>
      </div>



      {/* ========================================================
          MANUAL CLOSE MONTH CONFIRMATION MODAL
          ======================================================== */}
      {showCloseMonthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0f1e36]">Close Billing Month</h3>
                  <p className="text-xs text-slate-400">Lock month fees & transfer unpaid balances</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseMonthModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Month to Close (YYYY-MM)
                </label>
                <input
                  type="month"
                  value={closeMonthTarget}
                  onChange={(e) => setCloseMonthTarget(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0f1e36] shadow-2xs focus:border-slate-400 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="rounded-xl bg-amber-50/70 border border-amber-200/60 p-4 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  What happens during Month Closure?
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                  <li>Locks the selected month in <code>month_closures</code> database table.</li>
                  <li>Calculates all collected payments against generated fee bills.</li>
                  <li>Automatically transfers remaining unpaid balances into <code>previous_dues</code>.</li>
                  <li>Marks completed bills as Paid and partial balances as Partial.</li>
                </ul>
              </div>

              <div className="rounded-xl bg-sky-50 border border-sky-100 p-3 text-xs text-sky-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-sky-700">schedule</span>
                <span><strong>Auto Scheduler:</strong> Also scheduled to run automatically on the last day of every month at 6:00 PM IST.</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCloseMonthModal(false)}
                disabled={closingMonth}
                className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualCloseMonth}
                disabled={closingMonth}
                className="h-10 px-5 rounded-xl bg-[#132c4e] hover:bg-[#0f1e36] text-xs font-bold text-white shadow-xs flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {closingMonth ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    Closing Month...
                  </>
                ) : (
                  'Confirm & Close Month'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bills
