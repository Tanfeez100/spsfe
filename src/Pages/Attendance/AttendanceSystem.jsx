import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  deleteHoliday,
  getAttendanceBootstrap,
  getAttendanceRecords,
  getHolidayCalendar,
  getStudentAttendance,
  saveHoliday,
  saveAttendanceRecord,
  updateHoliday,
} from '../../Api/attendance'
import { clearSession, getLoginType, getUser } from '../../Api/auth'
import { getStudents } from '../../Api/students'
import schoolLogo from '../../assets/logo.png'

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
  const normalized = String(status || '').trim().toLowerCase()
  const fallbackLabel = normalized
    ? normalized.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Not marked'
  const variants = {
    present: {
      label: 'Present',
      backgroundColor: '#ecfdf5',
      borderColor: '#a7f3d0',
      color: '#047857',
    },
    absent: {
      label: 'Absent',
      backgroundColor: '#fff1f2',
      borderColor: '#fecdd3',
      color: '#be123c',
    },
    late: {
      label: 'Late',
      backgroundColor: '#fffbeb',
      borderColor: '#fde68a',
      color: '#92400e',
    },
    holiday: {
      label: 'Holiday',
      backgroundColor: '#f1f5f9',
      borderColor: '#e2e8f0',
      color: '#475569',
    },
  }
  const variant = variants[normalized] || {
    label: fallbackLabel,
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    color: '#334155',
  }

  return (
    <span
      className="inline-flex min-w-[70px] shrink-0 justify-center rounded-full border px-2.5 py-1 text-xs font-black"
      style={{
        backgroundColor: variant.backgroundColor,
        borderColor: variant.borderColor,
        color: variant.color,
        WebkitTextFillColor: variant.color,
      }}
    >
      {variant.label}
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

function StatCard({ label, value, tone = 'slate', icon = 'analytics', hint = '' }) {
  const tones = {
    slate: {
      card: 'border-slate-200 bg-white',
      icon: 'bg-slate-100 text-slate-700',
      value: 'text-slate-950',
      label: 'text-slate-500',
      labelImportant: '!text-slate-600',
      valueColor: '#020617',
      labelColor: '#64748b',
    },
    green: {
      card: 'border-emerald-200 bg-emerald-50',
      icon: 'bg-emerald-100 text-emerald-700',
      value: 'text-emerald-900',
      label: 'text-emerald-700',
      labelImportant: '!text-emerald-800',
      valueColor: '#064e3b',
      labelColor: '#047857',
    },
    red: {
      card: 'border-rose-200 bg-rose-50',
      icon: 'bg-rose-100 text-rose-700',
      value: 'text-rose-900',
      label: 'text-rose-700',
      labelImportant: '!text-rose-800',
      valueColor: '#881337',
      labelColor: '#be123c',
    },
    amber: {
      card: 'border-amber-200 bg-amber-50',
      icon: 'bg-amber-100 text-amber-700',
      value: 'text-amber-950',
      label: 'text-amber-800',
      labelImportant: '!text-amber-900',
      valueColor: '#451a03',
      labelColor: '#78350f',
    },
    cyan: {
      card: 'border-cyan-200 bg-cyan-50',
      icon: 'bg-cyan-100 text-cyan-700',
      value: 'text-cyan-950',
      label: 'text-cyan-700',
      labelImportant: '!text-cyan-800',
      valueColor: '#083344',
      labelColor: '#0e7490',
    },
  }
  const style = tones[tone] || tones.slate
  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${style.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`text-2xl font-black leading-none sm:text-3xl ${style.value}`} style={{ color: style.valueColor }}>
            {value}
          </div>
          <div
            className={`mt-2 text-xs font-black uppercase tracking-[0.18em] ${style.label} ${style.labelImportant}`}
            style={{ color: style.labelColor, WebkitTextFillColor: style.labelColor }}
          >
            {label}
          </div>
          {hint ? <div className="mt-1 text-xs font-semibold text-slate-500">{hint}</div> : null}
        </div>
        <span className={`material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[20px] ${style.icon}`}>
          {icon}
        </span>
      </div>
    </div>
  )
}

const getTabsForRole = (role) => {
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
  return tabsByRole[role] || tabsByRole.student
}

