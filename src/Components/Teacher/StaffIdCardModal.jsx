import React, { useState, useRef } from 'react'
import StaffIdCard from './StaffIdCard'
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import { emitToast } from '../../Api/auth'

const createJsPdf = (options) => {
  const Constructor =
    typeof jsPDF === 'function'
      ? jsPDF
      : jsPDF?.jsPDF || (typeof window !== 'undefined' && window.jspdf?.jsPDF)
  if (!Constructor) {
    throw new Error('PDF library (jsPDF) is not initialized')
  }
  return new Constructor(options)
}

export default function StaffIdCardModal({
  isOpen = false,
  onClose,
  teacher,
  onEdit = null,
}) {
  if (!isOpen || !teacher) return null

  const getInitialIssueDate = (t) => {
    const candidate = t?.joiningDate || t?.joining_date || t?.issueDate || t?.issue_date
    if (candidate && candidate !== '-' && candidate.trim() !== '') {
      try {
        if (candidate.includes('-')) {
          const parts = candidate.split('T')[0].split('-')
          if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`
          }
        }
      } catch (_) {}
      return candidate
    }
    const d = new Date()
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const [activeSide, setActiveSide] = useState('both') // 'front' | 'back' | 'both'
  const [zoomLevel, setZoomLevel] = useState(100)
  const [issueDate, setIssueDate] = useState(() => getInitialIssueDate(teacher))
  const [validTill, setValidTill] = useState('31/03/2027')
  const [downloadingPng, setDownloadingPng] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const frontRef = useRef(null)
  const backRef = useRef(null)

  const isTeaching = teacher?.staffType !== 'non_teaching'
  const fullName = teacher?.fullName || teacher?.name || 'Staff Member'
  const employeeId = teacher?.employeeId || teacher?.employee_id || 'TCH-101'
  const designation = teacher?.designation || (isTeaching ? 'Faculty Member' : 'Support Staff')
  const department = teacher?.department || (isTeaching ? 'Academics' : 'Administration')

  // Print Single Card
  const handlePrint = () => {
    window.focus()
    setTimeout(() => {
      window.print()
    }, 150)
  }

  // Download Single Side PNG
  const handleDownloadPng = async (side = 'front') => {
    setDownloadingPng(true)
    emitToast('info', `Generating high-resolution ${side.toUpperCase()} PNG...`, 'Please wait')

    try {
      const targetId = side === 'front' ? `modal-card-front-${employeeId}` : `modal-card-back-${employeeId}`
      const originalCard = document.getElementById(targetId)

      if (!originalCard) {
        emitToast('error', `Card ${side} side element not found in DOM`, 'Error')
        return
      }

      // Render clone in offscreen container for sharp capture without zoom distortions
      const offscreenHost = document.createElement('div')
      offscreenHost.style.position = 'fixed'
      offscreenHost.style.left = '-9999px'
      offscreenHost.style.top = '-9999px'
      offscreenHost.style.width = '350px'
      offscreenHost.style.height = '541px'
      offscreenHost.style.overflow = 'hidden'
      offscreenHost.style.background = '#ffffff'

      const clone = originalCard.cloneNode(true)
      clone.style.transform = 'none'
      clone.style.margin = '0'

      // Synchronize image sources
      const origImgs = originalCard.querySelectorAll('img')
      const cloneImgs = clone.querySelectorAll('img')
      origImgs.forEach((orig, idx) => {
        if (cloneImgs[idx]) {
          cloneImgs[idx].src = orig.src
        }
      })

      offscreenHost.appendChild(clone)
      document.body.appendChild(offscreenHost)

      try {
        const canvas = await html2canvas(clone, {
          scale: 3, // Ultra-sharp 300 DPI equivalent
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 350,
          height: 541,
        })

        const filename = `Staff_ID_${fullName.replace(/\s+/g, '_')}_${employeeId}_${side.toUpperCase()}.png`

        canvas.toBlob((blob) => {
          const url = blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = filename
          link.href = url
          document.body.appendChild(link)
          link.click()
          setTimeout(() => {
            if (document.body.contains(link)) document.body.removeChild(link)
            if (blob) URL.revokeObjectURL(url)
          }, 1000)
        }, 'image/png')

        emitToast('success', `Saved ${side.toUpperCase()} ID card for ${fullName}!`, 'Download Complete')
      } finally {
        if (document.body.contains(offscreenHost)) {
          document.body.removeChild(offscreenHost)
        }
      }
    } catch (err) {
      console.error('Failed to download card PNG:', err)
      emitToast('error', `Download failed: ${err?.message || 'Error creating image'}`, 'Error')
    } finally {
      setDownloadingPng(false)
    }
  }

  // Download CR80 Single Card PDF (Front + Back Pages)
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    emitToast('info', 'Rendering official CR80 ID Card PDF...', 'Please wait')

    try {
      const frontEl = document.getElementById(`modal-card-front-${employeeId}`)
      const backEl = document.getElementById(`modal-card-back-${employeeId}`)

      if (!frontEl && !backEl) {
        emitToast('error', 'Card elements not found to render PDF', 'Error')
        return
      }

      // CR80 Standard dimensions: 54mm x 85.6mm (Vertical)
      const pdf = createJsPdf({
        orientation: 'portrait',
        unit: 'mm',
        format: [54, 85.6],
        compress: true,
      })

      const renderCardToPdf = async (cardEl, isFirstPage = true) => {
        const offscreenHost = document.createElement('div')
        offscreenHost.style.position = 'fixed'
        offscreenHost.style.left = '-9999px'
        offscreenHost.style.top = '-9999px'
        offscreenHost.style.width = '350px'
        offscreenHost.style.height = '541px'
        offscreenHost.style.overflow = 'hidden'
        offscreenHost.style.background = '#ffffff'

        const clone = cardEl.cloneNode(true)
        clone.style.transform = 'none'
        clone.style.margin = '0'

        const origImgs = cardEl.querySelectorAll('img')
        const cloneImgs = clone.querySelectorAll('img')
        origImgs.forEach((orig, idx) => {
          if (cloneImgs[idx]) cloneImgs[idx].src = orig.src
        })

        offscreenHost.appendChild(clone)
        document.body.appendChild(offscreenHost)

        try {
          const canvas = await html2canvas(clone, {
            scale: 3,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: 350,
            height: 541,
          })

          const imgData = canvas.toDataURL('image/jpeg', 0.98)
          if (!isFirstPage) {
            pdf.addPage([54, 85.6], 'portrait')
          }
          pdf.addImage(imgData, 'JPEG', 0, 0, 54, 85.6, undefined, 'FAST')
        } finally {
          if (document.body.contains(offscreenHost)) {
            document.body.removeChild(offscreenHost)
          }
        }
      }

      if (frontEl) {
        await renderCardToPdf(frontEl, true)
      }
      if (backEl) {
        await renderCardToPdf(backEl, !frontEl)
      }

      const filename = `Staff_ID_Card_${fullName.replace(/\s+/g, '_')}_${employeeId}.pdf`
      try {
        pdf.save(filename)
      } catch (_) {
        const blob = pdf.output('blob')
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a)
          URL.revokeObjectURL(blobUrl)
        }, 1000)
      }

      emitToast('success', `Saved ${filename} successfully!`, 'PDF Downloaded')
    } catch (err) {
      console.error('Failed to generate Single Card PDF:', err)
      emitToast('error', `PDF download failed: ${err?.message}`, 'Error')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative z-10 w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Style Tag for Crisp Card Printing */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            .staff-print-container, .staff-print-container * {
              visibility: visible !important;
            }
            .staff-print-container {
              position: absolute !important;
              left: 50% !important;
              top: 20mm !important;
              transform: translateX(-50%) !important;
              display: flex !important;
              flex-direction: row !important;
              gap: 10mm !important;
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .sps-print-no-show {
              display: none !important;
            }
          }
        `}</style>

        {/* Modal Top Header */}
        <div className="bg-[#071d3f] text-white px-5 py-4 flex items-center justify-between shrink-0 sps-print-no-show border-b border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-xl text-slate-950">badge</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                  {fullName}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-200 border border-blue-700/60 font-bold">
                  {employeeId}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isTeaching
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isTeaching ? 'Teaching Faculty' : 'Non-Teaching Staff'}
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Official Star Public School Institutional Identity Badge (CR80 PVC Specification)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Close Modal"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Modal Control Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 sps-print-no-show">
          {/* Side Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setActiveSide('both')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeSide === 'both'
                  ? 'bg-[#071d3f] text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Both Sides (Duplex)
            </button>
            <button
              onClick={() => setActiveSide('front')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeSide === 'front'
                  ? 'bg-[#071d3f] text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Front Only
            </button>
            <button
              onClick={() => setActiveSide('back')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeSide === 'back'
                  ? 'bg-[#071d3f] text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Back Only
            </button>
          </div>

          {/* Settings & Zoom Controls */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Issue Date:</span>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Valid Till:</span>
              <input
                type="text"
                value={validTill}
                onChange={(e) => setValidTill(e.target.value)}
                className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Zoom Selector */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-bold"
                title="Zoom Out"
              >
                -
              </button>
              <span className="px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(130, z + 15))}
                className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-bold"
                title="Zoom In"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Modal Main Content: Live Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex flex-col items-center justify-center min-h-[460px]">
          <div
            className="staff-print-container flex flex-wrap items-center justify-center gap-8 transition-transform duration-200"
            style={{
              transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
              transformOrigin: 'top center',
            }}
          >
            {/* FRONT SIDE */}
            {(activeSide === 'front' || activeSide === 'both') && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 sps-print-no-show bg-white px-2.5 py-0.5 rounded-full shadow-2xs border border-slate-200">
                  Front Side (CR80)
                </span>
                <div ref={frontRef} className="shadow-2xl rounded-[18px]">
                  <StaffIdCard
                    id={`modal-card-front-${employeeId}`}
                    teacher={teacher}
                    isBack={false}
                    issueDate={issueDate}
                    validTill={validTill}
                  />
                </div>
                <div className="flex items-center gap-2 mt-1 sps-print-no-show">
                  <button
                    onClick={() => handleDownloadPng('front')}
                    disabled={downloadingPng}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold shadow-2xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-indigo-600">download</span>
                    <span>Download PNG</span>
                  </button>
                </div>
              </div>
            )}

            {/* BACK SIDE */}
            {(activeSide === 'back' || activeSide === 'both') && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 sps-print-no-show bg-white px-2.5 py-0.5 rounded-full shadow-2xs border border-slate-200">
                  Back Side (CR80)
                </span>
                <div ref={backRef} className="shadow-2xl rounded-[18px]">
                  <StaffIdCard
                    id={`modal-card-back-${employeeId}`}
                    teacher={teacher}
                    isBack={true}
                    issueDate={issueDate}
                    validTill={validTill}
                  />
                </div>
                <div className="flex items-center gap-2 mt-1 sps-print-no-show">
                  <button
                    onClick={() => handleDownloadPng('back')}
                    disabled={downloadingPng}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold shadow-2xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-indigo-600">download</span>
                    <span>Download PNG</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="bg-white border-t border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 sps-print-no-show">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
            <span className="font-medium">
              Dimensions: 54mm × 85.6mm (CR80 PVC) | Direct Scanner Verification QR Active
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {onEdit && (
              <button
                onClick={() => {
                  onClose()
                  onEdit(teacher)
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-sm text-slate-500">edit</span>
                <span>Edit Details</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs"
              title="Print directly"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Print Card</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 px-4 py-2 text-xs font-bold text-white transition-all shadow-md active:scale-[0.98] disabled:opacity-60"
              title="Download official CR80 PDF"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

