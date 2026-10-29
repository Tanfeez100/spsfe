import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import jsPDF from 'jspdf'
import { getStudentResultPublic, uploadCachedResultPdfApi } from '../../Api/marks'
import schoolLogo from '../../assets/logo.png'
import stampcert from '../../assets/stampcert.png'
import SEO from '../../Components/SEO/SEO'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import { SCHOOL_KEYWORDS, buildSchoolJsonLd, parseClassSlug, parseRollSlug } from '../../seo/siteSeo'
import '../../styles/print.css'
import './Marksheet.css'
import MarksheetComponent from './MarksheetComponent'
import ExecutiveWaveDesign from '../../Components/DocumentTemplates/Marksheets/ResultDesigns/ExecutiveWaveDesign'
import ModernRibbonDesign from '../../Components/DocumentTemplates/Marksheets/ResultDesigns/ModernRibbonDesign'
import JuniorPlayfulDesign from '../../Components/DocumentTemplates/Marksheets/ResultDesigns/JuniorPlayfulDesign'
import CanvaThemeDesign from '../../Components/DocumentTemplates/Marksheets/ResultDesigns/CanvaThemeDesign'
import ClassicFormalDesign from '../../Components/DocumentTemplates/Marksheets/ResultDesigns/ClassicFormalDesign'

export const RESULT_THEMES = {
  orange: {
    id: 'orange',
    number: '5',
    name: '5. Orange (Bright & Friendly)',
    shortName: 'Orange',
    primary: '#9a3412',
    title: '#c2410c',
    border: '#ea580c',
    grid: '#fdba74',
    bgTint: '#fff7ed',
    bgAlt: '#fffaf5',
    barGrad: 'linear-gradient(90deg, #ea580c 0%, #f97316 48%, #ea580c 100%)',
    pillBg: '#fff7ed',
    pillBorder: '#ea580c',
    pillText: '#c2410c',
    dotColor: '#ea580c',
  },
  blue: {
    id: 'blue',
    number: '1',
    name: '1. Classic Blue (Original Style)',
    shortName: 'Classic Blue',
    primary: '#061b66',
    title: '#061b66',
    border: '#0a2b78',
    grid: '#9bb0d3',
    bgTint: '#f8fbff',
    bgAlt: '#fafcff',
    barGrad: 'linear-gradient(90deg, #061b66 0%, #082b86 48%, #061b66 100%)',
    pillBg: '#f0f4ff',
    pillBorder: '#061b66',
    pillText: '#061b66',
    dotColor: '#0a2b78',
  },
  green: {
    id: 'green',
    number: '2',
    name: '2. Green (Clean & Fresh)',
    shortName: 'Green',
    primary: '#14532d',
    title: '#15803d',
    border: '#15803d',
    grid: '#86efac',
    bgTint: '#f0fdf4',
    bgAlt: '#f7fee7',
    barGrad: 'linear-gradient(90deg, #15803d 0%, #16a34a 48%, #15803d 100%)',
    pillBg: '#f0fdf4',
    pillBorder: '#15803d',
    pillText: '#15803d',
    dotColor: '#16a34a',
  },
  maroon: {
    id: 'maroon',
    number: '3',
    name: '3. Maroon (Elegant)',
    shortName: 'Maroon',
    primary: '#7f1d1d',
    title: '#881337',
    border: '#991b1b',
    grid: '#fca5a5',
    bgTint: '#fef2f2',
    bgAlt: '#fff1f2',
    barGrad: 'linear-gradient(90deg, #881337 0%, #9f1239 48%, #881337 100%)',
    pillBg: '#fef2f2',
    pillBorder: '#991b1b',
    pillText: '#881337',
    dotColor: '#991b1b',
  },
  purple: {
    id: 'purple',
    number: '4',
    name: '4. Purple (Modern Look)',
    shortName: 'Purple',
    primary: '#581c87',
    title: '#6b21a8',
    border: '#6b21a8',
    grid: '#d8b4fe',
    bgTint: '#faf5ff',
    bgAlt: '#fdf4ff',
    barGrad: 'linear-gradient(90deg, #581c87 0%, #7e22ce 48%, #581c87 100%)',
    pillBg: '#faf5ff',
    pillBorder: '#6b21a8',
    pillText: '#6b21a8',
    dotColor: '#7e22ce',
  },
  teal: {
    id: 'teal',
    number: '6',
    name: '6. Teal (Professional)',
    shortName: 'Teal',
    primary: '#134e4a',
    title: '#0f766e',
    border: '#0f766e',
    grid: '#99f6e4',
    bgTint: '#f0fdfa',
    bgAlt: '#f2fbf9',
    barGrad: 'linear-gradient(90deg, #0f766e 0%, #0d9488 48%, #0f766e 100%)',
    pillBg: '#f0fdfa',
    pillBorder: '#0f766e',
    pillText: '#0f766e',
    dotColor: '#0d9488',
  },
  brown: {
    id: 'brown',
    number: '7',
    name: '7. Brown (Premium)',
    shortName: 'Brown',
    primary: '#451a03',
    title: '#78350f',
    border: '#78350f',
    grid: '#fde68a',
    bgTint: '#fefce8',
    bgAlt: '#fffbeb',
    barGrad: 'linear-gradient(90deg, #78350f 0%, #92400e 48%, #78350f 100%)',
    pillBg: '#fefce8',
    pillBorder: '#78350f',
    pillText: '#78350f',
    dotColor: '#92400e',
  },
  pink: {
    id: 'pink',
    number: '8',
    name: '8. Pink (Soft & Attractive)',
    shortName: 'Pink',
    primary: '#831843',
    title: '#be185d',
    border: '#be185d',
    grid: '#fbcfe8',
    bgTint: '#fdf2f8',
    bgAlt: '#fff1f2',
    barGrad: 'linear-gradient(90deg, #9d174d 0%, #be185d 48%, #9d174d 100%)',
    pillBg: '#fdf2f8',
    pillBorder: '#be185d',
    pillText: '#be185d',
    dotColor: '#db2777',
  },
}


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

