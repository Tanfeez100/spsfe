export const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8']

export const SECTION_OPTIONS = ['A', 'B', 'C']

export const normalizeSchoolClass = (value) => {
  const text = (value ?? '').toString().trim()
  if (!text) return ''
  return text.toLowerCase() === 'mother care' ? 'Nursery' : text
}

export const normalizeSchoolSection = (value) => {
  const text = (value ?? '').toString().trim().toUpperCase()
  return text
}
