import api, { normalizeApiError } from './auth'

// Get all unique classes from students
export const getAllClasses = async () => {
  try {
    const response = await api.get('/api/students/classes')
    return response.data.classes || []
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch classes')
  }
}

export const getClassesWithSections = async () => {
  try {
    const response = await api.get('/api/students/classes')
    return response.data.classes_with_sections || []
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch classes and sections')
  }
}
