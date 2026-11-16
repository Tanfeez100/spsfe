import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import SEO from '../../Components/SEO/SEO'
import { buildSchoolJsonLd, SCHOOL_KEYWORDS } from '../../seo/siteSeo'
import { contactCards, schoolProfile, siteMedia } from './siteContent'
import { campusPhotos } from '../../assets/websiteImages'

function Contact() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'Admission Enquiry',
    message: '',
  })
  const [sent, setSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSent(false)
  }

  const onSubmit = (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSent(true)
      setForm({
        name: '',
        phone: '',
        email: '',
        subject: 'Admission Enquiry',
        message: '',
      })
    }, 600)
  }

  return (
    <WebsiteLayout>
      <SEO
        title="Contact Star Public School Meghwal Mathia"
        description="Contact Star Public School in Meghwal Mathia, Ramnagar, West Champaran for admissions, result support, online fee support and campus visits."
        keywords={SCHOOL_KEYWORDS}
        canonicalPath="/contact"
        jsonLd={buildSchoolJsonLd({ path: '/contact' })}
      />

      {/* =========================================================================
          SECTION 1: HERO & DIRECT CHANNELS (Open, Modern, Layered Professional Showcase)
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f8fbff] via-[#f0f7ff] to-[#e8f3fe] py-14 sm:py-16 lg:py-24">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-blue-300/25 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            {/* Left Column: Intro & Contact Channel Tiles */}
            <div>
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eaf4ff] px-3.5 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#1d5fb8]">
                <span className="material-symbols-outlined text-sm text-[#1d7ff2]">support_agent</span>
                <span>Official Helpdesk</span>
              </div>

              {/* Heading */}
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl leading-[1.15]">
                Talk to {schoolProfile.name}
              </h1>

              {/* Subtitle */}
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600 max-w-2xl">
                Have questions regarding new admissions, student records, fee payment or a campus visit?
                Our administration desk is ready to assist you. Reach out via phone, email or visit the school office.
              </p>

              {/* 4 Clean Contact Channel Cards */}
              <div className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {contactCards.map((item) => (
                  <a
                    key={item.title}
                    href={item.link}
                    target={item.link.startsWith('http') ? '_blank' : undefined}
                    rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="group flex items-start gap-3.5 rounded-2xl border border-sky-100 bg-white p-4.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#1d7ff2] hover:shadow-md cursor-pointer"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf4ff] text-[#1d7ff2] transition-colors duration-300 group-hover:bg-[#1d7ff2] group-hover:text-white">
                      <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1d5fb8]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 break-words leading-snug">
                        {item.detail}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Right Column: High-End Layered Campus Showcase */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none pb-8 sm:pb-6">
              {/* Outer Decorative Gradient Glow & Offset Frame */}
              <div className="relative rounded-[2.8rem] bg-gradient-to-tr from-sky-200/50 via-white to-blue-200/40 p-3 sm:p-4 shadow-2xl shadow-sky-900/10">
                {/* Main Featured Photo Container */}
                <div className="group relative overflow-hidden rounded-[2.2rem] bg-slate-900 shadow-inner">
                  <img
                    src={siteMedia.contactSupport}
                    alt="Star Public School Campus Life"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="h-[360px] sm:h-[420px] w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Gentle Cinematic Gradient Overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                  {/* Top-Left Floating Live Status Pill */}
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-3.5 py-1.5 shadow-lg backdrop-blur-md">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                      Helpdesk Online
                    </span>
                  </div>

                  {/* Top-Right Floating Trust Badge */}
                  <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur-md">
                    <span className="material-symbols-outlined text-sm text-amber-500">stars</span>
                    <span className="text-[11px] font-black text-slate-800">Verified Campus</span>
                  </div>

                  {/* Bottom Integrated Overlay Content - Clean & Non-intrusive */}
                  <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 z-20 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-1.5 text-sky-300 text-xs font-bold uppercase tracking-wider mb-1">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          <span>Office Timings</span>
                        </div>
                        <p className="text-sm sm:text-base font-black text-white leading-tight">
                          {schoolProfile.hours}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-300 font-medium">
                          Harinagar, Ramnagar, West Champaran
                        </p>
                      </div>

                      {/* Direct WhatsApp Action Pill */}
                      <a
                        href={schoolProfile.whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/30 hover:bg-[#1ebe5d] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <svg className="h-4 w-4 fill-white shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                        <span>WhatsApp Desk</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Overlapping Secondary Card (Layered Visual for Depth) */}
                <div className="absolute -bottom-5 -left-3 sm:-left-5 z-30 hidden sm:flex items-center gap-3 rounded-2xl border-2 border-white bg-white/95 p-3 shadow-2xl backdrop-blur-md hover:scale-105 transition-transform duration-300">
                  <div className="relative h-13 w-13 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 shrink-0">
                    <img
                      src={campusPhotos[1]?.src || siteMedia.homeSupport}
                      alt="Classroom learning"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="pr-2">
                    <p className="text-xs font-black text-slate-900 leading-tight">Prompt Assistance</p>
                    <p className="mt-0.5 text-[11px] font-bold text-[#1d7ff2] leading-tight">
                      Admissions • Fees • Visits
                    </p>
                  </div>
                </div>

                {/* Overlapping Quick Call Pill (Bottom-Right) */}
                <div className="absolute -bottom-5 -right-2 sm:-right-4 z-30 flex items-center gap-2 rounded-2xl border-2 border-white bg-gradient-to-r from-[#0f3f99] to-[#1d7ff2] px-4 py-2.5 shadow-2xl text-white hover:scale-105 transition-transform duration-300">
                  <span className="material-symbols-outlined text-lg animate-pulse">call</span>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-sky-200 leading-tight">Helpline</p>
                    <a href={schoolProfile.phoneHref} className="text-xs font-black tracking-wide text-white hover:underline leading-tight">
                      {schoolProfile.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: CONTACT FORM & ASSISTANCE (Open, Modern Layout)
         ========================================================================= */}
      <section className="bg-white py-16 lg:py-20 border-t border-slate-100" id="contact-form">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-14 items-start">
            {/* Left: What You Can Ask & Assistance Info */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-bold text-[#1d7ff2]">
                <span className="material-symbols-outlined text-sm">help_outline</span>
                <span>Assistance & Guidance</span>
              </div>
              <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 leading-tight">
                Admissions, Records, Results &amp; Campus Support
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                Whether you are a new parent exploring admissions for your child or a current guardian seeking student information, our office is here to help you quickly and clearly.
              </p>

              {/* Inquiry topic cards */}
              <div className="mt-8 space-y-3.5">
                {[
                  {
                    title: 'Admissions & Seat Availability',
                    desc: 'Admission forms, eligibility criteria, class seat availability, fee schedules and documentation requirements.',
                    icon: 'how_to_reg',
                  },
                  {
                    title: 'Office Timings & Campus Visits',
                    desc: 'Schedule an in-person meeting with teachers or principal, visit the campus facilities and verify student documents.',
                    icon: 'meeting_room',
                  },
                  {
                    title: 'Result Portal & Student Records',
                    desc: 'Assistance with online report cards, roll numbers, student login access and transfer certificate requests.',
                    icon: 'verified_user',
                  },
                  {
                    title: 'Fee Payment & Billing Support',
                    desc: 'Online fee payment issues, receipt generation, account inquiries and offline fee counter hours.',
                    icon: 'payments',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3.5 rounded-2xl border border-sky-100 bg-[#fbfcfe] p-4 transition-all hover:bg-white hover:border-[#1d7ff2]/40 hover:shadow-xs"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf4ff] text-[#1d7ff2]">
                      <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Call & Admission links */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={schoolProfile.phoneHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1d7ff2] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#156cd4] transition-all"
                >
                  <span className="material-symbols-outlined text-lg">call</span>
                  <span>Call {schoolProfile.phone}</span>
                </a>
                <Link
                  to="/admission"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 shadow-xs hover:border-[#1d7ff2] hover:text-[#1d7ff2] transition-all"
                >
                  <span>Admission Details</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Right: Modern Contact Form */}
            <div className="rounded-3xl border border-sky-100 bg-white p-6 sm:p-8 lg:p-10 shadow-lg shadow-slate-100">
              <div className="border-b border-slate-100 pb-5">
                <h3 className="text-2xl font-black text-slate-950 font-serif">Send an Online Message</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                  Fill in your details below and our administrative team will reach back promptly.
                </p>
              </div>

              {sent ? (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900 animate-fadeIn">
                  <span className="material-symbols-outlined text-emerald-600 text-xl shrink-0 mt-0.5">check_circle</span>
                  <div>
                    <p className="font-bold text-sm">Message received successfully!</p>
                    <p className="mt-0.5 text-xs text-emerald-700">Thank you for contacting Star Public School. Our team will get back to you shortly.</p>
                  </div>
                </div>
              ) : null}

              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#1d7ff2] focus:outline-none focus:ring-3 focus:ring-[#1d7ff2]/15"
                    placeholder="Enter parent or guardian full name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-700">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#1d7ff2] focus:outline-none focus:ring-3 focus:ring-[#1d7ff2]/15"
                      placeholder="e.g. 9876543210"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-700">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={onChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#1d7ff2] focus:outline-none focus:ring-3 focus:ring-[#1d7ff2]/15"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-700">
                    Subject / Topic
                  </label>
                  <select
                    name="subject"
                    value={form.subject || 'Admission Enquiry'}
                    onChange={onChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-all focus:border-[#1d7ff2] focus:outline-none focus:ring-3 focus:ring-[#1d7ff2]/15"
                  >
                    <option value="Admission Enquiry">Admission Enquiry (New Session)</option>
                    <option value="Result Portal Support">Result Portal &amp; Marks Support</option>
                    <option value="Campus Visit & Meeting">Campus Visit &amp; Principal Meeting</option>
                    <option value="Fee Payment Inquiry">Fee Payment &amp; Accounts Inquiry</option>
                    <option value="Other Assistance">Other General Query</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-700">
                    Your Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={onChange}
                    rows="4"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#1d7ff2] focus:outline-none focus:ring-3 focus:ring-[#1d7ff2]/15 resize-none"
                    placeholder="Write your query or question here..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1d7ff2] to-[#0f3f99] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:from-[#1868cc] hover:to-[#0b2d6d] hover:shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-lg">
                    {isSubmitting ? 'sync' : 'send'}
                  </span>
                  <span>{isSubmitting ? 'Sending Message...' : 'Submit Message'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: CAMPUS LOCATION & DIRECTIONS (Open, Modern Banner)
         ========================================================================= */}
      <section className="bg-gradient-to-b from-[#f8fafc] to-[#eaf4ff]/50 py-16 lg:py-20 border-t border-slate-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eaf4ff] px-3.5 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#1d5fb8]">
              <span className="material-symbols-outlined text-sm text-[#1d7ff2]">location_on</span>
              <span>Campus Location</span>
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Visit Star Public School Campus
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              Conveniently located at Harinagar, West Champaran. Open for parent visits, campus tours and office appointments.
            </p>
          </div>

          {/* Location Hero Banner */}
          <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-sky-100 shadow-xl bg-slate-900">
            <div className="relative h-80 sm:h-[28rem] lg:h-[32rem]">
              <img
                src={siteMedia.contactHero}
                alt="School campus location"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent" />

              {/* Bottom Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-2xl text-white">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/40 bg-sky-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-sky-200 backdrop-blur-xs mb-3">
                    <span className="material-symbols-outlined text-sm">near_me</span>
                    <span>School Campus</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-snug">
                    {schoolProfile.name}
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-slate-200 leading-relaxed flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-400 shrink-0">place</span>
                    <span>{schoolProfile.address}</span>
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-400 shrink-0">schedule</span>
                    <span>Visiting Hours: {schoolProfile.hours}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <a
                    href={schoolProfile.mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1d7ff2] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#1d7ff2]/30 hover:bg-[#156cd4] hover:scale-105 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">directions</span>
                    <span>Open in Google Maps</span>
                  </a>
                  <a
                    href={schoolProfile.phoneHref}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">call</span>
                    <span>Call School Office</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  )
}

export default Contact
