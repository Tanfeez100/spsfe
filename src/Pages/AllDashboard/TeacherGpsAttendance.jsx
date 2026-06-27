import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getLoginType, getUser } from '../../Api/auth'
import {
  getPendingCheckoutRequests,
  getTeacherAttendanceRecords,
  getTeacherAttendanceSettings,
  getTeacherAttendanceToday,
  getTeacherLeaveRequests,
  reviewCheckoutRequest,
  reviewTeacherLeaveRequest,
  saveTeacherAttendanceSettings,
} from '../../Api/teacherAttendance'

const today = () => new Date().toISOString().slice(0, 10)
const currentYear = () => String(new Date().getFullYear())
const formatMonthLabel = (monthKey) => {
  if (!monthKey) return '-'
  const parsed = new Date(`${monthKey}-01T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return monthKey
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(parsed)
}

const statusLabels = {
  present_provisional: 'Present Provisional',
  present: 'Present',
  late: 'Late',
  half_day: 'Half Day',
  absent: 'Absent',
  leave: 'Leave',
  holiday: 'Holiday',
  checkout_missing: 'Checkout Missing',
  rejected: 'Rejected',
}

const statusTone = {
  present_provisional: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  present: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  late: 'border-amber-200 bg-amber-50 text-amber-900',
  half_day: 'border-orange-200 bg-orange-50 text-orange-800',
  absent: 'border-rose-200 bg-rose-50 text-rose-800',
  leave: 'border-sky-200 bg-sky-50 text-sky-800',
  holiday: 'border-slate-200 bg-slate-50 text-slate-700',
  checkout_missing: 'border-red-200 bg-red-50 text-red-800',
  rejected: 'border-zinc-200 bg-zinc-50 text-zinc-800',
}

function Alert({ type = 'info', children }) {
  const styles = {
    info: 'border-cyan-200 bg-cyan-50 text-cyan-800',
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  }
  return <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${styles[type]}`}>{children}</div>
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${statusTone[status] || statusTone.holiday}`}>
      {statusLabels[status] || status || 'Not marked'}
    </span>
  )
}

function Kpi({ label, value, icon, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-900',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-rose-200 bg-rose-50 text-rose-900',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-900',
  }
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${tones[tone] || tones.slate}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-black">{value}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] opacity-70">{label}</p>
        </div>
        <span className="material-symbols-outlined rounded-lg bg-white/70 p-2 text-[22px]">{icon}</span>
      </div>
    </div>
  )
}

const teacherName = (record) =>
  record?.teacher_profiles?.full_name ||
  record?.teacher_profiles?.email ||
  record?.teacher_id ||
  'Teacher'

function downloadCsv(rows) {
  const headers = ['Date', 'Teacher', 'Employee ID', 'Status', 'Check In', 'Check Out', 'Working Minutes', 'Distance In', 'Distance Out']
  const body = rows.map((row) => [
    row.attendance_date,
    teacherName(row),
    row.teacher_profiles?.employee_id || '',
    statusLabels[row.status] || row.status,
    row.check_in_at || '',
    row.check_out_at || '',
    row.working_minutes || 0,
    row.check_in_distance_meters || '',
    row.check_out_distance_meters || '',
  ])
  const csv = [headers, ...body]
    .map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `teacher-attendance-${today()}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

function SettingsPanel({ settings, onSaved }) {
  const [form, setForm] = useState({
    school_name: 'Star Public School',
    latitude: '',
    longitude: '',
    radius_meters: 150,
    gps_accuracy_meters: 80,
    school_start_time: '07:00',
    school_end_time: '13:00',
    grace_minutes: 15,
    checkout_deadline: '14:00',
    minimum_working_minutes: 180,
    late_after_minutes: 15,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!settings) return
    setForm({
      school_name: settings.school_name || 'Star Public School',
      latitude: settings.latitude ?? '',
      longitude: settings.longitude ?? '',
      radius_meters: settings.radius_meters || 150,
      gps_accuracy_meters: settings.gps_accuracy_meters || 80,
      school_start_time: String(settings.school_start_time || '07:00').slice(0, 5),
      school_end_time: String(settings.school_end_time || '13:00').slice(0, 5),
      grace_minutes: settings.grace_minutes || 15,
      checkout_deadline: String(settings.checkout_deadline || '14:00').slice(0, 5),
      minimum_working_minutes: settings.minimum_working_minutes || 180,
      late_after_minutes: settings.late_after_minutes || settings.grace_minutes || 15,
    })
  }, [settings])

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
    setMessage('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await saveTeacherAttendanceSettings(form)
      setMessage('GPS attendance settings saved.')
      await onSaved()
    } catch (err) {
      setError(err?.message || 'Settings save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-950">GPS Attendance Settings</h3>
          <p className="text-sm font-semibold text-slate-500">School location, radius and timing rules.</p>
        </div>
        <span className="material-symbols-outlined rounded-lg bg-cyan-50 p-2 text-cyan-700">settings</span>
      </div>
      {error ? <div className="mb-3"><Alert type="error">{error}</Alert></div> : null}
      {message ? <div className="mb-3"><Alert type="success">{message}</Alert></div> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['school_name', 'School Name', 'text'],
          ['latitude', 'Latitude', 'number'],
          ['longitude', 'Longitude', 'number'],
          ['radius_meters', 'Radius (meters)', 'number'],
          ['gps_accuracy_meters', 'GPS Accuracy Max', 'number'],
          ['school_start_time', 'Start Time', 'time'],
          ['school_end_time', 'End Time', 'time'],
          ['checkout_deadline', 'Checkout Deadline', 'time'],
          ['grace_minutes', 'Grace Minutes', 'number'],
          ['late_after_minutes', 'Late After Minutes', 'number'],
          ['minimum_working_minutes', 'Minimum Working Minutes', 'number'],
        ].map(([field, label, type]) => (
          <label key={field} className={field === 'school_name' ? 'block sm:col-span-2' : 'block'}>
            <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
            <input
              type={type}
              step={type === 'number' && ['latitude', 'longitude'].includes(field) ? 'any' : undefined}
              value={form[field]}
              onChange={(event) => update(field, event.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900"
              required={['latitude', 'longitude'].includes(field)}
            />
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={saving}
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
      >
        <span className={`material-symbols-outlined text-base ${saving ? 'animate-spin' : ''}`}>{saving ? 'sync' : 'save'}</span>
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}

function RecordsTable({ records }) {
  if (!records.length) {
    return <p className="py-8 text-center text-sm font-semibold text-slate-500">No teacher attendance records found.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-sm">
        <thead className="bg-slate-950 text-white">
          <tr>
            {['Date', 'Teacher', 'Status', 'Check In', 'Check Out', 'Work', 'GPS'].map((head) => (
              <th key={head} className="px-3 py-3 text-left font-black">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-3 font-bold text-slate-900">{record.attendance_date}</td>
              <td className="px-3 py-3">
                <div className="font-black text-slate-900">{teacherName(record)}</div>
                <div className="text-xs font-semibold text-slate-500">{record.teacher_profiles?.employee_id || record.teacher_profiles?.mobile || ''}</div>
              </td>
              <td className="px-3 py-3"><StatusBadge status={record.status} /></td>
              <td className="px-3 py-3 text-slate-600">{record.check_in_at ? new Date(record.check_in_at).toLocaleTimeString('en-IN') : '-'}</td>
              <td className="px-3 py-3 text-slate-600">{record.check_out_at ? new Date(record.check_out_at).toLocaleTimeString('en-IN') : '-'}</td>
              <td className="px-3 py-3 font-bold text-slate-700">{record.working_minutes || 0} min</td>
              <td className="px-3 py-3 text-xs font-semibold text-slate-500">
                In {record.check_in_distance_meters ? `${Math.round(record.check_in_distance_meters)}m` : '-'} / Out {record.check_out_distance_meters ? `${Math.round(record.check_out_distance_meters)}m` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HistoryBreakdownTable({ title, rows, emptyText }) {
  if (!rows.length) {
    return <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-semibold text-slate-500">{emptyText}</p>
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">{title}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {['Period', 'Working Days', 'Present', 'Late', 'Half Day', 'Absent', 'Leave', 'Checkout Missing'].map((head) => (
                <th key={head} className="px-3 py-3 text-left font-black">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-slate-100">
                <td className="px-3 py-3 font-bold text-slate-900">{row.label}</td>
                <td className="px-3 py-3 font-black text-slate-900">{row.working_days || 0}</td>
                <td className="px-3 py-3">{row.present || 0}</td>
                <td className="px-3 py-3">{row.late || 0}</td>
                <td className="px-3 py-3">{row.half_day || 0}</td>
                <td className="px-3 py-3">{row.absent || 0}</td>
                <td className="px-3 py-3">{row.leave || 0}</td>
                <td className="px-3 py-3">{row.checkout_missing || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function HistorySummaryPanel({ summary, monthlySummary, yearlySummary, year, onYearChange }) {
  const cards = [
    { label: 'Working Days', value: summary?.working_days || 0, icon: 'event_available', tone: 'green' },
    { label: 'Present', value: summary?.present || 0, icon: 'check_circle', tone: 'cyan' },
    { label: 'Late', value: summary?.late || 0, icon: 'schedule', tone: 'amber' },
    { label: 'Half Day', value: summary?.half_day ?? summary?.halfDay ?? 0, icon: 'timelapse', tone: 'slate' },
    { label: 'Absent', value: summary?.absent || 0, icon: 'cancel', tone: 'red' },
    { label: 'Leave', value: summary?.leave || 0, icon: 'event_busy', tone: 'slate' },
  ]

  const monthlyRows = monthlySummary.map((row) => ({
    ...row,
    label: formatMonthLabel(row.key),
  }))
  const yearlyRows = yearlySummary.map((row) => ({
    ...row,
    label: row.key,
  }))

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-950">Attendance History</h3>
          <p className="text-sm font-semibold text-slate-500">Monthly and yearly working day history for teachers. Admin sees all teachers, teacher sees only own records.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[140px_auto]">
          <input
            type="number"
            min="2020"
            max="2100"
            value={year}
            onChange={(event) => onYearChange(event.target.value)}
            className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm"
          />
          <div className="flex min-h-10 items-center rounded-lg bg-slate-50 px-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Select year
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Kpi key={card.label} label={card.label} value={card.value} icon={card.icon} tone={card.tone} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <HistoryBreakdownTable title="Monthly Breakdown" rows={monthlyRows} emptyText="Is year ke liye monthly history nahi mili." />
        <HistoryBreakdownTable title="Year Breakdown" rows={yearlyRows} emptyText="Year summary available nahi hai." />
      </div>
    </section>
  )
}

function CheckoutRequests({ requests, onReview }) {
  const [remarks, setRemarks] = useState({})
  if (!requests.length) return <Alert type="info">No pending checkout missing request.</Alert>
  return (
    <div className="grid gap-3">
      {requests.map((request) => (
        <div key={request.id} className="rounded-xl border border-red-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="font-black text-slate-950">{teacherName(request)}</div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                {request.attendance_date} | Check in {request.check_in_at ? new Date(request.check_in_at).toLocaleTimeString('en-IN') : '-'}
              </div>
              <div className="mt-2 text-sm text-slate-700">
                Reason: <span className="font-bold">{request.checkout_missing_reason || 'Waiting for teacher explanation'}</span>
                {request.checkout_missing_remarks ? ` - ${request.checkout_missing_remarks}` : ''}
              </div>
            </div>
            <div className="grid gap-2 sm:min-w-[420px]">
              <input
                value={remarks[request.id] || ''}
                onChange={(event) => setRemarks((prev) => ({ ...prev, [request.id]: event.target.value }))}
                placeholder="Admin remarks"
                className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm"
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['approve_present', 'Present'],
                  ['mark_half_day', 'Half Day'],
                  ['mark_absent', 'Absent'],
                  ['reject', 'Reject'],
                ].map(([decision, label]) => (
                  <button
                    key={decision}
                    type="button"
                    onClick={() => onReview(request.id, { decision, admin_remarks: remarks[request.id] || '' })}
                    className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LeaveRequests({ leaves, isAdmin, onReview }) {
  const [remarks, setRemarks] = useState({})
  if (!leaves.length) return <Alert type="info">No leave requests found.</Alert>
  return (
    <div className="grid gap-3">
      {leaves.map((leave) => (
        <div key={leave.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-slate-950">{teacherName(leave)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${leave.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : leave.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                  {leave.status}
                </span>
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">{leave.leave_type} | {leave.from_date} to {leave.to_date}</div>
              <p className="mt-2 text-sm text-slate-700">{leave.reason}</p>
            </div>
            {isAdmin && leave.status === 'pending' ? (
              <div className="grid gap-2 sm:min-w-[320px]">
                <input
                  value={remarks[leave.id] || ''}
                  onChange={(event) => setRemarks((prev) => ({ ...prev, [leave.id]: event.target.value }))}
                  placeholder="Admin remarks"
                  className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => onReview(leave.id, { status: 'approved', admin_remarks: remarks[leave.id] || '' })} className="min-h-10 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white">Approve</button>
                  <button type="button" onClick={() => onReview(leave.id, { status: 'rejected', admin_remarks: remarks[leave.id] || '' })} className="min-h-10 rounded-lg bg-rose-600 px-3 text-xs font-black text-white">Reject</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function TeacherGpsAttendance() {
  const [user] = useState(getUser)
  const [loginType] = useState(getLoginType)
  const isAdmin = loginType === 'all' && user?.role === 'admin'
  const [settings, setSettings] = useState(null)
  const [todayData, setTodayData] = useState(null)
  const [records, setRecords] = useState([])
  const [historySummary, setHistorySummary] = useState(null)
  const [monthlySummary, setMonthlySummary] = useState([])
  const [yearlySummary, setYearlySummary] = useState([])
  const [checkoutRequests, setCheckoutRequests] = useState([])
  const [leaves, setLeaves] = useState([])
  const [filters, setFilters] = useState({ year: currentYear(), status: '' })
  const [loading, setLoading] = useState(true)
  const [settingsReady, setSettingsReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const updateYear = (nextYear) => {
    const safeYear = String(nextYear || '').replace(/\D/g, '').slice(0, 4)
    setFilters((prev) => ({ ...prev, year: safeYear }))
  }

  const load = useCallback(async () => {
    const normalizedYear = String(filters.year || "").replace(/\D/g, "").slice(0, 4)
    if (normalizedYear.length !== 4) {
      return
    }

    setLoading(true)
    setError('')
    setSettingsReady(false)
    try {
      const recordsParams = {
        ...filters,
        year: normalizedYear,
      }
      const [settingsResponse, todayResponse, recordsResponse, checkoutResponse, leavesResponse] = await Promise.all([
        getTeacherAttendanceSettings(),
        getTeacherAttendanceToday(),
        getTeacherAttendanceRecords(recordsParams),
        isAdmin ? getPendingCheckoutRequests() : Promise.resolve({ requests: [] }),
        getTeacherLeaveRequests(),
      ])
      setSettings(settingsResponse.settings)
      setTodayData(todayResponse)
      setRecords(recordsResponse.records || [])
      setHistorySummary(recordsResponse.summary || null)
      setMonthlySummary(recordsResponse.monthlySummary || [])
      setYearlySummary(recordsResponse.yearlySummary || [])
      setCheckoutRequests(checkoutResponse.requests || [])
      setLeaves(leavesResponse.leaves || [])
      setSettingsReady(true)
    } catch (err) {
      setError(err?.message || "Teacher's attendance load failed")
    } finally {
      setLoading(false)
    }
  }, [filters, isAdmin])

  useEffect(() => {
    load()
  }, [load])

  const summary = useMemo(() => {
    const base = records.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1
      return acc
    }, {})
    return {
      present: (base.present || 0) + (base.late || 0),
      late: base.late || 0,
      halfDay: base.half_day || 0,
      leave: base.leave || 0,
      checkoutMissing: base.checkout_missing || 0,
      absent: base.absent || 0,
    }
  }, [records])

  const historyStats = useMemo(() => ({
    working_days: historySummary?.working_days ?? summary.present + summary.halfDay,
    present: historySummary?.present ?? summary.present,
    late: historySummary?.late ?? summary.late,
    halfDay: historySummary?.half_day ?? summary.halfDay,
    leave: historySummary?.leave ?? summary.leave,
    absent: historySummary?.absent ?? summary.absent,
  }), [historySummary, summary.absent, summary.halfDay, summary.late, summary.leave, summary.present])

  const reviewCheckout = async (requestId, payload) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await reviewCheckoutRequest(requestId, payload)
      setMessage('Checkout request reviewed.')
      await load()
    } catch (err) {
      setError(err?.message || 'Checkout review failed')
    } finally {
      setSaving(false)
    }
  }

  const reviewLeave = async (leaveId, payload) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await reviewTeacherLeaveRequest(leaveId, payload)
      setMessage('Leave request updated.')
      await load()
    } catch (err) {
      setError(err?.message || 'Leave review failed')
    } finally {
      setSaving(false)
    }
  }

  if (!user || loginType === 'student') {
    return <Alert type="warning">Teacher GPS attendance sirf admin aur teacher ke liye available hai.</Alert>
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-sm font-black text-slate-500">
        <span className="material-symbols-outlined mr-2 animate-spin">sync</span>
        Loading teacher GPS attendance...
      </div>
    )
  }

  return (
    <div className="space-y-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">GPS Staff Attendance</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Teacher Management & GPS Attendance</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Check-in/out, checkout missing review, leave and reports.</p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={saving}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            <span className={`material-symbols-outlined text-base ${saving ? 'animate-spin' : ''}`}>sync</span>
            Refresh
          </button>
        </div>
      </div>

      <HistorySummaryPanel
        summary={historyStats}
        monthlySummary={monthlySummary}
        yearlySummary={yearlySummary}
        year={filters.year}
        onYearChange={updateYear}
      />

      {error ? <Alert type="error">{error}</Alert> : null}
      {message ? <Alert type="success">{message}</Alert> : null}
      {settingsReady && !error && !settings ? <Alert type="warning">Admin ko pehle school GPS settings configure karni hogi.</Alert> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Present" value={summary.present} icon="check_circle" tone="green" />
        <Kpi label="Half Day" value={summary.halfDay} icon="timelapse" tone="amber" />
        <Kpi label="Leave" value={summary.leave} icon="event_available" tone="cyan" />
        <Kpi label="Checkout Missing" value={summary.checkoutMissing || checkoutRequests.length} icon="warning" tone="red" />
      </div>

      {!isAdmin ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">My Today Status</h3>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusBadge status={todayData?.attendance?.status} />
            <span className="text-sm font-semibold text-slate-500">Date {todayData?.date || today()}</span>
            {todayData?.attendance?.check_in_at ? <span className="text-sm font-semibold text-slate-500">In {new Date(todayData.attendance.check_in_at).toLocaleTimeString('en-IN')}</span> : null}
            {todayData?.attendance?.check_out_at ? <span className="text-sm font-semibold text-slate-500">Out {new Date(todayData.attendance.check_out_at).toLocaleTimeString('en-IN')}</span> : null}
          </div>
          {todayData?.pendingCheckout?.length ? (
            <div className="mt-3"><Alert type="warning">Mobile app open karke pending checkout explanation submit karna mandatory hai.</Alert></div>
          ) : null}
        </div>
      ) : null}

      {isAdmin ? <SettingsPanel settings={settings} onSaved={load} /> : null}

      {isAdmin ? (
        <section className="space-y-3">
          <h3 className="text-lg font-black text-slate-950">Pending Checkout Review</h3>
          <CheckoutRequests requests={checkoutRequests} onReview={reviewCheckout} />
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950">Attendance Reports</h3>
            <p className="text-sm font-semibold text-slate-500">Filter, review and export teacher attendance.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[150px_150px_180px_auto]">
            <input type="date" value={filters.from} onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm" />
            <input type="date" value={filters.to} onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm" />
            <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm">
              <option value="">All statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button type="button" onClick={() => downloadCsv(records)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white">
              <span className="material-symbols-outlined text-base">download</span>
              CSV
            </button>
          </div>
        </div>
        <RecordsTable records={records} />
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-black text-slate-950">{isAdmin ? 'Leave Review' : 'My Leave Requests'}</h3>
        <LeaveRequests leaves={leaves} isAdmin={isAdmin} onReview={reviewLeave} />
      </section>
    </div>
  )
}

export default TeacherGpsAttendance
