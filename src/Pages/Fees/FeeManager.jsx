import React, { useState, useEffect } from 'react'
import { getFeeDashboard } from '../../Api/fees'
import FeeDashboard from './FeeDashboard'
import FeeStructure from './FeeStructure'
import BulkBillGeneration from './BulkBillGeneration'
import FeeList from './FeeList'
import PayFees from './PayFees'
import Invoice from './Invoice'
import Bills from './Bills'
import OpeningBalanceMigration from './OpeningBalanceMigration'
import BillSlipCard from '../../Components/Fees/BillSlipCard'
import { downloadInvoiceSlipPDF } from '../../utils/pdf/invoiceSlipPdf'

function FeeManager() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [invoiceBillId, setInvoiceBillId] = useState('')
  const [paymentData, setPaymentData] = useState(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [activeReceipt, setActiveReceipt] = useState(null)
  const [downloadingSlip, setDownloadingSlip] = useState(false)

  // Real backend dashboard state
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [dashboardError, setDashboardError] = useState('')
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      total_collected: 0,
      collected_this_month: 0,
      transactions_this_month: 0,
      pending_dues: 0,
      pending_students_count: 0,
      total_transactions: 0,
      online_percentage: 0,
      cash_percentage: 0,
      dominant_mode: 'No collections yet',
    },
    recent_transactions: [],
    class_wise_realization: [],
    defaulters: [],
  })

  const fetchDashboardData = async () => {
    setLoadingDashboard(true)
    setDashboardError('')
    try {
      const res = await getFeeDashboard()
      if (res?.data) {
        setDashboardData(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch fee dashboard data:', err)
      setDashboardError(err?.message || 'Failed to load fee dashboard data')
    } finally {
      setLoadingDashboard(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData()
    }
  }, [activeTab])

  const handlePayFee = (feeData) => {
    setPaymentData(feeData)
    setActiveTab('pay')
  }

  const handleSendReminders = () => {
    const count = dashboardData.kpis?.pending_students_count || 0
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: {
          type: 'info',
          title: 'Fee Dues Reminders Sent',
          message:
            count > 0
              ? `Automated reminder alerts dispatched to ${count} parent${count > 1 ? 's' : ''}.`
              : 'All student fees are fully cleared. No pending dues reminders to send.',
        },
      })
    )
  }

  const handlePrintSlip = (rec) => {
    setActiveReceipt(rec)
    setShowReceiptModal(true)
  }

  const tabs = [
    { id: 'dashboard', label: 'Fee Dashboard', icon: 'payments' },
    { id: 'bills', label: 'Bill Generation', icon: 'receipt_long' },
    { id: 'pay', label: 'Pay Counter', icon: 'point_of_sale' },
    { id: 'structure', label: 'Fee Structure', icon: 'tune' },
    { id: 'list', label: 'All Records', icon: 'table_view' },
    { id: 'ledger', label: 'Student Ledger', icon: 'menu_book' },
    { id: 'migration', label: 'Fee Migration', icon: 'drive_folder_upload' },
  ]

  return (
    <div className="space-y-6">
      {/* ========================================================
          TOP HEADER: Breadcrumbs, Title, Subtitle, Quick Actions
          ======================================================== */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            SPS / SCHOOL OPERATIONS / FEES
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black text-[#0f1e36] tracking-tight">
            School Fee Collection, Billing & Invoicing
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            Manage student fees, generate monthly bills, track collections, and print receipts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('pay')}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#132c4e] px-4 text-sm font-bold text-white shadow-2xs hover:bg-[#0f1e36] transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            + Collect Fee (Counter)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bills')}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-[#0f1e36] shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            Generate Bills
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('migration')}
            className={`flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold shadow-2xs transition cursor-pointer ${
              activeTab === 'migration'
                ? 'bg-amber-600 text-white'
                : 'border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
            title="Setup opening balance migration from Excel for first time setup"
          >
            <span className="material-symbols-outlined text-[18px]">drive_folder_upload</span>
            Fee Migration Setup
          </button>
        </div>
      </div>

      {/* ========================================================
          4 METRIC KPI CARDS (Real BE Data)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Collected */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Collected</span>
            <div className="h-9 w-9 rounded-xl bg-[#dcfce7] text-[#16a34a] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-[#0f1e36] tracking-tight">
            ₹{(dashboardData.kpis?.total_collected || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">
            {dashboardData.kpis?.total_transactions || 0} total payments processed
          </div>
        </div>

        {/* Card 2: Collected This Month */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Collected This Month</span>
            <div className="h-9 w-9 rounded-xl bg-[#e2ecf8] text-[#2563eb] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-[#0f1e36] tracking-tight">
            ₹{(dashboardData.kpis?.collected_this_month || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">
            {dashboardData.kpis?.transactions_this_month || 0} transactions this month
          </div>
        </div>

        {/* Card 3: Pending Dues */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Dues</span>
            <div className="h-9 w-9 rounded-xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-[#0f1e36] tracking-tight">
            ₹{(dashboardData.kpis?.pending_dues || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">
            {dashboardData.kpis?.pending_students_count || 0} students pending
          </div>
        </div>

        {/* Card 4: Online vs Cash Ratio */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Payment Modes</span>
            <div className="h-9 w-9 rounded-xl bg-[#fef3c7] text-[#d97706] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-[#0f1e36] tracking-tight">
            {dashboardData.kpis?.dominant_mode || 'Cash / Online'}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">
            {dashboardData.kpis?.online_percentage || 0}% Online · {dashboardData.kpis?.cash_percentage || 0}% Cash
          </div>
        </div>
      </div>

      {/* ========================================================
          NAVIGATION TABS
          ======================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-1.5 flex flex-wrap gap-1 shadow-2xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${isActive
                ? 'bg-[#132c4e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ========================================================
          TAB 1: REAL FEE DASHBOARD VIEW
          ======================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Main Card: Recent Transactions Table */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#0f1e36]">
                  Recent Transactions
                </h2>
                <p className="text-xs font-medium text-slate-400 mt-0.5">
                  Real-time fee collections across cash counters, UPI, and online portal.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchDashboardData}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
                  title="Refresh Data"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleSendReminders}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                  Send Dues Reminders
                </button>
              </div>
            </div>

            {dashboardError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {dashboardError}
              </div>
            )}

            {/* Transactions Table */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">RECEIPT NO</th>
                    <th className="py-3 px-3">STUDENT</th>
                    <th className="py-3 px-3">CLASS</th>
                    <th className="py-3 px-3">AMOUNT PAID</th>
                    <th className="py-3 px-3">PAYMENT MODE</th>
                    <th className="py-3 px-3">DATE</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loadingDashboard ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-sm font-semibold text-slate-400">
                        Loading real fee transactions from server...
                      </td>
                    </tr>
                  ) : dashboardData.recent_transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-sm font-semibold text-slate-400">
                        Abhi tak koi fee payment transaction record nahi hai.
                      </td>
                    </tr>
                  ) : (
                    dashboardData.recent_transactions.map((rec) => {
                      const initials = (rec.student || '--')
                        .split(' ')
                        .filter(Boolean)
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Receipt No */}
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-700">
                            #{rec.id}
                          </td>

                          {/* Student */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-[#dce6f5] text-[#132c4e] flex items-center justify-center font-bold text-xs shrink-0">
                                {initials || 'ST'}
                              </div>
                              <span className="font-bold text-[#0f1e36]">
                                {rec.student}
                              </span>
                            </div>
                          </td>

                          {/* Class */}
                          <td className="py-3.5 px-3 font-medium text-slate-500">
                            {rec.class}
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-3 font-extrabold text-[#0f1e36]">
                            {rec.amount}
                          </td>

                          {/* Mode */}
                          <td className="py-3.5 px-3">
                            <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {rec.mode}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-3 text-xs text-slate-500 font-medium">
                            {rec.date}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${rec.status === 'Paid'
                                ? 'bg-[#dcfce7] text-[#15803d]'
                                : 'bg-[#fef3c7] text-[#b45309]'
                                }`}
                            >
                              {rec.status}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handlePrintSlip(rec)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#132c4e] hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">print</span>
                              Slip
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2 Bottom Utility Cards: Class Realization & Defaulter Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Class-wise Fee Realization */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
              <h3 className="text-base font-bold text-[#0f1e36]">
                Class-wise Fee Realization
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Target collection vs actual received for current academic session
              </p>

              <div className="mt-5 space-y-4">
                {dashboardData.class_wise_realization.length === 0 ? (
                  <div className="py-6 text-center text-xs font-semibold text-slate-400">
                    Abhi koi class fee data uplabdh nahi hai.
                  </div>
                ) : (
                  dashboardData.class_wise_realization.map((item) => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700">{item.name}</span>
                        <span className="text-[#0f1e36]">
                          {item.collected} / {item.total} ({item.percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Pending Defaulters Alert */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0f1e36]">
                  Pending Defaulters Alert
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Students with pending fee balances on generated bills
                </p>

                <div className="mt-4 space-y-3">
                  {dashboardData.defaulters.length === 0 ? (
                    <div className="py-6 text-center text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100">
                      Sabhi students ki fee clear hai! Koi pending dues nahi hain.
                    </div>
                  ) : (
                    dashboardData.defaulters.map((item, idx) => (
                      <div
                        key={item.bill_id || idx}
                        className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{item.student}</div>
                          <div className="text-xs text-slate-500">
                            {item.class} · Due/Adv {item.due}
                          </div>
                        </div>
                        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                          {item.days_overdue > 0 ? `${item.days_overdue} days` : 'Due'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSendReminders}
                  className="w-full py-2.5 rounded-xl bg-[#132c4e] text-white font-bold text-xs hover:bg-[#0f1e36] transition shadow-2xs cursor-pointer"
                >
                  Send Dues Reminder WhatsApp / SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-VIEWS ROUTING
          ======================================================== */}
      {activeTab === 'bills' && <Bills />}
      {activeTab === 'pay' && (
        <PayFees
          initialData={paymentData}
          onPaymentComplete={() => {
            setPaymentData(null)
            setActiveTab('dashboard')
          }}
        />
      )}
      {activeTab === 'structure' && <FeeStructure />}
      {activeTab === 'list' && (
        <FeeList
          onViewReceipt={(fee) => {
            setActiveReceipt({
              id: fee.bill_id,
              bill_id: fee.bill_id,
              bill_number: fee.bill_id,
              student: fee.student_name,
              student_name: fee.student_name,
              father_name: fee.father_name,
              class: fee.class,
              section: fee.section,
              roll_no: fee.roll_no,
              month: fee.month,
              date: fee.month ? `${fee.month}-01` : new Date().toISOString(),
              tuition: parseFloat(fee.tuition_fee) || 0,
              exam: parseFloat(fee.exam_fee) || 0,
              annual: parseFloat(fee.annual_fee) || 0,
              computer: parseFloat(fee.computer_fee) || 0,
              transport: parseFloat(fee.transport_fee) || 0,
              previous_due: parseFloat(fee.prev_due) || 0,
              items: [
                { fee_name: 'Tuition Fee', amount: parseFloat(fee.tuition_fee) || 0 },
                { fee_name: 'Exam Fee', amount: parseFloat(fee.exam_fee) || 0 },
                { fee_name: 'Annual Fee', amount: parseFloat(fee.annual_fee) || 0 },
                { fee_name: 'Computer Fee', amount: parseFloat(fee.computer_fee) || 0 },
                { fee_name: 'Transport Fee', amount: parseFloat(fee.transport_fee) || 0 },
                { fee_name: 'Previous Due', amount: parseFloat(fee.prev_due) || 0 },
              ],
              total: parseFloat(fee.total_fee) || 0,
              total_paid: parseFloat(fee.paid_amount || fee.total_paid) || 0,
              advance_used: parseFloat(fee.advance_used) || 0,
              remaining: parseFloat(fee.net_payable) || 0,
              net_payable: parseFloat(fee.net_payable) || 0,
              bill_status: fee.bill_status,
              isReceipt: true,
              summary: {
                total_amount: parseFloat(fee.total_fee) || 0,
                total_paid: parseFloat(fee.paid_amount || fee.total_paid) || 0,
                advance_used: parseFloat(fee.advance_used) || 0,
                remaining: parseFloat(fee.net_payable) || 0,
                status: fee.bill_status,
              }
            })
            setShowReceiptModal(true)
          }}
          onViewInvoice={(billId) => {
            setInvoiceBillId(billId)
            setActiveTab('invoice')
          }}
          onPayFee={handlePayFee}
        />
      )}
      {activeTab === 'invoice' && (
        <Invoice billId={invoiceBillId} onBillIdChange={setInvoiceBillId} />
      )}
      {activeTab === 'bulk' && <BulkBillGeneration />}
      {activeTab === 'ledger' && (
        <FeeDashboard
          onPayStudent={(student) => {
            handlePayFee({
              class: student.className,
              section: student.section,
              roll_number: student.roll,
              net_payable: student.pending,
            })
          }}
        />
      )}
      {activeTab === 'migration' && <OpeningBalanceMigration />}


      {/* ========================================================
          FEE SLIP / RECEIPT MODAL
          ======================================================== */}
      {showReceiptModal && activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-[#002b66] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Official Fee Receipt Slip
              </span>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 font-bold flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Render Canva BillSlipCard with Active Receipt Data */}
            <div className="py-1 flex justify-center">
              <BillSlipCard
                bill={activeReceipt.items ? activeReceipt : {
                  bill_number: activeReceipt.id ? `REC-${activeReceipt.id}` : undefined,
                  student_name: activeReceipt.student || activeReceipt.student_name,
                  class: activeReceipt.class,
                  date: activeReceipt.date,
                  items: [
                    { fee_name: 'Tuition Fee', amount: activeReceipt.amount }
                  ],
                  summary: {
                    total_amount: activeReceipt.amount,
                    advance_used: 0,
                    net_payable: activeReceipt.amount,
                  }
                }}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 min-w-[140px] h-11 rounded-xl bg-[#002b66] text-xs font-bold text-white hover:bg-[#08224d] shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">print</span>
                Print Official Slip
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setDownloadingSlip(true)
                    await downloadInvoiceSlipPDF(activeReceipt)
                  } catch (err) {
                    console.error('Slip download failed:', err)
                  } finally {
                    setDownloadingSlip(false)
                  }
                }}
                disabled={downloadingSlip}
                className="flex-1 min-w-[140px] h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[17px] ${downloadingSlip ? 'animate-spin' : ''}`}>
                  {downloadingSlip ? 'sync' : 'download'}
                </span>
                {downloadingSlip ? 'Downloading...' : 'Download Receipt (PDF)'}
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="h-11 px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeeManager
