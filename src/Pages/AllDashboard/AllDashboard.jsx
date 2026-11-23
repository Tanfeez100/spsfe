import React, { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import SEO from '../../Components/SEO/SEO'
import ResultView from '../../Components/ResultView/ResultView'
import Student from './Student'
import Subject from './Subject'
import UploadMarks from './UploadMarks'
import ClassPromotion from './ClassPromotion'
import UploadPhoto from '../../Components/UploadPhoto/UploadPhoto'
import FeeManager from '../Fees/FeeManager'
import { getFeeDashboard } from '../../Api/fees'
import { getExaminationsApi } from '../../Api/examinations'
import TeacherManagement from './TeacherManagement'
import AttendanceSystem from '../Attendance/AttendanceSystem'
import Sidebar from '../../Components/Sidebar'
import { getUser, getLoginType, getTeachers } from '../../Api/auth'
import { getAllStudents } from '../../Api/students'
import { getAllSubjects } from '../../Api/subjects'
import { getAttendanceBootstrap, getAttendanceRecords, getHolidayCalendar } from '../../Api/attendance'
import { normalizeSchoolClass, sortSchoolClasses } from '../../constants/schoolOptions'
import BatchIdCardGenerator from '../../Components/Student/BatchIdCardGenerator'
import DocumentManagement from '../DocumentManagement/DocumentManagement'
import ExaminationManagement from '../ExaminationManagement/ExaminationManagement'
import TimetableManagement from '../TimetableManagement/TimetableManagement'
import TeacherDashboardView from './TeacherDashboardView'
import HelpCenter from '../HelpCenter/HelpCenter'

function Dashboard({ initialView = 'dashboard' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const outletContext = useOutletContext() || {}
  const setSidebarOpen = outletContext.setSidebarOpen
  const sidebarOpen = outletContext.sidebarOpen

  const [activeView, setActiveView] = useState('dashboard')
  const [currentUser, setCurrentUser] = useState(null)
  const [loginType, setLoginType] = useState('all')

  // Real backend metrics
  const [realStudents, setRealStudents] = useState([])
  const [realHolidays, setRealHolidays] = useState([])
  const [realExams, setRealExams] = useState([])
  const [feeStats, setFeeStats] = useState({
    total_collected: 0,
    collected_this_month: 0,
    collected_today: 0,
    transactions_this_month: 0,
    pending_dues: 0,
    pending_students_count: 0,
    total_transactions: 0,
    online_percentage: 0,
    cash_percentage: 0,
    dominant_mode: 'No collections recorded',
    monthly_trends: [],
    category_breakdown: [],
  })
  const [selectedClassFilter, setSelectedClassFilter] = useState('all')
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('all')
  const [selectedMasteryFilter, setSelectedMasteryFilter] = useState('all')
  const [attendancePeriod, setAttendancePeriod] = useState('Daily')

  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalTeachers: 0,
    studentsByClass: [],
    studentsBySection: [],
    loading: false,
  })

  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    rate: 100,
    dailyTrend: [
      { day: 'Mon', rate: 100 },
      { day: 'Tue', rate: 100 },
      { day: 'Wed', rate: 100 },
      { day: 'Thu', rate: 100 },
      { day: 'Fri', rate: 100 },
      { day: 'Sat', rate: 100 },
    ],
  })

  // Calendar state - initialize to today's date
  const [calendarDate, setCalendarDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate())

  // Pinned Notes state - user persistent notes
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('sps_dashboard_notes_v4')
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return []
  })
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')

  const isTeacher = loginType !== 'student' && getUser()?.role === 'teacher'

  const routeViewMap = {
    '/dashboard': 'dashboard',
    '/students': 'student',
    '/id-cards': 'idCards',
    '/students/id-cards': 'idCards',
    '/students/admit-cards': 'idCards',
    '/document-management': 'documentManagement',
    '/class-promotion': 'classPromotion',
    '/examinations': 'examinationManagement',
    '/subjects': 'subject',
    '/teachers': 'teachers',
    '/fees': 'fees',
    '/attendance': 'attendance',
    '/teacher-attendance': 'teacherAttendance',
    '/marks-upload': 'uploadMarks',
    '/upload-photo': 'uploadPhoto',
    '/timetable': 'timetable',
    '/result-view': 'result',
    '/help': 'helpCenter',
    '/help-center': 'helpCenter',
  }

  // Persist notes
  useEffect(() => {
    try {
      localStorage.setItem('sps_dashboard_notes_v4', JSON.stringify(notes))
    } catch {
      // Ignore
    }
  }, [notes])

  // Fetch real backend data
  async function fetchDashboardData() {
    try {
      const studentsResponse = await getAllStudents()
      const students = Array.isArray(studentsResponse?.students)
        ? studentsResponse.students
        : Array.isArray(studentsResponse)
          ? studentsResponse
          : []
      setRealStudents(students)
      const totalStudents = students.length

      const classDistribution = {}
      const sectionDistribution = {}
      students.forEach((student) => {
        const className = normalizeSchoolClass(student.Class || student.class || 'Unknown') || 'Unknown'
        const section = (student.Section || student.section || 'A').toUpperCase()
        classDistribution[className] = (classDistribution[className] || 0) + 1
        sectionDistribution[section] = (sectionDistribution[section] || 0) + 1
      })

      const studentsByClass = sortSchoolClasses(
        Object.entries(classDistribution).map(([className, value]) => ({
          class: className,
          name: className,
          value,
        }))
      )

      const studentsBySection = Object.entries(sectionDistribution)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name))

      const subjectsResponse = await getAllSubjects()
      const totalClasses =
        studentsByClass.length ||
        subjectsResponse?.summary?.total_classes ||
        (Array.isArray(subjectsResponse?.classes) ? subjectsResponse.classes.length : 0) ||
        0
      const totalSubjects =
        subjectsResponse?.summary?.total_unique_subjects ||
        (Array.isArray(subjectsResponse?.data) ? subjectsResponse.data.length : 0) ||
        0

      let totalTeachers = 0
      try {
        const teachersResp = await getTeachers()
        const teachersList = Array.isArray(teachersResp)
          ? teachersResp
          : teachersResp?.teachers || teachersResp?.data || teachersResp?.results || []
        if (teachersList.length > 0) totalTeachers = teachersList.length
      } catch {
        // Fallback
      }

      try {
        const holidaysResp = await getHolidayCalendar()
        const holidaysList = Array.isArray(holidaysResp?.holidays) ? holidaysResp.holidays : []
        if (holidaysList.length > 0) setRealHolidays(holidaysList.slice(0, 4))
      } catch {
        // Fallback
      }

      // Fetch real attendance records for live analytics
      try {
        const attRes = await getAttendanceRecords()
        const records = Array.isArray(attRes) ? attRes : attRes?.records || attRes?.data || []
        if (records.length > 0) {
          const present = records.filter((r) => r.status === 'present').length
          const absent = records.filter((r) => r.status === 'absent').length
          const total = present + absent
          const rate = total > 0 ? Math.round((present / total) * 100) : 100

          const daysMap = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' }
          const dayStats = {
            Mon: { p: 0, t: 0 },
            Tue: { p: 0, t: 0 },
            Wed: { p: 0, t: 0 },
            Thu: { p: 0, t: 0 },
            Fri: { p: 0, t: 0 },
            Sat: { p: 0, t: 0 },
          }

          records.forEach((r) => {
            const d = new Date(r.attendance_date || r.created_at)
            const dayName = daysMap[d.getDay()]
            if (dayName && dayStats[dayName]) {
              dayStats[dayName].t++
              if (r.status === 'present') dayStats[dayName].p++
            }
          })

          const dailyTrend = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
            const s = dayStats[day]
            return {
              day,
              rate: s.t > 0 ? Math.round((s.p / s.t) * 100) : (rate || 100),
            }
          })

          setAttendanceStats({
            present,
            absent,
            rate,
            dailyTrend,
          })
        }
      } catch {
        // Fallback
      }

      // Fetch real examinations
      try {
        const examsResp = await getExaminationsApi()
        const examList = Array.isArray(examsResp)
          ? examsResp
          : examsResp?.examinations || examsResp?.data || []
        setRealExams(examList)
      } catch {
        setRealExams([])
      }

      // Fetch real fee dashboard metrics
      try {
        const feeResp = await getFeeDashboard()
        if (feeResp?.data) {
          setFeeStats({
            total_collected: feeResp.data.kpis?.total_collected || 0,
            collected_this_month: feeResp.data.kpis?.collected_this_month || 0,
            collected_today: feeResp.data.kpis?.collected_today || 0,
            transactions_this_month: feeResp.data.kpis?.transactions_this_month || 0,
            pending_dues: feeResp.data.kpis?.pending_dues || 0,
            pending_students_count: feeResp.data.kpis?.pending_students_count || 0,
            total_transactions: feeResp.data.kpis?.total_transactions || 0,
            online_percentage: feeResp.data.kpis?.online_percentage || 0,
            cash_percentage: feeResp.data.kpis?.cash_percentage || 0,
            dominant_mode: feeResp.data.kpis?.dominant_mode || 'No transactions',
            monthly_trends: Array.isArray(feeResp.data.monthly_trends) ? feeResp.data.monthly_trends : [],
            category_breakdown: Array.isArray(feeResp.data.category_breakdown) ? feeResp.data.category_breakdown : [],
          })
        }
      } catch {
        // Fallback
      }

      setDashboardData({
        totalStudents,
        totalClasses,
        totalSubjects,
        totalTeachers,
        studentsByClass,
        studentsBySection,
        loading: false,
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }

  useEffect(() => {
    const user = getUser()
    const loginTypeFromStorage = getLoginType()

    if (!user) {
      navigate('/login')
    } else {
      setCurrentUser(user)
      setLoginType(loginTypeFromStorage)
    }
  }, [navigate, initialView])

  useEffect(() => {
    const pathname = location.pathname
    const mappedView = routeViewMap[pathname]

    if (loginType === 'student') {
      if (!['/attendance', '/result-view'].includes(pathname)) {
        navigate('/attendance', { replace: true })
        return
      }
      const nextView = pathname === '/attendance' ? 'attendance' : 'result'
      if (activeView !== nextView) setActiveView(nextView)
      return
    }

    if (isTeacher) {
      const teacherAllowedRoutes = [
        '/dashboard',
        '/attendance',
        '/teacher-attendance',
        '/marks-upload',
        '/examinations',
        '/timetable',
        '/students',
        '/help',
        '/help-center',
        '/result-view',
      ]
      const isAllowed = teacherAllowedRoutes.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
      )
      if (!isAllowed) {
        navigate('/dashboard', { replace: true })
        return
      }
      if (mappedView && activeView !== mappedView) {
        setActiveView(mappedView)
        return
      }
      return
    }

    if (mappedView && activeView !== mappedView) {
      setActiveView(mappedView)
      return
    }

    if (!mappedView && !pathname.startsWith('/results')) {
      navigate('/dashboard', { replace: true })
    }
  }, [activeView, isTeacher, location.pathname, loginType, navigate])

  useEffect(() => {
    if (loginType !== 'student' && !isTeacher && activeView === 'dashboard') {
      fetchDashboardData()
    }
  }, [loginType, activeView, isTeacher])

  // Calendar Helpers
  const currentYear = calendarDate.getFullYear()
  const daysInMonth = new Date(currentYear, calendarDate.getMonth() + 1, 0).getDate()
  const firstDayIndex = new Date(currentYear, calendarDate.getMonth(), 1).getDay()
  const prevMonthDays = new Date(currentYear, calendarDate.getMonth(), 0).getDate()

  const changeMonth = (delta) => {
    setCalendarDate((prev) => {
      const next = new Date(prev)
      next.setMonth(next.getMonth() + delta)
      return next
    })
  }

  // Filtered students for Top Signals Card
  const displayedStudents = useMemo(() => {
    let list = realStudents
    if (selectedClassFilter !== 'all') {
      const norm = normalizeSchoolClass(selectedClassFilter) || selectedClassFilter
      list = list.filter((s) => {
        const c = normalizeSchoolClass(s.Class || s.class || '')
        return (
          c.toLowerCase() === norm.toLowerCase() ||
          String(s.Class || s.class || '').toLowerCase() === selectedClassFilter.toLowerCase()
        )
      })
    }
    if (selectedSectionFilter !== 'all') {
      list = list.filter(
        (s) => String(s.Section || s.section || '').toUpperCase() === selectedSectionFilter.toUpperCase()
      )
    }
    return list.slice(0, 4)
  }, [realStudents, selectedClassFilter, selectedSectionFilter])

  const handleAddNote = (e) => {
    e.preventDefault()
    if (!newNoteTitle.trim()) return
    setNotes((prev) => [
      ...prev,
      { id: Date.now(), title: newNoteTitle.trim(), date: 'Today' },
    ])
    setNewNoteTitle('')
    setIsAddingNote(false)
  }

  const [hoveredMonth, setHoveredMonth] = useState(null)
  const [hoveredCategory, setHoveredCategory] = useState(null)
  const [hoveredAttendanceDay, setHoveredAttendanceDay] = useState(null)
  const [activeTabOverview, setActiveTabOverview] = useState('metrics')

  const maxChartVal = useMemo(() => {
    const trends = feeStats.monthly_trends || []
    const rawMax = Math.max(
      ...trends.map((t) => Math.max(t.collected_raw || 0, t.pending_raw || 0)),
      1000
    )
    if (rawMax <= 10000) return 10000
    if (rawMax <= 25000) return 25000
    if (rawMax <= 50000) return 50000
    if (rawMax <= 100000) return 100000
    return Math.ceil(rawMax / 50000) * 50000
  }, [feeStats.monthly_trends])

  const monthlyFeeData = useMemo(() => {
    const trends = feeStats.monthly_trends || []
    const xCoords = [95, 202, 309, 416, 523, 630]
    const baselineY = 130
    const topY = 25
    const chartHeight = baselineY - topY

    if (trends.length === 0) {
      const defaultMonths = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov (Current)']
      return defaultMonths.map((m, idx) => ({
        month: m,
        x: xCoords[idx],
        yCol: baselineY,
        yPend: baselineY,
        collected: '₹0',
        pending: '₹0',
        collected_raw: 0,
        pending_raw: 0,
      }))
    }

    return trends.slice(0, 6).map((item, idx) => {
      const x = xCoords[idx] || 95 + idx * 107
      const colRatio = Math.min(1, Math.max(0, (item.collected_raw || 0) / maxChartVal))
      const pendRatio = Math.min(1, Math.max(0, (item.pending_raw || 0) / maxChartVal))
      const yCol = Math.round(baselineY - colRatio * chartHeight)
      const yPend = Math.round(baselineY - pendRatio * chartHeight)

      return {
        month: item.month,
        x,
        yCol,
        yPend,
        collected: item.collected || `₹${Number(item.collected_raw || 0).toLocaleString('en-IN')}`,
        pending: item.pending || `₹${Number(item.pending_raw || 0).toLocaleString('en-IN')}`,
        collected_raw: item.collected_raw || 0,
        pending_raw: item.pending_raw || 0,
      }
    })
  }, [feeStats.monthly_trends, maxChartVal])

  const getSmoothSvgPath = (points, yKey) => {
    if (!points || points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x},${points[0][yKey]}`
    let path = `M ${points[0].x},${points[0][yKey]}`
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      const cpX1 = current.x + (next.x - current.x) / 2
      const cpY1 = current[yKey]
      const cpX2 = current.x + (next.x - current.x) / 2
      const cpY2 = next[yKey]
      path += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${next.x},${next[yKey]}`
    }
    return path
  }

  const getSmoothAreaPath = (points, yKey, baselineY = 130) => {
    if (!points || points.length === 0) return ''
    const linePart = getSmoothSvgPath(points, yKey)
    const lastX = points[points.length - 1].x
    const firstX = points[0].x
    return `${linePart} L ${lastX},${baselineY} L ${firstX},${baselineY} Z`
  }

  const formatAmountK = (val) => {
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`
    if (val >= 1000) return `${Math.round(val / 1000)}k`
    return String(val)
  }

  const upcomingEventsList = useMemo(() => {
    const list = []
    ;(realExams || []).forEach((ex) => {
      const d = new Date(ex.start_date || ex.created_at)
      if (!isNaN(d.getTime())) {
        list.push({
          id: `exam-${ex.id}`,
          dateObj: d,
          month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
          day: String(d.getDate()).padStart(2, '0'),
          badgeColor: 'purple',
          title: ex.name || 'Examination',
          subtitle: ex.description || `Session ${ex.academic_session || ''} · ${ex.exam_type || 'Exam'}`,
        })
      }
    })

    ;(realHolidays || []).forEach((h) => {
      const d = new Date(h.holiday_date || h.date)
      if (!isNaN(d.getTime())) {
        list.push({
          id: `hol-${h.id || h.holiday_name}`,
          dateObj: d,
          month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
          day: String(d.getDate()).padStart(2, '0'),
          badgeColor: 'amber',
          title: h.holiday_name || h.title || 'Holiday',
          subtitle: h.description || 'Campus holiday',
        })
      }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return list
      .filter((e) => e.dateObj >= today)
      .sort((a, b) => a.dateObj - b.dateObj)
      .slice(0, 4)
  }, [realExams, realHolidays])

  const activeCategories = useMemo(() => {
    if (feeStats.category_breakdown && feeStats.category_breakdown.length > 0) {
      return feeStats.category_breakdown
    }
    return [
      { key: 'tuition', name: 'Tuition Fees', sub: 'Standard & Academic', amount: '₹0', amount_raw: 0, percent: 0, color: '#3b82f6' },
      { key: 'transport', name: 'Transport Fees', sub: 'Bus & Transit routes', amount: '₹0', amount_raw: 0, percent: 0, color: '#f59e0b' },
      { key: 'lab', name: 'Lab & Library', sub: 'Practical & Books', amount: '₹0', amount_raw: 0, percent: 0, color: '#10b981' },
      { key: 'exam', name: 'Exam & Activity', sub: 'Assessment & Sports', amount: '₹0', amount_raw: 0, percent: 0, color: '#8b5cf6' },
    ]
  }, [feeStats.category_breakdown])

  const totalCategoryAmount = useMemo(() => {
    return activeCategories.reduce((sum, c) => sum + (c.amount_raw || 0), 0)
  }, [activeCategories])

  // User display name
  const displayName = currentUser?.fullName || currentUser?.name || 'Administrator'
  const displayEmail = currentUser?.email || 'admin@school.internal'
  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD'

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const currentHour = new Date().getHours()
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening'
  const currentMonthYear = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <>
      <SEO
        title="Admin Console | Star Public School"
        description="Internal operations dashboard for Star Public School leadership."
        canonicalPath="/dashboard"
      />

      <div className="flex h-full w-full overflow-hidden bg-[#f8fafc]">

        {/* ================= LEFT SIDEBAR ================= */}
        <Sidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          activeView={activeView}
          setActiveView={setActiveView}
        />

        {/* ================= MAIN DASHBOARD BODY ================= */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-7">
          {loginType !== 'student' && !isTeacher && activeView === 'dashboard' && (
            <div className="mx-auto flex max-w-[1600px] flex-col gap-6 xl:flex-row xl:items-start">

              {/* ================= CENTER / LEFT BROAD COLUMN ================= */}
              <div className="flex-1 min-w-0 space-y-6">

                {/* 1. Hero Greeting Box matching Reference Image */}
                <div className="dashboard-card-hover anim-dashboard-enter rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-700 tracking-wider uppercase">
                        <span className="material-symbols-outlined text-[15px] leading-none text-sky-600 animate-pulse">calendar_today</span>
                        <span>{todayFormatted.toUpperCase()} · TERM 2 ONGOING</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>{timeGreeting}, {displayName}</span>
                        <span className="text-2xl inline-block hover:rotate-12 hover:scale-110 transition-transform cursor-default">👋</span>
                      </h1>
                      <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed pt-0.5 max-w-2xl">
                        Here is your campus pulse today: <span className="font-bold text-slate-800">{attendanceStats.rate > 0 ? `${attendanceStats.rate}%` : 'N/A'}</span> student attendance, <span className="font-bold text-slate-800">{realExams.length}</span> upcoming exam{realExams.length === 1 ? '' : 's'} scheduled, and <span className="font-bold text-slate-800">₹{Number(feeStats.collected_this_month || 0).toLocaleString('en-IN')}</span> fee collected this month.
                      </p>
                    </div>

                    <div className="shrink-0">
                      <button
                        onClick={() => navigate('/students')}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 text-white font-bold px-4 py-2 text-xs shadow-sm shadow-blue-500/20 transition-all duration-200 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base leading-none">person_add</span>
                        <span>+ New Admission</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Feature Quick Action Tiles inside/below Hero */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-slate-100">
                    {/* Action 1: Collect Fee */}
                    <button
                      onClick={() => navigate('/fees')}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-emerald-50/40 hover:border-emerald-300 hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-115 group-hover:rotate-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 border border-emerald-100 shadow-2xs">
                        <span className="material-symbols-outlined text-[20px]">payments</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">
                          Collect Fee
                        </p>
                        <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                          Instant receipt
                        </p>
                      </div>
                    </button>

                    {/* Action 2: Take Attendance */}
                    <button
                      onClick={() => navigate('/attendance')}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-300 hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-115 group-hover:rotate-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 border border-blue-100 shadow-2xs">
                        <span className="material-symbols-outlined text-[20px]">checklist</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
                          Take Attendance
                        </p>
                        <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                          Mark live classes
                        </p>
                      </div>
                    </button>

                    {/* Action 3: Upload Marks */}
                    <button
                      onClick={() => navigate('/marks-upload')}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-purple-50/40 hover:border-purple-300 hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-115 group-hover:rotate-6 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200 border border-purple-100 shadow-2xs">
                        <span className="material-symbols-outlined text-[20px]">upload_file</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-purple-700 transition-colors">
                          Upload Marks
                        </p>
                        <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                          Report generation
                        </p>
                      </div>
                    </button>

                    {/* Action 4: Class Timetable */}
                    <button
                      onClick={() => navigate('/timetable')}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-amber-50/40 hover:border-amber-300 hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-115 group-hover:rotate-6 group-hover:bg-amber-500 group-hover:text-white transition-all duration-200 border border-amber-100 shadow-2xs">
                        <span className="material-symbols-outlined text-[20px]">schedule</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-amber-700 transition-colors">
                          Class Timetable
                        </p>
                        <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                          Period slots & rooms
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. CAMPUS OVERVIEW & KEY METRICS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-700 uppercase">
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                      <span>CAMPUS OVERVIEW & KEY METRICS</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Updated in real time</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* KPI 1: TOTAL STUDENTS (Soft Blue Lite Gradient) */}
                    <div className="dashboard-kpi-hover group cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white p-5 border border-blue-200/70 shadow-xs transition-all hover:border-blue-300 hover:shadow-md hover:from-blue-100/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-700 transition-colors">
                          TOTAL STUDENTS
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100/80 text-blue-600 border border-blue-200/60 group-hover:scale-115 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                          <span className="material-symbols-outlined text-[19px]">groups</span>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <p className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                          {dashboardData.totalStudents.toLocaleString()}
                        </p>
                        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md group-hover:bg-blue-200/80 transition-colors">
                            {realStudents.filter((s) => (s.status || 'active').toLowerCase() === 'active').length} Active
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {dashboardData.studentsByClass.length} Classes · {dashboardData.studentsBySection.length} Sections
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* KPI 2: CLASSROOMS (Soft Amber Lite Gradient) */}
                    <div className="dashboard-kpi-hover group cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white p-5 border border-amber-200/70 shadow-xs transition-all hover:border-amber-300 hover:shadow-md hover:from-amber-100/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-700 transition-colors">
                          CLASSROOMS
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100/80 text-amber-600 border border-amber-200/60 group-hover:scale-115 group-hover:bg-amber-500 group-hover:text-white transition-all duration-200 shadow-2xs">
                          <span className="material-symbols-outlined text-[19px]">meeting_room</span>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <p className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors">
                          {dashboardData.totalClasses}
                        </p>
                        <div className="mt-2.5 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md group-hover:bg-amber-200/80 transition-colors">
                            {dashboardData.studentsByClass.length > 0
                              ? `${dashboardData.studentsByClass[0]?.name || ''} to ${dashboardData.studentsByClass[dashboardData.studentsByClass.length - 1]?.name || ''}`
                              : 'Active Standards'}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {dashboardData.totalStudents} Enrolled
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* KPI 3: TEACHING FACULTY (Soft Emerald Lite Gradient) */}
                    <div className="dashboard-kpi-hover group cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white p-5 border border-emerald-200/70 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md hover:from-emerald-100/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-700 transition-colors">
                          TEACHING FACULTY
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-600 border border-emerald-200/60 group-hover:scale-115 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                          <span className="material-symbols-outlined text-[19px]">badge</span>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <p className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">
                          {dashboardData.totalTeachers}
                        </p>
                        <div className="mt-2.5 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md group-hover:bg-emerald-200/80 transition-colors">
                            {dashboardData.totalTeachers} Staff Registered
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {dashboardData.totalTeachers > 0 ? 'Faculty on Roll' : 'No staff added'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* KPI 4: FEE COLLECTION (Soft Purple Lite Gradient) */}
                    <div className="dashboard-kpi-hover group cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50/90 via-violet-50/40 to-white p-5 border border-purple-200/70 shadow-xs transition-all hover:border-purple-300 hover:shadow-md hover:from-purple-100/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-purple-700 transition-colors">
                          FEE COLLECTION
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100/80 text-purple-600 border border-purple-200/60 group-hover:scale-115 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                          <span className="material-symbols-outlined text-[19px]">trending_up</span>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <p className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-purple-600 transition-colors">
                          {feeStats.total_collected + feeStats.pending_dues > 0
                            ? `${Math.round((feeStats.total_collected / (feeStats.total_collected + feeStats.pending_dues)) * 100)}%`
                            : '0%'}
                        </p>
                        <div className="mt-2.5 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-bold text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded-md group-hover:bg-purple-200/80 transition-colors">
                            ₹{Number(feeStats.total_collected || 0).toLocaleString('en-IN')} collected
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            Dues ₹{Number(feeStats.pending_dues || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Fee Collection & Revenue Analytics Card matching Reference Image */}
                <div className="dashboard-card-hover anim-dashboard-enter rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shadow-2xs">
                        <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-slate-900">
                            Fee Collection & Revenue Analytics
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-bold">
                            FY 2026–27 Term 2
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Monthly collection performance, target attainment, and category-wise clearance
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => navigate('/fees')}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-500">notifications</span>
                        <span>Send Reminders</span>
                      </button>
                      <button
                        onClick={() => navigate('/fees')}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        <span>Download Report</span>
                      </button>
                    </div>
                  </div>

                  {/* Dual-Wave Smooth Curve Chart */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        MONTHLY TREND: COLLECTED VS PENDING
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 font-bold text-slate-700">
                          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                          Collected
                        </span>
                        <span className="flex items-center gap-1.5 font-bold text-slate-700">
                          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                          Pending
                        </span>
                      </div>
                    </div>

                    {/* Smooth SVG Area Chart */}
                    <div className="relative w-full pt-2">
                      {/* Floating Tooltip directly on hover */}
                      {hoveredMonth !== null && monthlyFeeData[hoveredMonth] && (
                        <div
                          style={{
                            left: `${(monthlyFeeData[hoveredMonth].x / 660) * 100}%`,
                          }}
                          className="absolute -top-3 -translate-x-1/2 -translate-y-full z-30 pointer-events-none transition-all duration-150 animate-fade-in-up"
                        >
                          <div className="bg-slate-900 text-white rounded-xl px-3.5 py-2.5 shadow-2xl border border-slate-700 text-left whitespace-nowrap space-y-1.5">
                            <p className="text-[11px] font-bold text-slate-300 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                              <span>{monthlyFeeData[hoveredMonth].month}</span>
                              <span className="text-emerald-400 font-extrabold text-[10.5px]">
                                {(() => {
                                  const tot =
                                    (monthlyFeeData[hoveredMonth].collected_raw || 0) +
                                    (monthlyFeeData[hoveredMonth].pending_raw || 0)
                                  return tot > 0
                                    ? `${Math.round(((monthlyFeeData[hoveredMonth].collected_raw || 0) / tot) * 100)}% Cleared`
                                    : '0% Cleared'
                                })()}
                              </span>
                            </p>
                            <div className="flex items-center gap-3.5 text-xs pt-0.5">
                              <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                                <span className="h-2 w-2 rounded-full bg-blue-400" />
                                Col: {monthlyFeeData[hoveredMonth].collected}
                              </span>
                              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                                <span className="h-2 w-2 rounded-full bg-rose-400" />
                                Pend: {monthlyFeeData[hoveredMonth].pending}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <svg viewBox="0 0 660 165" className="w-full h-44 overflow-visible">
                        <defs>
                          {/* Collected Blue Gradient */}
                          <linearGradient id="blueWaveGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                          </linearGradient>

                          {/* Pending Pink Gradient */}
                          <linearGradient id="roseWaveGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Y-Axis Currency Labels & Grid lines */}
                        <g className="text-[10px] fill-slate-400 font-semibold select-none">
                          <text x="8" y="29">₹{formatAmountK(maxChartVal)}</text>
                          <line x1="60" y1="25" x2="648" y2="25" stroke="#f1f5f9" strokeDasharray="3 3" />

                          <text x="8" y="81">₹{formatAmountK(maxChartVal / 2)}</text>
                          <line x1="60" y1="77" x2="648" y2="77" stroke="#f1f5f9" strokeDasharray="3 3" />

                          <text x="8" y="134">₹0</text>
                          <line x1="60" y1="130" x2="648" y2="130" stroke="#e2e8f0" strokeWidth="1.2" />
                        </g>

                        {/* Vertical Guideline on Hover */}
                        {hoveredMonth !== null && monthlyFeeData[hoveredMonth] && (
                          <line
                            x1={monthlyFeeData[hoveredMonth].x}
                            y1="20"
                            x2={monthlyFeeData[hoveredMonth].x}
                            y2="130"
                            stroke="#94a3b8"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                            className="transition-all"
                          />
                        )}

                        {/* Smooth Pending Wave Area & Line */}
                        <path
                          d={getSmoothAreaPath(monthlyFeeData, 'yPend', 130)}
                          fill="url(#roseWaveGrad)"
                        />
                        <path
                          d={getSmoothSvgPath(monthlyFeeData, 'yPend')}
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                        />

                        {/* Smooth Collected Wave Area & Line */}
                        <path
                          d={getSmoothAreaPath(monthlyFeeData, 'yCol', 130)}
                          fill="url(#blueWaveGrad)"
                        />
                        <path
                          d={getSmoothSvgPath(monthlyFeeData, 'yCol')}
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                        />

                        {/* Interactive Data Points with Hover Glow */}
                        {monthlyFeeData.map((pt, idx) => {
                          const isHovered = hoveredMonth === idx
                          return (
                            <g
                              key={`pt-${idx}`}
                              onMouseEnter={() => setHoveredMonth(idx)}
                              onMouseLeave={() => setHoveredMonth(null)}
                              className="cursor-pointer"
                            >
                              {/* Transparent touch target */}
                              <rect x={pt.x - 22} y="15" width="44" height="125" fill="transparent" />

                              {/* Hover Glow Rings */}
                              {isHovered && (
                                <>
                                  <circle cx={pt.x} cy={pt.yCol} r="11" fill="#2563eb" opacity="0.25" className="animate-ping" />
                                  <circle cx={pt.x} cy={pt.yPend} r="11" fill="#f43f5e" opacity="0.25" className="animate-ping" />
                                </>
                              )}

                              {/* Collected Circle */}
                              <circle
                                cx={pt.x}
                                cy={pt.yCol}
                                r={isHovered ? 7 : 4.5}
                                fill="#2563eb"
                                stroke="#ffffff"
                                strokeWidth={isHovered ? 3.5 : 2.5}
                                className="transition-all duration-200"
                              />

                              {/* Pending Circle */}
                              <circle
                                cx={pt.x}
                                cy={pt.yPend}
                                r={isHovered ? 7 : 4.5}
                                fill="#f43f5e"
                                stroke="#ffffff"
                                strokeWidth={isHovered ? 3.5 : 2.5}
                                className="transition-all duration-200"
                              />

                              {/* Month X-Axis Label inside SVG for pixel-perfect centering */}
                              <text
                                x={pt.x}
                                y="152"
                                textAnchor="middle"
                                className={`text-[11px] select-none transition-all duration-150 ${
                                  isHovered
                                    ? 'fill-blue-600 font-black scale-105'
                                    : pt.month.includes('Current')
                                    ? 'fill-blue-600 font-bold'
                                    : 'fill-slate-500 font-semibold'
                                }`}
                              >
                                {pt.month}
                              </text>
                            </g>
                          )
                        })}
                      </svg>
                    </div>
                  </div>

                  {/* Category Breakdown: Interactive Donut Chart + Fee Heads */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        CATEGORY BREAKDOWN
                      </span>
                      <span className="text-xs text-slate-400">Hover category to inspect allocation</span>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6">
                      {/* Interactive Donut Chart */}
                      <div className="relative flex items-center justify-center shrink-0 w-40 h-40 group cursor-pointer">
                        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                          {/* Background Track Circle */}
                          <circle
                            cx="80"
                            cy="80"
                            r="54"
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth="15"
                          />
                          {/* Inner center circle */}
                          <circle
                            cx="80"
                            cy="80"
                            r="42"
                            fill="#ffffff"
                            stroke="#f8fafc"
                            strokeWidth="1.5"
                          />
                          {(() => {
                            let cumulativeOffset = 0
                            return activeCategories.map((cat) => {
                              const dash = Math.max(0, (cat.percent / 100) * 339.29)
                              const offset = -cumulativeOffset
                              cumulativeOffset += dash
                              return (
                                <circle
                                  key={cat.key}
                                  cx="80"
                                  cy="80"
                                  r="54"
                                  fill="none"
                                  stroke={cat.color}
                                  strokeWidth={hoveredCategory === cat.key ? 18 : 14}
                                  strokeDasharray={`${dash} 339.29`}
                                  strokeDashoffset={offset}
                                  strokeLinecap="round"
                                  opacity={hoveredCategory && hoveredCategory !== cat.key ? 0.35 : 1}
                                  onMouseEnter={() => setHoveredCategory(cat.key)}
                                  onMouseLeave={() => setHoveredCategory(null)}
                                  className="transition-all duration-200 cursor-pointer"
                                />
                              )
                            })
                          })()}
                        </svg>

                        {/* Donut Center Label: Dynamic based on hover */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none transition-all duration-200">
                          {hoveredCategory ? (
                            (() => {
                              const cat =
                                activeCategories.find((c) => c.key === hoveredCategory) ||
                                activeCategories[0]
                              return (
                                <>
                                  <span
                                    className="text-[9.5px] font-black uppercase tracking-wider"
                                    style={{ color: cat.color }}
                                  >
                                    {cat.name}
                                  </span>
                                  <span className="text-lg font-black text-slate-900 leading-tight">
                                    {cat.amount}
                                  </span>
                                  <span className="text-[10px] font-bold" style={{ color: cat.color }}>
                                    {cat.percent}% Share
                                  </span>
                                </>
                              )
                            })()
                          ) : (
                            <>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                TOTAL FEE
                              </span>
                              <span className="text-lg font-black text-slate-900 leading-tight">
                                ₹{Number(totalCategoryAmount || feeStats.total_collected || 0).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400">
                                {activeCategories.filter((c) => c.amount_raw > 0).length || activeCategories.length} Categories
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Category Stat Pills with Hover Linkage */}
                      <div className="grid grid-cols-2 gap-4 flex-1 w-full text-xs">
                        {activeCategories.map((cat) => (
                          <div
                            key={cat.key}
                            onMouseEnter={() => setHoveredCategory(cat.key)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                              hoveredCategory === cat.key
                                ? 'bg-blue-50/80 border-blue-400 shadow-sm -translate-y-1'
                                : 'bg-slate-50/70 border-slate-200/60 hover:bg-blue-50/40 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 font-bold text-slate-900">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                {cat.name}
                              </span>
                              <span className="font-extrabold" style={{ color: cat.color }}>
                                {cat.percent}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-slate-500 text-[11px]">
                              <span>{cat.sub}</span>
                              <span className="font-bold text-slate-800">{cat.amount}</span>
                            </div>
                            {/* Visual Progress Bar */}
                            <div className="w-full bg-slate-200/60 rounded-full h-1.5 mt-2.5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(2, cat.percent)}%`, backgroundColor: cat.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Weekly Attendance Analytics Card */}
                <div className="dashboard-card-hover anim-dashboard-enter rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">
                          Weekly Attendance Analytics
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-bold">
                          {attendanceStats.rate > 0 ? `${attendanceStats.rate}% Avg` : 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Daily overall campus attendance across all standards (Mon–Sat)
                      </p>
                    </div>

                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                      {['Daily', 'Weekly', 'Monthly'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setAttendancePeriod(tab)}
                          className={`rounded-lg px-3 py-1 transition-all cursor-pointer ${
                            attendancePeriod === tab
                              ? 'bg-white text-slate-900 shadow-2xs font-bold scale-102'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rounded Pillar Bar Chart with Full Tracks & Interactive Hover */}
                  <div className="pt-6">
                    <div className="grid grid-cols-6 gap-2.5 sm:gap-4 items-end h-40 px-2">
                      {(() => {
                        const todayDayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()]
                        return (attendanceStats.dailyTrend || []).map((item, idx) => {
                          const isLive = item.day === todayDayName
                          return (
                            <div
                              key={idx}
                              onMouseEnter={() => setHoveredAttendanceDay(idx)}
                              onMouseLeave={() => setHoveredAttendanceDay(null)}
                              className="flex flex-col items-center gap-2 h-full justify-end group relative cursor-pointer"
                            >
                              {/* Floating badge for live today */}
                              {isLive && (
                                <div className="live-badge-pulse absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-50 text-emerald-700 text-[10.5px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-sm whitespace-nowrap z-10">
                                  {item.rate}% Today
                                </div>
                              )}

                              {/* Hover tooltip for other days */}
                              {!isLive && hoveredAttendanceDay === idx && (
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap animate-fade-in-up">
                                  {item.rate}% Present
                                </div>
                              )}

                              {/* Percentage Label */}
                              <span
                                className={`text-[11px] font-bold transition-all ${
                                  isLive
                                    ? 'text-emerald-700 font-extrabold scale-110'
                                    : hoveredAttendanceDay === idx
                                    ? 'text-blue-600 font-bold scale-110'
                                    : 'text-slate-400 group-hover:text-slate-800'
                                }`}
                              >
                                {item.rate}%
                              </span>

                              {/* Pillar Track Background + Fill */}
                              <div className="w-full max-w-[42px] h-28 bg-slate-100/90 rounded-2xl p-1 flex flex-col justify-end items-center relative transition-all group-hover:bg-slate-200/70 border border-slate-200/50 shadow-2xs">
                                <div
                                  style={{ height: `${Math.max(8, item.rate)}%` }}
                                  className={`w-full rounded-xl transition-all duration-300 ${
                                    isLive
                                      ? 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/25'
                                      : hoveredAttendanceDay === idx
                                      ? 'bg-gradient-to-t from-blue-700 via-blue-600 to-sky-400 shadow-sm shadow-blue-500/20'
                                      : 'bg-gradient-to-t from-blue-600 to-sky-500'
                                  }`}
                                />
                              </div>

                              {/* Weekday Label */}
                              <span
                                className={`text-xs transition-colors ${
                                  isLive
                                    ? 'font-black text-emerald-700'
                                    : hoveredAttendanceDay === idx
                                    ? 'font-bold text-blue-600'
                                    : 'font-medium text-slate-600'
                                }`}
                              >
                                {item.day}
                              </span>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>

                  {/* Attendance Footer Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-4 text-slate-600">
                      <span className="flex items-center gap-1.5 font-bold">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                        Completed
                      </span>
                      <span className="flex items-center gap-1.5 font-bold">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        Today&apos;s Session
                      </span>
                    </div>

                    <button
                      onClick={() => navigate('/attendance')}
                      className="font-bold text-blue-600 hover:text-blue-800 hover:translate-x-1 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Detailed Report</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* ================= RIGHT UTILITY COLUMN ================= */}
              <div className="w-full xl:w-[320px] xl:shrink-0 space-y-5">

                {/* 1. Interactive Calendar matching Reference Image */}
                <div className="dashboard-card-hover anim-dashboard-enter rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      {currentMonthYear}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => changeMonth(-1)}
                        className="h-7 w-7 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 hover:scale-110 active:scale-90 flex items-center justify-center cursor-pointer transition-all"
                        title="Previous Month"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => changeMonth(1)}
                        className="h-7 w-7 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 hover:scale-110 active:scale-90 flex items-center justify-center cursor-pointer transition-all"
                        title="Next Month"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  {/* Legend dots */}
                  <div className="text-[10.5px] text-slate-500 flex items-center gap-3 pt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      Today
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Event
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Holiday
                    </span>
                  </div>

                  {/* Days header S M T W T F S */}
                  <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 pt-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <span key={i} className={i === 0 ? 'text-rose-400 font-black' : ''}>{d}</span>
                    ))}
                  </div>

                  {/* Dates grid */}
                  <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-medium text-slate-700">
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                      <span key={`b-${i}`} className="h-7 flex items-center justify-center text-slate-300 text-xs">
                        {prevMonthDays - firstDayIndex + i + 1}
                      </span>
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1
                      const isToday =
                        dayNum === new Date().getDate() &&
                        calendarDate.getMonth() === new Date().getMonth() &&
                        calendarDate.getFullYear() === new Date().getFullYear()
                      const isSelected = dayNum === selectedDay
                      const isEventDay = realExams.some((e) => {
                        const d = new Date(e.start_date || e.created_at)
                        return (
                          d.getDate() === dayNum &&
                          d.getMonth() === calendarDate.getMonth() &&
                          d.getFullYear() === calendarDate.getFullYear()
                        )
                      })
                      const isHolidayDay = realHolidays.some((h) => {
                        const d = new Date(h.holiday_date || h.date)
                        return (
                          d.getDate() === dayNum &&
                          d.getMonth() === calendarDate.getMonth() &&
                          d.getFullYear() === calendarDate.getFullYear()
                        )
                      })

                      return (
                        <div key={dayNum} className="h-7 flex items-center justify-center">
                          <button
                            onClick={() => setSelectedDay(dayNum)}
                            className={`h-6.5 w-6.5 rounded-full text-xs flex items-center justify-center transition-all duration-150 cursor-pointer hover:scale-120 active:scale-90 ${
                              isToday
                                ? 'bg-blue-600 text-white font-black shadow-xs ring-2 ring-blue-200'
                                : isEventDay
                                ? 'bg-amber-100 text-amber-800 font-black hover:bg-amber-200'
                                : isHolidayDay
                                ? 'bg-rose-100 text-rose-700 font-black hover:bg-rose-200'
                                : isSelected
                                ? 'bg-slate-900 text-white font-bold'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            {dayNum}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Upcoming Events & Tests matching Reference Image */}
                <div className="dashboard-card-hover anim-dashboard-enter rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      Upcoming Events & Tests
                    </h3>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {upcomingEventsList.length} Listed
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {upcomingEventsList.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No upcoming events or tests scheduled.
                      </div>
                    ) : (
                      upcomingEventsList.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => navigate(ev.badgeColor === 'purple' ? '/examinations' : '/attendance')}
                          className="flex items-start gap-3 text-xs group cursor-pointer hover:bg-slate-50 hover:translate-x-1.5 p-2 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-200/60 hover:shadow-2xs"
                        >
                          <div
                            className={`flex flex-col items-center justify-center h-10 w-10 shrink-0 rounded-xl font-black text-center group-hover:scale-105 transition-transform ${
                              ev.badgeColor === 'amber'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : ev.badgeColor === 'purple'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}
                          >
                            <span className="text-[9px] uppercase leading-none font-bold">{ev.month}</span>
                            <span className="text-sm leading-none font-black mt-0.5">{ev.day}</span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                              {ev.title}
                            </p>
                            <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                              {ev.subtitle}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => navigate('/attendance')}
                      className="font-bold text-blue-600 hover:text-blue-800 hover:translate-x-1 transition-all cursor-pointer"
                    >
                      Full Academic Calendar →
                    </button>
                    <span className="text-slate-400 font-bold tracking-widest text-base leading-none">···</span>
                  </div>
                </div>

                {/* 3. Preserved Pinned Notes */}
                <div className="dashboard-card-hover anim-dashboard-enter rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-amber-500 animate-bounce">push_pin</span>
                      <h3 className="text-sm font-bold text-slate-900">
                        Pinned Notes
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsAddingNote(!isAddingNote)}
                      className="h-6 w-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 hover:scale-110 active:scale-90 transition-all cursor-pointer"
                      title="Add note"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>

                  {isAddingNote && (
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <input
                        type="text"
                        placeholder="Write a quick note..."
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-400"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsAddingNote(false)}
                          className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-700"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {notes.length > 0 ? (
                      notes.map((n) => (
                        <div key={n.id} className="group flex items-start justify-between rounded-lg bg-slate-50 hover:bg-slate-100/80 hover:translate-x-1 p-2 text-xs transition-all duration-150">
                          <span className="text-slate-700 font-medium leading-tight">{n.title}</span>
                          <button
                            onClick={() => setNotes((prev) => prev.filter((item) => item.id !== n.id))}
                            className="hidden group-hover:block text-slate-400 hover:text-rose-500 ml-1 text-xs font-bold cursor-pointer transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-2">No pinned notes. Click + to add one.</p>
                    )}
                  </div>
                </div>

                {/* 4. Preserved Student Directory Quick Roster */}
                <div className="dashboard-card-hover anim-dashboard-enter rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      Student Directory
                    </h3>
                    <button
                      onClick={() => navigate('/students')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:translate-x-1 transition-all"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedClassFilter}
                      onChange={(e) => setSelectedClassFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer flex-1"
                    >
                      <option value="all">All Classes</option>
                      {dashboardData.studentsByClass.map((c) => (
                        <option key={c.class} value={c.class}>Class {c.name}</option>
                      ))}
                    </select>

                    <select
                      value={selectedSectionFilter}
                      onChange={(e) => setSelectedSectionFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Section</option>
                      <option value="A">Sec A</option>
                      <option value="B">Sec B</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    {displayedStudents.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No students in roster.
                      </div>
                    ) : (
                      displayedStudents.slice(0, 3).map((s, idx) => {
                        const name = s.name || s.Name || `Student ${idx + 1}`
                        const studentClass = s.class || s.Class || '1'
                        const studentSection = s.section || s.Section || 'A'
                        const rollNo = s.roll_no || s.Roll_No || idx + 1
                        return (
                          <div
                            key={s.id || idx}
                            onClick={() => navigate('/students')}
                            className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-slate-100 hover:translate-x-1 transition-all duration-150 cursor-pointer group"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-700 text-slate-800 font-bold text-[11px] transition-colors">
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 group-hover:text-blue-600 leading-tight truncate max-w-[120px] transition-colors">
                                  {name}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  Class {studentClass}-{studentSection} · #{rollNo}
                                </p>
                              </div>
                            </div>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                              Active
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {isTeacher && activeView === 'dashboard' && (
            <TeacherDashboardView user={currentUser} />
          )}

          {/* Sub-view router preserving all administrative features */}
          {(loginType === 'student' || activeView === 'result') && (
            <div className="w-full"><ResultView /></div>
          )}
          {activeView === 'student' && (
            <div className="w-full"><Student /></div>
          )}
          {!isTeacher && activeView === 'idCards' && (
            <div className="w-full">
              <BatchIdCardGenerator
                isPage={true}
                students={realStudents}
                initialClass="1"
              />
            </div>
          )}
          {!isTeacher && activeView === 'subject' && (
            <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-xs"><Subject /></div>
          )}
          {activeView === 'uploadMarks' && (
            <div className="w-full"><UploadMarks /></div>
          )}
          {!isTeacher && activeView === 'uploadPhoto' && (
            <div className="w-full"><UploadPhoto /></div>
          )}
          {!isTeacher && activeView === 'fees' && (
            <div className="w-full"><FeeManager /></div>
          )}
          {activeView === 'attendance' && (
            <div className="w-full"><AttendanceSystem embedded /></div>
          )}
          {activeView === 'teacherAttendance' && (
            <div className="w-full"><AttendanceSystem embedded initialTab="teacherGpsAttendance" /></div>
          )}
          {!isTeacher && activeView === 'teachers' && (
            <div className="w-full"><TeacherManagement /></div>
          )}
          {!isTeacher && activeView === 'classPromotion' && (
            <div className="w-full"><ClassPromotion /></div>
          )}
          {!isTeacher && activeView === 'documentManagement' && (
            <div className="w-full"><DocumentManagement /></div>
          )}
          {activeView === 'examinationManagement' && (
            <div className="w-full"><ExaminationManagement /></div>
          )}
          {activeView === 'timetable' && (
            <div className="w-full"><TimetableManagement /></div>
          )}
          {activeView === 'helpCenter' && (
            <div className="w-full"><HelpCenter /></div>
          )}
        </div>

      </div>
    </>
  )
}

export default Dashboard