function TopNav({ user, activeTab, setActiveTab }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const tabs = getTabsForRole(user.role)
  const activeTitle = tabs.find(([key]) => key === activeTab)?.[2] || 'Attendance'
  const profileName = user.role === 'admin' ? 'Namaskar, Admin Ji' : user.name || 'Namaskar, User'
  const profileEmail = user.role === 'admin' ? 'abdullah@gmail.com' : user.email || ''
  const profileRole = user.role === 'admin' ? 'Admin' : user.role

  const logout = () => {
    clearSession()
    window.location.href = user.role === 'student' ? '/student-login' : '/login'
  }

  const pickTab = (key) => {
    setActiveTab(key)
    setDrawerOpen(false)
  }

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen((open) => !open)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-100"
            aria-label="Open attendance menu"
          >
            <span className="material-symbols-outlined text-[24px]">{drawerOpen ? 'close' : 'menu'}</span>
          </button>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <img src={schoolLogo} alt="Star Public School logo" className="h-full w-full object-contain" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-800">Star Public School</p>
            <h1 className="truncate text-xl font-black text-slate-900 sm:text-2xl">{activeTitle}</h1>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm font-black text-slate-900">{profileName}</p>
              <a href={`mailto:${profileEmail}`} className="mt-1 block text-xs font-medium text-slate-500 hover:text-slate-700">
                {profileEmail}
              </a>
              <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-slate-700">
                {profileRole}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl border-t border-slate-200 bg-slate-50/95 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
            {tabs.map(([key, icon, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => pickTab(key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  activeTab === key
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-base">{icon}</span>
                {label}
              </button>
            ))}
          </div>
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
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-950 px-4 py-5 text-white">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5">
            <img src={schoolLogo} alt="Star Public School logo" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black">Star Public School</div>
            <div className="text-xs font-semibold uppercase text-slate-300">{profileRole} Attendance</div>
          </div>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          {tabs.map(([key, icon, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => pickTab(key)}
              className={`flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                activeTab === key
                  ? 'bg-slate-100 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 text-sm font-bold text-red-700 hover:bg-red-100"
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
              <span className={`material-symbols-outlined text-[22px] ${activeTab === key ? 'text-slate-900' : 'text-slate-400'}`}>
                {icon}
              </span>
              <span className={`text-[10px] font-black ${activeTab === key ? 'text-slate-900' : 'text-slate-400'}`}>
                {shortLabel}
              </span>
              {activeTab === key ? <span className="mt-0.5 h-0.5 w-5 rounded-full bg-slate-900" /> : <span className="mt-0.5 h-0.5 w-5" />}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function FloatingBackButton({ onBack }) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    const showButton = () => {
      setVisible(true)
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = window.setTimeout(() => {
        setVisible(false)
      }, 2600)
    }

    window.addEventListener('pointermove', showButton, { passive: true })
    window.addEventListener('touchstart', showButton, { passive: true })

    return () => {
      window.removeEventListener('pointermove', showButton)
      window.removeEventListener('touchstart', showButton)
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Back"
      className={`group fixed left-1/2 z-50 -translate-x-1/2 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-3 text-slate-900 shadow-[0_20px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
      } sm:bottom-6 bottom-20`}
    >
      <span className="material-symbols-outlined text-base leading-none">arrow_back</span>
      <span className="text-sm font-semibold text-slate-900">Back</span>
    </button>
  )
}

function Filters({ user, bootstrap, selected, setSelected, hideMonth = true }) {
  const isTeacher = user.role === 'teacher'
  const assignments = Array.isArray(bootstrap.assignments) ? bootstrap.assignments : []
  const teacherHasMultipleAssignments = isTeacher && assignments.length > 1
  const classes = bootstrap.classes || []
  const sections = teacherHasMultipleAssignments && selected.class
    ? [...new Set(assignments.filter((item) => item.class === selected.class).map((item) => item.section).filter(Boolean))]
    : bootstrap.sections || []
  const lockTeacherScope = isTeacher && !teacherHasMultipleAssignments
  return (
    <div className="grid gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-slate-500">Class</span>
        <select
          value={selected.class}
          disabled={lockTeacherScope}
          onChange={(event) => {
            const nextClass = event.target.value
            const nextSection = teacherHasMultipleAssignments
              ? assignments.find((item) => item.class === nextClass)?.section || ''
              : selected.section
            setSelected((prev) => ({ ...prev, class: nextClass, section: nextSection }))
          }}
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
          disabled={lockTeacherScope}
          onChange={(event) => setSelected((prev) => ({ ...prev, section: event.target.value }))}
          className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
        >
          <option value="">Section</option>
          {sections.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
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
  const attendedToday = summary.present + summary.late
  const pendingToday = Math.max(students.length - todayRecords.length, 0)
  const progressWidth = Math.min(Math.max(todayPercentage, 0), 100)
  const recordCoverage = students.length > 0 ? Math.round((todayRecords.length / students.length) * 100) : 0
  const statusSegments = [
    { key: 'present', label: 'Present', value: summary.present, color: 'bg-emerald-500' },
    { key: 'absent', label: 'Absent', value: summary.absent, color: 'bg-rose-500' },
    { key: 'late', label: 'Late', value: summary.late, color: 'bg-amber-400' },
  ]
  const overviewCards = [
    {
      label: 'Total Students',
      value: students.length,
      icon: 'groups',
      accent: 'from-slate-900 to-slate-700',
      border: 'border-slate-200',
      text: 'text-slate-900',
      sub: `${recordCoverage}% marked`,
    },
    {
      label: 'Present Today',
      value: summary.present,
      icon: 'check_circle',
      accent: 'from-emerald-600 to-teal-500',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      sub: `${attendedToday} attended`,
    },
    {
      label: 'Absent Today',
      value: summary.absent,
      icon: 'cancel',
      accent: 'from-rose-600 to-red-500',
      border: 'border-rose-200',
      text: 'text-rose-800',
      sub: pendingToday ? `${pendingToday} pending` : 'All checked',
    },
    {
      label: 'Late Today',
      value: summary.late,
      icon: 'schedule',
      accent: 'from-amber-500 to-orange-500',
      border: 'border-amber-200',
      text: 'text-amber-900',
      sub: 'Late arrivals',
    },
  ]

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="p-5 sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Aaj ka din - {new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Attendance Overview
                </h2>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Marked</div>
                <div className="mt-1 text-xl font-black text-slate-950">{todayRecords.length}/{students.length}</div>
              </div>
            </div>

            <div className="mt-7 rounded-[24px] bg-slate-950 p-5 text-white sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white/60">Aaj ki attendance</p>
                  <div className="mt-2 flex items-end gap-3">
                    <span className="text-6xl font-black leading-none tracking-tight sm:text-7xl">{todayPercentage}%</span>
                    <span className="pb-2 text-sm font-bold text-emerald-200">{attendedToday} attended</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-white/50">Pending</div>
                  <div className="mt-1 text-2xl font-black">{pendingToday}</div>
                </div>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm font-black text-white/70">
                {statusSegments.map((item) => (
                  <div key={item.key} className="rounded-2xl bg-white/10 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span>{item.value}</span>
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/45">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/80 p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-7">
            <div className="rounded-[24px] border border-white bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Class Health</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">Daily status mix</h3>
                </div>
                <span className="material-symbols-outlined rounded-2xl bg-cyan-50 p-3 text-cyan-700">monitoring</span>
              </div>

              <div className="mt-5 space-y-4">
                {statusSegments.map((item) => {
                  const width = totalToday > 0 ? Math.round((item.value / totalToday) * 100) : 0
                  return (
                    <div key={item.key}>
                      <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="text-slate-950">{item.value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Coverage</div>
                  <div className="mt-1 text-2xl font-black text-slate-950">{recordCoverage}%</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Records</div>
                  <div className="mt-1 text-2xl font-black text-slate-950">{todayRecords.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <div key={card.label} className={`overflow-hidden rounded-[24px] border bg-white shadow-sm ${card.border}`}>
            <div className={`h-1.5 bg-gradient-to-r ${card.accent}`} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`text-4xl font-black leading-none tracking-tight ${card.text}`}>{card.value}</div>
                  <div className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{card.label}</div>
                  <div className="mt-2 text-sm font-bold text-slate-500">{card.sub}</div>
                </div>
                <span className={`material-symbols-outlined rounded-2xl bg-gradient-to-br p-3 text-[22px] text-white ${card.accent}`}>
                  {card.icon}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Live Register</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Today Records</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-600">
            <span className="material-symbols-outlined text-base">fact_check</span>
            {todayRecords.length} entries
          </div>
        </div>
        <div className="p-3 sm:p-5">
          <AttendanceTable records={todayRecords} students={students} />
        </div>
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
  const [saved, setSaved] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedDateIsHoliday, setSelectedDateIsHoliday] = useState(false)

  const canLoad = selected.class && selected.section && selected.academic_year && selected.date
  const selectedDateIsFriday = isFriday(selected.date)

  const loadClassAttendance = useCallback(async () => {
    if (!canLoad) return
    setLoading(true)
    setError('')
    setMessage('')
    setSaved(false)
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
      const isHolidayDate = Boolean(recordResponse.isHoliday || selectedDateIsFriday)
      const recordMap = (recordResponse.records || []).reduce((map, record) => {
        map[record.student_id] = record.status
        return map
      }, {})
      setStudents(rows)
      setSelectedDateIsHoliday(isHolidayDate)
      setStatuses(
        rows.reduce(
          (map, student) => ({
            ...map,
            [student.id]: isHolidayDate ? '' : recordMap[student.id] || '',
          }),
          {}
        )
      )
    } catch (err) {
      setStudents([])
      setStatuses({})
      setSelectedDateIsHoliday(selectedDateIsFriday)
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
    setSaved(false)
    setMessage('')
  }

  const save = async () => {
    if (selectedDateIsHoliday) {
      setMessage('Holiday hai. Is date ka attendance record save nahi hoga.')
      return
    }

    setSaving(true)
    setSaved(false)
    setError('')
    setMessage('')
    try {
      await saveAttendanceRecord({
        date: selected.date,
        class: selected.class,
        section: selected.section,
        academic_year: selected.academic_year,
        statuses,
      })
      await loadClassAttendance()
      setMessage('Attendance saved successfully.')
      setSaved(true)
    } catch (err) {
      setSaved(false)
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
      {selectedDateIsHoliday ? <Alert type="info">Holiday hai. Is date ka attendance record save nahi hoga.</Alert> : null}
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-black text-slate-900">Class Students</h2>
          {!selectedDateIsHoliday ? (
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
                {selectedDateIsHoliday ? (
                  <div className="mt-3 sm:mt-0">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
                      No record
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 flex rounded-xl bg-slate-50 p-1 sm:mt-0 sm:min-w-[180px]">
                    {STATUSES.map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setStatuses((prev) => ({ ...prev, [student.id]: key }))
                          setSaved(false)
                          setMessage('')
                        }}
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
          disabled={saving || saved || students.length === 0 || selectedDateIsHoliday}
          className="mt-4 min-h-11 w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-black text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving ? 'Saving...' : selectedDateIsHoliday ? 'Holiday - No Attendance' : saved ? 'Attendance Saved' : 'Save Attendance'}
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
        <StatCard label="Present" value={summary.present} tone="green" icon="check_circle" />
        <StatCard label="Absent" value={summary.absent} tone="red" icon="cancel" />
        <StatCard label="Late" value={summary.late} tone="amber" icon="schedule" />
        <StatCard label="Attendance %" value={`${summary.percentage}%`} tone="cyan" icon="analytics" />
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
            <StatCard label="Present" value={summary.present} tone="green" icon="check_circle" />
            <StatCard label="Absent" value={summary.absent} tone="red" icon="cancel" />
            <StatCard label="Late" value={summary.late} tone="amber" icon="schedule" />
            <StatCard label="Attendance %" value={`${summary.percentage}%`} tone="cyan" icon="analytics" />
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
  const [editingId, setEditingId] = useState('')
  const [editForm, setEditForm] = useState({
    start_date: '',
    end_date: '',
    title: '',
    description: '',
  })
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

  const startEditHoliday = (holiday) => {
    if (holiday.type !== 'manual') return
    const startDate = holiday.start_date || holiday.holiday_date || today()
    const endDate = holiday.end_date || holiday.holiday_date || startDate
    setEditingId(holiday.id)
    setEditForm({
      start_date: startDate,
      end_date: endDate,
      title: holiday.title || 'Holiday',
      description: holiday.description || '',
    })
    setError('')
    setMessage('')
  }

  const cancelEditHoliday = () => {
    setEditingId('')
    setEditForm({ start_date: '', end_date: '', title: '', description: '' })
  }

  const updateEditForm = (field, value) => {
    setEditForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'start_date' && next.end_date < value) {
        next.end_date = value
      }
      return next
    })
  }

  const submitEditHoliday = async (holiday) => {
    if (!editingId || holiday.type !== 'manual') return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await updateHoliday(holiday.id, {
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        title: editForm.title || 'Holiday',
        description: editForm.description,
      })
      setMessage('Holiday updated.')
      cancelEditHoliday()
      await loadHolidays()
    } catch (err) {
      setError(err?.message || 'Failed to update holiday')
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
            {holidays.map((holiday) => {
              const startDate = holiday.start_date || holiday.holiday_date
              const endDate = holiday.end_date || holiday.holiday_date
              const dateText = startDate === endDate ? startDate : `${startDate} to ${endDate}`
              const isEditing = editingId === holiday.id
              return (
                <div key={holiday.id} className="rounded-lg border border-slate-100 p-3">
                  {isEditing ? (
                    <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px_1fr_auto] lg:items-end">
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-slate-500">Title</span>
                        <input
                          value={editForm.title}
                          onChange={(event) => updateEditForm('title', event.target.value)}
                          className="min-h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-slate-500">From</span>
                        <input
                          type="date"
                          value={editForm.start_date}
                          onChange={(event) => updateEditForm('start_date', event.target.value)}
                          className="min-h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-slate-500">To</span>
                        <input
                          type="date"
                          value={editForm.end_date}
                          min={editForm.start_date}
                          onChange={(event) => updateEditForm('end_date', event.target.value)}
                          className="min-h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-slate-500">Description</span>
                        <input
                          value={editForm.description}
                          onChange={(event) => updateEditForm('description', event.target.value)}
                          className="min-h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder="Optional"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => submitEditHoliday(holiday)}
                          disabled={saving}
                          className="min-h-10 rounded-lg bg-cyan-500 px-3 text-xs font-black text-white hover:bg-cyan-600 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditHoliday}
                          disabled={saving}
                          className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="break-words font-black text-slate-900">{holiday.title}</div>
                        <div className="text-sm font-semibold text-slate-500">{dateText}</div>
                        {holiday.description ? <div className="text-xs text-slate-500">{holiday.description}</div> : null}
                      </div>
                      <div className="flex items-center justify-between gap-2 sm:justify-end">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          holiday.type === 'weekly' ? 'bg-slate-100 text-slate-600' : 'bg-cyan-50 text-cyan-700'
                        }`}>
                          {holiday.type === 'weekly' ? 'Friday' : 'Admin'}
                        </span>
                        {user.role === 'admin' && holiday.type === 'manual' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditHoliday(holiday)}
                              disabled={saving}
                              className="min-h-9 rounded-lg border border-cyan-200 px-3 py-1.5 text-xs font-bold text-cyan-700 hover:bg-cyan-50 disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeHoliday(holiday)}
                              disabled={saving}
                              className="min-h-9 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function AttendanceSystem({ embedded = false }) {
  const [user] = useState(resolveUser)
  const [bootstrap, setBootstrap] = useState({ classes: [], sections: [], assignment: null, assignments: [] })
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

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.location.href = user.role === 'student' ? '/student-login' : '/dashboard'
  }

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await getAttendanceBootstrap()
        const assignment = response.assignment || null
        const assignments = Array.isArray(response.assignments) ? response.assignments : assignment ? [assignment] : []
        const currentAcademicYear = getDefaultAcademicYear()
        setBootstrap({
          classes: response.classes || [],
          sections: response.sections || [],
          assignment,
          assignments,
        })
        setSelected((prev) => ({
          ...prev,
          class: assignment?.class || response.classes?.[0] || user.class || '',
          section: assignment?.section || response.sections?.[0] || user.section || '',
          academic_year: currentAcademicYear,
        }))

        if (user.role === 'teacher' && assignments.length === 0) {
          setRecords([])
          setError(response.message || 'Aapko abhi class/section assign nahi hua hai. Admin se assignment karwa ke dobara login karein.')
          return
        }

        const recordResponse = await getAttendanceRecords({
          date: today(),
          academic_year: currentAcademicYear,
        })
        setRecords(recordResponse.records || [])

        if (user.role === 'admin') {
          const studentsResponse = await getStudents({ academic_year: currentAcademicYear })
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
      <div className={`flex items-center justify-center px-4 text-center ${embedded ? 'min-h-[320px]' : 'min-h-screen bg-slate-50'}`}>
        <Alert type="warning">Attendance open karne ke liye pehle main login page se login karein.</Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center text-sm font-bold text-slate-600 ${embedded ? 'min-h-[320px]' : 'min-h-screen bg-slate-50'}`}>
        Loading attendance...
      </div>
    )
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
    <div className={embedded ? 'space-y-4' : 'min-h-screen bg-slate-50'}>
      {embedded ? null : <TopNav user={user} activeTab={activeTab} setActiveTab={setActiveTab} />}
      {embedded ? (
        <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
                <img src={schoolLogo} alt="Star Public School logo" className="h-full w-full object-contain" />
              </span>
              <span className="hidden text-xs font-black uppercase tracking-[0.16em] text-slate-700 sm:inline">
                Star Public School
              </span>
            </div>
            {getTabsForRole(user.role).map(([key, icon, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === key
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                    : 'border border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                <span className="material-symbols-outlined text-base">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <main className={embedded ? 'space-y-4' : 'mx-auto max-w-[480px] px-3 py-4 pb-24 sm:px-6 sm:py-6 md:max-w-7xl md:pb-6'}>
        {error ? <div className="mb-4"><Alert type="error">{error}</Alert></div> : null}
        {render()}
      </main>
      {embedded ? null : <FloatingBackButton onBack={goBack} />}
    </div>
  )
}

export default AttendanceSystem
