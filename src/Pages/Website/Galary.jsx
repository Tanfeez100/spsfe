import React from 'react'
import { Link } from 'react-router-dom'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import SEO from '../../Components/SEO/SEO'
import { buildSchoolJsonLd, SCHOOL_KEYWORDS } from '../../seo/siteSeo'
import { galleryRows, schoolProfile, siteMedia } from './siteContent'

function Galary() {
  const previewCards = [
    { src: siteMedia.galleryFeature[0], alt: 'School building exterior', title: 'Campus exterior' },
    { src: siteMedia.galleryFeature[1], alt: 'Open hall and learning space', title: 'Open learning space' },
    { src: siteMedia.galleryFeature[2], alt: 'Students gathered inside campus', title: 'Student presence' },
  ]

  const previewNotes = [
    'Uniform image sizing keeps the gallery cleaner across screen sizes.',
    'Horizontal scrolling works better than uneven collage gaps on mobile and desktop.',
    'The page now presents campus moments in a more controlled and readable rhythm.',
  ]

  return (
    <WebsiteLayout>
      <SEO
        title="School Gallery Meghwal Mathia"
        description="Browse the Star Public School gallery in Meghwal Mathia, Ramnagar, West Champaran and see academics, events and campus life."
        keywords={SCHOOL_KEYWORDS}
        canonicalPath="/gallery"
        jsonLd={buildSchoolJsonLd({ path: '/gallery' })}
      />
      <section className="gps-site-section pt-6">
        <div className="gps-site-shell">
          <div className="grid gap-5 xl:grid-cols-[0.84fr_1.16fr] xl:items-stretch">
            <article className="gps-site-panel min-w-0 p-6 sm:p-8 lg:p-10">
              <span className="gps-site-label">
                <span className="material-symbols-outlined text-sm">photo_library</span>
                Campus gallery
              </span>
              <h1 className="gps-site-heading mt-5 text-2xl sm:text-3xl">Scrollable collage of everyday school life</h1>
              <p className="gps-site-copy mt-5">
                Instead of scattering photos randomly across the site, the gallery now gathers them into cleaner visual
                bands. Each row is grouped like a small story so visitors can move through academics, activities and
                campus spaces with better context.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/admission" className="gps-site-button">
                  Visit admission page
                </Link>
                <Link to="/contact" className="gps-site-button-secondary">
                  Contact the school
                </Link>
              </div>
            </article>

            <article className="gps-site-panel-muted flex min-w-0 h-full flex-col p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Campus preview</p>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Swipe horizontally</p>
              </div>

              <div className="gps-site-scrollbar mt-4 w-full overflow-x-auto pb-3">
                <div className="flex min-w-max gap-4 pr-2">
                  {previewCards.map((card) => (
                  <article key={card.src} className="shrink-0">
                    <div className="gps-site-photo-frame h-[300px] w-[220px] sm:h-[340px] sm:w-[250px] lg:h-[360px] lg:w-[260px]">
                        <img src={card.src} alt={card.alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </div>
                      <p className="mt-3 text-sm font-semibold text-slate-700">{card.title}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {previewNotes.map((note) => (
                  <div key={note} className="rounded-[1.2rem] border border-slate-200/80 bg-white/78 p-4">
                    <p className="text-sm leading-relaxed text-slate-600">{note}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="gps-site-section pt-0">
        <div className="gps-site-shell space-y-8">
          {galleryRows.map((row, index) => (
            <article key={row.title} className="gps-site-panel min-w-0 p-5 sm:p-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <span className="gps-site-label">Gallery row 0{index + 1}</span>
                  <h2 className="mt-4 text-3xl font-extrabold text-slate-900">{row.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{row.description}</p>
                </div>
                <p className="text-sm font-semibold text-slate-500">{row.photos.length} curated frames</p>
              </div>

              <div className="gps-site-scrollbar mt-6 w-full overflow-x-auto pb-4">
                <div className="flex min-w-max items-stretch gap-4 pr-2">
                  {row.photos.map((photo) => (
                    <article
                      key={`${row.title}-${photo.title}`}
                      className="flex w-[220px] shrink-0 flex-col overflow-hidden rounded-[1.45rem] border border-slate-200/80 bg-white shadow-[0_18px_34px_rgba(15,23,42,0.08)] sm:w-[250px] lg:w-[260px]"
                    >
                      <img src={photo.src} alt={photo.title} loading="lazy" decoding="async" className="h-[280px] w-full object-cover sm:h-[300px] lg:h-[320px]" />
                      <div className="flex min-h-[120px] flex-col p-4">
                        <p className="line-clamp-2 text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">{photo.title}</p>
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{photo.note}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="gps-site-section pt-0">
        <div className="gps-site-shell">
          <div className="gps-site-panel p-7 text-center sm:p-10">
            <span className="gps-site-label">Campus story</span>
            <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">A school is best understood through the rhythm of its real days.</h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
              If these visuals match the kind of school environment you want for your child, the next meaningful step is
              to speak with <span className="font-semibold text-sm">{schoolProfile.name}</span> about admissions and campus guidance.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/admission" className="gps-site-button">
                Admission details
              </Link>
              <Link to="/contact" className="gps-site-button-secondary">
                Contact office
              </Link>
            </div>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  )
}

export default Galary
