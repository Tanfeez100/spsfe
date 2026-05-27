import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import SEO from '../../Components/SEO/SEO'
import { buildSchoolJsonLd, SCHOOL_KEYWORDS } from '../../seo/siteSeo'
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
  { value: '10+', label: 'Years of local trust' },
  { value: '1:25', label: 'Teacher student ratio' },
  { value: '20+', label: 'Teaching and support staff' },
  { value: '500+', label: 'Students guided' },
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

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)

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
        title="Best School in Harinagar Ramnagar West Champaran"
        description="Star Public School is a trusted school in Harinagar, Ramnagar, West Champaran with disciplined learning, parent communication, admissions support, activities and secure result access."
        keywords={SCHOOL_KEYWORDS}
        canonicalPath="/"
        jsonLd={buildSchoolJsonLd({ path: '/' })}
      />

      <section className="relative min-h-[calc(100vh-138px)] overflow-hidden bg-[#0b1d3a]">
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
            <p className="inline-flex border border-[#1d7ff2]/60 bg-[#1d7ff2] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ffffff]">
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
                <div key={stat.label} className="border-l-4 border-[#1d7ff2] bg-white/12 px-4 py-3 backdrop-blur">
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
          className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/40 bg-white/15 text-white backdrop-blur transition hover:bg-[#1d7ff2] hover:text-[#ffffff] md:inline-flex"
          aria-label="Previous slide"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % homeHeroSlides.length)}
          className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/40 bg-white/15 text-white backdrop-blur transition hover:bg-[#1d7ff2] hover:text-[#ffffff] md:inline-flex"
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
              className={`h-3 w-9 transition ${index === currentSlide ? 'bg-[#1d7ff2]' : 'bg-white/55'}`}
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
              <article key={card.title} className="rounded-lg border border-[#bfdbfe] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <span className="material-symbols-outlined text-3xl text-[#1d7ff2]">{card.icon}</span>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[#1d5fb8]">{card.subtitle}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eaf4ff] py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div className="overflow-hidden rounded-lg bg-slate-200">
            <img
              src={siteMedia.homeCulture}
              alt="School leadership and student confidence"
              className="h-full min-h-[360px] w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="flex items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d5fb8]">Our Leadership</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">
                Strong values, true trust, real success
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-700">
                Success is not a one-time event. It is the result of consistent effort, disciplined habits and the
                courage to keep improving. At GPS, we work to create a learning environment where young minds can
                flourish academically, emotionally and ethically.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/about" className="gps-site-button">
                  Read More
                </Link>
                <a href={schoolProfile.whatsappHref} className="gps-site-button-secondary">
                  WhatsApp School
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f6faff] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {trustStats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white">
                <p className="text-4xl font-black text-amber-300">{stat.value}</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-200">{stat.label}</p>
              </div>
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
              <article key={moment.title} className="group overflow-hidden border border-white/15 bg-white/5">
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
            <Link to="/gallery" className="gps-site-button-secondary">
              View Gallery
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

      <section className="bg-[#eaf4ff] py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d5fb8]">Visit GPS</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">Find us and request a callback</h2>
            <div className="mt-6 overflow-hidden rounded-lg border border-slate-300 bg-white">
              <iframe
                title={`${schoolProfile.name} location`}
                src={mapUrl}
                className="h-[360px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-3xl font-black text-slate-950">Request a Callback</h3>
            <form className="mt-6 space-y-4">
              <input className="gps-site-input" placeholder="Student Name*" />
              <select className="gps-site-input" defaultValue="">
                <option value="" disabled>
                  Select Class
                </option>
                <option>Nursery to UKG</option>
                <option>Class 1 to 5</option>
                <option>Class 6 to 8</option>
                <option>Class 9 and above</option>
              </select>
              <input className="gps-site-input" placeholder="Phone No.*" inputMode="tel" />
              <button type="button" className="gps-site-button w-full justify-center">
                Submit
              </button>
            </form>
            <div className="my-6 flex items-center gap-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200"></span>
              OR
              <span className="h-px flex-1 bg-slate-200"></span>
            </div>
            <a href={schoolProfile.phoneHref} className="flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-4 font-black text-white">
              <span className="material-symbols-outlined">call</span>
              {schoolProfile.phone}
            </a>
            <p className="mt-5 text-sm leading-6 text-slate-600">{schoolProfile.address}</p>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  )
}

export default Home
