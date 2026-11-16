import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { schoolProfile, siteMedia, siteNavLinks } from '../Pages/Website/siteContent'
import { scrollToPageTop } from '../utils/scrollToPageTop'

function SocialIconLinks({ className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* YouTube */}
      <a
        href={schoolProfile.socialLinks?.youtube || 'https://youtube.com'}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="YouTube"
        className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF0000] text-white shadow-sm transition-transform duration-200 hover:scale-110 hover:opacity-95"
      >
        <svg className="h-2.5 w-2.5 fill-white" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </a>

      {/* Facebook */}
      <a
        href={schoolProfile.socialLinks?.facebook || 'https://facebook.com'}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
        className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm transition-transform duration-200 hover:scale-110 hover:opacity-95"
      >
        <svg className="h-2.5 w-2.5 fill-white" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>

      {/* Instagram */}
      <a
        href={schoolProfile.socialLinks?.instagram || 'https://instagram.com'}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-sm transition-transform duration-200 hover:scale-110 hover:opacity-95"
      >
        <svg className="h-2.5 w-2.5 fill-white" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      </a>

      {/* X (formerly Twitter) */}
      <a
        href={schoolProfile.socialLinks?.twitter || 'https://x.com'}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X (formerly Twitter)"
        className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white shadow-sm ring-1 ring-white/20 transition-transform duration-200 hover:scale-110 hover:opacity-95"
      >
        <svg className="h-2.5 w-2.5 fill-white" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
    </div>
  )
}

function LanguageSelector({ currentLang, setCurrentLang, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 rounded-full border border-white/40 px-2.5 py-0.5 text-[11px] font-semibold text-white/90 transition hover:border-white hover:text-white"
        aria-label="Select language"
      >
        <span>Language: {currentLang}</span>
        <span className="text-[9px]">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[160] mt-1.5 w-28 overflow-hidden rounded-lg border border-slate-700 bg-[#0b1d3a] p-1 shadow-2xl">
          <button
            type="button"
            onClick={() => {
              setCurrentLang('English')
              setOpen(false)
            }}
            className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs font-semibold hover:bg-white/10 ${
              currentLang === 'English' ? 'text-sky-400 font-bold' : 'text-slate-200'
            }`}
          >
            <span>English</span>
            {currentLang === 'English' && <span>✓</span>}
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentLang('Hindi')
              setOpen(false)
            }}
            className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs font-semibold hover:bg-white/10 ${
              currentLang === 'Hindi' ? 'text-sky-400 font-bold' : 'text-slate-200'
            }`}
          >
            <span>हिन्दी</span>
            {currentLang === 'Hindi' && <span>✓</span>}
          </button>
        </div>
      )}
    </div>
  )
}

