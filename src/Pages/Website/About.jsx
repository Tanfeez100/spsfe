import React from 'react'
import { Link } from 'react-router-dom'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import SEO from '../../Components/SEO/SEO'
import { buildSchoolJsonLd, SCHOOL_KEYWORDS } from '../../seo/siteSeo'
import { aboutLearningBlocks, aboutMilestones, aboutValues, schoolProfile, siteMedia } from './siteContent'
import { aboutPhotos } from '../../assets/websiteImages'

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

      {/* =========================================================================
          SECTION 1: HERO / ABOUT THE SCHOOL OVERVIEW
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f8fbff] via-[#f0f7ff] to-[#e8f3fe] py-16 lg:py-20">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            {/* Left Column: School Story, Mission & Approach */}
            <div>
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eaf4ff] px-3.5 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#1d5fb8]">
                <span className="material-symbols-outlined text-sm text-[#1d7ff2]">school</span>
                <span>About the School</span>
              </div>

              {/* Heading */}
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl leading-[1.15]">
                {schoolProfile.name}
              </h1>

              {/* Description (Original) */}
              <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600">
                The school has grown with a straightforward belief: children do best when expectations are clear,
                teachers remain approachable and the campus atmosphere stays disciplined without feeling cold. That is
                why our identity is not built on loud promises. It is built on routine, trust and consistent attention
                to student development.
              </p>

              {/* Mission & Approach Cards */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Mission Card */}
                <div className="group rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-sky-300 hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf4ff] text-[#1d7ff2] shadow-xs transition-transform duration-300 group-hover:scale-105">
                    <span className="material-symbols-outlined text-xl">flag</span>
                  </div>
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d5fb8]">Mission</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 font-medium">
                    To provide disciplined, thoughtful education that helps students grow in understanding, confidence
                    and responsibility.
                  </p>
                </div>

                {/* Approach Card */}
                <div className="group rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-sky-300 hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf4ff] text-[#1d7ff2] shadow-xs transition-transform duration-300 group-hover:scale-105">
                    <span className="material-symbols-outlined text-xl">psychology</span>
                  </div>
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d5fb8]">Approach</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 font-medium">
                    A student-first environment where classroom practice, culture and communication stay aligned for
                    families throughout the session.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Campus Photo & "What families notice" */}
            <div className="space-y-4">
              {/* Photo Frame */}
              <div className="rounded-[2.4rem] border-2 border-[#1d7ff2]/30 bg-gradient-to-br from-[#1d7ff2]/10 via-transparent to-sky-100/40 p-2 sm:p-2.5 shadow-sm">
                <div className="relative overflow-hidden rounded-[2rem] bg-slate-100 shadow-xl">
                  <img
                    src={siteMedia.aboutHero}
                    alt="School campus and students"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="h-[300px] sm:h-[360px] w-full object-cover"
                  />
                  {/* Floating Overlay Badge */}
                  <div className="absolute bottom-4 left-4 right-4 sm:right-auto flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f3f99] to-[#1d7ff2] text-white shadow-sm">
                      <span className="material-symbols-outlined text-lg">local_florist</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 leading-tight">Calm Learning Atmosphere</p>
                      <p className="text-[11px] font-semibold text-slate-500 leading-tight">Focus • Discipline • Growth</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* "What families notice" Card */}
              <div className="rounded-2xl border border-sky-100 bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1d7ff2]" />
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d5fb8]">What families notice</p>
                </div>
                <p className="mt-2 text-base font-bold text-slate-900 leading-snug">
                  The campus feels calmer when teaching, behaviour and communication are handled with the same care.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  That steady feeling matters. It helps children focus and gives parents a more dependable school
                  experience across admissions, academics and reporting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: LEADERSHIP / DIRECTOR & PRINCIPAL DESK
         ========================================================================= */}
      <section className="relative overflow-hidden bg-white py-16 lg:py-20 border-t border-sky-100">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-[#eef7ff] px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#0f3f99]">
              <span className="material-symbols-outlined text-base text-[#1d7ff2]">badge</span>
              <span>Leadership Desk</span>
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl leading-tight">
              Guiding Minds,{' '}
              <span className="relative inline-block text-[#1d7ff2]">
                Shaping Character
                <svg
                  className="absolute -bottom-1.5 left-0 w-full text-[#38bdf8]"
                  height="8"
                  viewBox="0 0 160 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 5.5C40 2 120 2 158 5.5"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Our leadership vision focuses on purposeful learning, disciplined habits, and accessible guidance for every family.
            </p>
          </div>

          {/* Featured Leadership Card */}
          <div className="mt-12 overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-[#f8fbff] via-white to-[#f0f7ff] p-6 shadow-xl shadow-sky-900/5 sm:p-10">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
              {/* Left: Principal / Director Image */}
              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div className="rounded-[2.2rem] border-2 border-[#1d7ff2]/25 bg-gradient-to-br from-[#1d7ff2]/15 via-transparent to-sky-100/30 p-2 shadow-sm">
                  <div className="relative overflow-hidden rounded-[1.8rem] bg-slate-100 shadow-lg">
                    <img
                      src={aboutPhotos.principal || siteMedia.aboutLead}
                      alt="School Principal and Director with students"
                      loading="lazy"
                      decoding="async"
                      className="h-[340px] sm:h-[400px] w-full object-cover"
                    />

                    {/* Official Desk Badge */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl border border-white/90 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f3f99] to-[#1d7ff2] text-white shadow-xs">
                        <span className="material-symbols-outlined text-xl">verified</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 leading-tight">Director & Principal Desk</p>
                        <p className="text-xs font-semibold text-[#1d5fb8] leading-tight truncate">{schoolProfile.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Leadership View & Vision Message */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-4xl text-[#1d7ff2]/40">format_quote</span>
                </div>

                {/* Primary Quote (Original Content) */}
                <blockquote className="mt-2 text-xl font-black text-slate-900 sm:text-2xl leading-snug">
                  "Education should help children become capable, respectful and comfortable with responsibility."
                </blockquote>

                {/* Description (Original Content) */}
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  That principle shapes our expectations inside the classroom and also outside it, in communication,
                  participation and everyday conduct across the campus. We ensure that every child who walks through
                  our school receives not just academic lessons, but steady life habits, emotional security and moral fortitude.
                </p>

                {/* 3 Core Leadership Highlights */}
                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-sky-100 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-[#1d7ff2]">
                      <span className="material-symbols-outlined text-lg">workspace_premium</span>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900">Values First</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 font-medium">Ethical habits built into daily routine</p>
                  </div>

                  <div className="rounded-xl border border-sky-100 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-[#1d7ff2]">
                      <span className="material-symbols-outlined text-lg">groups</span>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900">Student Care</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 font-medium">Every learner is noticed and guided</p>
                  </div>

                  <div className="rounded-xl border border-sky-100 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-[#1d7ff2]">
                      <span className="material-symbols-outlined text-lg">connect_without_contact</span>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900">Open Connect</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 font-medium">Direct parent accessibility</p>
                  </div>
                </div>

                {/* Director Sign-Off Badge */}
                <div className="mt-7 flex items-center gap-4 pt-4 border-t border-sky-100">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf4ff] text-[#1d7ff2] font-black text-lg border border-sky-200">
                    SPS
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Office of School Leadership</p>
                    <p className="text-xs font-semibold text-slate-500">Star Public School • Harinagar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: OUR DEDICATED FACULTY & TEACHERS GROUP
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f8fbff] via-[#f0f7ff] to-[#e8f3fe] py-16 lg:py-20 border-t border-sky-100">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            {/* Left: Faculty Overview & Mentorship Highlights */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eaf4ff] px-3.5 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#1d5fb8]">
                <span className="material-symbols-outlined text-sm text-[#1d7ff2]">groups</span>
                <span>Our Mentors & Educators</span>
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl leading-[1.15]">
                The Dedicated Teachers Behind Every{' '}
                <span className="relative inline-block text-[#1d7ff2]">
                  Success
                  <svg
                    className="absolute -bottom-1.5 left-0 w-full text-[#38bdf8]"
                    height="8"
                    viewBox="0 0 160 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 5.5C40 2 120 2 158 5.5"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h2>

              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                A school's strength lies in its teachers. Our educators bring subject mastery, disciplined routines, and
                genuine patience to the classroom so children learn with confidence rather than fear.
              </p>

              {/* 4 Faculty Pillars */}
              <div className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-xl text-[#1d7ff2]">co_present</span>
                    <h3 className="text-sm font-black text-slate-900">Personal Attention</h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    With a healthy 1:25 student-teacher ratio, teachers notice where a learner needs repetition and encouragement.
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-xl text-[#1d7ff2]">menu_book</span>
                    <h3 className="text-sm font-black text-slate-900">Concept-Led Teaching</h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Lessons are explained clearly with practical examples so concepts settle naturally before examinations.
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-xl text-[#1d7ff2]">family_restroom</span>
                    <h3 className="text-sm font-black text-slate-900">Approachable to Parents</h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Teachers communicate progress transparently so families stay informed and supportive at every stage.
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-xl text-[#1d7ff2]">military_tech</span>
                    <h3 className="text-sm font-black text-slate-900">Continuous Mentorship</h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Guiding students in conduct, communication and stage confidence alongside textbook curricula.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Group photo of teachers */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="rounded-[2.4rem] border-2 border-[#1d7ff2]/30 bg-gradient-to-br from-[#1d7ff2]/10 via-transparent to-sky-100/40 p-2 sm:p-2.5 shadow-sm">
                <div className="relative overflow-hidden rounded-[2rem] bg-slate-100 shadow-xl">
                  <img
                    src={aboutPhotos.secondary || siteMedia.aboutSupport}
                    alt="Group of dedicated teachers and faculty members"
                    loading="lazy"
                    decoding="async"
                    className="h-[360px] sm:h-[420px] w-full object-cover"
                  />

                  {/* Floating Faculty Badge */}
                  <div className="absolute bottom-4 left-4 right-4 sm:right-auto flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f3f99] to-[#1d7ff2] text-white shadow-sm">
                      <span className="material-symbols-outlined text-xl">groups</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 leading-tight">Our Faculty Team</p>
                      <p className="text-[11px] font-semibold text-slate-500 leading-tight">20+ Qualified Educators & Staff</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: CORE VALUES (What shapes the school culture every day)
         ========================================================================= */}
      <section className="relative overflow-hidden bg-white py-16 lg:py-20 border-t border-sky-100">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-[#eef7ff] px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#0f3f99]">
              <span className="material-symbols-outlined text-base text-[#1d7ff2]">star</span>
              <span>Core Values</span>
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl leading-tight">
              What shapes the school culture{' '}
              <span className="relative inline-block text-[#1d7ff2]">
                every day
                <svg
                  className="absolute -bottom-1.5 left-0 w-full text-[#38bdf8]"
                  height="8"
                  viewBox="0 0 160 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 5.5C40 2 120 2 158 5.5"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Our culture is rooted in daily discipline, encouraging classrooms, active participation, and transparent communication.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {aboutValues.map((value, idx) => {
              const icons = ['verified', 'psychology', 'record_voice_over', 'handshake']
              return (
                <article
                  key={value.title}
                  className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-[#f8fbff] p-6 shadow-xs transition-all duration-300 hover:border-sky-300 hover:bg-white hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#1d7ff2] border border-sky-100 shadow-xs transition-colors duration-300 group-hover:bg-[#1d7ff2] group-hover:text-white">
                    <span className="material-symbols-outlined text-2xl">{icons[idx % icons.length]}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-black text-slate-900 leading-snug">{value.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{value.text}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: SCHOOL JOURNEY (Growth built through steady improvement)
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0b1d3a] via-[#08172e] to-[#040e1d] text-white py-16 lg:py-20">
        {/* Subtle background ambient waves */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#1d7ff2]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-950/60 px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-sky-300">
              <span className="material-symbols-outlined text-base text-[#38bdf8]">history_edu</span>
              <span>School Journey</span>
            </div>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl lg:text-5xl tracking-tight leading-tight">
              Growth built through steady improvement, not sudden noise
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
              How Star Public School established a strong reputation of academic consistency, parent trust, and structured progress.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {aboutMilestones.map((item, idx) => (
              <div
                key={item.title}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:border-[#1d7ff2]/50 hover:bg-white/10 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-lg bg-[#1d7ff2] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white shadow-xs">
                    {item.year}
                  </span>
                  <span className="text-xs font-bold text-sky-400">Phase 0{idx + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-black text-white leading-snug">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: LEARNING ENVIRONMENT (What learning looks like inside)
         ========================================================================= */}
      <section className="relative overflow-hidden bg-[#f8fbff] py-16 lg:py-20 border-t border-sky-100">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-[#eef7ff] px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#0f3f99]">
              <span className="material-symbols-outlined text-base text-[#1d7ff2]">menu_book</span>
              <span>Learning Environment</span>
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl leading-tight">
              What learning looks like{' '}
              <span className="relative inline-block text-[#1d7ff2]">
                inside this school
                <svg
                  className="absolute -bottom-1.5 left-0 w-full text-[#38bdf8]"
                  height="8"
                  viewBox="0 0 160 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 5.5C40 2 120 2 158 5.5"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Classrooms designed for conceptual clarity, whole-child growth through activities, and seamless school-home alignment.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {aboutLearningBlocks.map((block, idx) => {
              const blockIcons = ['auto_stories', 'sports_basketball', 'diversity_3']
              return (
                <article
                  key={block.title}
                  className="rounded-2xl border border-sky-100 bg-white p-7 shadow-xs transition-all duration-300 hover:border-sky-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf4ff] text-[#1d7ff2] shadow-xs">
                    <span className="material-symbols-outlined text-2xl">{blockIcons[idx % blockIcons.length]}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-black text-slate-900 leading-snug">{block.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{block.text}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: NEXT STEP / ADMISSIONS CTA
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f0f7ff] via-[#f8fbff] to-[#e4f2fe] py-16 lg:py-20 border-t border-sky-100">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eaf4ff] px-3.5 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#1d5fb8]">
            <span className="material-symbols-outlined text-sm text-[#1d7ff2]">arrow_forward</span>
            <span>Next Step</span>
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl leading-tight">
            If this school feels aligned with your family, begin with admission guidance.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
            The admission page now explains the process in a calmer, more useful way so families can move forward
            without second-guessing the next step.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/admission"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f3f99] px-7 py-3.5 text-sm font-black text-white shadow-md transition-all duration-300 hover:bg-[#0b1d3a] hover:shadow-lg hover:-translate-y-0.5"
            >
              <span>Open Admission Page</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>

            <Link
              to="/gallery"
              className="group inline-flex items-center gap-3 rounded-xl border-2 border-[#1d7ff2]/30 bg-white px-6 py-3 text-sm font-black text-slate-800 shadow-sm transition-all duration-300 hover:border-[#1d7ff2] hover:bg-[#eaf4ff] hover:text-[#0f3f99] hover:shadow-md hover:-translate-y-0.5"
            >
              <span>View Campus Gallery</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eaf4ff] text-[#1d7ff2] transition-all duration-300 group-hover:bg-[#1d7ff2] group-hover:text-white group-hover:translate-x-1 shadow-xs">
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </span>
            </Link>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  )
}

export default About
