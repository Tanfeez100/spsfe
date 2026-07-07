import api, { buildQueryParams, normalizeApiError } from './auth'

export const getStudentLeaveRequestsAdmin = async (filters = {}) => {
  try {
    const response = await api.get('/api/student-leaves/admin', {
      params: buildQueryParams(filters),
    })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Fetch student leave requests failed')
  }
}

export const reviewStudentLeaveRequest = async (leaveId, payload) => {
  try {
    const response = await api.patch(`/api/student-leaves/admin/${leaveId}`, payload)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Review student leave request failed')
  }
}

export default {
  getStudentLeaveRequestsAdmin,
  reviewStudentLeaveRequest,
}
