import React, { useEffect, useMemo, useState } from 'react'
import { getFeeList } from '../../Api/fees'
import { CLASS_OPTIONS, SECTION_OPTIONS } from '../../constants/schoolOptions'

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

const money = (value) => `Rs. ${(Number(value || 0)).toLocaleString('en-IN')}`

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
  if (status === 'paid') return 'paid'
  if (status === 'partial') return 'partial'
  if (status === 'unpaid') return 'due'
  if (total <= 0) return 'missing'
  if (due <= 0) return 'paid'
  if (paid > 0) return 'partial'
  return 'due'
}

const getStudentStatus = (student) => {
  const records = Object.values(student.history || {}).flat()
  if (records.some((record) => record.status === 'due')) return 'due'
  if (records.some((record) => record.status === 'partial')) return 'partial'
  if (records.some((record) => record.status === 'paid')) return 'paid'
  return 'missing'
}

function FeeDashboard() {
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
              const response = await getFeeList({
                class: classFilter,
                section: sectionFilter,
                month: monthKey,
              })
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
      const due = Number(record.net_payable || record.balance || Math.max(0, total - paid))
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
            status: 'missing',
            receiptNo: '--',
            mode: '--',
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
          status: 'missing',
          receiptNo: '--',
          mode: '--',
        }))
      }

      student.history[year][monthIndex] = {
        year,
        month: String(record.month || '').slice(5, 7),
        monthLabel: MONTHS[monthIndex]?.label || record.month || '--',
        amount: total,
        paidAmount: paid,
        balance: due,
        status,
        receiptNo: record.bill_id || '--',
        mode: record.payment_mode || '--',
      }
    })

    return Array.from(map.values()).map((student) => {
      const allRecords = Object.values(student.history).flat()
      const total = allRecords.reduce((sum, item) => sum + item.amount, 0)
      const collected = allRecords.reduce((sum, item) => sum + item.paidAmount, 0)
      return {
        ...student,
        total,
        collected,
        pending: Math.max(0, total - collected),
        status: getStudentStatus(student),
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
  const dueCount = students.filter((student) => student.status !== 'paid').length
  const totalCollected = students.reduce((sum, student) => sum + student.collected, 0)
  const totalPending = students.reduce((sum, student) => sum + student.pending, 0)

  const selectStudent = (id) => {
    const student = students.find((item) => item.id === id)
    setSelectedId(id)
    setActiveYear(student ? Math.max(...Object.keys(student.history).map(Number)) : currentYear)
    setView('detail')
  }

  const renderStatus = (status) => (
    <span className={`fd-status-pill ${status}`}>
      <span>●</span>
      {status === 'paid' ? 'Paid Up' : status === 'partial' ? 'Partial' : status === 'due' ? 'Due' : 'No Bill'}
    </span>
  )

  return (
    <div className="fd-root">
      <style>{styles}</style>

      <div className="fd-topbar">
        <div className="fd-brand">
          <div className="fd-brand-mark">SPS</div>
          <div className="fd-brand-text">
            <h1>{schoolName}</h1>
            <p>Fees Ledger and Records</p>
          </div>
        </div>

        <div className="fd-searchwrap">
          <span className="material-symbols-outlined">search</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Student ka naam ya roll no. search karein..."
          />
        </div>
      </div>

      <div className="fd-layout">
        <main className="fd-main">
          {error ? <div className="fd-error">{error}</div> : null}

          {view === 'detail' && selectedStudent ? (
            <>
              <button type="button" className="fd-back-btn" onClick={() => setView('all')}>
                <span className="material-symbols-outlined">chevron_left</span>
                Sabhi Students
              </button>

              <section className="fd-profile-card">
                <span className="fd-avatar large">{initials(selectedStudent.name)}</span>
                <div className="fd-profile-info">
                  <h2>{selectedStudent.name}</h2>
                  <div className="fd-tags">
                    <span>Class <b>{selectedStudent.className}-{selectedStudent.section}</b></span>
                    <span>Roll No. <b>{selectedStudent.roll}</b></span>
                    <span>Father's Name <b>{selectedStudent.father}</b></span>
                  </div>
                </div>
                <div className="fd-profile-totals">
                  <div><span className="fd-label">Total Fee</span><b>{money(selectedStudent.total)}</b></div>
                  <div><span className="fd-label">Collected</span><b className="green">{money(selectedStudent.collected)}</b></div>
                  <div><span className="fd-label">Pending</span><b className={selectedStudent.pending > 0 ? 'red' : ''}>{money(selectedStudent.pending)}</b></div>
                  <div><span className="fd-label">Status</span>{renderStatus(selectedStudent.status)}</div>
                </div>
              </section>

              <div className="fd-section-head">
                <h2>Year-wise Payment History</h2>
                <span className="fd-hint">Har month ka receipt neeche dekhein</span>
              </div>

              <div className="fd-year-tabs">
                {Object.keys(selectedStudent.history).map((year) => (
                  <button
                    type="button"
                    key={year}
                    className={`fd-year-tab ${Number(year) === Number(activeYear) ? 'active' : ''}`}
                    onClick={() => setActiveYear(Number(year))}
                  >
                    {year}
                  </button>
                ))}
              </div>

              <div className="fd-receipts">
                {(selectedStudent.history[activeYear] || []).map((record) => (
                  <article key={`${record.year}-${record.month}`} className="fd-receipt">
                    <div className="fd-receipt-top">
                      <div>
                        <div className="fd-term">{record.monthLabel}, {record.year}</div>
                        <div className="fd-rno">Receipt: {record.receiptNo}</div>
                      </div>
                      <div className={`fd-stamp ${record.status}`}>
                        {record.status === 'paid' ? 'PAID' : record.status === 'partial' ? 'PARTIAL' : record.status === 'due' ? 'DUE' : 'NO BILL'}
                      </div>
                    </div>
                    <div className="fd-receipt-row"><span>Amount</span><b>{money(record.amount)}</b></div>
                    <div className="fd-receipt-row"><span>Paid</span><b>{money(record.paidAmount)}</b></div>
                    {record.status !== 'paid' ? (
                      <div className="fd-receipt-row"><span>Balance</span><b className="red">{money(record.balance)}</b></div>
                    ) : null}
                    <div className="fd-receipt-divider" />
                    <div className="fd-receipt-row"><span>Month</span><span>{record.monthLabel} {record.year}</span></div>
                    <div className="fd-receipt-row"><span>Mode</span><span>{record.mode}</span></div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <>
              <section className="fd-stats">
                <Stat label="Total Students" value={students.length} />
                <Stat label="Total Collected" value={money(totalCollected)} type="good" />
                <Stat label="Total Pending" value={money(totalPending)} type="warn" />
                <Stat label="Students with Dues" value={dueCount} />
              </section>

              <div className="fd-section-block">
                <div className="fd-section-head">
                  <h2>All Students - Fee Overview</h2>
                  <div className="fd-filters">
                    {[
                      ['all', 'Sabhi'],
                      ['paid', 'Paid Up'],
                      ['partial', 'Partial'],
                      ['due', 'Due'],
                    ].map(([id, label]) => (
                      <button
                        type="button"
                        key={id}
                        className={`fd-chip ${filter === id ? 'active' : ''}`}
                        onClick={() => setFilter(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="fd-class-filters" aria-label="Class and section filters">
                  <label className="fd-filter-field">
                    <span>Class</span>
                    <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
                      <option value="">All Classes</option>
                      {CLASS_OPTIONS.map((className) => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="fd-filter-field">
                    <span>Section</span>
                    <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
                      <option value="">All Sections</option>
                      {SECTION_OPTIONS.map((section) => (
                        <option key={section} value={section}>
                          {section}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <section className="fd-ledger">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Total Fee</th>
                      <th>Collected</th>
                      <th>Pending</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="fd-table-empty">Koi record nahi mila. Search ya filter change karke dekhein.</div>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.id} onClick={() => selectStudent(student.id)}>
                          <td>
                            <div className="fd-table-student">
                              <span className="fd-avatar small">{initials(student.name)}</span>
                              <span>
                                <b>{student.name}</b>
                                <small>Roll {student.roll} | S/o {student.father}</small>
                              </span>
                            </div>
                          </td>
                          <td>{student.className}-{student.section}</td>
                          <td className="fd-amt">{money(student.total)}</td>
                          <td className="fd-amt green">{money(student.collected)}</td>
                          <td className={`fd-amt ${student.pending > 0 ? 'red' : ''}`}>{money(student.pending)}</td>
                          <td>{renderStatus(student.status)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function Stat({ label, value, type = '' }) {
  return (
    <div className={`fd-stat-card ${type}`}>
      <div className="fd-stat-label">{label}</div>
      <div className="fd-stat-value">{value}</div>
    </div>
  )
}

const styles = `
.fd-root{--maroon:#7A2331;--maroon-dark:#511621;--cream:#fff;--cream-line:#E8E2D8;--paper:#fff;--ink:#241C1A;--ink-soft:#6B5F55;--gold:#C89B3C;--gold-soft:#F3E8CC;--green:#1F7A4D;--green-bg:#E6F2EA;--red:#B3261E;--red-bg:#FBEAE8;--amber:#9A6B0C;--amber-bg:#FBF1DC;background:#fff;color:var(--ink);font-family:Inter,Lexend,sans-serif;}
.fd-topbar{background:linear-gradient(180deg,var(--maroon) 0%,var(--maroon-dark) 100%);color:#fff;padding:22px 28px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;border-bottom:4px solid var(--gold);border-radius:10px 10px 0 0;}
.fd-brand{display:flex;align-items:center;gap:14px;}
.fd-brand-mark{width:44px;height:44px;border-radius:50%;border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:700;font-size:16px;color:var(--gold);background:#fff;}
.fd-brand-text h1{font-family:Georgia,serif;font-weight:600;font-size:22px;margin:0;}
.fd-brand-text p{margin:2px 0 0;font-size:12px;color:#E7CFB6;letter-spacing:.6px;text-transform:uppercase;}
.fd-searchwrap{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:9px 14px;min-width:260px;flex:1;max-width:380px;}
.fd-searchwrap input{background:transparent;border:none;outline:none;color:#fff;font-size:14px;width:100%;}
.fd-searchwrap input::placeholder{color:#D9BFA5;}
.fd-layout{border:1px solid var(--cream-line);border-top:none;border-radius:0 0 10px 10px;overflow:hidden;background:#fff;}
.fd-avatar{width:36px;height:36px;border-radius:50%;background:var(--maroon);color:#fff;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:700;font-size:13px;flex-shrink:0;}
.fd-avatar.small{width:30px;height:30px;font-size:11px;}
.fd-avatar.large{width:58px;height:58px;font-size:20px;}
.fd-main{min-width:0;padding:18px 30px 60px;background:#fff;}
.fd-error{border:1px solid #fecdd3;background:#fff1f2;color:#be123c;border-radius:8px;padding:10px 12px;font-size:13px;font-weight:700;margin-bottom:16px;}
.fd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:16px;}
.fd-stat-card{background:#fff;border:1px solid var(--cream-line);border-radius:10px;padding:16px 18px;position:relative;overflow:hidden;}
.fd-stat-card:before{content:"";position:absolute;top:0;left:0;width:4px;height:100%;background:var(--gold);}
.fd-stat-label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--ink-soft);font-weight:700;}
.fd-stat-value{font-family:ui-monospace,Menlo,monospace;font-size:22px;font-weight:700;margin-top:6px;color:var(--maroon-dark);}
.fd-stat-card.good .fd-stat-value{color:var(--green);}
.fd-stat-card.warn .fd-stat-value{color:var(--red);}
.fd-section-block{margin-bottom:14px;}
.fd-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;flex-wrap:wrap;gap:10px;}
.fd-section-head h2{font-family:Georgia,serif;font-size:20px;font-weight:600;margin:0;}
.fd-hint{font-size:12.5px;color:var(--ink-soft);}
.fd-filters{display:flex;gap:8px;flex-wrap:wrap;}
.fd-chip{padding:6px 13px;border-radius:20px;font-size:12.5px;font-weight:700;border:1px solid var(--cream-line);background:#fff;cursor:pointer;color:var(--ink-soft);}
.fd-chip.active{background:var(--maroon);color:#fff;border-color:var(--maroon);}
.fd-class-filters{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;}
.fd-filter-field{display:flex;flex-direction:column;gap:5px;min-width:170px;}
.fd-filter-field span{font-size:10.5px;text-transform:uppercase;letter-spacing:.8px;color:var(--ink-soft);font-weight:800;}
.fd-filter-field select{border:1px solid var(--cream-line);background:#fff;color:var(--ink);border-radius:8px;padding:8px 12px;font-size:13px;font-weight:500;outline:none;min-height:38px;box-shadow:0 6px 16px rgba(36,28,26,.04);}
.fd-filter-field select:focus{border-color:var(--maroon);box-shadow:0 0 0 3px rgba(122,35,49,.12);}
.fd-ledger{background:#fff;border:1px solid var(--cream-line);border-radius:10px;overflow:hidden;}
.fd-ledger table{width:100%;border-collapse:collapse;}
.fd-ledger thead th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.9px;color:var(--ink-soft);padding:12px 18px;background:var(--gold-soft);border-bottom:1px solid var(--cream-line);font-weight:800;}
.fd-ledger tbody td{height:64px;padding:10px 18px;font-size:13.5px;vertical-align:middle;border-bottom:1px solid var(--cream-line);}
.fd-ledger tbody tr{cursor:pointer;transition:background .12s ease;}
.fd-ledger tbody tr:last-child td{border-bottom:none;}
.fd-ledger tbody tr:hover{background:#FDF8ED;}
.fd-table-student{display:flex;align-items:center;gap:10px;min-height:44px;}
.fd-table-student b{display:block;font-weight:800;}
.fd-table-student small{display:block;font-size:11.5px;color:var(--ink-soft);margin-top:1px;}
.fd-amt{font-family:ui-monospace,Menlo,monospace;font-weight:700;vertical-align:middle;}
.green{color:var(--green)!important;}
.red{color:var(--red)!important;}
.fd-status-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:20px;font-size:11.5px;font-weight:800;letter-spacing:.3px;white-space:nowrap;}
.fd-status-pill.paid{background:var(--green-bg);color:var(--green);}
.fd-status-pill.due{background:var(--red-bg);color:var(--red);}
.fd-status-pill.partial{background:var(--amber-bg);color:var(--amber);}
.fd-status-pill.missing{background:#f1f5f9;color:#64748b;}
.fd-table-empty{padding:34px 20px;text-align:center;color:var(--ink-soft);font-weight:700;}
.fd-back-btn{display:inline-flex;align-items:center;gap:6px;background:none;border:none;color:var(--maroon);font-weight:800;font-size:13.5px;cursor:pointer;padding:0;margin-bottom:18px;}
.fd-profile-card{background:#fff;border:1px solid var(--cream-line);border-radius:12px;padding:22px 24px;display:flex;align-items:center;gap:18px;margin-bottom:22px;flex-wrap:wrap;}
.fd-profile-info h2{font-family:Georgia,serif;font-size:22px;margin:0 0 4px;}
.fd-tags{display:flex;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--ink-soft);}
.fd-tags b{color:var(--ink);}
.fd-profile-totals{margin-left:auto;display:flex;gap:22px;flex-wrap:wrap;}
.fd-profile-totals div{text-align:right;}
.fd-label{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.8px;color:var(--ink-soft);font-weight:800;}
.fd-profile-totals b{font-family:ui-monospace,Menlo,monospace;font-weight:800;font-size:17px;display:block;margin-top:3px;}
.fd-year-tabs{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;}
.fd-year-tab{padding:8px 18px;border-radius:8px 8px 0 0;font-family:Georgia,serif;font-weight:700;font-size:15px;background:var(--gold-soft);color:var(--ink-soft);cursor:pointer;border:1px solid var(--cream-line);border-bottom:none;}
.fd-year-tab.active{background:#fff;color:var(--maroon-dark);position:relative;top:1px;}
.fd-receipts{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;}
.fd-receipt{background:#fff;border:1px solid var(--cream-line);border-radius:8px;padding:16px 18px 14px;position:relative;}
.fd-receipt:before{content:"";position:absolute;top:-1px;left:0;right:0;height:6px;background-image:radial-gradient(circle 4px,#fff 4px,transparent 4.5px);background-size:16px 12px;background-position:0 -4px;background-repeat:repeat-x;}
.fd-receipt-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
.fd-term{font-family:Georgia,serif;font-weight:700;font-size:15.5px;}
.fd-rno{font-size:11px;color:var(--ink-soft);font-family:ui-monospace,Menlo,monospace;margin-top:2px;}
.fd-stamp{font-family:ui-monospace,Menlo,monospace;font-size:10px;font-weight:900;letter-spacing:.8px;border:2px dashed;border-radius:50%;width:64px;height:64px;flex-shrink:0;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.15;transform:rotate(-9deg);}
.fd-stamp.paid{color:var(--green);border-color:var(--green);}
.fd-stamp.due{color:var(--red);border-color:var(--red);}
.fd-stamp.partial{color:var(--amber);border-color:var(--amber);}
.fd-stamp.missing{color:#64748b;border-color:#cbd5e1;}
.fd-receipt-row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:var(--ink-soft);gap:12px;}
.fd-receipt-row b{color:var(--ink);font-family:ui-monospace,Menlo,monospace;font-weight:800;}
.fd-receipt-divider{border-top:1px dashed var(--cream-line);margin:10px 0;}
.fd-empty{padding:14px 20px;color:var(--ink-soft);font-size:13px;font-weight:700;}
@media(max-width:880px){.fd-main{padding:20px 14px 36px}.fd-stats{grid-template-columns:repeat(2,1fr)}.fd-profile-totals{margin-left:0;width:100%;justify-content:space-between}.fd-profile-totals div{text-align:left}.fd-topbar{border-radius:10px 10px 0 0}.fd-searchwrap{min-width:100%}}
@media(max-width:560px){.fd-stats{grid-template-columns:1fr}.fd-ledger{overflow-x:auto}.fd-ledger table{min-width:720px}.fd-receipts{grid-template-columns:1fr}.fd-brand-text h1{font-size:18px}}
`

export default FeeDashboard
