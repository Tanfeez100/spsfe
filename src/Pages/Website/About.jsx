import React from 'react'
import { Link } from 'react-router-dom'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import SEO from '../../Components/SEO/SEO'
import { buildSchoolJsonLd, SCHOOL_KEYWORDS } from '../../seo/siteSeo'
import { aboutLearningBlocks, aboutMilestones, aboutValues, schoolProfile, siteMedia } from './siteContent'

function About() {
  return (
    <WebsiteLayout>
      <SEO
        title="About Star Public School Meghwal Mathia"
        description="Learn about Star Public School in Meghwal Mathia, Ramnagar, West Champaran and how the school supports disciplined learning, values and parent communication."
        keywords={SCHOOL_KEYWORDS}
        canonicalPath="/about"
        jsonLd={buildSchoolJsonLd({ path: '/about' })}
      />
      <section className="gps-site-section pt-6">
        <div className="gps-site-shell">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.96fr]">
            <article className="gps-site-panel p-6 sm:p-8 lg:p-10">
              <span className="gps-site-label">About the school</span>
              <h1 className="gps-site-heading mt-5 text-2xl sm:text-3xl">{schoolProfile.name}</h1>
              <p className="gps-site-copy mt-5">
                The school has grown with a straightforward belief: children do best when expectations are clear,
                teachers remain approachable and the campus atmosphere stays disciplined without feeling cold. That is
                why our identity is not built on loud promises. It is built on routine, trust and consistent attention
                to student development.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/78 p-4">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Mission</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    To provide disciplined, thoughtful education that helps students grow in understanding, confidence
                    and responsibility.
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/78 p-4">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Approach</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    A student-first environment where classroom practice, culture and communication stay aligned for
                    families throughout the session.
                  </p>
                </div>
              </div>
            </article>

            <article className="gps-site-panel p-4 sm:p-5">
              <div className="gps-site-photo-frame h-72 sm:h-80">
                <img src={siteMedia.aboutHero} alt="School campus and students" loading="eager" fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-[0.82fr_1fr]">
                <div className="gps-site-photo-frame h-48 sm:h-full">
                  <img src={siteMedia.aboutSupport} alt="Students learning in class" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </div>
                <div className="rounded-[1.45rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.9),rgba(255,255,255,0.9))] p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">What families notice</p>
                  <p className="mt-3 text-base font-semibold text-slate-900">
                    The campus feels calmer when teaching, behaviour and communication are handled with the same care.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    That steady feeling matters. It helps children focus and gives parents a more dependable school
                    experience across admissions, academics and reporting.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="gps-site-section pt-0">
        <div className="gps-site-shell">
          <div className="mb-6">
            <span className="gps-site-label">Core values</span>
            <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">What shapes the school culture every day</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {aboutValues.map((value) => (
              <article key={value.title} className="gps-site-panel p-6">
                <h3 className="text-xl font-extrabold text-slate-900">{value.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="gps-site-section pt-0">
        <div className="gps-site-shell">
          <div className="grid gap-5 lg:grid-cols-[1.04fr_0.96fr]">
            <article className="gps-site-panel p-6 sm:p-8">
              <span className="gps-site-label">School journey</span>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">Growth built through steady improvement, not sudden noise</h2>

              <div className="mt-6 space-y-5">
                {aboutMilestones.map((item) => (
                  <div key={item.title} className="grid gap-3 rounded-[1.4rem] border border-slate-200/80 bg-white/80 p-4 sm:grid-cols-[110px_1fr]">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">{item.year}</p>
                    <div>
                      <p className="text-base font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="gps-site-panel-muted p-5 sm:p-6">
              <div className="gps-site-photo-frame h-72 sm:h-80">
                <img src={siteMedia.aboutLead} alt="School achievement and celebration" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </div>
              <div className="mt-5 rounded-[1.45rem] border border-slate-200/80 bg-white/82 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Leadership view</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  Education should help children become capable, respectful and comfortable with responsibility.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  That principle shapes our expectations inside the classroom and also outside it, in communication,
                  participation and everyday conduct across the campus.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="gps-site-section pt-0">
        <div className="gps-site-shell">
          <div className="mb-6">
            <span className="gps-site-label">Learning environment</span>
            <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">What learning looks like inside this school</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {aboutLearningBlocks.map((block) => (
              <article key={block.title} className="gps-site-panel p-6">
                <h3 className="text-xl font-extrabold text-slate-900">{block.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{block.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="gps-site-section pt-0">
        <div className="gps-site-shell">
          <div className="gps-site-panel p-7 text-center sm:p-10">
            <span className="gps-site-label">Next step</span>
            <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">If this school feels aligned with your family, begin with admission guidance.</h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
              The admission page now explains the process in a calmer, more useful way so families can move forward
              without second-guessing the next step.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/admission" className="gps-site-button">
                Open admission page
              </Link>
              <Link to="/gallery" className="gps-site-button-secondary">
                View campus gallery
              </Link>
            </div>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  )
}

export default About
