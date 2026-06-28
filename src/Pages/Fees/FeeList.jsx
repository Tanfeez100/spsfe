import React, { useState, useEffect } from 'react'
import { getFeeList } from '../../Api/fees'
import * as XLSX from 'xlsx'
import { CLASS_OPTIONS, SECTION_OPTIONS, normalizeSchoolClass } from '../../constants/schoolOptions'

function FeeList({ onViewInvoice, onPayFee }) {
  const [feeList, setFeeList] = useState([])
  const [filteredFeeList, setFilteredFeeList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'paid', 'unpaid', 'partial'
  const [totalCount, setTotalCount] = useState(0)

  // Apply status filter when statusFilter or feeList changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredFeeList(feeList)
    } else {
      const filtered = feeList.filter((fee) => {
        const totalFee = fee.total_fee || 0
        const paidAmount = fee.total_paid || fee.paid_amount || 0
        const netPayable = fee.net_payable || fee.balance || (totalFee - paidAmount)
        const billStatus = fee.bill_status || (netPayable === 0 ? 'paid' : 'unpaid')
        
        if (statusFilter === 'paid') {
          return billStatus === 'paid' || netPayable === 0 || netPayable < 0
        } else if (statusFilter === 'unpaid') {
          return billStatus === 'unpaid' && netPayable > 0
        } else if (statusFilter === 'partial') {
          return billStatus === 'partial' || (paidAmount > 0 && netPayable > 0)
        }
        return true
      })
      setFilteredFeeList(filtered)
    }
  }, [statusFilter, feeList])

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchFeeList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter, sectionFilter, monthFilter])

  const fetchFeeList = async () => {
    setLoading(true)
    setError('')
    try {
      console.log('Fetching fee list with parameters:', {
        classFilter,
        sectionFilter,
        monthFilter,
      });

      // Fetch fee list data
      const feeListResponse = await getFeeList({
        class: normalizeSchoolClass(classFilter),
        section: sectionFilter,
        month: monthFilter,
      });
      
      let feeList = [];

      // Handle different response structures - prioritize data extraction
      if (feeListResponse.data && Array.isArray(feeListResponse.data)) {
        feeList = feeListResponse.data;
      } else if (feeListResponse.fees && Array.isArray(feeListResponse.fees)) {
        feeList = feeListResponse.fees;
      } else if (feeListResponse.success && feeListResponse.data && Array.isArray(feeListResponse.data)) {
        feeList = feeListResponse.data;
      } else if (feeListResponse.success && feeListResponse.fees && Array.isArray(feeListResponse.fees)) {
        feeList = feeListResponse.fees;
      } else if (Array.isArray(feeListResponse)) {
        feeList = feeListResponse;
      } else {
        // If no data but message exists, show message but don't treat as error if it's just informational
        if (feeListResponse.message && !feeListResponse.data) {
          setError(feeListResponse.message);
        }
        feeList = [];
      }

      console.log('Fee list response:', feeListResponse);
      console.log('Fee list data extracted:', feeList);
      setFeeList(feeList);
      setTotalCount(feeList.length);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err?.message || 'Failed to fetch data');
      setFeeList([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadExcel = () => {
    if (filteredFeeList.length === 0) {
      setError('No data available to download')
      return
    }

    try {
      const filters = []
      if (classFilter) filters.push(`Class: ${classFilter}`)
      if (sectionFilter) filters.push(`Section: ${sectionFilter}`)
      if (monthFilter) filters.push(`Month: ${monthFilter}`)
      if (statusFilter !== 'all') filters.push(`Status: ${statusFilter}`)

      const header = [
        'Student',
        'Roll',
        'Class',
        'Section',
        'Month',
        'Tuition',
        'Exam',
        'Annual',
        'Prev Due',
        'Total Fee',
        'Paid',
        'Net Payable',
        'Status',
      ]

      const rows = filteredFeeList.map((fee) => {
        const totalFee = parseFloat(fee.total_fee) || 0
        const paidAmount = parseFloat(fee.total_paid || fee.paid_amount) || 0
        const netPayable = parseFloat(fee.net_payable || fee.balance) || totalFee - paidAmount
        const billStatus = fee.bill_status || (netPayable === 0 ? 'paid' : 'unpaid')

        return [
          fee.student_name || '--',
          fee.roll_no ?? '--',
          normalizeSchoolClass(fee.class) || '--',
          fee.section || '--',
          fee.month || '--',
          parseFloat(fee.tuition_fee) || 0,
          parseFloat(fee.exam_fee) || 0,
          parseFloat(fee.annual_fee) || 0,
          parseFloat(fee.previous_due) || 0,
          totalFee,
          paidAmount,
          netPayable,
          String(billStatus).charAt(0).toUpperCase() + String(billStatus).slice(1),
        ]
      })

      const totals = {
        tuition: filteredFeeList.reduce((sum, f) => sum + (parseFloat(f.tuition_fee) || 0), 0),
        exam: filteredFeeList.reduce((sum, f) => sum + (parseFloat(f.exam_fee) || 0), 0),
        annual: filteredFeeList.reduce((sum, f) => sum + (parseFloat(f.annual_fee) || 0), 0),
        prevDue: filteredFeeList.reduce((sum, f) => sum + (parseFloat(f.previous_due) || 0), 0),
        totalFee: filteredFeeList.reduce((sum, f) => sum + (parseFloat(f.total_fee) || 0), 0),
        totalPaid: filteredFeeList.reduce((sum, f) => sum + (parseFloat(f.total_paid || f.paid_amount) || 0), 0),
        netPayable: filteredFeeList.reduce((sum, f) => {
          const tf = parseFloat(f.total_fee) || 0
          const pa = parseFloat(f.total_paid || f.paid_amount) || 0
          const np = parseFloat(f.net_payable || f.balance) || tf - pa
          return sum + np
        }, 0),
      }

      rows.push([
        `Total (${filteredFeeList.length})`,
        '',
        '',
        '',
        '',
        totals.tuition,
        totals.exam,
        totals.annual,
        totals.prevDue,
        totals.totalFee,
        totals.totalPaid,
        totals.netPayable,
        '',
      ])

      const aoa = [
        ['Fee List Report'],
        filters.length > 0 ? [`Filters: ${filters.join(', ')}`] : ['Filters: (none)'],
        [`Total Records: ${filteredFeeList.length}`],
        [`Generated: ${new Date().toLocaleString()}`],
        [],
        header,
        ...rows,
      ]

      const ws = XLSX.utils.aoa_to_sheet(aoa)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Fee List')

      const filename = `fee-list-${classFilter || 'all'}-${sectionFilter || 'all'}-${monthFilter || 'all'}-${statusFilter}-${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, filename)
    } catch (err) {
      setError('Failed to generate Excel: ' + (err?.message || 'Unknown error'))
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Fee List</h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {feeList.length > 0 && (
            <>
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 sm:px-3 py-1.5 rounded-full truncate">
                Total: {totalCount} {totalCount === 1 ? 'record' : 'records'}
              </span>
              {statusFilter !== 'all' && filteredFeeList.length !== feeList.length && (
                <span className="text-xs sm:text-sm text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20 px-2 sm:px-3 py-1.5 rounded-full font-medium truncate border border-teal-200 dark:border-teal-700/50">
                  Showing: {filteredFeeList.length}
                </span>
              )}
            </>
          )}
          {filteredFeeList.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap text-sm justify-center font-semibold"
            >
              <span className="material-symbols-outlined text-sm">table_chart</span>
              <span className="hidden sm:inline">Download Excel</span>
              <span className="sm:hidden">XLSX</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class</label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
          >
            <option value="">All Classes</option>
            {CLASS_OPTIONS.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Section</label>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
          >
            <option value="">All Sections</option>
            {SECTION_OPTIONS.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Month</label>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
          />
        </div>
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex items-end">
          <button
            onClick={() => {
              setClassFilter('')
              setSectionFilter('')
              setMonthFilter('')
              setStatusFilter('all')
              setFeeList([])
              setFilteredFeeList([])
            }}
            className="w-full px-2 sm:px-4 py-1.5 sm:py-2 text-sm border border-teal-200 dark:border-teal-700/50 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/10 text-teal-700 dark:text-teal-300 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 sm:p-3">
          <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Status Filter - Always Visible */}
      {feeList.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Filter:</span>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 flex-1">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                    statusFilter === 'all'
                      ? 'bg-[#0f766e] text-white shadow-sm shadow-teal-500/20'
                      : 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/10 border border-teal-200 dark:border-teal-700/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">apps</span>
                  <span>All</span>
                  <span className={`px-1 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${
                    statusFilter === 'all' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
                  }`}>
                    {feeList.length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('paid')}
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                    statusFilter === 'paid'
                      ? 'bg-[#0f766e] text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-teal-200 dark:border-teal-700/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  <span className="hidden sm:inline">Paid</span>
                  <span className="sm:hidden">P</span>
                  <span className={`px-1 py-0.5 rounded text-xs font-semibold ${
                    statusFilter === 'paid' ? 'bg-white/20' : 'bg-emerald-50 dark:bg-emerald-900/20'
                  }`}>
                    {feeList.filter(f => {
                      const netPayable = f.net_payable || f.balance || ((f.total_fee || 0) - (f.total_paid || 0))
                      return f.bill_status === 'paid' || netPayable === 0 || netPayable < 0
                    }).length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('unpaid')}
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                    statusFilter === 'unpaid'
                      ? 'bg-[#be123c] text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">cancel</span>
                  <span className="hidden sm:inline">Unpaid</span>
                  <span className="sm:hidden">U</span>
                  <span className={`px-1 py-0.5 rounded text-xs font-semibold ${
                    statusFilter === 'unpaid' ? 'bg-white/20' : 'bg-rose-50 dark:bg-rose-900/20'
                  }`}>
                    {feeList.filter(f => {
                      const netPayable = f.net_payable || f.balance || ((f.total_fee || 0) - (f.total_paid || 0))
                      return f.bill_status === 'unpaid' && netPayable > 0
                    }).length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('partial')}
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                    statusFilter === 'partial'
                      ? 'bg-[#b45309] text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">pending</span>
                  <span className="hidden sm:inline">Partial</span>
                  <span className="sm:hidden">Pt</span>
                  <span className={`px-1 py-0.5 rounded text-xs font-semibold ${
                    statusFilter === 'partial' ? 'bg-white/20' : 'bg-amber-50 dark:bg-amber-900/20'
                  }`}>
                    {feeList.filter(f => {
                      const paidAmount = f.total_paid || f.paid_amount || 0
                      const netPayable = f.net_payable || f.balance || ((f.total_fee || 0) - paidAmount)
                      return f.bill_status === 'partial' || (paidAmount > 0 && netPayable > 0)
                    }).length}
                  </span>
                </button>
              </div>
            </div>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2 py-2">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
          ))}
        </div>
      ) : filteredFeeList.length === 0 && feeList.length > 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-8 text-sm">
          No fees found with status "{statusFilter}". Try selecting a different status filter.
        </p>
      ) : filteredFeeList.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-8 text-sm">
          {classFilter || monthFilter ? 'No fees found. Try adjusting filters.' : 'No fees found. Data will appear here when available.'}
        </p>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto table-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(99, 126, 153) rgb(224, 242, 254)' }}>
            <table className="fee-list-table w-full">
            <thead>
              <tr className="!bg-[#38bdf8] border-b-2 border-sky-200/60 dark:border-sky-700/50">
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold !text-white sticky left-0 !bg-[#38bdf8] z-10 border-r border-sky-200/40 dark:border-sky-700/50">Student</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold !text-white">Roll</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold !text-white hidden sm:table-cell">Class</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold !text-white hidden md:table-cell">Section</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold !text-white hidden lg:table-cell">Month</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-right text-xs sm:text-sm font-bold !text-white hidden lg:table-cell">Tuition</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-right text-xs sm:text-sm font-bold !text-white hidden lg:table-cell">Exam</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-right text-xs sm:text-sm font-bold !text-white hidden lg:table-cell">Annual</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-right text-xs sm:text-sm font-bold !text-white hidden lg:table-cell">Prev Due</th>
                <th className="fee-total-heading px-2 sm:px-3 py-2 sm:py-3 text-right text-xs sm:text-sm font-bold !text-white !bg-[#38bdf8]">Total</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-right text-xs sm:text-sm font-bold !text-white">Paid</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-right text-xs sm:text-sm font-bold !text-white">Due</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold !text-white">Status</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold !text-white sticky right-0 !bg-[#38bdf8] border-l border-sky-200/40 dark:border-sky-700/50">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeeList.map((fee, index) => {
                const totalFee = fee.total_fee || 0
                const paidAmount = fee.total_paid || fee.paid_amount || 0
                const netPayable = fee.net_payable || fee.balance || (totalFee - paidAmount)
                const billStatus = fee.bill_status || (netPayable === 0 ? 'paid' : 'unpaid')
                const isPaid = billStatus === 'paid' || netPayable === 0
                
                return (
                  <tr key={fee.bill_id || fee.student_id || index} className="border-b text-xs sm:text-sm border-cyan-200/30 dark:border-cyan-700/50 hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-colors">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-900 dark:text-white font-medium sticky left-0 bg-white dark:bg-slate-800 z-10 border-r border-cyan-200/30 dark:border-cyan-700/50 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                      <div>
                        <div className="font-semibold truncate text-xs sm:text-sm">{fee.student_name || '--'}</div>
                        {fee.father_name && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{fee.father_name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-slate-900 dark:text-white">{fee.roll_no || '--'}</td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-slate-900 dark:text-white font-medium hidden sm:table-cell">{fee.class || '--'}</td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-slate-900 dark:text-white hidden md:table-cell">{fee.section || '--'}</td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-slate-900 dark:text-white hidden lg:table-cell">{fee.month || '--'}</td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-slate-700 dark:text-slate-300 hidden lg:table-cell">₹{(parseFloat(fee.tuition_fee) || 0).toLocaleString('en-IN')}</td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-slate-700 dark:text-slate-300 hidden lg:table-cell">₹{(parseFloat(fee.exam_fee) || 0).toLocaleString('en-IN')}</td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-slate-700 dark:text-slate-300 hidden lg:table-cell">₹{(parseFloat(fee.annual_fee) || 0).toLocaleString('en-IN')}</td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-orange-600 dark:text-orange-400 font-medium hidden lg:table-cell">₹{(parseFloat(fee.previous_due) || 0).toLocaleString('en-IN')}</td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-slate-900 dark:text-white font-bold bg-teal-50/80 dark:bg-teal-900/10">
                      ₹{totalFee.toLocaleString('en-IN')}
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-green-600 dark:text-green-400 font-bold">
                      ₹{paidAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-red-600 dark:text-red-400 font-bold">
                      ₹{netPayable.toLocaleString('en-IN')}
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                      {billStatus === 'paid' || isPaid ? (
                        <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-semibold whitespace-nowrap inline-block">Paid</span>
                      ) : billStatus === 'partial' ? (
                        <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded text-xs font-semibold whitespace-nowrap inline-block">Partial</span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-xs font-semibold whitespace-nowrap inline-block">Unpaid</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-center sticky right-0 bg-white dark:bg-slate-800 border-l border-cyan-200/30 dark:border-cyan-700/50 shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-1 justify-center flex-wrap">
                        {/* Show Pay button for unpaid or partial */}
                        {(billStatus === 'unpaid' || billStatus === 'partial' || netPayable > 0) && (
                          <button
                            onClick={() => onPayFee && onPayFee({
                              class: fee.class,
                              section: fee.section,
                              roll_number: fee.roll_no,
                              month: fee.month,
                              student_name: fee.student_name,
                              total_fee: totalFee,
                              paid_amount: paidAmount,
                              net_payable: netPayable
                            })}
                            className="inline-flex min-w-[64px] items-center justify-center px-3 py-1.5 bg-orange-500 hover:bg-orange-500/90 text-white rounded text-xs font-bold transition-colors shadow-sm shadow-orange-500/20"
                            title="Pay Fee"
                          >
                            Pay
                          </button>
                        )}
                        
                        {/* Show Invoice button for paid or partial */}
                        {(billStatus === 'paid' || billStatus === 'partial' || netPayable === 0 || netPayable < 0 || paidAmount > 0) && (
                          <button
                            onClick={() => onViewInvoice && onViewInvoice(fee.bill_id)}
                            className="inline-flex min-w-[76px] items-center justify-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-sm shadow-emerald-500/20"
                            title="View Invoice"
                          >
                            Invoice
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Summary Row */}
            {filteredFeeList.length > 0 && (
              <tfoot>
                <tr className="bg-teal-50 dark:bg-teal-900/20 border-t-2 border-teal-200 dark:border-teal-700/50 font-bold text-xs sm:text-sm">
                  <td colSpan={5} className="px-2 sm:px-4 py-2 sm:py-3 text-right text-slate-900 dark:text-white">
                    Total ({filteredFeeList.length}):
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-slate-900 dark:text-white hidden lg:table-cell">
                    ₹{filteredFeeList.reduce((sum, f) => sum + (parseFloat(f.tuition_fee) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-slate-900 dark:text-white hidden lg:table-cell">
                    ₹{filteredFeeList.reduce((sum, f) => sum + (parseFloat(f.exam_fee) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-slate-900 dark:text-white hidden lg:table-cell">
                    ₹{filteredFeeList.reduce((sum, f) => sum + (parseFloat(f.annual_fee) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-slate-900 dark:text-white hidden lg:table-cell">
                    ₹{filteredFeeList.reduce((sum, f) => sum + (parseFloat(f.previous_due) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 text-right bg-teal-100/80 dark:bg-teal-900/20 text-slate-900 dark:text-white font-bold">
                    ₹{filteredFeeList.reduce((sum, f) => sum + (parseFloat(f.total_fee) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-green-600 dark:text-green-400 font-bold">
                    ₹{filteredFeeList.reduce((sum, f) => sum + (parseFloat(f.total_paid) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-red-600 dark:text-red-400 font-bold">
                    ₹{filteredFeeList.reduce((sum, f) => sum + (parseFloat(f.net_payable) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-slate-900 dark:text-white">
                    <span className="text-xs">
                      {filteredFeeList.filter(f => f.bill_status === 'paid' || (f.net_payable || 0) === 0 || (f.net_payable || 0) < 0).length}/{filteredFeeList.length}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 sticky right-0 bg-teal-50 dark:bg-teal-900/20"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        </div>
      )}
    </div>
  )
}

export default FeeList

