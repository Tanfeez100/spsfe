import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard') || [
    '/students',
    '/id-cards',
    '/class-promotion',
    '/subjects',
    '/teachers',
    '/teacher-attendance',
    '/fees',
    '/attendance',
    '/marks-upload',
    '/upload-photo',
    '/result-view',
  ].some((path) => location.pathname.startsWith(path))

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#fbfcfb] text-slate-800 antialiased font-sans flex flex-col">
      {!isDashboard && <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-[#fbfcfb]">
        <Outlet context={{ sidebarOpen, setSidebarOpen }} />
      </div>
    </div>
  )
}

export default Layout
