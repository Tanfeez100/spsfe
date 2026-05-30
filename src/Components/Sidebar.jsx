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
      { id: 'teachers', label: 'Teachers', icon: 'groups' },
      { id: 'fees', label: 'Fees', icon: 'payments' },
      { id: 'uploadMarks', label: 'Marks Upload', icon: 'upload' },
      { id: 'uploadPhoto', label: 'Upload Photo', icon: 'photo_camera' },
    ],
    teacher: [{ id: 'uploadMarks', label: 'Marks Upload', icon: 'upload' }],
    student: [
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
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsOpen(false)}
          style={{ touchAction: 'manipulation' }}
        ></div>
      )}

      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 h-full w-4/5 max-w-xs transition-all duration-300 ease-out lg:static lg:h-full lg:max-w-none ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-full p-3 sm:p-4">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/15 bg-white shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between border-b border-black/15 px-3 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden rounded-lg border border-[#d1d5db] bg-white p-1.5 text-black hover:bg-[#f8fafc] lg:inline-flex"
                  title={sidebarCollapsed ? 'Expand' : 'Collapse'}
                >
                  <span className="material-symbols-outlined text-base">{sidebarCollapsed ? 'menu_open' : 'menu'}</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-[#d1d5db] bg-white p-1.5 text-black lg:hidden"
                  aria-label="Close sidebar"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.14em] text-black ${
                  collapsedDesktopOnly ? 'lg:hidden' : ''
                }`}
              >
                Navigation
              </p>
            </div>

            <nav className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden py-3">
              <div className="space-y-1.5 px-2 pr-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const targetPath = viewPathMap[item.id]
                      if (targetPath) navigate(targetPath)
                      setActiveView(item.id)
                      setIsOpen(false)
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                      collapsedDesktopOnly ? 'lg:justify-center' : ''
                    } ${
                      activeView === item.id
                        ? 'bg-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)]'
                        : 'text-[#53647b] hover:bg-[#f8fafc] hover:text-black'
                    }`}
                    title={collapsedDesktopOnly ? item.label : ''}
                  >
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    <span className={`truncate ${collapsedDesktopOnly ? 'lg:hidden' : ''}`}>{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>

            <div className="border-t border-black/15 p-2.5">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`flex w-full items-center gap-2 rounded-xl border border-[#f0c6cd] bg-[#fff1f3] px-3 py-2.5 text-sm font-semibold text-[#c15b6b] transition-all hover:bg-[#ffe8eb] disabled:cursor-not-allowed disabled:opacity-60 ${
                  collapsedDesktopOnly ? 'lg:justify-center' : ''
                }`}
                title={collapsedDesktopOnly ? 'Logout' : ''}
              >
                <span className={`material-symbols-outlined text-lg ${isLoggingOut ? 'animate-spin' : ''}`}>
                  {isLoggingOut ? 'sync' : 'logout'}
                </span>
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
