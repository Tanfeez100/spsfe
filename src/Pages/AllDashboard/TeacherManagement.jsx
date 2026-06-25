import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  assignTeacherToClass,
  createTeacher,
  getTeachers,
  getLoginType,
  getUser,
  removeTeacher,
  removeTeacherAssignment,
} from '../../Api/auth'
import { getClassesWithSections } from '../../Api/classes'

const resolveTeachersList = (response) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.teachers)) return response.teachers
  if (Array.isArray(response?.users)) return response.users
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.results)) return response.results
  return []
}

const toTeacherRow = (teacher) => {
  const assignments = Array.isArray(teacher?.assignments)
    ? teacher.assignments
    : teacher?.assignment
      ? [teacher.assignment]
      : []
  const primaryAssignment = assignments[0] || null

  return {
    id:
    teacher?.id ||
    teacher?._id ||
    teacher?.user_id ||
    teacher?.userId ||
    teacher?.teacher_id ||
    teacher?.teacherId ||
      '',
    email: teacher?.email || teacher?.user?.email || teacher?.username || '',
    role: teacher?.role || teacher?.user?.role || 'teacher',
    createdAt: teacher?.created_at || teacher?.createdAt || teacher?.user?.created_at || teacher?.user?.createdAt || '',
    assignments,
    assignedClass: teacher?.assignedClass || primaryAssignment?.class || '',
    assignedSection: teacher?.assignedSection || primaryAssignment?.section || '',
    academicYear: teacher?.academicYear || primaryAssignment?.academic_year || '',
  }
}

const getDefaultAcademicYear = () => {
  const now = new Date()
  const currentYear = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1
  return `${currentYear}-${String(currentYear + 1).slice(-2)}`
}

