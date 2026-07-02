import api, { normalizeApiError } from './auth'
import { normalizeSchoolClass, sortSchoolClasses } from '../constants/schoolOptions'

const normalizeClassEntry = (item) => {
  if (typeof item === 'string') return normalizeSchoolClass(item)
  return {
    ...item,
    class: normalizeSchoolClass(item?.class),
  }
}

// Get all unique classes from students
export const getAllClasses = async () => {
  try {
    const response = await api.get('/api/students/classes')
    return sortSchoolClasses((response.data.classes || []).map(normalizeClassEntry))
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch classes')
  }
}

export const getClassesWithSections = async () => {
  try {
    const response = await api.get('/api/students/classes')
    return sortSchoolClasses((response.data.classes_with_sections || []).map(normalizeClassEntry))
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch classes and sections')
  }
}
