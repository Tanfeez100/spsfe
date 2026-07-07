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
import {
  getStudentLeaveRequestsAdmin,
  reviewStudentLeaveRequest,
} from '../../Api/studentLeaves'

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
  not_marked: 'Not Marked',
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
  not_marked: 'border-slate-200 bg-slate-50 text-slate-700',
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

const getCurrentUserDisplayName = (user) =>
  user?.fullName?.trim() ||
  user?.full_name?.trim() ||
  user?.name?.trim() ||
  user?.email?.trim() ||
  'Teacher'

const getTeacherDisplayName = (record, teacherLookup = new Map(), fallbackName = '') => {
  const explicitName = record?.teacher_display_name?.trim()
  if (explicitName) return explicitName

  const teacherId = String(
    record?.teacher_id ||
      record?.teacher_profiles?.id ||
      record?.teacher_profiles?.teacher_id ||
      '',
  ).trim()

  const rosterTeacher = teacherLookup.get(teacherId)
  const rosterName =
    rosterTeacher?.fullName?.trim() ||
    rosterTeacher?.profile?.full_name?.trim() ||
    rosterTeacher?.email?.trim() ||
    ''

  const profileName = record?.teacher_profiles?.full_name?.trim() || ''
  const profileEmail = record?.teacher_profiles?.email?.trim() || ''

  return rosterName || profileName || profileEmail || fallbackName || teacherId || 'Teacher'
}

const resolveTeacherRecordKey = (record) =>
  String(
    record?.teacher_id ||
      record?.teacher_profiles?.id ||
      record?.teacher_profiles?.employee_id ||
      record?.teacher_profiles?.email ||
      '',
  ).trim()

const teacherHistoryKey = (record) =>
  resolveTeacherRecordKey(record)

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

const getStudentDisplayName = (request) => {
  const student = request?.student || {}
  const name = student?.name?.trim() || request?.student_name?.trim() || ''
  const className = request?.class || student?.class || ''
  const section = request?.section || student?.section || ''
  const rollNo = request?.roll_no || student?.roll_no || ''
  const fallbackParts = [className ? `Class ${className}` : '', section ? `Section ${section}` : '', rollNo ? `Roll ${rollNo}` : ''].filter(Boolean)

  if (name) return name
  if (fallbackParts.length) return fallbackParts.join(' · ')
  return request?.student_id || 'Student'
}

const getStudentDisplayMeta = (request) => {
  const student = request?.student || {}
  const parts = [
    request?.class || student?.class ? `Class ${request?.class || student?.class}` : '',
    request?.section || student?.section ? `Section ${request?.section || student?.section}` : '',
    request?.roll_no || student?.roll_no ? `Roll ${request?.roll_no || student?.roll_no}` : '',
  ].filter(Boolean)
  return parts.join(' · ')
}

