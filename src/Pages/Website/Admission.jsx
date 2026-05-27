import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import SEO from '../../Components/SEO/SEO'
import { buildSchoolJsonLd, SCHOOL_KEYWORDS } from '../../seo/siteSeo'
import { admissionFaqs, admissionSteps, admissionSupportBlocks, schoolProfile, siteMedia } from './siteContent'

function Admission() {
  const [form, setForm] = useState({
    studentName: '',
    guardianName: '',
    classInterest: '',
    phone: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSubmitted(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  const admissionMotionTags = [
    'Campus visit',
    'Document help',
    'Seat guidance',
    'Parent support',
    'Class planning',
    'Office clarity',
  ]

  return (
    <WebsiteLayout>
      <SEO
        title="Admission at Star Public School"
        description="Explore admissions at Star Public School in Harinagar, Ramnagar (Bettiah), West Champaran, Bihar. Clear steps, document guidance and parent support."
        keywords={SCHOOL_KEYWORDS}
        canonicalPath="/admission"
        jsonLd={buildSchoolJsonLd({ path: '/admission' })}
      />
      <section className="gps-site-section pt-6">
        <div className="gps-site-shell">
          <div className="flex flex-col gap-5">
            <article className="gps-site-panel p-6 sm:p-8 lg:p-10">
              <span className="gps-site-label">Admission page</span>
              <h3 className="gps-site-heading mt-5 text-2xl sm:text-3xl">A calmer and clearer way to begin admission</h3>
              <p className="gps-site-copy mt-5">
                This page was added so families do not have to piece together the admission process from different
                sections. It brings the conversation, steps, document expectations and enquiry flow into one place with
                a much cleaner reading order.
              </p>
              <p className="gps-site-copy mt-4">
                If you are considering <span className="font-semibold text-sm">{schoolProfile.name}</span>, begin by understanding the process below and then share
                your interest through the form or direct school contact.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/contact" className="gps-site-button">
                  Speak with the office
                </Link>
                <a href={schoolProfile.phoneHref} className="gps-site-button-secondary">
                  {schoolProfile.phone}
                </a>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {admissionSupportBlocks.map((item) => (
                  <div key={item.title} className="rounded-[1.35rem] border border-slate-200/80 bg-white/78 p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">{item.title}</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="gps-site-panel flex h-full flex-col p-4 sm:p-5">
              <div className="relative flex min-h-[360px] flex-1 flex-col overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.14),transparent_34%),linear-gradient(180deg,rgba(240,249,255,0.92),rgba(255,255,255,0.9))] p-5 sm:min-h-[420px] md:min-h-[500px] sm:p-6">
                <div className="float-soft absolute -left-8 top-10 h-24 w-24 rounded-full bg-cyan-200/30 blur-3xl"></div>
                <div
                  className="float-soft absolute -right-8 bottom-16 h-28 w-28 rounded-full bg-teal-200/26 blur-3xl"
                  style={{ animationDelay: '1.2s' }}
                ></div>
                <div
                  className="float-soft absolute right-8 top-8 h-14 w-14 rounded-full border border-white/80 bg-white/55"
                  style={{ animationDelay: '0.8s' }}
                ></div>

                <div className="relative flex items-start justify-between gap-3">
                  <div className="max-w-sm">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Admission journey</p>
                    <h3 className="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-[1.95rem]">
                      From first enquiry to classroom readiness.
                    </h3>
                  </div>
                  <div className="rounded-full border border-white/80 bg-white/72 px-3 py-1 text-[11px] font-semibold text-slate-600">
                    Guided flow
                  </div>
                </div>

                <div className="relative mt-6 flex-1 min-w-0">
                  <div className="absolute bottom-5 left-3 top-4 w-px bg-gradient-to-b from-cyan-300 via-slate-300 to-teal-300"></div>
                  <div className="space-y-3 sm:space-y-3.5">
                    {admissionSteps.map((step, index) => (
                      <div
                        key={step.title}
                        className={`float-soft relative ml-8 rounded-[1.2rem] border border-white/85 bg-white/78 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm md:w-[78%] ${index % 2 === 0 ? 'md:ml-8' : 'md:ml-auto md:mr-2'}`}
                        style={{ animationDelay: `${index * 0.6}s` }}
                      >
                        <div className="absolute -left-9 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white shadow-lg shadow-slate-900/18">
                          <span className="absolute inset-0 rounded-full bg-cyan-300/30 animate-ping"></span>
                          <span className="relative z-10">0{index + 1}</span>
                        </div>
                        <p className="text-sm font-semibold leading-snug text-slate-900 sm:text-[15px]">{step.title}</p>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-[13px]">{step.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative mt-4 overflow-hidden rounded-full border border-white/85 bg-white/74">
                  <div className="gps-site-marquee-track flex min-w-max items-center gap-3 px-4 py-2.5">
                    {[...admissionMotionTags, ...admissionMotionTags].map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="rounded-full border border-slate-200/90 bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="gps-site-section pt-0">
        <div className="gps-site-shell">
          <div className="mb-6">
            <span className="gps-site-label">Admission flow</span>
            <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">Four simple steps for a better admission experience</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {admissionSteps.map((step, index) => (
              <article key={step.title} className="gps-site-panel p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  0{index + 1}
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="gps-site-section pt-0">
        <div className="gps-site-shell">
          <div className="flex flex-col gap-5">
            <article className="gps-site-panel-muted p-6">
              <span className="gps-site-label">FAQs</span>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-900">Common admission questions</h2>
              <div className="mt-6 space-y-3">
                {admissionFaqs.map((item) => (
                  <div key={item.question} className="rounded-[1.3rem] border border-slate-200/80 bg-white/80 p-4">
                    <p className="text-base font-semibold text-slate-900">{item.question}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 gps-site-photo-frame h-56">
                <img src={siteMedia.admissionSupport} alt="Values and learning atmosphere" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </div>
            </article>

            <article className="gps-site-panel p-6">
              <h2 className="text-3xl font-extrabold text-slate-900">Admission enquiry form</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Leave your basic details here and the school can help you with the next step.
              </p>

              {submitted ? (
                <div className="mt-4 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  Admission enquiry received. The school team can follow up with you soon.
                </div>
              ) : null}

              <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                      Student Name
                    </label>
                    <input
                      name="studentName"
                      value={form.studentName}
                      onChange={handleChange}
                      className="gps-site-input"
                      placeholder="Enter student name"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                      Guardian Name
                    </label>
                    <input
                      name="guardianName"
                      value={form.guardianName}
                      onChange={handleChange}
                      className="gps-site-input"
                      placeholder="Enter guardian name"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                      Class Seeking
                    </label>
                    <input
                      name="classInterest"
                      value={form.classInterest}
                      onChange={handleChange}
                      className="gps-site-input"
                      placeholder="For example: Nursery or Class 5"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                      Phone
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="gps-site-input"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    className="gps-site-input min-h-32 resize-none"
                    placeholder="Share anything helpful about timing, class preference or visit planning"
                    required
                  />
                </div>

                <button type="submit" className="gps-site-button w-full justify-center">
                  Submit enquiry
                </button>
              </form>
            </article>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  )
}

export default Admission
