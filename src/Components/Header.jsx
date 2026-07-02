import React from 'react'
import { getUser } from '../Api/auth'
import schoolLogo from '../assets/logo.png'

function Header({ sidebarOpen, setSidebarOpen }) {
  const user = getUser()
  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U'
  const roleLabel = user?.role ? String(user.role).toUpperCase() : 'USER'
  const schoolName = import.meta.env.VITE_SCHOOL_NAME || 'Star Public School'

  return (
    <header className="relative z-40 px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4 lg:px-6">
      <div className="rounded-[28px] border border-slate-200/80 bg-white/90 px-3 py-3 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-4 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 lg:hidden"
              title="Toggle menu"
            >
              <span className="material-symbols-outlined text-lg">menu</span>
            </button>

            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-sm">
              <img src={schoolLogo} alt={`${schoolName} logo`} className="h-full w-full object-contain" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950 sm:text-base">{schoolName}</p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
                Enterprise school workspace
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 md:inline-flex">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Unified dashboard for students, teachers and fees
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-extrabold text-white">
              {userInitial}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-xs font-semibold text-slate-950">{user?.email || 'user@school.com'}</p>
              <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500">{roleLabel}</p>
            </div>
            <span className="material-symbols-outlined hidden text-slate-400 sm:inline">expand_more</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
