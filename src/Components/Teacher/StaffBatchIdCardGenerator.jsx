import React, { useState, useMemo, useEffect } from 'react'
import StaffIdCard from './StaffIdCard'
import StaffIdCardModal from './StaffIdCardModal'
import { getTeachers, emitToast } from '../../Api/auth'
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'

// Safe constructor helper for jsPDF
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

export default function StaffBatchIdCardGenerator({
  isOpen = true,
  onClose = null,
  teachers = [],
  isPage = false,
}) {
  if (!isOpen && !isPage) return null

  // Fetch real teachers if not provided by parent
  const [autoTeachers, setAutoTeachers] = useState([])
  const [loadingTeachers, setLoadingTeachers] = useState(false)

  useEffect(() => {
    if (teachers && teachers.length > 0) return
    let isMounted = true
    setLoadingTeachers(true)
    getTeachers()
      .then((res) => {
        const list = Array.isArray(res?.teachers)
          ? res.teachers
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : []
        if (isMounted && list.length > 0) {
          // Normalize if needed
          const normalized = list.map((t) => {
            const profile = t?.profile || {}
            let meta = {}
            try {
              const rawContact = profile?.emergency_contact || t?.emergency_contact || ''
              if (rawContact && rawContact.startsWith('{')) meta = JSON.parse(rawContact)
            } catch (_) {}

            return {
              id: t?.id || t?._id || t?.user_id || '',
              fullName: t?.fullName || profile?.full_name || t?.name || 'Staff Member',
              employeeId: t?.employeeId || profile?.employee_id || `TCH-${String(t?.id || '101').slice(-3)}`,
              mobile: t?.mobile || profile?.mobile || '-',
              status: t?.status === 'inactive' ? 'on_leave' : 'present',
              staffType: t?.staffType || profile?.staff_type || meta.staff_type || 'teaching',
              department: t?.department || profile?.department || (meta.staff_type === 'non_teaching' ? 'Administration' : 'Academics'),
              designation: t?.designation || profile?.designation || (meta.staff_type === 'non_teaching' ? 'Support Staff' : 'Faculty Member'),
              subject: t?.subject || profile?.subject || meta.subject || '',
              roleTitle: t?.roleTitle || profile?.role_title || meta.role_title || '',
              dateOfBirth: t?.dateOfBirth || profile?.date_of_birth || t?.dob || '-',
              fatherName: t?.fatherName || profile?.father_name || meta.father_name || '-',
              address: t?.address || profile?.address || 'Bettiah, West Champaran, Bihar',
              photoUrl: t?.photoUrl || profile?.photo_url || '',
              aadharNumber: t?.aadharNumber || profile?.aadhar_number || meta.aadhar_number || '',
            }
          })
          setAutoTeachers(normalized)
        }
      })
      .catch((err) => {
        console.warn('Could not auto-fetch teachers:', err)
      })
      .finally(() => {
        if (isMounted) setLoadingTeachers(false)
      })
    return () => {
      isMounted = false
    }
  }, [teachers])

  const effectiveTeachers = useMemo(() => {
    if (teachers && teachers.length > 0) return teachers
    if (autoTeachers && autoTeachers.length > 0) return autoTeachers
    return []
  }, [teachers, autoTeachers])

  const getTodayFormatted = () => {
    const d = new Date()
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Filters & State
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all' | 'teaching' | 'non_teaching'
  const [searchTerm, setSearchTerm] = useState('')
  const [cardSide, setCardSide] = useState('front') // 'front' | 'back' | 'both'
  const [issueDate, setIssueDate] = useState(getTodayFormatted)
  const [validTill, setValidTill] = useState('31/03/2027')
  const [viewMode, setViewMode] = useState('sheet') // 'sheet' (A4 sheets) | 'grid' (Individual cards)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [inspectingTeacher, setInspectingTeacher] = useState(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingPng, setDownloadingPng] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return effectiveTeachers.filter((t) => {
      // Category filter
      if (categoryFilter === 'teaching' && t.staffType === 'non_teaching') return false
      if (categoryFilter === 'non_teaching' && t.staffType !== 'non_teaching') return false

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchName = (t.fullName || '').toLowerCase().includes(q)
        const matchEmpId = (t.employeeId || '').toLowerCase().includes(q)
        const matchDept = (t.department || '').toLowerCase().includes(q)
        const matchDesig = (t.designation || '').toLowerCase().includes(q)
        const matchSubj = (t.subject || t.roleTitle || '').toLowerCase().includes(q)
        const matchPhone = (t.mobile || '').includes(q)
        if (!matchName && !matchEmpId && !matchDept && !matchDesig && !matchSubj && !matchPhone) {
          return false
        }
      }

      return true
    })
  }, [effectiveTeachers, categoryFilter, searchTerm])

  // Select all by default when filtered changes
  useEffect(() => {
    setSelectedIds(new Set(filteredTeachers.map((t) => t.id || t.employeeId)))
  }, [filteredTeachers])

  const selectedTeachersList = useMemo(() => {
    return filteredTeachers.filter((t) => selectedIds.has(t.id || t.employeeId))
  }, [filteredTeachers, selectedIds])

  // Toggle selection
  const handleToggleSelect = (teacherId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(teacherId)) {
        next.delete(teacherId)
      } else {
        next.add(teacherId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredTeachers.map((t) => t.id || t.employeeId)))
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }

  // Chunk selected teachers into A4 Pages (9 cards per sheet: 3 columns x 3 rows)
  const CARDS_PER_PAGE = 9
  const a4Pages = useMemo(() => {
    const pages = []
    for (let i = 0; i < selectedTeachersList.length; i += CARDS_PER_PAGE) {
      pages.push(selectedTeachersList.slice(i, i + CARDS_PER_PAGE))
    }
    return pages
  }, [selectedTeachersList])

  // Print All A4 Sheets
  const handlePrintAll = () => {
    window.focus()
    setTimeout(() => {
      window.print()
    }, 150)
  }

  // Download Multi-page A4 PDF
  const handleDownloadPDF = async () => {
    if (selectedTeachersList.length === 0) {
      emitToast('error', 'Please select at least one staff member to generate PDF', 'No Cards Selected')
      return
    }

    setDownloadingPdf(true)
    emitToast('info', `Rendering official A4 PDF (${a4Pages.length} Sheet${a4Pages.length > 1 ? 's' : ''})...`, 'Please wait')

    // Reset zoom
    const zoomContainers = document.querySelectorAll('.staff-sheet-zoom-container')
    zoomContainers.forEach((el) => {
      el.style.transform = 'none'
    })

    try {
      const sheetElements = document.querySelectorAll('.staff-a4-sheet')
      if (!sheetElements || sheetElements.length === 0) {
        emitToast('error', 'No sheets found in DOM to render PDF', 'Error')
        return
      }

      const pdf = createJsPdf({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      })

      for (let i = 0; i < sheetElements.length; i++) {
        const sheetEl = sheetElements[i]
        const canvas = await html2canvas(sheetEl, {
          scale: 2.0,
          useCORS: true,
          allowTaint: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          backgroundColor: '#ffffff',
          ignoreElements: (el) => el.classList && el.classList.contains('sps-print-no-show'),
        })

        const imgData = canvas.toDataURL('image/jpeg', 0.95)
        if (i > 0) pdf.addPage('a4', 'portrait')
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
      }

      const filename = `Star_Public_School_Staff_ID_Cards_${categoryFilter}_${Date.now()}.pdf`
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
      console.error('Failed to generate PDF:', err)
      emitToast('error', `PDF download failed: ${err?.message || 'Error creating PDF'}`, 'Error')
    } finally {
      // Restore on-screen zoom
      zoomContainers.forEach((el) => {
        el.style.transform = zoomLevel === 100 ? 'none' : `scale(${zoomLevel / 100})`
      })
      setDownloadingPdf(false)
    }
  }

  // Download High-Resolution Sheet 1 as PNG
  const handleDownloadSheetPNG = async () => {
    if (a4Pages.length === 0) return
    setDownloadingPng(true)
    emitToast('info', 'Rendering High-Resolution PNG Sheet...', 'Please wait')

    const zoomContainers = document.querySelectorAll('.staff-sheet-zoom-container')
    zoomContainers.forEach((el) => {
      el.style.transform = 'none'
    })

    try {
      const firstSheet = document.querySelector('.staff-a4-sheet')
      if (!firstSheet) {
        emitToast('error', 'Sheet element not found', 'Error')
        return
      }

      const canvas = await html2canvas(firstSheet, {
        scale: 2.2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: '#ffffff',
        ignoreElements: (el) => el.classList && el.classList.contains('sps-print-no-show'),
      })

      const filename = `Staff_ID_Sheet_${Date.now()}.png`
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

      emitToast('success', 'High-Resolution Sheet PNG downloaded!', 'Download Complete')
    } catch (err) {
      console.error('PNG sheet download failed:', err)
      emitToast('error', 'PNG sheet render failed', 'Error')
    } finally {
      zoomContainers.forEach((el) => {
        el.style.transform = zoomLevel === 100 ? 'none' : `scale(${zoomLevel / 100})`
      })
      setDownloadingPng(false)
    }
  }

  const containerClass = isPage
    ? 'w-full flex flex-col space-y-4'
    : 'fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs'

  const shellClass = isPage
    ? 'relative z-10 flex min-h-[calc(100vh-140px)] w-full flex-col overflow-hidden rounded-2xl bg-[#f8fafc] shadow-xs border border-slate-200'
    : 'relative z-[9999] flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-[#f8fafc] shadow-2xl border border-slate-200'

  return (
    <div className={containerClass} onClick={onClose && !isPage ? onClose : undefined}>
      {/* Styles for Perfect Screen Preview & A4 Print */}
      <style>{`
        /* --- SCREEN RULES --- */
        .staff-a4-sheet {
          width: 210mm;
          min-height: 297mm;
          height: 297mm;
          padding: 16mm 17.5mm;
          box-sizing: border-box;
          background: #ffffff;
          margin: 0 auto;
          box-shadow: 0 12px 30px -6px rgba(15, 23, 42, 0.16), 0 4px 12px -2px rgba(15, 23, 42, 0.08);
          border: 1px solid #cbd5e1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .staff-a4-grid-9 {
          display: grid;
          grid-template-columns: repeat(3, 55mm);
          grid-template-rows: repeat(3, 85mm);
          column-gap: 5mm;
          row-gap: 4mm;
          justify-content: center;
          align-content: center;
          width: 175mm;
          height: 263mm;
          margin: 0 auto;
        }

        /* Exact 55mm x 85mm Card Cell with Dotted Scissor Guide Lines */
        .staff-id-card-cell {
          width: 55mm;
          height: 85mm;
          max-width: 55mm;
          max-height: 85mm;
          overflow: hidden;
          box-sizing: border-box;
          border: 0.5px dashed #94a3b8;
          border-radius: 4px;
          background: #ffffff;
          position: relative;
        }

        /* Vector Scaling: 350px x 541px scaled by 0.593926 fits exact 55mm x 85mm */
        .staff-card-scaler {
          width: 350px;
          height: 541px;
          transform: scale(0.593926);
          transform-origin: top left;
        }

        /* --- PRINT RULES: EXACT 1-TO-1 MATCH --- */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            width: 210mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }

          nav, header, aside, footer, .sps-print-no-show {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #root,
          .fixed,
          div[class*="fixed"],
          div[class*="overflow-"],
          div[class*="max-h-"] {
            position: static !important;
            inset: auto !important;
            max-height: none !important;
            max-width: none !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .staff-sheet-zoom-container {
            transform: none !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .staff-a4-sheet {
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 16mm 17.5mm !important;
          }

          .staff-id-card-cell {
            border: 0.5px dashed #cbd5e1 !important;
          }
        }
      `}</style>

      <div className={shellClass} onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="bg-[#071d3f] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 sps-print-no-show border-b border-blue-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-xl text-slate-950">badge</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight">
                  Faculty & Staff ID Card Studio
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  CR80 PVC Specification
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Generate, batch print, and export high-resolution PVC identity cards for teaching and non-teaching personnel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClose && !isPage && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Close Studio"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-white border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 sps-print-no-show">
          {/* Left: Category Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Tabs */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Staff ({effectiveTeachers.length})
              </button>
              <button
                onClick={() => setCategoryFilter('teaching')}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  categoryFilter === 'teaching'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Teaching Faculty ({effectiveTeachers.filter((t) => t.staffType !== 'non_teaching').length})
              </button>
              <button
                onClick={() => setCategoryFilter('non_teaching')}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  categoryFilter === 'non_teaching'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Non-Teaching ({effectiveTeachers.filter((t) => t.staffType === 'non_teaching').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-sm text-slate-400">
                search
              </span>
              <input
                type="text"
                placeholder="Search name, ID, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-44 sm:w-56 rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Right: View & Side Options */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Front / Back Side Selector */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setCardSide('front')}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  cardSide === 'front'
                    ? 'bg-[#071d3f] text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Front Side
              </button>
              <button
                onClick={() => setCardSide('back')}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  cardSide === 'back'
                    ? 'bg-[#071d3f] text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Back Side
              </button>
            </div>

            {/* View Mode Toggle: A4 Sheets vs Individual Grid */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setViewMode('sheet')}
                className={`rounded-lg px-2.5 py-1.5 transition-all flex items-center gap-1 ${
                  viewMode === 'sheet'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="A4 Printable Sheet Layout"
              >
                <span className="material-symbols-outlined text-sm">description</span>
                <span>A4 Sheets</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg px-2.5 py-1.5 transition-all flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Individual Cards Grid"
              >
                <span className="material-symbols-outlined text-sm">grid_view</span>
                <span>Cards Grid</span>
              </button>
            </div>

            {/* Zoom Selector (Only in sheet mode) */}
            {viewMode === 'sheet' && (
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(60, z - 15))}
                  className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-bold"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="px-1.5 py-0.5 text-[11px] font-mono font-bold text-slate-700">
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
            )}
          </div>
        </div>

        {/* Selection Sub-Bar & Output Action Buttons */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 sps-print-no-show">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-extrabold text-slate-800">
              Selected: <span className="text-[#071d3f] font-black">{selectedTeachersList.length}</span> / {filteredTeachers.length}
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs font-bold text-indigo-700 hover:underline"
            >
              Select All
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={handleDeselectAll}
              className="text-xs font-bold text-slate-600 hover:underline"
            >
              Deselect All
            </button>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Issue Date:</span>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-800 shadow-2xs focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'sheet' && (
              <button
                onClick={handleDownloadSheetPNG}
                disabled={downloadingPng || selectedTeachersList.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
                title="Download Page 1 as high-res PNG"
              >
                <span className="material-symbols-outlined text-sm text-indigo-600">image</span>
                <span>Download PNG Sheet</span>
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf || selectedTeachersList.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm transition-all disabled:opacity-50 active:scale-[0.98]"
              title="Download all selected cards as multi-page A4 PDF"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              <span>{downloadingPdf ? 'Rendering PDF...' : `Download PDF (${a4Pages.length} pgs)`}</span>
            </button>

            <button
              onClick={handlePrintAll}
              disabled={selectedTeachersList.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#071d3f] hover:bg-[#122e58] text-white px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition-all disabled:opacity-50 active:scale-[0.98]"
              title="Print all cards on standard A4 paper"
            >
              <span className="material-symbols-outlined text-sm text-amber-300">print</span>
              <span>Print A4 Sheets</span>
            </button>
          </div>
        </div>

        {/* Studio Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60 min-h-[460px]">
          {loadingTeachers ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <span className="material-symbols-outlined text-4xl animate-spin text-blue-600 mb-2">
                progress_activity
              </span>
              <p className="font-bold text-sm">Loading Staff & Faculty records...</p>
            </div>
          ) : selectedTeachersList.length === 0 && filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200 text-center p-8">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">badge</span>
              <p className="font-bold text-slate-800 text-base">No staff members found matching criteria</p>
              <p className="text-xs text-slate-400 mt-1">Adjust search or filter options to view staff ID cards.</p>
            </div>
          ) : viewMode === 'sheet' ? (
            /* ====================================================
               A4 SHEET LAYOUT (9 Cards Per Page, Exact 55mm x 85mm)
               ==================================================== */
            <div className="flex flex-col items-center gap-8 pb-12">
              {a4Pages.map((pageCards, pageIdx) => (
                <div key={pageIdx} className="flex flex-col items-center gap-2">
                  <div className="text-[11px] font-bold text-slate-500 sps-print-no-show flex items-center justify-between w-full max-w-[210mm] px-1">
                    <span>
                      Sheet {pageIdx + 1} of {a4Pages.length} ({pageCards.length} cards)
                    </span>
                    <span className="text-slate-400">Standard A4 Portrait (210mm × 297mm)</span>
                  </div>

                  <div
                    className="staff-sheet-zoom-container transition-transform duration-150 origin-top"
                    style={{
                      transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : 'none',
                    }}
                  >
                    <div className="staff-a4-sheet">
                      <div className="staff-a4-grid-9">
                        {pageCards.map((teacher) => (
                          <div
                            key={teacher.id || teacher.employeeId}
                            className="staff-id-card-cell group relative cursor-pointer"
                            onClick={() => setInspectingTeacher(teacher)}
                            title="Click to inspect & print individually"
                          >
                            <div className="staff-card-scaler pointer-events-none">
                              <StaffIdCard
                                teacher={teacher}
                                isBack={cardSide === 'back'}
                                issueDate={issueDate}
                                validTill={validTill}
                              />
                            </div>

                            {/* Hover overlay with inspect icon */}
                            <div className="absolute inset-0 bg-[#071d3f]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center sps-print-no-show">
                              <span className="px-2 py-1 bg-white/95 text-[#071d3f] text-[9px] font-bold rounded shadow-md flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">visibility</span>
                                Inspect
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ====================================================
               INDIVIDUAL CARDS GRID VIEW
               ==================================================== */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
              {filteredTeachers.map((teacher) => {
                const isSelected = selectedIds.has(teacher.id || teacher.employeeId)
                return (
                  <div
                    key={teacher.id || teacher.employeeId}
                    className={`rounded-2xl border bg-white p-3.5 shadow-2xs transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-400 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 opacity-60'
                    }`}
                  >
                    <div>
                      {/* Checkbox and header row */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(teacher.id || teacher.employeeId)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                            {teacher.fullName}
                          </span>
                        </label>
                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          {teacher.employeeId}
                        </span>
                      </div>

                      {/* Mini Preview Thumbnail */}
                      <div className="py-2.5 flex justify-center">
                        <div
                          className="w-[175px] h-[270px] overflow-hidden rounded-xl border border-slate-300 shadow-sm cursor-pointer hover:shadow-md transition-shadow relative group"
                          onClick={() => setInspectingTeacher(teacher)}
                        >
                          <div className="scale-[0.5] origin-top-left pointer-events-none">
                            <StaffIdCard
                              teacher={teacher}
                              isBack={cardSide === 'back'}
                              issueDate={issueDate}
                              validTill={validTill}
                            />
                          </div>
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-2 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-md">
                              Inspect Full
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                        <p className="truncate">
                          <strong className="text-slate-800">Role:</strong> {teacher.designation}
                        </p>
                        <p className="truncate">
                          <strong className="text-slate-800">Dept:</strong> {teacher.department}
                        </p>
                        <p className="truncate">
                          <strong className="text-slate-800">Phone:</strong> {teacher.mobile}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-2 flex items-center gap-2">
                      <button
                        onClick={() => setInspectingTeacher(teacher)}
                        className="flex-1 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">badge</span>
                        <span>View Card</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Inspect Single Card Modal */}
      {inspectingTeacher && (
        <StaffIdCardModal
          isOpen={true}
          onClose={() => setInspectingTeacher(null)}
          teacher={inspectingTeacher}
        />
      )}
    </div>
  )
}

