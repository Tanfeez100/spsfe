import api, { buildQueryParams, normalizeApiError } from './auth'

export const getAttendanceBootstrap = async () => {
  try {
    const response = await api.get('/api/attendance/bootstrap')
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Fetch attendance data failed')
  }
}

export const getAttendanceRecords = async (filters = {}) => {
  try {
    const response = await api.get('/api/attendance/records', {
      params: buildQueryParams(filters),
    })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Fetch attendance records failed')
  }
}

export const saveAttendanceRecord = async (payload) => {
  try {
    const response = await api.post('/api/attendance/records', payload)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Save attendance failed')
  }
}

export const getStudentAttendance = async (studentId) => {
  try {
    const response = await api.get(`/api/attendance/students/${studentId}`)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Fetch student attendance failed')
  }
}

export const getHolidayCalendar = async (filters = {}) => {
  try {
    const response = await api.get('/api/attendance/holidays', {
      params: buildQueryParams(filters),
    })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Fetch holiday calendar failed')
  }
}

export const saveHoliday = async (payload) => {
  try {
    const response = await api.post('/api/attendance/holidays', payload)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Save holiday failed')
  }
}

export const updateHoliday = async (holidayId, payload) => {
  try {
    const response = await api.put(`/api/attendance/holidays/${holidayId}`, payload)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Update holiday failed')
  }
}

export const deleteHoliday = async (holidayId) => {
  try {
    const response = await api.delete(`/api/attendance/holidays/${holidayId}`)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Remove holiday failed')
  }
}

export default {
  getAttendanceBootstrap,
  getAttendanceRecords,
  saveAttendanceRecord,
  getStudentAttendance,
  getHolidayCalendar,
  saveHoliday,
  updateHoliday,
  deleteHoliday,
}
