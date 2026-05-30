import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import jsPDF from 'jspdf'
import { getStudentResultPublic } from '../../Api/marks'
import schoolLogo from '../../assets/logo.png'
import stampcert from '../../assets/stampcert.png'
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
  const SCHOOL_NAME = import.meta.env.VITE_SCHOOL_NAME || 'Star Public School'
  const SCHOOL_ADDRESS = import.meta.env.VITE_SCHOOL_ADDRESS || 'Meghwal mathia Bazar, West Champaran, Bihar 845106'
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
  const studentPhotoUrl =
    student?.photo_url ||
    student?.PhotoUrl ||
    student?.photo ||
    data?.studentDetails?.photoUrl ||
    data?.studentDetails?.photo_url ||
    null
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

  const createResultCardCanvas = async () => {
    const sourceCard = cardRef.current
    if (!sourceCard) {
      throw new Error('Result card not found.')
    }

    const { default: html2canvas } = await import('html2canvas')
    const exportCaptureWidth = 920
    const initialCaptureWidth = exportCaptureWidth
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

      const captureScale = 4
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
        allowTaint: false,
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
        throw new Error('Unable to capture result card.')
      }

      return canvas
    } finally {
      document.body.removeChild(exportHost)
    }
  }

  const createHighQualityPdfBlob = async () => {
    const canvas = await createResultCardCanvas()

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: false,
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const renderSidePadding = 10
    const renderTopPadding = 10
    const renderBottomPadding = 10
    const renderWidthLimit = pageWidth - (renderSidePadding * 2)
    const renderHeightLimit = pageHeight - renderTopPadding - renderBottomPadding
    const fitScale = Math.min(renderWidthLimit / canvas.width, renderHeightLimit / canvas.height)
    const renderWidth = canvas.width * fitScale
    const renderHeight = canvas.height * fitScale
    const renderX = (pageWidth - renderWidth) / 2
    const renderY = (pageHeight - renderHeight) / 2

    doc.addImage(canvas, 'PNG', renderX, renderY, renderWidth, renderHeight, undefined, 'SLOW')

    return doc.output('blob')
  }

  const createHighQualityPngBlob = async () => {
    const canvas = await createResultCardCanvas()
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Unable to create PNG image.'))
        }
      }, 'image/png')
    })
  }

  const handleDownloadPng = async () => {
    if (!data || pdfBusy) return

    setPdfBusy(true)
    try {
      const pngBlob = await createHighQualityPngBlob()
      triggerBlobDownload(pngBlob, `${downloadFileName}.png`)
      fireToast('success', 'Download', 'Exact PNG downloaded.')
    } catch (err) {
      console.error('PNG download failed:', err)
      const message = err?.message ? `Unable to download PNG. ${err.message}` : 'Unable to download PNG.'
      fireToast('error', 'Download failed', message)
    } finally {
      setPdfBusy(false)
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
        description="Secure published result card for Star Public School students."
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
                <button
                  type="button"
                  disabled={pdfBusy}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    handleDownloadPng()
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#061b66] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#061b66]/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-sm">{pdfBusy ? 'hourglass_top' : 'image'}</span>
                  {pdfBusy ? 'Preparing...' : 'Download PNG'}
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
                className="result-print result-card-exact print-card relative overflow-hidden bg-white text-[12px] leading-[1.3] text-[#06154b] sm:text-[13px]"
                style={{ width: '100%', maxWidth: '920px', margin: '0 auto' }}
              >
                <div className="result-card-inner px-3 py-3 sm:px-4 sm:py-4">
                  <div
                    className="result-card-header px-1 pb-3 sm:px-2 sm:pb-4"
                  >
                    <div className="grid gap-2.5 sm:grid-cols-[148px_minmax(0,1fr)_148px] sm:items-start sm:gap-4">
                      <div className="mx-auto w-fit sm:mx-0 sm:justify-self-start">
                        <div
                          className="result-logo-ring flex h-[92px] w-[92px] items-center justify-center rounded-full p-1.5 sm:h-[132px] sm:w-[132px]"
                        >
                          <img src={schoolLogo} alt="School logo" loading="lazy" decoding="async" className="h-full w-full rounded-full bg-white object-contain p-1" />
                        </div>
                      </div>

                      <div className="min-w-0 text-center sm:px-1">
                        <h1
                          className="result-school-title mx-auto mt-1.5 max-w-[760px] text-[24px] font-black uppercase leading-[1.05] tracking-[0.03em] text-[#061b66] sm:text-[43px]"
                          style={{ fontFamily: "'Baskerville Old Face', 'Book Antiqua', 'Palatino Linotype', 'Georgia', serif" }}
                        >
                          {SCHOOL_NAME}
                        </h1>
                        <p className="mx-auto mt-2 max-w-[660px] text-[10px] font-semibold text-[#061b66] sm:mt-2.5 sm:text-[14px]">
                          {SCHOOL_ADDRESS}
                        </p>
                        <div className="mt-4 space-y-1">
                          <p className="text-[14px] font-black uppercase tracking-[0.08em] text-[#061b66] sm:text-[25px]">
                            {data.terminal} Examination Result
                          </p>
                          <p className="text-[12px] font-bold text-[#061b66] sm:text-[18px]">
                            Academic Session : {sessionLabel}
                          </p>
                          <div className="result-title-rule mx-auto mt-2" />
                        </div>
                      </div>

                      <div className="flex justify-center sm:justify-self-end">
                        <div className="result-student-photo-box">
                          {studentPassportPhotoUrl ? (
                            <img
                              src={studentPassportPhotoUrl}
                              alt={`${student?.name || 'Student'} photo`}
                              crossOrigin="anonymous"
                              loading="eager"
                              decoding="async"
                              className="result-student-photo"
                            />
                          ) : (
                            <div className="result-photo-placeholder">
                              Photo
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  

                    <div className="mt-3 overflow-hidden rounded-[4px] border border-[#0a2b78] bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-[#0a2b78]">
                        {studentInfoColumns.map((column, columnIndex) => (
                          <div key={columnIndex === 0 ? 'student-left' : 'student-right'} className={columnIndex === 1 ? 'border-t border-[#0a2b78] md:border-t-0' : ''}>
                            {column.map(([label, value]) => (
                              <div key={label} className="grid grid-cols-[118px_14px_minmax(0,1fr)] border-b border-[#9bb0d3] px-3 py-2 text-[11px] last:border-b-0 sm:grid-cols-[150px_18px_minmax(0,1fr)] sm:px-4 sm:py-2.5 sm:text-[16px]">
                                <div className="font-black text-[#061b66]">{label}</div>
                                <div className="font-black text-[#061b66]">:</div>
                                <div className="font-bold text-black">{toDisplayValue(value)}</div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 overflow-hidden rounded-[4px] border border-[#0a2b78] bg-white">
                      <div className="result-section-bar flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-[13px] font-black uppercase tracking-[0.06em] text-white sm:text-[18px]">Scholastic Areas</h3>
                        <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-[0.04em] text-white sm:text-[13px]">
                          <span>Subjects : {processedMarks.length}</span>
                          <span>Pass : 30</span>
                          <span>Drawing Pass : 15</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="result-data-table w-full min-w-[690px] border-collapse border-spacing-0 text-[11px] sm:text-[16px]">
                          <thead>
                            <tr className="bg-[#f8fbff] text-[#061b66]">
                              <th className="border border-[#9bb0d3] px-3 py-2.5 text-left font-black uppercase tracking-[0.06em]">Subject</th>
                              <th className="border border-[#9bb0d3] px-2 py-2.5 text-center font-black uppercase tracking-[0.06em]">FM</th>
                              <th className="border border-[#9bb0d3] px-2 py-2.5 text-center font-black uppercase tracking-[0.06em]">Pass</th>
                              <th className="border border-[#9bb0d3] px-2 py-2.5 text-center font-black uppercase tracking-[0.06em]">Ext</th>
                              <th className="border border-[#9bb0d3] px-2 py-2.5 text-center font-black uppercase tracking-[0.06em]">Int</th>
                              <th className="border border-[#9bb0d3] px-2 py-2.5 text-center font-black uppercase tracking-[0.06em]">Total</th>
                              <th className="border border-[#9bb0d3] px-2 py-2.5 text-center font-black uppercase tracking-[0.06em]">Result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {processedMarks.length === 0 && (
                              <tr>
                                <td colSpan={7} className="py-6 text-center font-medium text-[#475569]">No marks available</td>
                              </tr>
                            )}

                            {processedMarks.map((m, idx) => (
                              <tr key={m.key} className="bg-white">
                                <td className="border border-[#9bb0d3] px-3 py-2 font-bold uppercase text-black">{m.subjectName}</td>
                                <td className="border border-[#9bb0d3] px-2 py-2 text-center font-semibold text-black">{m.fullMarks}</td>
                                <td className="border border-[#9bb0d3] px-2 py-2 text-center font-semibold text-black">{m.passMarks}</td>
                                <td className="border border-[#9bb0d3] px-2 py-2 text-center font-semibold text-black">{m.externalDisplay}</td>
                                <td className="border border-[#9bb0d3] px-2 py-2 text-center font-semibold text-black">{m.internalDisplay}</td>
                                <td className="border border-[#9bb0d3] px-2 py-2 text-center font-black text-[#061b66]">{m.obtainedDisplay}</td>
                                <td className={`border border-[#9bb0d3] px-2 py-2 text-center font-black ${getStatusTextColor(m.status)}`}>{m.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-3 overflow-x-auto rounded-[4px] border border-[#0a2b78] bg-white">
                      <table className="w-full min-w-[640px] border-collapse border-spacing-0 text-[10px] sm:text-[15px]">
                        <tbody>
                          <tr>
                            {performanceSummaryItems.map(([label, value]) => (
                              <td key={label} className="border border-[#9bb0d3] px-2 py-2.5 text-center align-middle">
                                <p className="text-[8px] font-black uppercase tracking-[0.08em] text-[#061b66] sm:text-[12px]">{label}</p>
                                <p className="mt-1 text-[14px] font-black text-[#061b66] sm:text-[21px]">{value}</p>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 overflow-hidden rounded-[4px] border border-[#0a2b78] bg-white">
                      <div className="result-section-bar flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-[13px] font-black uppercase tracking-[0.06em] text-white sm:text-[18px]">Summary Report</h3>
                        <span className="text-[10px] font-black uppercase tracking-[0.04em] text-white sm:text-[13px]">Rank Scope : Class + Section</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] border-collapse border-spacing-0 text-[11px] sm:text-[15px]">
                          <thead>
                            <tr className="bg-[#f8fbff] text-[#061b66]">
                              <th className="border border-[#9bb0d3] px-3 py-2 text-left font-black uppercase tracking-[0.06em]">Metric</th>
                              {visibleTerminals.map((t) => (
                                <th key={t} className="border border-[#9bb0d3] px-2 py-2 text-center font-black uppercase tracking-[0.06em]">{t} Term</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white">
                              <td className="border border-[#9bb0d3] px-3 py-2 font-black uppercase text-[#061b66]">Total Marks</td>
                              {visibleTerminals.map((t) => (
                                <td key={t} className="border border-[#9bb0d3] px-2 py-2 text-center font-black text-[#061b66]">
                                  {getSummaryCellValue(t, termSummaries[t]?.total_max_marks)}
                                </td>
                              ))}
                            </tr>
                            <tr className="bg-[#fafcff]">
                              <td className="border border-[#9bb0d3] px-3 py-2 font-black uppercase text-[#061b66]">Marks Obtained</td>
                              {visibleTerminals.map((t) => (
                                <td key={t} className="border border-[#9bb0d3] px-2 py-2 text-center font-black text-[#061b66]">
                                  {getSummaryCellValue(t, termSummaries[t]?.total_obtained)}
                                </td>
                              ))}
                            </tr>
                            <tr className="bg-white">
                              <td className="border border-[#9bb0d3] px-3 py-2 font-black uppercase text-[#061b66]">Percentage</td>
                              {visibleTerminals.map((t) => (
                                <td key={t} className={`border border-[#9bb0d3] px-2 py-2 text-center font-black ${getDivisionColor(termSummaries[t]?.division)}`}>
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
                              <td className="border border-[#9bb0d3] px-3 py-2 font-black uppercase text-[#061b66]">Division</td>
                              {visibleTerminals.map((t) => (
                                <td key={t} className={`border border-[#9bb0d3] px-2 py-2 text-center font-black ${getDivisionColor(termSummaries[t]?.division)}`}>
                                  {getSummaryCellValue(t, termSummaries[t]?.division)}
                                </td>
                              ))}
                            </tr>
                            <tr className="bg-white">
                              <td className="border border-[#9bb0d3] px-3 py-2 font-black uppercase text-[#061b66]">Class &amp; Section Rank</td>
                              {visibleTerminals.map((t) => (
                                <td key={t} className="border border-[#9bb0d3] px-2 py-2 text-center font-black text-[#061b66]">
                                  {getDisplayRank(t)}
                                </td>
                              ))}
                            </tr>
                            <tr className="bg-[#fafcff]">
                              <td className="border border-[#9bb0d3] px-3 py-2 font-black uppercase text-[#061b66]">Published Date</td>
                              {visibleTerminals.map((t) => {
                                const publishedDate = getPublishedDateFromSummary(termSummaries[t])
                                return (
                                  <td key={t} className="border border-[#9bb0d3] px-2 py-2 text-center font-semibold text-[#061b66]">
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

                    <div className="result-instructions-sign mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
                      <div className="rounded-[4px] border border-[#0a2b78] bg-white px-5 py-3">
                        <p className="text-[14px] font-black uppercase tracking-[0.08em] text-[#061b66] sm:text-[19px]">Instructions</p>
                        <div className="mt-3 space-y-2 text-[11px] leading-[1.35] text-black sm:text-[14px]">
                          <p>1. This is a computer-generated result marksheet for official school use.</p>
                          <p>2. The details shown here are based on official school records.</p>
                          <p>3. Any discrepancy should be reported within 7 days of result declaration.</p>
                          <p>4. AB denotes absent and NA denotes not applicable.</p>
                          <p>5. Pass Marks: 30 for regular subjects and 15 for Drawing.</p>
                          <p>6. Rank displayed above is calculated class and section wise.</p>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-[4px] border border-[#0a2b78] bg-white">
                        <p className="border-b border-[#9bb0d3] px-3 py-2 text-center text-[13px] font-black uppercase tracking-[0.08em] text-[#061b66] sm:text-[17px]">Principal Sign &amp; Stamp</p>
                        <div className="flex min-h-[144px] items-end justify-center px-5 py-3 sm:min-h-[174px]">
                          <div className="w-full max-w-[230px] text-center text-[11px] font-black uppercase tracking-[0.08em] text-[#061b66] sm:text-[15px]">
                            <div className="mb-2 flex justify-center">
                              <img
                                src={stampcert}
                                alt="Temporary principal sign and stamp placeholder"
                                loading="lazy"
                                decoding="async"
                                className="h-[86px] w-[86px] rounded-full border border-[#9bb0d3] bg-[#f8fbff] p-1.5 object-cover opacity-90 sm:h-[118px] sm:w-[118px]"
                              />
                            </div>
                            <div className="h-7 border-b-2 border-[#061b66]" />
                            <p className="mt-2">Principal Signature</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="result-card-footer mt-4 px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.09em] text-white sm:text-[14px]">
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
