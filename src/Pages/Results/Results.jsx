import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import jsPDF from 'jspdf'
import { getStudentResultPublic } from '../../Api/marks'
import schoolLogo from '../../assets/logo.png'
import SEO from '../../Components/SEO/SEO'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import { SCHOOL_KEYWORDS, buildSchoolJsonLd, parseClassSlug, parseRollSlug } from '../../seo/siteSeo'
import '../../styles/print.css'

const SUMMARY_TERMINALS = ['First', 'Second', 'Third', 'Annual']
const TERMINAL_ALIAS_MAP = {
  first: 'First',
  second: 'Second',
  third: 'Third',
  annual: 'Annual',
  final: 'Annual',
}
const SUMMARY_REPORT_KEY_MAP = {
  First: 'first_term',
  Second: 'second_term',
  Third: 'third_term',
  Annual: 'annual_term',
}

const normalizeTerminalLabel = (value) => {
  const normalized = String(value || '').trim()
  if (!normalized) return ''
  return TERMINAL_ALIAS_MAP[normalized.toLowerCase()] || normalized
}

const getCumulativeTerminals = (terminalValue) => {
  const normalizedTerminal = normalizeTerminalLabel(terminalValue)
  if (!normalizedTerminal) return []

  const terminalIndex = SUMMARY_TERMINALS.indexOf(normalizedTerminal)
  if (terminalIndex === -1) return [normalizedTerminal]

  return SUMMARY_TERMINALS.slice(0, terminalIndex + 1)
}

const hasMeaningfulValue = (value) => {
  if (value === undefined || value === null) return false
  if (typeof value === 'string' && value.trim() === '') return false
  return true
}

const normalizeSummaryRow = (summaryRow) => {
  if (!summaryRow || typeof summaryRow !== 'object') return null

  const normalizedRank = (
    summaryRow?.rank ??
    summaryRow?.class_section_rank ??
    summaryRow?.section_rank ??
    summaryRow?.rank_in_section ??
    summaryRow?.classSectionRank ??
    summaryRow?.sectionRank ??
    summaryRow?.section_position ??
    null
  )

  const normalizedPublishedDate = (
    summaryRow?.published_date ??
    summaryRow?.publish_date ??
    summaryRow?.publishedDate ??
    summaryRow?.published_at ??
    summaryRow?.publishedAt ??
    summaryRow?.result_published_date ??
    null
  )

  return {
    ...summaryRow,
    rank: normalizedRank,
    published_date: normalizedPublishedDate,
  }
}

const mergeSummaryRows = (baseSummary, incomingSummary) => {
  const base = normalizeSummaryRow(baseSummary) || {}
  const incoming = normalizeSummaryRow(incomingSummary) || {}
  const merged = { ...base }

  Object.entries(incoming).forEach(([key, value]) => {
    if (hasMeaningfulValue(value)) {
      merged[key] = value
    } else if (!(key in merged)) {
      merged[key] = value
    }
  })

  return Object.keys(merged).length > 0 ? merged : null
}

const buildSummaryFromSummaryReport = (summaryReport, terminalLabel) => {
  const reportKey = SUMMARY_REPORT_KEY_MAP[terminalLabel]
  if (!reportKey || !summaryReport || typeof summaryReport !== 'object') return null

  const totalMarks = summaryReport?.total_marks?.[reportKey]
  const marksObtained = summaryReport?.marks_obtained?.[reportKey]
  const percentage = summaryReport?.percentage?.[reportKey]
  const division = summaryReport?.division?.[reportKey]
  const rank = summaryReport?.rank?.[reportKey]
  const publishedDate = summaryReport?.published_date?.[reportKey]

  const hasValue = [
    totalMarks,
    marksObtained,
    percentage,
    division,
    rank,
    publishedDate,
  ].some((value) => value !== undefined && value !== null && value !== '')

  if (!hasValue) return null

  return normalizeSummaryRow({
    total_max_marks: totalMarks ?? null,
    total_obtained: marksObtained ?? null,
    percentage: percentage ?? null,
    division: division ?? null,
    rank: rank ?? null,
    published_date: publishedDate ?? null,
  })
}

const getOrderedTerminalKeys = (keys = []) => {
  const uniqueKeys = [...new Set(keys.filter(Boolean))]
  const knownTerminals = SUMMARY_TERMINALS.filter((terminal) => uniqueKeys.includes(terminal))
  const customTerminals = uniqueKeys.filter((terminal) => !SUMMARY_TERMINALS.includes(terminal))
  return [...knownTerminals, ...customTerminals]
}

