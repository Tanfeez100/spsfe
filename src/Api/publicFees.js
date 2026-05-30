import { publicApi, normalizeApiError } from './auth'

const withPublicErrorHandling = async (request, fallbackMessage) => {
  try {
    const response = await request()
    return response.data
  } catch (error) {
    throw normalizeApiError(error, fallbackMessage)
  }
}

export const lookupPublicFees = async (payload) =>
  withPublicErrorHandling(
    () => publicApi.post('/api/public-fees/lookup', payload),
    'Failed to fetch fee status'
  )

export const lookupPublicReceipt = async (payload) =>
  withPublicErrorHandling(
    () => publicApi.post('/api/public-fees/receipt-lookup', payload),
    'Failed to find receipt'
  )

export const createPublicFeeOrder = async (payload) =>
  withPublicErrorHandling(
    () => publicApi.post('/api/public-fees/order', payload),
    'Failed to create payment order'
  )

export const verifyPublicFeePayment = async (payload) =>
  withPublicErrorHandling(
    () => publicApi.post('/api/public-fees/verify', payload),
    'Failed to verify payment'
  )

export const getPublicFeePaymentStatus = async (orderId, payload) =>
  withPublicErrorHandling(
    () => publicApi.get(`/api/public-fees/status/${orderId}`, { params: payload }),
    'Failed to check payment status'
  )

export const buildPublicReceiptUrl = (billId, mobile) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://starpublicschool.onrender.com'
  const query = mobile ? `?mobile=${encodeURIComponent(mobile)}` : ''
  return `${baseUrl}/api/public-fees/receipt/${billId}${query}`
}

export const buildPublicInvoiceUrl = (billId) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://starpublicschool.onrender.com'
  return `${baseUrl}/api/invoice/public/download/${billId}`
}
