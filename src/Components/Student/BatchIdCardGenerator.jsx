import React, { useState, useMemo, useEffect } from 'react'
import StudentIdCard from './StudentIdCard'
import { CLASS_OPTIONS, normalizeSchoolClass } from '../../constants/schoolOptions'
import { emitToast } from '../../Api/auth'
import { getAllStudents } from '../../Api/students'
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import { useDocumentTemplates } from '../../context/DocumentTemplateContext'
import { DOCUMENT_TEMPLATES } from '../../constants/documentTemplateRegistry'

// Safe constructor helper for jsPDF across Vite / ESM environments
const createJsPdf = (options) => {
  const Constructor = typeof jsPDF === 'function'
    ? jsPDF
    : (jsPDF?.jsPDF || (typeof window !== 'undefined' && window.jspdf?.jsPDF))
  if (!Constructor) {
    throw new Error('PDF library (jsPDF) is not initialized')
  }
  return new Constructor(options)
}

function BatchIdCardGenerator({
  isOpen = true,
  onClose = null,
  students = [],
  initialClass = '',
  isPage = false,
}) {
  if (!isOpen && !isPage) return null

  // Self-fetch real students if parent didn't provide any or while loading
  const [autoStudents, setAutoStudents] = useState([])
  const [loadingRealStudents, setLoadingRealStudents] = useState(false)

  useEffect(() => {
    if (students && students.length > 0) return
    let isMounted = true
    setLoadingRealStudents(true)
    getAllStudents()
      .then((res) => {
        const list = Array.isArray(res?.students)
          ? res.students
          : Array.isArray(res)
          ? res
          : []
        if (isMounted && list.length > 0) {
          setAutoStudents(list)
        }
      })
      .catch((err) => {
        console.warn('BatchIdCardGenerator: Could not auto-fetch real students:', err)
      })
      .finally(() => {
        if (isMounted) setLoadingRealStudents(false)
      })
    return () => {
      isMounted = false
    }
  }, [students])

  // Effective students (always prefer real passed students, then auto-fetched real students)
  const effectiveStudents = useMemo(() => {
    if (students && students.length > 0) return students
    if (autoStudents && autoStudents.length > 0) return autoStudents
    return []
  }, [students, autoStudents])

  const [selectedClass, setSelectedClass] = useState(initialClass || '1')
  const [selectedSection, setSelectedSection] = useState('all')
  const [validTillYear, setValidTillYear] = useState('2027')
  const [cardType, setCardType] = useState('id_card') // 'id_card' | 'admit_card'
  const [orientation, setOrientation] = useState('vertical') // Default: Vertical (55mm x 85mm)
  const [cardsPerPage, setCardsPerPage] = useState(9) // Standard: 9 cards per A4 page (3x3 grid)
  const [searchTerm, setSearchTerm] = useState('')
  const [hasGenerated, setHasGenerated] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(100) // Screen preview zoom percentage: 100% | 125% | 150%
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingPng, setDownloadingPng] = useState(false)
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false)
  const [inspectingStudent, setInspectingStudent] = useState(null)

  // Document Template Integration
  const docContext = useDocumentTemplates()
  const activeSystemTemplate = docContext?.getActiveTemplateId
    ? docContext.getActiveTemplateId(cardType)
    : (cardType === 'admit_card' ? 'admit_card_modern_blue' : 'id_card_modern_blue')
  const [selectedTemplate, setSelectedTemplate] = useState(activeSystemTemplate)

  useEffect(() => {
    setSelectedTemplate(activeSystemTemplate)
  }, [activeSystemTemplate, cardType])

  const availableTemplates = DOCUMENT_TEMPLATES[cardType] || []

  // Dynamic student counts for class selector badges from real data
  const classCounts = useMemo(() => {
    const counts = {}
    const list = effectiveStudents
    list.forEach((s) => {
      const sClass = (s.Class || s.class || '').toString().trim()
      const norm = normalizeSchoolClass(sClass) || sClass
      if (norm) {
        counts[norm] = (counts[norm] || 0) + 1
      }
    })
    return counts
  }, [effectiveStudents])

  // Automatically switch to first class with real students if initial class has 0 students
  useEffect(() => {
    if (effectiveStudents.length === 0) return
    const normSelected = normalizeSchoolClass(selectedClass) || selectedClass
    if ((!classCounts[normSelected] || classCounts[normSelected] === 0) && selectedClass !== 'all') {
      const availableClasses = Object.keys(classCounts).filter((k) => classCounts[k] > 0)
      if (availableClasses.length > 0) {
        setSelectedClass(availableClasses[0])
      }
    }
  }, [effectiveStudents, classCounts, selectedClass])

  // Close class dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#class-dropdown-container')) {
        setIsClassDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // When initialClass changes or modal opens
  useEffect(() => {
    if (initialClass) {
      setSelectedClass(initialClass)
    }
  }, [initialClass, isOpen])

  // Filter students by selected class and section (Strictly Real Data)
  const matchingStudents = useMemo(() => {
    const listToFilter = effectiveStudents
    return listToFilter.filter((s) => {
      const sClass = (s.Class || s.class || '').toString().trim()
      const normSClass = normalizeSchoolClass(sClass) || sClass
      const normSelected = normalizeSchoolClass(selectedClass) || selectedClass

      const matchClass =
        selectedClass === 'all' ||
        normSClass.toLowerCase() === normSelected.toLowerCase() ||
        sClass.toLowerCase() === selectedClass.toLowerCase()

      const sSec = (s.Section || s.section || 'A').toString().trim().toUpperCase()
      const matchSection =
        selectedSection === 'all' || sSec === selectedSection.toUpperCase()

      const sName = (s.Name || s.name || '').toLowerCase()
      const sRoll = (s.Roll || s.roll_no || '').toString()
      const matchSearch =
        !searchTerm ||
        sName.includes(searchTerm.toLowerCase()) ||
        sRoll.includes(searchTerm)

      return matchClass && matchSection && matchSearch
    })
  }, [effectiveStudents, selectedClass, selectedSection, searchTerm])

  // Split students into chunks of 9 (or 6) per A4 page
  const a4Pages = useMemo(() => {
    const pages = []
    const chunkSize = Number(cardsPerPage) || 9
    for (let i = 0; i < matchingStudents.length; i += chunkSize) {
      pages.push(matchingStudents.slice(i, i + chunkSize))
    }
    return pages
  }, [matchingStudents, cardsPerPage])

  const handleStartGeneration = () => {
    setHasGenerated(true)
    emitToast(
      'success',
      `Ready! ${matchingStudents.length} ${cardType === 'admit_card' ? 'Admit' : 'ID'} Cards for Class ${selectedClass} (${a4Pages.length} A4 Sheet${a4Pages.length > 1 ? 's' : ''})!`,
      'Cards Ready'
    )
  }

  // Print: Triggers native browser print dialog with exact A4 sheet sizing
  const handlePrintAll = () => {
    setHasGenerated(true)
    window.focus()
    setTimeout(() => {
      window.print()
    }, 150)
  }

  // Direct High-Resolution Multi-page A4 PDF Download
  const handleDownloadPDF = async () => {
    setDownloadingPdf(true)
    emitToast('info', `Rendering official A4 PDF (${a4Pages.length} Sheet${a4Pages.length > 1 ? 's' : ''})...`, 'Please wait')

    // Temporarily reset any on-screen zoom so html2canvas renders exact untransformed 100% sheet
    const zoomContainers = document.querySelectorAll('.sps-sheet-zoom-container')
    zoomContainers.forEach((el) => {
      el.style.transform = 'none'
    })

    try {
      const sheetElements = document.querySelectorAll('.sps-a4-sheet')
      if (!sheetElements || sheetElements.length === 0) {
        emitToast('error', 'No cards found to render PDF', 'Error')
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

      const filename = `Star_Public_School_${cardType === 'admit_card' ? 'Admit_Cards' : 'ID_Cards'}_Class_${selectedClass}_${Date.now()}.pdf`

      // Safe download trigger with blob fallback
      try {
        pdf.save(filename)
      } catch (saveErr) {
        console.warn('pdf.save failed, using Blob fallback:', saveErr)
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

  // Direct High-Resolution PNG Sheet Download (Captures first sheet)
  const handleDownloadPNG = async () => {
    setDownloadingPng(true)
    emitToast('info', 'Rendering High-Resolution PNG Sheet...', 'Please wait')

    // Temporarily reset any on-screen zoom
    const zoomContainers = document.querySelectorAll('.sps-sheet-zoom-container')
    zoomContainers.forEach((el) => {
      el.style.transform = 'none'
    })

    try {
      const firstSheet = document.querySelector('.sps-a4-sheet')
      if (!firstSheet) {
        emitToast('error', 'No sheet found to capture image', 'Error')
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

      const filename = `Star_Public_School_${cardType === 'admit_card' ? 'Admit_Cards' : 'ID_Cards'}_Class_${selectedClass}_Sheet_1.png`

      // Safe download using Blob URL
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

      emitToast('success', `Saved ${filename} successfully!`, 'PNG Downloaded')
    } catch (err) {
      console.error('Failed to capture PNG:', err)
      emitToast('error', `PNG download failed: ${err?.message || 'Error capturing image'}`, 'Error')
    } finally {
      // Restore on-screen zoom
      zoomContainers.forEach((el) => {
        el.style.transform = zoomLevel === 100 ? 'none' : `scale(${zoomLevel / 100})`
      })
      setDownloadingPng(false)
    }
  }

  // Quick Single Student Card PNG Download (High-Definition Unscaled Capture)
  const handleDownloadSingleCardPNG = async (student, elementId) => {
    try {
      const cardEl = document.getElementById(elementId)
      if (!cardEl) return
      const sName = student.Name || student.name || 'Student'
      emitToast('info', `Saving ID card for ${sName}...`, 'Please wait')

      // Create an unscaled offscreen host to ensure exact 350px x 541px native capture without parent scale interference
      const offscreenHost = document.createElement('div')
      offscreenHost.style.position = 'fixed'
      offscreenHost.style.top = '0'
      offscreenHost.style.left = '-10000px'
      offscreenHost.style.width = '350px'
      offscreenHost.style.height = '541px'
      offscreenHost.style.transform = 'none'
      offscreenHost.style.zIndex = '-9999'
      offscreenHost.style.overflow = 'visible'
      offscreenHost.style.background = 'transparent'

      // Clone card element directly into offscreen host
      const clone = cardEl.cloneNode(true)
      clone.style.transform = 'none'
      clone.style.margin = '0'
      clone.style.position = 'static'
      clone.style.width = '350px'
      clone.style.height = '541px'
      clone.style.boxShadow = 'none'

      // Synchronize image sources from original card to clone
      const origImgs = cardEl.querySelectorAll('img')
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
          scale: 3, // Ultra-sharp 3x HD resolution (1050px x 1623px)
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: null,
          width: 350,
          height: 541,
        })

        const filename = `ID_Card_${sName.replace(/\s+/g, '_')}_Roll_${student.Roll || student.roll || '0'}.png`

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

        emitToast('success', `Saved ID card for ${sName}!`, 'Card Downloaded')
      } finally {
        if (document.body.contains(offscreenHost)) {
          document.body.removeChild(offscreenHost)
        }
      }
    } catch (err) {
      console.error('Failed to download card:', err)
      emitToast('error', `Download failed: ${err?.message}`, 'Error')
    }
  }

  const containerClass = isPage
    ? 'w-full flex flex-col space-y-4'
    : 'fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs'

  const shellClass = isPage
    ? 'w-full flex flex-col space-y-4'
    : 'relative z-[9999] flex max-h-[95vh] w-full max-w-6xl flex-col overflow-y-auto rounded-2xl bg-[#f8fafc] shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4'

  return (
    <div className={containerClass}>
      {/* ================= WYSIWYG EXACT A4 PHYSICAL PRINT & SCREEN STYLES ================= */}
      <style>{`
        /* --- SCREEN RULES --- */
        .sps-a4-sheet {
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

        .sps-a4-grid-9 {
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

        .sps-a4-grid-6 {
          display: grid;
          grid-template-columns: repeat(2, 85mm);
          grid-template-rows: repeat(3, 85mm);
          column-gap: 8mm;
          row-gap: 5mm;
          justify-content: center;
          align-content: center;
          width: 178mm;
          height: 265mm;
          margin: 0 auto;
        }

        /* Exact 55mm x 85mm Card Cell with Dotted Scissor Guide Lines */
        .sps-id-card-cell {
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
        .sps-card-scaler {
          width: 350px;
          height: 541px;
          transform: scale(0.593926);
          transform-origin: top left;
        }

        /* --- PRINT RULES: WYSIWYG 1-TO-1 MATCH --- */
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
            display: block !important;
          }

          #sps-printable-id-cards-area {
            display: block !important;
            position: static !important;
            width: 210mm !important;
            height: auto !important;
            margin: 0 auto !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          .sps-sheet-screen-wrapper {
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .sps-a4-sheet {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            min-height: 297mm !important;
            padding: 16mm 17.5mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            background: #ffffff !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
          }

          .sps-a4-grid-9 {
            display: grid !important;
            grid-template-columns: repeat(3, 55mm) !important;
            grid-template-rows: repeat(3, 85mm) !important;
            column-gap: 5mm !important;
            row-gap: 4mm !important;
            justify-content: center !important;
            align-content: center !important;
            width: 175mm !important;
            height: 263mm !important;
            margin: 0 auto !important;
          }

          .sps-a4-grid-6 {
            display: grid !important;
            grid-template-columns: repeat(2, 85mm) !important;
            grid-template-rows: repeat(3, 85mm) !important;
            column-gap: 8mm !important;
            row-gap: 5mm !important;
            justify-content: center !important;
            align-content: center !important;
            width: 178mm !important;
            height: 265mm !important;
            margin: 0 auto !important;
          }

          .sps-id-card-cell {
            width: 55mm !important;
            height: 85mm !important;
            max-width: 55mm !important;
            max-height: 85mm !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 0.5px dashed #94a3b8 !important;
            border-radius: 4px !important;
            background: #ffffff !important;
          }

          .sps-card-scaler {
            width: 350px !important;
            height: 541px !important;
            transform: scale(0.593926) !important;
            transform-origin: top left !important;
          }
        }
      `}</style>

      {/* Main Dialog Shell */}
      <div className={shellClass}>
        {/* ================= 1. BREADCRUMBS & STUDIO TITLE ================= */}
        <div className="flex flex-col space-y-1.5 sps-print-no-show">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-semibold text-slate-400 tracking-wide uppercase mb-0.5">
            <span className="text-slate-500 hover:text-slate-700">SPS</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 hover:text-slate-700">STUDENT MANAGEMENT</span>
            <span className="text-slate-300">/</span>
            <span className="text-blue-600 font-bold">ID CARDS STUDIO</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {cardType === 'admit_card' ? 'Student Admit Card Studio' : 'Student ID Card Studio'}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#fef3c7] text-[#92400e] border border-amber-200 uppercase tracking-wide">
                  CR-80 STANDARD (55×85MM)
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{matchingStudents.length} Students Loaded</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                Session 2026–27 · Batch Print &amp; Export · 9 Cards per A4 Sheet (3×3 Grid)
              </p>
            </div>
            {onClose && !isPage && (
              <button
                type="button"
                onClick={onClose}
                className="self-start sm:self-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                title="Close Studio"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ================= 2. PRIMARY ACTION BUTTONS ROW ================= */}
        <div className="flex flex-wrap items-center gap-2.5 sps-print-no-show pt-0.5">
          {/* Tab: ID Card */}
          <button
            type="button"
            onClick={() => setCardType('id_card')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
              cardType === 'id_card'
                ? 'bg-white border-blue-500 text-blue-600 ring-2 ring-blue-500/10'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <svg className={`w-4 h-4 ${cardType === 'id_card' ? 'text-blue-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8" cy="15" r="1.5" fill="currentColor" />
            </svg>
            <span>ID Card</span>
          </button>

          {/* Tab: Admit Card */}
          <button
            type="button"
            onClick={() => setCardType('admit_card')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
              cardType === 'admit_card'
                ? 'bg-white border-blue-500 text-blue-600 ring-2 ring-blue-500/10'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <svg className={`w-4 h-4 ${cardType === 'admit_card' ? 'text-blue-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Admit Card</span>
          </button>

          {/* Export PNG */}
          <button
            type="button"
            onClick={handleDownloadPNG}
            disabled={downloadingPng}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{downloadingPng ? 'Exporting...' : 'Export PNG'}</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h-1v2H7v-5h2.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5zm5 2h-2v-5h2c.83 0 1.5.67 1.5 1.5v2c0 .83-.67 1.5-1.5 1.5zm4-3.5h-1.5v1h1v1.5h-1V14H17v-5h3v1.5z" />
            </svg>
            <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          {/* Print All Cards */}
          <button
            type="button"
            onClick={handlePrintAll}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#1d4ed8] hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer ml-auto sm:ml-0"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print All Cards</span>
          </button>
        </div>

        {/* ================= 3. FILTER & CONTROL CARD ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3.5 sps-print-no-show">
          {/* Line 1: Class | Section | Template/Theme */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* CLASS */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CLASS</span>
              <div className="relative" id="class-dropdown-container">
                <button
                  type="button"
                  onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-800 transition cursor-pointer"
                >
                  <span className="text-slate-500">🎓</span>
                  <span>
                    {selectedClass === 'all'
                      ? 'All Classes (All Sections)'
                      : `Class ${selectedClass} (All Sections)`}
                  </span>
                  <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isClassDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isClassDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      Select Class ({matchingStudents.length} shown)
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      <button
                        type="button"
                        onClick={() => { setSelectedClass('all'); setIsClassDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-left transition-colors cursor-pointer ${selectedClass === 'all' ? 'bg-[#071d3f] text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <span>All Classes</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedClass === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {effectiveStudents.length > 0 ? `${effectiveStudents.length} Students` : 'All'}
                        </span>
                      </button>
                      {[
                        'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
                        ...Object.keys(classCounts).filter((c) => c && !['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].includes(c))
                      ].map((c) => {
                        const isSel = selectedClass === c
                        const cLabel = ['Nursery', 'LKG', 'UKG'].includes(c) ? c : c.startsWith('Class') ? c : `Class ${c}`
                        const count = classCounts[c] || 0
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => { setSelectedClass(c); setIsClassDropdownOpen(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-left transition-colors cursor-pointer ${isSel ? 'bg-[#071d3f] text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            <span>{cLabel}</span>
                            {count > 0 && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {count}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <span className="text-slate-300 font-light hidden sm:inline">|</span>

            {/* SECTION */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SECTION</span>
              <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
                {['all', 'A', 'B'].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSelectedSection(sec)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      selectedSection === sec
                        ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {sec === 'all' ? 'All' : sec}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-slate-300 font-light hidden sm:inline">|</span>

            {/* TEMPLATE / THEME */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TEMPLATE / THEME</span>
              <div className="relative">
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    const newId = e.target.value
                    setSelectedTemplate(newId)
                    if (docContext?.setActiveTemplate) {
                      docContext.setActiveTemplate(cardType, newId)
                    }
                  }}
                  className="appearance-none inline-flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 pl-3 pr-8 py-2 text-xs font-bold text-slate-800 transition cursor-pointer focus:outline-none"
                >
                  {availableTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      ● {t.name}
                    </option>
                  ))}
                </select>
                <svg className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Row 2: Search Input & Zoom Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name or roll..."
                className="w-full pl-9 pr-7 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Zoom Level Controls */}
            <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(75, z - 25))}
                disabled={zoomLevel <= 75}
                className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                title="Zoom Out Sheet Preview"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <span className="px-2 text-xs font-mono font-bold text-slate-700 min-w-[42px] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 25))}
                disabled={zoomLevel >= 150}
                className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                title="Zoom In Sheet Preview"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Cards Scrollable Canvas: Shows each A4 Sheet Page */}
        <div
          id="sps-printable-id-cards-area"
          className="w-full rounded-2xl border border-slate-200/90 bg-slate-100/70 p-4 sm:p-8 space-y-12 overflow-y-auto min-h-[500px]"
        >
              {matchingStudents.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <span className="material-symbols-outlined text-4xl text-slate-300">
                    sentiment_dissatisfied
                  </span>
                  <p className="mt-2 text-sm font-semibold">
                    No student records found matching this class / search.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClass('all')
                      setSearchTerm('')
                    }}
                    className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    View All Students
                  </button>
                </div>
              ) : (
                a4Pages.map((pageStudents, pageIndex) => (
                  <div key={`page-wrapper-${pageIndex}`} className="sps-sheet-screen-wrapper flex flex-col items-center">
                    {/* Screen Page Header Badge (Hidden on print) */}
                    <div className="w-[210mm] max-w-full mb-2 flex items-center justify-between px-2 sps-print-no-show">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-[#071d3f] px-2.5 py-0.5 text-xs font-black text-white">
                          A4 Sheet · Page {pageIndex + 1} of {a4Pages.length}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          ({pageStudents.length} Student Cards · Exact 55mm × 85mm)
                        </span>
                      </div>

                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {cardsPerPage === 9 ? '3 × 3 Grid (9 per sheet)' : '2 × 3 Grid (6 per sheet)'}
                      </span>
                    </div>

                    {/* The Scalable Screen Wrapper for Zoom */}
                    <div
                      style={{
                        transform: zoomLevel === 100 ? 'none' : `scale(${zoomLevel / 100})`,
                        transformOrigin: 'top center',
                        marginBottom: zoomLevel > 100 ? `${(zoomLevel - 100) * 2.8}mm` : '0',
                      }}
                      className="sps-sheet-zoom-container transition-transform duration-150"
                    >
                      {/* Physical A4 Sheet (210mm x 297mm) */}
                      <div
                        className={`sps-a4-sheet ${cardsPerPage === 9 ? 'sps-grid-density-9' : 'sps-grid-density-6'
                          }`}
                      >
                        {/* The Grid of Cards on this A4 Paper */}
                        <div className={cardsPerPage === 9 ? 'sps-a4-grid-9' : 'sps-a4-grid-6'}>
                          {pageStudents.map((st, idx) => {
                            const cardId = `sps-id-card-${st.Roll || st.roll_no || idx}-${(st.Name || st.name || '').replace(/\s+/g, '')}`
                            return (
                              <div
                                key={st.ID || st.id || idx}
                                className="sps-id-card-cell group cursor-pointer hover:ring-2 hover:ring-blue-600 hover:shadow-lg transition-all"
                                title={`Click to inspect ${st.Name || st.name} full size`}
                                onClick={() => setInspectingStudent(st)}
                              >
                                <div className="sps-card-scaler pointer-events-none">
                                  <StudentIdCard
                                    student={st}
                                    validTill={validTillYear}
                                    orientation={orientation}
                                    cardType={cardType}
                                    templateId={selectedTemplate}
                                    showPrintButton={false}
                                    showCutLines={false}
                                  />
                                </div>

                                {/* On-hover Inspect Pill Badge */}
                                <div className="sps-print-no-show absolute inset-0 bg-[#071d3f]/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20 pointer-events-none">
                                  <span className="bg-[#071d3f] text-white text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 border border-white/40">
                                    <span className="material-symbols-outlined text-xs text-amber-300">visibility</span>
                                    <span>Inspect Full</span>
                                  </span>
                                </div>

                                {/* On-hover quick single card download button (Hidden on print) */}
                                <div className="sps-print-no-show absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDownloadSingleCardPNG(st, cardId)
                                    }}
                                    className="h-6 w-6 rounded-full bg-[#071d3f] text-white flex items-center justify-center shadow-md hover:bg-emerald-700 transition-colors"
                                    title="Download this single ID card as PNG"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">
                                      download
                                    </span>
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
      </div>

      {/* Full-Resolution Card Inspector Modal */}
      {inspectingStudent && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-black text-slate-900">
                  {inspectingStudent.Name || inspectingStudent.name}
                </h3>
                <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Roll #{inspectingStudent.Roll || inspectingStudent.roll_no || '0'} · Class {inspectingStudent.Class || inspectingStudent.class}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingStudent(null)}
                className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Native 100% Unscaled Card Display */}
            <div className="my-5 p-4 bg-slate-100/80 rounded-2xl border border-slate-200 flex justify-center shadow-inner overflow-auto max-w-full">
              <div id="inspector-card-target" className="shadow-2xl rounded-[18px]">
                <StudentIdCard
                  student={inspectingStudent}
                  validTill={validTillYear}
                  orientation={orientation}
                  cardType={cardType}
                  templateId={selectedTemplate}
                  showPrintButton={false}
                  showCutLines={false}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="w-full pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Standard CR-80 PVC Dimensions (54mm × 85.6mm) · 350px × 541px
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadSingleCardPNG(inspectingStudent, 'inspector-card-target')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-extrabold shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Download Ultra-HD PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#071d3f] hover:bg-[#122e58] text-white text-xs font-extrabold shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-amber-300">print</span>
                  <span>Print Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchIdCardGenerator
