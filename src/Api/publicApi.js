import axios from 'axios'

import { API_BASE_URL } from './auth'

// NOTE: Uses the exact same normalized baseURL as `src/Api/auth.js`.
// This client intentionally has NO auth/refresh interceptors because
// public endpoints (like result viewing) should not redirect users to /login.
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
})

export default publicApi


