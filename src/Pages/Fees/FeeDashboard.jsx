import React, { useEffect, useMemo, useState } from 'react'
import { getFeeList } from '../../Api/fees'
import { CLASS_OPTIONS, SECTION_OPTIONS } from '../../constants/schoolOptions'
import { downloadInvoiceSlipPDF } from '../../utils/pdf/invoiceSlipPdf'

const MONTHS = [
  { key: '01', label: 'Jan' },
  { key: '02', label: 'Feb' },
  { key: '03', label: 'Mar' },
  { key: '04', label: 'Apr' },
  { key: '05', label: 'May' },
  { key: '06', label: 'Jun' },
  { key: '07', label: 'Jul' },
  { key: '08', label: 'Aug' },
  { key: '09', label: 'Sep' },
  { key: '10', label: 'Oct' },
  { key: '11', label: 'Nov' },
  { key: '12', label: 'Dec' },
]

const extractRows = (payload) => {
  const candidates = [
    payload,
    payload?.data,
    payload?.fees,
    payload?.records,
    payload?.items,
    payload?.data?.data,
    payload?.data?.fees,
    payload?.data?.records,
    payload?.data?.items,
  ]

  return candidates.find(Array.isArray) || []
}

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

const initials = (name) =>
  String(name || '--')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const getRecordStatus = (total, paid, due, rawStatus) => {
  const status = String(rawStatus || '').toLowerCase()
  if (status === 'paid' || due <= 0) return 'paid'
  if (status === 'partial' || paid > 0) return 'partial'
  if (status === 'unpaid' || due > 0) return 'due'
  return 'missing'
}

