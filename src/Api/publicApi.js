import axios from 'axios'

// NOTE: Keep this aligned with `src/Api/auth.js` baseURL.
// This client intentionally has NO auth/refresh interceptors because
// public endpoints (like result viewing) should not redirect users to /login.
const getDefaultApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000'
    }
  }
  return 'https://starpublicschool.onrender.com'
}

const normalizeApiBaseUrl = (url) => {
  const value = String(url || '').replace(/\/+$/, '')
  if (value === 'http://localhost:8000' || value === 'http://127.0.0.1:8000') {
    return 'http://localhost:5000'
  }
  return value || getDefaultApiBaseUrl()
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
})

export default publicApi


