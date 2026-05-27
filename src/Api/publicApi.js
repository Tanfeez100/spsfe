import axios from 'axios'

// NOTE: Keep this aligned with `src/Api/auth.js` baseURL.
// This client intentionally has NO auth/refresh interceptors because
// public endpoints (like result viewing) should not redirect users to /login.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
})

export default publicApi