function FeeDashboard({ onPayStudent }) {
  const schoolName = import.meta.env.VITE_SCHOOL_NAME || 'Star Public School'
  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => [currentYear], [currentYear])

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [view, setView] = useState('all')
  const [selectedId, setSelectedId] = useState('')
  const [activeYear, setActiveYear] = useState(currentYear)
  const [downloadingBillId, setDownloadingBillId] = useState('')

  const handleDownloadBillSlip = async (billId) => {
    if (!billId || billId === '--') return
    setDownloadingBillId(billId)
    try {
      await downloadInvoiceSlipPDF(billId)
    } catch (err) {
      console.error('Download slip error:', err)
    } finally {
      setDownloadingBillId('')
    }
  }

  useEffect(() => {
    let cancelled = false

    const fetchLedger = async () => {
      setLoading(true)
      setError('')

      try {
        const requests = yearOptions.flatMap((year) =>
          MONTHS.map(async (month) => {
            const monthKey = `${year}-${month.key}`
            try {
              const response = await getFeeList(classFilter, sectionFilter, monthKey)
              return extractRows(response).map((row) => ({
                ...row,
                month: row.month || monthKey,
                ledger_year: year,
              }))
            } catch {
              return []
            }
          })
        )

        const results = await Promise.all(requests)
        if (!cancelled) setRecords(results.flat())
      } catch (err) {
        if (!cancelled) {
          setRecords([])
          setError(err?.message || 'Failed to load fees ledger')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchLedger()

    return () => {
      cancelled = true
    }
  }, [yearOptions, classFilter, sectionFilter])

  useEffect(() => {
    setSelectedId('')
    setView('all')
  }, [classFilter, sectionFilter])

  const students = useMemo(() => {
    const map = new Map()

    records.forEach((record) => {
      const id = record.student_id || `${record.class}-${record.section}-${record.roll_no}-${record.student_name}`
      const year = Number(record.ledger_year || String(record.month || '').slice(0, 4) || currentYear)
      const monthIndex = Math.max(0, Number(String(record.month || '').slice(5, 7)) - 1)
      const total = Number(record.total_fee || record.total_amount || 0)
      const paid = Number(record.total_paid || record.paid_amount || 0)
      const due = Number(record.net_payable !== undefined ? record.net_payable : (record.balance !== undefined ? record.balance : Math.max(0, total - paid)))
      const prevDue = Number(record.previous_due || 0)
      const status = getRecordStatus(total, paid, due, record.bill_status)

      if (!map.has(id)) {
        const history = {}
        yearOptions.forEach((option) => {
          history[option] = MONTHS.map((month) => ({
            year: option,
            month: month.key,
            monthLabel: month.label,
            amount: 0,
            paidAmount: 0,
            balance: 0,
            previousDue: 0,
            status: 'missing',
            receiptNo: '--',
            mode: '--',
            hasBill: false,
          }))
        })

        map.set(id, {
          id,
          name: record.student_name || '--',
          father: record.father_name || '--',
          className: record.class || '--',
          section: record.section || '--',
          roll: record.roll_no || '--',
          history,
        })
      }

      const student = map.get(id)
      if (!student.history[year]) {
        student.history[year] = MONTHS.map((month) => ({
          year,
          month: month.key,
          monthLabel: month.label,
          amount: 0,
          paidAmount: 0,
          balance: 0,
          previousDue: 0,
          status: 'missing',
          receiptNo: '--',
          mode: '--',
          hasBill: false,
        }))
      }

      student.history[year][monthIndex] = {
        year,
        month: String(record.month || '').slice(5, 7),
        monthLabel: MONTHS[monthIndex]?.label || record.month || '--',
        amount: total,
        paidAmount: paid,
        directPaid: Number(record.direct_paid ?? paid),
        amountSettled: Number(record.amount_settled ?? Math.min(total, paid)),
        advanceUsed: Number(record.advance_used || 0),
        advanceGenerated: Number(record.advance_generated || 0),
        duesSettled: Number(record.dues_settled || 0),
        balance: due,
        previousDue: prevDue,
        status,
        receiptNo: record.bill_id || record.receipt_number || '--',
        mode: record.payment_mode || '--',
        hasBill: true,
      }
    })

    return Array.from(map.values()).map((student) => {
      const allRecords = Object.values(student.history).flat()
      // Filter only real bills generated for this student
      const validBills = allRecords
        .filter((r) => r.hasBill)
        .sort((a, b) => `${a.year}-${a.month}`.localeCompare(`${b.year}-${b.month}`))

      // Actual cash/direct payments received from student across all months
      // Advance settlements in later months don't add new cash (already collected in earlier months)
      const collected = validBills.reduce((sum, item) => {
        const cashPaid = item.directPaid !== undefined ? item.directPaid : item.paidAmount
        return sum + Number(cashPaid || 0)
      }, 0)

      // Outstanding balance is strictly the balance of the student's latest generated bill
      const latestBill = validBills.length > 0 ? validBills[validBills.length - 1] : null
      const pending = latestBill
        ? (latestBill.status === 'paid' ? 0 : Number(latestBill.balance || 0))
        : 0

      // Total genuine fee charged: sum of bill totals excluding previous dues carried forward
      // (This avoids double counting dues that rolled from month to month)
      const total = validBills.reduce((sum, item) => {
        const netMonthFee = Math.max(0, Number(item.amount || 0) - Number(item.previousDue || 0))
        return sum + netMonthFee
      }, 0)

      const status =
        pending === 0 && collected > 0
          ? 'paid'
          : collected > 0 && pending > 0
          ? 'partial'
          : pending > 0
          ? 'due'
          : 'missing'

      return {
        ...student,
        total,
        collected,
        pending,
        status,
        latestBill,
        billsCount: validBills.length,
      }
    })
  }, [records, yearOptions, currentYear])

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return students.filter((student) => {
      const matchesSearch =
        !query ||
        [student.name, student.father, student.roll, student.className, student.section]
          .some((value) => String(value || '').toLowerCase().includes(query))
      const matchesFilter = filter === 'all' || student.status === filter
      return matchesSearch && matchesFilter
    })
  }, [students, search, filter])

  const selectedStudent = students.find((student) => student.id === selectedId) || null
  const dueCount = students.filter((student) => student.pending > 0).length
  const totalCollected = students.reduce((sum, student) => sum + student.collected, 0)
  const totalPending = students.reduce((sum, student) => sum + student.pending, 0)

  const selectStudent = (id) => {
    const student = students.find((item) => item.id === id)
    setSelectedId(id)
    setActiveYear(student ? Math.max(...Object.keys(student.history).map(Number)) : currentYear)
    setView('detail')
  }

  const renderStatus = (status) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Paid Up
        </span>
      )
    }
    if (status === 'partial') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
          Partial
        </span>
      )
    }
    if (status === 'due') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
          Due
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
        No Bill
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* ========================================================
          TOP HEADER BAR
          ======================================================== */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0f1e36] via-[#132c4e] to-[#1e3a5f] p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center font-black text-xl text-amber-300 shadow-inner">
            SPS
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">{schoolName}</h2>
            <p className="text-xs text-slate-300 font-medium tracking-wide">
              Student Fee Ledger & Year-Round Payment Records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl px-3.5 py-2 w-full md:w-80">
          <span className="material-symbols-outlined text-[20px] text-slate-300">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or roll..."
            className="bg-transparent border-none outline-none text-white text-xs sm:text-sm w-full placeholder:text-slate-300 font-medium"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-slate-300 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      {/* ========================================================
          VIEW 1: STUDENT DETAIL VIEW
          ======================================================== */}
      {view === 'detail' && selectedStudent ? (
        <div className="space-y-6 animate-in fade-in duration-150">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#132c4e] hover:text-[#0f1e36] hover:underline cursor-pointer"
            onClick={() => setView('all')}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to All Students
          </button>

          {/* Student Profile Card */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-[#132c4e] text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                {initials(selectedStudent.name)}
              </div>
              <div>
                <h3 className="text-xl font-black text-[#0f1e36]">{selectedStudent.name}</h3>
                <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                    Class {selectedStudent.className}-{selectedStudent.section}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                    Roll No: {selectedStudent.roll}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                    Father: {selectedStudent.father}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Totals */}
            <div className="flex flex-wrap items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-end">
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Charged
                </span>
                <span className="text-lg font-black text-[#0f1e36]">{money(selectedStudent.total)}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Collected
                </span>
                <span className="text-lg font-black text-emerald-600">
                  {money(selectedStudent.collected)}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Current Dues
                </span>
                <span
                  className={`text-lg font-black ${
                    selectedStudent.pending > 0 ? 'text-rose-600' : 'text-slate-800'
                  }`}
                >
                  {money(selectedStudent.pending)}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Status
                </span>
                {renderStatus(selectedStudent.status)}
              </div>
              {onPayStudent && selectedStudent.pending > 0 && (
                <button
                  type="button"
                  onClick={() => onPayStudent(selectedStudent)}
                  className="rounded-xl bg-[#132c4e] px-4 py-2 text-xs font-bold text-white hover:bg-[#0f1e36] shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                  Collect Dues
                </button>
              )}
            </div>
          </section>

          {/* Month-wise History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-[#0f1e36]">Monthly Fee Receipts & Records</h4>
                <p className="text-xs text-slate-400 font-medium">
                  Complete breakdown of bills and payments for this student
                </p>
              </div>

              {/* Year Selector Tabs */}
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                {Object.keys(selectedStudent.history).map((year) => (
                  <button
                    type="button"
                    key={year}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                      Number(year) === Number(activeYear)
                        ? 'bg-[#132c4e] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    onClick={() => setActiveYear(Number(year))}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Receipts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(selectedStudent.history[activeYear] || []).map((record) => {
                if (!record.hasBill) {
                  return (
                    <div
                      key={`${record.year}-${record.month}`}
                      className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center flex flex-col items-center justify-center min-h-[140px] text-slate-400"
                    >
                      <span className="text-sm font-bold text-slate-600">
                        {record.monthLabel} {record.year}
                      </span>
                      <span className="text-xs mt-1">No bill generated</span>
                    </div>
                  )
                }

                return (
                  <article
                    key={`${record.year}-${record.month}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-black text-[#0f1e36]">
                          {record.monthLabel} {record.year}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          #{record.receiptNo}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          record.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : record.status === 'partial'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {record.status === 'paid' ? 'PAID' : record.status === 'partial' ? 'PARTIAL' : 'DUE'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-slate-100 pt-2.5">
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Total Bill:</span>
                        <b className="text-slate-800">{money(record.amount)}</b>
                      </div>

                      {record.previousDue > 0 && (
                        <div className="flex justify-between text-amber-600 font-medium">
                          <span>Includes Previous Due:</span>
                          <b>{money(record.previousDue)}</b>
                        </div>
                      )}

                      {record.advanceUsed > 0 && (
                        <div className="flex justify-between text-indigo-600 font-medium">
                          <span>Paid via Advance:</span>
                          <b>{money(record.advanceUsed)}</b>
                        </div>
                      )}

                      {record.directPaid > 0 && (
                        <div className="flex justify-between text-slate-600 font-medium">
                          <span>{record.advanceGenerated > 0 ? 'Amount Handed Over:' : 'Paid in Month:'}</span>
                          <b className="text-emerald-600">{money(record.directPaid)}</b>
                        </div>
                      )}

                      {record.advanceGenerated > 0 && (
                        <div className="flex justify-between text-indigo-600 font-semibold bg-indigo-50/70 px-2 py-1 rounded-lg">
                          <span>Advance Saved for Next:</span>
                          <b>+{money(record.advanceGenerated)}</b>
                        </div>
                      )}

                      {record.duesSettled > 0 && (
                        <div className="flex justify-between text-blue-600 font-medium bg-blue-50/60 px-2 py-0.5 rounded-lg">
                          <span>Dues Settled in Next Bill:</span>
                          <b>{money(record.duesSettled)}</b>
                        </div>
                      )}

                      {record.directPaid === 0 && record.advanceUsed === 0 && record.paidAmount > 0 && (
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>Paid Amount:</span>
                          <b className="text-emerald-600">{money(record.paidAmount)}</b>
                        </div>
                      )}

                      <div className="flex justify-between font-bold pt-1 border-t border-slate-100">
                        <span>Bill Balance:</span>
                        <b className={record.balance > 0 ? 'text-rose-600' : 'text-slate-700'}>
                          {money(record.balance)}
                        </b>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-100 font-medium">
                      <span>Mode: <span className="font-semibold text-slate-600">{record.mode || '--'}</span></span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {record.monthLabel} {record.year}
                        </span>
                        {record.hasBill && (
                          <button
                            type="button"
                            onClick={() => handleDownloadBillSlip(record.receiptNo)}
                            disabled={downloadingBillId === record.receiptNo}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold border border-emerald-200 transition cursor-pointer disabled:opacity-50"
                            title="Direct Download Invoice PDF"
                          >
                            <span className={`material-symbols-outlined text-[12px] ${downloadingBillId === record.receiptNo ? 'animate-spin' : ''}`}>
                              {downloadingBillId === record.receiptNo ? 'sync' : 'download'}
                            </span>
                            {downloadingBillId === record.receiptNo ? '...' : 'PDF'}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================
            VIEW 2: ALL STUDENTS LEDGER TABLE
            ======================================================== */
        <>
          {/* 4 Metric KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="groups"
              label="Total Students"
              value={students.length}
              subtext="Enrolled in records"
              theme="blue"
            />
            <StatCard
              icon="account_balance_wallet"
              label="Total Collected"
              value={money(totalCollected)}
              subtext="Actual fee received"
              theme="good"
            />
            <StatCard
              icon="pending_actions"
              label="Total Outstanding Dues"
              value={money(totalPending)}
              subtext="Current unpaid dues (last bill)"
              theme="warn"
            />
            <StatCard
              icon="error_outline"
              label="Students with Dues"
              value={dueCount}
              subtext="Pending payment"
              theme="amber"
            />
          </section>

          {/* Filter & Search Bar */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0f1e36]">Student Fee Overview</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Showing accurate student dues from latest generated bill without double-counting
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  ['all', 'All Students'],
                  ['due', 'Dues Pending'],
                  ['partial', 'Partial Paid'],
                  ['paid', 'Fully Paid'],
                ].map(([id, label]) => (
                  <button
                    type="button"
                    key={id}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                      filter === id
                        ? 'bg-[#132c4e] text-white shadow-2xs'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                    onClick={() => setFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Class and Section Dropdowns */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Class:</span>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400"
                >
                  <option value="">All Classes</option>
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Section:</span>
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400"
                >
                  <option value="">All Sections</option>
                  {SECTION_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      Section {s}
                    </option>
                  ))}
                </select>
              </div>

              {(classFilter || sectionFilter || filter !== 'all' || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setClassFilter('')
                    setSectionFilter('')
                    setFilter('all')
                    setSearch('')
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 ml-auto cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Ledger Table */}
          <section className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3.5 px-4">STUDENT</th>
                    <th className="py-3.5 px-4">CLASS</th>
                    <th className="py-3.5 px-4">TOTAL CHARGED</th>
                    <th className="py-3.5 px-4">COLLECTED</th>
                    <th className="py-3.5 px-4">CURRENT DUE</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm font-semibold text-slate-400">
                        Loading student fee records from server...
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm font-semibold text-slate-400">
                        Koi student record nahi mila. Filters change karke dekhein.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      return (
                        <tr
                          key={student.id}
                          onClick={() => selectStudent(student.id)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-[#dce6f5] text-[#132c4e] flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#132c4e] group-hover:text-white transition">
                                {initials(student.name)}
                              </div>
                              <div>
                                <div className="font-bold text-[#0f1e36]">{student.name}</div>
                                <div className="text-[11px] text-slate-400 font-medium">
                                  Roll {student.roll} · S/o {student.father}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-600">
                            Class {student.className}-{student.section}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {money(student.total)}
                          </td>

                          <td className="py-3.5 px-4 font-extrabold text-emerald-600">
                            {money(student.collected)}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`font-black ${
                                student.pending > 0 ? 'text-rose-600' : 'text-slate-400'
                              }`}
                            >
                              {money(student.pending)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">{renderStatus(student.status)}</td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                selectStudent(student.id)
                              }}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#132c4e] hover:bg-[#132c4e] hover:text-white transition shadow-2xs cursor-pointer"
                            >
                              Ledger
                              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, subtext, theme = '' }) {
  const iconColors = {
    blue: 'bg-[#e2ecf8] text-[#2563eb]',
    good: 'bg-[#dcfce7] text-[#16a34a]',
    warn: 'bg-[#fee2e2] text-[#dc2626]',
    amber: 'bg-[#fef3c7] text-[#d97706]',
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${iconColors[theme] || iconColors.blue}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <div className="mt-3 text-2xl sm:text-3xl font-black text-[#0f1e36] tracking-tight">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-400 font-medium">{subtext}</div>
    </div>
  )
}

export default FeeDashboard
