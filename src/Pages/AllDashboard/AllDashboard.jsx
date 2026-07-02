import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import SEO from '../../Components/SEO/SEO'
import Sidebar from '../../Components/Sidebar'
import ResultView from '../../Components/ResultView/ResultView'
import Student from './Student'
import Subject from './Subject'
import UploadMarks from './UploadMarks'
import ClassPromotion from './ClassPromotion'
import UploadPhoto from '../../Components/UploadPhoto/UploadPhoto'
import FeeManager from '../Fees/FeeManager'
import TeacherManagement from './TeacherManagement'
import AttendanceSystem from '../Attendance/AttendanceSystem'
import { getUser, getLoginType } from '../../Api/auth'
import { getAllStudents } from '../../Api/students'
import { getAllSubjects } from '../../Api/subjects'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { normalizeSchoolClass, sortSchoolClasses } from '../../constants/schoolOptions'

const CLASS_CHART_COLORS = ['#2563eb', '#0f766e', '#f97316', '#9333ea', '#dc2626', '#0891b2', '#ca8a04', '#475569']
const SECTION_COLORS = ['#2563eb', '#16a34a', '#f97316', '#9333ea', '#0f766e', '#e11d48', '#64748b']

const formatClassLabel = (className) => {
  const normalized = normalizeSchoolClass(className)
  if (!normalized || normalized === 'Unknown') return 'Unknown'
  return ['Nursery', 'LKG', 'UKG'].includes(normalized) ? normalized : `Class ${normalized}`
}

