import React, { useState, useEffect } from 'react'
import { recordFeePayment, getStudentFeeDetails } from '../../Api/fees'
import { emitToast } from '../../Api/auth'

const normalizeClassInput = (value) => (value ?? '').toString().trim()
const normalizeSectionInput = (value) => (value ?? '').toString().trim().toUpperCase()
const normalizeRollInput = (value) => (value ?? '').toString().trim()

function PayFees({ initialData, onPaymentComplete }) {
  const [loading, setLoading] = useState(false)
  const [fetchingDetails, setFetchingDetails] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentResponse, setPaymentResponse] = useState(null)
  const [feeDetails, setFeeDetails] = useState(null)
  const [detailsError, setDetailsError] = useState('')
  const [formData, setFormData] = useState({
    class: '',
    section: '',
    roll_number: '',
    amount_paid: '',
    payment_mode: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    month: ''
  })

  const paymentModes = [
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online', label: 'Online' },
    { value: 'bank_transfer', label: 'Bank Transfer' }
  ]

  // Initialize form with provided data
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        class: normalizeClassInput(initialData.class || ''),
        section: normalizeSectionInput(initialData.section || ''),
        roll_number: normalizeRollInput(initialData.roll_number || ''),
        month: (initialData.month || '').toString().trim(),
        amount_paid: initialData.net_payable ?? ''
      }))
    }
  }, [initialData])

  // Auto-fetch fee details when all required fields are filled
  useEffect(() => {
    const fetchFeeBreakdown = async () => {
      if (formData.class && formData.section && formData.roll_number && formData.month) {
        setFetchingDetails(true)
        setDetailsError('')
        try {
          const result = await getStudentFeeDetails(
            formData.class,
            formData.section,
            formData.roll_number,
            formData.month
          )
          setFeeDetails(result)
        } catch (err) {
          setDetailsError(err?.message || 'Failed to fetch fee details')
          setFeeDetails(null)
        } finally {
          setFetchingDetails(false)
        }
      } else {
        setFeeDetails(null)
        setDetailsError('')
      }
    }

    fetchFeeBreakdown()
  }, [formData.class, formData.section, formData.roll_number, formData.month])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setPaymentResponse(null)
    setShowPaymentModal(false)
    setLoading(true)

    try {
      const payload = {
        class: normalizeClassInput(formData.class),
        section: normalizeSectionInput(formData.section),
        roll_number: parseInt(formData.roll_number, 10),
        roll_no: parseInt(formData.roll_number, 10),
        amount_paid: parseFloat(formData.amount_paid),
        payment_mode: formData.payment_mode,
        payment_date: formData.payment_date,
        month: (formData.month || '').toString().trim()
      }

      const response = await recordFeePayment(payload)
      
      // Handle successful response
      if (response.message || response.payment || response.bill_id) {
        setSuccess(response.message || 'Payment processed successfully!')
        emitToast('success', response.message || 'Payment processed successfully!', 'Fee Payment')
        setPaymentResponse(response)
        setShowPaymentModal(true)
        
        // Reset form
        setFormData({
          class: '',
          section: '',
          roll_number: '',
          amount_paid: '',
          payment_mode: 'cash',
          payment_date: new Date().toISOString().split('T')[0],
          month: ''
        })
        
        // Notify parent component
        if (onPaymentComplete) {
          setTimeout(() => {
            onPaymentComplete()
          }, 2000)
        }
      } else {
        setError(response.message || 'Failed to record payment')
      }
    } catch (err) {
      setError(err?.message || err?.data?.message || err?.response?.data?.message || 'Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Fee Payment</h3>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50/95 p-3 text-rose-900 shadow-sm dark:border-rose-800/70 dark:bg-rose-950/30 dark:text-rose-100">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/95 p-3 text-emerald-900 shadow-sm dark:border-emerald-800/70 dark:bg-emerald-950/30 dark:text-emerald-100">
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class *</label>
                  <input
                    type="text"
                    required
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: normalizeClassInput(e.target.value) })}
                    placeholder="e.g., 1, 2, 3"
                    className="w-full px-3 py-2 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Roll Number *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: normalizeRollInput(e.target.value) })}
                    placeholder="Enter roll number"
                    className="w-full px-3 py-2 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Section *</label>
                  <input
                    type="text"
                    required
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: normalizeSectionInput(e.target.value) })}
                    placeholder="e.g., A, B, C"
                    className="w-full px-3 py-2 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Month *</label>
                <input
                  type="month"
                  required
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full px-3 py-2 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Format: YYYY-MM (e.g., 2024-01)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount Paid *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Mode *</label>
                <select
                  required
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className="w-full px-3 py-2 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 dropdown-cyan"
                >
                  {paymentModes.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className="w-full px-3 py-2 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">payments</span>
                    Record Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Fee Breakdown Section */}
        <div className="lg:col-span-1">
          {fetchingDetails ? (
            <div className="space-y-3">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
          ) : detailsError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{detailsError}</p>
            </div>
          ) : feeDetails ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-4">
              {/* Student Info */}
              {feeDetails.student_name && (
                <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mb-1">Student</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{feeDetails.student_name}</p>
                  {feeDetails.father_name && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Father: {feeDetails.father_name}</p>
                  )}
                </div>
              )}

              {/* Fee Breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Fee Breakdown</h4>
                
                <div className="flex justify-between items-center text-sm gap-0 flex-nowrap">
                  <span className="text-slate-600 dark:text-slate-400">Tuition Fee:</span>
                  <span className="font-medium text-slate-900 dark:text-white">₹{parseFloat(feeDetails.tuition_fee || 0).toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm gap-0 flex-nowrap">
                  <span className="text-slate-600 dark:text-slate-400">Exam Fee:</span>
                  <span className="font-medium text-slate-900 dark:text-white">₹{parseFloat(feeDetails.exam_fee || 0).toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm gap-0 flex-nowrap">
                  <span className="text-slate-600 dark:text-slate-400">Annual Fee:</span>
                  <span className="font-medium text-slate-900 dark:text-white">₹{parseFloat(feeDetails.annual_fee || 0).toLocaleString('en-IN')}</span>
                </div>
                
                {feeDetails.previous_due && parseFloat(feeDetails.previous_due) > 0 && (
                  <div className="flex justify-between items-center text-sm gap-0 flex-nowrap">
                    <span className="text-orange-600 dark:text-orange-400">Previous Due:</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">₹{parseFloat(feeDetails.previous_due).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Total Summary */}
              {(feeDetails.total_fee || feeDetails.paid_amount || feeDetails.net_payable) && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold gap-0 flex-nowrap">
                    <span className="text-slate-900 dark:text-white">Total Fee:</span>
                    <span className="text-slate-900 dark:text-white bg-cyan-50/30 dark:bg-cyan-900/10 px-2 py-1 rounded">
                      ₹{parseFloat(feeDetails.total_fee || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  {feeDetails.paid_amount && parseFloat(feeDetails.paid_amount) > 0 && (
                    <div className="flex justify-between items-center text-sm font-bold gap-0 flex-nowrap">
                      <span className="text-green-600 dark:text-green-400">Already Paid:</span>
                      <span className="text-green-600 dark:text-green-400">₹{parseFloat(feeDetails.paid_amount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm font-bold gap-0 flex-nowrap">
                    <span className="text-red-600 dark:text-red-400">Due/Payable:</span>
                    <span className="text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-900/10 px-2 py-1 rounded">
                      ₹{parseFloat(feeDetails.net_payable || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center">
              <span className="material-symbols-outlined text-2xl text-slate-300 dark:text-slate-600 mx-auto block mb-2">note</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fill all fields to view student fee breakdown
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Success Modal */}
      {showPaymentModal && paymentResponse && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPaymentModal(false)
            }
          }}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto table-scrollbar border border-slate-200 dark:border-slate-700"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(99, 126, 153) rgb(224, 242, 254)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">check_circle</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Payment Successful</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{paymentResponse.message || 'Payment processed successfully'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              {/* Receipt Number - Highlighted */}
              {paymentResponse.payment?.receipt_no && (
                <div className="bg-gradient-to-r from-cyan-50/30 to-cyan-500/10 dark:from-cyan-900/30 dark:to-cyan-800/20 rounded-xl p-5 border border-cyan-200/30 dark:border-cyan-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">Receipt Number</p>
                      <p className="text-2xl font-bold text-cyan-200 dark:text-cyan-200">{paymentResponse.payment.receipt_no}</p>
                    </div>
                    <span className="material-symbols-outlined text-4xl text-cyan-200 dark:text-cyan-200">receipt</span>
                  </div>
                </div>
              )}

              {/* Payment Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mb-1">Amount Paid</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ₹{paymentResponse.payment?.amount_paid?.toLocaleString('en-IN') || paymentResponse.amount_paid?.toLocaleString('en-IN') || '0'}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mb-1">Advance Created</p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{paymentResponse.payment?.advance_created?.toLocaleString('en-IN') || '0'}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mb-1">Remaining</p>
                  <p className={`text-xl font-bold ${(paymentResponse.payment?.remaining || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    ₹{paymentResponse.payment?.remaining?.toLocaleString('en-IN') || '0'}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mb-1">Bill ID</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white break-all">
                    {paymentResponse.payment?.bill_id || paymentResponse.bill_id || '--'}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              {(paymentResponse.payment?.payment_id || paymentResponse.student_id) && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mb-2">Transaction Details</p>
                  <div className="space-y-1 text-sm">
                    {paymentResponse.payment?.payment_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Payment ID:</span>
                        <span className="font-medium text-slate-900 dark:text-white text-xs break-all">{paymentResponse.payment.payment_id}</span>
                      </div>
                    )}
                    {paymentResponse.student_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Student ID:</span>
                        <span className="font-medium text-slate-900 dark:text-white text-xs break-all">{paymentResponse.student_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#0f6fd1] transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PayFees
