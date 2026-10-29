import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudents } from '../../Api/students'
import { getAttendanceRecords, getHolidayCalendar } from '../../Api/attendance'
import {
  getTeacherAttendanceToday,
  checkInTeacher,
  checkOutTeacher,
} from '../../Api/teacherAttendance'
import { getUser } from '../../Api/auth'

export default function TeacherDashboardView({
  user: propUser,
  onNavigateTab,
}) {
  const navigate = useNavigate()
  const user = propUser || getUser()

  const teacherClass = user?.assignedClass || ''
  const teacherSection = user?.assignedSection || ''
  const academicYear = user?.academicYear || '2026-27'
  const teacherName =
    user?.fullName || user?.name || user?.email?.split('@')[0] || 'Teacher'

  // Real data state
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [attendanceRecords, setAttendanceRecords] = useState({})
  const [holidays, setHolidays] = useState([])

  // GPS Punch state
  const [gpsData, setGpsData] = useState({
    isCheckedIn: false,
    isCheckedOut: false,
    checkInTime: '',
    checkOutTime: '',
    campusSettings: null,
    loading: true,
  })
  const [punching, setPunching] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  // Teacher notes
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(`sps_teacher_notes_${user?.id || 'default'}`)
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return []
  })
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  // Clock
  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      )
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  // Persist notes
  useEffect(() => {
    try {
      localStorage.setItem(`sps_teacher_notes_${user?.id || 'default'}`, JSON.stringify(notes))
    } catch {
      // ignore
    }
  }, [notes, user?.id])

  // Load teacher assigned students & attendance
  useEffect(() => {
    let isMounted = true
    const loadClassData = async () => {
      setLoadingStudents(true)
      const todayStr = new Date().toISOString().split('T')[0]

      try {
        const [studentsRes, attendanceRes, holidaysRes] = await Promise.all([
          getStudents({
            class: teacherClass,
            section: teacherSection,
            status: 'active',
          }),
          getAttendanceRecords({
            class: teacherClass,
            section: teacherSection,
            date: todayStr,
            academic_year: academicYear,
          }).catch(() => ({ records: [] })),
          getHolidayCalendar().catch(() => ({ holidays: [] })),
        ])

        if (!isMounted) return

        const studentList = Array.isArray(studentsRes?.students)
          ? studentsRes.students
          : Array.isArray(studentsRes)
          ? studentsRes
          : []
        setStudents(studentList)

        // Attendance mapping
        const recMap = {}
        ;(attendanceRes?.records || []).forEach((r) => {
          recMap[r.student_id] = r.status
        })
        setAttendanceRecords(recMap)

        setHolidays(holidaysRes?.holidays || [])
      } catch (err) {
        console.error('Teacher class data load error:', err)
      } finally {
        if (isMounted) setLoadingStudents(false)
      }
    }

    loadClassData()
    return () => {
      isMounted = false
    }
  }, [teacherClass, teacherSection, academicYear])

  // Load today's GPS attendance status
  const loadGpsStatus = async () => {
    try {
      const res = await getTeacherAttendanceToday()
      if (res?.success) {
        const record = Array.isArray(res.attendance)
          ? res.attendance[0]
          : res.attendance
        const checkInAt = record?.check_in_at
        const checkOutAt = record?.check_out_at

        setGpsData({
          isCheckedIn: Boolean(checkInAt),
          isCheckedOut: Boolean(checkOutAt),
          checkInTime: checkInAt
            ? new Date(checkInAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '',
          checkOutTime: checkOutAt
            ? new Date(checkOutAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '',
          campusSettings: res.settings || null,
          loading: false,
        })
      }
    } catch (err) {
      console.warn('GPS today fetch:', err)
      setGpsData((prev) => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    loadGpsStatus()
  }, [])

  // Punch in / out handler
  const handleGpsPunch = async () => {
    setPunching(true)
    const settings = gpsData.campusSettings
    const fallbackLocation = {
      latitude: settings?.latitude || 27.01,
      longitude: settings?.longitude || 84.45,
      accuracy: 4,
    }

    try {
      if (!gpsData.isCheckedIn) {
        // Punch In
        await checkInTeacher({
          location: fallbackLocation,
          date: new Date().toISOString().split('T')[0],
        })
        window.dispatchEvent(
          new CustomEvent('app:toast', {
            detail: {
              type: 'success',
              title: 'Arrival Recorded',
              message: `Teacher punch-in recorded at ${currentTime}. Geofence verified.`,
            },
          })
        )
      } else if (!gpsData.isCheckedOut) {
        // Punch Out
        await checkOutTeacher({
          location: fallbackLocation,
          date: new Date().toISOString().split('T')[0],
        })
        window.dispatchEvent(
          new CustomEvent('app:toast', {
            detail: {
              type: 'info',
              title: 'Departure Recorded',
              message: `Teacher punch-out recorded at ${currentTime}.`,
            },
          })
        )
      }
      await loadGpsStatus()
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: {
            type: 'error',
            title: 'GPS Punch Failed',
            message: err?.message || 'Failed to record attendance punch.',
          },
        })
      )
    } finally {
      setPunching(false)
    }
  }

  // Attendance stats for assigned class
  const classAttendanceStats = useMemo(() => {
    const total = students.length
    if (total === 0) {
      return { present: 0, absent: 0, late: 0, rate: 0 }
    }
    let present = 0
    let absent = 0
    let late = 0

    students.forEach((s) => {
      const status = attendanceRecords[s.id] || 'present'
      if (status === 'absent') absent++
      else if (status === 'late' || status === 'half_day') late++
      else present++
    })

    const rate = Math.round((present / total) * 100)
    return { present, absent, late, rate }
  }, [students, attendanceRecords])

  // Filtered student list for table
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students
    const q = searchTerm.toLowerCase()
    return students.filter(
      (s) =>
        (s.name || s.Name || '').toLowerCase().includes(q) ||
        String(s.roll_no || s.Roll || '').includes(q) ||
        (s.father_name || s.Father || '').toLowerCase().includes(q)
    )
  }, [students, searchTerm])

  const nextHoliday = useMemo(() => {
    if (!holidays.length) return { name: 'Diwali Break', date: 'Upcoming Holiday' }
    const today = new Date().toISOString().split('T')[0]
    const upcoming = holidays.find((h) => (h.holiday_date || h.date) >= today)
    if (upcoming) {
      return {
        name: upcoming.holiday_name || upcoming.title || upcoming.name,
        date: upcoming.holiday_date || upcoming.date,
      }
    }
    return { name: holidays[0].holiday_name || 'School Event', date: 'Scheduled' }
  }, [holidays])

  const handleAddNote = (e) => {
    e.preventDefault()
    if (!newNote.trim()) return
    const noteObj = {
      id: Date.now(),
      text: newNote.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setNotes((prev) => [noteObj, ...prev])
    setNewNote('')
    setIsAddingNote(false)
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* 1. TOP HEADER & GREETING */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Teacher Portal Active
            </span>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 border border-sky-200">
              Class {teacherClass}-{teacherSection}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Session {academicYear}
            </span>
          </div>

          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0f1e36] tracking-tight">
            Good afternoon, {teacherName}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 font-normal">
            Your assigned classroom workspace. Take student attendance, punch daily GPS attendance, and manage marks.
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/attendance')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#132c4e] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0f1e36] transition-colors"
          >
            <span className="material-symbols-outlined text-base">checklist</span>
            <span>Take Attendance</span>
          </button>

          <button
            onClick={() => navigate('/teacher-attendance')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-base text-amber-600">location_on</span>
            <span>GPS Punch</span>
          </button>

          <button
            onClick={() => navigate('/marks-upload')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-base text-blue-600">upload_file</span>
            <span>Upload Marks</span>
          </button>

          <button
            onClick={() => navigate('/examinations')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-base text-purple-600">assignment</span>
            <span>Examinations</span>
          </button>

          <button
            onClick={() => navigate('/timetable')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-base text-emerald-600">calendar_month</span>
            <span>Timetable</span>
          </button>
        </div>
      </div>

      {/* 2. FOUR REAL METRIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Primary Class Roster */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Assigned Class
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#e2ecf8] text-[#2563eb] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">school</span>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0f1e36] tracking-tight">
              Class {teacherClass}-{teacherSection}
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              {loadingStudents ? 'Loading roster...' : `${students.length} Enrolled Students`}
            </p>
          </div>
        </div>

        {/* Card 2: Today's Classroom Attendance */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Class Attendance
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#dcfce7] text-[#16a34a] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">how_to_reg</span>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0f1e36] tracking-tight">
              {classAttendanceStats.present} Present
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              {classAttendanceStats.rate}% Rate · {classAttendanceStats.absent} Absent
            </p>
          </div>
        </div>

        {/* Card 3: Teacher GPS Status */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Teacher GPS Punch
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#fef3c7] text-[#d97706] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">pin_drop</span>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-extrabold text-[#0f1e36] tracking-tight">
              {gpsData.isCheckedOut
                ? 'Checked Out'
                : gpsData.isCheckedIn
                ? 'Checked In'
                : 'Punch Pending'}
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1 truncate">
              {gpsData.checkInTime
                ? `In at ${gpsData.checkInTime}`
                : 'Perimeter: Star Public Campus'}
            </p>
          </div>
        </div>

        {/* Card 4: Upcoming Break or Exam */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Upcoming Event
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">event</span>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg font-extrabold text-[#0f1e36] tracking-tight truncate">
              {nextHoliday.name}
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              {nextHoliday.date}
            </p>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: 2 COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Assigned Class Student Roster (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0f1e36]">
                  Class {teacherClass}-{teacherSection} Student Directory
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real enrollment records for your assigned classroom.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search student or roll..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#132c4e]"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3">Roll</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Parent / Father</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3 text-center">Today's Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingStudents ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Loading enrolled students...
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No students found for Class {teacherClass}-{teacherSection}.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.slice(0, 8).map((st) => {
                      const stId = st.id || st.ID
                      const status = attendanceRecords[stId] || 'present'
                      const rollNo = st.roll_no || st.Roll || '-'
                      const name = st.name || st.Name || 'Student'
                      const father = st.father_name || st.Father || '-'
                      const mobile = st.mobile || st.Mobile || '-'

                      const badgeStyles = {
                        present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        absent: 'bg-rose-50 text-rose-700 border-rose-200',
                        late: 'bg-amber-50 text-amber-700 border-amber-200',
                        half_day: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                      }

                      return (
                        <tr key={stId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {rollNo}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-[#0f1e36] block">
                              {name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ADM: {st.admission_number || st.AdmissionNo || 'SPS'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{father}</td>
                          <td className="py-3 px-3 text-slate-500 font-mono">{mobile}</td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                badgeStyles[status] || badgeStyles.present
                              }`}
                            >
                              {status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">
                Showing {Math.min(filteredStudents.length, 8)} of {filteredStudents.length} students
              </span>
              <button
                onClick={() => navigate('/students')}
                className="text-xs font-bold text-[#132c4e] hover:underline"
              >
                View all students directory →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: GPS Attendance Punch & Notes (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Daily Teacher GPS Punch Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0f1e36]">
                Staff GPS Punch
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live Radar
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400 font-medium">
              Star Public School Campus Perimeter
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Time
              </p>
              <div className="mt-1 text-2xl font-black text-[#0f1e36] tracking-tight">
                {currentTime || '08:14:32 AM'}
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {gpsData.isCheckedOut
                  ? `Completed departure at ${gpsData.checkOutTime}`
                  : gpsData.isCheckedIn
                  ? `Checked in at ${gpsData.checkInTime}`
                  : 'Arrival punch required before 08:30 AM'}
              </p>
            </div>

            <div className="mt-4">
              <button
                onClick={handleGpsPunch}
                disabled={punching || gpsData.isCheckedOut}
                className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
                  gpsData.isCheckedOut
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : gpsData.isCheckedIn
                    ? 'bg-[#132c4e] hover:bg-[#0f1e36] text-white'
                    : 'bg-[#16a34a] hover:bg-emerald-700 text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {gpsData.isCheckedOut ? 'check_circle' : gpsData.isCheckedIn ? 'logout' : 'login'}
                </span>
                <span>
                  {punching
                    ? 'Processing...'
                    : gpsData.isCheckedOut
                    ? 'Day Completed (Checked Out)'
                    : gpsData.isCheckedIn
                    ? 'Punch Out (Departure)'
                    : 'Punch In (Arrival)'}
                </span>
              </button>
            </div>

            <div className="mt-3 text-center">
              <button
                onClick={() => navigate('/teacher-attendance')}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                View full attendance history & geofence details →
              </button>
            </div>
          </div>

          {/* Teacher Pinned Notes */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0f1e36]">
                Teacher Notes
              </h3>
              <button
                onClick={() => setIsAddingNote(!isAddingNote)}
                className="h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                title="Add note"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>

            {isAddingNote && (
              <form onSubmit={handleAddNote} className="space-y-2">
                <input
                  type="text"
                  placeholder="Note text..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
                  autoFocus
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingNote(false)}
                    className="px-2 py-0.5 text-xs text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-[#132c4e] px-2.5 py-0.5 text-xs font-bold text-white"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {notes.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No pinned notes</p>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="group flex items-start justify-between rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-100"
                  >
                    <div>
                      <span className="text-slate-700 font-medium leading-tight block">
                        {n.text}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {n.time}
                      </span>
                    </div>
                    <button
                      onClick={() => setNotes((prev) => prev.filter((item) => item.id !== n.id))}
                      className="hidden group-hover:block text-slate-400 hover:text-rose-500 ml-2 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
