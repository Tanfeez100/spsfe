import React, { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { schoolProfile, siteMedia, siteNavLinks } from '../Pages/Website/siteContent'
import { scrollToPageTop } from '../utils/scrollToPageTop'

function WebsiteHeader() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleSiteNavigation = () => {
    setOpen(false)
    scrollToPageTop()
  }

  const linkClass = ({ isActive }) =>
    `relative inline-flex items-center px-3 py-2 text-sm font-black uppercase tracking-[0.04em] transition-all duration-300 after:pointer-events-none after:absolute after:bottom-[6px] after:left-3 after:right-3 after:h-[2px] after:origin-center after:bg-[#1d7ff2] after:transition-transform after:duration-300 after:content-[''] xl:px-4 ${
      isActive
        ? 'bg-[#e8f2ff] text-[#0b1d3a] after:scale-x-100'
        : 'text-[#0b1d3a] after:scale-x-0 hover:bg-[#e8f2ff] hover:text-[#0b1d3a] hover:after:scale-x-100'
    }`

  const drawerLinkClass = ({ isActive }) =>
    `flex items-center justify-between border-b border-[#e8d894] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] ${
      isActive ? 'bg-[#e8f2ff] text-[#0b1d3a]' : 'text-[#0b1d3a] hover:bg-[#f6faff]'
    }`

  const resultLinkClass =
    'inline-flex items-center justify-center border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-black text-[#0b1d3a] transition-all duration-300 hover:bg-[#e8f2ff]'

  return (
    <header className="fixed inset-x-0 top-0 z-[120] bg-white shadow-[0_12px_30px_rgba(18,61,35,0.14)]">
      <div className="bg-[#0b1d3a] text-white">
        <div className="gps-site-shell flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-xs font-bold">
          <a href={schoolProfile.phoneHref} className="inline-flex items-center gap-1.5 hover:text-[#1d7ff2]">
            <span className="material-symbols-outlined text-sm">call</span>
            {schoolProfile.phone}
          </a>
          <div className="hidden items-center gap-4 sm:flex">
            <a href={schoolProfile.emailHref} className="inline-flex items-center gap-1.5 hover:text-[#1d7ff2]">
              <span className="material-symbols-outlined text-sm">mail</span>
              {schoolProfile.email}
            </a>
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {schoolProfile.hours}
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-[#bfdbfe] bg-white">
        <div className="gps-site-shell">
          <div className="flex min-h-[5.25rem] items-center justify-between gap-3">
            <Link to="/" className="flex min-w-0 items-center gap-3" onClick={handleSiteNavigation}>
              <img src={siteMedia.logo} alt={`${schoolProfile.name} logo`} className="h-14 w-14 object-contain sm:h-16 sm:w-16" />
              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-[#1d5fb8] sm:text-xs">
                  English Medium School
                </p>
                <p className="truncate text-sm font-black text-[#0b1d3a] sm:text-base">{schoolProfile.name}</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-0.5 lg:flex">
              {siteNavLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === '/'} onClick={handleSiteNavigation}>
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
              <Link
                to="/results-portal"
                className={resultLinkClass}
                onClick={handleSiteNavigation}
              >
                Result
              </Link>
              <Link to="/admission" className="gps-site-button-secondary !rounded-md !px-4 !py-2 !text-sm" onClick={handleSiteNavigation}>
                Admission
              </Link>
              <Link to="/login" className="gps-site-button !rounded-md !px-4 !py-2 !text-sm" onClick={handleSiteNavigation}>
                Admin
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center border border-[#bfdbfe] bg-[#f6faff] text-[#0b1d3a] lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[130] bg-black/45 transition-opacity duration-300 lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed left-0 top-0 z-[140] flex h-screen w-[min(86vw,22rem)] flex-col bg-white shadow-[24px_0_70px_rgba(0,0,0,0.28)] transition-transform duration-300 lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="border-b border-[#bfdbfe] bg-[#0b1d3a] px-4 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <Link to="/" className="flex min-w-0 items-center gap-3" onClick={handleSiteNavigation}>
              <img src={siteMedia.logo} alt={`${schoolProfile.name} logo`} className="h-14 w-14 object-contain" />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1d7ff2]">School Menu</p>
                <p className="truncate text-base font-black">{schoolProfile.name}</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center border border-white/25 text-white"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {siteNavLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={drawerLinkClass}
              end={link.to === '/'}
              onClick={handleSiteNavigation}
            >
              {link.label}
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#bfdbfe] bg-[#f6faff] p-4">
          <div className="grid grid-cols-1 gap-2">
            <Link to="/results-portal" onClick={handleSiteNavigation} className={`${resultLinkClass} justify-center`}>
              Result Portal
            </Link>
            <Link to="/admission" onClick={handleSiteNavigation} className="gps-site-button-secondary justify-center !rounded-md !py-2 !text-sm">
              Admission Enquiry
            </Link>
            <Link to="/login" onClick={handleSiteNavigation} className="gps-site-button justify-center !rounded-md !py-2 !text-sm">
              Admin Login
            </Link>
          </div>
          <div className="mt-4 space-y-2 text-xs font-semibold text-[#526252]">
            <a href={schoolProfile.phoneHref} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#1d5fb8]">call</span>
              {schoolProfile.phone}
            </a>
            <a href={schoolProfile.emailHref} className="flex items-center gap-2 break-all">
              <span className="material-symbols-outlined text-base text-[#1d5fb8]">mail</span>
              {schoolProfile.email}
            </a>
          </div>
        </div>
      </aside>
    </header>
  )
}

export default WebsiteHeader
