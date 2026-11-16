import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SEO from '../../Components/SEO/SEO'
import { SCHOOL_KEYWORDS } from '../../seo/siteSeo'
import { useResultSearchOptions } from './useResultSearchOptions'
import { schoolProfile, siteMedia } from '../Website/siteContent'
import { aboutPhotos, campusPhotos } from '../../assets/websiteImages'

const sanitizeSessionValue = (value) => String(value ?? '').replace(/[^0-9-]/g, '').replace(/-+/g, '-').slice(0, 7)

function ResultsPortal() {
  const navigate = useNavigate()
  const terminals = useMemo(() => ['First', 'Second', 'Third', 'Annual'], [])

  const [formData, setFormData] = useState({
    classValue: '',
    roll: '',
    terminal: 'First',
    section: '',
    session: '',
  })

  const [error, setError] = useState('')
  const {
    classOptions,
    sectionOptions,
    loading: loadingSearchOptions,
    error: searchOptionsError,
  } = useResultSearchOptions(formData.classValue)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => {
      if (name === 'classValue') {
        return {
          ...prev,
          classValue: value,
          section: '',
          session: '',
        }
      }

      if (name === 'session') {
        return { ...prev, session: sanitizeSessionValue(value) }
      }

      return { ...prev, [name]: value }
    })
    setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!formData.classValue || !formData.section || !formData.roll || !formData.terminal) {
      setError('Please fill Class, Section, Roll No and Terminal.')
      return
    }

    const params = new URLSearchParams()
    params.set('class', String(formData.classValue).trim())
    params.set('roll', String(formData.roll).trim())
    params.set('terminal', String(formData.terminal).trim())
    if (String(formData.section).trim()) params.set('section', String(formData.section).trim())
    if (String(formData.session).trim()) params.set('session', String(formData.session).trim())

    navigate(`/result?${params.toString()}`)
  }

  return (
    <div className="relative min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col lg:flex-row overflow-x-hidden">
      <SEO
        title={`Student Result Portal | ${schoolProfile.name}`}
        description={`Secure online result portal for ${schoolProfile.name} students in Harinagar, Ramnagar (Bettiah), West Champaran, Bihar.`}
        keywords={SCHOOL_KEYWORDS}
        canonicalPath="/results-portal"
      />

      {/* LEFT HALF (Adha Part Left): Campus Photo & School Identity */}
      <section className="relative w-full lg:w-1/2 min-h-[460px] lg:min-h-screen bg-[#07172e] flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 text-white overflow-hidden text-center">
        {/* Background Campus Image */}
        <img
          src={aboutPhotos.hero || campusPhotos[22]?.src || siteMedia.homeCulture}
          alt={`${schoolProfile.name} Campus`}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 scale-100 hover:scale-105"
          loading="eager"
          decoding="async"
        />

        {/* Themed Gradient Overlay for high contrast & elegance */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#061426] via-[#092244]/85 to-[#0b2752]/65 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(29,127,242,0.3),transparent_70%)] pointer-events-none" />

        {/* Content on Image - Centered */}
        <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center text-center">
          {/* School Logo & Name (Centered Directly at Top of Left Panel) */}
          <Link
            to="/"
            className="group mb-5 inline-flex flex-col sm:flex-row items-center gap-3.5 rounded-3xl border border-white/20 bg-white/10 px-5 sm:px-6 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/15 hover:border-white/35"
            title="Return to Website Home"
          >
            <div className="rounded-full bg-white p-1.5 shadow-md ring-2 ring-amber-400/70 shrink-0">
              <img
                src={siteMedia.logo}
                alt={schoolProfile.name}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
              />
            </div>
            <div className="text-center sm:text-left">
              <span className="block font-serif font-black text-white text-lg sm:text-xl leading-tight tracking-tight drop-shadow-sm">
                {schoolProfile.name}
              </span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#38bdf8] leading-tight mt-1">
                Harinagar, West Champaran
              </span>
            </div>
          </Link>

          {/* Official Portal Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-sky-200 backdrop-blur-sm shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Official Examination Portal</span>
          </div>

          {/* Heading */}
          <h1 className="mt-5 text-2xl sm:text-3xl lg:text-[2.2rem] font-serif font-black text-white leading-tight">
            Instant &amp; Verified Student Result Portal
          </h1>

          {/* Subtitle / Paragraph */}
          <p className="mt-3.5 text-xs sm:text-sm text-sky-100/90 leading-relaxed font-normal max-w-md mx-auto">
            Access secure, term-wise examination report cards, marks sheets and progress records for students of {schoolProfile.name}.
          </p>

          {/* Badges / Key Features */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-sky-200/90">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 backdrop-blur-xs">
              <span className="material-symbols-outlined text-sm text-[#38bdf8]">verified</span>
              Term 1, 2, 3 &amp; Annual
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 backdrop-blur-xs">
              <span className="material-symbols-outlined text-sm text-[#38bdf8]">picture_as_pdf</span>
              Download Marksheets
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 backdrop-blur-xs">
              <span className="material-symbols-outlined text-sm text-[#38bdf8]">lock</span>
              Verified Database
            </span>
          </div>
        </div>
      </section>

      {/* RIGHT HALF (Adha Part Right): Result Search Form */}
      <section className="relative w-full lg:w-1/2 min-h-screen bg-white flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-20">
        <div className="w-full max-w-md mx-auto">
          {/* Top Back Link & Badge */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1d7ff2] transition-colors"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to Website</span>
            </Link>

            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className="material-symbols-outlined text-sm text-emerald-500">lock</span>
              Secure Portal
            </span>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-slate-950 tracking-tight">
              View Student Result
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
              Select class, section, roll number and examination terminal to fetch report card.
            </p>
          </div>

          {/* Error alerts */}
          {searchOptionsError ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800 flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-amber-600 shrink-0">warning</span>
              <span>{searchOptionsError}</span>
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-rose-600 shrink-0">error</span>
              <span>{error}</span>
            </div>
          ) : null}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Class & Section in 2 columns */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Class <span className="text-rose-500">*</span>
                </label>
                <select
                  name="classValue"
                  value={formData.classValue}
                  onChange={handleChange}
                  disabled={loadingSearchOptions}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 transition-all focus:border-[#1d7ff2] focus:outline-none focus:ring-3 focus:ring-[#1d7ff2]/15 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  required
                >
                  <option value="">
                    {loadingSearchOptions
                      ? 'Loading classes...'
                      : classOptions.length > 0
                        ? 'Select class'
                        : 'No classes found'}
                  </option>
                  {classOptions.map((classValue) => (
                    <option key={classValue} value={classValue}>
                      {classValue}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Section <span className="text-rose-500">*</span>
                </label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  disabled={!formData.classValue || loadingSearchOptions}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 transition-all focus:border-[#1d7ff2] focus:outline-none focus:ring-3 focus:ring-[#1d7ff2]/15 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  required
                >
                  <option value="">
                    {!formData.classValue
                      ? 'Select class first'
                      : loadingSearchOptions
                        ? 'Loading sections...'
                        : sectionOptions.length > 0
                          ? 'Select section'
                          : 'No sections found'}
                  </option>
                  {sectionOptions.map((sectionValue) => (
                    <option key={sectionValue} value={sectionValue}>
                      {sectionValue}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Roll Number & Terminal in 2 columns */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="roll"
                  value={formData.roll}
                  onChange={handleChange}
                  placeholder="e.g. 15"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#1d7ff2] focus:outline-none focus:ring-3 focus:ring-[#1d7ff2]/15"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Terminal Exam <span className="text-rose-500">*</span>
                </label>
                <select
                  name="terminal"
                  value={formData.terminal}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 transition-all focus:border-[#1d7ff2] focus:outline-none focus:ring-3 focus:ring-[#1d7ff2]/15 cursor-pointer"
                >
                  {terminals.map((terminal) => (
                    <option key={terminal} value={terminal}>
                      {terminal} Term
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Session Optional */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Academic Session <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                name="session"
                value={formData.session}
                onChange={handleChange}
                placeholder="2026-27"
                inputMode="numeric"
                pattern="[0-9-]*"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#1d7ff2] focus:outline-none focus:ring-3 focus:ring-[#1d7ff2]/15"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!formData.classValue || !formData.section || !formData.roll || !formData.terminal}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1d7ff2] to-[#0f3f99] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:from-[#1868cc] hover:to-[#0b2d6d] hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">search</span>
              <span>View Examination Result</span>
            </button>
          </form>

          {/* Helpdesk Footer */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>Need help with Roll No?</p>
            <a
              href={schoolProfile.phoneHref}
              className="inline-flex items-center gap-1.5 font-bold text-[#1d7ff2] hover:underline"
            >
              <span className="material-symbols-outlined text-sm">call</span>
              <span>Office: {schoolProfile.phone}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ResultsPortal
