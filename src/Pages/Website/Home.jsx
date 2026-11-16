import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import ThemeSelect from '../../Components/Website/ThemeSelect'
import SEO from '../../Components/SEO/SEO'
import { buildSchoolJsonLd, SCHOOL_KEYWORDS } from '../../seo/siteSeo'
import { campusPhotos } from '../../assets/websiteImages'
import { scrollToPageTop } from '../../utils/scrollToPageTop'
import {
  homeHeroSlides,
  schoolProfile,
  siteMedia,
} from './siteContent'

const featureCards = [
  {
    icon: 'eco',
    title: 'Eco-Friendly Campus',
    subtitle: 'Clean, open surroundings',
    text: 'A calm campus atmosphere where students can learn with focus, discipline and fresh energy.',
  },
  {
    icon: 'computer',
    title: 'Digital Learning',
    subtitle: 'Future-ready classroom support',
    text: 'Modern learning habits, result access and school systems make the student journey clearer for families.',
  },
  {
    icon: 'groups',
    title: 'Parent Connect',
    subtitle: 'Regular guidance and updates',
    text: 'Parents stay close to the child’s progress through approachable communication and practical follow-up.',
  },
  {
    icon: 'celebration',
    title: 'Cultural Activities',
    subtitle: 'Stage, confidence and expression',
    text: 'Events, assemblies and participation help children become expressive, confident and socially aware.',
  },
  {
    icon: 'school',
    title: 'Academic Focus',
    subtitle: 'Strong fundamentals',
    text: 'Daily classroom rhythm, revision and teacher attention help students build steady academic confidence.',
  },
  {
    icon: 'health_and_safety',
    title: 'Safe Premises',
    subtitle: 'Disciplined school routine',
    text: 'Order, punctuality and respectful conduct create an environment where students feel secure and guided.',
  },
  {
    icon: 'sports_soccer',
    title: 'Sports Training',
    subtitle: 'Fitness with teamwork',
    text: 'Physical activity encourages discipline, stamina, healthy competition and positive student energy.',
  },
  {
    icon: 'person_raised_hand',
    title: 'Dedicated Teachers',
    subtitle: 'Personal attention',
    text: 'Teachers support children with patience, consistency and care so learning feels less overwhelming.',
  },
]

const trustStats = [
  {
    numericValue: 10,
    prefix: '',
    suffix: '+',
    value: '10+',
    label: 'Years of Local Trust',
    icon: 'workspace_premium',
  },
  {
    numericValue: 25,
    prefix: '1:',
    suffix: '',
    value: '1:25',
    label: 'Teacher Student Ratio',
    icon: 'co_present',
  },
  {
    numericValue: 20,
    prefix: '',
    suffix: '+',
    value: '20+',
    label: 'Teaching and Support Staff',
    icon: 'groups',
  },
  {
    numericValue: 500,
    prefix: '',
    suffix: '+',
    value: '500+',
    label: 'Students Guided',
    icon: 'school',
  },
]

const prideMoments = [
  {
    title: 'Motivating students to dream bigger',
    image: homeHeroSlides[1].src,
  },
  {
    title: 'Learning through teamwork and participation',
    image: homeHeroSlides[2].src,
  },
  {
    title: 'Celebrating discipline, talent and school pride',
    image: homeHeroSlides[0].src,
  },
]

const facilities = [
  {
    title: 'Computer Lab',
    text: 'Where curiosity meets technology and students build practical confidence.',
    image: homeHeroSlides[1].src,
  },
  {
    title: 'Activity Space',
    text: 'Creative school moments where every child gets room to participate.',
    image: homeHeroSlides[3].src,
  },
  {
    title: 'Cultural Stage',
    text: 'A place for confidence, communication and expressive learning.',
    image: homeHeroSlides[0].src,
  },
  {
    title: 'Sports & Discipline',
    text: 'Fitness, teamwork and routine become part of everyday growth.',
    image: siteMedia.homeSupport,
  },
]