const requestStatusTone = (status) => {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
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

function downloadCsv(rows, teacherLookup = new Map(), fallbackName = '') {
  const headers = ['Date', 'Teacher', 'Employee ID', 'Status', 'Check In', 'Check Out', 'Working Minutes', 'Distance In', 'Distance Out']
  const body = rows.map((row) => [
    row.attendance_date,
    getTeacherDisplayName(row, teacherLookup, fallbackName),
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

function RecordsTable({ records, teacherLookup, fallbackName }) {
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
                  <div className="font-black text-slate-900">{getTeacherDisplayName(record, teacherLookup, fallbackName)}</div>
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

function DailyAttendanceTable({ rows }) {
  if (!rows.length) {
    return <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">No teacher records found for this date.</p>
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {['Teacher', 'Employee ID', 'Status', 'Check In', 'Check Out', 'Work', 'Distance'].map((head) => (
                <th key={head} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.18em]">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-slate-100 transition hover:bg-cyan-50/40">
                <td className="px-4 py-3">
                  <div className="font-black text-slate-900">{row.teacher_name}</div>
                  <div className="text-xs font-semibold text-slate-500">{row.email || ''}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{row.employee_id || '-'}</td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                <td className="px-4 py-3 text-slate-600">{row.check_in_at ? new Date(row.check_in_at).toLocaleTimeString('en-IN') : '-'}</td>
                <td className="px-4 py-3 text-slate-600">{row.check_out_at ? new Date(row.check_out_at).toLocaleTimeString('en-IN') : '-'}</td>
                <td className="px-4 py-3 font-bold text-slate-700">{row.working_minutes || 0} min</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                  In {row.check_in_distance_meters ? `${Math.round(row.check_in_distance_meters)}m` : '-'} / Out {row.check_out_distance_meters ? `${Math.round(row.check_out_distance_meters)}m` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function HistorySummaryPanel({
  visibleRecords,
  teacherOptions,
  selectedTeacher,
  onTeacherChange,
  isAdmin,
  currentTeacherLabel,
  year,
  onYearChange,
}) {
  const [scope, setScope] = useState('monthly')

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
    : currentTeacherLabel || 'My Records'
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
          <h3 className="mt-1 text-xl font-black text-slate-950">Teacher Attendance History</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            {isAdmin
              ? "Select a teacher, then switch monthly or yearly view to review that teacher's history."
              : 'Monthly and yearly history for your own attendance only.'}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Teacher</span>
            {isAdmin && teacherOptions.length ? (
              <select
                value={selectedTeacher}
                onChange={(event) => onTeacherChange(event.target.value)}
                className={subtleInputClass}
              >
                {teacherOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex min-h-11 items-center truncate rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700">
                {selectedTeacherLabel}
              </div>
            )}
          </label>
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Year</span>
            <input
              type="number"
              min="2020"
              max="2100"
              value={year}
              onChange={(event) => onYearChange(event.target.value)}
              className={subtleInputClass}
            />
          </label>
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Breakdown</span>
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
          </label>
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
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-500">
              {selectedTeacherLabel}
            </span>
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

function CheckoutRequests({ requests, onReview, teacherLookup, fallbackName }) {
  const [remarks, setRemarks] = useState({})
  if (!requests.length) return <Alert type="info">No pending checkout missing request.</Alert>
  return (
    <div className="grid gap-3">
      {requests.map((request) => (
        <div key={request.id} className={`${panelClass} p-4`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-base font-black text-slate-950">{getTeacherDisplayName(request, teacherLookup, fallbackName)}</div>
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
            <div className="grid gap-3 lg:min-w-[320px]">
              <input
                value={remarks[request.id] || ''}
                onChange={(event) => setRemarks((prev) => ({ ...prev, [request.id]: event.target.value }))}
                placeholder="Admin remarks"
                className={subtleInputClass}
              />
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['approve_present', 'Approve', 'bg-emerald-600 text-white border-emerald-600'],
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

function LeaveRequests({ leaves, isAdmin, onReview, teacherLookup, fallbackName }) {
  const [remarks, setRemarks] = useState({})
  if (!leaves.length) return <Alert type="info">No leave requests found.</Alert>
  return (
    <div className="grid gap-3">
      {leaves.map((leave) => (
        <div key={leave.id} className={`${panelClass} p-4`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-black text-slate-950">{getTeacherDisplayName(leave, teacherLookup, fallbackName)}</span>
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

function StudentLeaveRequests({ leaves, isAdmin, onReview }) {
  const [remarks, setRemarks] = useState({})
  if (!leaves.length) return <Alert type="info">No student leave requests found.</Alert>
  return (
    <div className="grid gap-3">
      {leaves.map((leave) => (
        <div key={leave.id} className={`${panelClass} p-4`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-black text-slate-950">{getStudentDisplayName(leave)}</span>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${requestStatusTone(leave.status)}`}>
                  {leave.status}
                </span>
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-500">
                {getStudentDisplayMeta(leave) || 'Student request'} | {leave.leave_type} | {leave.from_date} to {leave.to_date}
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
                  <button
                    type="button"
                    onClick={() => onReview(leave.id, { status: 'approved', admin_remarks: remarks[leave.id] || '' })}
                    className="min-h-10 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white transition hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onReview(leave.id, { status: 'rejected', admin_remarks: remarks[leave.id] || '' })}
                    className="min-h-10 rounded-xl bg-rose-600 px-3 text-xs font-black text-white transition hover:bg-rose-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function ActionRequestsPanel({
  checkoutRequests,
  teacherLeaves,
  studentLeaves,
  teacherLookup,
  fallbackName,
  onReviewCheckout,
  onReviewTeacherLeave,
  onReviewStudentLeave,
}) {
  const totalRequests = checkoutRequests.length + teacherLeaves.length + studentLeaves.length
  const pendingTeacherLeaves = teacherLeaves.filter((leave) => leave.status === 'pending').length
  const pendingStudentLeaves = studentLeaves.filter((leave) => leave.status === 'pending').length
  const pendingCheckoutRequests = checkoutRequests.length

  return (
    <section className="space-y-4">
      <div className={`${panelClass} p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Action</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">Requests Inbox</h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              Checkout explanation, teacher leave, aur student leave requests sab ek jagah.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Total Requests</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{totalRequests}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Checkout Explanations" value={pendingCheckoutRequests} icon="pending_actions" tone="amber" />
        <Kpi label="Teacher Leaves" value={teacherLeaves.length} icon="badge" tone="cyan" />
        <Kpi label="Student Leaves" value={studentLeaves.length} icon="school" tone="green" />
        <Kpi label="Pending Reviews" value={pendingTeacherLeaves + pendingStudentLeaves + pendingCheckoutRequests} icon="task_alt" tone="red" />
      </div>

      <section className={`${panelClass} p-5`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Checkout</p>
            <h4 className="mt-1 text-lg font-black text-slate-950">Explanation Requests</h4>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-500">
            {checkoutRequests.length} items
          </span>
        </div>
        <CheckoutRequests
          requests={checkoutRequests}
          onReview={onReviewCheckout}
          teacherLookup={teacherLookup}
          fallbackName={fallbackName}
        />
      </section>

      <section className={`${panelClass} p-5`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Teacher</p>
            <h4 className="mt-1 text-lg font-black text-slate-950">Leave Requests</h4>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-500">
            {teacherLeaves.length} items
          </span>
        </div>
        <LeaveRequests
          leaves={teacherLeaves}
          isAdmin
          onReview={onReviewTeacherLeave}
          teacherLookup={teacherLookup}
          fallbackName={fallbackName}
        />
      </section>

      <section className={`${panelClass} p-5`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Student</p>
            <h4 className="mt-1 text-lg font-black text-slate-950">Leave Requests</h4>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-500">
            {studentLeaves.length} items
          </span>
        </div>
        <StudentLeaveRequests leaves={studentLeaves} isAdmin onReview={onReviewStudentLeave} />
      </section>
    </section>
  )
}

function TeacherGpsAttendance() {
  const [user] = useState(getUser)
  const [loginType] = useState(getLoginType)
  const currentUserDisplayName = useMemo(() => getCurrentUserDisplayName(user), [user])
  const isAdmin = loginType === 'all' && user?.role === 'admin'
  const [adminSectionTab, setAdminSectionTab] = useState('history')
  const [settings, setSettings] = useState(null)
  const [todayData, setTodayData] = useState(null)
  const [records, setRecords] = useState([])
  const [teachers, setTeachers] = useState([])
  const [historySummary, setHistorySummary] = useState(null)
  const [monthlySummary, setMonthlySummary] = useState([])
  const [yearlySummary, setYearlySummary] = useState([])
  const [checkoutRequests, setCheckoutRequests] = useState([])
  const [teacherLeaves, setTeacherLeaves] = useState([])
  const [studentLeaves, setStudentLeaves] = useState([])
  const [filters, setFilters] = useState({ year: currentYear(), status: '', from: '', to: '' })
  const [loading, setLoading] = useState(true)
  const [settingsReady, setSettingsReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [dailyDate, setDailyDate] = useState(today())
  const [dailyRecords, setDailyRecords] = useState([])
  const [dailyLoading, setDailyLoading] = useState(false)
  const [dailyError, setDailyError] = useState('')
  const teacherLookup = useMemo(() => {
    const map = new Map()
    ;(teachers || []).forEach((teacher) => {
      const key = teacherRosterKey(teacher)
      if (key) map.set(key, teacher)
    })
    return map
  }, [teachers])
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
    if (!isAdmin) {
      setSelectedTeacher('')
      return
    }
    if (!teacherOptions.length) {
      setSelectedTeacher('')
      return
    }
    if (!teacherOptions.some((option) => option.value === selectedTeacher)) {
      setSelectedTeacher(teacherOptions[0].value)
    }
  }, [isAdmin, selectedTeacher, teacherOptions])

  const visibleRecords = useMemo(() => {
    if (!isAdmin) {
      return records.map((record) => ({
        ...record,
        teacher_display_name: currentUserDisplayName,
      }))
    }
    if (!selectedTeacher) return []
    const teacherLabel = teacherOptions.find((option) => option.value === selectedTeacher)?.label || 'Teacher'
    return records
      .filter((record) => resolveTeacherRecordKey(record) === selectedTeacher)
      .map((record) => ({
        ...record,
        teacher_display_name: teacherLabel,
      }))
  }, [currentUserDisplayName, isAdmin, records, selectedTeacher, teacherOptions])

  const dailyAttendanceRows = useMemo(() => {
    if (!isAdmin) return []
    const recordMap = new Map()
    dailyRecords.forEach((record) => {
      const key = resolveTeacherRecordKey(record)
      if (key) recordMap.set(key, record)
    })

    const rows = (teachers || []).map((teacher) => {
      const key = teacherRosterKey(teacher)
      const record = recordMap.get(key) || null
      return {
        key: key || teacherRosterLabel(teacher),
        teacher_name: teacherRosterLabel(teacher),
        email: teacher?.email || teacher?.profile?.email || '',
        employee_id: teacher?.employeeId || teacher?.profile?.employee_id || '',
        status: record?.status || 'not_marked',
        check_in_at: record?.check_in_at || null,
        check_out_at: record?.check_out_at || null,
        working_minutes: record?.working_minutes || 0,
        check_in_distance_meters: record?.check_in_distance_meters || null,
        check_out_distance_meters: record?.check_out_distance_meters || null,
      }
    })

    return rows.sort((a, b) => a.teacher_name.localeCompare(b.teacher_name, undefined, { sensitivity: 'base' }))
  }, [dailyRecords, isAdmin, teachers])

  const dailySummary = useMemo(() => {
    const base = dailyAttendanceRows.reduce(
      (acc, row) => {
        const status = String(row.status || 'not_marked')
        acc[status] = (acc[status] || 0) + 1
        acc.total += 1
        return acc
      },
      { total: 0, present: 0, late: 0, half_day: 0, absent: 0, leave: 0, checkout_missing: 0, not_marked: 0 },
    )
    return base
  }, [dailyAttendanceRows])

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
      const [
        settingsResponse,
        todayResponse,
        recordsResponse,
        checkoutResponse,
        teacherLeavesResponse,
        studentLeavesResponse,
        teachersResponse,
      ] = await Promise.all([
        getTeacherAttendanceSettings(),
        getTeacherAttendanceToday(),
        getTeacherAttendanceRecords(recordsParams),
        isAdmin ? getPendingCheckoutRequests() : Promise.resolve({ requests: [] }),
        getTeacherLeaveRequests(),
        isAdmin ? getStudentLeaveRequestsAdmin() : Promise.resolve({ requests: [] }),
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
      setTeacherLeaves(teacherLeavesResponse.leaves || [])
      setStudentLeaves(studentLeavesResponse.requests || [])
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
    const base = visibleRecords.reduce((acc, record) => {
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
  }, [visibleRecords])

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

  const reviewStudentLeave = async (leaveId, payload) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await reviewStudentLeaveRequest(leaveId, payload)
      setMessage('Student leave request updated.')
      await load()
    } catch (err) {
      setError(err?.message || 'Student leave review failed')
    } finally {
      setSaving(false)
    }
  }

  const loadDailyAttendance = useCallback(async () => {
    if (!isAdmin) return
    setDailyLoading(true)
    setDailyError('')
    try {
      const response = await getTeacherAttendanceRecords({ from: dailyDate, to: dailyDate })
      setDailyRecords(response.records || [])
    } catch (err) {
      setDailyError(err?.message || 'Daily attendance load failed')
      setDailyRecords([])
    } finally {
      setDailyLoading(false)
    }
  }, [dailyDate, isAdmin])

  useEffect(() => {
    if (isAdmin && adminSectionTab === 'daily') {
      loadDailyAttendance()
    }
  }, [adminSectionTab, isAdmin, loadDailyAttendance])

  useEffect(() => {
    if (!isAdmin) {
      setAdminSectionTab('history')
    }
  }, [isAdmin])

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
      {isAdmin ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <button
            type="button"
            onClick={() => setAdminSectionTab('history')}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${
              adminSectionTab === 'history'
                ? 'bg-slate-600 text-white shadow-sm shadow-slate-400/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
            >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            Attendance History
          </button>
          <button
            type="button"
            onClick={() => setAdminSectionTab('action')}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${
              adminSectionTab === 'action'
                ? 'bg-slate-600 text-white shadow-sm shadow-slate-400/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-base">pending_actions</span>
            Action
            {checkoutRequests.length + teacherLeaves.filter((leave) => leave.status === 'pending').length + studentLeaves.filter((leave) => leave.status === 'pending').length ? (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-black">
                {checkoutRequests.length + teacherLeaves.filter((leave) => leave.status === 'pending').length + studentLeaves.filter((leave) => leave.status === 'pending').length}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setAdminSectionTab('daily')}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${
              adminSectionTab === 'daily'
                ? 'bg-slate-600 text-white shadow-sm shadow-slate-400/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-base">today</span>
            Daily Attendance
          </button>
          <button
            type="button"
            onClick={() => setAdminSectionTab('settings')}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${
              adminSectionTab === 'settings'
                ? 'bg-slate-600 text-white shadow-sm shadow-slate-400/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-base">settings</span>
            Attendance Settings
          </button>
        </div>
      ) : null}

      {adminSectionTab === 'action' && isAdmin ? (
        <section className="space-y-4">
          {error ? <Alert type="error">{error}</Alert> : null}
          {message ? <Alert type="success">{message}</Alert> : null}
          <ActionRequestsPanel
            checkoutRequests={checkoutRequests}
            teacherLeaves={teacherLeaves}
            studentLeaves={studentLeaves}
            teacherLookup={teacherLookup}
            fallbackName=""
            onReviewCheckout={reviewCheckout}
            onReviewTeacherLeave={reviewLeave}
            onReviewStudentLeave={reviewStudentLeave}
          />
        </section>
      ) : adminSectionTab === 'settings' && isAdmin ? (
        <section className="space-y-4">
          {error ? <Alert type="error">{error}</Alert> : null}
          {message ? <Alert type="success">{message}</Alert> : null}
          {settingsReady && !error && !settings ? <Alert type="warning">Admin ko pehle school location settings configure karni hogi.</Alert> : null}
          <SettingsPanel settings={settings} onSaved={load} />
        </section>
      ) : adminSectionTab === 'daily' && isAdmin ? (
        <section className="space-y-4">
          <div className={`${panelClass} p-5`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Daily</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">All Teachers Daily Attendance</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">Ek date choose karke poore staff ka daily status dekho.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[220px_auto]">
                <label className="min-w-0">
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Attendance Date</span>
                  <input
                    type="date"
                    value={dailyDate}
                    onChange={(event) => setDailyDate(event.target.value)}
                    className={subtleInputClass}
                  />
                </label>
                <button
                  type="button"
                  onClick={loadDailyAttendance}
                  disabled={dailyLoading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-xl bg-slate-950 px-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className={`material-symbols-outlined text-base ${dailyLoading ? 'animate-spin' : ''}`}>{dailyLoading ? 'sync' : 'refresh'}</span>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {dailyError ? <Alert type="error">{dailyError}</Alert> : null}
          {message ? <Alert type="success">{message}</Alert> : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Kpi label="Total Teachers" value={dailySummary.total} icon="groups" tone="slate" />
            <Kpi label="Marked" value={dailySummary.total - dailySummary.not_marked} icon="check_circle" tone="green" />
            <Kpi label="Not Marked" value={dailySummary.not_marked} icon="pending_actions" tone="amber" />
          </div>

          <DailyAttendanceTable rows={dailyAttendanceRows} />
        </section>
      ) : (
        <>
          <HistorySummaryPanel
            visibleRecords={visibleRecords}
            teacherOptions={teacherOptions}
            selectedTeacher={selectedTeacher}
            onTeacherChange={setSelectedTeacher}
            isAdmin={isAdmin}
            currentTeacherLabel={currentUserDisplayName}
            year={filters.year}
            onYearChange={updateYear}
          />

          {error ? <Alert type="error">{error}</Alert> : null}
            {message ? <Alert type="success">{message}</Alert> : null}
            {settingsReady && !error && !settings ? <Alert type="warning">Admin ko pehle school location settings configure karni hogi.</Alert> : null}

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
                  onClick={() => downloadCsv(visibleRecords, teacherLookup, isAdmin ? '' : currentUserDisplayName)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  CSV
                </button>
              </div>
            </div>
            <RecordsTable
              records={visibleRecords}
              teacherLookup={teacherLookup}
              fallbackName={isAdmin ? '' : currentUserDisplayName}
              isAdmin={isAdmin}
            />
          </section>

          {!isAdmin ? (
            <section className="space-y-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">My</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">My Leave Requests</h3>
              </div>
              <LeaveRequests
                leaves={teacherLeaves}
                isAdmin={isAdmin}
                onReview={reviewLeave}
                teacherLookup={teacherLookup}
                fallbackName={currentUserDisplayName}
              />
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}

export default TeacherGpsAttendance
