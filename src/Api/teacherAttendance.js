import api, { buildQueryParams, normalizeApiError } from './auth'

export const getTeacherAttendanceSettings = async () => {
  try {
    const response = await api.get('/api/teacher-attendance/settings')
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Fetch teacher attendance settings failed')
  }
}

export const saveTeacherAttendanceSettings = async (payload) => {
  try {
    const response = await api.put('/api/teacher-attendance/settings', payload)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Save teacher attendance settings failed')
  }
}

export const getTeacherAttendanceToday = async (filters = {}) => {
  try {
    const response = await api.get('/api/teacher-attendance/today', {
      params: buildQueryParams(filters),
    })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Fetch teacher attendance status failed')
  }
}

export const getTeacherAttendanceRecords = async (filters = {}) => {
  try {
    const response = await api.get('/api/teacher-attendance/records', {
      params: buildQueryParams(filters),
    })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Fetch teacher attendance records failed')
  }
}

export const getPendingCheckoutRequests = async () => {
  try {
    const response = await api.get('/api/teacher-attendance/pending-checkout')
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Fetch checkout requests failed')
  }
}

export const reviewCheckoutRequest = async (requestId, payload) => {
  try {
    const response = await api.patch(`/api/teacher-attendance/checkout-requests/${requestId}/review`, payload)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Review checkout request failed')
  }
}

export const getTeacherLeaveRequests = async (filters = {}) => {
  try {
    const response = await api.get('/api/teacher-attendance/leave-requests', {
      params: buildQueryParams(filters),
    })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Fetch teacher leave requests failed')
  }
}

export const reviewTeacherLeaveRequest = async (leaveId, payload) => {
  try {
    const response = await api.patch(`/api/teacher-attendance/leave-requests/${leaveId}`, payload)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Review teacher leave failed')
  }
}

export default {
  getTeacherAttendanceSettings,
  saveTeacherAttendanceSettings,
  getTeacherAttendanceToday,
  getTeacherAttendanceRecords,
  getPendingCheckoutRequests,
  reviewCheckoutRequest,
  getTeacherLeaveRequests,
  reviewTeacherLeaveRequest,
}
