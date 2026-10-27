import api, { buildQueryParams, normalizeApiError } from './auth'
import publicApi from './publicApi'

const TERMINAL_ALIASES = {
  first: 'First',
  second: 'Second',
  third: 'Third',
  final: 'Annual',
  annual: 'Annual',
}

const normalizeTerminal = (terminal) => {
  const value = String(terminal || '').trim()
  if (!value) return value
  return TERMINAL_ALIASES[value.toLowerCase()] || value
}

// Submit marks
export const submitMarks = async (marksData) => {
  try {
    const payload = {
      ...marksData,
      terminal: normalizeTerminal(marksData?.terminal),
    }

    const response = await api.post('/api/marks/submit', payload)
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Failed to submit marks')
  }
}

// Get marks by class, section, and terminal
export const getMarks = async (classValue, section, terminal) => {
  try {
    const params = buildQueryParams({
      class: classValue,
      terminal: normalizeTerminal(terminal),
      section,
      _t: Date.now(),
    })

    const response = await api.get('/api/marks', { params })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch marks')
  }
}

// Public: Get student result by class, roll, terminal (and optional section/session)
// Endpoint example: GET /marks/result?class=1&roll=1&terminal=First&section=A&session=2025-26
// Expected response includes: student, marks[], summary (total_max_marks, total_obtained, percentage, division, rank, published_date)
export const getStudentResultPublic = async ({ classValue, roll, terminal, section, session }) => {
  try {
    const params = buildQueryParams({
      class: classValue,
      roll,
      terminal: normalizeTerminal(terminal),
      section,
      session,
    })

    const response = await publicApi.get('/api/marks/result', { params })
    return response.data
  } catch (error) {
    // Preserve status and response data so callers can handle 404/403 more precisely
    const status = error?.response?.status
    const data = error?.response?.data
    const message = error?.message || 'Request failed'
    throw { status, data, message, response: error?.response }
  }
}

// Publish results for a class
export const publishResults = async (classValue, section, terminal) => {
  try {
    const response = await api.post('/api/marks/publish', {
      class: classValue,
      section: section || undefined,
      terminal: normalizeTerminal(terminal),
    })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, 'Failed to publish results')
  }
}

export default { submitMarks, getMarks, getStudentResultPublic, publishResults }

