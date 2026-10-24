import React, { useState, useMemo, useEffect } from 'react'
import StudentIdCard from './StudentIdCard'
import { CLASS_OPTIONS, normalizeSchoolClass } from '../../constants/schoolOptions'
import { emitToast } from '../../Api/auth'
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'

const SAMPLE_STUDENTS = [
  { ID: 'SPS-2026-01', Name: 'Ajay Kumar Giri', Class: 'Nursery', Section: 'A', Roll: '17', FatherName: 'Mathura Nand Giri', DOB: '12-12-2012', Address: 'Meghwal Mathia, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1792820054/public/agv4yk9n2ar34dtn3ys9.jpg' },
  { ID: 'SPS-2026-02', Name: 'Aarav Sharma', Class: 'Nursery', Section: 'A', Roll: '01', FatherName: 'Ramesh Sharma', DOB: '15-05-2013', Address: 'Mathia Bazar, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1792819975/public/ckubks2jn3ox6h4pthei.jpg' },
  { ID: 'SPS-2026-03', Name: 'Ananya Verma', Class: 'Nursery', Section: 'A', Roll: '02', FatherName: 'Sanjay Verma', DOB: '20-08-2013', Address: 'Bettiah, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1782612165/public/kqblqhgzpwhrfqxydznq.jpg' },
  { ID: 'SPS-2026-04', Name: 'Aryan Kumar', Class: 'Nursery', Section: 'A', Roll: '03', FatherName: 'Sunil Kumar', DOB: '11-01-2013', Address: 'Narkatiaganj, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1781517001/public/yiyxgkbz8lqwxmosynbw.jpg' },
  { ID: 'SPS-2026-05', Name: 'Ishita Patel', Class: 'Nursery', Section: 'A', Roll: '04', FatherName: 'Manoj Patel', DOB: '04-03-2013', Address: 'Meghwal Mathia, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1792820112/public/ttmdyrriphttcmvbgqgk.jpg' },
  { ID: 'SPS-2026-06', Name: 'Kavya Singh', Class: 'Nursery', Section: 'A', Roll: '05', FatherName: 'Rajesh Singh', DOB: '22-09-2012', Address: 'Mathia Bazar, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1782612165/public/kqblqhgzpwhrfqxydznq.jpg' },
  { ID: 'SPS-2026-07', Name: 'Manish Pandey', Class: 'Nursery', Section: 'A', Roll: '06', FatherName: 'Dinesh Pandey', DOB: '18-07-2013', Address: 'Bettiah, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1792820054/public/agv4yk9n2ar34dtn3ys9.jpg' },
  { ID: 'SPS-2026-08', Name: 'Neha Kumari', Class: 'Nursery', Section: 'A', Roll: '07', FatherName: 'Vinod Kumar', DOB: '30-11-2012', Address: 'Meghwal Mathia, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1792819975/public/ckubks2jn3ox6h4pthei.jpg' },
  { ID: 'SPS-2026-09', Name: 'Rohan Gupta', Class: 'Nursery', Section: 'A', Roll: '08', FatherName: 'Pradeep Gupta', DOB: '09-02-2013', Address: 'Bettiah, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1781517001/public/yiyxgkbz8lqwxmosynbw.jpg' },
]

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

  const [selectedClass, setSelectedClass] = useState(initialClass || 'Nursery')
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

  // When initialClass changes or modal opens
  useEffect(() => {
    if (initialClass) {
      setSelectedClass(initialClass)
    }
  }, [initialClass, isOpen])

  // Filter students by selected class and section (with reliable sample fallback)
  const matchingStudents = useMemo(() => {
    const listToFilter = students && students.length > 0 ? students : SAMPLE_STUDENTS
    const filtered = listToFilter.filter((s) => {
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

    if (filtered.length === 0 && (!students || students.length === 0)) {
      return SAMPLE_STUDENTS.map((s, idx) => ({
        ...s,
        Class: selectedClass === 'all' ? 'Nursery' : selectedClass,
        Roll: (idx + 1).toString(),
      }))
    }

    return filtered
  }, [students, selectedClass, selectedSection, searchTerm])

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

  // Quick Single Student Card PNG Download
  const handleDownloadSingleCardPNG = async (student, elementId) => {
    try {
      const cardEl = document.getElementById(elementId)
      if (!cardEl) return
      const sName = student.Name || student.name || 'Student'
      emitToast('info', `Saving ID card for ${sName}...`, 'Please wait')
      const canvas = await html2canvas(cardEl, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
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
    } catch (err) {
      console.error('Failed to download card:', err)
      emitToast('error', `Download failed: ${err?.message}`, 'Error')
    }
  }

  const containerClass = isPage
    ? 'w-full flex flex-col space-y-4'
    : 'fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs'

  const shellClass = isPage
    ? 'relative z-10 flex min-h-[calc(100vh-140px)] w-full flex-col overflow-hidden rounded-2xl bg-[#f8fafc] shadow-xs border border-slate-200'
    : 'relative z-[9999] flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#f8fafc] shadow-2xl border border-slate-200'

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
        {/* ================= 1. MODAL TOP HEADER ================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 sm:px-7 sps-print-no-show shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071d3f] text-white shadow-2xs">
              <span className="material-symbols-outlined text-xl">
                {cardType === 'admit_card' ? 'assignment_turned_in' : 'badge'}
              </span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#071d3f] leading-tight">
                {cardType === 'admit_card'
                  ? 'Examination Admit Card Studio'
                  : 'Student ID Card Studio (55mm × 85mm)'}
              </h2>
              <p className="text-xs text-slate-500">
                Official Design · 9 Cards per A4 Sheet · Direct PDF & PNG Download · Session 2026–27
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Card Type Switcher: ID Card vs Admit Card */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-bold mr-1">
              <button
                type="button"
                onClick={() => setCardType('id_card')}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-all ${
                  cardType === 'id_card'
                    ? 'bg-[#071d3f] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Generate Student Identity Cards"
              >
                <span className="material-symbols-outlined text-sm">badge</span>
                <span>ID Card</span>
              </button>
              <button
                type="button"
                onClick={() => setCardType('admit_card')}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-all ${
                  cardType === 'admit_card'
                    ? 'bg-[#071d3f] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Generate Examination Admit Cards"
              >
                <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                <span>Admit Card</span>
              </button>
            </div>

            {/* Direct Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-bold shadow-xs disabled:opacity-60 transition-all cursor-pointer"
              title="Download all cards as multi-page A4 PDF"
            >
              <span className="material-symbols-outlined text-sm">
                {downloadingPdf ? 'sync' : 'picture_as_pdf'}
              </span>
              <span>{downloadingPdf ? 'Rendering PDF...' : 'Download PDF'}</span>
            </button>

            {/* Direct Download PNG Button */}
            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={downloadingPng}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 text-xs font-bold shadow-xs disabled:opacity-60 transition-all cursor-pointer"
              title="Download current A4 sheet as High-Resolution PNG"
            >
              <span className="material-symbols-outlined text-sm">
                {downloadingPng ? 'sync' : 'image'}
              </span>
              <span>{downloadingPng ? 'Saving...' : 'PNG Sheet'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrintAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#071d3f] hover:bg-[#122e58] text-white px-3 py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Print all cards on A4 paper"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Print A4 Sheet</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 transition-colors ml-1"
                title="Close Generator"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= 2. CLASS SELECTION STEP (If not generated) ================= */}
        {!hasGenerated ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex items-center justify-center">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="text-center space-y-1">
                <span className="material-symbols-outlined text-4xl text-[#071d3f]">
                  assignment_ind
                </span>
                <h3 className="text-lg font-extrabold text-[#071d3f]">
                  Select Class to Generate Cards
                </h3>
                <p className="text-xs text-slate-500">
                  Select the class to generate official vertical ID cards. Optimized to fit <strong>up to 9 cards per single A4 paper sheet (55mm × 85mm)</strong>.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#071d3f] focus:bg-white focus:outline-none"
                  >
                    <option value="all">All Classes (Full School)</option>
                    {CLASS_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleStartGeneration}
                  className="w-full rounded-xl bg-[#071d3f] hover:bg-[#122e58] py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-slate-900/15 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>
                    Generate Cards for {selectedClass === 'all' ? 'All Classes' : selectedClass} ({matchingStudents.length} Students)
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ================= 3. GENERATED CARDS STUDIO & A4 SHEET PREVIEW ================= */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-2.5 sm:px-7 sps-print-no-show shrink-0">
              {/* Quick Class Selector Pills */}
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Class:
                </span>
                {['all', 'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedClass(c)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        selectedClass === c
                          ? 'bg-[#071d3f] text-white shadow-2xs'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {c === 'all' ? 'All' : c.startsWith('Class') ? c : `Cl ${c}`}
                    </button>
                  )
                )}
              </div>

              {/* Controls on Right */}
              <div className="flex items-center gap-2.5">
                {/* On-screen Zoom Selector */}
                <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold text-slate-600">
                  <span className="px-2 text-[10px] text-slate-400 uppercase font-black">Zoom:</span>
                  {[100, 125, 150].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setZoomLevel(z)}
                      className={`rounded-md px-2 py-1 text-xs transition-all ${
                        zoomLevel === z
                          ? 'bg-[#071d3f] text-white shadow-2xs'
                          : 'hover:text-slate-900'
                      }`}
                      title={`Preview at ${z}% zoom`}
                    >
                      {z}%
                    </button>
                  ))}
                </div>

                {/* Density Switcher (9 vs 6 per A4) */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setCardsPerPage(9)}
                    className={`rounded-md px-2.5 py-1 transition-all ${
                      cardsPerPage === 9
                        ? 'bg-[#071d3f] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Fit 9 cards on each A4 paper (3x3 grid - 55mm x 85mm)"
                  >
                    9 / A4 Sheet (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardsPerPage(6)}
                    className={`rounded-md px-2.5 py-1 transition-all ${
                      cardsPerPage === 6
                        ? 'bg-[#071d3f] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Fit 6 cards on each A4 paper (2x3 grid)"
                  >
                    6 / A4 Sheet
                  </button>
                </div>

                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name/roll..."
                    className="rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none w-32 sm:w-40"
                  />
                </div>
              </div>
            </div>

            {/* Cards Scrollable Canvas: Shows each A4 Sheet Page */}
            <div
              id="sps-printable-id-cards-area"
              className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-12 bg-slate-200/70"
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
                        className={`sps-a4-sheet ${
                          cardsPerPage === 9 ? 'sps-grid-density-9' : 'sps-grid-density-6'
                        }`}
                      >
                        {/* The Grid of Cards on this A4 Paper */}
                        <div className={cardsPerPage === 9 ? 'sps-a4-grid-9' : 'sps-a4-grid-6'}>
                          {pageStudents.map((st, idx) => {
                            const cardId = `sps-id-card-${st.Roll || st.roll_no || idx}-${(st.Name || st.name || '').replace(/\s+/g, '')}`
                            return (
                              <div
                                key={st.ID || st.id || idx}
                                className="sps-id-card-cell group"
                                title={`${st.Name || st.name} (Roll: ${st.Roll || st.roll_no})`}
                              >
                                <div className="sps-card-scaler">
                                  <StudentIdCard
                                    student={st}
                                    validTill={validTillYear}
                                    orientation={orientation}
                                    cardType={cardType}
                                    showPrintButton={false}
                                    showCutLines={false}
                                  />
                                </div>

                                {/* On-hover quick single card download button (Hidden on print) */}
                                <div className="sps-print-no-show absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadSingleCardPNG(st, cardId)}
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
        )}
      </div>
    </div>
  )
}

export default BatchIdCardGenerator
