import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import SEO from '../../Components/SEO/SEO'
import Sidebar from '../../Components/Sidebar'
import ResultView from '../../Components/ResultView/ResultView'
import Student from './Student'
import StudentLifecycle from './StudentLifecycle'
import Subject from './Subject'
import UploadMarks from './UploadMarks'
import ClassPromotion from './ClassPromotion'
import UploadPhoto from '../../Components/UploadPhoto/UploadPhoto'
import FeeManager from '../Fees/FeeManager'
import TeacherManagement from './TeacherManagement'
import { getUser, getLoginType } from '../../Api/auth'
import { getAllStudents } from '../../Api/students'
import { getAllSubjects } from '../../Api/subjects'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Custom Tooltip for Pie Chart with white text
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: 'rgba(7, 20, 36, 0.96)',
          border: '1px solid rgba(148, 163, 184, 0.28)',
          borderRadius: '12px',
          padding: '8px 12px',
          fontSize: '12px',
        }}
      >
        <p style={{ color: '#ffffff', margin: 0, fontWeight: 'bold' }}>
          {payload[0].name}
        </p>
        <p style={{ color: '#ffffff', margin: '4px 0 0 0' }}>
          {payload[0].dataKey}: {payload[0].value}
        </p>
      </div>
    )
  }
  return null
}

