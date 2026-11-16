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

  // User display name
  const displayName = currentUser?.fullName || currentUser?.name || 'Administrator'
  const displayEmail = currentUser?.email || 'admin@starpublicschool.com'
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {loginType !== 'student' && !isTeacher && activeView === 'dashboard' && (
            <div className="mx-auto flex max-w-[1600px] flex-col gap-6 xl:flex-row xl:items-start">

              {/* ================= CENTER COLUMN ================= */}
              <div className="flex-1 min-w-0 space-y-6">

                {/* Top Header / Meta Bar */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {todayFormatted.toUpperCase()} · SESSION 2026–27
                    </p>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Sync Connected
                      </span>

                      <button
                        onClick={fetchDashboardData}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        title="Refresh Data"
                      >
                        <span className="material-symbols-outlined text-base">refresh</span>
                      </button>

                      <select
                        defaultValue="2026-27"
                        className="h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-2xs focus:outline-none cursor-pointer"
                      >
                        <option value="2026-27">Session 2026–27</option>
                        <option value="2025-26">Session 2025–26</option>
                      </select>

                      {/* Mobile Hamburger toggle */}
                      {setSidebarOpen && (
                        <button
                          onClick={() => setSidebarOpen(!sidebarOpen)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 lg:hidden shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-base">menu</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                      {timeGreeting}, {displayName}
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">
                      Campus operations and academic management overview.
                    </p>
                  </div>

                  {/* Quick Action Buttons Row */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      onClick={() => navigate('/students')}
                      className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-gray-800 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base leading-none">person_add</span>
                      <span>New Admission</span>
                    </button>

                    <button
                      onClick={() => navigate('/fees')}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base leading-none text-emerald-600">payments</span>
                      <span>Collect Fee</span>
                    </button>

                    <button
                      onClick={() => navigate('/attendance')}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base leading-none text-blue-600">checklist</span>
                      <span>Take Attendance</span>
                    </button>

                    <button
                      onClick={() => navigate('/marks-upload')}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base leading-none text-purple-600">upload_file</span>
                      <span>Upload Marks</span>
                    </button>

                    <button
                      onClick={() => navigate('/timetable')}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base leading-none text-amber-600">calendar_month</span>
                      <span>Timetable</span>
                    </button>
                  </div>
                </div>

                {/* Campus Overview Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                      Campus Overview
                    </h2>
                    <span className="text-xs text-gray-400">
                      Live Academic Snapshot
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total students */}
                    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Total Students</span>
                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-lg">groups</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-3xl font-bold text-gray-900 tracking-tight">
                          {dashboardData.totalStudents.toLocaleString()}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">Enrolled</span>
                          <span>Active in session</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Total classes */}
                    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Active Classes</span>
                        <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-lg">meeting_room</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-3xl font-bold text-gray-900 tracking-tight">
                          {dashboardData.totalClasses}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-amber-700">Classrooms</span>
                          <span>Nursery to 10th</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Active faculty */}
                    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Teaching Staff</span>
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-lg">badge</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-3xl font-bold text-gray-900 tracking-tight">
                          {dashboardData.totalTeachers}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">Faculty</span>
                          <span>Teaching faculty</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Subjects */}
                    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Curriculum</span>
                        <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-lg">auto_stories</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-3xl font-bold text-gray-900 tracking-tight">
                          {dashboardData.totalSubjects}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="inline-flex items-center rounded-md bg-purple-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-purple-700">Subjects</span>
                          <span>Approved syllabus</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* School Health Section */}
                <div className="space-y-3 pt-2">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                      School Health
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Daily student attendance and roster directory.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Attendance Trend Card */}
                    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              Attendance Trend
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Weekly student presence · Mon–Sat
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                            {attendanceStats.rate}% Overall
                          </span>
                        </div>

                        {/* Toggle Pills: Daily / Weekly / Monthly */}
                        <div className="mt-3 inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium">
                          {['Daily', 'Weekly', 'Monthly'].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setAttendancePeriod(tab)}
                              className={`rounded-md px-3 py-1 transition-all ${attendancePeriod === tab
                                  ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                                  : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        {/* Attendance Chart Visualization */}
                        <div className="mt-4 pt-2">
                          <div className="grid grid-cols-6 gap-3 items-end h-32 px-1">
                            {attendanceStats.dailyTrend.map((item, idx) => (
                              <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                                <span className="text-[10px] font-semibold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {item.rate}%
                                </span>
                                <div
                                  style={{ height: `${Math.max(18, item.rate - 15)}%` }}
                                  className="w-full max-w-[28px] rounded-t-lg bg-gray-900 group-hover:bg-gray-700 transition-all"
                                />
                                <span className="text-[11px] font-medium text-gray-600">
                                  {item.day}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 mt-4 text-xs">
                        <div className="flex items-center gap-4 text-gray-600">
                          <span>Present <strong className="text-gray-900">{attendanceStats.present}</strong></span>
                          <span>Absent <strong className="text-gray-900">{attendanceStats.absent}</strong></span>
                        </div>
                        <button
                          onClick={() => navigate('/attendance')}
                          className="font-semibold text-gray-900 hover:text-gray-600 transition-colors"
                        >
                          View attendance details →
                        </button>
                      </div>
                    </div>

                    {/* Right: Student Roster Directory */}
                    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900">
                            Student Directory
                          </h3>
                          <span className="text-xs text-gray-400">Class Roster</span>
                        </div>

                        {/* Filter Dropdowns */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <select
                            value={selectedClassFilter}
                            onChange={(e) => setSelectedClassFilter(e.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 focus:outline-none cursor-pointer"
                          >
                            <option value="all">All Classes</option>
                            {dashboardData.studentsByClass.map((c) => (
                              <option key={c.class} value={c.class}>Class {c.name}</option>
                            ))}
                          </select>

                          <select
                            value={selectedSectionFilter}
                            onChange={(e) => setSelectedSectionFilter(e.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 focus:outline-none cursor-pointer"
                          >
                            <option value="all">All Sections</option>
                            <option value="A">Section A</option>
                            <option value="B">Section B</option>
                          </select>
                        </div>

                        {/* Students Rows */}
                        <div className="mt-3 space-y-1">
                          {displayedStudents.length === 0 ? (
                            <div className="py-8 text-center text-xs text-gray-400">
                              No students found in this class or section.
                            </div>
                          ) : (
                            displayedStudents.slice(0, 4).map((s, idx) => {
                              const name = s.name || s.Name || `Student ${idx + 1}`
                              const studentClass = s.class || s.Class || '1'
                              const studentSection = s.section || s.Section || 'A'
                              const rollNo = s.roll_no || s.Roll_No || idx + 1
                              return (
                                <div key={s.id || idx} className="flex items-center justify-between text-xs py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-800 font-semibold text-xs">
                                      {name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 leading-tight">
                                        {name}
                                      </p>
                                      <p className="text-[10.5px] text-gray-400">
                                        Class {studentClass}-{studentSection} · Roll #{rollNo}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                                    Enrolled
                                  </span>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>

                      {/* Footer Row */}
                      <div className="pt-4 border-t border-gray-100 mt-4 text-xs">
                        <button
                          onClick={() => navigate('/students')}
                          className="font-semibold text-gray-900 hover:text-gray-600 transition-colors"
                        >
                          View all student records →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Banner */}
                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">schedule</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Today&apos;s Class Routine & Timetable
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Manage faculty periods, room allocations, and daily subject bells.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="material-symbols-outlined text-xs text-gray-400">calendar_today</span>
                    </div>

                    <button
                      onClick={() => navigate('/timetable')}
                      className="text-xs font-semibold text-gray-900 hover:text-gray-600 transition-colors"
                    >
                      View Timetable →
                    </button>
                  </div>
                </div>

              </div>

              {/* ================= RIGHT UTILITY COLUMN ================= */}
              <div className="w-full xl:w-[320px] xl:shrink-0 space-y-5">

                {/* 1. Admin Identity Card */}
                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white font-medium text-sm">
                      {userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        Super Administrator
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 text-xs flex items-center justify-between">
                    <span className="text-gray-400 truncate text-[11px]">{displayEmail}</span>
                    <button
                      onClick={() => navigate('/teachers')}
                      className="font-semibold text-gray-900 hover:text-gray-600 transition-colors"
                    >
                      Staff →
                    </button>
                  </div>
                </div>

                {/* 2. Interactive Calendar Card */}
                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {currentMonthYear}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => changeMonth(-1)}
                        className="h-7 w-7 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                        title="Previous Month"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => changeMonth(1)}
                        className="h-7 w-7 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                        title="Next Month"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="text-[10.5px] text-gray-400 flex items-center gap-3 pt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-900" />
                      Today
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Holiday
                    </span>
                  </div>

                  {/* Days header */}
                  <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-gray-400 pt-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <span key={i}>{d}</span>
                    ))}
                  </div>

                  {/* Dates grid */}
                  <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-medium text-gray-700">
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                      <span key={`b-${i}`} className="h-7 flex items-center justify-center text-gray-300 text-xs">
                        {prevMonthDays - firstDayIndex + i + 1}
                      </span>
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1
                      const isSelected = dayNum === selectedDay
                      const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                      const isHoliday = realHolidays.some((h) => (h.holiday_date || h.start_date) === dateStr)

                      return (
                        <div key={dayNum} className="h-7 flex items-center justify-center">
                          <button
                            onClick={() => setSelectedDay(dayNum)}
                            className={`h-6 w-6 rounded-full text-xs flex items-center justify-center transition-all ${isSelected
                                ? 'bg-gray-900 text-white font-semibold'
                                : isHoliday
                                  ? 'bg-rose-50 text-rose-700 font-bold'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                          >
                            {dayNum}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Upcoming Events & Holidays Card */}
                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      School Events & Holidays
                    </h3>
                  </div>

                  <div className="space-y-2 pt-1 text-xs">
                    {realHolidays && realHolidays.length > 0 ? (
                      realHolidays.slice(0, 4).map((h) => (
                        <div key={h.id || h.holiday_date} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-none">
                          <div>
                            <p className="font-medium text-gray-900">{h.title || h.name || h.holiday_name}</p>
                            <p className="text-[10.5px] text-gray-400">
                              {h.holiday_type || 'Holiday'} · {h.holiday_date ? new Date(h.holiday_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Scheduled'}
                            </p>
                          </div>
                          <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-xs text-gray-400">
                        No upcoming events scheduled.
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={() => navigate('/attendance')}
                      className="text-xs font-semibold text-gray-900 hover:text-gray-600 transition-colors"
                    >
                      View all calendar events →
                    </button>
                  </div>
                </div>

                {/* 4. Pinned Notes Card */}
                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Pinned Notes
                    </h3>
                    <button
                      onClick={() => setIsAddingNote(!isAddingNote)}
                      className="h-6 w-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900"
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
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-gray-400"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsAddingNote(false)}
                          className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-800"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-1.5">
                    {notes.length > 0 ? (
                      notes.map((n) => (
                        <div key={n.id} className="group flex items-start justify-between rounded-lg bg-gray-50 p-2 text-xs">
                          <span className="text-gray-700 font-normal leading-tight">{n.title}</span>
                          <button
                            onClick={() => setNotes((prev) => prev.filter((item) => item.id !== n.id))}
                            className="hidden group-hover:block text-gray-400 hover:text-rose-500 ml-1 text-xs font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-2">No pinned notes. Click + to add one.</p>
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
            <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-xs"><UploadPhoto /></div>
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
            <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-xs"><ClassPromotion /></div>
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