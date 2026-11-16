import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import schoolLogo from '../assets/logo.png'
import { getUser, getLoginType, logout, clearSession } from '../Api/auth'

function Layout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sps_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [user, setUser] = useState(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('sps_sidebar_collapsed', String(isCollapsed))
    } catch {
      // ignore
    }
  }, [isCollapsed])

  useEffect(() => {
    const handleToggle = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen((prev) => !prev)
      } else {
        setIsCollapsed((prev) => !prev)
      }
    }
    window.addEventListener('sps_sidebar_toggle', handleToggle)
    return () => window.removeEventListener('sps_sidebar_toggle', handleToggle)
  }, [])

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setIsCollapsed(!isCollapsed)
    }
  }

  const role = user?.role || 'admin'
  const isTeacher = role === 'teacher'
  const displayName = isTeacher
    ? user?.fullName || user?.name || user?.email?.split('@')[0] || 'Teacher'
    : user?.name || user?.fullName || 'Principal Sharma'
  const displayRole = isTeacher
    ? (user?.assignedClass ? `Class Teacher (${user.assignedClass}-${user.assignedSection || 'A'})` : 'Faculty Portal')
    : 'Admin Console'
  const userInitials = displayName
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || (isTeacher ? 'TC' : 'PS')

  const handleLogout = async () => {
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
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f4f7fb] text-slate-800 antialiased font-sans flex flex-col">
      {/* Top Header Bar matching reference image */}
      <header className="h-14 shrink-0 bg-white border-b border-[#e2e8f0] px-3.5 sm:px-6 flex items-center justify-between select-none z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          {/* Hamburger Icon Button to Expand/Collapse Sidebar */}
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-[#e2e8f0]"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle Navigation Sidebar"
          >
            <span className="material-symbols-outlined text-[21px] leading-none">menu</span>
          </button>

          {/* School Brand Header */}
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer rounded-xl p-1 transition-colors hover:bg-slate-50"
            title="Go to Dashboard"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-black text-sm p-1 shadow-2xs overflow-hidden">
              <img
                src={schoolLogo}
                alt="Star Public School"
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement.innerText = 'SPS'
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-[13.5px] font-bold text-slate-900 leading-tight tracking-tight truncate">
                  Star Public School
                </h1>
                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 leading-normal tracking-wide">
                  CBSE
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 leading-none mt-0.5 truncate">
                Central ERP · {isTeacher ? 'Faculty Portal' : 'Campus Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search students, staff, admission IDs, fees..."
              className="w-full h-8.5 pl-9 pr-12 rounded-xl bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 text-xs text-slate-700 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs pointer-events-none">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right Side: Session status, Notifications, Profile, Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Session live pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/90 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Session 2026–27 Live</span>
          </div>

          {/* Notification bell */}
          <button
            type="button"
            className="relative flex h-8.5 w-8.5 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {/* Profile pill */}
          <div className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-colors">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xs shadow-2xs">
              {userInitials.charAt(0) || 'T'}
            </div>
            <div className="hidden lg:block min-w-0 text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                {displayName}
              </p>
              <p className="text-[9.5px] font-medium text-slate-500 leading-none truncate max-w-[120px] mt-0.5">
                {displayRole}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-1 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[17px] leading-none">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Area: Collapsible Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-[#f4f7fb]">
        <Outlet context={{ sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed }} />
      </div>
    </div>
  )
}

export default Layout
