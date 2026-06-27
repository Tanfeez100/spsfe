import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getLoginType, getTeachers, getUser } from '../../Api/auth'
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

const panelClass = 'rounded-2xl border border-slate-200 bg-white shadow-sm'
const inputClass =
  'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100'
const subtleInputClass =
  'min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100'

const HISTORY_SCOPE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const CHART_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']

function Alert({ type = 'info', children }) {
  const styles = {
    info: 'border-cyan-200 bg-cyan-50 text-cyan-800',
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  }
  return <div className={`rounded-xl border px-4 py-3 text-sm font-semibold leading-6 ${styles[type]}`}>{children}</div>
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
    <div className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tones[tone] || tones.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-black leading-none">{value}</p>
          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] opacity-70">{label}</p>
        </div>
        <span className="inline-flex rounded-xl border border-white/70 bg-white/60 p-2 text-[20px] shadow-sm">
          <span className="material-symbols-outlined">{icon}</span>
        </span>
      </div>
    </div>
  )
}

const teacherName = (record) =>
  record?.teacher_profiles?.full_name ||
  record?.teacher_profiles?.email ||
  record?.teacher_id ||
  'Teacher'

const teacherHistoryKey = (record) =>
  String(
    record?.teacher_id ||
      record?.teacher_profiles?.id ||
      record?.teacher_profiles?.employee_id ||
      record?.teacher_profiles?.email ||
      teacherName(record) ||
    '',
  ).trim()

const teacherHistoryLabel = (record) => {
  const name = record?.teacher_profiles?.full_name?.trim() || ''
  const email = record?.teacher_profiles?.email?.trim() || ''

  if (name && email) return `${name} - ${email}`
  if (name) return name
  if (email) return email

  return 'Teacher'
}

const teacherRosterKey = (teacher) =>
  String(
    teacher?.id ||
      teacher?.user_id ||
      teacher?.teacher_id ||
      teacher?.teacherId ||
      '',
  ).trim()

const teacherRosterLabel = (teacher) => {
  const name = teacher?.fullName?.trim() || teacher?.profile?.full_name?.trim() || ''
  const email = teacher?.email?.trim() || teacher?.profile?.email?.trim() || ''

  if (name && email) return `${name} - ${email}`
  if (name) return name
  if (email) return email

  return 'Teacher'
}

