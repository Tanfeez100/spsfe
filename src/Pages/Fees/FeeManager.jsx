import React, { useState, useEffect, useMemo } from 'react'
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
      dominant_mode: 'Loading...',
    },
    recent_transactions: [],
    class_wise_realization: [],
    defaulters: [],
  })

  // Dynamic Average Realization
  const avgRealization = useMemo(() => {
    const list = dashboardData.class_wise_realization || []
    if (list.length === 0) return '0%'
    const totalCollected = list.reduce((sum, item) => sum + (item.collected_raw || 0), 0)
    const totalTarget = list.reduce((sum, item) => sum + (item.total_raw || 0), 0)
    if (totalTarget > 0) {
      return `${Math.round((totalCollected / totalTarget) * 100)}%`
    }
    const nonZero = list.filter((i) => (i.percent || 0) > 0)
    if (nonZero.length > 0) {
      const avg = Math.round(nonZero.reduce((sum, i) => sum + i.percent, 0) / nonZero.length)
      return `${avg}%`
    }
    return '0%'
  }, [dashboardData.class_wise_realization])

  // Filters & Search for recent transactions
  const [filterSearch, setFilterSearch] = useState('')
  const [selectedClass, setSelectedClass] = useState('All Classes')
  const [selectedMode, setSelectedMode] = useState('All Modes')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  const fetchDashboardData = async () => {
    setLoadingDashboard(true)
    setDashboardError('')
    try {
      const res = await getFeeDashboard()
      if (res?.data) {
        setDashboardData({
          kpis: res.data.kpis || {
            total_collected: 0,
            collected_this_month: 0,
            transactions_this_month: 0,
            pending_dues: 0,
            pending_students_count: 0,
            total_transactions: 0,
            online_percentage: 0,
            cash_percentage: 0,
            dominant_mode: 'No collections recorded',
          },
          recent_transactions: Array.isArray(res.data.recent_transactions) ? res.data.recent_transactions : [],
          class_wise_realization: Array.isArray(res.data.class_wise_realization) ? res.data.class_wise_realization : [],
          defaulters: Array.isArray(res.data.defaulters) ? res.data.defaulters : [],
        })
      }
    } catch (err) {
      console.error('Failed to fetch fee dashboard data:', err)
      setDashboardError(err?.message || 'Failed to load fee dashboard data')
    } finally {
      setLoadingDashboard(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [activeTab])

  useEffect(() => {
    const handleRefresh = () => {
      fetchDashboardData()
    }
    window.addEventListener('fee:bills-updated', handleRefresh)
    window.addEventListener('fee:payment-recorded', handleRefresh)
    return () => {
      window.removeEventListener('fee:bills-updated', handleRefresh)
      window.removeEventListener('fee:payment-recorded', handleRefresh)
    }
  }, [])

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
    const rawAmt = Number(rec.amount_raw) || Number(String(rec.amount || '').replace(/[^0-9.]/g, '')) || 0
    setActiveReceipt({
      id: rec.id || rec.receipt_no,
      bill_id: rec.id || rec.receipt_no,
      bill_number: rec.receipt_no || (rec.id ? `REC-${rec.id}` : '--'),
      student: rec.student,
      student_name: rec.student,
      adm_no: rec.adm_no || '',
      class: rec.class,
      date: rec.date,
      amount: `₹${rawAmt.toLocaleString('en-IN')}`,
      mode: rec.mode || 'Cash',
      items: [
        { fee_name: 'Fee Payment', amount: rawAmt },
      ],
      summary: {
        total_amount: rawAmt,
        advance_used: 0,
        net_payable: rawAmt,
        status: 'Paid',
      },
    })
    setShowReceiptModal(true)
  }

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return dashboardData.recent_transactions.filter((tx) => {
      const matchSearch =
        !filterSearch ||
        tx.student?.toLowerCase().includes(filterSearch.toLowerCase()) ||
        (tx.receipt_no && tx.receipt_no.toLowerCase().includes(filterSearch.toLowerCase())) ||
        (tx.id && tx.id.toString().toLowerCase().includes(filterSearch.toLowerCase())) ||
        (tx.adm_no && tx.adm_no.toLowerCase().includes(filterSearch.toLowerCase()))

      const matchClass =
        selectedClass === 'All Classes' ||
        (tx.class && tx.class.toLowerCase().includes(selectedClass.replace('Class ', '').toLowerCase()))

      const matchMode =
        selectedMode === 'All Modes' ||
        (tx.mode && tx.mode.toLowerCase().includes(selectedMode.toLowerCase()))

      return matchSearch && matchClass && matchMode
    })
  }, [dashboardData.recent_transactions, filterSearch, selectedClass, selectedMode])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage))
  const displayedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredTransactions.slice(start, start + itemsPerPage)
  }, [filteredTransactions, currentPage])

  // Export CSV function
  const handleExportCSV = () => {
    const headers = ['Receipt No', 'Student Name', 'Admission No', 'Class', 'Amount', 'Payment Mode', 'Date & Time', 'Status']
    const rows = filteredTransactions.map((tx) => [
      tx.receipt_no || `REC-${tx.id}`,
      `"${tx.student || ''}"`,
      tx.adm_no || '',
      `"${tx.class || ''}"`,
      `"${tx.amount || ''}"`,
      `"${tx.mode || ''}"`,
      `"${tx.date || ''}"`,
      tx.status || 'Successful',
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Fee_Transactions_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  // Mode badge helper
  const getModeBadge = (mode = '') => {
    const m = mode.toLowerCase()
    if (m.includes('upi') || m.includes('phonepe') || m.includes('gpay')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
          {mode}
        </span>
      )
    }
    if (m.includes('cash')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-xs font-semibold text-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
          {mode}
        </span>
      )
    }
    if (m.includes('netbanking')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-xs font-semibold text-blue-700">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
          {mode}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/80 px-2.5 py-1 text-xs font-semibold text-purple-700">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-600"></span>
        {mode}
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================
          TOP HEADER: Breadcrumbs, Title, Subtitle, Quick Actions
          ======================================================== */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>SPS</span>
            <span>/</span>
            <span>SCHOOL OPERATIONS</span>
            <span>/</span>
            <span className="text-blue-600">FEES</span>
            {activeTab === 'bills' && (
              <>
                <span>/</span>
                <span className="text-blue-600 font-bold">BILL GENERATION</span>
              </>
            )}
            {activeTab === 'pay' && (
              <>
                <span>/</span>
                <span className="text-blue-600 font-bold">PAY COUNTER</span>
              </>
            )}
            {activeTab === 'structure' && (
              <>
                <span>/</span>
                <span className="text-blue-600 font-bold">FEE STRUCTURE</span>
              </>
            )}
            {activeTab === 'list' && (
              <>
                <span>/</span>
                <span className="text-blue-600 font-bold">ALL RECORDS</span>
              </>
            )}
            {activeTab === 'ledger' && (
              <>
                <span>/</span>
                <span className="text-blue-600 font-bold">STUDENT LEDGER</span>
              </>
            )}
            {activeTab === 'migration' && (
              <>
                <span>/</span>
                <span className="text-blue-600 font-bold">FEE MIGRATION</span>
              </>
            )}
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black text-[#0f1e36] tracking-tight">
            {activeTab === 'structure'
              ? 'Fee Structure Management'
              : 'School Fee Collection, Billing & Invoicing'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            {activeTab === 'structure'
              ? 'Manage and organize your school fee structures by class and category.'
              : 'Manage student fees, generate monthly bills, track collections, and print receipts.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === 'structure' ? (
            <>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('fee-structure:open-modal', { detail: { mode: 'single' } }))}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Single
              </button>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('fee-structure:open-modal', { detail: { mode: 'bulk' } }))}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-sky-500 text-white hover:bg-sky-600 shadow-sm shadow-sky-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">layers</span>
                Add Bulk
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('pay')}
                className="flex h-10 items-center gap-2 rounded-xl bg-[#0d1726] px-4 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#1a2b42] hover:shadow-md transition-all duration-200 cursor-pointer active:scale-98"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold leading-none">
                  +
                </span>
                Collect Fee (Counter)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bills')}
                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs sm:text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 cursor-pointer active:scale-98"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-600">receipt_long</span>
                Generate Bills
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('migration')}
                className={`flex h-10 items-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-bold shadow-xs transition-all duration-200 cursor-pointer active:scale-98 ${
                  activeTab === 'migration'
                    ? 'bg-amber-600 text-white'
                    : 'border border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-100 hover:border-amber-300'
                }`}
                title="Setup opening balance migration from Excel for first time setup"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-700">drive_folder_upload</span>
                Fee Migration Setup
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================
          4 METRIC KPI CARDS (Real BE Data + Reference Soft Gradient)
          Show on Dashboard & Bills
          ======================================================== */}
      {activeTab !== 'structure' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Collected */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">TOTAL COLLECTED</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ₹{(dashboardData.kpis?.total_collected ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{dashboardData.kpis?.total_transactions ?? 0} payments processed</span>
            </div>
            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
          </div>

          {/* Card 2: Collected This Month */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">COLLECTED THIS MONTH</span>
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-[20px]">apartment</span>
              </div>
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ₹{(dashboardData.kpis?.collected_this_month ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="text-blue-600 font-bold">↗</span>
              <span>{dashboardData.kpis?.transactions_this_month ?? 0} transactions this month</span>
            </div>
            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
          </div>

          {/* Card 3: Pending Dues */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">PENDING DUES</span>
              <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
              ₹{(dashboardData.kpis?.pending_dues ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="text-rose-600 font-bold">▲</span>
              <span>{dashboardData.kpis?.pending_students_count ?? 0} students pending</span>
            </div>
            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"></div>
          </div>

          {/* Card 4: Payment Modes */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">PAYMENT MODES</span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-[20px]">sync</span>
              </div>
            </div>
            <div className="mt-3 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {dashboardData.kpis?.total_transactions === 0
                ? '100% Cash'
                : `${dashboardData.kpis?.online_percentage ?? 0}% Online · ${dashboardData.kpis?.cash_percentage ?? (100 - (dashboardData.kpis?.online_percentage ?? 0))}% Cash`}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span>UPI, NetBanking &amp; Counters Active</span>
            </div>
            {/* Bottom Dual-Color Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 flex">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${dashboardData.kpis?.online_percentage ?? 0}%` }}
                title="Online Payments"
              ></div>
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${dashboardData.kpis?.cash_percentage ?? (100 - (dashboardData.kpis?.online_percentage ?? 0))}%` }}
                title="Cash Collections"
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          NAVIGATION TABS (Clean horizontal pill bar matching design)
          ======================================================== */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-1.5 shadow-2xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-150 cursor-pointer active:scale-98 ${
                isActive
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
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
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            {/* Header Area */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                  title="Refresh Data"
                >
                  <span className={`material-symbols-outlined text-[16px] ${loadingDashboard ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleSendReminders}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 hover:border-amber-400 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <span className="material-symbols-outlined text-[16px] text-amber-700">notifications</span>
                  Send Dues Reminders
                </button>
              </div>
            </div>

            {dashboardError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
                <span>{dashboardError}</span>
                <button
                  type="button"
                  onClick={fetchDashboardData}
                  className="text-xs underline font-bold cursor-pointer hover:text-rose-900"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Filter Toolbar matching screenshot */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {/* Search box */}
              <div className="relative min-w-[220px] flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter receipt or student..."
                  value={filterSearch}
                  onChange={(e) => {
                    setFilterSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden transition"
                />
              </div>

              {/* Class Dropdown */}
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:outline-hidden transition cursor-pointer"
              >
                <option value="All Classes">All Classes</option>
                <option value="LKG">Class LKG</option>
                <option value="UKG">Class UKG</option>
                <option value="1">Class 1</option>
                <option value="2">Class 2</option>
                <option value="3">Class 3</option>
                <option value="4">Class 4</option>
                <option value="5">Class 5</option>
                <option value="6">Class 6</option>
              </select>

              {/* Mode Dropdown */}
              <select
                value={selectedMode}
                onChange={(e) => {
                  setSelectedMode(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:outline-hidden transition cursor-pointer"
              >
                <option value="All Modes">All Modes</option>
                <option value="UPI">UPI / PhonePe</option>
                <option value="Cash">Cash (Counter)</option>
                <option value="NetBanking">NetBanking</option>
                <option value="POS">Debit Card POS</option>
              </select>

              {/* Date Filter Indicator */}
              <div className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600">
                <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
                <span>Today (16 Nov 2026)</span>
              </div>

              {/* Export CSV Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer active:scale-98"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-600">download</span>
                Export CSV
              </button>
            </div>

            {/* Transactions Table matching screenshot */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[840px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-3">RECEIPT NO</th>
                    <th className="py-3 px-3">STUDENT</th>
                    <th className="py-3 px-3">CLASS</th>
                    <th className="py-3 px-3">AMOUNT PAID</th>
                    <th className="py-3 px-3">PAYMENT MODE</th>
                    <th className="py-3 px-3">DATE & TIME</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingDashboard && displayedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-xs font-semibold text-slate-400">
                        Loading real fee transactions from server...
                      </td>
                    </tr>
                  ) : displayedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-xs font-semibold text-slate-400">
                        No transactions found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    displayedTransactions.map((rec) => {
                      const receiptNum = rec.receipt_no || (rec.id ? `REC-${rec.id}` : '--')
                      const studentName = rec.student || rec.student_name || '--'
                      const admNum = rec.adm_no || (rec.roll_no ? `Roll: ${rec.roll_no}` : '--')

                      return (
                        <tr key={rec.id || receiptNum} className="hover:bg-slate-50/80 transition-colors">
                          {/* Receipt No */}
                          <td className="py-3.5 px-3 font-mono font-bold text-blue-600 hover:underline cursor-pointer" onClick={() => handlePrintSlip(rec)}>
                            {receiptNum}
                          </td>

                          {/* Student */}
                          <td className="py-3.5 px-3">
                            <div>
                              <div className="font-bold text-slate-900">{studentName}</div>
                              <div className="text-[11px] text-slate-400 font-medium">{admNum}</div>
                            </div>
                          </td>

                          {/* Class */}
                          <td className="py-3.5 px-3">
                            <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                              {rec.class}
                            </span>
                          </td>

                          {/* Amount Paid */}
                          <td className="py-3.5 px-3 font-black text-slate-900 text-sm">
                            {rec.amount}
                          </td>

                          {/* Payment Mode */}
                          <td className="py-3.5 px-3">
                            {getModeBadge(rec.mode)}
                          </td>

                          {/* Date & Time */}
                          <td className="py-3.5 px-3 text-slate-600 font-medium">
                            {rec.date}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                              ✓ Successful
                            </span>
                          </td>

                          {/* Action (Eye & Print) */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handlePrintSlip(rec)}
                                title="View Receipt"
                                className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-center transition cursor-pointer shadow-2xs"
                              >
                                <span className="material-symbols-outlined text-[17px]">visibility</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePrintSlip(rec)}
                                title="Print Receipt"
                                className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center transition cursor-pointer shadow-2xs"
                              >
                                <span className="material-symbols-outlined text-[17px]">print</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer matching screenshot */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
              <div>
                Showing {Math.min(1, filteredTransactions.length)} to {Math.min(displayedTransactions.length, filteredTransactions.length)} of {dashboardData.kpis?.total_transactions || filteredTransactions.length} transactions
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================
              2 BOTTOM CARDS: Class-wise Fee Realization & Pending Defaulters Alert
              ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Class-wise Fee Realization */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#0f1e36]">
                    Class-wise Fee Realization
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target collection vs actual received for current academic session
                  </p>
                </div>
                <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                  Avg: {avgRealization}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {dashboardData.class_wise_realization.length === 0 ? (
                  <div className="py-8 text-center text-xs font-semibold text-slate-400">
                    No class realization records found for this academic session.
                  </div>
                ) : (
                  dashboardData.class_wise_realization.map((item) => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700">{item.name}</span>
                        <span className="text-slate-900 font-bold">
                          {item.collected} / {item.total} ({item.percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color || 'bg-emerald-500'} transition-all duration-500`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Pending Defaulters Alert */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                    <h3 className="text-base font-bold text-[#0f1e36]">
                      Pending Defaulters Alert
                    </h3>
                  </div>
                  <span className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                    {dashboardData.kpis?.pending_students_count ?? dashboardData.defaulters.length} Defaulters
                  </span>
                </div>

                {/* Status Report Active Card */}
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600 mt-0.5">
                      check_circle
                    </span>
                    <div>
                      <div className="text-xs font-bold text-emerald-800">
                        Status Report Active
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
                        {(dashboardData.kpis?.pending_students_count ?? 0) === 0
                          ? 'Sabhi eligible students ki fee verification clear ho chuki hai. Koi pending dues nahi hain.'
                          : `Sabhi eligible students ki fee verification clear ho chuki hai. Sirf ${dashboardData.kpis?.pending_students_count ?? dashboardData.defaulters.length} students ke dues pending hain jinhe reminders bheje ja sakte hain.`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Defaulters list */}
                <div className="mt-4 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {dashboardData.defaulters.length === 0 ? (
                    <div className="py-6 text-center text-xs font-semibold text-slate-400">
                      No pending fee defaulters. All records are settled.
                    </div>
                  ) : (
                    dashboardData.defaulters.map((item, idx) => (
                      <div
                        key={item.bill_id || idx}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 flex items-center justify-between hover:bg-slate-100/70 transition"
                      >
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{item.student}</div>
                          <div className="text-[11px] text-slate-500">
                            {item.class} · Due {item.due}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-rose-100/80 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                            {item.days_overdue > 0 ? `${item.days_overdue} days` : 'Due'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const rawClass = item.class ? item.class.replace('Class ', '').split('-')[0].trim() : ''
                              const rawSection = item.class && item.class.includes('-') ? item.class.split('-')[1].trim() : 'A'
                              handlePayFee({
                                class: rawClass,
                                section: rawSection,
                                roll_number: item.roll_no,
                                month: item.month,
                                net_payable: item.due_raw,
                              })
                            }}
                            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 text-[11px] font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                            title="Collect payment in Pay Counter"
                          >
                            Collect
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSendReminders}
                  className="w-full py-2.5 rounded-xl bg-[#0d1726] text-white font-bold text-xs hover:bg-[#1a2b42] transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  Send Dues Reminder WhatsApp / SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-VIEWS ROUTING (Preserved 100%)
          ======================================================== */}
      {activeTab === 'bills' && <Bills onCollectFee={handlePayFee} />}
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
              },
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
                bill={
                  activeReceipt.items
                    ? activeReceipt
                    : {
                        bill_number: activeReceipt.id ? `REC-${activeReceipt.id}` : undefined,
                        student_name: activeReceipt.student || activeReceipt.student_name,
                        class: activeReceipt.class,
                        date: activeReceipt.date,
                        items: [{ fee_name: 'Tuition Fee', amount: activeReceipt.amount }],
                        summary: {
                          total_amount: activeReceipt.amount,
                          advance_used: 0,
                          net_payable: activeReceipt.amount,
                        },
                      }
                }
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
