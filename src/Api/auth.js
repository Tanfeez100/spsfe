import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
// https://gps-backend-p91d.onrender.com
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
})

export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
})

let isRefreshing = false
let failedQueue = []
 
const processQueue = (error, token = null) => {
  failedQueue.forEach((request) => {
    if (error) {
      request.reject(error)
      return
    }
    request.resolve(token)
  })
  failedQueue = []
}

export const emitToast = (type = 'info', message = '', title = '') => {
  window.dispatchEvent(
    new CustomEvent('app:toast', {
      detail: { type, message, title },
    })
  )
}

export const normalizeApiError = (error, fallbackMessage = 'Request failed') => {
  if (error?.status && error?.message && !error?.response) {
    return error
  }

  const status = error?.response?.status || error?.status || 0
  const data = error?.response?.data || error?.data || null
  const serverMessage = data?.message || data?.error || (typeof data === 'string' ? data : null)

  const statusMessages = {
    400: 'Validation error. Please check submitted data.',
    401: 'Unauthorized request. Please login again.',
    405: 'Method not allowed for this endpoint.',
    409: 'Conflict detected. This may be a roll number conflict.',
    500: 'Server error. Please try again in a moment.',
  }

  return {
    status,
    message: serverMessage || statusMessages[status] || fallbackMessage,
    data,
  }
}

export const buildQueryParams = (filters = {}) => {
  return Object.entries(filters).reduce((params, [key, value]) => {
    if (value === undefined || value === null) {
      return params
    }

    if (typeof value === 'string' && value.trim() === '') {
      return params
    }

    if (Array.isArray(value) && value.length === 0) {
      return params
    }

    params[key] = Array.isArray(value) ? value.join(',') : value
    return params
  }, {})
}

export const getLoginType = () => {
  return localStorage.getItem('loginType') || 'all'
}

export const getUser = () => {
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    return null
  }

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export const getAccessToken = () => {
  return localStorage.getItem('access_token')
}

export const getRefreshToken = () => {
  return localStorage.getItem('refresh_token')
}

export const setSession = (sessionData, loginType = 'all') => {
  const accessToken = sessionData?.session?.access_token || sessionData?.access_token
  const refreshToken = sessionData?.session?.refresh_token || sessionData?.refresh_token
  const user = sessionData?.user || null

  if (!accessToken || !user) {
    return
  }

  localStorage.setItem('access_token', accessToken)
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken)
  }

  localStorage.setItem(
    'session',
    JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    })
  )
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('loginType', loginType)
}

export const clearSession = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  localStorage.removeItem('session')
  localStorage.removeItem('loginType')
}

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw normalizeApiError({ status: 401, message: 'No refresh token found' }, 'No refresh token found')
  }

  try {
    const response = await publicApi.post('/api/auth/refresh', { refresh_token: refreshToken })
    const newAccessToken = response.data?.session?.access_token || response.data?.access_token
    const newRefreshToken = response.data?.session?.refresh_token || response.data?.refresh_token

    if (!newAccessToken) {
      throw new Error('Refresh response does not include access token')
    }

    localStorage.setItem('access_token', newAccessToken)
    if (newRefreshToken) {
      localStorage.setItem('refresh_token', newRefreshToken)
    }

    return newAccessToken
  } catch (error) {
    clearSession()
    throw normalizeApiError(error, 'Session refresh failed')
  }
}

export const login = async (email, password) => {
  try {
    const response = await publicApi.post('/api/auth/login', {
      email,
      password,
    })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Login failed')
  }
}

export const createUser = async (payload) => {
  try {
    const response = await api.post('/api/auth/create-user', payload)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Create user failed')
  }
}

export const createTeacher = async (payload) => {
  try {
    const response = await api.post('/api/auth/teachers', payload)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Create teacher failed')
  }
}

export const getTeachers = async () => {
  try {
    const response = await api.get('/api/auth/teachers')
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Fetch teachers failed')
  }
}

export const removeTeacher = async (teacherId) => {
  try {
    const response = await api.delete(`/api/auth/teachers/${teacherId}`)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Remove teacher failed')
  }
}

export const resetPassword = async (userId, payload) => {
  try {
    const response = await api.patch(`/api/auth/reset-password/${userId}`, payload)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Reset password failed')
  }
}

export const logout = async () => {
  try {
    const token = getAccessToken()
    if (!token) {
      clearSession()
      return { success: true }
    }

    const response = await api.post('/api/auth/logout', {})
    clearSession()
    return response.data
  } catch (error) {
    clearSession()
    throw normalizeApiError(error, 'Logout failed')
  }
}

export const saveCredentials = (email, password) => {
  const savedCredentials = getSavedCredentials()
  const existingIndex = savedCredentials.findIndex((credential) => credential.email === email)

  if (existingIndex >= 0) {
    savedCredentials[existingIndex] = { email, password }
  } else {
    savedCredentials.push({ email, password })
  }

  localStorage.setItem('savedCredentials', JSON.stringify(savedCredentials))
}

export const getSavedCredentials = () => {
  const raw = localStorage.getItem('savedCredentials')
  if (!raw) {
    return []
  }

  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export const removeSavedCredentials = (email) => {
  const savedCredentials = getSavedCredentials()
  const filtered = savedCredentials.filter((credential) => credential.email !== email)
  localStorage.setItem('savedCredentials', JSON.stringify(filtered))
}

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(normalizeApiError(error))
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {}
    const status = error?.response?.status
    const isAuthRequest =
      originalRequest?.url?.includes('/api/auth/login') ||
      originalRequest?.url?.includes('/api/auth/refresh') ||
      originalRequest?.url?.includes('/api/auth/logout')

    if (status === 401 && !originalRequest._retry && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((refreshError) => Promise.reject(normalizeApiError(refreshError)))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const token = await refreshAccessToken()
        processQueue(null, token)
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearSession()
        if (window.location.pathname !== '/login' && window.location.pathname !== '/student-login') {
          window.location.href = '/login'
        }
        emitToast('error', 'Session expired. Please login again.', '401 Unauthorized')
        return Promise.reject(normalizeApiError(refreshError))
      } finally {
        isRefreshing = false
      }
    }

    const normalizedError = normalizeApiError(error)
    if ([400, 401, 405, 409, 500].includes(normalizedError.status)) {
      const statusTitle = `${normalizedError.status} Error`
      emitToast('error', normalizedError.message, statusTitle)
    }

    if (normalizedError.status === 401 && !isAuthRequest) {
      clearSession()
      if (window.location.pathname !== '/login' && window.location.pathname !== '/student-login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(normalizedError)
  }
)

export default api

