import React, { useEffect, useMemo, useState } from 'react'
import { emitToast } from '../../Api/auth'
import { getAllStudents, leaveStudent, rejoinStudent } from '../../Api/students'

function StudentLifecycle() {
  const [activeStudentsData, setActiveStudentsData] = useState([])
  const [leftStudentsData, setLeftStudentsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    academic_year: '',
    query: '',
  })
  const [activeTab, setActiveTab] = useState('active')
  const [actionLoading, setActionLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [leaveModal, setLeaveModal] = useState({
    open: false,
    student: null,
    leave_date: new Date().toISOString().split('T')[0],
    reason: '',
  })

  const [rejoinModal, setRejoinModal] = useState({
    open: false,
    student: null,
    class: '',
    section: '',
    roll_no: '',
    academic_year: '',
  })

  const getStudentId = (student) => {
    return student.ID || student._id || student.id || student.Id || student.student_id || student.StudentId || ''
  }

  const normalizeField = (value) => (value ?? '').toString().trim().toLowerCase()

  const isStudentLeft = (student) => {
    const status = (student.Status || student.status || student.StudentStatus || '').toString().toLowerCase()
    return Boolean(student.is_left || student.IsLeft || student.left || status === 'left' || status === 'inactive')
  }

  const getStudentClass = (student) => {
    const promotedClass =
      student?.PromotedClass ??
      student?.promotedClass ??
      student?.promoted_class ??
      student?.promoted_to_class ??
      student?.new_class ??
      student?.next_class ??
      student?.CurrentClass ??
      student?.current_class

    const baseClass = student?.Class ?? student?.class
    return (promotedClass ?? baseClass ?? '').toString().trim()
  }

  const getStudentSection = (student) => {
    const promotedSection =
      student?.PromotedSection ??
      student?.promotedSection ??
      student?.promoted_section ??
      student?.promoted_to_section ??
      student?.new_section ??
      student?.next_section ??
      student?.CurrentSection ??
      student?.current_section

    const baseSection = student?.Section ?? student?.section
    return (promotedSection ?? baseSection ?? '').toString().trim()
  }

  const fetchStudents = async () => {
    setLoading(true)
    setError('')
    try {
      const baseFilters = {
        section: filters.section,
        academic_year: filters.academic_year,
      }

      const [activeResponse, inactiveResponse] = await Promise.all([
        getAllStudents({
          ...baseFilters,
          status: 'active',
        }),
        getAllStudents({
          ...baseFilters,
          status: 'inactive',
        }),
      ])

      const activeList = activeResponse?.students || activeResponse?.data || []
      const inactiveList = inactiveResponse?.students || inactiveResponse?.data || []

      if (Array.isArray(activeList) && Array.isArray(inactiveList) && (activeList.length > 0 || inactiveList.length > 0)) {
        setActiveStudentsData(activeList)
        setLeftStudentsData(inactiveList)
      } else {
        // Fallback: if API returns mixed list, split locally by status flags
        const fallbackResponse = await getAllStudents(baseFilters)
        const mixedList = fallbackResponse?.students || fallbackResponse?.data || []
        const activeFallback = []
        const leftFallback = []

        ;(Array.isArray(mixedList) ? mixedList : []).forEach((student) => {
          if (isStudentLeft(student)) {
            leftFallback.push(student)
          } else {
            activeFallback.push(student)
          }
        })

        setActiveStudentsData(activeFallback)
        setLeftStudentsData(leftFallback)
      }
    } catch (err) {
      const message = err?.message || 'Failed to fetch students'
      setError(message)
      emitToast('error', message, 'Students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, filters.query])

  const filterByQuery = (list) => {
    const query = filters.query.trim().toLowerCase()
    if (!query) {
      return list
    }

    return list.filter((student) => {
      const id = getStudentId(student).toLowerCase()
      const name = (student.Name || student.name || '').toLowerCase()
      const father = (student.Father || student.father_name || '').toLowerCase()
      const roll = (student.Roll || student.roll_no || '').toString().toLowerCase()
      const mobile = (student.Mobile || student.mobile || '').toLowerCase()
      const studentClass = getStudentClass(student).toLowerCase()
      const studentSection = getStudentSection(student).toLowerCase()
      return (
        id.includes(query) ||
        name.includes(query) ||
        father.includes(query) ||
        roll.includes(query) ||
        mobile.includes(query) ||
        studentClass.includes(query) ||
        studentSection.includes(query)
      )
    })
  }

  const filterByClass = (list) => {
    if (!filters.class.trim()) return list
    const classQuery = normalizeField(filters.class)
    return list.filter((student) => normalizeField(getStudentClass(student)) === classQuery)
  }

  const activeStudents = useMemo(
    () => filterByQuery(filterByClass(activeStudentsData)),
    [filters.class, filters.query, activeStudentsData]
  )
  const leftStudents = useMemo(
    () => filterByQuery(filterByClass(leftStudentsData)),
    [filters.class, filters.query, leftStudentsData]
  )
  const totalStudents = activeStudentsData.length + leftStudentsData.length

  const handleCopyId = async (studentId) => {
    if (!studentId) return
    try {
      await navigator.clipboard.writeText(studentId)
      emitToast('success', 'Student UUID copied', 'Copied')
    } catch {
      emitToast('warning', `Student UUID: ${studentId}`, 'Copy Not Supported')
    }
  }

  const openLeaveModal = (student) => {
    setLeaveModal({
      open: true,
      student,
      leave_date: new Date().toISOString().split('T')[0],
      reason: '',
    })
  }

  const openRejoinModal = (student) => {
    setRejoinModal({
      open: true,
      student,
      class: getStudentClass(student),
      section: getStudentSection(student),
      roll_no: (student.Roll || student.roll_no || '').toString(),
      academic_year: (student.AcademicYear || student.academic_year || '').toString(),
    })
  }

  const submitLeave = async (e) => {
    e.preventDefault()
    if (!leaveModal.student) return

    setActionLoading(true)
    try {
      const studentId = getStudentId(leaveModal.student)
      await leaveStudent(studentId, {
        leave_date: leaveModal.leave_date,
        reason: leaveModal.reason,
      })
      emitToast('success', 'Student marked as left', 'Leave Updated')
      setLeaveModal((prev) => ({ ...prev, open: false, student: null }))
      fetchStudents()
    } catch (err) {
      emitToast('error', err?.message || 'Failed to mark leave', 'Leave Failed')
    } finally {
      setActionLoading(false)
    }
  }

  const submitRejoin = async (e) => {
    e.preventDefault()
    if (!rejoinModal.student) return

    setActionLoading(true)
    try {
      const studentId = getStudentId(rejoinModal.student)
      const normalizedClass = rejoinModal.class.toString().trim()
      const normalizedSection = rejoinModal.section.toString().trim().toUpperCase()
      const normalizedRoll = rejoinModal.roll_no.toString().trim()
      const normalizedAcademicYear = rejoinModal.academic_year.toString().trim()

      if (!normalizedClass || !normalizedSection || !normalizedRoll || !normalizedAcademicYear) {
        emitToast('error', 'Class, section, roll and academic year are required', 'Validation')
        return
      }

      const activeResponse = await getAllStudents({ status: 'active' })
      const activeList = activeResponse?.students || activeResponse?.data || []
      const conflictStudent = (Array.isArray(activeList) ? activeList : []).find((student) => {
        const existingId = getStudentId(student)
        if (!existingId || existingId === studentId) return false

        const existingClass = normalizeField(getStudentClass(student))
        const existingSection = normalizeField(getStudentSection(student))
        const existingRoll = normalizeField(student.Roll || student.roll_no)

        return (
          existingClass === normalizeField(normalizedClass) &&
          existingSection === normalizeField(normalizedSection) &&
          existingRoll === normalizeField(normalizedRoll)
        )
      })

      if (conflictStudent) {
        const conflictName = conflictStudent.Name || conflictStudent.name || 'another student'
        emitToast(
          'error',
          `Class ${normalizedClass}, Section ${normalizedSection}, Roll ${normalizedRoll} already assigned to ${conflictName}.`,
          'Roll Conflict'
        )
        return
      }

      await rejoinStudent(studentId, {
        class: normalizedClass,
        section: normalizedSection,
        roll_no: normalizedRoll,
        academic_year: normalizedAcademicYear,
      })
      emitToast('success', 'Student rejoined successfully', 'Rejoin Updated')
      setRejoinModal((prev) => ({ ...prev, open: false, student: null }))
      fetchStudents()
    } catch (err) {
      emitToast('error', err?.message || 'Failed to rejoin student', 'Rejoin Failed')
    } finally {
      setActionLoading(false)
    }
  }

  const list = activeTab === 'active' ? activeStudents : leftStudents
  const totalPages = Math.max(1, Math.ceil(list.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedList = list.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Student Leave & Rejoin</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Separate lifecycle page with UUID-based student tracking.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
          <div className="gps-card-soft rounded-lg px-3 py-2">
            <p className="text-slate-600">Total</p>
            <p className="font-bold text-cyan-700">{totalStudents}</p>
          </div>
          <div className="gps-card-soft rounded-lg px-3 py-2">
            <p className="text-slate-600">Active</p>
            <p className="font-bold text-emerald-700">{activeStudents.length}</p>
          </div>
          <div className="gps-card-soft rounded-lg px-3 py-2">
            <p className="text-slate-600">Left</p>
            <p className="font-bold text-amber-700">{leftStudents.length}</p>
          </div>
        </div>
      </div>

      <div className="gps-card rounded-xl p-3 sm:p-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <input
            value={filters.class}
            onChange={(e) => setFilters((prev) => ({ ...prev, class: e.target.value }))}
            placeholder="Class"
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          />
          <input
            value={filters.section}
            onChange={(e) => setFilters((prev) => ({ ...prev, section: e.target.value }))}
            placeholder="Section"
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          />
          <input
            value={filters.academic_year}
            onChange={(e) => setFilters((prev) => ({ ...prev, academic_year: e.target.value }))}
            placeholder="Academic Year"
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          />
          <input
            value={filters.query}
            onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
            placeholder="Search name/father/roll/UUID"
            className="col-span-2 lg:col-span-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          />
          <div className="col-span-2 lg:col-span-1 flex gap-2">
            <button
              onClick={fetchStudents}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold gps-button"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setFilters({ class: '', section: '', academic_year: '', query: '' })
                setCurrentPage(1)
                setTimeout(fetchStudents, 0)
              }}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="gps-card rounded-xl p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${
              activeTab === 'active'
                ? 'bg-slate-600 text-white border border-slate-600 shadow-sm shadow-slate-400/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Active Students
          </button>
          <button
            onClick={() => setActiveTab('left')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${
              activeTab === 'left'
                ? 'bg-slate-600 text-white border border-slate-600 shadow-sm shadow-slate-400/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Left Students
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-400/15 border border-red-300/40 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="h-12 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {paginatedList.map((student, index) => {
              const studentId = getStudentId(student)
              return (
                <div key={studentId || index} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{student.Name || student.name || '--'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Roll: {student.Roll || student.roll_no || '--'} | Class: {getStudentClass(student) || '--'}-{getStudentSection(student) || '--'}
                      </p>
                    </div>
                    {activeTab === 'active' ? (
                      <button
                        onClick={() => openLeaveModal(student)}
                        className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-semibold"
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={() => openRejoinModal(student)}
                        className="px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-semibold"
                      >
                        Rejoin
                      </button>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p>Father: {student.Father || student.father_name || '--'}</p>
                    <p>Mobile: {student.Mobile || student.mobile || '--'}</p>
                    <p>Academic Year: {student.AcademicYear || student.academic_year || '--'}</p>
                  </div>

                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block gps-card rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#137fec]">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-white">Roll</th>
                  <th className="px-3 py-2 text-left font-bold text-white">Name</th>
                  <th className="px-3 py-2 text-left font-bold text-white">Father</th>
                  <th className="px-3 py-2 text-left font-bold text-white">Class</th>
                  <th className="px-3 py-2 text-left font-bold text-white">Section</th>
                  <th className="px-3 py-2 text-left font-bold text-white">Mobile</th>
                  <th className="px-3 py-2 text-left font-bold text-white">Academic Year</th>
                  <th className="px-3 py-2 text-center font-bold text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((student, index) => {
                  const studentId = getStudentId(student)
                  return (
                    <tr key={studentId || index} className="border-b border-slate-200 hover:bg-cyan-300/8">
                      <td className="px-3 py-2">{student.Roll || student.roll_no || '--'}</td>
                      <td className="px-3 py-2 font-medium">{student.Name || student.name || '--'}</td>
                      <td className="px-3 py-2">{student.Father || student.father_name || '--'}</td>
                      <td className="px-3 py-2">{getStudentClass(student) || '--'}</td>
                      <td className="px-3 py-2">{getStudentSection(student) || '--'}</td>
                      <td className="px-3 py-2">{student.Mobile || student.mobile || '--'}</td>
                      <td className="px-3 py-2">{student.AcademicYear || student.academic_year || '--'}</td>
                      <td className="px-3 py-2 text-center">
                        {activeTab === 'active' ? (
                          <button
                            onClick={() => openLeaveModal(student)}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold"
                          >
                            Mark Leave
                          </button>
                        ) : (
                          <button
                            onClick={() => openRejoinModal(student)}
                            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold"
                          >
                            Rejoin
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}

                {paginatedList.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                      No students found in this list
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && list.length > 0 && (
            <div className="mt-3 gps-card-soft rounded-lg border border-slate-200 p-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs sm:text-sm text-slate-600">
                  Showing{' '}
                  <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold text-slate-900">
                    {Math.min(startIndex + itemsPerPage, list.length)}
                  </span>{' '}
                  of <span className="font-semibold text-slate-900">{list.length}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium disabled:opacity-50"
                  >
                    Prev
                  </button>

                  <span className="text-xs sm:text-sm font-semibold text-slate-700">
                    Page {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Leave Modal */}
      {leaveModal.open && leaveModal.student && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !actionLoading) {
              setLeaveModal((prev) => ({ ...prev, open: false, student: null }))
            }
          }}
        >
          <div className="w-full max-w-md gps-card rounded-xl shadow-xl p-4">
            <h3 className="text-lg font-bold text-slate-900">Mark Student Leave</h3>
            <form onSubmit={submitLeave} className="space-y-3">
              <input
                type="date"
                value={leaveModal.leave_date}
                onChange={(e) => setLeaveModal((prev) => ({ ...prev, leave_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                required
              />
              <textarea
                value={leaveModal.reason}
                onChange={(e) => setLeaveModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Reason (optional)"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLeaveModal((prev) => ({ ...prev, open: false, student: null }))}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejoin Modal */}
      {rejoinModal.open && rejoinModal.student && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !actionLoading) {
              setRejoinModal((prev) => ({ ...prev, open: false, student: null }))
            }
          }}
        >
          <div className="w-full max-w-lg gps-card rounded-xl shadow-xl p-4">
            <h3 className="text-lg font-bold text-slate-900">Rejoin Student</h3>
            <form onSubmit={submitRejoin} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={rejoinModal.class}
                onChange={(e) => setRejoinModal((prev) => ({ ...prev, class: e.target.value }))}
                placeholder="Class"
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                required
              />
              <input
                value={rejoinModal.section}
                onChange={(e) => setRejoinModal((prev) => ({ ...prev, section: e.target.value.toUpperCase() }))}
                placeholder="Section"
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                required
              />
              <input
                value={rejoinModal.roll_no}
                onChange={(e) => setRejoinModal((prev) => ({ ...prev, roll_no: e.target.value }))}
                placeholder="Roll No"
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                required
              />
              <input
                value={rejoinModal.academic_year}
                onChange={(e) => setRejoinModal((prev) => ({ ...prev, academic_year: e.target.value }))}
                placeholder="Academic Year (2026-27)"
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                required
              />

              <div className="sm:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejoinModal((prev) => ({ ...prev, open: false, student: null }))}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Rejoin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentLifecycle
