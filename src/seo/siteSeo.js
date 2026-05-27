const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://gyanodaypublicschool.in').replace(/\/+$/, '')

export const SCHOOL_NAME = import.meta.env.VITE_SCHOOL_NAME || 'Star Public School'
export const SCHOOL_SHORT_NAME = 'Star Public School'
export const SCHOOL_PHONE = import.meta.env.VITE_SCHOOL_PHONE || '+91 9006457330'
export const SCHOOL_EMAIL = import.meta.env.VITE_SCHOOL_EMAIL || 'a9006457330@gmail.com'
export const SCHOOL_ADDRESS =
  import.meta.env.VITE_SCHOOL_ADDRESS ||
  'Meghwal mathia Bazar, West Champaran, Bihar 845106'
export const SCHOOL_LOCALITY = 'West Champaran'
export const SCHOOL_AREA = 'West Champaran'
export const SCHOOL_DISTRICT = 'West Champaran'
export const SCHOOL_STATE = 'Bihar'
export const SCHOOL_COUNTRY = 'IN'
export const SCHOOL_KEYWORDS = [
  'Star Public School',
  'Harinagar school',
  'Ramnagar Bettiah school',
  'West Champaran school',
  'best school in Harinagar Ramnagar West Champaran',
  'school in Harinagar Bihar',
  'public school in West Champaran',
  'admission in Harinagar school',
  'results portal school Bihar',
  'Best school in Ramnagar Belagola',
  'gyanodaypublicschool',
  'gyanday public school',
  'gonday public school',
  'rannagar me best school',
  'harinagar me best school',
  'bachon ke liye accha school harinagar',
  'bachon ke liye accha school ramnagar',
  'bachon ke liye accha school west champaran',
  'bachon ke liye accha school dainmarwa',
  'school in belagola'
].join(', ')

export const DEFAULT_DESCRIPTION =
  'Star Public School in Harinagar, Ramnagar (Bettiah), West Champaran, Bihar offers disciplined learning, student care, admissions guidance, campus updates and secure result access.'

export const PUBLIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/admission', priority: '0.9', changefreq: 'weekly' },
  { path: '/contact', priority: '0.8', changefreq: 'monthly' },
  { path: '/gallery', priority: '0.7', changefreq: 'monthly' },
  { path: '/results-portal', priority: '0.6', changefreq: 'weekly' },
]

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['".,()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const buildAbsoluteUrl = (path = '/') => {
  const normalizedPath = String(path || '/').startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalizedPath}`
}

export const formatPageTitle = (pageTitle) => {
  const trimmedTitle = String(pageTitle || '').trim()
  return trimmedTitle ? `${trimmedTitle} | ${SCHOOL_NAME}` : SCHOOL_NAME
}

export const buildSchoolJsonLd = ({ path = '/' } = {}) => {
  const url = buildAbsoluteUrl(path)

  return {
    '@context': 'https://schema.org',
    '@type': 'School',
    name: SCHOOL_NAME,
    alternateName: SCHOOL_SHORT_NAME,
    url,
    telephone: SCHOOL_PHONE,
    email: SCHOOL_EMAIL,
    description: DEFAULT_DESCRIPTION,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Meghwal mathia Bazar',
      addressLocality: SCHOOL_LOCALITY,
      addressRegion: SCHOOL_STATE,
      addressCountry: SCHOOL_COUNTRY,
    },
    areaServed: [
      {
        '@type': 'AdministrativeArea',
        name: SCHOOL_LOCALITY,
      },
      {
        '@type': 'AdministrativeArea',
        name: SCHOOL_AREA,
      },
      {
        '@type': 'AdministrativeArea',
        name: SCHOOL_DISTRICT,
      },
      {
        '@type': 'AdministrativeArea',
        name: `${SCHOOL_DISTRICT}, ${SCHOOL_STATE}`,
      },
    ],
    foundingLocation: {
      '@type': 'Place',
      name: `${SCHOOL_LOCALITY}, ${SCHOOL_DISTRICT}, ${SCHOOL_STATE}`,
    },
    sameAs: [],
    logo: buildAbsoluteUrl('/logo.png'),
    image: [buildAbsoluteUrl('/logo.png')],
  }
}

export const buildCanonicalUrl = (path = '/') => buildAbsoluteUrl(path)

export const buildResultPath = ({ classValue, roll }) => {
  const classSlug = slugify(classValue || 'class')
  const rollSlug = encodeURIComponent(String(roll || 'roll').trim().replace(/\s+/g, '-'))
  return `/results/${classSlug}/roll-${rollSlug}`
}

export const parseClassSlug = (slug = '') => {
  const raw = String(slug || '').trim().toLowerCase()
  if (!raw) return ''

  const stripped = raw.replace(/^class-/, '')
  const decoded = decodeURIComponent(stripped)

  if (decoded === 'lkg') return 'LKG'
  if (decoded === 'ukg') return 'UKG'
  if (decoded === 'mother-care') return 'Mother Care'

  if (/^\d+$/.test(decoded)) return decoded
  if (/^\d+[a-z]{0,2}$/.test(decoded)) return decoded.toUpperCase()

  return decoded
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export const parseRollSlug = (slug = '') => {
  const raw = String(slug || '').trim()
  if (!raw) return ''
  return decodeURIComponent(raw.replace(/^roll-/, ''))
}

export const normalizeTitleCase = (value) =>
  String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export const pageTitleFrom = (title) => formatPageTitle(title)