const ChartTooltip = ({ active, label, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          borderRadius: '10px',
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
          padding: '10px 12px',
          fontSize: '12px',
        }}
      >
        <p style={{ color: '#0f172a', margin: 0, fontWeight: 800 }}>{label || payload[0].name}</p>
        {payload.map((item) => (
          <p key={item.dataKey} style={{ color: '#475569', margin: '5px 0 0 0', fontWeight: 600 }}>
            {item.name || item.dataKey}: {item.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function MetricLine({ icon, label, value, note, accent = 'from-slate-600 to-slate-900' }) {
  return (
    <div className="group relative flex min-h-[112px] items-center justify-between gap-4 overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_16px_42px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,23,42,0.11)]">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent}`} />
      <div className="absolute -right-10 -top-12 h-24 w-24 rounded-full bg-slate-100 opacity-70 transition duration-300 group-hover:scale-125" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-black leading-none text-slate-950">{value}</p>
        {note ? <p className="mt-2 text-xs font-medium text-slate-500">{note}</p> : null}
      </div>
      <span className={`material-symbols-outlined relative rounded-2xl bg-gradient-to-br ${accent} p-3 text-3xl text-white shadow-lg shadow-slate-300/40 transition duration-300 group-hover:rotate-3 group-hover:scale-105`}>
        {icon}
      </span>
    </div>
  )
}

function FlatSection({ title, subtitle, children, className = '', accent = 'from-slate-600 to-slate-900' }) {
  return (
    <section className={`group relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.1)] ${className}`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-slate-100/80 transition duration-500 group-hover:scale-110" />
      <div className="relative mb-4">
        <h3 className="text-base font-black text-slate-950 sm:text-lg">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="relative">{children}</div>
    </section>
  )
}

function SectionDistribution({ rows = [], total = 0 }) {
  if (!rows.length) {
    return <p className="text-sm font-semibold text-slate-500">No section data available.</p>
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const percent = total > 0 ? Math.round((row.value / total) * 100) : 0
        const color = SECTION_COLORS[index % SECTION_COLORS.length]
        return (
          <div key={row.name}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                Section {row.name}
              </span>
              <span className="text-sm font-black text-slate-950">{row.value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full shadow-sm transition-all duration-700"
                style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LoadingDashboard() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-28 animate-pulse rounded-[22px] border border-slate-200 bg-gradient-to-br from-white to-slate-100 shadow-sm" />
      ))}
    </div>
  )
}

function Dashboard({ initialView = 'dashboard' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen } = useOutletContext()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [activeView, setActiveView] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [loginType, setLoginType] = useState('all')
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalSubjects: 0,
    studentsByClass: [],
    studentsBySection: [],
    subjectsPerClass: [],
    loading: true
  })
  const isTeacher = loginType !== 'student' && user?.role === 'teacher'
  const routeViewMap = {
    '/dashboard': 'dashboard',
    '/students': 'student',
    '/class-promotion': 'classPromotion',
    '/subjects': 'subject',
    '/teachers': 'teachers',
    '/fees': 'fees',
    '/attendance': 'attendance',
    '/marks-upload': 'uploadMarks',
    '/upload-photo': 'uploadPhoto',
    '/result-view': 'result',
  }

  async function fetchDashboardData() {
    setDashboardData(prev => ({ ...prev, loading: true }))
    try {
      // Fetch students data
      const studentsResponse = await getAllStudents()
      const students = studentsResponse?.students || []
      const totalStudents = students.length || studentsResponse?.count || 0

      // Calculate students by class
      const classDistribution = {}
      const sectionDistribution = {}
      
      students.forEach(student => {
        const className = normalizeSchoolClass(student.Class || student.class || 'Unknown') || 'Unknown'
        const section = student.Section || student.section || 'No Section'
        
        classDistribution[className] = (classDistribution[className] || 0) + 1
        sectionDistribution[section] = (sectionDistribution[section] || 0) + 1
      })

      const studentsByClass = sortSchoolClasses(
        Object.entries(classDistribution).map(([className, value]) => ({
          class: className,
          name: formatClassLabel(className),
          value,
        }))
      )

      const studentsBySection = Object.entries(sectionDistribution)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name))

      // Fetch subjects data
      const subjectsResponse = await getAllSubjects()
      const totalClasses = subjectsResponse?.summary?.total_classes || 0
      const totalSubjects = subjectsResponse?.summary?.total_unique_subjects || 0
      
      // Calculate subjects per class
      const subjectsPerClass = []
      if (subjectsResponse?.summary?.subjects_per_class) {
        subjectsResponse.summary.subjects_per_class.forEach(item => {
          const className = normalizeSchoolClass(item.class) || 'Unknown'
          subjectsPerClass.push({
            class: className,
            name: formatClassLabel(className),
            subjects: item.subjects_count,
            sections: item.sections_count
          })
        })
      } else if (subjectsResponse?.classes) {
        subjectsResponse.classes.forEach(cls => {
          const className = normalizeSchoolClass(cls.class) || 'Unknown'
          subjectsPerClass.push({
            class: className,
            name: formatClassLabel(className),
            subjects: cls.total_subjects || 0,
            sections: cls.total_sections || 0
          })
        })
      }
      const sortedSubjectsPerClass = sortSchoolClasses(subjectsPerClass)

      setDashboardData({
        totalStudents,
        totalClasses,
        totalSubjects,
        studentsByClass,
        studentsBySection,
        subjectsPerClass: sortedSubjectsPerClass,
        loading: false
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setDashboardData(prev => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    const currentUser = getUser()
    const loginTypeFromStorage = getLoginType()
    
    if (!currentUser) {
      navigate('/login')
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(currentUser)
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
      if (activeView !== nextView) {
        setActiveView(nextView)
      }
      return
    }

    if (isTeacher) {
      if (!['/attendance', '/marks-upload'].includes(pathname)) {
        navigate('/attendance', { replace: true })
        return
      }
      const nextView = pathname === '/marks-upload' ? 'uploadMarks' : 'attendance'
      if (activeView !== nextView) {
        setActiveView(nextView)
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDashboardData()
    }
  }, [loginType, activeView, isTeacher])

  return (
    <>
      <SEO
        title="School Dashboard"
        description="Internal dashboard for Star Public School staff."
        canonicalPath="/dashboard"
      />
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        activeView={activeView}
        setActiveView={setActiveView}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
      
      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden w-full" data-route-scroll-container="true">
          <div className="w-full max-w-full p-3 sm:p-4 lg:p-6">
            {loginType !== 'student' && !isTeacher && activeView === 'dashboard' && (
              <div className="mx-auto w-full max-w-7xl space-y-7">
                <header className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-[radial-gradient(circle_at_12%_18%,rgba(37,99,235,0.16),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(249,115,22,0.18),transparent_30%),linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#eef6ff_100%)] p-6 shadow-[0_22px_65px_rgba(15,23,42,0.08)] sm:p-7">
                  <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full border border-white/70 bg-white/35 blur-[1px]" />
                  <div className="absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-blue-200/25 blur-2xl" />
                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Control Center</p>
                      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Dashboard Analytics</h2>
                      <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                        Clean overview of students, sections, classes, and subject coverage.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-left shadow-sm backdrop-blur sm:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
                      <p className="mt-1 text-sm font-black text-slate-800">Admin Overview</p>
                    </div>
                  </div>
                </header>

                {dashboardData.loading ? (
                  <LoadingDashboard />
                ) : (
                  <>
                    <section className="grid gap-4 lg:grid-cols-3">
                      <MetricLine
                        icon="people"
                        label="Total Students"
                        value={dashboardData.totalStudents}
                        note="Active student records"
                        accent="from-blue-600 to-cyan-500"
                      />
                      <MetricLine
                        icon="class"
                        label="Total Classes"
                        value={dashboardData.totalClasses}
                        note="Configured class groups"
                        accent="from-emerald-600 to-teal-500"
                      />
                      <MetricLine
                        icon="book"
                        label="Total Subjects"
                        value={dashboardData.totalSubjects}
                        note="Unique subjects"
                        accent="from-orange-500 to-rose-500"
                      />
                    </section>

                    <div className="grid gap-7 lg:grid-cols-[1.25fr_0.75fr]">
                      <FlatSection title="Students by Class" subtitle="Class-wise student distribution" accent="from-blue-600 to-cyan-500">
                        {dashboardData.studentsByClass.length > 0 ? (
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={dashboardData.studentsByClass} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
                              <CartesianGrid stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
                              <XAxis
                                dataKey="name"
                                height={56}
                                tick={{ fill: '#475569', fontSize: 11, fontWeight: 700, dy: 8 }}
                                axisLine={{ stroke: 'rgba(148, 163, 184, 0.28)' }}
                                tickLine={false}
                              />
                              <YAxis
                                domain={[0, 'dataMax']}
                                allowDecimals={false}
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
                              <Bar dataKey="value" name="Students" radius={[8, 8, 0, 0]}>
                                {dashboardData.studentsByClass.map((entry, index) => (
                                  <Cell key={`class-bar-${entry.class || entry.name}`} fill={CLASS_CHART_COLORS[index % CLASS_CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-sm font-semibold text-slate-500">No class data available.</p>
                        )}
                      </FlatSection>

                      <FlatSection title="Students by Section" subtitle="Section split without extra chart clutter" accent="from-emerald-600 to-teal-500">
                        <SectionDistribution rows={dashboardData.studentsBySection} total={dashboardData.totalStudents} />
                      </FlatSection>
                    </div>

                    <FlatSection title="Subjects & Sections per Class" subtitle="Academic setup coverage by class" accent="from-orange-500 to-rose-500">
                      {dashboardData.subjectsPerClass.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={dashboardData.subjectsPerClass} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
                            <CartesianGrid stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
                            <XAxis
                              dataKey="name"
                              height={56}
                              tick={{ fill: '#475569', fontSize: 11, fontWeight: 700, dy: 8 }}
                              axisLine={{ stroke: 'rgba(148, 163, 184, 0.28)' }}
                              tickLine={false}
                            />
                            <YAxis
                              domain={[0, 'dataMax']}
                              allowDecimals={false}
                              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
                            <Legend wrapperStyle={{ fontSize: 12, color: '#475569', fontWeight: 700 }} />
                            <Bar dataKey="subjects" fill="#2563eb" name="Subjects" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="sections" fill="#f97316" name="Sections" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-sm font-semibold text-slate-500">No subject setup data available.</p>
                      )}
                    </FlatSection>

                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <MetricLine
                        icon="trending_up"
                        label="Avg. Students/Class"
                        value={dashboardData.totalClasses > 0 ? Math.round(dashboardData.totalStudents / dashboardData.totalClasses) : 0}
                        accent="from-violet-600 to-fuchsia-500"
                      />
                      <MetricLine
                        icon="library_books"
                        label="Avg. Subjects/Class"
                        value={
                          dashboardData.totalClasses > 0
                            ? Math.round(dashboardData.subjectsPerClass.reduce((sum, item) => sum + item.subjects, 0) / dashboardData.totalClasses)
                            : 0
                        }
                        accent="from-sky-600 to-blue-500"
                      />
                      <MetricLine
                        icon="category"
                        label="Total Sections"
                        value={dashboardData.subjectsPerClass.reduce((sum, item) => sum + item.sections, 0)}
                        accent="from-teal-600 to-emerald-500"
                      />
                      <MetricLine
                        icon="analytics"
                        label="Subject Coverage"
                        value={dashboardData.totalClasses > 0 ? `${Math.round((dashboardData.totalSubjects / dashboardData.totalClasses) * 10)}%` : '0%'}
                        accent="from-rose-600 to-orange-500"
                      />
                    </section>
                  </>
                )}
              </div>
            )}

            {!isTeacher && (loginType === 'student' || activeView === 'result') && <ResultView />}
            
            {!isTeacher && activeView === 'student' && <Student />}

            {!isTeacher && activeView === 'subject' && <Subject />}
            
            {activeView === 'uploadMarks' && <UploadMarks />}

            {!isTeacher && activeView === 'uploadPhoto' && <UploadPhoto />}

            {!isTeacher && activeView === 'fees' && <FeeManager />}

            {activeView === 'attendance' && <AttendanceSystem embedded />}

            {!isTeacher && activeView === 'teachers' && <TeacherManagement />}

            {!isTeacher && activeView === 'classPromotion' && <ClassPromotion />}
          </div>
        </main>
    </>
  )
}

export default Dashboard


