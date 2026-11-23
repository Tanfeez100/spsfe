import React, { useState, useEffect, useMemo } from 'react'
import { getFeeList } from '../../Api/fees'
import * as XLSX from 'xlsx'
import { CLASS_OPTIONS, SECTION_OPTIONS, normalizeSchoolClass } from '../../constants/schoolOptions'
import { downloadInvoiceSlipPDF } from '../../utils/pdf/invoiceSlipPdf'

const getAvatarColor = (name = '', roll = '') => {
  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-700' },
    { bg: 'bg-purple-100', text: 'text-purple-700' },
    { bg: 'bg-teal-100', text: 'text-teal-700' },
    { bg: 'bg-amber-100', text: 'text-amber-700' },
    { bg: 'bg-rose-100', text: 'text-rose-700' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  ]
  const str = String(name || roll || '')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

const getInitials = (name = '') => {
  if (!name) return '--'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

function FeeList({ onViewInvoice, onViewReceipt, onPayFee }) {
  const PAGE_SIZE = 15
  const [feeList, setFeeList] = useState([])
  const [loading, setLoading] = useState(false)
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState('')
  const [error, setError] = useState('')

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'paid', 'unpaid', 'partial'
  const [currentPage, setCurrentPage] = useState(1)

  const handleDownloadInvoiceDirect = async (billId) => {
    if (!billId) return
    setDownloadingInvoiceId(billId)
    setError('')
    try {
      await downloadInvoiceSlipPDF(billId)
    } catch (err) {
      console.error('Invoice download failed:', err)
      setError(`Invoice download failed: ${err.message || 'Unknown error'}.`)
    } finally {
      setDownloadingInvoiceId('')
    }
  }

  // Fetch real fee list from backend database
  const fetchFeeList = async () => {
    setLoading(true)
    setError('')
    try {
      const feeListResponse = await getFeeList({
        class: normalizeSchoolClass(classFilter),
        section: sectionFilter,
        month: monthFilter,
      })

      let list = []
      if (feeListResponse?.data && Array.isArray(feeListResponse.data)) {
        list = feeListResponse.data
      } else if (feeListResponse?.fees && Array.isArray(feeListResponse.fees)) {
        list = feeListResponse.fees
      } else if (Array.isArray(feeListResponse)) {
        list = feeListResponse
      }

      setFeeList(list)
    } catch (err) {
      console.error('Error fetching fee list data:', err)
      setFeeList([])
      if (err?.response?.data?.message) {
        setError(err.response.data.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount and when dropdown filters change
  useEffect(() => {
    fetchFeeList()
  }, [classFilter, sectionFilter, monthFilter])

  // Real-time synchronization when bills or payments are updated
  useEffect(() => {
    const handleSync = () => {
      fetchFeeList()
    }
    window.addEventListener('fee:bills-updated', handleSync)
    window.addEventListener('fee:payment-recorded', handleSync)
    return () => {
      window.removeEventListener('fee:bills-updated', handleSync)
      window.removeEventListener('fee:payment-recorded', handleSync)
    }
  }, [classFilter, sectionFilter, monthFilter])

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, classFilter, sectionFilter, monthFilter, statusFilter])

  // Status Counts
  const counts = useMemo(() => {
    let paid = 0
    let unpaid = 0
    let partial = 0

    feeList.forEach((fee) => {
      const totalFee = parseFloat(fee.total_fee || 0)
      const paidAmount = fee.direct_paid !== undefined ? parseFloat(fee.direct_paid || 0) : parseFloat(fee.total_paid || fee.paid_amount || 0)
      const advanceUsed = parseFloat(fee.advance_used || 0)
      const netPayable = fee.net_payable !== undefined ? parseFloat(fee.net_payable) : Math.max(0, totalFee - (paidAmount + advanceUsed))
      const billStatus = (fee.bill_status || (netPayable === 0 ? 'paid' : 'unpaid')).toLowerCase()

      if (billStatus === 'paid' || (totalFee > 0 && netPayable <= 0)) {
        paid++
      } else if (billStatus === 'partial' || (paidAmount > 0 && netPayable > 0)) {
        partial++
      } else {
        unpaid++
      }
    })

    return {
      all: feeList.length,
      paid,
      unpaid,
      partial,
    }
  }, [feeList])

  // Filtered fee list based on Search & Status Pill
  const filteredFeeList = useMemo(() => {
    let result = feeList

    // 1. Status Filter
    if (statusFilter !== 'all') {
      result = result.filter((fee) => {
        const totalFee = parseFloat(fee.total_fee || 0)
        const paidAmount = fee.direct_paid !== undefined ? parseFloat(fee.direct_paid || 0) : parseFloat(fee.total_paid || fee.paid_amount || 0)
        const advanceUsed = parseFloat(fee.advance_used || 0)
        const netPayable = fee.net_payable !== undefined ? parseFloat(fee.net_payable) : Math.max(0, totalFee - (paidAmount + advanceUsed))
        const billStatus = (fee.bill_status || (netPayable === 0 ? 'paid' : 'unpaid')).toLowerCase()

        if (statusFilter === 'paid') {
          return billStatus === 'paid' || (totalFee > 0 && netPayable <= 0)
        } else if (statusFilter === 'unpaid') {
          return (billStatus === 'unpaid' || billStatus === 'pending') && (netPayable > 0 || totalFee === 0) && paidAmount === 0
        } else if (statusFilter === 'partial') {
          return billStatus === 'partial' || (paidAmount > 0 && netPayable > 0)
        }
        return true
      })
    }

    // 2. Search Query Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim()
      result = result.filter((fee) => {
        const name = (fee.student_name || '').toLowerCase()
        const father = (fee.father_name || '').toLowerCase()
        const roll = String(fee.roll_no || '').toLowerCase()
        const billId = String(fee.bill_id || '').toLowerCase()
        const adm = String(fee.admission_no || fee.adm_no || '').toLowerCase()
        return name.includes(q) || father.includes(q) || roll.includes(q) || billId.includes(q) || adm.includes(q)
      })
    }

    return result
  }, [feeList, statusFilter, searchTerm])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredFeeList.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredFeeList.length)
  const paginatedFeeList = filteredFeeList.slice(startIndex, endIndex)
  const showingStart = filteredFeeList.length === 0 ? 0 : startIndex + 1
  const showingEnd = endIndex

  // Export to Excel
  const handleDownloadExcel = () => {
    if (filteredFeeList.length === 0) {
      setError('No data available to download')
      return
    }

    try {
      const header = [
        'Student',
        'Father Name',
        'Roll',
        'Class',
        'Section',
        'Month',
        'Tuition Fee',
        'Exam Fee',
        'Annual Fee',
        'Computer Fee',
        'Transport Fee',
        'Previous Due',
        'Total Fee',
        'Paid Amount',
        'Advance Used',
        'Net Payable',
        'Status',
      ]

      const rows = filteredFeeList.map((fee) => {
        const totalFee = parseFloat(fee.total_fee) || 0
        const paidAmount = fee.direct_paid !== undefined ? parseFloat(fee.direct_paid) || 0 : parseFloat(fee.total_paid || fee.paid_amount) || 0
        const advanceUsed = parseFloat(fee.advance_used) || 0
        const netPayable = fee.net_payable !== undefined ? parseFloat(fee.net_payable) : Math.max(0, totalFee - (paidAmount + advanceUsed))
        const billStatus = fee.bill_status || (netPayable === 0 ? 'paid' : 'unpaid')

        return [
          fee.student_name || '--',
          fee.father_name || '--',
          fee.roll_no ?? '--',
          normalizeSchoolClass(fee.class) || '--',
          fee.section || '--',
          fee.month || '--',
          parseFloat(fee.tuition_fee) || 0,
          parseFloat(fee.exam_fee) || 0,
          parseFloat(fee.annual_fee) || 0,
          parseFloat(fee.computer_fee) || 0,
          parseFloat(fee.transport_fee) || 0,
          parseFloat(fee.previous_due) || 0,
          totalFee,
          paidAmount,
          advanceUsed,
          netPayable,
          String(billStatus).charAt(0).toUpperCase() + String(billStatus).slice(1),
        ]
      })

      const aoa = [
        ['Star Public School - Official Fee List Records'],
        [`Academic Year: 2026-27 | Generated: ${new Date().toLocaleString()}`],
        [],
        header,
        ...rows,
      ]

      const ws = XLSX.utils.aoa_to_sheet(aoa)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Fee List')

      const filename = `Star_Public_School_Fee_List_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, filename)
    } catch (err) {
      setError('Failed to generate Excel: ' + (err?.message || 'Unknown error'))
    }
  }

  // Handle Reset
  const handleResetFilters = () => {
    setClassFilter('')
    setSectionFilter('')
    setMonthFilter('')
    setStatusFilter('all')
    setSearchTerm('')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Main Card Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        
        {/* Top Header Row */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-5 border-b border-slate-100">
          {/* Title & Metadata */}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Fee List</h2>
            <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-0.5 text-xs font-semibold">
              {filteredFeeList.length} records
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-medium text-slate-400">
              Academic Year 2026–27
            </span>
          </div>

          {/* Search Bar & Export Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Real-time Search */}
            <div className="relative min-w-[260px] sm:min-w-[320px]">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name, roll or admission ID..."
                className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:border-blue-500 focus:outline-none transition"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              ) : (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                  ⌘K
                </span>
              )}
            </div>

            {/* Export to Excel Button */}
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-[17px]">table_chart</span>
              Export to Excel
            </button>
          </div>
        </div>

        {/* Second Filter Bar Row */}
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Class Filter */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Class
              </span>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="">All Classes</option>
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Section
              </span>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="">All Sections</option>
                {SECTION_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Billing Month Filter */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Billing Month
              </span>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-9 px-3.5 mt-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                title="Reset all filters"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-500">
                  refresh
                </span>
                Reset
              </button>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              STATUS:
            </span>

            {/* All */}
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-[#0b1329] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All <span className="font-semibold">{counts.all}</span>
            </button>

            {/* Paid */}
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'paid'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusFilter === 'paid' ? 'bg-white' : 'bg-emerald-500'}`}></span>
              Paid <span className="font-semibold">{counts.paid}</span>
            </button>

            {/* Unpaid */}
            <button
              type="button"
              onClick={() => setStatusFilter('unpaid')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'unpaid'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusFilter === 'unpaid' ? 'bg-white' : 'bg-rose-500'}`}></span>
              Unpaid <span className="font-semibold">{counts.unpaid}</span>
            </button>

            {/* Partial */}
            <button
              type="button"
              onClick={() => setStatusFilter('partial')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'partial'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusFilter === 'partial' ? 'bg-white' : 'bg-amber-500'}`}></span>
              Partial <span className="font-semibold">{counts.partial}</span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Live Table */}
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-100 bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">STUDENT DETAILS</th>
                <th className="py-3 px-3 text-center">ROLL</th>
                <th className="py-3 px-3 text-center">CLASS &amp; SEC</th>
                <th className="py-3 px-3 text-center">MONTH</th>
                <th className="py-3 px-3 text-right">TUITION</th>
                <th className="py-3 px-3 text-right">EXAM</th>
                <th className="py-3 px-3 text-right">ANNUAL</th>
                <th className="py-3 px-3 text-right">COMPUTER</th>
                <th className="py-3 px-3 text-right">TRANSPORT</th>
                <th className="py-3 px-3 text-right text-amber-600">PREV DUE</th>
                <th className="py-3 px-3 text-right">TOTAL</th>
                <th className="py-3 px-3 text-right text-emerald-700">PAID</th>
                <th className="py-3 px-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="13" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[28px] animate-spin text-slate-400">sync</span>
                      <p className="text-xs font-medium">Loading real fee records from database...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedFeeList.length === 0 ? (
                <tr>
                  <td colSpan="13" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">No fee records found</p>
                      <p className="text-xs text-slate-400">
                        {searchTerm || classFilter || monthFilter || statusFilter !== 'all'
                          ? 'Try adjusting your search criteria or resetting filters.'
                          : 'No fee bills have been generated yet in database.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedFeeList.map((fee, idx) => {
                  const totalFee = parseFloat(fee.total_fee || 0)
                  const paidAmount = fee.direct_paid !== undefined ? parseFloat(fee.direct_paid || 0) : parseFloat(fee.total_paid || fee.paid_amount || 0)
                  const advanceUsed = parseFloat(fee.advance_used || 0)
                  const netPayable = fee.net_payable !== undefined ? parseFloat(fee.net_payable) : Math.max(0, totalFee - (paidAmount + advanceUsed))
                  const isPaid = (fee.bill_status === 'paid') || (totalFee > 0 && netPayable <= 0)

                  const rollFormatted = fee.roll_no ? String(fee.roll_no).padStart(2, '0') : '--'
                  const avatarColor = getAvatarColor(fee.student_name, fee.roll_no)
                  const initials = getInitials(fee.student_name)

                  return (
                    <tr
                      key={fee.bill_id || `${fee.student_id}_${idx}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Student Details (Avatar + Name + Father Name) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${avatarColor.bg} ${avatarColor.text}`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {fee.student_name || '--'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                              F: {fee.father_name || '--'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Roll */}
                      <td className="py-3 px-3 text-center text-xs font-semibold text-slate-700">
                        {rollFormatted}
                      </td>

                      {/* Class & Sec */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block rounded-lg bg-slate-100 border border-slate-200/60 px-2 py-0.5 text-xs font-bold text-slate-700">
                          {normalizeSchoolClass(fee.class) || '--'}-{fee.section || 'A'}
                        </span>
                      </td>

                      {/* Month */}
                      <td className="py-3 px-3 text-center text-xs font-mono font-medium text-slate-600">
                        {fee.month || '--'}
                      </td>

                      {/* Tuition */}
                      <td className="py-3 px-3 text-right text-xs text-slate-600 font-medium">
                        ₹{(parseFloat(fee.tuition_fee) || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Exam */}
                      <td className="py-3 px-3 text-right text-xs text-slate-600 font-medium">
                        ₹{(parseFloat(fee.exam_fee) || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Annual */}
                      <td className="py-3 px-3 text-right text-xs text-slate-600 font-medium">
                        ₹{(parseFloat(fee.annual_fee) || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Computer */}
                      <td className="py-3 px-3 text-right text-xs text-slate-600 font-medium">
                        ₹{(parseFloat(fee.computer_fee) || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Transport */}
                      <td className="py-3 px-3 text-right text-xs text-slate-600 font-medium">
                        ₹{(parseFloat(fee.transport_fee) || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Prev Due */}
                      <td className="py-3 px-3 text-right text-xs font-semibold text-amber-600">
                        ₹{(parseFloat(fee.previous_due) || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-right text-xs font-black text-slate-900">
                        ₹{totalFee.toLocaleString('en-IN')}
                      </td>

                      {/* Paid */}
                      <td className="py-3 px-3 text-right text-xs font-bold text-emerald-600">
                        ₹{paidAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* If Unpaid or Partial, Show Pay button */}
                          {!isPaid && onPayFee && (
                            <button
                              type="button"
                              onClick={() =>
                                onPayFee({
                                  class: fee.class,
                                  section: fee.section,
                                  roll_number: fee.roll_no,
                                  month: fee.month,
                                  student_name: fee.student_name,
                                  total_fee: totalFee,
                                  paid_amount: paidAmount,
                                  net_payable: netPayable,
                                })
                              }
                              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                              title="Pay fee at counter"
                            >
                              Pay
                            </button>
                          )}

                          {/* If Paid or Partial, Show Receipt view and PDF download */}
                          {(isPaid || paidAmount > 0) && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onViewReceipt) onViewReceipt(fee)
                                  else if (onViewInvoice) onViewInvoice(fee.bill_id)
                                }}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="View Receipt"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  visibility
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadInvoiceDirect(fee.bill_id)}
                                disabled={downloadingInvoiceId === fee.bill_id}
                                className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                                title="Download PDF Receipt"
                              >
                                <span
                                  className={`material-symbols-outlined text-[18px] ${
                                    downloadingInvoiceId === fee.bill_id ? 'animate-spin' : ''
                                  }`}
                                >
                                  {downloadingInvoiceId === fee.bill_id ? 'sync' : 'download'}
                                </span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Controls */}
        {filteredFeeList.length > PAGE_SIZE && (
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div>
              Showing <span className="font-bold text-slate-800">{showingStart}</span> to{' '}
              <span className="font-bold text-slate-800">{showingEnd}</span> of{' '}
              <span className="font-bold text-slate-800">{filteredFeeList.length}</span> records
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  className={`h-8 w-8 rounded-lg font-bold text-xs transition cursor-pointer ${
                    safeCurrentPage === pg
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeeList
