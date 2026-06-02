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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl()

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
})

export default publicApi


