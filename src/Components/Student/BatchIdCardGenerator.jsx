import React, { useState, useMemo, useEffect } from 'react'
import StudentIdCard from './StudentIdCard'
import { CLASS_OPTIONS, normalizeSchoolClass } from '../../constants/schoolOptions'
import { emitToast } from '../../Api/auth'
import { getAllStudents } from '../../Api/students'
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'

const SAMPLE_STUDENTS = [
  { ID: 'SPS-2026-01', Name: 'Ajay Kumar Giri', Class: '1', Section: 'A', Roll: '17', FatherName: 'Mathura Nand Giri', DOB: '12-12-2012', Mobile: '+91 94702 46849', Address: 'Meghwal Mathia, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1792820054/public/agv4yk9n2ar34dtn3ys9.jpg' },
  { ID: 'SPS-2026-02', Name: 'Aarav Sharma', Class: '1', Section: 'A', Roll: '01', FatherName: 'Ramesh Sharma', DOB: '15-05-2013', Mobile: '+91 98765 43210', Address: 'Mathia Bazar, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1792819975/public/ckubks2jn3ox6h4pthei.jpg' },
  { ID: 'SPS-2026-03', Name: 'Ananya Verma', Class: '1', Section: 'A', Roll: '02', FatherName: 'Sanjay Verma', DOB: '20-08-2013', Mobile: '+91 98112 33445', Address: 'Bettiah, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1782612165/public/kqblqhgzpwhrfqxydznq.jpg' },
  { ID: 'SPS-2026-04', Name: 'Aryan Kumar', Class: '1', Section: 'A', Roll: '03', FatherName: 'Sunil Kumar', DOB: '11-01-2013', Mobile: '+91 99887 76655', Address: 'Narkatiaganj, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1781517001/public/yiyxgkbz8lqwxmosynbw.jpg' },
  { ID: 'SPS-2026-05', Name: 'Ishita Patel', Class: '1', Section: 'A', Roll: '04', FatherName: 'Manoj Patel', DOB: '04-03-2013', Mobile: '+91 98220 45116', Address: 'Meghwal Mathia, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1792820112/public/ttmdyrriphttcmvbgqgk.jpg' },
  { ID: 'SPS-2026-06', Name: 'Kavya Singh', Class: '1', Section: 'A', Roll: '05', FatherName: 'Rajesh Singh', DOB: '22-09-2012', Mobile: '+91 97110 55432', Address: 'Mathia Bazar, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1782612165/public/kqblqhgzpwhrfqxydznq.jpg' },
  { ID: 'SPS-2026-07', Name: 'Manish Pandey', Class: '1', Section: 'A', Roll: '06', FatherName: 'Dinesh Pandey', DOB: '18-07-2013', Mobile: '+91 94500 12345', Address: 'Bettiah, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1792820054/public/agv4yk9n2ar34dtn3ys9.jpg' },
  { ID: 'SPS-2026-08', Name: 'Neha Kumari', Class: '1', Section: 'A', Roll: '07', FatherName: 'Vinod Kumar', DOB: '30-11-2012', Mobile: '+91 94702 46849', Address: 'Meghwal Mathia, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1792819975/public/ckubks2jn3ox6h4pthei.jpg' },
  { ID: 'SPS-2026-09', Name: 'Rohan Gupta', Class: '1', Section: 'A', Roll: '08', FatherName: 'Pradeep Gupta', DOB: '09-02-2013', Mobile: '+91 98765 43210', Address: 'Bettiah, West Champaran', Photo: 'https://res.cloudinary.com/dqi5rafqu/image/upload/f_auto,q_auto,c_fill,g_center,w_318,h_414/v1781517001/public/yiyxgkbz8lqwxmosynbw.jpg' },
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

  // Dynamic student counts for class selector badges from real data
  const classCounts = useMemo(() => {
    const counts = {}
    const list = effectiveStudents.length > 0 ? effectiveStudents : SAMPLE_STUDENTS
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

  // Filter students by selected class and section (Strictly Real Data when available)
  const matchingStudents = useMemo(() => {
    const listToFilter = effectiveStudents.length > 0 ? effectiveStudents : SAMPLE_STUDENTS
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

    // ONLY fallback to SAMPLE_STUDENTS if there are ZERO students in the entire database
    if (filtered.length === 0 && effectiveStudents.length === 0) {
      return SAMPLE_STUDENTS.map((s, idx) => ({
        ...s,
        Class: selectedClass === 'all' ? '1' : selectedClass,
        Roll: (idx + 1).toString(),
      }))
    }

    return filtered
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-5 sm:px-7 py-3 sps-print-no-show shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071d3f] text-white shadow-sm ring-1 ring-[#071d3f]/20">
              <span className="material-symbols-outlined text-xl text-amber-300">
                {cardType === 'admit_card' ? 'assignment_turned_in' : 'badge'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#071d3f] tracking-tight">
                  {cardType === 'admit_card'
                    ? 'Examination Admit Card Studio'
                    : 'Student ID Card Studio'}
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                  55 × 85 mm · Official CR-80
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Official Star Public School Session 2026–27 · 9 Cards per A4 Sheet · Direct Print & PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Active Counter Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{matchingStudents.length} Students</span>
            </div>

            {/* Document Switcher: ID Card vs Admit Card */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setCardType('id_card')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${cardType === 'id_card'
                    ? 'bg-[#071d3f] text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
                title="Generate Student Identity Cards"
              >
                <span className="material-symbols-outlined text-[14px]">badge</span>
                <span>ID Card</span>
              </button>
              <button
                type="button"
                onClick={() => setCardType('admit_card')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${cardType === 'admit_card'
                    ? 'bg-[#071d3f] text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
                title="Generate Examination Admit Cards"
              >
                <span className="material-symbols-outlined text-[14px]">assignment_turned_in</span>
                <span>Admit Card</span>
              </button>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer ml-1"
                title="Close Studio"
              >
                <span className="material-symbols-outlined text-base">close</span>
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
            {/* ================= FLOATING STUDIO COMMAND DOCK (Matching Mockup 2 in Light Theme) ================= */}
            <div className="bg-[#f1f5f9]/70 px-4 sm:px-6 py-2.5 sps-print-no-show shrink-0 border-b border-slate-200/80">
              <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-white border border-slate-200/90 p-2 sm:p-2.5 shadow-md shadow-slate-200/50">
                {/* 1. Class Selector Dropdown & Section Switcher */}
                <div className="flex items-center gap-2">
                  <div className="relative" id="class-dropdown-container">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 pl-1">
                        CLASS:
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-black text-[#071d3f] shadow-2xs transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#071d3f]">school</span>
                        <span>{selectedClass === 'all' ? 'All Classes' : ['Nursery', 'LKG', 'UKG'].includes(selectedClass) ? selectedClass : `Class ${selectedClass}`}</span>
                        <span className="material-symbols-outlined text-sm text-slate-400 transition-transform duration-200" style={{ transform: isClassDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                          expand_more
                        </span>
                      </button>
                    </div>

                    {/* Dropdown Menu Popover */}
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
                            'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
                            ...Object.keys(classCounts).filter((c) => c && !['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(c))
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

                  {/* Section Switcher */}
                  <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold shadow-2xs">
                    <span className="px-1.5 text-[10px] font-black uppercase text-slate-400">Sec:</span>
                    {['all', 'A', 'B'].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setSelectedSection(sec)}
                        className={`rounded-lg px-2 py-1 text-xs transition-all cursor-pointer ${selectedSection === sec
                            ? 'bg-[#071d3f] text-white shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        {sec === 'all' ? 'All' : sec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Center Search Bar */}
                <div className="flex flex-1 items-center justify-center max-w-md">
                  <div className="relative w-full min-w-[180px] max-w-[320px]">
                    <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-sm pointer-events-none">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search student name or roll..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white pl-9 pr-7 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:border-[#071d3f] focus:outline-none focus:ring-2 focus:ring-[#071d3f]/10 transition-all"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Right Action Cluster (Emerald PDF, Navy/Gold Print, PNG) */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Download PDF Button */}
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={downloadingPdf}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-3.5 py-1.5 text-xs font-extrabold shadow-sm shadow-emerald-700/20 active:scale-[0.98] disabled:opacity-60 transition-all cursor-pointer"
                    title="Download all cards as multi-page A4 PDF"
                  >
                    <span className="material-symbols-outlined text-base">
                      {downloadingPdf ? 'sync' : 'picture_as_pdf'}
                    </span>
                    <span>{downloadingPdf ? 'PDF...' : 'Download PDF'}</span>
                  </button>

                  {/* Print IDs Button */}
                  <button
                    type="button"
                    onClick={handlePrintAll}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#071d3f] hover:bg-[#122e58] text-white px-3.5 py-1.5 text-xs font-extrabold shadow-sm shadow-[#071d3f]/20 active:scale-[0.98] transition-all cursor-pointer"
                    title="Print all cards on A4 paper"
                  >
                    <span className="material-symbols-outlined text-base text-amber-300">print</span>
                    <span>Print IDs</span>
                  </button>

                  {/* PNG Sheet Button */}
                  <button
                    type="button"
                    onClick={handleDownloadPNG}
                    disabled={downloadingPng}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 text-xs font-bold shadow-2xs active:scale-[0.98] disabled:opacity-60 transition-all cursor-pointer"
                    title="Download current A4 sheet as High-Resolution PNG"
                  >
                    <span className="material-symbols-outlined text-base text-slate-500">
                      {downloadingPng ? 'sync' : 'image'}
                    </span>
                    <span>{downloadingPng ? 'PNG...' : 'PNG'}</span>
                  </button>
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
