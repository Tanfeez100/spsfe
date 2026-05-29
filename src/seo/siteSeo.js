const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://starpublischool.website').replace(/\/+$/, '')

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
export const SCHOOL_VISIBLE_LOCATION = 'Meghwal Mathia, Ramnagar, West Champaran'
export const SCHOOL_NEARBY_SERVICE_AREAS = [
  'Gidha',
  'Khajuria',
  'Matiaria Khurd',
  'Matiaria Kalan',
  'Katsikri',
  'Harpur',
  'Kanghusri',
  'Phulkaul',
  'Phulwaria',
  'Bakri Pachrukhiya',
  'Bakwa',
  'Barwa',
  'Sonha',
  'Jharatwa',
  'Mahui',
  'Chamardih Bargon',
  'Rupwaliya',
  'Kunriya',
  'Singahi',
  'Bargajwa',
  'Majurha',
  'Birkehni',
  'Madhubani',
  'Churiharwa',
  'Bakhraha',
  'Bankatwa',
  'Belatandi',
  'Damrapur',
  'Dhayar',
  'Dhobaha',
  'Gobardhana',
  'Gobrahia',
  'Karmaha',
  'Naurangia',
]

export const SCHOOL_KEYWORDS = [
  'Star Public School',
  'Star Public School Meghwal Mathia',
  'Star Public School Meghwal Mathia Ramnagar',
  'school in Meghwal Mathia',
  'best school in Meghwal Mathia',
  'private school in Meghwal Mathia',
  'public school in Meghwal Mathia',
  'English medium school near Meghwal Mathia',
  'admission in Meghwal Mathia school',
  'school near Mathia Gram Panchayat',
  'school near Meghwal Bazar',
  'best school near Meghwal Mathia Ramnagar',
  'Harinagar school',
  'Ramnagar Bettiah school',
  'West Champaran school',
  'best school in Harinagar Ramnagar West Champaran',
  'school in Harinagar Bihar',
  'public school in West Champaran',
  'admission in Harinagar school',
  'results portal school Bihar',
  'Best school in Ramnagar Belagola',
  'Star Public School',
  'Star Public School Meghwal Mathia',
  'Star Public School Ramnagar',
  'rannagar me best school',
  'harinagar me best school',
  'bachon ke liye accha school harinagar',
  'bachon ke liye accha school ramnagar',
  'bachon ke liye accha school west champaran',
  'bachon ke liye accha school dainmarwa',
  'school in belagola',
  ...SCHOOL_NEARBY_SERVICE_AREAS.map((village) => `school near ${village}`),
  ...SCHOOL_NEARBY_SERVICE_AREAS.map((village) => `best school near ${village}`),
].join(', ')

export const DEFAULT_DESCRIPTION =
  'Star Public School in Meghwal Mathia, Ramnagar, West Champaran, Bihar offers disciplined learning, student care, admissions guidance, campus updates, online fee payment and secure result access.'

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
    '@id': `${buildAbsoluteUrl('/')}#school`,
    name: SCHOOL_NAME,
    alternateName: SCHOOL_SHORT_NAME,
    url,
    telephone: SCHOOL_PHONE,
    email: SCHOOL_EMAIL,
    description: DEFAULT_DESCRIPTION,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Meghwal mathia Bazar',
      addressLocality: 'Ramnagar',
      addressRegion: SCHOOL_STATE,
      postalCode: '845106',
      addressCountry: SCHOOL_COUNTRY,
    },
    location: {
      '@type': 'Place',
      name: SCHOOL_VISIBLE_LOCATION,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Meghwal mathia Bazar',
        addressLocality: 'Ramnagar',
        addressRegion: SCHOOL_STATE,
        postalCode: '845106',
        addressCountry: SCHOOL_COUNTRY,
      },
    },
    geo: {
      '@type': 'GeoCoordinates',
      addressLocality: 'Meghwal Mathia',
      addressRegion: SCHOOL_STATE,
      addressCountry: SCHOOL_COUNTRY,
    },
    areaServed: [
      {
        '@type': 'Place',
        name: SCHOOL_VISIBLE_LOCATION,
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
      ...SCHOOL_NEARBY_SERVICE_AREAS.map((name) => ({
        '@type': 'Place',
        name,
      })),
    ],
    foundingLocation: {
      '@type': 'Place',
      name: `${SCHOOL_VISIBLE_LOCATION}, ${SCHOOL_STATE}`,
    },
    knowsAbout: [
      'school admission',
      'primary education',
      'student results',
      'online fee payment',
      'disciplined learning',
      'parent communication',
    ],
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