function Dashboard({ initialView = 'dashboard' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen } = useOutletContext()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
    '/leave-rejoin': 'studentLifecycle',
    '/class-promotion': 'classPromotion',
    '/subjects': 'subject',
    '/teachers': 'teachers',
    '/fees': 'fees',
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
        const className = student.Class || student.class || 'Unknown'
        const section = student.Section || student.section || 'No Section'
        
        classDistribution[className] = (classDistribution[className] || 0) + 1
        sectionDistribution[section] = (sectionDistribution[section] || 0) + 1
      })

      const studentsByClass = Object.entries(classDistribution)
        .map(([name, value]) => ({ name: `Class ${name}`, value }))
        .sort((a, b) => {
          const numA = parseInt(a.name.replace('Class ', '')) || 999
          const numB = parseInt(b.name.replace('Class ', '')) || 999
          return numA - numB
        })

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
          subjectsPerClass.push({
            name: `Class ${item.class}`,
            subjects: item.subjects_count,
            sections: item.sections_count
          })
        })
      } else if (subjectsResponse?.classes) {
        subjectsResponse.classes.forEach(cls => {
          subjectsPerClass.push({
            name: `Class ${cls.class}`,
            subjects: cls.total_subjects || 0,
            sections: cls.total_sections || 0
          })
        })
      }

      setDashboardData({
        totalStudents,
        totalClasses,
        totalSubjects,
        studentsByClass,
        studentsBySection,
        subjectsPerClass,
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
      if (pathname !== '/result-view') {
        navigate('/result-view', { replace: true })
        return
      }
      if (activeView !== 'result') {
        setActiveView('result')
      }
      return
    }

    if (isTeacher) {
      if (pathname !== '/marks-upload') {
        navigate('/marks-upload', { replace: true })
        return
      }
      if (activeView !== 'uploadMarks') {
        setActiveView('uploadMarks')
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
          <div className="p-3 sm:p-4 lg:p-6 w-full max-w-full">
            {loginType !== 'student' && !isTeacher && activeView === 'dashboard' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="gps-card border border-green-100  transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(96,165,250,0.18)] sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Control Center</p>
                  <h2 className="mt-2 text-2xl font-extrabold text-black sm:text-3xl">Dashboard Analytics</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Real-time overview of students, class setup and subject distribution across the school.
                  </p>
                </div>
                
                {/* Dashboard Cards */}
                {dashboardData.loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="gps-kpi-card p-4 sm:p-5">
                        <div className="flex items-center justify-center py-8">
                          <span className="material-symbols-outlined animate-spin text-2xl sm:text-3xl text-cyan-200">sync</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {/* Total Students */}
                    <div className="gps-kpi-card border border-sky-200 bg-[linear-gradient(135deg,#ffffff_0%,#e0f2fe_65%,#f0f9ff_100%)] p-4 shadow-[0_16px_34px_rgba(125,211,252,0.12)] transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-300 hover:shadow-[0_22px_42px_rgba(56,189,248,0.18)] sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs sm:text-sm font-medium text-slate-500">Total Students</span>
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-sky-200/80 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <span className="material-symbols-outlined text-sky-600 text-base sm:text-lg">people</span>
                        </div>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900">{dashboardData.totalStudents}</p>
                    </div>

                    {/* Total Classes */}
                    <div className="gps-kpi-card border border-emerald-200 bg-[linear-gradient(135deg,#ffffff_0%,#dcfce7_65%,#f0fdf4_100%)] p-4 shadow-[0_16px_34px_rgba(134,239,172,0.12)] transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-300 hover:shadow-[0_22px_42px_rgba(74,222,128,0.18)] sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs sm:text-sm font-medium text-slate-500">Total Classes</span>
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-200/80 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <span className="material-symbols-outlined text-emerald-600 text-base sm:text-lg">class</span>
                        </div>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900">{dashboardData.totalClasses}</p>
                    </div>

                    {/* Total Subjects */}
                    <div className="gps-kpi-card border border-violet-200 bg-[linear-gradient(135deg,#ffffff_0%,#ede9fe_65%,#f5f3ff_100%)] p-4 shadow-[0_16px_34px_rgba(196,181,253,0.14)] transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-300 hover:shadow-[0_22px_42px_rgba(167,139,250,0.18)] sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs sm:text-sm font-medium text-slate-500">Total Subjects</span>
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-violet-200/80 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <span className="material-symbols-outlined text-violet-600 text-base sm:text-lg">book</span>
                        </div>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900">{dashboardData.totalSubjects}</p>
                    </div>
                  </div>
                )}

                {/* Analytics Section */}
                {!dashboardData.loading && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {/* Students Distribution by Class */}
                    {dashboardData.studentsByClass.length > 0 && (
                      <div className="gps-card p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-4">Students Distribution by Class</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={dashboardData.studentsByClass}>
                            <CartesianGrid stroke="rgba(153, 178, 209, 0.2)" strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={0} 
                              textAnchor="middle" 
                              height={60}
                              tick={{ fill: '#000000', fontSize: 10, fontWeight: 700, dy: 8 }}
                              axisLine={{ stroke: 'rgba(153, 178, 209, 0.35)' }}
                              tickLine={{ stroke: 'rgba(153, 178, 209, 0.35)' }}
                            />
                            <YAxis
                              domain={[0, 'dataMax']}
                              allowDecimals={false}
                              tick={{ fill: '#000000', fontSize: 10 }}
                              axisLine={{ stroke: 'rgba(153, 178, 209, 0.35)' }}
                              tickLine={{ stroke: 'rgba(153, 178, 209, 0.35)' }}
                            />
                            <Tooltip
                              contentStyle={{
                                fontSize: 12,
                                borderRadius: 12,
                                border: '1px solid rgba(148, 163, 184, 0.28)',
                                background: 'rgba(7, 20, 36, 0.96)',
                                color: '#e6f2ff',
                              }}
                              labelStyle={{ color: '#cfe5ff' }}
                              wrapperStyle={{ background: 'transparent' }}
                              cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="value" fill="#7dd3fc" name="Students" cursor="pointer" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Students Distribution by Section */}
                    {dashboardData.studentsBySection.length > 0 && (
                      <div className="gps-card p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-4">Students Distribution by Section</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={dashboardData.studentsBySection}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              labelStyle={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }}
                              outerRadius={60}
                              fill="#7dd3fc"
                              dataKey="value"
                            >
                              {dashboardData.studentsBySection.map((entry, index) => {
                                const colors = ['#7dd3fc', '#86efac', '#f9a8d4', '#c4b5fd', '#fdba74', '#93c5fd']
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                              })}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'transparent' }} />
                            <Legend wrapperStyle={{ fontSize: 10, color: '#d3e7ff' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Subjects per Class */}
                    {dashboardData.subjectsPerClass.length > 0 && (
                      <div className="gps-card p-4 sm:p-6 lg:col-span-2">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-4">Subjects & Sections per Class</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={dashboardData.subjectsPerClass}>
                            <CartesianGrid stroke="rgba(153, 178, 209, 0.2)" strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={0} 
                              textAnchor="middle" 
                              height={60}
                              tick={{ fill: '#000000', fontSize: 10, fontWeight: 700, dy: 8 }}
                              axisLine={{ stroke: 'rgba(153, 178, 209, 0.35)' }}
                              tickLine={{ stroke: 'rgba(153, 178, 209, 0.35)' }}
                            />
                            <YAxis
                              domain={[0, 'dataMax']}
                              allowDecimals={false}
                              tick={{ fill: '#000000', fontSize: 10 }}
                              axisLine={{ stroke: 'rgba(153, 178, 209, 0.35)' }}
                              tickLine={{ stroke: 'rgba(153, 178, 209, 0.35)' }}
                            />
                            <Tooltip
                              contentStyle={{
                                fontSize: 12,
                                borderRadius: 12,
                                border: '1px solid rgba(148, 163, 184, 0.28)',
                                background: 'rgba(7, 20, 36, 0.96)',
                                color: '#e6f2ff',
                              }}
                              labelStyle={{ color: '#cfe5ff' }}
                              wrapperStyle={{ background: 'transparent' }}
                              cursor={{ fill: 'transparent' }}
                            />
                            <Legend wrapperStyle={{ fontSize: 10, color: '#d3e7ff' }} />
                            <Bar dataKey="subjects" fill="#60a5fa" name="Subjects" cursor="pointer" />
                            <Bar dataKey="sections" fill="#86efac" name="Sections" cursor="pointer" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-2">
                      <div className="gps-card-soft p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-cyan-100 mb-1 truncate">Avg. Students/Class</p>
                            <p className="text-xl sm:text-2xl font-black text-white">
                              {dashboardData.totalClasses > 0 
                                ? Math.round(dashboardData.totalStudents / dashboardData.totalClasses) 
                                : 0}
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-cyan-200 text-2xl sm:text-3xl flex-shrink-0">trending_up</span>
                        </div>
                      </div>

                      <div className="gps-card-soft p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-cyan-100 mb-1 truncate">Avg. Subjects/Class</p>
                            <p className="text-xl sm:text-2xl font-black text-white">
                              {dashboardData.totalClasses > 0 
                                ? Math.round(dashboardData.subjectsPerClass.reduce((sum, item) => sum + item.subjects, 0) / dashboardData.totalClasses) 
                                : 0}
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-cyan-200 text-2xl sm:text-3xl flex-shrink-0">book</span>
                        </div>
                      </div>

                      <div className="gps-card-soft p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-cyan-100 mb-1 truncate">Total Sections</p>
                            <p className="text-xl sm:text-2xl font-black text-white">
                              {dashboardData.subjectsPerClass.reduce((sum, item) => sum + item.sections, 0)}
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-cyan-200 text-2xl sm:text-3xl flex-shrink-0">category</span>
                        </div>
                      </div>

                      <div className="gps-card-soft p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-cyan-100 mb-1 truncate">Subject Coverage</p>
                            <p className="text-xl sm:text-2xl font-black text-white">
                              {dashboardData.totalClasses > 0 
                                ? `${Math.round((dashboardData.totalSubjects / dashboardData.totalClasses) * 10)}%`
                                : '0%'}
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-cyan-200 text-2xl sm:text-3xl flex-shrink-0">analytics</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isTeacher && (loginType === 'student' || activeView === 'result') && <ResultView />}
            
            {!isTeacher && activeView === 'student' && <Student />}

            {!isTeacher && activeView === 'studentLifecycle' && <StudentLifecycle />}
            
            {!isTeacher && activeView === 'subject' && <Subject />}
            
            {activeView === 'uploadMarks' && <UploadMarks />}

            {!isTeacher && activeView === 'uploadPhoto' && <UploadPhoto />}

            {!isTeacher && activeView === 'fees' && <FeeManager />}

            {!isTeacher && activeView === 'teachers' && <TeacherManagement />}

            {!isTeacher && activeView === 'classPromotion' && <ClassPromotion />}
          </div>
        </main>
    </>
  )
}

export default Dashboard


