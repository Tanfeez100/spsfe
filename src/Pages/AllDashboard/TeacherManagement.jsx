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
import { normalizeSchoolClass, sortSchoolClasses } from '../../constants/schoolOptions'

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
  const normalizedAssignments = assignments.map((assignment) => ({
    ...assignment,
    class: normalizeSchoolClass(assignment?.class),
  }))
  const primaryAssignment = normalizedAssignments[0] || null

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
    fullName: teacher?.fullName || teacher?.profile?.full_name || '',
    employeeId: teacher?.employeeId || teacher?.profile?.employee_id || '',
    mobile: teacher?.mobile || teacher?.profile?.mobile || '',
    username: teacher?.username || teacher?.profile?.username || '',
    status: teacher?.status || teacher?.profile?.status || 'active',
    role: teacher?.role || teacher?.user?.role || 'teacher',
    createdAt: teacher?.created_at || teacher?.createdAt || teacher?.user?.created_at || teacher?.user?.createdAt || '',
    assignments: normalizedAssignments,
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
  const [openActionMenuId, setOpenActionMenuId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('list')

  const [formData, setFormData] = useState({
    full_name: '',
    employee_id: '',
    mobile: '',
    email: '',
    password: '',
    gender: '',
    date_of_birth: '',
    qualification: '',
    designation: '',
    department: '',
    joining_date: '',
    address: '',
    emergency_contact: '',
    status: 'active',
  })

  const loginType = getLoginType()
  const user = getUser()
  const isAdmin = loginType === 'all' && user?.role === 'admin'

  const totalTeachers = useMemo(() => teachers.length, [teachers])
  const fallbackSections = ['A', 'B', 'C']
  const normalizedClassOptions = useMemo(() => {
    const classMap = new Map()

    classOptions.forEach((item) => {
      const rawClass = String(item.class || '').trim()
      if (!rawClass) return

      const normalizedClass = normalizeSchoolClass(rawClass)
      const sections = Array.isArray(item.sections) ? item.sections.filter(Boolean) : []

      if (!classMap.has(normalizedClass)) {
        classMap.set(normalizedClass, {
          class: normalizedClass,
          sections: new Set(sections.length > 0 ? sections : fallbackSections),
        })
        return
      }

      const existing = classMap.get(normalizedClass)
      sections.forEach((section) => existing.sections.add(section))
    })

    return sortSchoolClasses(Array.from(classMap.values())).map((item) => ({
      class: item.class,
      sections: Array.from(item.sections),
    }))
  }, [classOptions])

  const sectionOptionsByClass = useMemo(() => {
    return normalizedClassOptions.reduce((map, item) => {
      map[item.class] = Array.isArray(item.sections) && item.sections.length > 0 ? item.sections : fallbackSections
      return map
    }, {})
  }, [normalizedClassOptions])

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

    if (!email || !formData.full_name || !formData.employee_id) {
      setError('Full name, employee ID and email are required.')
      return
    }

    if (password && password.length < 6) {
      setError('Password should be at least 6 characters.')
      return
    }

    setSubmitting(true)
    try {
      const response = await createTeacher({
        ...formData,
        email,
        password: password || undefined,
      })
      const credentials = response?.teacher?.username
        ? ` Username: ${response.teacher.username}${response.teacher.temporaryPassword ? ` | Temporary Password: ${response.teacher.temporaryPassword}` : ''}`
        : ''
      setSuccess(`Teacher added successfully.${credentials}`)
      setFormData({
        full_name: '',
        employee_id: '',
        mobile: '',
        email: '',
        password: '',
        gender: '',
        date_of_birth: '',
        qualification: '',
        designation: '',
        department: '',
        joining_date: '',
        address: '',
        emergency_contact: '',
        status: 'active',
      })
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

    setOpenActionMenuId('')
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

  const handleRemoveAssignment = async (teacher) => {
    const selectedAssignment = teacher.assignments?.[0]

    if (!selectedAssignment) {
      setError('No class assignment found for this teacher.')
      setOpenActionMenuId('')
      return
    }

    const label = `${selectedAssignment.class} - ${selectedAssignment.section} (${selectedAssignment.academic_year})`
    setOpenActionMenuId('')
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
              ? 'bg-slate-600 text-white shadow-sm shadow-slate-400/20'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-base">format_list_bulleted</span>
          Teacher's List
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('add')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'add'
              ? 'bg-slate-600 text-white shadow-sm shadow-slate-400/20'
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
        <div className="mx-auto max-w-5xl bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Add Teacher</h3>
          <form onSubmit={handleAddTeacher} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['full_name', 'Full Name', 'text', true],
              ['employee_id', 'Employee ID', 'text', true],
              ['mobile', 'Mobile', 'tel', false],
            ].map(([name, label, type, required]) => (
              <div key={name}>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] bg-white text-[#0f172a] focus:ring-2 focus:ring-[#94a3b8]/40 focus:border-[#64748b]"
                  required={required}
                />
              </div>
            ))}
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
                placeholder="Auto-generate if blank"
                className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] bg-white text-[#0f172a] focus:ring-2 focus:ring-[#94a3b8]/40 focus:border-[#64748b]"
              />
            </div>
            {[
              ['gender', 'Gender', 'select'],
              ['date_of_birth', 'Date of Birth', 'date'],
              ['qualification', 'Qualification', 'text'],
              ['designation', 'Designation', 'text'],
              ['department', 'Department', 'text'],
              ['joining_date', 'Joining Date', 'date'],
              ['emergency_contact', 'Emergency Contact', 'text'],
            ].map(([name, label, type]) => (
              <div key={name}>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
                {type === 'select' ? (
                  <select
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] bg-white text-[#0f172a] focus:ring-2 focus:ring-[#94a3b8]/40 focus:border-[#64748b]"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] bg-white text-[#0f172a] focus:ring-2 focus:ring-[#94a3b8]/40 focus:border-[#64748b]"
                  />
                )}
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] bg-white text-[#0f172a]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] bg-white text-[#0f172a] focus:ring-2 focus:ring-[#94a3b8]/40 focus:border-[#64748b]"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="sm:col-span-2 lg:col-span-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f172a] text-[#ffffff] font-semibold hover:bg-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-slate-500/20"
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
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Teacher's List</h3>

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
                    <th className="px-3 py-2.5 text-left font-semibold text-[#ffffff]">Teacher</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-[#ffffff]">Login</th>
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
                          <div className="font-semibold">{teacher.fullName || teacher.email || 'Teacher'}</div>
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {teacher.employeeId || 'No employee ID'} {teacher.mobile ? `| ${teacher.mobile}` : ''}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-900 dark:text-white">
                          <div className="font-semibold">{teacher.email || 'Email unavailable'}</div>
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {teacher.username ? `Username: ${teacher.username}` : ''}
                          </div>
                          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${teacher.status === 'inactive' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {teacher.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 min-w-[150px]">
                          {normalizedClassOptions.length > 0 ? (
                            <select
                              value={draft.class}
                              onChange={(event) => updateAssignmentDraft(teacher.id, 'class', event.target.value)}
                              className="w-full rounded-lg border border-[#cbd5e1] bg-white px-2 py-1.5 text-sm text-[#0f172a]"
                            >
                              <option value="">Select class</option>
                              {normalizedClassOptions.map((item) => (
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
                                  key={`${assignment.class}-${assignment.section}`}
                                  className="inline-flex items-center rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                                >
                                  {assignment.class} - {assignment.section} 
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Not assigned</span>
                          )}
                        </td>
                        <td className="relative px-3 py-2.5 min-w-[190px]">
                          <div className="relative flex w-full max-w-[230px] items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenuId('')
                                handleAssignTeacher(teacher)
                              }}
                              disabled={isAssigning}
                              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0f172a] px-3 text-sm font-bold text-[#ffffff] hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <span className={`material-symbols-outlined text-base leading-none ${isAssigning ? 'animate-spin' : ''}`}>
                                {isAssigning ? 'sync' : 'check_circle'}
                              </span>
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const nextId = openActionMenuId === String(teacher.id) ? '' : String(teacher.id)
                                setOpenActionMenuId(nextId)
                              }}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              aria-label="Teacher actions"
                            >
                              <span className="material-symbols-outlined text-xl leading-none">more_vert</span>
                            </button>
                            {openActionMenuId === String(teacher.id) ? (
                              <div className="absolute right-3 top-[52px] z-[80] w-56 overflow-hidden rounded-xl border border-slate-200 !bg-[#ffffff] opacity-100 shadow-[0_18px_40px_rgba(15,23,42,0.22)] backdrop-blur-none">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTeacher(teacher)}
                                  disabled={deletingId === String(teacher.id)}
                                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm font-bold text-[#b91c1c] hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:text-[#fca5a5]"
                                >
                                  <span className={`material-symbols-outlined text-base ${deletingId === String(teacher.id) ? 'animate-spin' : ''}`}>
                                    {deletingId === String(teacher.id) ? 'sync' : 'delete'}
                                  </span>
                                  Remove Teacher
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAssignment(teacher)}
                                  disabled={isAssigning || !teacher.assignments?.length}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-[#92400e] hover:bg-[#fffbeb] disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#64748b]"
                                >
                                  <span className={`material-symbols-outlined text-base ${isAssigning ? 'animate-spin' : ''}`}>
                                    {isAssigning ? 'sync' : 'backspace'}
                                  </span>
                                  Remove Class
                                </button>
                              </div>
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
