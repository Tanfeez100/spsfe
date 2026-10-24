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
import { getAttendanceBootstrap, getHolidayCalendar } from '../../Api/attendance'
import { normalizeSchoolClass, sortSchoolClasses } from '../../constants/schoolOptions'
import BatchIdCardGenerator from '../../Components/Student/BatchIdCardGenerator'
import DocumentManagement from '../DocumentManagement/DocumentManagement'
import ExaminationManagement from '../ExaminationManagement/ExaminationManagement'

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
    totalStudents: 1245,
    totalClasses: 12,
    totalSubjects: 34,
    totalTeachers: 48,
    studentsByClass: [],
    studentsBySection: [],
    loading: false,
  })

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 9, 16)) // October 16, 2026
  const [selectedDay, setSelectedDay] = useState(16)

  // Pinned Notes state
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('sps_dashboard_notes_v3')
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return [
      { id: 1, title: 'Check Class 10 science lab records', date: 'Oct 16' },
      { id: 2, title: 'Verify fee reconciliation for bus transport', date: 'Oct 18' },
    ]
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
    '/result-view': 'result',
  }

  // Persist notes
  useEffect(() => {
    try {
      localStorage.setItem('sps_dashboard_notes_v3', JSON.stringify(notes))
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
      const totalStudents = students.length || 1245

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
        subjectsResponse?.summary?.total_classes ||
        studentsByClass.length ||
        (Array.isArray(subjectsResponse?.classes) ? subjectsResponse.classes.length : 0) ||
        12
      const totalSubjects = subjectsResponse?.summary?.total_unique_subjects || 34

      let totalTeachers = 48
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
      if (!['/attendance', '/marks-upload'].includes(pathname)) {
        navigate('/attendance', { replace: true })
        return
      }
      const nextView = pathname === '/marks-upload' ? 'uploadMarks' : 'attendance'
      if (activeView !== nextView) setActiveView(nextView)
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
      list = list.filter((s) => String(s.Class || s.class || '').toLowerCase() === selectedClassFilter.toLowerCase())
    }
    if (selectedSectionFilter !== 'all') {
      list = list.filter((s) => String(s.Section || s.section || '').toUpperCase() === selectedSectionFilter.toUpperCase())
    }
    if (list.length === 0) {
      return [
        { id: 1, name: 'Sam smith', class: '1', section: 'B', roll_no: '01', score: 98 },
        { id: 2, name: 'Olivier james', class: '1', section: 'B', roll_no: '02', score: 98 },
        { id: 3, name: 'Michelle marie', class: '1', section: 'B', roll_no: '03', score: 98 },
        { id: 4, name: 'Cassandra brit', class: '1', section: 'B', roll_no: '04', score: 98 },
      ]
    }
    return list.slice(0, 4).map((s, i) => ({
      ...s,
      score: 95 + (i % 5),
    }))
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
  const displayName = currentUser?.fullName || currentUser?.name || 'Principal Sharma'
  const displayEmail = currentUser?.email || 'admin@starpublicschool.com'
  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'PS'

  return (
    <>
      <SEO
        title="Admin Console | Star Public School"
        description="Internal operations dashboard for Star Public School leadership."
        canonicalPath="/dashboard"
      />

      <div className="flex h-full w-full overflow-hidden bg-[#fbfcfb]">

        {/* ================= LEFT SIDEBAR (Dark Forest Teal) ================= */}
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
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      FRIDAY, 16 OCTOBER 2026 · SESSION 2026–27
                    </p>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live sync · illustrative
                      </span>

                      <button
                        onClick={fetchDashboardData}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition-colors"
                        title="Refresh Data"
                      >
                        <span className="material-symbols-outlined text-base">refresh</span>
                      </button>

                      <select
                        defaultValue="2026-27"
                        className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
                      >
                        <option value="2026-27">2026–27</option>
                        <option value="2025-26">2025–26</option>
                      </select>

                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition-colors">
                        <span className="material-symbols-outlined text-base">filter_list</span>
                      </button>

                      {/* Mobile Hamburger toggle */}
                      {setSidebarOpen && (
                        <button
                          onClick={() => setSidebarOpen(!sidebarOpen)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-base">menu</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f1e36]">
                      Good afternoon, {displayName}
                    </h1>
                    <p className="mt-1 text-xs font-normal text-slate-500">
                      Your campus priorities, all in one clear view.
                    </p>
                  </div>

                  {/* Quick Action Buttons Row */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      onClick={() => navigate('/students')}
                      className="rounded-xl bg-[#132c4e] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#0e223e] transition-colors"
                    >
                      New admission
                    </button>

                    <button
                      onClick={() => navigate('/fees')}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                    >
                      Collect fee
                    </button>

                    <button
                      onClick={() => navigate('/attendance')}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                    >
                      Take attendance
                    </button>

                    <button
                      onClick={() => navigate('/marks-upload')}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                    >
                      Upload marks
                    </button>
                  </div>
                </div>

                {/* Campus overview Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#0f1e36]">
                      Campus overview
                    </h2>
                    <span className="text-xs text-slate-400 font-normal">
                      Updated just now · illustrative
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total students */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">Total students</span>
                          <div className="h-7 w-7 rounded-lg bg-[#e2ecf8] text-[#2563eb] flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">groups</span>
                          </div>
                        </div>
                        <p className="mt-2 text-3xl font-extrabold text-[#0f1e36] tracking-tight">
                          {dashboardData.totalStudents.toLocaleString()}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">
                          +4.2% vs last academic year
                        </p>
                      </div>
                      {/* Mini sparkline curve */}
                      <div className="mt-4 h-6 w-full">
                        <svg viewBox="0 0 160 26" fill="none" className="w-full h-full">
                          <path
                            d="M 0,22 Q 40,20 70,16 T 140,6 L 160,4"
                            stroke="#1d4ed8"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Card 2: Total classes */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">Total classes</span>
                          <div className="h-7 w-7 rounded-lg bg-[#fef3c7] text-[#d97706] flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">meeting_room</span>
                          </div>
                        </div>
                        <p className="mt-2 text-3xl font-extrabold text-[#0f1e36] tracking-tight">
                          {dashboardData.totalClasses}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">
                          Pre-primary to Senior Secondary
                        </p>
                      </div>
                      <div className="mt-4 flex gap-1 h-1.5">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="flex-1 rounded-full bg-amber-400/40" />
                        ))}
                      </div>
                    </div>

                    {/* Card 3: Active faculty */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">Active faculty</span>
                          <div className="h-7 w-7 rounded-lg bg-[#dcfce7] text-[#16a34a] flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">badge</span>
                          </div>
                        </div>
                        <p className="mt-2 text-3xl font-extrabold text-[#0f1e36] tracking-tight">
                          {dashboardData.totalTeachers}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">
                          96% present today
                        </p>
                      </div>
                      <div className="mt-4 flex gap-1 h-1.5">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="flex-1 rounded-full bg-emerald-400/40" />
                        ))}
                      </div>
                    </div>

                    {/* Card 4: Subjects */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">Subjects</span>
                          <div className="h-7 w-7 rounded-lg bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">auto_stories</span>
                          </div>
                        </div>
                        <p className="mt-2 text-3xl font-extrabold text-[#0f1e36] tracking-tight">
                          {dashboardData.totalSubjects}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">
                          CBSE curriculum
                        </p>
                      </div>
                      <div className="mt-4 flex gap-1 h-1.5">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="flex-1 rounded-full bg-indigo-400/40" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* School health Section */}
                <div className="space-y-3 pt-2">
                  <div>
                    <h2 className="text-base font-bold text-[#0f1e36]">
                      School health
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Attendance and learning signals at a glance.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Attendance trend Card */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-[#0f1e36]">
                              Attendance trend
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Students present · Mon–Sat
                            </p>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            94.6% today
                          </span>
                        </div>

                        {/* Toggle Pills: Daily / Weekly / Monthly */}
                        <div className="mt-3 inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                          {['Daily', 'Weekly', 'Monthly'].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setAttendancePeriod(tab)}
                              className={`rounded-md px-3 py-1 transition-all ${attendancePeriod === tab
                                  ? 'bg-[#132c4e] text-white shadow-2xs font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        {/* Attendance Chart Visualization */}
                        <div className="mt-4 pt-2">
                          <div className="grid grid-cols-6 gap-3 items-end h-32 px-1">
                            {[
                              { day: 'Mon', rate: 95 },
                              { day: 'Tue', rate: 93 },
                              { day: 'Wed', rate: 96 },
                              { day: 'Thu', rate: 94 },
                              { day: 'Fri', rate: 95 },
                              { day: 'Sat', rate: 92 },
                            ].map((item, idx) => (
                              <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                                <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {item.rate}%
                                </span>
                                <div
                                  style={{ height: `${item.rate - 20}%` }}
                                  className="w-full max-w-[28px] rounded-t-lg bg-[#38bdf8] group-hover:bg-[#0284c7] transition-all"
                                />
                                <span className="text-[11px] font-semibold text-slate-600">
                                  {item.day}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-4 text-xs">
                        <div className="flex items-center gap-4 text-slate-700">
                          <span>Present <strong className="text-slate-900">1,178</strong></span>
                          <span>Absent <strong className="text-slate-900">67</strong></span>
                        </div>
                        <button
                          onClick={() => navigate('/attendance')}
                          className="font-semibold text-[#1e40af] hover:underline"
                        >
                          View attendance details →
                        </button>
                      </div>
                    </div>

                    {/* Right: Student performance Card */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-[#0f1e36]">
                          Student performance
                        </h3>

                        {/* Filter Dropdowns matching mockup */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <select
                            value={selectedClassFilter}
                            onChange={(e) => setSelectedClassFilter(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="all">All classes</option>
                            {dashboardData.studentsByClass.map((c) => (
                              <option key={c.class} value={c.class}>Class {c.name}</option>
                            ))}
                          </select>

                          <select
                            value={selectedSectionFilter}
                            onChange={(e) => setSelectedSectionFilter(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="all">All sections</option>
                            <option value="A">Section A</option>
                            <option value="B">Section B</option>
                          </select>

                          <select
                            value={selectedMasteryFilter}
                            onChange={(e) => setSelectedMasteryFilter(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="all">All results</option>
                            <option value="top">Top scores</option>
                          </select>
                        </div>

                        {/* Performance rows */}
                        <div className="mt-4 space-y-2.5">
                          {displayedStudents.slice(0, 4).map((s, idx) => (
                            <div key={s.id || idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-none">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef2f6] text-[#0f1e36] font-bold text-xs">
                                  {(s.name || 'S').charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 leading-tight">
                                    {s.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    Class {s.class || '1'} · Section {s.section || 'A'}
                                  </p>
                                </div>
                              </div>
                              <span className="font-extrabold text-slate-900">
                                {s.score || 98}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer Row */}
                      <div className="pt-4 border-t border-slate-100 mt-4 text-xs">
                        <button
                          onClick={() => navigate('/result-view')}
                          className="font-semibold text-[#1e40af] hover:underline"
                        >
                          View all records →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Needs attention Section */}
                <div className="space-y-3 pt-2">
                  <h2 className="text-base font-bold text-[#0f1e36]">
                    Needs attention
                  </h2>

                  <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#0f1e36]">
                        Today&apos;s teaching schedule
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Four periods across the school day
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
                        <span>10/16/2026</span>
                        <span className="material-symbols-outlined text-xs text-slate-400">calendar_today</span>
                      </div>

                      <button
                        onClick={() => navigate('/subjects')}
                        className="text-xs font-semibold text-[#1e40af] hover:underline"
                      >
                        View full timetable →
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* ================= RIGHT UTILITY COLUMN ================= */}
              <div className="w-full xl:w-[320px] xl:shrink-0 space-y-6">

                {/* 1. Principal Sharma User Card */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e2ecf8] text-[#0f1e36] font-bold text-sm">
                      {userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#0f1e36] leading-tight truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        Super Admin
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => navigate('/teachers')}
                      className="font-semibold text-[#1e40af] hover:underline"
                    >
                      View profile →
                    </button>
                  </div>
                </div>

                {/* 2. Calendar Card */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#0f1e36]">
                      Calendar
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => changeMonth(-1)}
                        className="h-7 w-7 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 flex items-center justify-center"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => changeMonth(1)}
                        className="h-7 w-7 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 flex items-center justify-center"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  {/* Legend matching mockup */}
                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Exam
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Holiday
                    </span>
                    <span className="text-slate-400">· Select a date to filter</span>
                  </div>

                  {/* Days header */}
                  <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 pt-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <span key={i}>{d}</span>
                    ))}
                  </div>

                  {/* Dates grid */}
                  <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-semibold text-slate-700">
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                      <span key={`b-${i}`} className="h-7 flex items-center justify-center text-slate-300 text-xs">
                        {prevMonthDays - firstDayIndex + i + 1}
                      </span>
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1
                      const isSelected = dayNum === selectedDay
                      const isExam = dayNum === 24
                      const isHoliday = dayNum === 31

                      return (
                        <div key={dayNum} className="h-7 flex items-center justify-center">
                          <button
                            onClick={() => setSelectedDay(dayNum)}
                            className={`h-6 w-6 rounded-full text-xs flex items-center justify-center transition-all ${isSelected
                                ? 'bg-[#132c4e] text-white font-bold'
                                : isExam
                                  ? 'bg-amber-100 text-amber-900 font-bold'
                                  : isHoliday
                                    ? 'bg-rose-100 text-rose-800 font-bold'
                                    : 'hover:bg-slate-100'
                              }`}
                          >
                            {dayNum}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Upcoming events Card */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#0f1e36]">
                      Upcoming events
                    </h3>
                  </div>

                  <select className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer">
                    <option value="all">All</option>
                    <option value="academic">Academic</option>
                    <option value="holiday">Holiday</option>
                  </select>

                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <div>
                        <p className="font-semibold text-slate-800">Term 1 Assessment</p>
                        <p className="text-[10px] text-slate-400">Exam · Oct 24, 2026</p>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <div>
                        <p className="font-semibold text-slate-800">Diwali Break</p>
                        <p className="text-[10px] text-slate-400">Holiday · Oct 31, 2026</p>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => navigate('/attendance')}
                      className="text-xs font-semibold text-[#1e40af] hover:underline"
                    >
                      See all →
                    </button>
                  </div>
                </div>

                {/* 4. Pinned notes Card */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#0f1e36]">
                      Pinned notes
                    </h3>
                    <button
                      onClick={() => setIsAddingNote(!isAddingNote)}
                      className="h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                      title="Add note"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>

                  {isAddingNote && (
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <input
                        type="text"
                        placeholder="Note title..."
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsAddingNote(false)}
                          className="px-2 py-0.5 text-xs text-slate-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded bg-[#132c4e] px-2.5 py-0.5 text-xs font-bold text-white"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-1.5">
                    {notes.length > 0 ? (
                      notes.map((n) => (
                        <div key={n.id} className="group flex items-start justify-between rounded-lg bg-slate-50 p-2 text-xs">
                          <span className="text-slate-700 font-medium leading-tight">{n.title}</span>
                          <button
                            onClick={() => setNotes((prev) => prev.filter((item) => item.id !== n.id))}
                            className="hidden group-hover:block text-slate-400 hover:text-rose-500 ml-1 text-xs font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">Loading saved notes...</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Sub-view router preserving all administrative features */}
          {!isTeacher && (loginType === 'student' || activeView === 'result') && (
            <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-xs"><ResultView /></div>
          )}
          {!isTeacher && activeView === 'student' && (
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
        </div>

      </div>
    </>
  )
}

export default Dashboard