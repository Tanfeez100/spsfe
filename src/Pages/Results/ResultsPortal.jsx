import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import SEO from '../../Components/SEO/SEO'
import { SCHOOL_KEYWORDS } from '../../seo/siteSeo'
import { useResultSearchOptions } from './useResultSearchOptions'

const sanitizeSessionValue = (value) => String(value ?? '').replace(/[^0-9-]/g, '').replace(/-+/g, '-').slice(0, 7)

function ResultsPortal() {
  const SCHOOL_NAME = import.meta.env.VITE_SCHOOL_NAME || 'Star Public School'
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
    <WebsiteLayout>
      <SEO
        title={`${SCHOOL_NAME} Result Portal`}
        description={`Secure result portal for ${SCHOOL_NAME} students in Harinagar, Ramnagar (Bettiah), West Champaran, Bihar.`}
        keywords={SCHOOL_KEYWORDS}
        canonicalPath="/results-portal"
      />
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fcff_0%,#eff6fb_50%,#f7fafc_100%)]">
        <section className="relative overflow-hidden py-8 md:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),transparent_42%,rgba(15,118,110,0.08))]"></div>

          <div className="relative mx-auto max-w-4xl px-4">
            <div className="mx-auto mb-4 max-w-2xl text-center sm:mb-5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-sky-50/90 px-2.5 py-1 text-cyan-700">
                <span className="material-symbols-outlined text-[12px]">verified_user</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.14em]">Secure Portal</span>
              </div>

              <h1 className="mt-2 text-lg font-black leading-tight text-slate-900 sm:text-xl">
                View Your <span className="text-cyan-700">Results</span>
              </h1>

              <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                Access your academic performance with just a few details. Check your marks, division, and percentage
                instantly.
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { icon: 'check_circle', label: 'Instant', desc: 'Real-time results' },
                  { icon: 'security', label: 'Secure', desc: 'Safe access' },
                  { icon: 'trending_up', label: 'Track', desc: 'Performance' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-slate-200 bg-white/92 p-2 shadow-sm shadow-slate-200/30"
                  >
                    <div className="mb-1 flex items-center justify-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-cyan-700">{item.icon}</span>
                      <p className="text-xs font-bold text-slate-900">{item.label}</p>
                    </div>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto max-w-[500px]">
              <div className="absolute -inset-2.5 rounded-[24px] bg-[linear-gradient(90deg,rgba(14,165,233,0.14),transparent)] blur-2xl"></div>

              <div className="relative rounded-[20px] border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-300/20 sm:p-5">
                <h2 className="text-lg font-black text-slate-900 sm:text-xl">Enter Your Details</h2>
                <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">Fill in the student details to search your result.</p>

                <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
                        <span className="material-symbols-outlined mr-1 align-middle text-[14px] text-cyan-700">school</span>
                        Class
                      </label>
                      <select
                        name="classValue"
                        value={formData.classValue}
                        onChange={handleChange}
                        disabled={loadingSearchOptions}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 placeholder-slate-400 transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                        required
                      >
                        <option value="">
                          {loadingSearchOptions ? 'Loading classes...' : classOptions.length > 0 ? 'Select class' : 'No classes found'}
                        </option>
                        {classOptions.map((classValue) => (
                          <option key={classValue} value={classValue}>
                            {classValue}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
                        <span className="material-symbols-outlined mr-1 align-middle text-[14px] text-cyan-700">badge</span>
                        Roll Number
                      </label>
                      <input
                        type="number"
                        name="roll"
                        value={formData.roll}
                        onChange={handleChange}
                        placeholder="Roll no."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 placeholder-slate-400 transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
                      <span className="material-symbols-outlined mr-1 align-middle text-[14px] text-cyan-700">calendar_today</span>
                      Terminal/Exam
                    </label>
                    <select
                      name="terminal"
                      value={formData.terminal}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                    >
                      {terminals.map((terminal) => (
                        <option key={terminal} value={terminal}>
                          {terminal} Terminal
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
                        <span className="material-symbols-outlined mr-1 align-middle text-[14px] text-cyan-700">layers</span>
                        Section
                      </label>
                      <select
                        name="section"
                        value={formData.section}
                        onChange={handleChange}
                        disabled={!formData.classValue || loadingSearchOptions}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 placeholder-slate-400 transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                      >
                        <option value="">
                          {!formData.classValue
                            ? 'Select class first'
                            : loadingSearchOptions
                              ? 'Loading sections...'
                              : sectionOptions.length > 0
                                ? 'All sections'
                                : 'No sections found'}
                        </option>
                        {sectionOptions.map((sectionValue) => (
                          <option key={sectionValue} value={sectionValue}>
                            {sectionValue}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
                        <span className="material-symbols-outlined mr-1 align-middle text-[14px] text-cyan-700">calendar_month</span>
                        Session <span className="text-[10px] text-slate-400 normal-case">(Optional)</span>
                      </label>
                      <input
                        name="session"
                        value={formData.session}
                        onChange={handleChange}
                        placeholder="2026-27"
                        inputMode="numeric"
                        pattern="[0-9-]*"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 placeholder-slate-400 transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                      />
                    </div>
                  </div>

                  {searchOptionsError ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-[11px] text-amber-700">
                      {searchOptionsError}
                    </div>
                  ) : null}

                  {error ? (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2">
                      <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg text-red-600">error</span>
                      <p className="text-xs text-red-700">{error}</p>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={!formData.classValue || !formData.section || !formData.roll || !formData.terminal}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#0f172a_0%,#155e75_100%)] px-4 py-2 text-[13px] font-bold text-white shadow-lg shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/18"
                  >
                    <span className="material-symbols-outlined text-sm">search</span>
                    View My Result
                  </button>
                </form>

                <div className="mt-3 border-t border-slate-200 pt-3 text-center">
                  <p className="mb-1.5 text-[10px] text-slate-500">Questions? Need help accessing your result?</p>
                  <Link to="/contact" className="inline-flex items-center gap-1 text-[13px] font-bold text-cyan-700 hover:underline">
                    <span className="material-symbols-outlined text-[14px]">call</span>
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl border-t border-slate-200 px-4 py-16">
          <h2 className="mb-12 text-center text-3xl font-black text-slate-900">Features</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: 'timeline',
                title: 'Subject-wise Marks',
                desc: 'View detailed marks for each subject including external and internal assessments',
              },
              {
                icon: 'percent',
                title: 'Performance Analytics',
                desc: 'Track your percentage, division, and overall performance at a glance',
              },
              {
                icon: 'print',
                title: 'Printable Results',
                desc: 'Download and print your result card for official use',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white/92 p-6 shadow-lg shadow-slate-200/30 transition-all hover:border-cyan-200 hover:shadow-slate-300/30"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50">
                  <span className="material-symbols-outlined text-cyan-700">{feature.icon}</span>
                </div>
                <h3 className="mb-2 text-lg font-black text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto my-8 max-w-4xl rounded-xl border border-cyan-100 bg-cyan-50/65 px-4 py-12 shadow-sm shadow-cyan-100/60">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined flex-shrink-0 text-2xl text-cyan-700">info</span>
            <div>
              <h3 className="mb-2 font-bold text-slate-900">How to Access Your Results</h3>
              <ol className="list-inside list-decimal space-y-1 text-sm text-slate-700">
                <li>Enter your class number exactly as provided in school records</li>
                <li>Provide your roll number</li>
                <li>Select the appropriate terminal/exam period</li>
                <li>Section and session are optional - include if applicable</li>
                <li>Click "View My Result" to see your marks and performance</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  )
}

export default ResultsPortal
