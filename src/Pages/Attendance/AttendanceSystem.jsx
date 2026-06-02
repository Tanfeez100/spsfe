import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteHoliday,
  getAttendanceBootstrap,
  getAttendanceRecords,
  getHolidayCalendar,
  getStudentAttendance,
  saveHoliday,
  saveAttendanceRecord,
} from '../../Api/attendance'
import { clearSession, getLoginType, getUser } from '../../Api/auth'
import { getStudents } from '../../Api/students'

const STATUSES = [
  ['present', 'Present'],
  ['absent', 'Absent'],
]

const today = () => new Date().toISOString().split('T')[0]
const currentMonth = () => today().slice(0, 7)
const isFriday = (date) => {
  if (!date) return false
  return new Date(`${date}T00:00:00.000Z`).getUTCDay() === 5
}

const getDefaultAcademicYear = () => {
  const now = new Date()
  const currentYear = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1
  return `${currentYear}-${String(currentYear + 1).slice(-2)}`
}

const getInitials = (name = '') =>
  String(name || 'User')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

const getAvatarColor = (name = '') => {
  const colors = ['#6366f1', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0f766e']
  const code = String(name || 'User').charCodeAt(0) || 0
  return colors[code % colors.length]
}

const resolveUser = () => {
  const user = getUser()
  if (!user) return null
  const loginType = getLoginType()
  return {
    ...user,
    role: loginType === 'student' ? 'student' : user.role,
    rollNo: user.rollNo || user.roll_no || '',
  }
}

const normalizeStudents = (response) => {
  const rows = Array.isArray(response) ? response : response?.students || []
  return rows.map((student) => ({
    id: student.id || student.ID,
    name: student.name || student.Name || '',
    class: student.class || student.Class || '',
    section: student.section || student.Section || '',
    roll_no: student.roll_no || student.Roll || student.rollNo || '',
    academic_year: student.academic_year || student.AcademicYear || '',
  }))
}

const getSummary = (records = []) => {
  const summary = records.reduce(
    (acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1
      return acc
    },
    { present: 0, absent: 0, late: 0, holiday: 0 }
  )
  const workingDays = summary.present + summary.absent + summary.late
  return {
    ...summary,
    workingDays,
    percentage: workingDays > 0 ? Math.round((summary.present / workingDays) * 100) : 0,
  }
}

function StatusBadge({ status }) {
  const styles = {
    present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    absent: 'bg-red-50 text-red-700 border-red-200',
    late: 'bg-amber-50 text-amber-700 border-amber-200',
    holiday: 'bg-slate-100 text-slate-600 border-slate-200',
  }
  return (
    <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${styles[status] || styles.holiday}`}>
      {status || 'not marked'}
    </span>
  )
}

function Alert({ type = 'info', children }) {
  const styles = {
    info: 'border-cyan-200 bg-cyan-50 text-cyan-800',
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  }
  return <div className={`rounded-xl border px-4 py-3 text-sm font-semibold leading-5 ${styles[type]}`}>{children}</div>
}

function StatCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-900',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  }
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${tones[tone] || tones.slate}`}>
      <div className="text-xl font-black sm:text-2xl">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-wide opacity-70">{label}</div>
    </div>
  )
}

