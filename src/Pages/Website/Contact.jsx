import React, { useState } from 'react'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import SEO from '../../Components/SEO/SEO'
import { buildSchoolJsonLd, SCHOOL_KEYWORDS } from '../../seo/siteSeo'
import { contactCards, schoolProfile, siteMedia } from './siteContent'

function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSent(false)
  }

  const onSubmit = (event) => {
    event.preventDefault()
    setSent(true)
  }

  return (
    <WebsiteLayout>
      <SEO
        title="Contact Star Public School"
        description="Contact Star Public School in Harinagar, Ramnagar (Bettiah), West Champaran, Bihar for admissions, result support and campus visits."
        keywords={SCHOOL_KEYWORDS}
        canonicalPath="/contact"
        jsonLd={buildSchoolJsonLd({ path: '/contact' })}
      />
      <section className="gps-site-section pt-6">
        <div className="gps-site-shell">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.92fr]">
            <article className="gps-site-panel p-6 sm:p-8 lg:p-10">
              <span className="gps-site-label">Contact desk</span>
              <h1 className="gps-site-heading mt-5 text-2xl sm:text-3xl">Talk to {schoolProfile.name}</h1>
              <p className="gps-site-copy mt-5">
                The contact page has also been cleaned up so families can reach the school without hunting for phone
                numbers, office timing or the right starting point. Whether the query is about admission, results or
                general support, the school office is the most reliable first stop.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {contactCards.map((item) => (
                  <a
                    key={item.title}
                    href={item.link}
                    target={item.link.startsWith('http') ? '_blank' : undefined}
                    rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="rounded-[1.35rem] border border-slate-200/80 bg-white/78 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined mt-0.5 text-cyan-700">{item.icon}</span>
                      <span>
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-900">{item.title}</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </article>

            <article className="gps-site-panel p-4 sm:p-5">
              <div className="gps-site-photo-frame h-[360px] sm:h-[420px]">
                <img src={siteMedia.contactSupport} alt="Students on campus" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </div>
              <div className="mt-4 rounded-[1.5rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.9),rgba(255,255,255,0.9))] p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Office guidance</p>
                <p className="mt-3 text-base font-semibold text-slate-900">{schoolProfile.hours}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Families are welcome to call first, visit the campus for admissions, or send a written query using the
                  form below. The message flow is kept intentionally simple for faster follow-up.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="gps-site-section pt-0" id="contact-form">
        <div className="gps-site-shell">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <article className="gps-site-panel-muted p-6">
              <span className="gps-site-label">What you can ask</span>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-900">Admissions, results, records or general campus support</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                This school website now keeps communication more focused. If you are unsure where to begin, send one
                clear message and the school office can guide you toward the correct next step.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  'Admission queries and seat availability',
                  'General school timings and office guidance',
                  'Result portal support and record-related questions',
                  'Campus visit planning and basic parent assistance',
                ].map((item) => (
                  <div key={item} className="rounded-[1.3rem] border border-slate-200/80 bg-white/80 p-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined mt-0.5 text-cyan-700">arrow_forward</span>
                      <p className="text-sm leading-relaxed text-slate-600">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="gps-site-panel p-6">
              <h2 className="text-3xl font-extrabold text-slate-900">Send a message</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Share your query below and the school team can follow up with the right guidance.
              </p>

              {sent ? (
                <div className="mt-4 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  Message received. Thank you, we will contact you soon.
                </div>
              ) : null}

              <form className="mt-5 space-y-3" onSubmit={onSubmit}>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    Full Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    className="gps-site-input"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                      Phone
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      className="gps-site-input"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={onChange}
                      className="gps-site-input"
                      placeholder="name@email.com"
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
                    onChange={onChange}
                    className="gps-site-input min-h-36 resize-none"
                    placeholder="Write your question..."
                    required
                  />
                </div>

                <button type="submit" className="gps-site-button w-full justify-center">
                  <span className="material-symbols-outlined text-base">send</span>
                  Submit message
                </button>
              </form>
            </article>
          </div>
        </div>
      </section>

      <section className="gps-site-section pt-0">
        <div className="gps-site-shell">
          <div className="gps-site-panel overflow-hidden">
              <div className="relative h-80 sm:h-[28rem]">
              <img src={siteMedia.contactHero} alt="School campus location" loading="eager" fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/50 to-slate-900/10"></div>
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Visit us</p>
                <p className="mt-2 text-2xl font-bold text-white sm:text-4xl">School campus location</p>
                <p className="mt-2 max-w-3xl text-sm text-slate-200 sm:text-lg">{schoolProfile.address}</p>
                <a
                  href={schoolProfile.mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/16"
                >
                  <span className="material-symbols-outlined text-base">near_me</span>
                  Open directions
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  )
}

export default Contact
