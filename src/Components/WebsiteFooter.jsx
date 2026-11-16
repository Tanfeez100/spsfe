import React from 'react'
import { Link } from 'react-router-dom'
import { schoolProfile, siteMedia } from '../Pages/Website/siteContent'
import { scrollToPageTop } from '../utils/scrollToPageTop'

const exploreLinks = [
  { to: '/', label: 'Home' },
  { to: '/pay-fees', label: 'Pay Fees' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/admission', label: 'Admission' },
  { to: '/contact', label: 'Contact' },
  { to: '/results-portal', label: 'Result' },
  { to: '/login', label: 'Login' },
]

function WebsiteFooter() {
  const year = new Date().getFullYear()

  const handleSiteNavigation = () => {
    scrollToPageTop()
  }

  return (
    <footer className="relative bg-gradient-to-b from-[#0b1d3a] via-[#08172e] to-[#040e1d] text-white">
      {/* Floating WhatsApp CTA */}
      <a
        href={schoolProfile.whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-[110] inline-flex items-center gap-2 rounded-full bg-[#25D366] px-3.5 py-3 text-sm font-bold text-white shadow-[0_16px_32px_rgba(37,211,102,0.35)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#1ebe5d] hover:shadow-[0_20px_38px_rgba(37,211,102,0.45)] sm:px-4"
        aria-label="Contact us on WhatsApp"
      >
        <svg className="h-5 w-5 fill-white shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
        <span className="hidden sm:inline font-bold">WhatsApp</span>
      </a>

      <div className="gps-site-shell py-14 sm:py-16">
        {/* Main Footer Grid */}
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1.1fr_1.15fr] lg:gap-12">
          {/* Column 1: School Identity & Mission */}
          <div className="space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="rounded-2xl border-2 border-white/20 bg-white p-2 shadow-lg shadow-black/20 shrink-0">
                <img
                  src={siteMedia.logo}
                  alt={`${schoolProfile.name} logo`}
                  className="h-14 w-14 rounded-xl object-cover sm:h-16 sm:w-16"
                />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {schoolProfile.name}
                </h3>
                <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.18em] text-[#38bdf8]">
                  English Medium Co-Ed School
                </p>
              </div>
            </div>

            <p className="max-w-md text-sm leading-relaxed text-slate-300">
              {schoolProfile.tagline} Focused on strong academic fundamentals, disciplined routines and accessible parent communication.
            </p>

            {/* Feature Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {['Admissions Open', 'Digital Campus', 'Result Portal', 'Disciplined Routine'].map((tag) => (
                <span
                  key={tag}
                  className="inline-fleix items-center rounded-lg border border-sky-900/60 bg-sky-950/40 px-3 py-1 text-xs font-semibold text-sky-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          
          </div>

          {/* Column 2: Quick Links / Explore (Two Columns with Result & Unselectable Bullets) */}
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1d7ff2]" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#38bdf8]">Explore</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3.5">
              {exploreLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  {...((link.to === '/login' || link.to === '/results-portal') ? { target: '_blank', rel: 'noopener noreferrer' } : { onClick: handleSiteNavigation })}
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:text-white hover:translate-x-1"
                >
                  {/* Decorative bullet: select-none ensures it is never copied into clipboard */}
                  <span
                    aria-hidden="true"
                    className="select-none text-[#1d7ff2] font-black text-base leading-none transition-transform duration-200 group-hover:scale-125"
                  >
                    •
                  </span>
                  {/* Selectable text only */}
                  <span className="select-text">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3: Reach Us & Campus Details */}
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1d7ff2]" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#38bdf8]">Reach Us</p>
            </div>

            <div className="mt-5 space-y-4 text-sm text-slate-300">
              <a
                href={schoolProfile.mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 transition-colors hover:text-white"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-[#38bdf8] transition-colors group-hover:bg-[#1d7ff2] group-hover:text-white">
                  <span className="material-symbols-outlined text-lg">location_on</span>
                </div>
                <span className="select-text pt-1 leading-snug">{schoolProfile.address}</span>
              </a>

              <a
                href={schoolProfile.phoneHref}
                className="group flex items-center gap-3 transition-colors hover:text-white"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-[#38bdf8] transition-colors group-hover:bg-[#1d7ff2] group-hover:text-white">
                  <span className="material-symbols-outlined text-lg">call</span>
                </div>
                <span className="select-text font-semibold">{schoolProfile.phone}</span>
              </a>

              <a
                href={schoolProfile.emailHref}
                className="group flex items-center gap-3 transition-colors hover:text-white"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-[#38bdf8] transition-colors group-hover:bg-[#1d7ff2] group-hover:text-white">
                  <span className="material-symbols-outlined text-lg">mail</span>
                </div>
                <span className="select-text font-semibold">{schoolProfile.email}</span>
              </a>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-[#38bdf8]">
                  <span className="material-symbols-outlined text-lg">schedule</span>
                </div>
                <span className="select-text pt-1 leading-snug text-slate-300">{schoolProfile.hours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row">
          <p className="select-text text-center sm:text-left">
            © {year} <span className="font-bold text-white">{schoolProfile.name}</span>. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
            <Link
              to="/privacy-policy"
              onClick={handleSiteNavigation}
              className="transition-colors hover:text-sky-300"
            >
              Privacy Policy
            </Link>
            <span aria-hidden="true" className="select-none text-white/20">•</span>
            <p className="select-text">Powered by Kavion Innovation</p>
            <span aria-hidden="true" className="select-none text-white/20">•</span>
            {/* <button
              type="button"
              onClick={scrollToPageTop}
              className="inline-flex items-center gap-1 font-bold text-sky-400 transition-colors hover:text-white cursor-pointer"
            >
              <span>Back to Top</span>
              <span className="material-symbols-outlined text-sm">arrow_upward</span>
            </button> */}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default WebsiteFooter
