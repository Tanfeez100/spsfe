import React from 'react'
import { Link } from 'react-router-dom'
import { schoolProfile, siteMedia, siteNavLinks } from '../Pages/Website/siteContent'
import { scrollToPageTop } from '../utils/scrollToPageTop'

function WebsiteFooter() {
  const year = new Date().getFullYear()
  const handleSiteNavigation = () => {
    scrollToPageTop()
  }

  return (
    <footer className="relative mt-8 bg-[#0b1d3a] text-white">
      <a
        href={schoolProfile.whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-[110] inline-flex items-center gap-2 rounded-full bg-[#25D366] px-3 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(22,163,74,0.35)] transition hover:-translate-y-0.5 hover:bg-[#1ebe5d] sm:px-4"
        aria-label="Contact us on WhatsApp"
      >
        <span className="material-symbols-outlined text-lg">chat</span>
        <span className="hidden sm:inline">WhatsApp</span>
      </a>

      <div className="gps-site-shell py-14">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.75fr_0.9fr]">
          <div className="p-2 sm:p-3">
            <div className="flex items-center gap-3">
              <div className="rounded-[1.2rem] bg-white p-2">
                <img src={siteMedia.logo} alt={`${schoolProfile.name} logo`} className="h-14 w-14 rounded-xl object-cover sm:h-16 sm:w-16" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">{schoolProfile.name}</h3>
                <p className="text-xs uppercase tracking-[0.22em] text-[#1d7ff2]">Calm campus, clear systems, steady growth</p>
              </div>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">
              {schoolProfile.tagline} The website is intentionally kept clear and text-led so families can find the right
              information quickly without unnecessary clutter.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {['Admissions guidance', 'Result access', 'Parent communication', 'Student-first routine'].map((tag) => (
                <span key={tag} className="inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="p-2 sm:p-3">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1d7ff2]">Explore</p>
            <div className="mt-4 flex flex-col gap-2.5">
              {siteNavLinks.concat([{ to: '/login', label: 'Admin Login' }]).map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={handleSiteNavigation}
                  className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white"
                >
                  <span className="text-[#1d7ff2]">•</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="p-2 sm:p-3">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1d7ff2]">Reach us</p>
            <div className="mt-4 space-y-4 text-sm text-slate-200">
              <a href={schoolProfile.mapsHref} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-white">
                <span className="material-symbols-outlined mt-0.5 text-[#1d7ff2]">location_on</span>
                <span>{schoolProfile.address}</span>
              </a>
              <a href={schoolProfile.phoneHref} className="flex items-center gap-3 hover:text-white">
                <span className="material-symbols-outlined text-[#1d7ff2]">call</span>
                <span>{schoolProfile.phone}</span>
              </a>
              <a href={schoolProfile.emailHref} className="flex items-center gap-3 hover:text-white">
                <span className="material-symbols-outlined text-[#1d7ff2]">mail</span>
                <span>{schoolProfile.email}</span>
              </a>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-[#1d7ff2]">schedule</span>
                <span>{schoolProfile.hours}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-start justify-between gap-2 border-t border-slate-700 pt-5 text-xs text-slate-300 sm:flex-row sm:items-center">
          <p>
            (c) {year} <span className="font-semibold text-white">{schoolProfile.name}</span>. All rights reserved.
          </p>
          <p>Powered by Kavion Innovation</p>
        </div>
      </div>
    </footer>
  )
}

export default WebsiteFooter
