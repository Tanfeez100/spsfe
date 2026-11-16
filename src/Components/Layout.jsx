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
    <div className="h-screen w-screen overflow-hidden bg-[#f0f4fc] text-slate-800 antialiased font-sans flex flex-col">
      {/* Top Header Bar: 100% Independent of Sidebar Expand & Collapse */}
      <header className="h-14 shrink-0 bg-[#f0f4fc] border-b border-[#e2e8f0] px-3.5 sm:px-5 flex items-center justify-between select-none z-30">
        <div className="flex items-center gap-3">
          {/* Hamburger Icon Button to Expand/Collapse Sidebar */}
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors cursor-pointer border border-transparent hover:border-[#e2e8f0]"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle Navigation Sidebar"
          >
            <span className="material-symbols-outlined text-[22px] leading-none">menu</span>
          </button>

          {/* School Brand Header (Independent of Sidebar Expand/Collapse) */}
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer rounded-xl p-1 transition-colors hover:bg-white/70"
            title="Go to Dashboard"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white p-1 border border-[#e2e8f0] shadow-2xs overflow-hidden">
              <img
                src={schoolLogo}
                alt="Star Public School"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-[13.5px] font-bold text-slate-900 leading-tight tracking-tight truncate">
                Star Public School
              </h1>
              <p className="text-[10.5px] font-medium text-slate-500 leading-none mt-0.5 truncate">
                {isTeacher ? 'Faculty Portal' : 'Admin Console'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side Quick Profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/70 border border-[#e2e8f0]/80">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#183867] text-white font-bold text-xs shadow-2xs">
              {userInitials}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                {displayName}
              </p>
              <p className="text-[10px] font-medium text-slate-500 leading-none truncate max-w-[140px]">
                {displayRole}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[19px] leading-none">logout</span>
          </button>
        </div>
      </header>

      {/* Main Body Area: Collapsible Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-[#f8fafc]">
        <Outlet context={{ sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed }} />
      </div>
    </div>
  )
}

export default Layout
