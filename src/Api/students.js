import api, { buildQueryParams, normalizeApiError } from './auth'

const normalizeFiltersInput = (filtersOrClass = {}) => {
  if (typeof filtersOrClass === 'string') {
    return filtersOrClass ? { class: filtersOrClass } : {}
  }
  return filtersOrClass || {}
}

export const getAllStudents = async (filtersOrClass = {}) => {
  try {
    const params = buildQueryParams(normalizeFiltersInput(filtersOrClass))
    const response = await api.get('/api/students/all', { params })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch students')
  }
}

export const getStudents = async (filtersOrClass = {}) => {
  try {
    const params = buildQueryParams(normalizeFiltersInput(filtersOrClass))
    const response = await api.get('/api/students', { params })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch students')
  }
}

export const addStudent = async (studentData) => {
  try {
    const response = await api.post('/api/students/add', studentData)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Failed to add student')
  }
}

export const updateStudent = async (studentId, studentData) => {
  try {
    const response = await api.put(`/api/students/edit/${studentId}`, studentData)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Failed to update student')
  }
}

export const leaveStudent = async (studentId, payload = {}) => {
  try {
    const response = await api.patch(`/api/students/${studentId}/leave`, payload)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Failed to mark student as leave')
  }
}

export const rejoinStudent = async (studentId, payload) => {
  try {
    const response = await api.patch(`/api/students/${studentId}/rejoin`, payload)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Failed to rejoin student')
  }
}

export const deleteStudent = async (studentId) => {
  try {
    const response = await api.delete(`/api/students/${studentId}`)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Failed to delete student')
  }
}

export default {
  getStudents,
  getAllStudents,
  addStudent,
  updateStudent,
  leaveStudent,
  rejoinStudent,
  deleteStudent,
}

