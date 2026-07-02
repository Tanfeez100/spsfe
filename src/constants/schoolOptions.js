export const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8']

export const SECTION_OPTIONS = ['A', 'B', 'C']

export const normalizeSchoolClass = (value) => {
  const text = (value ?? '').toString().trim()
  if (!text) return ''
  const compact = text.replace(/[\s-]+/g, '').toLowerCase()
  return compact === 'mothercare' || compact === 'nursery' ? 'Nursery' : text
}

export const getSchoolClassOrder = (value) => {
  const normalized = normalizeSchoolClass(value)
  const index = CLASS_OPTIONS.indexOf(normalized)
  return index === -1 ? CLASS_OPTIONS.length : index
}

export const sortSchoolClasses = (values = []) =>
  [...values].sort((a, b) => {
    const classA = typeof a === 'string' ? a : a?.class
    const classB = typeof b === 'string' ? b : b?.class
    const orderDiff = getSchoolClassOrder(classA) - getSchoolClassOrder(classB)
    if (orderDiff !== 0) return orderDiff
    return String(classA || '').localeCompare(String(classB || ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  })

export const normalizeSchoolSection = (value) => {
  const text = (value ?? '').toString().trim().toUpperCase()
  return text
}