const buildCloudinaryPassportPhotoUrl = (url) => {
  const rawUrl = String(url || '').trim()
  if (!rawUrl || !rawUrl.includes('/image/upload/')) return rawUrl || null

  const transforms = 'f_auto,q_auto,c_fill,g_face,w_318,h_414'
  if (/\/image\/upload\/[^/]*c_fill[^/]*\//.test(rawUrl)) return rawUrl

  return rawUrl.replace('/image/upload/', `/image/upload/${transforms}/`)
}

function Results() {
  const SCHOOL_NAME = import.meta.env.VITE_SCHOOL_NAME || 'Gyanoday Public School'
  const SCHOOL_ADDRESS = import.meta.env.VITE_SCHOOL_ADDRESS || 'Belaspur Dainmanwa Road, Harinagar, Ramnagar, West Champaran, Bihar'
  const cardRef = useRef(null)

  const [searchParams] = useSearchParams()
  const { classSlug, rollNumber } = useParams()

  const params = useMemo(() => {
    const classValue = searchParams.get('class') || parseClassSlug(classSlug) || ''
    const roll = searchParams.get('roll') || parseRollSlug(rollNumber) || ''
    const terminal = searchParams.get('terminal') || ''
    const section = searchParams.get('section') || ''
    const session = searchParams.get('session') || ''
    return { classValue, roll, terminal, section, session }
  }, [classSlug, rollNumber, searchParams])
  const { classValue, roll, terminal, section, session } = params

  const [loading, setLoading] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [termSummaries, setTermSummaries] = useState({})
  const [visibleTerminals, setVisibleTerminals] = useState([])

  useEffect(() => {
    let isActive = true

    const run = async () => {
      setError('')

      if (!classValue || !roll || !terminal) {
        setData(null)
        setTermSummaries({})
        setVisibleTerminals([])
        setError('Missing params. Please go back and fill Class, Roll and Terminal.')
        return
      }

      setLoading(true)

      try {
        const selectedTerminal = normalizeTerminalLabel(terminal)
        const summaryTerminals = getCumulativeTerminals(selectedTerminal)

        const currentData = await getStudentResultPublic({
          classValue,
          roll,
          terminal: selectedTerminal || terminal,
          section,
          session,
        })
        if (!isActive) return

        if (!currentData) {
          setData(null)
          setTermSummaries({})
          setVisibleTerminals([])
          setError('Result for this terminal is not available or not published yet.')
          return
        }

        const currentTerminal = normalizeTerminalLabel(
          currentData?.resolved_terminal || currentData?.terminal || selectedTerminal || terminal
        )
        const nextSummaries = {}

        if (Array.isArray(currentData?.terminals)) {
          currentData.terminals.forEach((terminalRow) => {
            const terminalLabel = normalizeTerminalLabel(terminalRow?.terminal)
            if (!terminalLabel) return
            nextSummaries[terminalLabel] = normalizeSummaryRow(terminalRow?.summary)
          })
        }

        summaryTerminals.forEach((terminalLabel) => {
          if (nextSummaries[terminalLabel]) return
          const summaryFromReport = buildSummaryFromSummaryReport(currentData?.summary_report, terminalLabel)
          if (summaryFromReport) {
            nextSummaries[terminalLabel] = summaryFromReport
          }
        })

        if (currentTerminal) {
          const currentSummary = normalizeSummaryRow(currentData?.summary)
          if (currentSummary) {
            nextSummaries[currentTerminal] = mergeSummaryRows(nextSummaries[currentTerminal], currentSummary)
          } else if (!(currentTerminal in nextSummaries)) {
            nextSummaries[currentTerminal] = null
          }
        }

        const requestedTerminals = summaryTerminals.length > 0
          ? summaryTerminals
          : (currentTerminal ? [currentTerminal] : [])
        const fallbackTerminals = getOrderedTerminalKeys(Object.keys(nextSummaries))
        const nextVisibleTerminals = requestedTerminals.length > 0 ? requestedTerminals : fallbackTerminals
        const normalizedSummaries = nextVisibleTerminals.reduce((acc, terminalLabel) => {
          acc[terminalLabel] = nextSummaries[terminalLabel] || null
          return acc
        }, {})

        setData(currentData)
        setVisibleTerminals(nextVisibleTerminals)
        setTermSummaries(normalizedSummaries)

      } catch (err) {
        if (!isActive) return
        setData(null)
        setTermSummaries({})
        setVisibleTerminals([])
        setError(err?.data?.message || err?.message || 'Failed to fetch result')
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      isActive = false
    }
  }, [classValue, roll, terminal, section, session])

  const student = data?.student
  const studentPhotoUrl = student?.photo_url || student?.PhotoUrl || student?.photo || null
  const studentPassportPhotoUrl = useMemo(
    () => buildCloudinaryPassportPhotoUrl(studentPhotoUrl),
    [studentPhotoUrl]
  )
  const marks = useMemo(() => (
    Array.isArray(data?.marks) ? data.marks : []
  ), [data?.marks])
  const summary = data?.summary

  const fireToast = (type, title, message) => {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { type, title, message } }))
  }

  const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return null
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : null
  }

  const isAbsent = (value) => {
    return typeof value === 'string' && value.trim().toUpperCase() === 'AB'
  }

  const toDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') return '--'
    if (typeof value === 'string') return value.trim() || '--'
    return value
  }

  const getDivisionColor = (division) => {
    switch (division) {
      case 'First':
        return 'text-[#15803d]'
      case 'Second':
        return 'text-[#2563eb]'
      case 'Third':
        return 'text-[#7c3aed]'
      default:
        return 'text-[#475569]'
    }
  }

  const getRankSuffixFor = (rank) => {
    if (typeof rank !== 'number') return 'th'
    const mod100 = rank % 100
    if (mod100 >= 11 && mod100 <= 13) return 'th'
    switch (rank % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

  const getSectionRankFromSummary = (summaryRow) => {
    if (!summaryRow) return null
    return (
      summaryRow?.rank ??
      summaryRow?.class_section_rank ??
      summaryRow?.section_rank ??
      summaryRow?.rank_in_section ??
      summaryRow?.classSectionRank ??
      summaryRow?.sectionRank ??
      summaryRow?.section_position ??
      null
    )
  }

  const isTermAvailable = (terminalKey) => {
    return Boolean(termSummaries[terminalKey])
  }

  const getSummaryCellValue = (terminalKey, value, fallback = '--') => {
    if (!isTermAvailable(terminalKey)) return 'Result Not Found'
    if (value === undefined || value === null || value === '') return fallback
    return value
  }

  const getPublishedDateFromSummary = (summaryRow) => {
    if (!summaryRow) return null
    return (
      summaryRow?.published_date ??
      summaryRow?.publish_date ??
      summaryRow?.publishedDate ??
      summaryRow?.published_at ??
      summaryRow?.publishedAt ??
      summaryRow?.result_published_date ??
      null
    )
  }

  const getDisplayRank = (terminalKey) => {
    if (!isTermAvailable(terminalKey)) return 'Result Not Found'

    const summaryRank = getSectionRankFromSummary(termSummaries[terminalKey])
    if (typeof summaryRank === 'number' && Number.isFinite(summaryRank)) {
      return `${summaryRank}${getRankSuffixFor(summaryRank)}`
    }
    if (typeof summaryRank === 'string' && summaryRank.trim()) {
      const numericRank = Number(summaryRank)
      if (Number.isFinite(numericRank)) {
        return `${numericRank}${getRankSuffixFor(numericRank)}`
      }
      return summaryRank
    }
    return '--'
  }

  const formatDateLabel = (value) => {
    if (value === undefined || value === null || value === '') return '--'
    const parsedDate = new Date(value)
    if (Number.isNaN(parsedDate.getTime())) return String(value)
    return parsedDate.toLocaleDateString('en-IN')
  }

  const currentTerminalKey = normalizeTerminalLabel(params.terminal) || params.terminal
  const currentSummary = termSummaries[currentTerminalKey] ?? summary
  const currentPublishedDate = formatDateLabel(getPublishedDateFromSummary(currentSummary))
  const currentPercentageLabel = (
    currentSummary?.percentage !== undefined &&
    currentSummary?.percentage !== null &&
    currentSummary?.percentage !== ''
  )
    ? `${currentSummary.percentage}%`
    : '--'
  const currentRankLabel = getDisplayRank(currentTerminalKey)
  const studentRollLabel = toDisplayValue(student?.roll_no ?? student?.roll ?? params.roll)
  const currentTotalMarksLabel = toDisplayValue(currentSummary?.total_max_marks)
  const currentObtainedLabel = toDisplayValue(currentSummary?.total_obtained)
  const currentDivisionLabel = toDisplayValue(currentSummary?.division)

  const processedMarks = useMemo(() => {
    return marks.map((mark, idx) => {
      const subjectName = toDisplayValue(
        mark?.subject || mark?.subject_name || mark?.name || `Subject ${idx + 1}`
      )
      const subjectCode = String(mark?.code || mark?.subject_code || '').trim()

      const combinedRef = `${String(subjectName).toLowerCase()} ${subjectCode.toLowerCase()}`
      const drawingSubject =
        combinedRef.includes('drawing') ||
        subjectCode.toLowerCase() === 'dr' ||
        subjectCode.toLowerCase().startsWith('dr')

      const fullMarks = drawingSubject ? 50 : (toNumber(mark?.max_marks) ?? 100)
      const passMarks = drawingSubject ? 15 : 30

      const externalAbsent = isAbsent(mark?.external_marks)
      const internalAbsent = isAbsent(mark?.internal_marks)
      const totalAbsent = isAbsent(mark?.total_obtained)

      const externalNumeric = toNumber(mark?.external_marks)
      const internalNumeric = drawingSubject ? null : toNumber(mark?.internal_marks)
      const totalNumeric = toNumber(mark?.total_obtained)

      const markAbsent = totalAbsent || externalAbsent || (!drawingSubject && internalAbsent)

      const externalDisplay = externalAbsent ? 'AB' : toDisplayValue(externalNumeric)
      const internalDisplay = drawingSubject
        ? '--'
        : (internalAbsent ? 'AB' : toDisplayValue(internalNumeric))

      let obtainedDisplay = '--'
      let obtainedNumeric = null

      if (markAbsent) {
        obtainedDisplay = 'AB'
      } else if (totalNumeric !== null) {
        obtainedDisplay = totalNumeric
        obtainedNumeric = totalNumeric
      } else if (externalNumeric !== null || internalNumeric !== null) {
        const sum = (externalNumeric ?? 0) + (internalNumeric ?? 0)
        obtainedDisplay = sum
        obtainedNumeric = sum
      }

      let status = '--'
      if (obtainedDisplay === 'AB') {
        status = 'AB'
      } else if (typeof obtainedNumeric === 'number') {
        status = obtainedNumeric >= passMarks ? 'PASS' : 'FAIL'
      }

      return {
        key: `${subjectCode || 'sub'}-${idx}`,
        subjectName,
        fullMarks,
        passMarks,
        externalDisplay,
        internalDisplay,
        obtainedDisplay,
        status,
      }
    })
  }, [marks])

  const sessionLabel = toDisplayValue(
    student?.academic_year ||
    currentSummary?.academic_year ||
    params.session ||
    `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`
  )

  const downloadFileName = useMemo(() => {
    const safeName = String(student?.name || 'student')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    return `result-card-${params.classValue || 'class'}-${params.roll || 'roll'}-${safeName || 'student'}`
  }, [params.classValue, params.roll, student?.name])

  const studentInfoColumns = [
    [
      ['Name of Student', student?.name || '--'],
      ["Mother's Name", student?.mother_name || '--'],
      ["Father's Name", student?.father_name || '--'],
    ],
    [
      ['Roll No.', studentRollLabel],
      ['Class', student?.class ?? params.classValue ?? '--'],
      ['Section', student?.section ?? params.section ?? '--'],
    ],
  ]
  const performanceSummaryItems = [
    ['Total Marks', currentTotalMarksLabel],
    ['Marks Obtained', currentObtainedLabel],
    ['Percentage', currentPercentageLabel],
    ['Division', currentDivisionLabel],
    ['Rank', currentRankLabel],
    ['Published Date', currentPublishedDate],
  ]
  const canonicalPath = classSlug && rollNumber ? `/results/${classSlug}/roll-${rollNumber}` : '/result'

  const getStatusTextColor = (status) => {
    if (status === 'PASS') return 'text-[#047857]'
    if (status === 'FAIL') return 'text-[#be123c]'
    if (status === 'AB') return 'text-[#b45309]'
    return 'text-[#2b456f]'
  }

  const triggerBlobDownload = (blob, fileName) => {
    if (typeof window.navigator?.msSaveOrOpenBlob === 'function') {
      window.navigator.msSaveOrOpenBlob(blob, fileName)
      return
    }

    const fileUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1500)
  }

  const waitForCaptureAssets = async (rootNode) => {
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready
      } catch {
        // Ignore font readiness issues during capture.
      }
    }

    const images = Array.from(rootNode.querySelectorAll('img'))
    await Promise.all(images.map((image) => (
      new Promise((resolve) => {
        if (image.complete) {
          resolve()
          return
        }

        const done = () => resolve()
        image.addEventListener('load', done, { once: true })
        image.addEventListener('error', done, { once: true })
        window.setTimeout(done, 3000)
      })
    )))

    await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)))
  }

  const createHighQualityPdfBlob = async () => {
    const sourceCard = cardRef.current
    if (!sourceCard) {
      throw new Error('Result card not found.')
    }

    const { default: html2canvas } = await import('html2canvas')
    const sourceRect = sourceCard.getBoundingClientRect()
    const desktopCaptureWidth = 920
    const initialCaptureWidth = Math.max(Math.ceil(sourceRect.width), desktopCaptureWidth, 1)
    const exportHost = document.createElement('div')
    exportHost.className = 'pdf-export-host'
    exportHost.style.width = `${initialCaptureWidth}px`
    exportHost.style.minWidth = `${initialCaptureWidth}px`

    const clonedCard = sourceCard.cloneNode(true)
    clonedCard.classList.add('pdf-export-mode', 'pdf-capture-mode')
    clonedCard.style.width = `${initialCaptureWidth}px`
    clonedCard.style.minWidth = `${initialCaptureWidth}px`
    clonedCard.style.maxWidth = `${initialCaptureWidth}px`
    clonedCard.style.margin = '0'
    exportHost.appendChild(clonedCard)
    document.body.appendChild(exportHost)

    try {
      await waitForCaptureAssets(clonedCard)

      const measuredRect = clonedCard.getBoundingClientRect()
      const captureWidth = Math.max(
        Math.ceil(measuredRect.width || 0),
        Math.ceil(clonedCard.scrollWidth || 0),
        Math.ceil(clonedCard.offsetWidth || 0),
        1
      )
      const captureHeight = Math.max(
        Math.ceil(clonedCard.scrollHeight || 0),
        Math.ceil(clonedCard.offsetHeight || 0),
        Math.ceil(measuredRect.height || 0),
        1
      )
      exportHost.style.width = `${captureWidth}px`
      exportHost.style.minWidth = `${captureWidth}px`
      exportHost.style.height = `${captureHeight}px`

      const captureScale = Math.min(4, Math.max(window.devicePixelRatio || 1, 3))
      const captureViewportWidth = Math.max(
        Math.round(window.innerWidth || 0),
        Math.round(document.documentElement?.clientWidth || 0),
        captureWidth,
        1
      )
      const captureViewportHeight = Math.max(
        Math.round(window.innerHeight || 0),
        captureHeight,
        1
      )
      const canvas = await html2canvas(clonedCard, {
        scale: captureScale,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: captureWidth,
        height: captureHeight,
        windowWidth: captureViewportWidth,
        windowHeight: captureViewportHeight,
        scrollX: 0,
        scrollY: 0,
      })

      if (!canvas.width || !canvas.height) {
        throw new Error('Unable to capture result card for PDF.')
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
        compress: true,
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const renderSidePadding = 14
      const renderY = 12
      const renderBottomPadding = 16
      const renderWidthLimit = pageWidth - (renderSidePadding * 2)
      const renderAreaHeight = pageHeight - renderY - renderBottomPadding

      const renderX = renderSidePadding
      const pixelsPerPoint = canvas.width / renderWidthLimit
      const maxSliceHeight = Math.max(Math.floor(renderAreaHeight * pixelsPerPoint), 1)

      let sourceY = 0
      let pageIndex = 0

      while (sourceY < canvas.height) {
        const sliceHeight = Math.min(maxSliceHeight, canvas.height - sourceY)
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = sliceHeight

        const sliceContext = sliceCanvas.getContext('2d')
        if (!sliceContext) {
          throw new Error('Unable to prepare PDF page.')
        }

        sliceContext.fillStyle = '#ffffff'
        sliceContext.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
        sliceContext.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        )

        const renderHeight = sliceHeight / pixelsPerPoint
        if (pageIndex > 0) {
          doc.addPage()
        }

        doc.addImage(sliceCanvas, 'PNG', renderX, renderY, renderWidthLimit, renderHeight, undefined, 'FAST')
        sourceY += sliceHeight
        pageIndex += 1
      }

      return doc.output('blob')
    } finally {
      document.body.removeChild(exportHost)
    }
  }

  const handleDownloadPdf = async () => {
    if (!data || pdfBusy) return

    setPdfBusy(true)
    try {
      const pdfBlob = await createHighQualityPdfBlob()
      triggerBlobDownload(pdfBlob, `${downloadFileName}.pdf`)
      fireToast('success', 'Download', 'High-quality PDF downloaded.')
    } catch (err) {
      console.error('PDF download failed:', err)
      const message = err?.message ? `Unable to download PDF. ${err.message}` : 'Unable to download PDF.'
      fireToast('error', 'Download', message)
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <WebsiteLayout>
      <SEO
        title="Student Result"
        description="Secure published result card for Gyanoday Public School students."
        keywords={SCHOOL_KEYWORDS}
        canonicalPath={canonicalPath}
        jsonLd={buildSchoolJsonLd({ path: canonicalPath })}
      />
      <div className="bg-white text-[#0f172a] overflow-x-hidden" style={{ fontFamily: "'Lexend', sans-serif" }}>
        <header className="no-print relative z-30 border-b border-[#e2e8f0] bg-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0">
           
          </div>

          <div className="relative z-40 flex flex-wrap items-center gap-2 pointer-events-auto">
            <Link
              to="/results-portal"
              className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-bold text-[#334155] hover:bg-[#f8fafc]"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              New Search
            </Link>
            {data ? (
              <>
                <button
                  type="button"
                  disabled={pdfBusy}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    handleDownloadPdf()
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#9b2335] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#9b2335]/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-sm">{pdfBusy ? 'hourglass_top' : 'picture_as_pdf'}</span>
                  {pdfBusy ? 'Preparing PDF...' : 'Download PDF'}
                </button>
              </>
            ) : null}
           
            
          </div>
        </div>
      </header>

        <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <div className="bg-white border border-[#e2e8f0] p-4 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#c79843]">badge</span>
              <div>
                <p className="text-sm font-bold">Class {params.classValue || '--'} | Roll {params.roll || '--'}</p>
                <p className="text-xs text-[#64748b]">
                  Terminal: <span className="font-bold">{params.terminal || '--'}</span>
                  {params.section ? (
                    <>
                      {' '}
                      | Section: <span className="font-bold">{params.section}</span>
                    </>
                  ) : null}
                  {params.session ? (
                    <>
                      {' '}
                      | Session: <span className="font-bold">{params.session}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
            {currentSummary?.status ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 border border-[#cbd5df] bg-white text-[#244f97]">
                <span className="material-symbols-outlined text-sm">verified</span>
                {currentSummary.status}
              </span>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-[#e2e8f0] p-6">
            <div className="flex items-center gap-2 text-[#475569]">
              <span className="material-symbols-outlined animate-spin">sync</span>
              <span className="text-sm font-bold">Fetching result...</span>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="bg-[#fef2f2] border border-[#fecaca] p-4">
            <p className="text-sm font-bold text-[#b91c1c]">{error}</p>
            <p className="text-xs text-[rgba(220,38,38,0.8)] mt-1">
              Please verify details and ensure result is published for the selected terminal.
            </p>
          </div>
        ) : null}

        {(!loading && !error && data) && (
          <>
            <div className="print-card-only">
              <div
                ref={cardRef}
                data-result-card-capture="true"
                className="result-print print-card relative overflow-hidden border border-[#98a5b3] bg-white text-[12px] leading-[1.3] text-[#1d2630] sm:text-[13px]"
                style={{ width: '100%', maxWidth: '920px', margin: '0 auto' }}
              >
                <div className="px-3 py-3 sm:px-4 sm:py-4">
                  <div
                    className="border-b border-[#aebccc] px-1 pb-3 sm:px-2 sm:pb-4"
                    style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 70%, #f2f7fd 100%)' }}
                  >
                    <div className="grid gap-2.5 sm:grid-cols-[82px_minmax(0,1fr)_82px] sm:items-center sm:gap-4">
                      <div className="mx-auto w-fit sm:mx-0 sm:justify-self-start">
                        <div
                          className="flex h-[64px] w-[64px] items-center justify-center rounded-full border-[2px] border-[#c8a15f] bg-[#f7eed7] p-1.5 shadow-[inset_0_0_0_4px_rgba(255,255,255,0.94)] sm:h-[78px] sm:w-[78px]"
                          style={{ background: 'radial-gradient(circle at top, #fffdf7 0%, #f8eed8 58%, #eed7a7 100%)' }}
                        >
                          <img src={schoolLogo} alt="School logo" loading="lazy" decoding="async" className="h-full w-full rounded-full bg-white object-contain p-1" />
                        </div>
                      </div>

                      <div className="min-w-0 text-center sm:px-1">
                        {/* <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#6a7f95] sm:text-[11px]">
                          Academic Report
                        </p> */}
                        <h1
                          className="result-school-title mx-auto mt-1.5 max-w-[760px] text-[20px] font-black uppercase leading-[1.1] tracking-[0.05em] text-[#12284b] sm:text-[32px]"
                          style={{ fontFamily: "'Baskerville Old Face', 'Book Antiqua', 'Palatino Linotype', 'Georgia', serif" }}
                        >
                          {SCHOOL_NAME}
                        </h1>
                        <p className="mx-auto mt-2 max-w-[640px] text-[9px] font-semibold text-[#4c6175] sm:mt-2.5 sm:text-[11px]">
                          {SCHOOL_ADDRESS}
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#203754] sm:text-[14px]">
                            {data.terminal} Examination Result
                          </p>
                          <p className="text-[10px] font-bold text-[#4f6374] sm:text-[12px]">
                            Academic Session : {sessionLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-center sm:justify-self-end">
                        <div className="flex h-[126px] w-[96px] items-center justify-center rounded-[10px] border border-[#c8d3df] bg-white p-0.5 shadow-[0_0_0_1px_rgba(0,0,0,0.02)] sm:h-[138px] sm:w-[106px]">
                          {studentPassportPhotoUrl ? (
                            <div className="relative h-full w-full overflow-hidden rounded-[8px] bg-white">
                              <img
                                src={studentPhotoUrl}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                decoding="async"
                                className="student-result-photo-bg absolute inset-0 h-full w-full"
                              />
                              <img
                                src={studentPassportPhotoUrl}
                                alt={`${student?.name || 'Student'} photo`}
                                loading="lazy"
                                decoding="async"
                                className="student-result-photo relative z-10 h-full w-full"
                              />
                            </div>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-[#f1f5f9] text-[10px] font-black uppercase tracking-[0.12em] text-[#64748b]">
                              Photo
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  

                    <div className="mt-3 border border-[#c8d3df] bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-[#c7d0d8]">
                        {studentInfoColumns.map((column, columnIndex) => (
                          <div key={columnIndex === 0 ? 'student-left' : 'student-right'} className={columnIndex === 1 ? 'border-t border-[#c7d0d8] md:border-t-0' : ''}>
                            {column.map(([label, value]) => (
                              <div key={label} className="grid grid-cols-[108px_10px_minmax(0,1fr)] border-b border-[#d8dee4] px-2 py-1.5 text-[10px] last:border-b-0 sm:grid-cols-[128px_12px_minmax(0,1fr)] sm:px-3 sm:py-2 sm:text-[12px]">
                                <div className="font-black text-[#2d4054]">{label}</div>
                                <div className="font-black text-[#566b7f]">:</div>
                                <div className="font-bold text-[#1d2732]">{toDisplayValue(value)}</div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 overflow-hidden border border-[#c8d3df] bg-white">
                      <div className="flex flex-col gap-1 border-b border-[#c8d3df] bg-[#edf4fb] px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-3">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#213549] sm:text-[12px]">Scholastic Areas</h3>
                        <div className="flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-[0.06em] text-[#4f6376] sm:text-[10px]">
                          <span>Subjects : {processedMarks.length}</span>
                          <span>Pass : 30</span>
                          <span>Drawing Pass : 15</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[690px] border-collapse border-spacing-0 text-[10px] sm:text-[11px]">
                          <thead>
                            <tr className="bg-[#f6f9fc] text-[#213446]">
                              <th className="border border-[#d2dbe5] px-2.5 py-2 text-left font-black uppercase tracking-[0.06em]">Subject</th>
                              <th className="border border-[#d2dbe5] px-2 py-2 text-center font-black uppercase tracking-[0.06em]">FM</th>
                              <th className="border border-[#d2dbe5] px-2 py-2 text-center font-black uppercase tracking-[0.06em]">Pass</th>
                              <th className="border border-[#d2dbe5] px-2 py-2 text-center font-black uppercase tracking-[0.06em]">Ext</th>
                              <th className="border border-[#d2dbe5] px-2 py-2 text-center font-black uppercase tracking-[0.06em]">Int</th>
                              <th className="border border-[#d2dbe5] px-2 py-2 text-center font-black uppercase tracking-[0.06em]">Total</th>
                              <th className="border border-[#d2dbe5] px-2 py-2 text-center font-black uppercase tracking-[0.06em]">Result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {processedMarks.length === 0 && (
                              <tr>
                                <td colSpan={7} className="py-6 text-center font-medium text-[#475569]">No marks available</td>
                              </tr>
                            )}

                            {processedMarks.map((m, idx) => (
                              <tr key={m.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fafcff]'}>
                                <td className="border border-[#d5dde6] px-2.5 py-2 font-bold uppercase text-[#1e2b37]">{m.subjectName}</td>
                                <td className="border border-[#d5dde6] px-2 py-2 text-center font-semibold">{m.fullMarks}</td>
                                <td className="border border-[#d5dde6] px-2 py-2 text-center font-semibold">{m.passMarks}</td>
                                <td className="border border-[#d5dde6] px-2 py-2 text-center font-semibold">{m.externalDisplay}</td>
                                <td className="border border-[#d5dde6] px-2 py-2 text-center font-semibold">{m.internalDisplay}</td>
                                <td className="border border-[#d5dde6] px-2 py-2 text-center font-black text-[#233f5f]">{m.obtainedDisplay}</td>
                                <td className={`border border-[#d5dde6] px-2 py-2 text-center font-black ${getStatusTextColor(m.status)}`}>{m.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-2 overflow-x-auto border border-[#c8d3df] bg-white">
                      <table className="w-full min-w-[640px] border-collapse border-spacing-0 text-[10px] sm:text-[11px]">
                        <tbody>
                          <tr>
                            {performanceSummaryItems.map(([label, value]) => (
                              <td key={label} className="border border-[#d5dde6] px-2 py-2 text-center align-middle">
                                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#617487] sm:text-[9px]">{label}</p>
                                <p className="mt-0.5 text-[11px] font-black text-[#1e2c3a] sm:text-[13px]">{value}</p>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 overflow-hidden border border-[#c8d3df] bg-white">
                      <div className="flex flex-col gap-1 border-b border-[#c8d3df] bg-[#edf4fb] px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-3">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#213549] sm:text-[12px]">Summary Report</h3>
                        <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-[#4f6376] sm:text-[10px]">Rank Scope : Class + Section</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] border-collapse border-spacing-0 text-[10px] sm:text-[11px]">
                          <thead>
                            <tr className="bg-[#f6f9fc] text-[#213446]">
                              <th className="border border-[#d2dbe5] px-2.5 py-2 text-left font-black uppercase tracking-[0.06em]">Metric</th>
                              {visibleTerminals.map((t) => (
                                <th key={t} className="border border-[#d2dbe5] px-2 py-2 text-center font-black uppercase tracking-[0.06em]">{t} Term</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white">
                              <td className="border border-[#d5dde6] px-2.5 py-2 font-black uppercase text-[#213446]">Total Marks</td>
                              {visibleTerminals.map((t) => (
                                <td key={t} className="border border-[#d5dde6] px-2 py-2 text-center font-semibold text-[#2a3d59]">
                                  {getSummaryCellValue(t, termSummaries[t]?.total_max_marks)}
                                </td>
                              ))}
                            </tr>
                            <tr className="bg-[#fafcff]">
                              <td className="border border-[#d5dde6] px-2.5 py-2 font-black uppercase text-[#213446]">Marks Obtained</td>
                              {visibleTerminals.map((t) => (
                                <td key={t} className="border border-[#d5dde6] px-2 py-2 text-center font-black text-[#1f406f]">
                                  {getSummaryCellValue(t, termSummaries[t]?.total_obtained)}
                                </td>
                              ))}
                            </tr>
                            <tr className="bg-white">
                              <td className="border border-[#d5dde6] px-2.5 py-2 font-black uppercase text-[#213446]">Percentage</td>
                              {visibleTerminals.map((t) => (
                                <td key={t} className={`border border-[#d5dde6] px-2 py-2 text-center font-black ${getDivisionColor(termSummaries[t]?.division)}`}>
                                  {getSummaryCellValue(
                                    t,
                                    typeof termSummaries[t]?.percentage !== 'undefined' && termSummaries[t]?.percentage !== null
                                      ? `${termSummaries[t].percentage}%`
                                      : '--'
                                  )}
                                </td>
                              ))}
                            </tr>
                            <tr className="bg-[#fafcff]">
                              <td className="border border-[#d5dde6] px-2.5 py-2 font-black uppercase text-[#213446]">Division</td>
                              {visibleTerminals.map((t) => (
                                <td key={t} className={`border border-[#d5dde6] px-2 py-2 text-center font-black ${getDivisionColor(termSummaries[t]?.division)}`}>
                                  {getSummaryCellValue(t, termSummaries[t]?.division)}
                                </td>
                              ))}
                            </tr>
                            <tr className="bg-white">
                              <td className="border border-[#d5dde6] px-2.5 py-2 font-black uppercase text-[#213446]">Class &amp; Section Rank</td>
                              {visibleTerminals.map((t) => (
                                <td key={t} className="border border-[#d5dde6] px-2 py-2 text-center font-black text-[#2b456f]">
                                  {getDisplayRank(t)}
                                </td>
                              ))}
                            </tr>
                            <tr className="bg-[#fafcff]">
                              <td className="border border-[#d5dde6] px-2.5 py-2 font-black uppercase text-[#213446]">Published Date</td>
                              {visibleTerminals.map((t) => {
                                const publishedDate = getPublishedDateFromSummary(termSummaries[t])
                                return (
                                  <td key={t} className="border border-[#d5dde6] px-2 py-2 text-center font-semibold text-[#2a3d59]">
                                    {isTermAvailable(t) ? (
                                      publishedDate 
                                        ? new Date(publishedDate).toLocaleDateString('en-IN')
                                        : '--'
                                    ) : (
                                      'Result Not Found'
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="result-instructions-sign mt-3 grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_236px]">
                      <div className="border border-[#c8d3df] bg-white px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#33485e] sm:text-[11px]">Instructions</p>
                        <div className="mt-1 space-y-1 text-[10px] leading-[1.4] text-[#324455] sm:text-[11px]">
                          <p>1. This is a computer-generated result marksheet for official school use.</p>
                          <p>2. The details shown here are based on official school records.</p>
                          <p>3. Any discrepancy should be reported within 7 days of result declaration.</p>
                          <p>4. AB denotes absent and NA denotes not applicable.</p>
                          <p>5. Pass Marks: 30 for regular subjects and 15 for Drawing.</p>
                          <p>6. Rank displayed above is calculated class and section wise.</p>
                        </div>
                      </div>

                      <div className="border border-[#c8d3df] bg-white px-2.5 py-2.5">
                        <div className="flex min-h-[136px] items-end justify-center sm:min-h-[156px]">
                          <div className="w-full max-w-[168px] text-center text-[9px] font-black uppercase tracking-[0.08em] text-[#516579] sm:text-[10px]">
                            <div className="mb-2 flex justify-center">
                              <img
                                src={schoolLogo}
                                alt="Temporary principal sign and stamp placeholder"
                                loading="lazy"
                                decoding="async"
                                className="h-[78px] w-[78px] rounded-full border border-[#d7e0e8] bg-[#f8fbff] p-1.5 object-cover opacity-80 sm:h-[92px] sm:w-[92px]"
                              />
                            </div>
                            <div className="h-7 border-b border-[#73879b]" />
                            <p className="mt-1">Principal Sign &amp; Stamp</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-[#bcc8d2] pt-2 text-center text-[8px] font-black uppercase tracking-[0.12em] text-[#5a6f82] sm:text-[9px]">
                      {SCHOOL_NAME} | {SCHOOL_ADDRESS}
                    </div>
                </div>
              </div>
            </div>
          </>
        )}
        </main>
      </div>
    </WebsiteLayout>
  )
}

export default Results