function WebsiteHeader() {
  const [open, setOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState('English')
  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 ? 122 : 85
    }
    return 122
  })

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    const timer = setTimeout(updateHeight, 150)
    return () => {
      window.removeEventListener('resize', updateHeight)
      clearTimeout(timer)
    }
  }, [])

  const handleSiteNavigation = () => {
    setOpen(false)
    scrollToPageTop()
  }

  const linkClass = ({ isActive }) =>
    `relative inline-flex items-center rounded-md px-3 py-2 text-sm font-black uppercase tracking-[0.04em] transition-all duration-300 after:pointer-events-none after:absolute after:bottom-[6px] after:left-3 after:right-3 after:h-[2px] after:origin-center after:bg-[#1d7ff2] after:rounded-full after:transition-transform after:duration-300 after:content-[''] xl:px-4 ${
      isActive
        ? 'bg-[#e8f2ff] text-[#0b1d3a] after:scale-x-100'
        : 'text-[#0b1d3a] after:scale-x-0 hover:bg-[#e8f2ff] hover:text-[#0b1d3a] hover:after:scale-x-100'
    }`

  const drawerLinkClass = ({ isActive }) =>
    `flex items-center justify-between border-b border-[#e8d894] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] ${
      isActive ? 'bg-[#e8f2ff] text-[#0b1d3a]' : 'text-[#0b1d3a] hover:bg-[#f6faff]'
    }`

  const resultLinkClass =
    'inline-flex items-center justify-center rounded-md border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-black text-[#0b1d3a] transition-all duration-300 hover:bg-[#e8f2ff]'

  return (
    <>
      <header
        ref={headerRef}
        className="relative z-[120] w-full shrink-0 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
      >
      {/* Top Header Bar - hidden on mobile responsive, visible on desktop (lg and above) */}
      <div className="hidden lg:block bg-[#0b1d3a] text-white border-b border-white/10">
        <div className="gps-site-shell flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-1.5 text-[11px] sm:text-xs font-semibold">
          {/* Left / Info items with vertical dividers */}
          <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1">
            {/* Location */}
            <a
              href={schoolProfile.mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-100 hover:text-sky-300 transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-sky-400">location_on</span>
              <span className="truncate max-w-[190px] sm:max-w-none">{schoolProfile.address}</span>
            </a>

            <span className="text-white/30 hidden sm:inline">|</span>

            {/* Phone */}
            <a
              href={schoolProfile.phoneHref}
              className="inline-flex items-center gap-1.5 text-slate-100 hover:text-sky-300 transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-sky-400">call</span>
              <span>{schoolProfile.phone}</span>
            </a>

            <span className="text-white/30 hidden md:inline">|</span>

            {/* Email */}
            <a
              href={schoolProfile.emailHref}
              className="hidden md:inline-flex items-center gap-1.5 text-slate-100 hover:text-sky-300 transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-sky-400">mail</span>
              <span>{schoolProfile.email}</span>
            </a>

            <span className="text-white/30 hidden lg:inline">|</span>

            {/* Timings / Office hours */}
            <span className="hidden lg:inline-flex items-center gap-1.5 text-slate-100">
              <span className="material-symbols-outlined text-sm text-sky-400">calendar_month</span>
              <span>{schoolProfile.hoursShort || 'Mon – Sat: 8:00 AM – 2:00 PM'}</span>
            </span>
          </div>

          {/* Right section: Social Icons + Language */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <SocialIconLinks className="hidden sm:flex" />

            <span className="text-white/30 hidden sm:inline">|</span>

            <LanguageSelector currentLang={currentLang} setCurrentLang={setCurrentLang} />
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200/60 bg-white">
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
                target="_blank"
                rel="noopener noreferrer"
                className={resultLinkClass}
              >
                Result
              </Link>
              {/* <Link to="/admission" className="gps-site-button-secondary border-[#bfdbfe] !rounded-md !px-4 !py-2 !text-sm" onClick={handleSiteNavigation}>
                Admission
              </Link> */}
              <Link
                to="/login"
                target="_blank"
                rel="noopener noreferrer"
                className="gps-site-button !rounded-md !px-4 !py-2 !text-sm"
              >
                Login
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
            <Link
              to="/results-portal"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={`${resultLinkClass} justify-center`}
            >
              Result Portal
            </Link>
            <Link to="/admission" onClick={handleSiteNavigation} className="gps-site-button-secondary justify-center !rounded-md !py-2 !text-sm">
              Admission Enquiry
            </Link>
            <Link
              to="/login"
              target="_blank"
              rel="noopener noreferrer"
              className="gps-site-button justify-center !rounded-md !py-2 !text-sm"
            >
              Login
            </Link>
          </div>
          <div className="mt-4 space-y-2 text-xs font-semibold text-[#526252]">
            <a href={schoolProfile.mapsHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#1d5fb8]">location_on</span>
              <span>{schoolProfile.address}</span>
            </a>
            <a href={schoolProfile.phoneHref} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#1d5fb8]">call</span>
              <span>{schoolProfile.phone}</span>
            </a>
            <a href={schoolProfile.emailHref} className="flex items-center gap-2 break-all">
              <span className="material-symbols-outlined text-base text-[#1d5fb8]">mail</span>
              <span>{schoolProfile.email}</span>
            </a>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#1d5fb8]">calendar_month</span>
              <span>{schoolProfile.hoursShort || schoolProfile.hours}</span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#bfdbfe]/60">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Follow Us:</span>
              <SocialIconLinks />
            </div>
          </div>
        </div>
      </aside>
    </header>
  </>
  )
}

export default WebsiteHeader