const formatTerminalExamTitle = (terminal) => {
  const norm = String(terminal || '').trim().toLowerCase()
  if (norm === 'first') return 'FIRST TERMINAL EXAMINATION'
  if (norm === 'second') return 'SECOND TERMINAL EXAMINATION'
  if (norm === 'third') return 'THIRD TERMINAL EXAMINATION'
  if (norm === 'annual' || norm === 'final') return 'ANNUAL EXAMINATION'

  if (norm.includes('examination')) {
    return String(terminal).toUpperCase()
  }
  return `${String(terminal).toUpperCase()} EXAMINATION`
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
  const [selectedThemeKey, setSelectedThemeKey] = useState('orange')
  const [selectedDesign, setSelectedDesign] = useState('design2')
  const currentTheme = RESULT_THEMES[selectedThemeKey] || RESULT_THEMES.orange
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

  const getDisplaySummaryMetric = (terminalKey, metricKey) => {
    if (!isTermAvailable(terminalKey)) return 'Result Not Found'
    const row = termSummaries[terminalKey]
    if (!row) return '--'
    const val = row[metricKey]
    if (val === undefined || val === null || val === '') return '--'
    if (metricKey === 'percentage') return `${val}%`
    return toDisplayValue(val)
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

  const summaryReportTerminals = useMemo(() => {
    // Hide 'First' term from Summary Report as requested ("abhi ke liye First term ke marksheet me result summary me first term ke result hide kr do")
    return (visibleTerminals || []).filter((t) => {
      if (t === 'First') return false
      const s = termSummaries[t]
      if (s && Number(s.total_obtained || 0) === 0 && !s.published_date) return false
      return true
    })
  }, [visibleTerminals, termSummaries])

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

  const isAnnualExam = useMemo(() => {
    const t = String(data?.terminal || params.terminal || '').trim().toLowerCase()
    return t === 'annual' || t === 'final'
  }, [data?.terminal, params.terminal])

  const sessionDisplay = useMemo(() => {
    const raw = String(sessionLabel || '').trim()
    if (isAnnualExam) {
      return {
        label: 'Academic Session',
        text: raw,
      }
    }
    // Single calendar year for exams conducted within one year (e.g. 2026)
    const match = raw.match(/\b(20\d\d)\b/)
    const singleYear = match ? match[1] : (raw.split(/[-/]/)[0] || raw)
    return {
      label: 'Academic Year',
      text: singleYear,
    }
  }, [sessionLabel, isAnnualExam])

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
  const renderActiveDesign = () => {
    const commonProps = {
      data,
      student,
      studentRollLabel,
      params,
      sessionDisplay,
      schoolLogo,
      stampcert,
      studentPhotoUrl,
      processedMarks,
      currentTotalMarksLabel,
      currentObtainedLabel,
      currentPercentageLabel,
      currentDivisionLabel,
      currentRankLabel,
      currentPublishedDate,
      currentSummary,
      termSummaries,
      summaryReportTerminals,
      toDisplayValue,
      getDisplaySummaryMetric,
      getDisplayRank,
      getPublishedDateFromSummary,
      formatDateLabel,
      formatTerminalExamTitle,
      SCHOOL_NAME,
      SCHOOL_ADDRESS,
    }

    return <ExecutiveWaveDesign {...commonProps} />
  }


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

    const { default: html2canvas } = await import('html2canvas-pro')

    const targetWidth = 920
    const targetHeight = Math.round(targetWidth * (297 / 210)) // 1301px (Exact A4 proportion)

    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.left = '0'
    container.style.width = `${targetWidth}px`
    container.style.minWidth = `${targetWidth}px`
    container.style.maxWidth = `${targetWidth}px`
    container.style.zIndex = '-9999'
    container.style.pointerEvents = 'none'
    container.style.backgroundColor = '#ffffff'
    container.style.overflow = 'visible'

    const clone = sourceCard.cloneNode(true)
    clone.style.width = `${targetWidth}px`
    clone.style.minWidth = `${targetWidth}px`
    clone.style.maxWidth = `${targetWidth}px`
    clone.style.margin = '0'
    clone.style.boxShadow = 'none'
    clone.style.transform = 'none'

    const innerCard = clone.querySelector('.result-card-exact') || clone.firstElementChild || clone
    if (innerCard) {
      innerCard.style.width = `${targetWidth}px`
      innerCard.style.minHeight = `${targetHeight}px`
      innerCard.style.boxSizing = 'border-box'
    }

    const origImgs = sourceCard.querySelectorAll('img')
    const cloneImgs = clone.querySelectorAll('img')
    origImgs.forEach((orig, idx) => {
      if (cloneImgs[idx]) {
        cloneImgs[idx].src = orig.currentSrc || orig.src
        cloneImgs[idx].crossOrigin = 'anonymous'
      }
    })

    container.appendChild(clone)
    document.body.appendChild(container)

    await waitForCaptureAssets(clone)
    await new Promise((resolve) => setTimeout(resolve, 150))

    try {
      const captureWidth = targetWidth
      const captureHeight = Math.max(targetHeight, clone.offsetHeight || clone.scrollHeight || targetHeight)

      const canvas = await html2canvas(clone, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: captureWidth,
        height: captureHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
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
            } catch (_) {}
          })
        },
      })

      if (!canvas || !canvas.width || !canvas.height) {
        throw new Error('Unable to capture result card.')
      }

      return canvas
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container)
      }
    }
  }

  const createHighQualityPdfBlob = async () => {
    const canvas = await createResultCardCanvas()
    const imgData = canvas.toDataURL('image/png', 1.0)

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: true,
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Full A4 page coverage edge-to-edge
    doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST')

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

    // ⚡ 1. Check if we already have a cached PDF from Cloudinary / Storage
    const cachedUrl = data?.cached_pdf_url
    if (cachedUrl) {
      try {
        fireToast('info', 'Fast Download', 'Downloading pre-cached PDF from CDN...')
        let response = await fetch(cachedUrl)
        if (!response.ok && data?.cached_pdf_local) {
          const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
          const serverBase = apiBase.replace(/\/api\/?$/, '')
          response = await fetch(`${serverBase}${data.cached_pdf_local}`)
        }
        if (response.ok) {
          const blob = await response.blob()
          triggerBlobDownload(blob, `${downloadFileName}.pdf`)
          fireToast('success', 'Download', 'Instant PDF downloaded.')
          return
        }
      } catch (err) {
        console.warn('Direct cached PDF fetch failed, falling back to local render:', err)
      }
    }

    // ⚡ 2. First-time download: Render crisp 300 DPI PDF
    setPdfBusy(true)
    try {
      const pdfBlob = await createHighQualityPdfBlob()
      triggerBlobDownload(pdfBlob, `${downloadFileName}.pdf`)
      fireToast('success', 'Download', 'High-quality PDF downloaded.')

      // ⚡ 3. Background Caching: Upload to Cloudinary for all subsequent downloads
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64data = reader.result
          const uploadRes = await uploadCachedResultPdfApi({
            session: sessionDisplay.text || params.session || '2026-27',
            className: student?.class || params.classValue,
            section: student?.section || params.section || 'A',
            roll: student?.roll_no || params.roll,
            terminal: data?.terminal || params.terminal,
            student_id: student?.id,
            pdfBase64: base64data,
          })
          if (uploadRes?.data?.url) {
            data.cached_pdf_url = uploadRes.data.url
          }
        } catch (uploadErr) {
          console.warn('Background PDF cache upload skipped:', uploadErr)
        }
      }
      reader.readAsDataURL(pdfBlob)
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
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-bold text-[#061b66] hover:bg-[#f0f4ff] hover:border-[#bfdbfe]"
                title="Go to School Website Landing Page"
              >
                <span className="material-symbols-outlined text-sm">home</span>
                School Website
              </Link>
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
          <div className="print-card-only marksheet-page" style={{ padding: 0 }}>
            <div
              ref={cardRef}
              data-result-card-capture="true"
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              {renderActiveDesign()}
            </div>
          </div>
        )}
        </main>
      </div>
    </WebsiteLayout>
  )
}

export default Results
