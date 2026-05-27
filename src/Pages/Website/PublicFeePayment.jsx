import React, { useMemo, useState } from 'react'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import SEO from '../../Components/SEO/SEO'
import {
  buildPublicReceiptUrl,
  createPublicFeeOrder,
  getPublicFeePaymentStatus,
  lookupPublicFees,
  verifyPublicFeePayment,
} from '../../Api/publicFees'
import { schoolProfile } from './siteContent'

const initialForm = {
  class: '',
  section: '',
  roll_number: '',
  month: '',
  mobile: '',
}

const formatAmount = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const normalizeSection = (value) => value.toString().trim().toUpperCase()

const loadCashfreeScript = () =>
  new Promise((resolve) => {
    if (window.Cashfree) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

function PublicFeePayment() {
  const [form, setForm] = useState(initialForm)
  const [feeData, setFeeData] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')

  const activeBill = feeData?.active_bill || null
  const payable = Number(activeBill?.net_payable || 0)
  const canPay = activeBill?.bill_id && payable > 0

  const totalItems = useMemo(() => {
    return (activeBill?.items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }, [activeBill])

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === 'section' ? normalizeSection(value) : value,
    }))
  }

  const handleLookup = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setReceiptUrl('')
    setFeeData(null)
    setLookupLoading(true)

    try {
      const response = await lookupPublicFees({
        ...form,
        class: form.class.trim(),
        section: form.section.trim(),
        roll_number: form.roll_number.trim(),
        month: form.month.trim(),
        mobile: form.mobile.trim(),
      })
      setFeeData(response)
      if (!response.active_bill) {
        setSuccess('Student found, but no fee bill is available for the selected month.')
      }
    } catch (err) {
      setError(err?.message || 'Unable to fetch fee status')
    } finally {
      setLookupLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!canPay) return

    setError('')
    setSuccess('')
    setReceiptUrl('')
    setPayLoading(true)

    try {
      const loaded = await loadCashfreeScript()
      if (!loaded) {
        throw new Error('Cashfree checkout could not be loaded')
      }

      const orderResponse = await createPublicFeeOrder({
        bill_id: activeBill.bill_id,
        mobile: form.mobile.trim(),
      })

      const cashfreeOrderId = orderResponse.order?.id
      const paymentSessionId = orderResponse.order?.payment_session_id

      if (!cashfreeOrderId || !paymentSessionId) {
        throw new Error('Payment session could not be created')
      }

      let completed = false

      const refreshFeeStatus = async () => {
        const refreshed = await lookupPublicFees({
          ...form,
          class: form.class.trim(),
          section: form.section.trim(),
          roll_number: form.roll_number.trim(),
          month: form.month.trim(),
          mobile: form.mobile.trim(),
        })
        setFeeData(refreshed)
      }

      const completePaymentUi = async (paymentResponse) => {
        if (completed) return
        completed = true
        const url =
          paymentResponse.receipt_url || buildPublicReceiptUrl(activeBill.bill_id, form.mobile.trim())
        setReceiptUrl(url)
        setSuccess(
          paymentResponse.whatsapp?.sent
            ? 'Payment successful. Receipt has been sent on WhatsApp.'
            : 'Payment successful. Receipt is ready to download.'
        )
        await refreshFeeStatus()
        setPayLoading(false)
      }

      const pollPaymentStatus = async () => {
        const maxAttempts = 36
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          if (completed) return
          await new Promise((resolve) => window.setTimeout(resolve, attempt === 0 ? 2500 : 5000))

          try {
            const statusResponse = await getPublicFeePaymentStatus(orderResponse.order.id, {
              bill_id: activeBill.bill_id,
              mobile: form.mobile.trim(),
            })

            if (statusResponse.status === 'paid') {
              await completePaymentUi(statusResponse)
              return
            }
          } catch (statusError) {
            if (attempt >= 2) {
              setError(statusError?.message || 'Unable to check payment status')
            }
          }
        }

        if (!completed) {
          setPayLoading(false)
          setSuccess('Payment status is still pending. Please fetch fee status again after a moment.')
        }
      }

      const cashfree = window.Cashfree({
        mode: orderResponse.cashfree_mode || 'sandbox',
      })

      cashfree
        .checkout({
          paymentSessionId,
          redirectTarget: '_modal',
        })
        .then(async (paymentResult = {}) => {
          if (completed) return

          try {
            const verifyResponse = await verifyPublicFeePayment({
              cashfree_order_id: cashfreeOrderId,
              cf_payment_id:
                paymentResult?.paymentDetails?.cf_payment_id ||
                paymentResult?.paymentDetails?.payment_id ||
                paymentResult?.cf_payment_id ||
                paymentResult?.payment_id,
              bill_id: activeBill.bill_id,
              mobile: form.mobile.trim(),
            })
            await completePaymentUi(verifyResponse)
          } catch (verifyError) {
            setError(verifyError?.message || 'Payment verification failed')
            setPayLoading(false)
          }
        })
        .catch(() => {
          if (!completed) {
            setSuccess('Checking payment status. Please wait for confirmation.')
          }
        })

      pollPaymentStatus()
    } catch (err) {
      setError(err?.message || 'Unable to start payment')
      setPayLoading(false)
    }
  }

  return (
    <WebsiteLayout>
      <SEO
        title="Online Fee Payment"
        description="Pay Star Public School fees online through the public fee payment portal."
        canonicalPath="/pay-fees"
      />

      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">Online fee payment</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
            Fee status and secure payment
          </h1>
          <p className="mt-4 max-w-2xl text-slate-200">
            {schoolProfile.name} parents can check current fee status and complete payment online.
          </p>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <form onSubmit={handleLookup} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-slate-900">Student details</h2>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Class
                <input
                  required
                  value={form.class}
                  onChange={(event) => handleChange('class', event.target.value)}
                  className="gps-site-input mt-1"
                  placeholder="e.g. 5"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Section
                <input
                  required
                  value={form.section}
                  onChange={(event) => handleChange('section', event.target.value)}
                  className="gps-site-input mt-1"
                  placeholder="A"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Roll Number
                <input
                  required
                  value={form.roll_number}
                  onChange={(event) => handleChange('roll_number', event.target.value)}
                  className="gps-site-input mt-1"
                  inputMode="numeric"
                  placeholder="12"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Fee Month
                <input
                  required
                  type="month"
                  value={form.month}
                  onChange={(event) => handleChange('month', event.target.value)}
                  className="gps-site-input mt-1"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Mobile Number (optional)
                <input
                  value={form.mobile}
                  onChange={(event) => handleChange('mobile', event.target.value)}
                  className="gps-site-input mt-1"
                  inputMode="tel"
                  placeholder="Registered mobile number for WhatsApp receipt"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Provide a registered mobile number if you want a WhatsApp receipt. Otherwise leave blank.
                </p>
              </label>
            </div>

            <button
              type="submit"
              disabled={lookupLoading || payLoading}
              className="gps-site-button mt-6 w-full justify-center !rounded-xl"
            >
              <span className="material-symbols-outlined text-base">{lookupLoading ? 'sync' : 'search'}</span>
              {lookupLoading ? 'Fetching...' : 'Fetch Fee Status'}
            </button>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {success}
              </div>
            ) : null}
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            {!feeData ? (
              <div className="flex min-h-[28rem] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
                <div>
                  <span className="material-symbols-outlined text-4xl text-slate-400">receipt_long</span>
                  <p className="mt-3 text-sm font-semibold text-slate-500">Fee details will appear here</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Student</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">{feeData.student.name}</h2>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <span>Father: {feeData.student.father_name || '--'}</span>
                    <span>Roll: {feeData.student.roll_no || '--'}</span>
                    <span>Class: {feeData.student.class || '--'} - {feeData.student.section || '--'}</span>
                    <span>Month: {activeBill?.month || form.month || '--'}</span>
                  </div>
                </div>

                {activeBill ? (
                  <>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-100">Fee breakdown</p>
                          <p className="text-sm text-slate-200">Month: {activeBill.month}</p>
                        </div>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase">
                          {activeBill.status}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-200">
                        {(activeBill.items || []).map((item, index) => (
                          <div key={`${item.fee_name}-${index}`} className="flex items-center justify-between px-4 py-3 text-sm">
                            <span className="font-medium text-slate-600">{item.fee_name}</span>
                            <span className="font-bold text-slate-900">Rs. {formatAmount(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Total</p>
                        <p className="mt-1 text-lg font-black text-slate-900">Rs. {formatAmount(totalItems || activeBill.total_amount)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Paid</p>
                        <p className="mt-1 text-lg font-black text-emerald-700">Rs. {formatAmount(activeBill.total_paid)}</p>
                      </div>
                      <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-700">Payable</p>
                        <p className="mt-1 text-lg font-black text-slate-900">Rs. {formatAmount(activeBill.net_payable)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={handlePayment}
                        disabled={!canPay || payLoading}
                        className="gps-site-button flex-1 justify-center !rounded-xl disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-base">{payLoading ? 'sync' : 'payments'}</span>
                        {payLoading ? 'Processing...' : canPay ? 'Pay Now' : 'Already Paid'}
                      </button>

                      {receiptUrl ? (
                        <a href={receiptUrl} className="gps-site-button-secondary flex-1 justify-center !rounded-xl">
                          <span className="material-symbols-outlined text-base">download</span>
                          Download Receipt
                        </a>
                      ) : activeBill.net_payable <= 0 ? (
                        <a
                          href={buildPublicReceiptUrl(activeBill.bill_id, form.mobile.trim())}
                          className="gps-site-button-secondary flex-1 justify-center !rounded-xl"
                        >
                          <span className="material-symbols-outlined text-base">download</span>
                          Download Receipt
                        </a>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                    No bill is available for this student.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </WebsiteLayout>
  )
}

export default PublicFeePayment
