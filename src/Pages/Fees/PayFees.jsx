import React, { useState, useEffect } from 'react'
import { recordFeePayment, getStudentFeeDetails } from '../../Api/fees'
import { emitToast } from '../../Api/auth'
import { CLASS_OPTIONS, SECTION_OPTIONS, normalizeSchoolClass, normalizeSchoolSection } from '../../constants/schoolOptions'
import { downloadInvoiceSlipPDF } from '../../utils/pdf/invoiceSlipPdf'

const normalizeRollInput = (value) => (value ?? '').toString().trim()

const getInitials = (name) => {
  if (!name) return '--'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

const getCycleLabel = (monthStr) => {
  if (!monthStr) return 'Current Cycle'
  try {
    const [y, m] = monthStr.split('-')
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
    const monthName = date.toLocaleString('default', { month: 'short' })
    return `${monthName} ${y} Cycle`
  } catch {
    return 'Current Cycle'
  }
}

function PayFees({ initialData, onPaymentComplete }) {
  const [loading, setLoading] = useState(false)
  const [fetchingDetails, setFetchingDetails] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentResponse, setPaymentResponse] = useState(null)
  const [feeDetails, setFeeDetails] = useState(null)
  const [detailsError, setDetailsError] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]
  const currentMonthStr = todayStr.substring(0, 7)

  const [formData, setFormData] = useState({
    class: initialData?.class ? normalizeSchoolClass(initialData.class) : 'Nursery',
    section: initialData?.section ? normalizeSchoolSection(initialData.section) : 'A',
    roll_number: initialData?.roll_number ? String(initialData.roll_number) : '',
    amount_paid: initialData?.net_payable != null ? String(initialData.net_payable) : '',
    payment_mode: 'cash',
    payment_date: todayStr,
    month: initialData?.month ? String(initialData.month).trim() : currentMonthStr,
    reference_no: '',
    remarks: 'Fee collected at campus counter',
    print_thermal: true
  })

  const paymentModes = [
    { value: 'cash', label: 'Cash (Counter)' },
    { value: 'online', label: 'UPI / PhonePe / QR' },
    { value: 'bank_transfer', label: 'NetBanking' },
    { value: 'card', label: 'Debit / Credit Card POS' },
    { value: 'cheque', label: 'Cheque / Demand Draft' }
  ]

  // Initialize form with provided data
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        class: normalizeSchoolClass(initialData.class || 'Nursery'),
        section: normalizeSchoolSection(initialData.section || 'A'),
        roll_number: normalizeRollInput(initialData.roll_number || ''),
        month: (initialData.month || currentMonthStr).toString().trim(),
        amount_paid: initialData.net_payable != null ? String(initialData.net_payable) : ''
      }))
    }
  }, [initialData, currentMonthStr])

  // Live fetch fee details from Backend database when class, section, roll number, and month are selected
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
          if (result && result.net_payable != null) {
            setFormData(prev => ({
              ...prev,
              amount_paid: String(result.net_payable)
            }))
          }
        } catch (err) {
          setDetailsError(err?.message || 'Student not found in database')
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

  const handleCloseModal = () => {
    setShowPaymentModal(false)
    if (onPaymentComplete) {
      onPaymentComplete(paymentResponse)
    } else {
      handleReset()
    }
  }

  const handleReset = () => {
    setFormData({
      class: 'Nursery',
      section: 'A',
      roll_number: '',
      amount_paid: '',
      payment_mode: 'cash',
      payment_date: todayStr,
      month: currentMonthStr,
      reference_no: '',
      remarks: 'Fee collected at campus counter',
      print_thermal: true
    })
    setError('')
    setSuccess('')
    setFeeDetails(null)
    setDetailsError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setPaymentResponse(null)
    setShowPaymentModal(false)
    setLoading(true)

    try {
      const payload = {
        class: formData.class,
        section: formData.section,
        roll_number: formData.roll_number,
        roll_no: formData.roll_number,
        amount_paid: parseFloat(formData.amount_paid) || 0,
        payment_mode: formData.payment_mode,
        payment_date: formData.payment_date,
        month: (formData.month || '').toString().trim(),
        reference_no: formData.reference_no,
        remarks: formData.remarks,
        transaction_id: formData.reference_no || undefined,
      }

      const response = await recordFeePayment(payload)
      
      if (response.message || response.payment || response.bill_id) {
        setSuccess(response.message || 'Payment processed successfully!')
        emitToast('success', response.message || 'Payment processed successfully!', 'Fee Payment')
        setPaymentResponse(response)
        setShowPaymentModal(true)

        // Notify entire app (Dashboard KPIs, Defaulters, All Records, Bills) immediately!
        window.dispatchEvent(
          new CustomEvent('fee:payment-recorded', {
            detail: {
              student_id: response.student_id,
              bill_id: response.bill_id || response.payment?.bill_id,
              amount: parseFloat(formData.amount_paid) || 0,
            },
          })
        )

        // Trigger thermal slip print if opted
        if (formData.print_thermal) {
          setTimeout(() => {
            window.print()
          }, 800)
        }

        // Re-fetch live fee details to update remaining balance and status on screen
        try {
          const updatedDetails = await getStudentFeeDetails(
            formData.class,
            formData.section,
            formData.roll_number,
            formData.month
          )
          setFeeDetails(updatedDetails)
        } catch {
          // Keep current view
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
    <div className="space-y-6">
      {/* Alert Messages */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/95 p-4 text-rose-900 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-lg">error</span>
            <p className="text-xs font-semibold">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-700">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/95 p-4 text-emerald-900 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
            <p className="text-xs font-semibold">{success}</p>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-700">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================
            LEFT COLUMN: RECORD FEE PAYMENT FORM (lg:col-span-7)
            ======================================================== */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-[#0f1e36]">
                  Record Fee Payment
                </h2>
                <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  COUNTER POS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Instant counter fee collection with automated receipt generation and ledger update.
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">refresh</span>
              <span>Reset</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Row 1: Class & Roll Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Class *
                </label>
                <select
                  required
                  value={formData.class}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      class: normalizeSchoolClass(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition cursor-pointer"
                >
                  <option value="" disabled>Select class</option>
                  {CLASS_OPTIONS.map((className) => (
                    <option key={className} value={className}>
                      {className.startsWith('Class') ? className : `Class ${className}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Roll Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.roll_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      roll_number: normalizeRollInput(e.target.value),
                    })
                  }
                  placeholder="Enter roll number (e.g. 1)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            </div>

            {/* Row 2: Section & Month */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Section *
                </label>
                <select
                  required
                  value={formData.section}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section: normalizeSchoolSection(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition cursor-pointer"
                >
                  {SECTION_OPTIONS.map((section) => (
                    <option key={section} value={section}>
                      Section {section}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Month *
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Format: YYYY-MM
                  </span>
                </div>
                <input
                  type="month"
                  required
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition cursor-pointer"
                />
              </div>
            </div>

            {/* Row 3: Amount Paid & Quick Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Amount Paid *
                </label>
                {feeDetails ? (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 text-[11px] font-medium mr-0.5">Presets:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          amount_paid: Number(feeDetails.net_payable || 0).toFixed(2),
                        }))
                      }
                      className="px-2.5 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[11px] font-bold hover:bg-blue-100 transition cursor-pointer"
                    >
                      Full (₹{Number(feeDetails.net_payable || 0).toLocaleString('en-IN')})
                    </button>
                    {feeDetails.tuition_fee > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            amount_paid: Number(feeDetails.tuition_fee || 0).toFixed(2),
                          }))
                        }
                        className="px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
                      >
                        Tuition Only
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    Enter roll number to load payable amount
                  </span>
                )}
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-black text-base pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-base font-black text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            </div>

            {/* Row 4: Payment Mode & Payment Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Payment Mode *
                </label>
                <select
                  required
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition cursor-pointer"
                >
                  {paymentModes.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition cursor-pointer"
                />
              </div>
            </div>

            {/* Row 5: Reference / Receipt Book No. & Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reference / Receipt Book No.
                </label>
                <input
                  type="text"
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  placeholder="e.g. REC-2026-0881 / Cashier-01"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Remarks / Internal Notes
                </label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Fee collected at campus counter"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            </div>

            {/* Bottom Bar: Thermal Slip Checkbox & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-slate-100 mt-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.print_thermal}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, print_thermal: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Print 3-inch thermal slip immediately</span>
              </label>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onPaymentComplete) onPaymentComplete()
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-2xs cursor-pointer active:scale-98"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.amount_paid || parseFloat(formData.amount_paid) <= 0}
                  className="px-5 py-2.5 rounded-xl bg-[#0f766e] hover:bg-[#115e59] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">
                        receipt_long
                      </span>
                      <span>Record Payment & Print Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ========================================================
            RIGHT COLUMN: REAL STUDENT PROFILE & LIVE BREAKDOWN (lg:col-span-5)
            ======================================================== */}
        <div className="lg:col-span-5 space-y-5">
          {fetchingDetails ? (
            /* Loading State */
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs animate-pulse space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-200"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-px bg-slate-100 my-3"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-8 bg-slate-100 rounded"></div>
                  <div className="h-8 bg-slate-100 rounded"></div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-4 bg-slate-100 rounded"></div>
              </div>
            </div>
          ) : detailsError ? (
            /* Error State (No dummy data) */
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">person_off</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-900">Student Record Not Found</h3>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed">{detailsError}</p>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    Class: <span className="font-bold text-slate-700">{formData.class || '--'}</span> | Section: <span className="font-bold text-slate-700">{formData.section || '--'}</span> | Roll: <span className="font-bold text-slate-700">{formData.roll_number || '--'}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : feeDetails ? (
            /* Real Data Loaded from Database */
            <>
              {/* Top Card: Real Student Profile */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                      {getInitials(feeDetails.student_name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-[#0f1e36] tracking-tight">
                          {feeDetails.student_name}
                        </h3>
                        <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {feeDetails.status || 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        Adm No: {feeDetails.admission_no || '--'}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                        Class {feeDetails.class} - Section {feeDetails.section} | Roll: {feeDetails.roll_no}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center text-emerald-600 text-[11px] font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Live DB
                  </span>
                </div>

                <div className="border-t border-slate-100 my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Father's Name:
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">
                      {feeDetails.father_name || '--'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Contact Phone:
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">
                      {feeDetails.phone || feeDetails.mobile || '--'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card: Real Fee Structure Breakdown */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-[#0f1e36] uppercase tracking-wider">
                    FEE STRUCTURE BREAKDOWN
                  </h3>
                  <span className="bg-sky-50 text-sky-700 border border-sky-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {getCycleLabel(formData.month)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider pt-3 pb-1">
                  <span>FEE HEAD / DESCRIPTION</span>
                  <span>AMOUNT</span>
                </div>

                <div className="divide-y divide-slate-100/80 text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="font-medium text-slate-600">Monthly Tuition Fee</span>
                    <span className="font-bold text-slate-900">
                      ₹{Number(feeDetails.tuition_fee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="font-medium text-slate-600">Computer & Activity Lab</span>
                    <span className="font-bold text-slate-900">
                      ₹{Number(feeDetails.computer_fee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="font-medium text-slate-600">Term Examination Fee</span>
                    <span className="font-bold text-slate-900">
                      ₹{Number(feeDetails.exam_fee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="font-medium text-slate-600">Annual Maintenance & Sports</span>
                    <span className="font-bold text-slate-900">
                      ₹{Number(feeDetails.annual_fee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {feeDetails.transport_fee > 0 && (
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-600">Transport / Bus Fee</span>
                      <span className="font-bold text-slate-900">
                        ₹{Number(feeDetails.transport_fee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="font-medium text-slate-600">Previous Arrears / Dues</span>
                    <span
                      className={`font-bold ${
                        feeDetails.previous_due > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      ₹{Number(feeDetails.previous_due || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 my-3.5 pt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-600">Total Monthly Due</span>
                    <span className="font-bold text-slate-900">
                      ₹{Number(feeDetails.total_fee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-600">Applicable Concession / Waiver</span>
                    <span className="font-bold text-emerald-600">
                      ₹{Number(feeDetails.concession_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {feeDetails.paid_amount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-600">Already Paid</span>
                      <span className="font-bold text-emerald-600">
                        ₹{Number(feeDetails.paid_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 my-3.5 pt-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Net Payable Amount</span>
                  <span className="text-lg font-black text-blue-600">
                    ₹{Number(feeDetails.net_payable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Initial Clean Empty State (No dummy data) */
            <div className="space-y-5">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-7 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 mx-auto flex items-center justify-center shadow-2xs">
                  <span className="material-symbols-outlined text-2xl">person_search</span>
                </div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-3">
                  Select Student To Load
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1 max-w-xs mx-auto">
                  Select Class and enter Roll Number on the left to pull live student data and fee ledger from the database.
                </p>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                </div>
                <h4 className="text-xs font-bold text-slate-700">Fee Breakdown Pending</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Fee heads, previous dues, and net payable will calculate automatically once a student is loaded.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          PAYMENT SUCCESS MODAL (Preserved 100%)
          ======================================================== */}
      {showPaymentModal && paymentResponse && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPaymentModal(false)
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 rounded-xl p-2.5 text-emerald-600">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Payment Successful</h3>
                  <p className="text-xs text-slate-500">
                    {paymentResponse.message || 'Payment processed successfully'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Content Details */}
            <div className="mt-5 space-y-4">
              {/* Receipt Number - Highlight Banner */}
              {paymentResponse.payment?.receipt_no && (
                <div className="rounded-xl p-4 bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-blue-700 font-semibold uppercase tracking-wider">
                      Receipt Number
                    </p>
                    <p className="text-xl font-black text-blue-900 mt-0.5">
                      {paymentResponse.payment.receipt_no}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-3xl text-blue-400">
                    receipt_long
                  </span>
                </div>
              )}

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">
                    Amount Paid
                  </p>
                  <p className="text-base font-black text-emerald-600 mt-0.5">
                    ₹{paymentResponse.payment?.amount_paid?.toLocaleString('en-IN') ||
                      paymentResponse.amount_paid?.toLocaleString('en-IN') ||
                      '0'}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">
                    Advance Created
                  </p>
                  <p className="text-base font-black text-blue-600 mt-0.5">
                    ₹{paymentResponse.payment?.advance_created?.toLocaleString('en-IN') || '0'}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">
                    Remaining
                  </p>
                  <p
                    className={`text-base font-black mt-0.5 ${
                      (paymentResponse.payment?.remaining || 0) > 0
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    ₹{paymentResponse.payment?.remaining?.toLocaleString('en-IN') || '0'}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">
                    Bill ID
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-1 break-all">
                    {paymentResponse.payment?.bill_id || paymentResponse.bill_id || '--'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadInvoiceSlipPDF(
                      paymentResponse.bill_id || paymentResponse.payment?.bill_id
                    )
                  }
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download Invoice (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  Print
                </button>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2 bg-[#0f172a] text-white rounded-xl hover:bg-[#1e293b] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PayFees