import React, { useState } from 'react'
import FeeDashboard from './FeeDashboard'
import FeeStructure from './FeeStructure'
import BulkBillGeneration from './BulkBillGeneration'
import FeeList from './FeeList'
import PayFees from './PayFees'
import Invoice from './Invoice'
import Bills from './Bills'
import OpeningBalanceMigration from './OpeningBalanceMigration'
import BillSlipCard from '../../Components/Fees/BillSlipCard'

function FeeManager() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [invoiceBillId, setInvoiceBillId] = useState('')
  const [paymentData, setPaymentData] = useState(null)
  const [showCollectModal, setShowCollectModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [activeReceipt, setActiveReceipt] = useState(null)

  // Collect Counter State
  const [searchStudent, setSearchStudent] = useState('Aarav Patel (Class 10-A, Roll: 1001)')
  const [feeHeads, setFeeHeads] = useState([
    { id: 'tuition', name: 'Tuition Fee (October 2026)', amount: 2500, selected: true },
    { id: 'lab', name: 'Computer & Science Lab Fee', amount: 600, selected: true },
    { id: 'transport', name: 'Transport / Bus Fee (Route 3)', amount: 1200, selected: true },
    { id: 'exam', name: 'Annual Exam Fee', amount: 800, selected: false },
  ])
  const [paymentMode, setPaymentMode] = useState('UPI / QR Code')
  const [discountPercent, setDiscountPercent] = useState(5)

  // Recent Transactions Data (matching Canva blueprint)
  const [transactions, setTransactions] = useState([
    {
      id: 'REC-9821',
      student: 'Aarav Patel',
      class: 'Class 10-A',
      amount: '₹4,500',
      mode: 'UPI (PhonePe)',
      date: 'Today, 10:24 AM',
      status: 'Paid',
    },
    {
      id: 'REC-9820',
      student: 'Diya Sharma',
      class: 'Class 10-A',
      amount: '₹3,200',
      mode: 'Cash Counter',
      date: 'Today, 09:45 AM',
      status: 'Paid',
    },
    {
      id: 'REC-9819',
      student: 'Aanya Rao',
      class: 'Class 10-A',
      amount: '₹4,500',
      mode: 'Netbanking',
      date: 'Yesterday, 04:15 PM',
      status: 'Paid',
    },
    {
      id: 'REC-9818',
      student: 'Rehan Khan',
      class: 'Class 10-A',
      amount: '₹2,500',
      mode: 'Cash Counter',
      date: 'Yesterday, 02:30 PM',
      status: 'Partial',
    },
    {
      id: 'REC-9817',
      student: 'Kabir Verma',
      class: 'Class 10-B',
      amount: '₹4,500',
      mode: 'UPI (Paytm)',
      date: '14 Oct 2026',
      status: 'Paid',
    },
    {
      id: 'REC-9816',
      student: 'Meera Iyer',
      class: 'Class 9-A',
      amount: '₹3,800',
      mode: 'Cheque (#00421)',
      date: '14 Oct 2026',
      status: 'Paid',
    },
  ])

  // Calculation for modal
  const subtotal = feeHeads.filter((h) => h.selected).reduce((acc, h) => acc + h.amount, 0)
  const discountAmount = Math.round((subtotal * discountPercent) / 100)
  const netPayable = subtotal - discountAmount

  const handleToggleHead = (id) => {
    setFeeHeads((prev) =>
      prev.map((h) => (h.id === id ? { ...h, selected: !h.selected } : h))
    )
  }

  const handlePayFee = (feeData) => {
    setPaymentData(feeData)
    setActiveTab('pay')
  }

  const handleConfirmCollect = (e) => {
    e.preventDefault()
    const newRec = {
      id: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      student: searchStudent.split('(')[0].trim(),
      class: 'Class 10-A',
      amount: `₹${netPayable.toLocaleString('en-IN')}`,
      mode: paymentMode,
      date: 'Just now',
      status: 'Paid',
    }

    setTransactions((prev) => [newRec, ...prev])
    setShowCollectModal(false)
    setActiveReceipt(newRec)
    setShowReceiptModal(true)

    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: {
          type: 'success',
          title: 'Fee Payment Received',
          message: `Receipt #${newRec.id} generated for ${newRec.student} (${newRec.amount}).`,
        },
      })
    )
  }

  const handleSendReminders = () => {
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: {
          type: 'info',
          title: 'Fee Dues Reminders Sent',
          message: 'Automated SMS & WhatsApp payment links dispatched to 48 parents.',
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
        </div>
      </div>

      {/* ========================================================
          4 METRIC KPI CARDS (Canva Design)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Collected */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Collected (Term 1)</span>
            <div className="h-9 w-9 rounded-xl bg-[#dcfce7] text-[#16a34a] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-[#0f1e36] tracking-tight">
            ₹42,85,000
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">
            89.4% collection target
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
            ₹6,40,000
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">
            142 transactions processed
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
            ₹3,20,000
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">
            48 students pending
          </div>
        </div>

        {/* Card 4: Online vs Cash Ratio */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Online vs Cash Ratio</span>
            <div className="h-9 w-9 rounded-xl bg-[#fef3c7] text-[#d97706] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-[#0f1e36] tracking-tight">
            72% Online
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">
            UPI / Netbanking dominant
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
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all flex items-center gap-2 ${
                isActive
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
          TAB 1: CANVA FEE DASHBOARD VIEW
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
                  onClick={handleSendReminders}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                  Send Dues Reminders
                </button>
              </div>
            </div>

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
                  {transactions.map((rec) => {
                    const initials = rec.student
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')

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
                              {initials}
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
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              rec.status === 'Paid'
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
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#132c4e] hover:bg-slate-50 transition shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[14px]">print</span>
                            Slip
                          </button>
                        </td>
                      </tr>
                    )
                  })}
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
                {[
                  { name: 'Class 10', percent: 97, collected: '₹9.8L', total: '₹10.1L', color: 'bg-emerald-500' },
                  { name: 'Class 9', percent: 92, collected: '₹8.4L', total: '₹9.1L', color: 'bg-emerald-500' },
                  { name: 'Class 8', percent: 88, collected: '₹7.6L', total: '₹8.6L', color: 'bg-blue-500' },
                  { name: 'Class 7', percent: 84, collected: '₹6.9L', total: '₹8.2L', color: 'bg-amber-500' },
                ].map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="text-[#0f1e36]">{item.collected} / {item.total} ({item.percent}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Pending Defaulters Alert */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0f1e36]">
                  Pending Defaulters Alert
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Overdue tuition fee greater than 60 days
                </p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Rahul Soni</div>
                      <div className="text-xs text-slate-500">Class 10-A · Due ₹6,500</div>
                    </div>
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">62 days</span>
                  </div>

                  <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Priyanka Das</div>
                      <div className="text-xs text-slate-500">Class 9-B · Due ₹4,200</div>
                    </div>
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">75 days</span>
                  </div>

                  <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Tanveer Ansari</div>
                      <div className="text-xs text-slate-500">Class 8-A · Due ₹3,800</div>
                    </div>
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">80 days</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSendReminders}
                  className="w-full py-2.5 rounded-xl bg-[#132c4e] text-white font-bold text-xs hover:bg-[#0f1e36] transition shadow-2xs"
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
      {activeTab === 'migration' && <OpeningBalanceMigration />}

      {/* ========================================================
          COLLECT FEE COUNTER MODAL (Cashier Screen)
          ======================================================== */}
      {showCollectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#132c4e] text-xl">point_of_sale</span>
                <h3 className="text-base font-bold text-[#0f1e36]">Collect Fee Counter</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCollectModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCollect} className="mt-4 space-y-4">
              {/* Student Search */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Select Student</label>
                <input
                  type="text"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>

              {/* Fee Heads Checklist */}
              <div>
                <span className="block text-xs font-bold text-slate-500 mb-1.5">Fee Heads Checklist</span>
                <div className="space-y-2 rounded-xl border border-slate-200 p-3 bg-[#f8fafc]">
                  {feeHeads.map((head) => (
                    <label
                      key={head.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 cursor-pointer hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={head.selected}
                          onChange={() => handleToggleHead(head.id)}
                          className="h-4 w-4 rounded text-[#132c4e] focus:ring-0 cursor-pointer"
                        />
                        <span>{head.name}</span>
                      </div>
                      <span className="text-xs font-black text-[#0f1e36]">
                        ₹{head.amount.toLocaleString('en-IN')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subtotal, Discount, Net Total */}
              <div className="rounded-xl bg-slate-50 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Sibling Discount (5%):</span>
                  <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-[#0f1e36] pt-1.5 border-t border-slate-200">
                  <span>Net Payable Total:</span>
                  <span>₹{netPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Mode Pills */}
              <div>
                <span className="block text-xs font-bold text-slate-500 mb-1.5">Payment Method</span>
                <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                  {['Cash', 'UPI / QR Code', 'Cheque', 'Card'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 rounded-xl border text-center transition ${
                        paymentMode === mode
                          ? 'border-[#132c4e] bg-[#132c4e] text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="flex-1 h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-[#132c4e] text-xs font-bold text-white hover:bg-[#0f1e36] shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  Collect & Print Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                bill={{
                  bill_number: activeReceipt.id ? `REC-${activeReceipt.id}` : undefined,
                  student_name: activeReceipt.student,
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

            <div className="mt-5 flex gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 h-11 rounded-xl bg-[#002b66] text-xs font-bold text-white hover:bg-[#08224d] shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">print</span>
                Print Official Slip
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
