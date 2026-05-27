import React from 'react'
import { getUser } from '../Api/auth'

function Header({ sidebarOpen, setSidebarOpen }) {
  const user = getUser()
  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U'
  const roleLabel = user?.role ? String(user.role).toUpperCase() : 'USER'
  const schoolName = import.meta.env.VITE_SCHOOL_NAME || 'Star Public School'

  return (
    <header className="relative z-40 px-3 pt-3 sm:px-4 sm:pt-4 lg:px-6">
      <div className="rounded-2xl border border-black/15 bg-white px-3 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.08)] sm:px-4 sm:py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#d1d5db] bg-white text-black hover:bg-[#f8fafc] lg:hidden"
              title="Toggle menu"
            >
              <span className="material-symbols-outlined text-lg">menu</span>
            </button>

            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <span className="material-symbols-outlined">school</span>
            </div>

            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-black sm:text-xs">
                Admin Workspace
              </p>
              <p className="truncate text-sm font-bold text-[#0f172a] sm:text-base">{schoolName}</p>
            </div>
          </div>

          <div className="hidden rounded-xl border border-black/15 bg-white px-3 py-2 text-xs text-[#5f7185] md:block">
            Unified dashboard for students, marks, fees and promotions
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-black/15 bg-white px-2.5 py-1.5">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-extrabold text-white">
              {userInitial}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-xs font-semibold text-[#0f172a]">{user?.email || 'user@school.com'}</p>
              <p className="text-[10px] tracking-[0.14em] text-black">{roleLabel}</p>
            </div>
            <span className="material-symbols-outlined hidden text-[#7d90ad] sm:inline">expand_more</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