const getSummary = (records = []) => {
  const summary = records.reduce(
    (acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1
      return acc
    },
    { present: 0, late: 0, half_day: 0, absent: 0, leave: 0, checkout_missing: 0 },
  )

  const workingDays = summary.present + summary.late + summary.half_day + summary.absent + summary.leave
  return {
    ...summary,
    working_days: workingDays,
  }
}

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
      setMessage('Attendance settings saved.')
      await onSaved()
    } catch (err) {
      setError(err?.message || 'Settings save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className={`${panelClass} p-5`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Configuration</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">Attendance Settings</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">School location, radius, and timing rules in one place.</p>
        </div>
        <span className="inline-flex rounded-2xl bg-cyan-50 p-3 text-cyan-700">
          <span className="material-symbols-outlined">settings</span>
        </span>
      </div>
      {error ? (
        <div className="mb-3">
          <Alert type="error">{error}</Alert>
        </div>
      ) : null}
      {message ? (
        <div className="mb-3">
          <Alert type="success">{message}</Alert>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ['school_name', 'School Name', 'text', 'xl:col-span-3'],
          ['latitude', 'Latitude', 'number', ''],
          ['longitude', 'Longitude', 'number', ''],
          ['radius_meters', 'Radius (meters)', 'number', ''],
          ['gps_accuracy_meters', 'Location Accuracy Max', 'number', ''],
          ['school_start_time', 'Start Time', 'time', ''],
          ['school_end_time', 'End Time', 'time', ''],
          ['checkout_deadline', 'Checkout Deadline', 'time', ''],
          ['grace_minutes', 'Grace Minutes', 'number', ''],
          ['late_after_minutes', 'Late After Minutes', 'number', ''],
          ['minimum_working_minutes', 'Minimum Working Minutes', 'number', ''],
        ].map(([field, label, type, spanClass]) => (
          <label key={field} className={`block ${spanClass || ''}`.trim()}>
            <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
            <input
              type={type}
              step={type === 'number' && ['latitude', 'longitude'].includes(field) ? 'any' : undefined}
              value={form[field]}
              onChange={(event) => update(field, event.target.value)}
              className={field === 'school_name' ? inputClass : subtleInputClass}
              required={['latitude', 'longitude'].includes(field)}
            />
          </label>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-base ${saving ? 'animate-spin' : ''}`}>{saving ? 'sync' : 'save'}</span>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  )
}

function RecordsTable({ records }) {
  if (!records.length) {
    return <p className="py-8 text-center text-sm font-semibold text-slate-500">No teacher attendance records found.</p>
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {['Date', 'Teacher', 'Status', 'Check In', 'Check Out', 'Work', 'Distance'].map((head) => (
                <th key={head} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.18em]">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b border-slate-100 transition hover:bg-cyan-50/40">
                <td className="px-4 py-3 font-bold text-slate-900">{record.attendance_date}</td>
                <td className="px-4 py-3">
                  <div className="font-black text-slate-900">{teacherName(record)}</div>
                  <div className="text-xs font-semibold text-slate-500">{record.teacher_profiles?.employee_id || record.teacher_profiles?.mobile || ''}</div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                <td className="px-4 py-3 text-slate-600">{record.check_in_at ? new Date(record.check_in_at).toLocaleTimeString('en-IN') : '-'}</td>
                <td className="px-4 py-3 text-slate-600">{record.check_out_at ? new Date(record.check_out_at).toLocaleTimeString('en-IN') : '-'}</td>
                <td className="px-4 py-3 font-bold text-slate-700">{record.working_minutes || 0} min</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                  In {record.check_in_distance_meters ? `${Math.round(record.check_in_distance_meters)}m` : '-'} / Out {record.check_out_distance_meters ? `${Math.round(record.check_out_distance_meters)}m` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function HistoryBreakdownTable({ title, rows, emptyText }) {
  if (!rows.length) {
    return <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">{emptyText}</p>
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">{title}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {['Period', 'Working Days', 'Present', 'Late', 'Half Day', 'Absent', 'Leave', 'Checkout Missing'].map((head) => (
                <th key={head} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.18em]">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-slate-100">
                <td className="px-4 py-3 font-bold text-slate-900">{row.label}</td>
                <td className="px-4 py-3 font-black text-slate-900">{row.working_days || 0}</td>
                <td className="px-4 py-3 text-slate-700">{row.present || 0}</td>
                <td className="px-4 py-3 text-slate-700">{row.late || 0}</td>
                <td className="px-4 py-3 text-slate-700">{row.half_day || 0}</td>
                <td className="px-4 py-3 text-slate-700">{row.absent || 0}</td>
                <td className="px-4 py-3 text-slate-700">{row.leave || 0}</td>
                <td className="px-4 py-3 text-slate-700">{row.checkout_missing || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function HistorySummaryPanel({ records, teachers, isAdmin, year, onYearChange }) {
  const [scope, setScope] = useState('monthly')
  const [selectedTeacher, setSelectedTeacher] = useState('')

  const teacherOptions = useMemo(() => {
    if (isAdmin && Array.isArray(teachers) && teachers.length) {
      return teachers
        .map((teacher) => {
          const value = teacherRosterKey(teacher)
          if (!value) return null
          return {
            value,
            label: teacherRosterLabel(teacher),
          }
        })
        .filter(Boolean)
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
    }

    const optionMap = new Map()
    records.forEach((record) => {
      const key = teacherHistoryKey(record)
      if (!key || optionMap.has(key)) return
      optionMap.set(key, teacherHistoryLabel(record))
    })

    return Array.from(optionMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
  }, [isAdmin, records, teachers])

  useEffect(() => {
    if (!isAdmin) return
    if (!teacherOptions.length) {
      setSelectedTeacher('')
      return
    }
    if (!teacherOptions.some((option) => option.value === selectedTeacher)) {
      setSelectedTeacher(teacherOptions[0].value)
    }
  }, [isAdmin, selectedTeacher, teacherOptions])

  const visibleRecords = useMemo(() => {
    if (!isAdmin) return records
    if (!selectedTeacher) return []
    return records.filter((record) => {
      const recordTeacherKey = String(
        record?.teacher_id ||
          record?.teacher_profiles?.id ||
          record?.teacher_profiles?.employee_id ||
          record?.teacher_profiles?.email ||
          '',
      ).trim()

      return recordTeacherKey === selectedTeacher
    })
  }, [isAdmin, records, selectedTeacher])

  const rows = useMemo(() => {
    const grouped = new Map()
    visibleRecords.forEach((record) => {
      const periodKey = scope === 'yearly' ? String(record.attendance_date || '').slice(0, 4) : String(record.attendance_date || '').slice(0, 7)
      if (!periodKey || (scope === 'yearly' ? periodKey.length !== 4 : periodKey.length !== 7)) return
      if (!grouped.has(periodKey)) grouped.set(periodKey, [])
      grouped.get(periodKey).push(record)
    })

    return Array.from(grouped.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, periodRecords]) => {
        const summary = getSummary(periodRecords)
        return {
          key,
          label: scope === 'yearly' ? key : formatMonthLabel(key),
          count: periodRecords.length,
          ...summary,
        }
      })
  }, [scope, visibleRecords])

  const chartData = useMemo(() => rows.map((row) => ({
    name: row.label,
    working_days: row.working_days || 0,
    present: row.present || 0,
    late: row.late || 0,
    half_day: row.half_day || 0,
    absent: row.absent || 0,
    leave: row.leave || 0,
    checkout_missing: row.checkout_missing || 0,
  })), [rows])

  const selectedTotals = useMemo(() => {
    return chartData.reduce(
      (acc, row) => {
        acc.working_days += row.working_days
        acc.present += row.present
        acc.late += row.late
        acc.half_day += row.half_day
        acc.absent += row.absent
        acc.leave += row.leave
        acc.checkout_missing += row.checkout_missing
        return acc
      },
      { working_days: 0, present: 0, late: 0, half_day: 0, absent: 0, leave: 0, checkout_missing: 0 },
    )
  }, [chartData])

  const pieData = [
    { name: 'Present', value: selectedTotals.present },
    { name: 'Late', value: selectedTotals.late },
    { name: 'Half Day', value: selectedTotals.half_day },
    { name: 'Absent', value: selectedTotals.absent },
    { name: 'Leave', value: selectedTotals.leave },
    { name: 'Checkout Missing', value: selectedTotals.checkout_missing },
  ].filter((item) => item.value > 0)

  const selectedOption = HISTORY_SCOPE_OPTIONS.find((option) => option.value === scope) || HISTORY_SCOPE_OPTIONS[0]
  const attendanceRate = selectedTotals.working_days > 0 ? Math.round((selectedTotals.present / selectedTotals.working_days) * 100) : 0
  const selectedTeacherLabel = isAdmin
    ? teacherOptions.find((option) => option.value === selectedTeacher)?.label || 'Select Teacher'
    : 'My Records'
  const cards = [
    { label: 'Working Days', value: selectedTotals.working_days, icon: 'event_available', tone: 'green' },
    { label: 'Present', value: selectedTotals.present, icon: 'check_circle', tone: 'cyan' },
    { label: 'Late', value: selectedTotals.late, icon: 'schedule', tone: 'amber' },
    { label: 'Half Day', value: selectedTotals.half_day, icon: 'timelapse', tone: 'slate' },
    { label: 'Absent', value: selectedTotals.absent, icon: 'cancel', tone: 'red' },
    { label: 'Leave', value: selectedTotals.leave, icon: 'event_busy', tone: 'slate' },
  ]

  return (
    <section className={`${panelClass} p-5`}>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">History</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">Attendance History</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">Select monthly or yearly breakdown from one dropdown. The graph and charts below update together.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[140px_180px]">
          <input
            type="number"
            min="2020"
            max="2100"
            value={year}
            onChange={(event) => onYearChange(event.target.value)}
            className={subtleInputClass}
          />
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            className={subtleInputClass}
          >
            {HISTORY_SCOPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} Breakdown
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Kpi key={card.label} label={card.label} value={card.value} icon={card.icon} tone={card.tone} />
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Graph</p>
              <h4 className="mt-1 text-lg font-black text-slate-950">{selectedOption.label} Attendance Trend</h4>
            </div>
            {isAdmin && teacherOptions.length ? (
              <select
                value={selectedTeacher}
                onChange={(event) => setSelectedTeacher(event.target.value)}
                className="min-h-10 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-500 shadow-sm outline-none"
              >
                {teacherOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-500">
                {selectedTeacherLabel}
              </span>
            )}
          </div>
          <div className="h-[340px] rounded-2xl bg-white p-3 shadow-sm">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="present" name="Present" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="half_day" name="Half Day" fill="#fb923c" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">No breakdown data available.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Chart</p>
            <h4 className="mt-1 text-lg font-black text-slate-950">Status Distribution</h4>
            <p className="mt-1 text-sm font-semibold text-slate-500">Selected breakdown ka total mix.</p>
          </div>
          <div className="h-[340px] rounded-2xl bg-white p-3 shadow-sm">
            {pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={58}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #e2e8f0' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">No status data available.</div>
            )}
          </div>
        </div>
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
        <div key={request.id} className={`${panelClass} p-4`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-base font-black text-slate-950">{teacherName(request)}</div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  {request.attendance_date}
                </span>
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-500">
                Check in {request.check_in_at ? new Date(request.check_in_at).toLocaleTimeString('en-IN') : '-'}
              </div>
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
                <span className="font-bold text-slate-900">Reason:</span> {request.checkout_missing_reason || 'Waiting for teacher explanation'}
                {request.checkout_missing_remarks ? ` - ${request.checkout_missing_remarks}` : ''}
              </div>
            </div>
            <div className="grid gap-3 lg:min-w-[420px]">
              <input
                value={remarks[request.id] || ''}
                onChange={(event) => setRemarks((prev) => ({ ...prev, [request.id]: event.target.value }))}
                placeholder="Admin remarks"
                className={subtleInputClass}
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['approve_present', 'Present', 'bg-emerald-600 text-white border-emerald-600'],
                  ['mark_half_day', 'Half Day', 'bg-amber-500 text-white border-amber-500'],
                  ['mark_absent', 'Absent', 'bg-rose-600 text-white border-rose-600'],
                  ['reject', 'Reject', 'bg-slate-900 text-white border-slate-900'],
                ].map(([decision, label, tone]) => (
                  <button
                    key={decision}
                    type="button"
                    onClick={() => onReview(request.id, { decision, admin_remarks: remarks[request.id] || '' })}
                    className={`min-h-10 rounded-xl border px-3 text-xs font-black transition hover:opacity-90 ${tone}`}
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
        <div key={leave.id} className={`${panelClass} p-4`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-black text-slate-950">{teacherName(leave)}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${
                    leave.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700'
                      : leave.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {leave.status}
                </span>
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-500">
                {leave.leave_type} | {leave.from_date} to {leave.to_date}
              </div>
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">{leave.reason}</p>
            </div>
            {isAdmin && leave.status === 'pending' ? (
              <div className="grid gap-3 lg:min-w-[320px]">
                <input
                  value={remarks[leave.id] || ''}
                  onChange={(event) => setRemarks((prev) => ({ ...prev, [leave.id]: event.target.value }))}
                  placeholder="Admin remarks"
                  className={subtleInputClass}
                />
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => onReview(leave.id, { status: 'approved', admin_remarks: remarks[leave.id] || '' })} className="min-h-10 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white transition hover:bg-emerald-700">Approve</button>
                  <button type="button" onClick={() => onReview(leave.id, { status: 'rejected', admin_remarks: remarks[leave.id] || '' })} className="min-h-10 rounded-xl bg-rose-600 px-3 text-xs font-black text-white transition hover:bg-rose-700">Reject</button>
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
  const [teachers, setTeachers] = useState([])
  const [historySummary, setHistorySummary] = useState(null)
  const [monthlySummary, setMonthlySummary] = useState([])
  const [yearlySummary, setYearlySummary] = useState([])
  const [checkoutRequests, setCheckoutRequests] = useState([])
  const [leaves, setLeaves] = useState([])
  const [filters, setFilters] = useState({ year: currentYear(), status: '', from: '', to: '' })
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
      const [settingsResponse, todayResponse, recordsResponse, checkoutResponse, leavesResponse, teachersResponse] = await Promise.all([
        getTeacherAttendanceSettings(),
        getTeacherAttendanceToday(),
        getTeacherAttendanceRecords(recordsParams),
        isAdmin ? getPendingCheckoutRequests() : Promise.resolve({ requests: [] }),
        getTeacherLeaveRequests(),
        isAdmin ? getTeachers() : Promise.resolve({ teachers: [] }),
      ])
      setSettings(settingsResponse.settings)
      setTodayData(todayResponse)
      setRecords(recordsResponse.records || [])
      setTeachers(teachersResponse.teachers || [])
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
    return <Alert type="warning">Teacher attendance sirf admin aur teacher ke liye available hai.</Alert>
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-sm font-black text-slate-500">
        <span className="material-symbols-outlined mr-2 animate-spin">sync</span>
        Loading teacher attendance...
      </div>
    )
  }

  return (
    <div className="space-y-5" style={{ fontFamily: "'Lexend', sans-serif" }}>
      <div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/40 to-slate-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Staff Attendance</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Teacher Attendance</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Check-in, checkout review, leave, and reports in one clean panel.</p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-base ${saving ? 'animate-spin' : ''}`}>sync</span>
            Refresh
          </button>
        </div>
      </div>

      <HistorySummaryPanel
        records={records}
        teachers={teachers}
        isAdmin={isAdmin}
        year={filters.year}
        onYearChange={updateYear}
      />

      {error ? <Alert type="error">{error}</Alert> : null}
      {message ? <Alert type="success">{message}</Alert> : null}
      {settingsReady && !error && !settings ? <Alert type="warning">Admin ko pehle school location settings configure karni hogi.</Alert> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Present" value={summary.present} icon="check_circle" tone="green" />
        <Kpi label="Half Day" value={summary.halfDay} icon="timelapse" tone="amber" />
        <Kpi label="Leave" value={summary.leave} icon="event_available" tone="cyan" />
        <Kpi label="Checkout Missing" value={summary.checkoutMissing || checkoutRequests.length} icon="warning" tone="red" />
      </div>

      {!isAdmin ? (
        <div className={`${panelClass} p-5`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Today</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">My Today Status</h3>
            </div>
            <StatusBadge status={todayData?.attendance?.status} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-slate-500">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">Date {todayData?.date || today()}</span>
            {todayData?.attendance?.check_in_at ? <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">In {new Date(todayData.attendance.check_in_at).toLocaleTimeString('en-IN')}</span> : null}
            {todayData?.attendance?.check_out_at ? <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">Out {new Date(todayData.attendance.check_out_at).toLocaleTimeString('en-IN')}</span> : null}
          </div>
          {todayData?.pendingCheckout?.length ? (
            <div className="mt-4">
              <Alert type="warning">Mobile app open karke pending checkout explanation submit karna mandatory hai.</Alert>
            </div>
          ) : null}
        </div>
      ) : null}

      {isAdmin ? <SettingsPanel settings={settings} onSaved={load} /> : null}

      {isAdmin ? (
        <section className="space-y-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Review</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">Pending Checkout Review</h3>
          </div>
          <CheckoutRequests requests={checkoutRequests} onReview={reviewCheckout} />
        </section>
      ) : null}

      <section className={`${panelClass} p-5`}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Reports</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">Attendance Reports</h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">Filter, review, and export teacher attendance.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[150px_150px_180px_auto]">
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
              className={subtleInputClass}
            />
            <input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
              className={subtleInputClass}
            />
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              className={subtleInputClass}
            >
              <option value="">All statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => downloadCsv(records)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
            >
              <span className="material-symbols-outlined text-base">download</span>
              CSV
            </button>
          </div>
        </div>
        <RecordsTable records={records} />
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{isAdmin ? 'Review' : 'My'}</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">{isAdmin ? 'Leave Review' : 'My Leave Requests'}</h3>
        </div>
        <LeaveRequests leaves={leaves} isAdmin={isAdmin} onReview={reviewLeave} />
      </section>
    </div>
  )
}

export default TeacherGpsAttendance
