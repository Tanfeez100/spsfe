import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession, getLoginType, getUser, logout } from '../Api/auth'

const viewPathMap = {
  dashboard: '/dashboard',
  student: '/students',
  classPromotion: '/class-promotion',
  subject: '/subjects',
  teachers: '/teachers',
  fees: '/fees',
  attendance: '/attendance',
  uploadMarks: '/marks-upload',
  uploadPhoto: '/upload-photo',
  result: '/result-view',
}

function Sidebar({ isOpen, setIsOpen, activeView, setActiveView, sidebarCollapsed, setSidebarCollapsed }) {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [loginType, setLoginType] = useState('all')
  const [user, setUser] = useState(null)

  useEffect(() => {
    setLoginType(getLoginType())
    setUser(getUser())
  }, [])

  const menuConfig = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'student', label: 'Student', icon: 'person_add' },
      { id: 'classPromotion', label: 'Class Promotion', icon: 'arrow_upward' },
      { id: 'subject', label: 'Subject', icon: 'book' },
      { id: 'teachers', label: 'Teacher', icon: 'assignment_ind' },
      { id: 'fees', label: 'Fees', icon: 'payments' },
      { id: 'attendance', label: 'Attendance', icon: 'fact_check' },
      { id: 'uploadMarks', label: 'Marks Upload', icon: 'upload' },
      { id: 'uploadPhoto', label: 'Upload Photo', icon: 'photo_camera' },
    ],
    teacher: [
      { id: 'attendance', label: 'Attendance', icon: 'fact_check' },
      { id: 'uploadMarks', label: 'Marks Upload', icon: 'upload' },
    ],
    student: [
      { id: 'attendance', label: 'Attendance', icon: 'fact_check' },
      { id: 'result', label: 'Result View', icon: 'assessment' },
      { id: 'profile', label: 'Profile', icon: 'person' },
    ],
    public: [
      { id: 'home', label: 'Home', icon: 'home' },
      { id: 'about', label: 'About', icon: 'info' },
      { id: 'contact', label: 'Contact', icon: 'call' },
    ],
  }

  let role = 'public'
  if (loginType === 'student') role = 'student'
  else if (user?.role === 'admin') role = 'admin'
  else if (user?.role === 'teacher') role = 'teacher'

  const menuItems = menuConfig[role]
  const collapsedDesktopOnly = sidebarCollapsed
  const isDesktop = () => typeof window !== 'undefined' && window.innerWidth >= 1024

  const handleSidebarMouseEnter = () => {
    if (isDesktop()) setSidebarCollapsed(false)
  }

  const handleSidebarMouseLeave = () => {
    if (isDesktop()) setSidebarCollapsed(true)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const currentLoginType = getLoginType()

    try {
      if (currentLoginType === 'all') await logout()
      else clearSession()
    } catch (error) {
      console.error('Logout error:', error)
      clearSession()
    } finally {
      clearSession()
      if (currentLoginType === 'student') navigate('/student-login')
      else navigate('/login')
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
          style={{ touchAction: 'manipulation' }}
        ></div>
      )}

      <aside
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        className={`fixed bottom-0 left-0 top-0 z-50 h-full w-4/5 max-w-xs transition-all duration-300 ease-out lg:static lg:h-full lg:max-w-none ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-full bg-white">
          <div className="flex h-full flex-col overflow-hidden border-r border-slate-200 bg-white">
            <div
              className={`flex items-center justify-between border-b border-slate-200 px-4 py-3.5 ${
                collapsedDesktopOnly ? 'lg:hidden' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm lg:hidden"
                  aria-label="Close sidebar"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
              <p
                className={`text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ${
                  collapsedDesktopOnly ? 'lg:hidden' : ''
                }`}
              >
                Navigation
              </p>
            </div>

            <nav className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden py-2.5">
              <div className="space-y-1 px-2.5 pr-1.5">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const targetPath = viewPathMap[item.id]
                      if (targetPath) navigate(targetPath)
                      setActiveView(item.id)
                      setIsOpen(false)
                    }}
                    className={`group flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                      collapsedDesktopOnly ? 'lg:justify-center' : ''
                    } ${
                      activeView === item.id
                        ? 'bg-transparent text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    title={collapsedDesktopOnly ? item.label : ''}
                  >
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center transition-all ${
                        collapsedDesktopOnly ? 'lg:h-8 lg:w-8' : ''
                      } ${
                        activeView === item.id
                          ? 'text-slate-700'
                          : 'text-slate-500 group-hover:text-slate-800'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </span>
                    <span className={`truncate ${collapsedDesktopOnly ? 'lg:hidden' : ''}`}>{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>

            <div className="border-t border-slate-200 p-3">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`flex w-full items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-600 transition-all hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 ${
                  collapsedDesktopOnly ? 'lg:justify-center' : ''
                }`}
                title={collapsedDesktopOnly ? 'Logout' : ''}
              >
                <span className={`material-symbols-outlined text-lg ${isLoggingOut ? 'animate-spin' : ''}`}>{isLoggingOut ? 'sync' : 'logout'}</span>
                <span className={collapsedDesktopOnly ? 'lg:hidden' : ''}>
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
