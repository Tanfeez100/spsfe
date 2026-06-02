import { normalizeApiError, publicApi } from './auth'

export const studentSignup = async (payload) => {
  try {
    const response = await publicApi.post('/api/student-auth/signup', payload)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Student signup failed')
  }
}

export const studentLogin = async (username, password) => {
  try {
    const response = await publicApi.post('/api/student-auth/login', { username, password })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Student login failed')
  }
}

export default {
  studentSignup,
  studentLogin,
}
