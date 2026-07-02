import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
        <section className="mx-auto max-w-xl">
          <div className="mb-5 text-center">
            <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">Result Portal</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">Enter details to view result.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800">Class</label>
                  <select
                    name="classValue"
                    value={formData.classValue}
                    onChange={handleChange}
                    disabled={loadingSearchOptions}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
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
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800">Section</label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    disabled={!formData.classValue || loadingSearchOptions}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800">Roll Number</label>
                  <input
                    type="number"
                    name="roll"
                    value={formData.roll}
                    onChange={handleChange}
                    placeholder="Roll no."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800">Terminal</label>
                  <select
                    name="terminal"
                    value={formData.terminal}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900"
                  >
                    {terminals.map((terminal) => (
                      <option key={terminal} value={terminal}>
                        {terminal}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Session optional</label>
                <input
                  name="session"
                  value={formData.session}
                  onChange={handleChange}
                  placeholder="2026-27"
                  inputMode="numeric"
                  pattern="[0-9-]*"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              {searchOptionsError ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                  {searchOptionsError}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!formData.classValue || !formData.section || !formData.roll || !formData.terminal}
                className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                View Result
              </button>
            </form>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  )
}

export default ResultsPortal