function StatCard({ stat, isVisible }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    let startTime = null
    const duration = 1800
    let animationFrameId

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easeProgress * stat.numericValue))

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      } else {
        setCount(stat.numericValue)
      }
    }

    animationFrameId = requestAnimationFrame(step)
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [isVisible, stat.numericValue])

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-sky-200 hover:shadow-md sm:p-6">
      {/* Decorative corner swoosh */}
      <svg
        className="pointer-events-none absolute -bottom-1 -right-1 h-14 w-16 select-none transition-transform duration-300 group-hover:scale-105"
        viewBox="0 0 64 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 56 C22 54 44 40 64 14 L64 56 Z"
          fill="#38bdf8"
          fillOpacity="0.3"
        />
        <path
          d="M10 56 C28 55 46 45 64 24 L64 56 Z"
          fill="url(#stat-card-wave)"
        />
      </svg>

      <div className="relative flex items-center gap-4">
        {/* Left: Soft rounded icon box */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-[#eaf4ff] text-[#1d7ff2] shadow-sm transition-transform duration-300 group-hover:scale-105">
          <span className="material-symbols-outlined text-3xl">{stat.icon}</span>
        </div>

        {/* Right: Counter value and label */}
        <div className="min-w-0 flex-1">
          <p className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl leading-none">
            {stat.prefix}{isVisible ? count : stat.numericValue}{stat.suffix}
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-600 sm:text-sm leading-snug">
            {stat.label}
          </p>
        </div>
      </div>
    </div>
  )
}

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [callbackClass, setCallbackClass] = useState('')
  const achievementsRef = useRef(null)
  const [statsVisible, setStatsVisible] = useState(false)

  useEffect(() => {
    const currentElem = achievementsRef.current
    if (!currentElem) return

    if (typeof IntersectionObserver === 'undefined') {
      setStatsVisible(true)
      return
    }

    const scrollContainer = document.getElementById('website-scroll-container')

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setStatsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      {
        root: scrollContainer || null,
        threshold: 0.15,
      }
    )

    observer.observe(currentElem)

    return () => {
      if (currentElem) observer.unobserve(currentElem)
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % homeHeroSlides.length)
    }, 4200)

    return () => window.clearInterval(interval)
  }, [])

  const mapUrl = useMemo(() => {
    const query = encodeURIComponent(schoolProfile.address)
    return `https://www.google.com/maps?q=${query}&output=embed`
  }, [])

  return (
    <WebsiteLayout>
      <SEO
        title="Best School in Meghwal Mathia Ramnagar West Champaran"
        description="Star Public School in Meghwal Mathia, Ramnagar, West Champaran offers disciplined learning, admissions support, parent communication, activities, online fee payment and secure result access."
        keywords={SCHOOL_KEYWORDS}
        canonicalPath="/"
        jsonLd={buildSchoolJsonLd({ path: '/' })}
      />

      <section className="relative -mt-1 min-h-[calc(100vh-138px)] overflow-hidden bg-[#0b1d3a]">
        <div className="absolute inset-0">
          <div
            className="flex h-full transition-transform duration-[1100ms] ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {homeHeroSlides.map((slide, index) => (
              <img
                key={slide.src}
                src={slide.src}
                alt={slide.title}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={index === 0 ? 'high' : 'auto'}
                className="h-full min-w-full object-cover"
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,61,35,0.94),rgba(18,61,35,0.65),rgba(18,61,35,0.22))]"></div>
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-138px)] max-w-7xl items-center px-4 py-12 text-white sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <p className="inline-flex border rounded-md border-[#1d7ff2]/60 bg-[#1d7ff2] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ffffff]">
              Harinagar | Ramnagar | West Champaran
            </p>
            <h1 className="mt-5 max-w-5xl text-4xl font-black leading-[1.03] sm:text-6xl lg:text-7xl">
              Best School in Harinagar for a bright future
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-100 sm:text-lg">
              {schoolProfile.name} focuses on smart learning, disciplined routines and confident participation,
              because thinking matters more than memorizing.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a href={schoolProfile.phoneHref} className="gps-site-button">
                <span className="material-symbols-outlined text-base">call</span>
                Call Now {schoolProfile.phone}
              </a>
              <Link to="/admission" className="gps-site-button-secondary">
                <span className="material-symbols-outlined text-base">assignment</span>
                Admission Enquiry
              </Link>
            </div>

            <div className="mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {trustStats.map((stat) => (
                <div key={stat.label} className="border-l-4 rounded-md border-[#1d7ff2] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-2xl font-black text-[#f9cf54]">{stat.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-200">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev - 1 + homeHeroSlides.length) % homeHeroSlides.length)}
          className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border rounded-md border-white/40 bg-white/15 text-white backdrop-blur transition hover:bg-[#1d7ff2] hover:text-[#ffffff] md:inline-flex"
          aria-label="Previous slide"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % homeHeroSlides.length)}
          className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border rounded-md border-white/40 bg-white/15 text-white backdrop-blur transition hover:bg-[#1d7ff2] hover:text-[#ffffff] md:inline-flex"
          aria-label="Next slide"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>

        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {homeHeroSlides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setCurrentSlide(index)}
              className={`h-3 w-9 rounded-md transition ${index === currentSlide ? 'bg-[#1d7ff2]' : 'bg-white/55'}`}
              aria-label={`Show ${slide.label}`}
            />
          ))}
        </div>
      </section>

      <section className="bg-[#f6faff] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d5fb8]">Why choose GPS</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">
              What makes us the right school for a bright future
            </h2>
            <p className="mt-4 text-slate-600">
              Families choose a school when academics, safety, communication, values and exposure work together.
              GPS keeps that complete growth visible in daily school life.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((card) => (
              <article
                key={card.title}
                className="group relative overflow-hidden rounded-lg border border-[#bfdbfe] bg-white p-5 shadow-sm transition-colors duration-300 hover:border-[#60a5fa]"
              >
                {/* Water wave ripple effect overlay on hover */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  {/* Subtle water tint */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1d7ff2]/12 via-[#38bdf8]/5 to-transparent opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100" />

                  {/* Water wave crest 1 */}
                  <div className="absolute -inset-x-6 -bottom-14 h-40 opacity-0 transition-all duration-700 ease-out group-hover:-translate-y-28 group-hover:opacity-100">
                    <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
                      <path
                        d="M0.00,49.98 C149.99,140.00 349.81,-20.00 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
                        fill="rgba(29, 127, 242, 0.12)"
                      />
                    </svg>
                  </div>

                  {/* Water wave crest 2 */}
                  <div className="absolute -inset-x-8 -bottom-16 h-44 opacity-0 transition-all duration-1000 ease-out group-hover:-translate-y-36 group-hover:opacity-100">
                    <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
                      <path
                        d="M0.00,60.00 C180.00,130.00 300.00,-10.00 500.00,60.00 L500.00,150.00 L0.00,150.00 Z"
                        fill="rgba(56, 189, 248, 0.10)"
                      />
                    </svg>
                  </div>

                  {/* Gentle water ripple shimmer sweep */}
                  <div className="absolute -inset-full top-0 block -translate-x-full transform bg-gradient-to-r from-transparent via-sky-300/20 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:translate-x-full group-hover:opacity-100" />
                </div>

                <div className="relative z-10">
                  <span className="material-symbols-outlined text-3xl text-[#1d7ff2]">{card.icon}</span>
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[#1d5fb8]">{card.subtitle}</p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#f0f7ff] via-[#f8fbff] to-[#eaf4ff] py-16 lg:py-20">

          <svg
          className="pointer-events-none absolute -top-1 left-0 w-64 sm:w-80 lg:w-[440px] h-auto select-none"
          viewBox="0 0 400 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M400 0 C280 15 160 70 0 120 L0 0 Z"
            fill="#38bdf8"
            fillOpacity="0.25"
          />
          <path
            d="M350 0 C230 5 130 45 0 85 L0 0 Z"
            fill="url(#achievements-top-wave)"
          />
          <defs>
            <linearGradient id="achievements-top-wave" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0b1d3a" />
              <stop offset="100%" stopColor="#1d5fb8" />
            </linearGradient>
          </defs>
        </svg>
        {/* Top-right subtle laurel wreath with book watermark */}
        {/* <div className="pointer-events-none absolute -right-6 -top-6 hidden opacity-20 text-[#1d7ff2] sm:block">
          <svg className="h-44 w-44" viewBox="0 0 120 120" fill="currentColor">
            <path d="M50 102c-8-2-16-6-22-12-8-8-13-19-14-30 0-8 2-16 6-23 2-4 5-8 8-11l2 3c-4 5-7 11-8 17-2 10 2 20 8 28 5 6 12 11 20 13l-2 5z" />
            <path d="M38 23c-4 1-8 4-11 7 4 1 8 0 11-2l3-3-3-2zM30 36c-4 2-8 6-10 10 4 0 8-2 10-5l2-3-2-2zM25 52c-4 3-7 8-8 13 4 0 8-3 10-7l1-3-3-3zM25 69c-3 4-5 9-5 14 4-1 8-5 9-9l1-3-5-2zM29 85c-2 4-3 9-2 14 4-2 7-6 8-11l-1-4-5 1z" />
            <path d="M70 102c8-2 16-6 22-12 8-8 13-19 14-30 0-8-2-16-6-23-2-4-5-8-8-11l-2 3c4 5 7 11 8 17 2 10-2 20-8 28-5 6-12 11-20 13l2 5z" />
            <path d="M82 23c4 1 8 4 11 7-4 1-8 0-11-2l-3-3 3-2zM90 36c4 2 8 6 10 10-4 0-8-2-10-5l-2-3 2-2zM95 52c4 3 7 8 8 13-4 0-8-3-10-7l-1-3 3-3zM95 69c3 4 5 9 5 14-4-1-8-5-9-9l-1-3 5-2zM91 85c2 4 3 9 2 14-4-2-7-6-8-11l1-4 5 1z" />
            <path d="M60 48c-3-3-7-5-12-5-5 0-10 2-14 5v26c4-3 9-5 14-5 5 0 9 2 12 5V48zM60 48c3-3 7-5 12-5 5 0 10 2 14 5v26c-4-3-9-5-14-5-5 0-9 2-12 5V48z" />
          </svg>
        </div> */}

        {/* Bottom-right dynamic layered wave swoosh matching school theme */}
        <svg
          className="pointer-events-none absolute -bottom-1 right-0 w-64 sm:w-80 lg:w-[440px] h-auto select-none"
          viewBox="0 0 400 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 140 C120 125 240 70 400 20 L400 140 Z"
            fill="#38bdf8"
            fillOpacity="0.25"
          />
          <path
            d="M50 140 C170 135 270 95 400 55 L400 140 Z"
            fill="url(#leadership-wave)"
          />
          <defs>
            <linearGradient id="leadership-wave" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1d5fb8" />
              <stop offset="100%" stopColor="#0b1d3a" />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            {/* Left: Framed Photo with Curved Outer Accent & Floating Badge */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="rounded-[2.4rem] border-2 border-[#1d7ff2]/30 bg-gradient-to-br from-[#1d7ff2]/10 via-transparent to-sky-100/40 p-2 sm:p-2.5 shadow-sm">
                <div className="relative overflow-hidden rounded-[2rem] bg-slate-100 shadow-xl">
                  <img
                    src={siteMedia.homeCulture}
                    alt="School leadership and student confidence"
                    className="h-[360px] sm:h-[430px] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />

                  {/* Floating badge inside photo */}
                  {/* <div className="absolute bottom-4 left-4 right-4 sm:right-auto flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f3f99] to-[#1d7ff2] text-white shadow-sm">
                      <span className="material-symbols-outlined text-xl">school</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 leading-tight">Our Students</p>
                      <p className="text-[11px] font-semibold text-slate-500 leading-tight truncate">
                        Learners • Leaders • Responsible Citizens
                      </p>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>

            {/* Right: Leadership Content */}
            <div className="flex items-center">
              <div>
                {/* Pill Badge */}
                {/* <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eaf4ff] px-3.5 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#1d5fb8]">
                  <span className="material-symbols-outlined text-sm text-[#1d7ff2]">school</span>
                  <span>Our Leadership</span>
                </div> */}

                

                {/* Heading with organic underline accent */}
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl leading-[1.15]">
                  Strong values, true trust, <br className="hidden sm:inline" />
                  <span className="relative inline-block text-[#1d7ff2]">
                    real success
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

                {/* Paragraph */}
                <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600">
                  Success is not a one-time event. It is the result of consistent effort, disciplined habits and the
                  courage to keep improving. At GPS, we work to create a learning environment where young minds can
                  flourish academically, emotionally and ethically.
                </p>

                {/* 4 Feature Pills */}
                {/* <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { icon: 'menu_book', title: 'Quality', subtitle: 'Education' },
                    { icon: 'groups', title: 'Discipline &', subtitle: 'Values' },
                    { icon: 'spa', title: 'Holistic', subtitle: 'Development' },
                    { icon: 'emoji_events', title: 'Bright', subtitle: 'Future' },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center gap-2.5 rounded-xl border border-sky-200/70 bg-white/80 p-2.5 shadow-sm backdrop-blur-sm transition hover:bg-sky-50/80 hover:border-sky-300"
                    >
                      <span className="material-symbols-outlined text-2xl text-[#1d7ff2] shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 leading-tight">{item.title}</p>
                        <p className="text-[11px] font-bold text-slate-600 leading-tight">{item.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div> */}

                {/* Action Buttons */}
                <div className="mt-8 flex flex-wrap items-center gap-3.5">
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0f3f99] px-6 py-3 text-sm font-black text-white shadow-md transition-all hover:bg-[#0b1d3a] hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <span>Read More</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>

                  {/* <a
                    href={schoolProfile.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 rounded-xl border-2 border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:bg-emerald-50/60 hover:border-[#25D366] hover:-translate-y-0.5"
                  >
                    <svg className="h-5 w-5 fill-[#25D366]" viewBox="0 0 24 24">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm0 18.15c-1.52 0-3.01-.41-4.31-1.18l-.31-.18-3.2.84.85-3.12-.2-.32a8.19 8.19 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c.01 4.54-3.69 8.23-8.25 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.17 1.74 2.65 4.21 3.72.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z" />
                    </svg>
                    <span>WhatsApp School</span>
                  </a> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={achievementsRef}
        className="relative overflow-hidden bg-gradient-to-b from-[#f8fbff] via-[#f0f7ff] to-[#e8f3fe] py-16 lg:py-20"
      >
      
        
        {/* Global defs for stat card waves */}
        <svg className="absolute h-0 w-0" aria-hidden="true">
          <defs>
            <linearGradient id="stat-card-wave" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1d7ff2" />
              <stop offset="100%" stopColor="#0b1d3a" />
            </linearGradient>
          </defs>
        </svg>

        {/* Top-right subtle school building watermark */}
        {/* <div className="pointer-events-none absolute -right-6 -top-4 hidden opacity-15 text-[#1d7ff2] sm:block">
          <svg className="h-60 w-60" viewBox="0 0 120 120" fill="currentColor">
            <path d="M60 14 L18 38 L102 38 Z" />
            <rect x="54" y="6" width="12" height="9" rx="1.5" />
            <path d="M60 2 L55 6 L65 6 Z" />
            <rect x="25" y="42" width="8" height="50" rx="1.5" />
            <rect x="42" y="42" width="8" height="50" rx="1.5" />
            <rect x="70" y="42" width="8" height="50" rx="1.5" />
            <rect x="87" y="42" width="8" height="50" rx="1.5" />
            <path d="M54 58 a6 6 0 0 1 12 0 v34 h-12 z" />
            <rect x="14" y="92" width="92" height="6" rx="1.5" />
            <rect x="10" y="98" width="100" height="6" rx="1.5" />
          </svg>
        </div> */}

        {/* Ambient bottom curves */}
        {/* <svg
          className="pointer-events-none absolute -bottom-1 right-0 w-72 sm:w-96 lg:w-[480px] h-auto select-none opacity-40"
          viewBox="0 0 400 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 120 C140 110 260 60 400 10 L400 120 Z"
            fill="#38bdf8"
            fillOpacity="0.4"
          />
          <path
            d="M60 120 C180 115 280 80 400 45 L400 120 Z"
            fill="#1d7ff2"
            fillOpacity="0.6"
          />
        </svg> */}

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Centered Section Header */}
          <div className="mx-auto max-w-3xl text-center">
            {/* Pill badge with horizontal accent lines */}
            <div className="inline-flex items-center gap-3">
              <span className="h-0.5 w-8 sm:w-12 bg-sky-200" />
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-[#eef7ff] px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#0f3f99]">
                <span className="material-symbols-outlined text-base text-[#1d7ff2]">insights</span>
                <span>Our Achievements</span>
              </div>
              <span className="h-0.5 w-8 sm:w-12 bg-sky-200" />
            </div>

            {/* Heading with organic underline */}
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl leading-tight">
              A Legacy of Trust &{' '}
              <span className="relative inline-block text-[#1d7ff2]">
                Excellence
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

            {/* Subtitle */}
            <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Years of dedicated service in providing quality education and holistic development.
            </p>
          </div>

          {/* 4 Stat Cards */}
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trustStats.map((stat) => (
              <StatCard key={stat.label} stat={stat} isVisible={statsVisible} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0b1d3a] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d7ff2]">Moments of pride</p>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">
              Motivating the stars of tomorrow to dream big and achieve more
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {prideMoments.map((moment) => (
              <article key={moment.title} className="group overflow-hidden rounded-lg border border-white/15 bg-white/5">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={moment.image}
                    alt={moment.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h3 className="p-5 text-xl font-black">{moment.title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6faff] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d5fb8]">Beyond the books</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">
                Into the real world
              </h2>
              <p className="mt-4 text-slate-600">
                From classrooms to co-curricular activities, GPS supports a well-rounded education where children
                learn, participate, communicate and grow.
              </p>
            </div>
            <Link
              to="/gallery"
              className="group inline-flex items-center gap-3 self-start md:self-end rounded-xl border-2 border-[#1d7ff2]/30 bg-white px-5 py-2.5 text-sm font-black text-slate-800 shadow-sm transition-all duration-300 hover:border-[#1d7ff2] hover:bg-[#eaf4ff] hover:text-[#0f3f99] hover:shadow-md hover:-translate-y-0.5"
            >
              <span>View Gallery</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eaf4ff] text-[#1d7ff2] transition-all duration-300 group-hover:bg-[#1d7ff2] group-hover:text-white group-hover:translate-x-1 shadow-xs">
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </span>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {facilities.map((facility) => (
              <article key={facility.title} className="overflow-hidden rounded-lg border border-[#bfdbfe] bg-white shadow-sm">
                <img
                  src={facility.image}
                  alt={facility.title}
                  className="h-48 w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="p-5">
                  <h3 className="text-xl font-black text-slate-950">{facility.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{facility.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Scottish High Style Floating Admission Callout Section */}
      <section className="relative overflow-hidden bg-white pt-10 sm:pt-14 pb-14 sm:pb-20">
        {/* Seamless footer backdrop covering bottom half so card sits half on white and half on footer */}
        <div className="absolute inset-x-0 bottom-0 top-[45%] bg-[#0b1d3a]" />

        <div className="gps-site-shell relative z-10">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#071d3d] via-[#0d3475] to-[#154ea6] p-6 sm:p-8 lg:p-10 shadow-2xl shadow-slate-950/40 border border-white/15">
            {/* Subtle decorative glow */}
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Column: Framed Classroom / Student Activity Photo */}
              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-xl sm:rounded-2xl border-2 border-white/20 shadow-xl aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] bg-slate-900 group">
                  <img
                    src={campusPhotos[2]?.src || siteMedia.homeSupport}
                    alt="Students engaged in creative learning at Star Public School"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              {/* Right Column: Admission Title, Subtitle, Text & Apply Now Button */}
              <div className="lg:col-span-7 text-white">
                <h2 className="text-2xl sm:text-3xl lg:text-[2.1rem] font-serif font-black text-white leading-tight">
                  Admissions Open for 2026–27 and Registrations Open for 2027–28
                </h2>

                <p className="mt-3 text-sm sm:text-base font-bold text-sky-300">
                  Ready to Give Your Child the Star Advantage?
                </p>

                <p className="mt-3 text-xs sm:text-sm text-sky-100/90 leading-relaxed font-normal">
                  At {schoolProfile.name}, Harinagar, we inspire young minds through academic excellence,
                  innovation, and holistic learning. Our future-ready curriculum, experienced educators,
                  and world-class campus empower every child to learn with confidence, lead with purpose,
                  and excel in life. Book a Campus Visit or Register Your Enquiry today and discover an
                  education that shapes tomorrow's leaders. {schoolProfile.name} – Where Every Child
                  Learns, Leads &amp; Excels.
                </p>

                <div className="mt-6">
                  <Link
                    to="/admission"
                    onClick={scrollToPageTop}
                    className="inline-flex items-center justify-center rounded-md bg-white px-7 py-3 text-sm font-serif font-bold text-[#0b1d3a] shadow-md transition-all duration-300 hover:bg-sky-50 hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </WebsiteLayout>
  )
}

export default Home