function TopNav({ user, activeTab, setActiveTab }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const tabsByRole = {
    admin: [
      ['overview', 'dashboard', 'Overview', 'Home'],
      ['mark', 'check_circle', 'Mark Attendance', 'Mark'],
      ['report', 'calendar_month', 'Reports', 'Reports'],
      ['history', 'list_alt', 'Student History', 'History'],
      ['holidays', 'event', 'Holidays', 'Holidays'],
    ],
    teacher: [
      ['mark', 'check_circle', 'Mark Attendance', 'Mark'],
      ['report', 'calendar_month', 'Reports', 'Reports'],
      ['history', 'list_alt', 'Student History', 'History'],
      ['holidays', 'event', 'Holidays', 'Holidays'],
    ],
    student: [
      ['mine', 'list_alt', 'My Attendance', 'Attendance'],
      ['holidays', 'event', 'Holidays', 'Holidays'],
    ],
  }
  const tabs = tabsByRole[user.role] || tabsByRole.student
  const activeTitle = tabs.find(([key]) => key === activeTab)?.[2] || 'Attendance'
  const userName = user.name || user.email || 'User'

  const logout = () => {
    clearSession()
    window.location.href = user.role === 'student' ? '/student-login' : '/login'
  }

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.location.href = user.role === 'student' ? '/student-login' : '/dashboard'
  }

  const pickTab = (key) => {
    setActiveTab(key)
    setDrawerOpen(false)
  }

  return (
    <>
      <div className="sticky top-0 z-30 bg-[#1e3a5f] text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-6">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white hover:bg-white/10"
            aria-label="Go back"
            title="Back"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen((open) => !open)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white hover:bg-white/10"
            aria-label="Open attendance menu"
          >
            <span className="material-symbols-outlined text-[24px]">{drawerOpen ? 'close' : 'menu'}</span>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-black sm:text-lg">{activeTitle}</h1>
            <p className="truncate text-xs font-semibold text-white/65">{userName} - {user.role}</p>
          </div>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
            style={{ backgroundColor: getAvatarColor(userName) }}
          >
            {getInitials(userName)}
          </div>
        </div>
        <div className="mx-auto hidden max-w-7xl gap-2 overflow-x-auto px-6 pb-3 md:flex">
          {tabs.map(([key, icon, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => pickTab(key)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-black ${
                activeTab === key ? 'bg-white text-[#1e3a5f]' : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <span className="material-symbols-outlined text-base">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {drawerOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-black/40"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[280px] max-w-[82vw] flex-col bg-white shadow-2xl transition-transform duration-200 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 bg-[#1e3a5f] px-4 py-5">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
            style={{ backgroundColor: getAvatarColor(userName) }}
          >
            {getInitials(userName)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-white">{userName}</div>
            <div className="text-xs font-semibold capitalize text-white/60">{user.role}</div>
          </div>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {tabs.map(([key, icon, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => pickTab(key)}
              className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold ${
                activeTab === key ? 'bg-[#e8f0fe] text-[#1e3a5f]' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-3 text-sm font-black text-red-600"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white md:hidden">
        <div className="mx-auto flex max-w-[480px]">
          {tabs.slice(0, 4).map(([key, icon, , shortLabel]) => (
            <button
              key={key}
              type="button"
              onClick={() => pickTab(key)}
              className="flex min-h-[62px] flex-1 flex-col items-center justify-center gap-0.5 px-1"
            >
              <span className={`material-symbols-outlined text-[22px] ${activeTab === key ? 'text-[#1e3a5f]' : 'text-slate-400'}`}>
                {icon}
              </span>
              <span className={`text-[10px] font-black ${activeTab === key ? 'text-[#1e3a5f]' : 'text-slate-400'}`}>
                {shortLabel}
              </span>
              {activeTab === key ? <span className="mt-0.5 h-0.5 w-5 rounded-full bg-[#1e3a5f]" /> : <span className="mt-0.5 h-0.5 w-5" />}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function Filters({ user, bootstrap, selected, setSelected, hideMonth = true }) {
  const isTeacher = user.role === 'teacher'
  const classes = bootstrap.classes || []
  const sections = bootstrap.sections || []
  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-5">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-slate-500">Class</span>
        <select
          value={selected.class}
          disabled={isTeacher}
          onChange={(event) => setSelected((prev) => ({ ...prev, class: event.target.value }))}
          className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
        >
          <option value="">Select class</option>
          {classes.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-slate-500">Section</span>
        <select
          value={selected.section}
          disabled={isTeacher}
          onChange={(event) => setSelected((prev) => ({ ...prev, section: event.target.value }))}
          className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
        >
          <option value="">Section</option>
          {sections.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-slate-500">Academic Year</span>
        <input
          value={selected.academic_year}
          disabled={isTeacher}
          onChange={(event) => setSelected((prev) => ({ ...prev, academic_year: event.target.value }))}
          className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
        />
      </label>
      {hideMonth ? (
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-500">Date</span>
          <input
            type="date"
            value={selected.date}
            onChange={(event) => setSelected((prev) => ({ ...prev, date: event.target.value }))}
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
      ) : (
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-500">Month</span>
          <input
            type="month"
            value={selected.month}
            onChange={(event) => setSelected((prev) => ({ ...prev, month: event.target.value }))}
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
      )}
    </div>
  )
}

function Overview({ students, records }) {
  const todayRecords = records.filter((record) => record.attendance_date === today())
  const summary = getSummary(todayRecords)
  const totalToday = todayRecords.length || students.length
  const todayPercentage = totalToday > 0 ? Math.round(((summary.present + summary.late) / totalToday) * 100) : 0
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-bold text-slate-400">
          Aaj ka din - {new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div className="mt-1 text-lg font-black text-[#1e3a5f]">Namaskar, Admin ji</div>
      </div>
      <div className="rounded-2xl bg-[#1e3a5f] p-4 text-white shadow-sm">
        <div className="text-xs font-bold text-white/65">Aaj ki attendance</div>
        <div className="mt-1 text-4xl font-black">{todayPercentage}%</div>
        <div className="mt-3 h-2 rounded-full bg-white/20">
          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${todayPercentage}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-bold text-white/65">
          <span>{summary.present} present</span>
          <span>{summary.absent} absent</span>
          <span>{summary.late} late</span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={students.length} />
        <StatCard label="Present Today" value={summary.present} tone="green" />
        <StatCard label="Absent Today" value={summary.absent} tone="red" />
        <StatCard label="Late Today" value={summary.late} tone="amber" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
        <h2 className="mb-3 text-base font-black text-slate-900">Today Records</h2>
        <AttendanceTable records={todayRecords} students={students} />
      </div>
    </div>
  )
}

function AttendanceTable({ records, students = [] }) {
  const studentMap = new Map(students.map((student) => [student.id, student]))
  if (!records.length) {
    return <p className="py-8 text-center text-sm text-slate-500">No attendance records found.</p>
  }
  return (
    <>
      <div className="grid gap-2 md:hidden">
        {records.map((record) => {
          const student = studentMap.get(record.student_id)
          const day = new Date(record.attendance_date)
          return (
            <div key={record.id || `${record.student_id}-${record.attendance_date}`} className="rounded-xl border border-slate-100 bg-white p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50">
                  <span className="text-sm font-black text-[#1e3a5f]">{Number.isNaN(day.getTime()) ? '-' : day.getDate()}</span>
                  <span className="text-[9px] font-bold uppercase text-slate-400">
                    {Number.isNaN(day.getTime()) ? '' : day.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-slate-900">{student?.name || record.student_id}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">{record.attendance_date}</div>
                </div>
                <div className="ml-auto"><StatusBadge status={record.status} /></div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                <div className="rounded-md bg-slate-50 px-2 py-1.5">Class: {record.class || '-'}</div>
                <div className="rounded-md bg-slate-50 px-2 py-1.5">Section: {record.section || '-'}</div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-slate-50">
          <tr>
            {['Date', 'Student', 'Class', 'Section', 'Status'].map((head) => (
              <th key={head} className="border-b border-slate-200 px-3 py-2 text-left font-bold text-slate-600">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const student = studentMap.get(record.student_id)
            return (
              <tr key={record.id || `${record.student_id}-${record.attendance_date}`} className="border-b border-slate-100">
                <td className="px-3 py-2 font-semibold text-slate-800">{record.attendance_date}</td>
                <td className="px-3 py-2 text-slate-700">{student?.name || record.student_id}</td>
                <td className="px-3 py-2 text-slate-600">{record.class}</td>
                <td className="px-3 py-2 text-slate-600">{record.section}</td>
                <td className="px-3 py-2"><StatusBadge status={record.status} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </>
  )
}

function MarkAttendance({ user, bootstrap, selected, setSelected }) {
  const [students, setStudents] = useState([])
  const [statuses, setStatuses] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const canLoad = selected.class && selected.section && selected.academic_year && selected.date
  const selectedDateIsFriday = isFriday(selected.date)

  const loadClassAttendance = useCallback(async () => {
    if (!canLoad) return
    setLoading(true)
    setError('')
    try {
      const [studentResponse, recordResponse] = await Promise.all([
        getStudents({
          class: selected.class,
          section: selected.section,
          academic_year: selected.academic_year,
        }),
        getAttendanceRecords({
          date: selected.date,
          class: selected.class,
          section: selected.section,
          academic_year: selected.academic_year,
        }),
      ])
      const rows = normalizeStudents(studentResponse)
      const recordMap = (recordResponse.records || []).reduce((map, record) => {
        map[record.student_id] = record.status
        return map
      }, {})
      setStudents(rows)
      setStatuses(
        rows.reduce(
          (map, student) => ({
            ...map,
            [student.id]: selectedDateIsFriday ? 'holiday' : recordMap[student.id] || '',
          }),
          {}
        )
      )
    } catch (err) {
      setStudents([])
      setStatuses({})
      setError(err?.message || 'Failed to load class attendance')
    } finally {
      setLoading(false)
    }
  }, [canLoad, selected, selectedDateIsFriday])

  useEffect(() => {
    loadClassAttendance()
  }, [loadClassAttendance])

  const setAll = (status) => {
    setStatuses(students.reduce((map, student) => ({ ...map, [student.id]: status }), {}))
  }

  const save = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await saveAttendanceRecord({
        date: selected.date,
        class: selected.class,
        section: selected.section,
        academic_year: selected.academic_year,
        statuses: selectedDateIsFriday
          ? students.reduce((map, student) => ({ ...map, [student.id]: 'holiday' }), {})
          : statuses,
      })
      setMessage(selectedDateIsFriday ? 'Friday holiday marked automatically.' : 'Attendance saved successfully.')
      await loadClassAttendance()
    } catch (err) {
      setError(err?.message || 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  if (user.role === 'teacher' && !bootstrap.assignment) {
    return <Alert type="warning">Aapko abhi class/section assign nahi hua hai. Admin se assignment karwa ke attendance mark karein.</Alert>
  }

  return (
    <div className="space-y-4">
      <Filters user={user} bootstrap={bootstrap} selected={selected} setSelected={setSelected} />
      {error ? <Alert type="error">{error}</Alert> : null}
      {message ? <Alert type="success">{message}</Alert> : null}
      {selectedDateIsFriday ? <Alert type="info">Friday holiday hai. Students automatically holiday mark honge.</Alert> : null}
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-black text-slate-900">Class Students</h2>
          {!selectedDateIsFriday ? (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {STATUSES.map(([key, label]) => (
                <button key={key} type="button" onClick={() => setAll(key)} className="min-h-9 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-black text-slate-700 hover:bg-slate-50">
                  All {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No active students found for selected class.</p>
        ) : (
          <div className="space-y-2">
            {students.map((student) => (
              <div key={student.id} className="rounded-xl border border-slate-100 p-2.5 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white sm:h-9 sm:w-9 sm:text-xs"
                    style={{ backgroundColor: getAvatarColor(student.name) }}
                  >
                    {getInitials(student.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-900 sm:text-base">{student.name}</div>
                    <div className="mt-0.5 text-[11px] font-semibold text-slate-500 sm:text-xs">Roll {student.roll_no || '-'} - {student.class} {student.section}</div>
                  </div>
                </div>
                {selectedDateIsFriday ? (
                  <div className="mt-3 sm:mt-0">
                    <StatusBadge status="holiday" />
                  </div>
                ) : (
                  <div className="mt-2 flex rounded-xl bg-slate-50 p-1 sm:mt-0 sm:min-w-[180px]">
                    {STATUSES.map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setStatuses((prev) => ({ ...prev, [student.id]: key }))}
                        className={`min-h-8 flex-1 rounded-lg px-2 py-1 text-[11px] font-black transition-colors sm:text-xs ${
                          statuses[student.id] === key ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving || students.length === 0}
          className="mt-4 min-h-11 w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-black text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving ? 'Saving...' : selectedDateIsFriday ? 'Mark Friday Holiday' : 'Save Attendance'}
        </button>
      </div>
    </div>
  )
}

function Reports({ user, bootstrap, selected, setSelected }) {
  const [records, setRecords] = useState([])
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setError('')
      try {
        const filters = {
          month: selected.month,
          class: selected.class,
          section: selected.section,
          academic_year: selected.academic_year,
        }
        const [recordResponse, studentResponse] = await Promise.all([
          getAttendanceRecords(filters),
          selected.class && selected.section ? getStudents(filters) : Promise.resolve({ students: [] }),
        ])
        setRecords(recordResponse.records || [])
        setStudents(normalizeStudents(studentResponse))
      } catch (err) {
        setRecords([])
        setError(err?.message || 'Failed to load reports')
      }
    }
    load()
  }, [selected])

  const summary = useMemo(() => getSummary(records), [records])

  if (user.role === 'teacher' && !bootstrap.assignment) {
    return <Alert type="warning">Aapko abhi class/section assign nahi hua hai.</Alert>
  }

  return (
    <div className="space-y-4">
      <Filters user={user} bootstrap={bootstrap} selected={selected} setSelected={setSelected} hideMonth={false} />
      {error ? <Alert type="error">{error}</Alert> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Present" value={summary.present} tone="green" />
        <StatCard label="Absent" value={summary.absent} tone="red" />
        <StatCard label="Late" value={summary.late} tone="amber" />
        <StatCard label="Attendance %" value={`${summary.percentage}%`} />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <AttendanceTable records={records} students={students} />
      </div>
    </div>
  )
}

function StudentHistory({ user, selected }) {
  const [students, setStudents] = useState([])
  const [studentId, setStudentId] = useState('')
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStudents = async () => {
      if (user.role === 'student') {
        setStudentId(user.id)
        return
      }

      try {
        const response = await getStudents({
          class: selected.class,
          section: selected.section,
          academic_year: selected.academic_year,
        })
        const rows = normalizeStudents(response)
        setStudents(rows)
        setStudentId((current) => current || rows[0]?.id || '')
      } catch (err) {
        setStudents([])
        setError(err?.message || 'Failed to load students')
      }
    }
    loadStudents()
  }, [selected.class, selected.section, selected.academic_year, user])

  useEffect(() => {
    const loadDetail = async () => {
      if (!studentId) return
      setError('')
      try {
        setDetail(await getStudentAttendance(studentId))
      } catch (err) {
        setDetail(null)
        setError(err?.message || 'Failed to load student attendance')
      }
    }
    loadDetail()
  }, [studentId])

  const summary = detail?.summary || getSummary([])

  return (
    <div className="space-y-4">
      {user.role !== 'student' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <label className="block max-w-md">
            <span className="mb-1 block text-xs font-bold text-slate-500">Student</span>
            <select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.class} {student.section} Roll {student.roll_no}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {error ? <Alert type="error">{error}</Alert> : null}
      {detail ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Present" value={summary.present} tone="green" />
            <StatCard label="Absent" value={summary.absent} tone="red" />
            <StatCard label="Late" value={summary.late} tone="amber" />
            <StatCard label="Attendance %" value={`${summary.percentage}%`} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <h2 className="mb-3 text-base font-black text-slate-900">{detail.student?.name || 'Student'} Attendance</h2>
            <AttendanceTable records={detail.records || []} students={[detail.student]} />
          </div>
        </>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">Select a student to view history.</p>
      )}
    </div>
  )
}

function HolidayCalendar({ user }) {
  const [month, setMonth] = useState(currentMonth())
  const [holidays, setHolidays] = useState([])
  const [form, setForm] = useState({
    start_date: today(),
    end_date: today(),
    title: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadHolidays = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getHolidayCalendar({ month })
      setHolidays(response.holidays || [])
    } catch (err) {
      setHolidays([])
      setError(err?.message || 'Failed to load holidays')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    loadHolidays()
  }, [loadHolidays])

  const submitHoliday = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await saveHoliday({
        start_date: form.start_date,
        end_date: form.end_date,
        title: form.title || 'Holiday',
        description: form.description,
      })
      setMessage('Holiday calendar updated.')
      setForm({ start_date: form.start_date, end_date: form.end_date, title: '', description: '' })
      await loadHolidays()
    } catch (err) {
      setError(err?.message || 'Failed to save holiday')
    } finally {
      setSaving(false)
    }
  }

  const removeHoliday = async (holiday) => {
    if (holiday.type !== 'manual') return
    if (!window.confirm(`Remove holiday "${holiday.title}"?`)) return

    setSaving(true)
    setError('')
    setMessage('')
    try {
      await deleteHoliday(holiday.id)
      setMessage('Holiday removed.')
      await loadHolidays()
    } catch (err) {
      setError(err?.message || 'Failed to remove holiday')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block w-full max-w-xs">
            <span className="mb-1 block text-xs font-bold text-slate-500">Month</span>
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">
            Friday holidays are added automatically.
          </div>
        </div>
      </div>

      {user.role === 'admin' ? (
        <form onSubmit={submitHoliday} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <h2 className="mb-3 text-base font-black text-slate-900">Mark Holiday</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">From</span>
              <input
                type="date"
                value={form.start_date}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    start_date: event.target.value,
                    end_date: prev.end_date < event.target.value ? event.target.value : prev.end_date,
                  }))
                }
                className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">To</span>
              <input
                type="date"
                value={form.end_date}
                min={form.start_date}
                onChange={(event) => setForm((prev) => ({ ...prev, end_date: event.target.value }))}
                className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Holiday name"
              />
            </label>
            <label className="block lg:col-span-2">
              <span className="mb-1 block text-xs font-bold text-slate-500">Description</span>
              <input
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Optional note"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 min-h-11 w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-black text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save Holiday'}
          </button>
        </form>
      ) : null}

      {error ? <Alert type="error">{error}</Alert> : null}
      {message ? <Alert type="success">{message}</Alert> : null}

      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <h2 className="mb-3 text-base font-black text-slate-900">Holiday Calendar</h2>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading holidays...</p>
        ) : holidays.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No holidays found.</p>
        ) : (
          <div className="grid gap-2">
            {holidays.map((holiday) => (
              <div key={holiday.id} className="flex flex-col gap-3 rounded-lg border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="break-words font-black text-slate-900">{holiday.title}</div>
                  <div className="text-sm font-semibold text-slate-500">{holiday.holiday_date}</div>
                  {holiday.description ? <div className="text-xs text-slate-500">{holiday.description}</div> : null}
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    holiday.type === 'weekly' ? 'bg-slate-100 text-slate-600' : 'bg-cyan-50 text-cyan-700'
                  }`}>
                    {holiday.type === 'weekly' ? 'Friday' : 'Admin'}
                  </span>
                  {user.role === 'admin' && holiday.type === 'manual' ? (
                    <button
                      type="button"
                      onClick={() => removeHoliday(holiday)}
                      disabled={saving}
                      className="min-h-9 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AttendanceSystem() {
  const [user] = useState(resolveUser)
  const [bootstrap, setBootstrap] = useState({ classes: [], sections: [], assignment: null })
  const [activeTab, setActiveTab] = useState(() => {
    const resolved = resolveUser()
    if (resolved?.role === 'admin') return 'overview'
    if (resolved?.role === 'teacher') return 'mark'
    return 'mine'
  })
  const [selected, setSelected] = useState({
    class: '',
    section: '',
    academic_year: getDefaultAcademicYear(),
    date: today(),
    month: currentMonth(),
  })
  const [allStudents, setAllStudents] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await getAttendanceBootstrap()
        const assignment = response.assignment || null
        setBootstrap({
          classes: response.classes || [],
          sections: response.sections || [],
          assignment,
        })
        setSelected((prev) => ({
          ...prev,
          class: assignment?.class || response.classes?.[0] || user.class || '',
          section: assignment?.section || response.sections?.[0] || user.section || '',
          academic_year: assignment?.academic_year || user.academicYear || user.academic_year || prev.academic_year,
        }))

        if (user.role === 'teacher' && !assignment) {
          setRecords([])
          setError(response.message || 'Aapko abhi class/section assign nahi hua hai. Admin se assignment karwa ke dobara login karein.')
          return
        }

        const recordResponse = await getAttendanceRecords({ date: today() })
        setRecords(recordResponse.records || [])

        if (user.role === 'admin') {
          const studentsResponse = await getStudents({})
          setAllStudents(normalizeStudents(studentsResponse))
        }
      } catch (err) {
        setError(err?.message || 'Attendance load failed')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center">
        <Alert type="warning">Attendance open karne ke liye pehle main login page se login karein.</Alert>
      </div>
    )
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-bold text-slate-600">Loading attendance...</div>
  }

  const render = () => {
    if (activeTab === 'overview') return <Overview students={allStudents} records={records} />
    if (activeTab === 'mark') return <MarkAttendance user={user} bootstrap={bootstrap} selected={selected} setSelected={setSelected} />
    if (activeTab === 'report') return <Reports user={user} bootstrap={bootstrap} selected={selected} setSelected={setSelected} />
    if (activeTab === 'history') return <StudentHistory user={user} selected={selected} />
    if (activeTab === 'holidays') return <HolidayCalendar user={user} />
    return <StudentHistory user={user} selected={selected} />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="mx-auto max-w-[480px] px-3 py-4 pb-24 sm:px-6 sm:py-6 md:max-w-7xl md:pb-6">
        {error ? <div className="mb-4"><Alert type="error">{error}</Alert></div> : null}
        {render()}
      </main>
    </div>
  )
}

export default AttendanceSystem