function TeacherManagement() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [assigningId, setAssigningId] = useState('')
  const [classOptions, setClassOptions] = useState([])
  const [assignmentDrafts, setAssignmentDrafts] = useState({})
  const [removeAssignmentSelections, setRemoveAssignmentSelections] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('list')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const loginType = getLoginType()
  const user = getUser()
  const isAdmin = loginType === 'all' && user?.role === 'admin'

  const totalTeachers = useMemo(() => teachers.length, [teachers])
  const fallbackSections = ['A', 'B', 'C']

  const sectionOptionsByClass = useMemo(() => {
    return classOptions.reduce((map, item) => {
      map[item.class] = Array.isArray(item.sections) && item.sections.length > 0 ? item.sections : fallbackSections
      return map
    }, {})
  }, [classOptions])

  const fetchTeachers = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    setError('')
    try {
      const response = await getTeachers()
      const rows = resolveTeachersList(response)
        .map(toTeacherRow)
        .filter((row) => row.id && String(row.role || '').toLowerCase() === 'teacher')

      setTeachers(rows)
      setAssignmentDrafts(
        rows.reduce((drafts, row) => {
          drafts[row.id] = {
            class: row.assignedClass || '',
            section: row.assignedSection || '',
            academic_year: row.academicYear || getDefaultAcademicYear(),
          }
          return drafts
        }, {})
      )
      setRemoveAssignmentSelections(
        rows.reduce((selections, row) => {
          const assignment = row.assignments?.[0]
          selections[row.id] = assignment
            ? `${assignment.class}__${assignment.section}__${assignment.academic_year}`
            : ''
          return selections
        }, {})
      )
    } catch (err) {
      setTeachers([])
      setError(err?.message || 'Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  const fetchClassOptions = useCallback(async () => {
    if (!isAdmin) return
    try {
      const response = await getClassesWithSections()
      setClassOptions(Array.isArray(response) ? response : [])
    } catch {
      setClassOptions([])
    }
  }, [isAdmin])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  useEffect(() => {
    fetchClassOptions()
  }, [fetchClassOptions])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleAddTeacher = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const email = String(formData.email || '').trim()
    const password = String(formData.password || '')

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters.')
      return
    }

    setSubmitting(true)
    try {
      await createTeacher({ email, password })
      setSuccess('Teacher added successfully.')
      setFormData({ email: '', password: '' })
      await fetchTeachers()
    } catch (err) {
      setError(err?.message || 'Failed to add teacher')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveTeacher = async (teacher) => {
    if (!teacher?.id) {
      setError('Unable to remove this teacher: missing id.')
      return
    }

    const confirmed = window.confirm(`Remove teacher "${teacher.email || teacher.id}"?`)
    if (!confirmed) return

    setDeletingId(String(teacher.id))
    setError('')
    setSuccess('')
    try {
      await removeTeacher(teacher.id)
      setSuccess('Teacher removed successfully.')
      await fetchTeachers()
    } catch (err) {
      setError(err?.message || 'Failed to remove teacher')
    } finally {
      setDeletingId('')
    }
  }

  const updateAssignmentDraft = (teacherId, field, value) => {
    setAssignmentDrafts((prev) => {
      const current = prev[teacherId] || { class: '', section: '', academic_year: getDefaultAcademicYear() }
      const next = { ...current, [field]: value }
      if (field === 'class') {
        const sections = sectionOptionsByClass[value] || fallbackSections
        next.section = sections.includes(current.section) ? current.section : sections[0] || ''
      }
      return { ...prev, [teacherId]: next }
    })
    setError('')
    setSuccess('')
  }

  const updateRemoveSelection = (teacherId, value) => {
    setRemoveAssignmentSelections((prev) => ({ ...prev, [teacherId]: value }))
    setError('')
    setSuccess('')
  }

  const handleAssignTeacher = async (teacher) => {
    const draft = assignmentDrafts[teacher.id] || {}
    if (!draft.class || !draft.section) {
      setError('Please select class and section before saving assignment.')
      return
    }

    setAssigningId(String(teacher.id))
    setError('')
    setSuccess('')
    try {
      await assignTeacherToClass(teacher.id, {
        class: draft.class,
        section: draft.section,
        academic_year: draft.academic_year || getDefaultAcademicYear(),
      })
      setSuccess('Teacher assigned to class successfully.')
      await fetchTeachers()
    } catch (err) {
      setError(
        err?.status === 409
          ? 'This class/section/year is already assigned to another teacher.'
          : err?.message || 'Failed to assign teacher'
      )
    } finally {
      setAssigningId('')
    }
  }

  const handleRemoveAssignment = async (teacher) => {
    const selectedKey = removeAssignmentSelections[teacher.id]
    const selectedAssignment = (teacher.assignments || []).find(
      (assignment) => `${assignment.class}__${assignment.section}__${assignment.academic_year}` === selectedKey
    )

    if (!selectedAssignment) {
      setError('Please select class assignment to remove.')
      return
    }

    const label = `${selectedAssignment.class} - ${selectedAssignment.section} (${selectedAssignment.academic_year})`
    if (!window.confirm(`Remove "${label}" assignment for "${teacher.email || teacher.id}"?`)) return

    setAssigningId(String(teacher.id))
    setError('')
    setSuccess('')
    try {
      await removeTeacherAssignment(teacher.id, {
        class: selectedAssignment.class,
        section: selectedAssignment.section,
        academic_year: selectedAssignment.academic_year,
      })
      setSuccess('Teacher assignment removed.')
      await fetchTeachers()
    } catch (err) {
      setError(err?.message || 'Failed to remove teacher assignment')
    } finally {
      setAssigningId('')
    }
  }

  if (!isAdmin) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
        <p className="text-red-700 dark:text-red-300 text-sm font-semibold">Admin access required.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black text-[#0d141b] dark:text-white">Teacher Management</h2>
        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0f172a] bg-[#f8fafc] border border-[#cbd5e1] px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-base">groups</span>
          {totalTeachers} Teachers
        </span>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'list'
              ? 'bg-[#0f172a] text-white'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-base">format_list_bulleted</span>
          Teachers list
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('add')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'add'
              ? 'bg-[#0f172a] text-white'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Add teacher
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : null}

      {success ? (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
        </div>
      ) : null}

      {activeTab === 'add' && (
        <div className="mx-auto max-w-lg bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Add Teacher</h3>
          <form onSubmit={handleAddTeacher} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Teacher Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="teacher@school.com"
                className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] bg-white text-[#0f172a] focus:ring-2 focus:ring-[#94a3b8]/40 focus:border-[#64748b]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Temporary Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] bg-white text-[#0f172a] focus:ring-2 focus:ring-[#94a3b8]/40 focus:border-[#64748b]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f172a] text-[#ffffff] font-semibold hover:bg-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-slate-500/20"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base">sync</span>
                  Adding...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">person_add</span>
                  Add Teacher
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Teachers List</h3>

          {loading ? (
            <div className="py-10 flex items-center justify-center text-[#475569]">
              <span className="material-symbols-outlined animate-spin mr-2">sync</span>
              Loading teachers...
            </div>
          ) : teachers.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No teachers found.</p>
          ) : (
            <div className="overflow-x-auto table-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(99, 126, 153) rgb(224, 242, 254)' }}>
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-[#1e293b] bg-[#0f172a]">
                    <th className="px-3 py-2.5 text-left font-semibold text-[#ffffff]">Email</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-[#ffffff]">Class</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-[#ffffff]">Section</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-[#ffffff]">Academic Year</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-[#ffffff]">Assigned Classes</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-[#ffffff]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => {
                    const draft = assignmentDrafts[teacher.id] || {
                      class: teacher.assignedClass || '',
                      section: teacher.assignedSection || '',
                      academic_year: teacher.academicYear || getDefaultAcademicYear(),
                    }
                    const sectionOptions = sectionOptionsByClass[draft.class] || fallbackSections
                    const isAssigning = assigningId === String(teacher.id)

                    return (
                      <tr key={`${teacher.id}-${teacher.email}`} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                        <td className="px-3 py-2.5 text-slate-900 dark:text-white">
                          <div className="font-semibold">{teacher.email || 'Email unavailable'}</div>
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString('en-IN') : 'teacher'}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 min-w-[150px]">
                          {classOptions.length > 0 ? (
                            <select
                              value={draft.class}
                              onChange={(event) => updateAssignmentDraft(teacher.id, 'class', event.target.value)}
                              className="w-full rounded-lg border border-[#cbd5e1] bg-white px-2 py-1.5 text-sm text-[#0f172a]"
                            >
                              <option value="">Select class</option>
                              {classOptions.map((item) => (
                                <option key={item.class} value={item.class}>
                                  {item.class}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={draft.class}
                              onChange={(event) => updateAssignmentDraft(teacher.id, 'class', event.target.value)}
                              placeholder="Class"
                              className="w-full rounded-lg border border-[#cbd5e1] bg-white px-2 py-1.5 text-sm text-[#0f172a]"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2.5 min-w-[120px]">
                          <select
                            value={draft.section}
                            onChange={(event) => updateAssignmentDraft(teacher.id, 'section', event.target.value)}
                            className="w-full rounded-lg border border-[#cbd5e1] bg-white px-2 py-1.5 text-sm text-[#0f172a]"
                          >
                            <option value="">Section</option>
                            {sectionOptions.map((section) => (
                              <option key={section} value={section}>
                                {section}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5 min-w-[130px]">
                          <input
                            value={draft.academic_year}
                            onChange={(event) => updateAssignmentDraft(teacher.id, 'academic_year', event.target.value)}
                            placeholder={getDefaultAcademicYear()}
                            className="w-full rounded-lg border border-[#cbd5e1] bg-white px-2 py-1.5 text-sm text-[#0f172a]"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 min-w-[140px]">
                          {teacher.assignments?.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {teacher.assignments.map((assignment) => (
                                <span
                                  key={`${assignment.class}-${assignment.section}-${assignment.academic_year}`}
                                  className="inline-flex items-center rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                                >
                                  {assignment.class} - {assignment.section} ({assignment.academic_year})
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 min-w-[360px]">
                          <div className="grid w-full max-w-[420px] grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleAssignTeacher(teacher)}
                              disabled={isAssigning}
                              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#0f172a] px-3 text-sm font-bold text-[#ffffff] hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <span className={`material-symbols-outlined text-base leading-none ${isAssigning ? 'animate-spin' : ''}`}>
                                {isAssigning ? 'sync' : 'check_circle'}
                              </span>
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveTeacher(teacher)}
                              disabled={deletingId === String(teacher.id)}
                              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              {deletingId === String(teacher.id) ? (
                                <span className="material-symbols-outlined animate-spin text-base leading-none">sync</span>
                              ) : (
                                <span className="material-symbols-outlined text-base leading-none">delete</span>
                              )}
                              <span>Remove Teacher</span>
                            </button>
                            {teacher.assignments?.length ? (
                              <>
                                <select
                                  value={removeAssignmentSelections[teacher.id] || ''}
                                  onChange={(event) => updateRemoveSelection(teacher.id, event.target.value)}
                                  disabled={isAssigning}
                                  className="h-10 min-w-0 rounded-lg border border-amber-200 bg-white px-2 text-sm font-semibold text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="">Select class</option>
                                  {teacher.assignments.map((assignment) => {
                                    const key = `${assignment.class}__${assignment.section}__${assignment.academic_year}`
                                    return (
                                      <option key={key} value={key}>
                                        {assignment.class} - {assignment.section} ({assignment.academic_year})
                                      </option>
                                    )
                                  })}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAssignment(teacher)}
                                  disabled={isAssigning}
                                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-bold text-[#92400e] hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30"
                                >
                                  <span className="material-symbols-outlined text-base leading-none">backspace</span>
                                  <span>Remove Class</span>
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TeacherManagement
