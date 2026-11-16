import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import SEO from '../../Components/SEO/SEO'
import { buildSchoolJsonLd, SCHOOL_KEYWORDS } from '../../seo/siteSeo'
import { listPublicGalleryImages } from '../../Api/megaImages'
import { galleryRows, schoolProfile, siteMedia } from './siteContent'
import { campusPhotos } from '../../assets/websiteImages'
import {
  DraggableCardBody,
  DraggableCardContainer,
} from '@/Components/ui/draggable-card'

function Galary() {
  const [bestMomentItems, setBestMomentItems] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [touchStartX, setTouchStartX] = useState(null)

  useEffect(() => {
    let mounted = true

    const loadBestMoments = async () => {
      try {
        const response = await listPublicGalleryImages()
        const files = response?.files || response?.images || []
        if (mounted) setBestMomentItems(Array.isArray(files) ? files : [])
      } catch {
        if (mounted) setBestMomentItems([])
      }
    }

    loadBestMoments()
    return () => {
      mounted = false
    }
  }, [])

  const bestMoments = useMemo(
    () =>
      bestMomentItems
        .filter((item) => item?.url)
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [bestMomentItems]
  )

  // Curated interactive draggable card showcase items
  const draggableItems = [
    {
      title: 'Morning Assembly',
      tag: 'Discipline & Routines',
      image: campusPhotos[0]?.src || siteMedia.galleryFeature[0],
      className: 'absolute top-4 left-[2%] sm:left-[5%] lg:left-[8%] rotate-[-4deg]',
    },
    {
      title: 'Classroom Session',
      tag: 'Interactive Learning',
      image: campusPhotos[1]?.src || siteMedia.homeSupport,
      className: 'absolute top-28 left-[6%] sm:left-[15%] lg:left-[22%] rotate-[5deg]',
    },
    {
      title: 'Campus Life',
      tag: 'Open Surroundings',
      image: campusPhotos[3]?.src || siteMedia.galleryFeature[1],
      className: 'absolute top-2 left-[18%] sm:left-[28%] lg:left-[38%] rotate-[-3deg]',
    },
    {
      title: 'Student Activities',
      tag: 'Creative Growth',
      image: campusPhotos[2]?.src || siteMedia.galleryFeature[2],
      className: 'absolute top-36 left-[26%] sm:left-[42%] lg:left-[50%] rotate-[6deg]',
    },
    {
      title: 'Cultural Stage',
      tag: 'Confidence & Expression',
      image: campusPhotos[16]?.src || siteMedia.homeCulture,
      className: 'absolute top-6 right-[4%] sm:right-[16%] lg:right-[22%] rotate-[-5deg]',
    },
    {
      title: 'Sports & Routines',
      tag: 'Fitness & Teamwork',
      image: campusPhotos[22]?.src || siteMedia.admissionHero,
      className: 'absolute top-30 right-[2%] sm:right-[5%] lg:right-[8%] rotate-[4deg]',
    },
    {
      title: 'Learning Moments',
      tag: 'Curiosity & Focus',
      image: campusPhotos[5]?.src || siteMedia.galleryFeature[0],
      className: 'absolute top-16 left-[10%] sm:left-[22%] lg:left-[32%] rotate-[2deg]',
    },
  ]

  // Combine ALL photos into a single collection for the 5-column grid
  const allGalleryPhotos = useMemo(() => {
    const list = []
    const seen = new Set()

    // 1. Dynamic API Uploads
    bestMoments.forEach((item, idx) => {
      if (item?.url && !seen.has(item.url)) {
        seen.add(item.url)
        list.push({
          id: item.public_id || `api-${idx}`,
          src: item.url,
          title: item.title || `Live Moment ${idx + 1}`,
          category: 'Live Moments',
          note: item.note || 'Recently captured campus moment at Star Public School.',
        })
      }
    })

    // 2. Curated rows from siteContent
    galleryRows.forEach((row) => {
      row.photos?.forEach((photo, pIdx) => {
        if (photo?.src && !seen.has(photo.src)) {
          seen.add(photo.src)
          list.push({
            id: `${row.title}-${pIdx}`,
            src: photo.src,
            title: photo.title,
            category: row.title,
            note: photo.note,
          })
        }
      })
    })

    // 3. All remaining campusPhotos
    campusPhotos.forEach((photo) => {
      if (photo?.src && !seen.has(photo.src)) {
        seen.add(photo.src)
        list.push({
          id: photo.id,
          src: photo.src,
          title: photo.title,
          category: 'Campus Life',
          note: `${photo.title} at Star Public School, Harinagar.`,
        })
      }
    })

    return list
  }, [bestMoments])

  // Category filter list
  const categories = useMemo(() => {
    const cats = ['All']
    allGalleryPhotos.forEach((p) => {
      if (p.category && !cats.includes(p.category)) {
        cats.push(p.category)
      }
    })
    return cats
  }, [allGalleryPhotos])

  const filteredPhotos = useMemo(() => {
    if (activeCategory === 'All') return allGalleryPhotos
    return allGalleryPhotos.filter((p) => p.category === activeCategory)
  }, [allGalleryPhotos, activeCategory])

  const currentPhoto =
    selectedIndex !== null && filteredPhotos[selectedIndex]
      ? filteredPhotos[selectedIndex]
      : null

  // Navigation handlers
  const handlePrev = (e) => {
    if (e) e.stopPropagation()
    if (selectedIndex === null || !filteredPhotos.length) return
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredPhotos.length - 1))
  }

  const handleNext = (e) => {
    if (e) e.stopPropagation()
    if (selectedIndex === null || !filteredPhotos.length) return
    setSelectedIndex((prev) => (prev < filteredPhotos.length - 1 ? prev + 1 : 0))
  }

  // Keyboard navigation (Escape to close, ArrowLeft for Prev, ArrowRight for Next) & Body scroll lock
  useEffect(() => {
    if (selectedIndex === null) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedIndex(null)
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredPhotos.length - 1))
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev < filteredPhotos.length - 1 ? prev + 1 : 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedIndex, filteredPhotos.length])

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      setTouchStartX(e.touches[0].clientX)
    }
  }

  const handleTouchEnd = (e) => {
    if (touchStartX === null || !e.changedTouches || !e.changedTouches[0]) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX - touchEndX
    if (diff > 45) {
      handleNext()
    } else if (diff < -45) {
      handlePrev()
    }
    setTouchStartX(null)
  }

  return (
    <WebsiteLayout>
      <SEO
        title="School Gallery Meghwal Mathia"
        description="Browse the Star Public School gallery in Meghwal Mathia, Ramnagar, West Champaran and see academics, events and campus life."
        keywords={SCHOOL_KEYWORDS}
        canonicalPath="/gallery"
        jsonLd={buildSchoolJsonLd({ path: '/gallery' })}
      />

      {/* TOP SECTION: Aceternity UI Draggable Canvas (No card container, no buttons, no horizontal scroll) */}
      <section className="gps-site-section pt-4 sm:pt-6 overflow-x-hidden">
        <div className="gps-site-shell max-w-full overflow-x-hidden">
          {/* Header */}
          <div className="mx-auto max-w-3xl text-center px-2">
            <span className="gps-site-label inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">photo_library</span>
              Interactive Campus Gallery
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-slate-950 leading-tight">
              Collage of Everyday School Life
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Drag, toss and explore real campus moments at {schoolProfile.name}. From vibrant morning assemblies and classroom discussions to sports and cultural programs.
            </p>
            <div className="mt-3.5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-xs font-bold text-[#1d7ff2]">
              <span className="material-symbols-outlined text-base animate-pulse">pan_tool_alt</span>
              <span>Drag &amp; move the photo cards freely</span>
            </div>
          </div>

          {/* Draggable Card Canvas (Strictly contained, no mobile overflow) */}
          <div className="mt-8 overflow-hidden rounded-3xl max-w-full">
            <DraggableCardContainer className="relative h-[440px] sm:h-[560px] lg:h-[640px] w-full max-w-full rounded-3xl border-2 border-sky-100 bg-gradient-to-b from-[#f0f7ff]/80 via-[#f8fafc] to-[#eaf4ff]/60 overflow-hidden shadow-inner select-none">
              {/* Background Watermark Message */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#1d7ff2] shadow-sm mb-3">
                  <span className="material-symbols-outlined text-sm">stars</span>
                  {schoolProfile.name}
                </div>
                <p className="max-w-md font-serif text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-300/80 leading-snug">
                  Every Day at Star Public School is a Story in Motion.
                </p>
                <p className="mt-3 text-xs sm:text-sm font-semibold text-slate-400">
                  Harinagar, Ramnagar, West Champaran
                </p>
              </div>

              {/* Draggable Photo Cards */}
              {draggableItems.map((item) => (
                <DraggableCardBody key={item.title} className={item.className}>
                  <div className="overflow-hidden rounded-xl bg-slate-100 border border-slate-200/60 shadow-inner">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="pointer-events-none h-32 w-28 sm:h-52 sm:w-44 lg:h-60 lg:w-52 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="mt-2 px-1 text-center">
                    <h3 className="font-serif text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#1d7ff2] truncate">
                      {item.tag}
                    </p>
                  </div>
                </DraggableCardBody>
              ))}
            </DraggableCardContainer>
          </div>
        </div>
      </section>

      {/* ALL PHOTOS - RESPONSIVE 5-COLUMN GRID (Replaces old card rows & story card, NO horizontal scroll) */}
      <section className="gps-site-section pt-4 sm:pt-8 pb-16 overflow-x-hidden">
        <div className="gps-site-shell max-w-full overflow-x-hidden">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="gps-site-label inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">grid_view</span>
                Campus Life Gallery
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-serif font-black text-slate-950">
                All Campus Photos ({filteredPhotos.length})
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Explore real classroom moments, cultural programs, sports activities and campus life at {schoolProfile.name}.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat)
                    setSelectedIndex(null)
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#1d7ff2] text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 5-Column Responsive Gallery Grid (Exact 5 photos per row on desktop) */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-4.5">
            {filteredPhotos.map((photo, index) => (
              <article
                key={photo.id || `${photo.src}-${index}`}
                onClick={() => setSelectedIndex(index)}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-sky-100 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#1d7ff2] hover:shadow-lg"
              >
                {/* Photo Frame (Aspect 4/3, Balanced, Non-Oversized) */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <img
                    src={photo.src}
                    alt={photo.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Hover Overlay with view icon */}
                  <div className="absolute inset-0 bg-[#0b1d3a]/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#1d7ff2] shadow-md backdrop-blur-xs">
                      <span className="material-symbols-outlined text-lg">zoom_in</span>
                    </span>
                  </div>
                </div>

                {/* Compact Info Strip */}
                <div className="p-2.5 sm:p-3 bg-white">
                  <h3 className="truncate font-serif text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#1d7ff2] transition-colors">
                    {photo.title}
                  </h3>
                  <p className="mt-0.5 truncate text-[10px] sm:text-[11px] font-semibold text-[#1d7ff2]">
                    {photo.category}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* LIGHTBOX MODAL - Rendered directly into document.body via Portal */}
      {currentPhoto && typeof document !== 'undefined'
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/85 p-3 sm:p-6 md:p-8 backdrop-blur-md transition-all duration-300 overflow-y-auto"
              onClick={() => setSelectedIndex(null)}
            >
              {/* EXACTLY 1 CLOSE BUTTON (Screen Top-Right Prominent Floating Button) */}
              <button
                type="button"
                onClick={() => setSelectedIndex(null)}
                className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[1000000] flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-900 shadow-2xl ring-1 ring-slate-900/15 transition-all duration-200 hover:bg-rose-600 hover:text-white hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Close photo preview"
                title="Close (Esc)"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-bold">Close</span>
              </button>

              {/* LEFT / PREVIOUS PHOTO BUTTON */}
              {filteredPhotos.length > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="fixed left-2 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 z-[1000000] flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-2xl ring-1 ring-slate-900/10 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-[#1d7ff2] hover:text-white active:scale-95 cursor-pointer"
                  aria-label="Previous photo"
                  title="Previous (Left Arrow key)"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              ) : null}

              {/* RIGHT / NEXT PHOTO BUTTON */}
              {filteredPhotos.length > 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="fixed right-2 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 z-[1000000] flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-2xl ring-1 ring-slate-900/10 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-[#1d7ff2] hover:text-white active:scale-95 cursor-pointer"
                  aria-label="Next photo"
                  title="Next (Right Arrow key)"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : null}

              {/* Modal Card - Perfectly Centered in Screen, Safe Distance from Header and Screen Edges */}
              <div
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="relative my-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl ring-1 ring-white/20 transition-all duration-300 select-none"
                style={{ maxHeight: 'min(82vh, 700px)' }}
              >
                {/* Photo Display with Balanced Constrained Height */}
                <div className="relative flex items-center justify-center bg-slate-950 overflow-hidden max-h-[48vh] sm:max-h-[56vh]">
                  <img
                    key={currentPhoto.src}
                    src={currentPhoto.src}
                    alt={currentPhoto.title}
                    className="max-h-[48vh] sm:max-h-[56vh] w-auto max-w-full object-contain mx-auto select-none transition-opacity duration-200"
                  />
                </div>

                {/* Photo Caption & Category */}
                <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-serif text-base sm:text-xl font-bold text-slate-950 truncate">
                      {currentPhoto.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {currentPhoto.category ? (
                        <span className="rounded-full bg-sky-50 border border-sky-200 px-3 py-0.5 text-xs font-bold text-[#1d7ff2]">
                          {currentPhoto.category}
                        </span>
                      ) : null}
                      <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                        {selectedIndex + 1} / {filteredPhotos.length}
                      </span>
                    </div>
                  </div>
                  {currentPhoto.note ? (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {currentPhoto.note}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </WebsiteLayout>
  )
}

export default Galary
