import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllStudents, deleteStudent, leaveStudent, rejoinStudent } from '../../Api/students'
import { emitToast } from '../../Api/auth'
import { CLASS_OPTIONS, normalizeSchoolClass } from '../../constants/schoolOptions'
import EditStudent from './EditStudent'

function AllStudentDetails() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [count, setCount] = useState(0)
  const [classFilter, setClassFilter] = useState('')
  const [rollFilter, setRollFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [isRejoinModalOpen, setIsRejoinModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [studentForStatusUpdate, setStudentForStatusUpdate] = useState(null)
  const [leaveForm, setLeaveForm] = useState({
    leave_date: new Date().toISOString().split('T')[0],
    reason: ''
  })
  const [rejoinForm, setRejoinForm] = useState({
    class: '',
    section: '',
    roll_no: '',
    academic_year: ''
  })
  const [statusActionLoading, setStatusActionLoading] = useState(false)
  const itemsPerPage = 10
  const classOptions = CLASS_OPTIONS

  const getStudentId = (student) => {
    return student.ID || student._id || student.id || student.Id || student.student_id || student.StudentId || null
  }

  const isStudentLeft = (student) => {
    const status = (student.Status || student.status || student.StudentStatus || '').toString().toLowerCase()
    return Boolean(student.is_left || student.IsLeft || student.left || status === 'left')
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
    const resolvedClass = (promotedClass ?? baseClass ?? '').toString().trim()
    return normalizeSchoolClass(resolvedClass)
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

  const normalizeField = (value) => (value ?? '').toString().trim().toLowerCase()
  const formatAddressForTable = (value) => {
    const address = (value ?? '').toString().trim()
    if (!address) {
      return {
        display: '-',
        full: ''
      }
    }

    if (address.length <= 20) {
      return {
        display: address,
        full: address
      }
    }

    return {
      display: `${address.slice(0, 20)}...`,
      full: address
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [rollFilter])

  const fetchStudents = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getAllStudents({
        roll_no: rollFilter,
      })
      if (response.success) {
        const studentsList = response.students || []
        // Log first student to see structure (for debugging)
        if (studentsList.length > 0) {
          console.log('Sample student object:', studentsList[0])
        }
        setStudents(studentsList)
        setCount(response.count || 0)
        setCurrentPage(1) // Reset to first page on new filter
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  // Filter students by search term, class, roll, and section
  const filteredStudents = students.filter(student => {
    const resolvedClass = getStudentClass(student)
    const resolvedSection = getStudentSection(student)

    // Search term filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchesSearch = (
        student.Name?.toLowerCase().includes(search) ||
        student.Father?.toLowerCase().includes(search) ||
        student.Roll?.toString().includes(search) ||
        resolvedClass.toLowerCase().includes(search) ||
        resolvedSection.toLowerCase().includes(search) ||
        student.Mobile?.includes(search)
      )
      if (!matchesSearch) return false
    }

    // Class filter (case-insensitive)
    if (classFilter && normalizeField(resolvedClass) !== normalizeField(classFilter)) {
      return false
    }

    // Roll filter
    if (rollFilter && student.Roll?.toString() !== rollFilter) {
      return false
    }

    // Section filter
    if (sectionFilter && resolvedSection.toLowerCase() !== sectionFilter.toLowerCase()) {
      return false
    }

    // Status filter
    if (statusFilter !== 'all') {
      const studentLeft = isStudentLeft(student)
      if (statusFilter === 'active' && studentLeft) {
        return false
      }
      if (statusFilter === 'left' && !studentLeft) {
        return false
      }
    }

    return true
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

  // Get unique sections for filter dropdown
  const uniqueSections = [...new Set(students.map((s) => getStudentSection(s)).filter(Boolean))].sort()

  const handleDelete = async (student) => {
    if (!window.confirm(`Are you sure you want to delete ${student.Name}?`)) {
      return
    }

    // Try multiple possible ID field names (API uses ID uppercase)
    const studentId = student.ID || student._id || student.id || student.Id || student.student_id || student.StudentId
    
    if (!studentId) {
      // If no ID found, log for debugging
      console.error('Student data (no ID found):', student)
      setError('Student ID not found. Cannot delete student.')
      return
    }

    setDeletingId(studentId)
    setError('')
    try {
      const response = await deleteStudent(studentId)
      if (response.success) {
        // Refresh student list
        emitToast('success', 'Student deleted successfully', 'Student')
        fetchStudents()
      }
    } catch (err) {
      setError(err?.message || 'Failed to delete student')
    } finally {
      setDeletingId(null)
    }
  }

  const handleOpenLeaveModal = (student) => {
    setStudentForStatusUpdate(student)
    setLeaveForm({
      leave_date: new Date().toISOString().split('T')[0],
      reason: ''
    })
    setIsLeaveModalOpen(true)
  }

  const handleOpenRejoinModal = (student) => {
    setStudentForStatusUpdate(student)
    setRejoinForm({
      class: getStudentClass(student) || '',
      section: getStudentSection(student) || '',
      roll_no: student.Roll?.toString() || '',
      academic_year: student.AcademicYear?.toString() || student.academic_year?.toString() || ''
    })
    setIsRejoinModalOpen(true)
  }

  const handleLeaveSubmit = async (e) => {
    e.preventDefault()
    if (!studentForStatusUpdate) return

    const studentId = getStudentId(studentForStatusUpdate)
    if (!studentId) {
      setError('Student ID not found. Cannot update leave status.')
      return
    }

    setStatusActionLoading(true)
    setError('')
    try {
      const response = await leaveStudent(studentId, leaveForm)
      if (response.success !== false) {
        emitToast('success', 'Student marked as left', 'Student')
        setIsLeaveModalOpen(false)
        setStudentForStatusUpdate(null)
        fetchStudents()
      } else {
        setError(response.message || 'Failed to mark student as left')
      }
    } catch (err) {
      setError(err?.message || 'Failed to mark student as left')
    } finally {
      setStatusActionLoading(false)
    }
  }

  const handleRejoinSubmit = async (e) => {
    e.preventDefault()
    if (!studentForStatusUpdate) return

    const studentId = getStudentId(studentForStatusUpdate)
    if (!studentId) {
      setError('Student ID not found. Cannot rejoin student.')
      return
    }

    setStatusActionLoading(true)
    setError('')
    try {
      const normalizedClass = rejoinForm.class.toString().trim()
      const normalizedSection = rejoinForm.section.toString().trim().toUpperCase()
      const normalizedRoll = rejoinForm.roll_no.toString().trim()
      const normalizedAcademicYear = rejoinForm.academic_year.toString().trim()

      if (!normalizedClass || !normalizedSection || !normalizedRoll || !normalizedAcademicYear) {
        setError('Class, section, roll and academic year are required.')
        return
      }

      const activeResponse = await getAllStudents({ status: 'active' })
      const activeList = activeResponse?.students || activeResponse?.data || []
      const conflictStudent = (Array.isArray(activeList) ? activeList : []).find((student) => {
        const existingId = getStudentId(student)
        if (!existingId || existingId === studentId) return false

        const existingClass = normalizeField(student.Class || student.class)
        const existingSection = normalizeField(student.Section || student.section)
        const existingRoll = normalizeField(student.Roll || student.roll_no)

        return (
          existingClass === normalizeField(normalizedClass) &&
          existingSection === normalizeField(normalizedSection) &&
          existingRoll === normalizeField(normalizedRoll)
        )
      })

      if (conflictStudent) {
        const conflictName = conflictStudent.Name || conflictStudent.name || 'another student'
        setError(
          `Class ${normalizedClass}, Section ${normalizedSection}, Roll ${normalizedRoll} already assigned to ${conflictName}.`
        )
        emitToast(
          'error',
          `Class ${normalizedClass}, Section ${normalizedSection}, Roll ${normalizedRoll} already in use.`,
          'Roll Conflict'
        )
        return
      }

      const response = await rejoinStudent(studentId, {
        class: normalizedClass,
        section: normalizedSection,
        roll_no: normalizedRoll,
        academic_year: normalizedAcademicYear,
      })
      if (response.success !== false) {
        emitToast('success', 'Student rejoined successfully', 'Student')
        setIsRejoinModalOpen(false)
        setStudentForStatusUpdate(null)
        fetchStudents()
      } else {
        setError(response.message || 'Failed to rejoin student')
      }
    } catch (err) {
      setError(err?.message || 'Failed to rejoin student')
    } finally {
      setStatusActionLoading(false)
    }
  }

  if (isEditModalOpen && selectedStudent) {
    const handleCloseEdit = () => {
      setIsEditModalOpen(false)
      setSelectedStudent(null)
    }

    return (
      <div className="w-full min-h-full" style={{ fontFamily: "'Lexend', sans-serif" }}>
        <div className="mb-2 flex items-center gap-4 px-5 py-3 sm:px-8 sm:py-4">
          <button
            onClick={handleCloseEdit}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-900 dark:text-white"
            title="Back to Students"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">Edit Student</h1>
        </div>

        <div className="px-4 sm:px-7 pb-5">
          <EditStudent
            isOpen={true}
            onClose={handleCloseEdit}
            onSuccess={() => {
              fetchStudents()
            }}
            studentData={selectedStudent}
            fullPage={true}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
      <style>{`
        .table-scrollbar::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
        }
        .table-scrollbar::-webkit-scrollbar-track {
          background: rgb(224, 242, 254) !important;
          border-radius: 4px !important;
        }
        .table-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(99, 126, 153) !important;
          border-radius: 4px !important;
        }
        .table-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(71, 85, 105) !important;
        }
        .dark .table-scrollbar::-webkit-scrollbar-track {
          background: rgb(224, 242, 254) !important;
        }
        .dark .table-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(99, 126, 153) !important;
        }
        .dark .table-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(71, 85, 105) !important;
        }
        @media (prefers-color-scheme: dark) {
          .table-scrollbar::-webkit-scrollbar-track {
            background: rgb(224, 242, 254) !important;
          }
          .table-scrollbar::-webkit-scrollbar-thumb {
            background: rgb(99, 126, 153) !important;
          }
          .table-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgb(71, 85, 105) !important;
          }
        }
        .dropdown-cyan {
          color: rgb(15, 23, 42) !important;
        }
        .dark .dropdown-cyan {
          color: rgb(255, 255, 255) !important;
        }
        .dropdown-cyan option {
          background: rgb(224, 242, 254) !important;
          color: rgb(15, 23, 42) !important;
        }
        .dark .dropdown-cyan option {
          background: rgb(8, 51, 68) !important;
          color: rgb(255, 255, 255) !important;
        }
        .dropdown-cyan option:checked {
          background: rgb(6, 182, 212) !important;
          color: rgb(255, 255, 255) !important;
        }
        .dropdown-cyan option:hover {
          background: rgb(6, 182, 212) !important;
          color: rgb(255, 255, 255) !important;
        }
        .dropdown-cyan:focus {
          outline: none !important;
          border-color: rgb(6, 182, 212) !important;
        }
      `}</style>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0d141b] dark:text-white">All Student Details</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 order-2 sm:order-1">
            Total: <span className="font-bold text-cyan-200">{count}</span>
          </div>
          <button
            onClick={() => navigate('/students/add')}
            className="flex items-center justify-center gap-1.5 sm:gap-2 bg-cyan-500 hover:bg-cyan-500/90 text-white font-bold px-3 sm:px-4 py-2 rounded-lg shadow-lg shadow-cyan-500/20 transition-all text-xs sm:text-sm order-1 sm:order-2"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span className="hidden sm:inline">Add New Student</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-cyan-50/30 dark:bg-cyan-900/20 rounded-lg p-3 sm:p-4 shadow-md border border-cyan-200/30 dark:border-cyan-800/50">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
          {/* Class Filter */}
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Class
            </label>
            <div className="relative flex min-w-0 overflow-hidden items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
              <span className="material-symbols-outlined pl-1.5 sm:pl-2 text-cyan-200 text-base shrink-0">class</span>
              <select
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="min-w-0 w-full appearance-none bg-transparent border-none focus:ring-0 py-1.5 pl-2 pr-9 text-xs sm:text-sm text-slate-900 dark:text-white dropdown-cyan"
              >
                <option value="" className="bg-cyan-50 dark:bg-slate-800">All</option>
                {classOptions.map((className) => (
                  <option key={className} value={className} className="bg-cyan-50 dark:bg-slate-800">
                    {className}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 text-slate-700 dark:text-slate-300 material-symbols-outlined text-base">
                expand_more
              </span>
            </div>
          </div>

          {/* Roll Number Filter */}
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Roll
            </label>
            <div className="flex min-w-0 overflow-hidden items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
              <span className="material-symbols-outlined pl-1.5 sm:pl-2 text-cyan-200 text-base shrink-0">badge</span>
              <input
                type="text"
                value={rollFilter}
                onChange={(e) => setRollFilter(e.target.value)}
                placeholder="Roll"
                className="min-w-0 w-full bg-transparent border-none focus:ring-0 py-1.5 px-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Section Filter */}
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Section
            </label>
            <div className="relative flex min-w-0 overflow-hidden items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
              <span className="material-symbols-outlined pl-1.5 sm:pl-2 text-cyan-200 text-base shrink-0">category</span>
              <select
                value={sectionFilter}
                onChange={(e) => {
                  setSectionFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="min-w-0 w-full appearance-none bg-transparent border-none focus:ring-0 py-1.5 pl-2 pr-9 text-xs sm:text-sm text-slate-900 dark:text-white dropdown-cyan"
              >
                <option value="" className="bg-cyan-50 dark:bg-slate-800">All</option>
                {uniqueSections.map((section) => (
                  <option key={section} value={section} className="bg-cyan-50 dark:bg-slate-800">
                    {section}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 text-slate-700 dark:text-slate-300 material-symbols-outlined text-base">
                expand_more
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <div className="relative flex min-w-0 overflow-hidden items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
              <span className="material-symbols-outlined pl-1.5 sm:pl-2 text-cyan-200 text-base shrink-0">flag</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-w-0 w-full appearance-none bg-transparent border-none focus:ring-0 py-1.5 pl-2 pr-9 text-xs sm:text-sm text-slate-900 dark:text-white dropdown-cyan"
              >
                <option value="all" className="bg-cyan-50 dark:bg-slate-800">All</option>
                <option value="active" className="bg-cyan-50 dark:bg-slate-800">Active</option>
                <option value="left" className="bg-cyan-50 dark:bg-slate-800">Left</option>
              </select>
              <span className="pointer-events-none absolute right-2 text-slate-700 dark:text-slate-300 material-symbols-outlined text-base">
                expand_more
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="col-span-2 min-w-0 sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Search
            </label>
            <div className="flex min-w-0 overflow-hidden items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
              <span className="material-symbols-outlined pl-1.5 sm:pl-2 text-cyan-200 text-base shrink-0">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Name"
                className="min-w-0 w-full bg-transparent border-none focus:ring-0 py-1.5 px-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
          ))}
        </div>
      )}

      {/* Students Table */}
      {!loading && !error && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-300/30 dark:border-cyan-800/50 overflow-hidden">
          <div className="overflow-x-auto table-scrollbar" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgb(99, 126, 153) rgb(224, 242, 254)'
          }}>
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-blue-700 dark:bg-blue-800">
                <tr>
                  <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left font-bold text-white">S.No</th>
                 
                  <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left font-bold text-white">Name</th>
                  <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left font-bold text-white hidden md:table-cell">Father</th>
                  <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left font-bold text-white hidden sm:table-cell">Class</th>
                   <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left font-bold text-white">Roll</th>
                  <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left font-bold text-white hidden lg:table-cell">Section</th>
                  <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left font-bold text-white hidden xl:table-cell">Username</th>
                  <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left font-bold text-white hidden xl:table-cell">DOB</th>
                  <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left font-bold text-white hidden lg:table-cell">Mobile</th>
                  <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left font-bold text-white hidden 2xl:table-cell">Address</th>
                  {/* <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left font-bold text-white hidden lg:table-cell">Transport</th> */}
                  <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-center font-bold text-white">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-2 sm:px-4 py-6 sm:py-8 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      No students found
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student, index) => {
                    const studentLeft = isStudentLeft(student)
                    const addressInfo = formatAddressForTable(student.Address || student.address || '')

                    return (
                    <tr key={index} className="hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-colors">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-slate-900 dark:text-white">
                        {startIndex + index + 1}
                      </td>
                    
                      <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-slate-900 dark:text-white truncate">
                        {student.Name || '-'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-900 dark:text-white hidden md:table-cell truncate">
                        {student.Father || '-'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-900 dark:text-white hidden sm:table-cell">
                        {getStudentClass(student) || '-'}
                      </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-slate-900 dark:text-white">
                        {student.Roll || '-'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-900 dark:text-white hidden lg:table-cell">
                        {getStudentSection(student) || '-'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-900 dark:text-white hidden xl:table-cell">
                        {student.Username || student.username || '-'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-900 dark:text-white hidden xl:table-cell">
                        {student.DateOfBirth || student.date_of_birth || '-'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-900 dark:text-white hidden lg:table-cell">
                        {student.Mobile || '-'}
                      </td>
                      <td
                        className="px-2 sm:px-4 py-2 sm:py-3 text-slate-900 dark:text-white hidden 2xl:table-cell"
                        title={addressInfo.full || undefined}
                      >
                        {addressInfo.display}
                      </td>
                      {/* <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                        {student.Transport && student.Transport !== "No" && typeof student.Transport === 'number' ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              Yes
                            </span>
                            <span className="text-xs text-slate-900 dark:text-white">₹{student.Transport}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400">
                            <span className="material-symbols-outlined text-sm">cancel</span>
                            No
                          </span>
                        )}
                      </td> */}
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedStudent(student)
                              setIsEditModalOpen(true)
                            }}
                            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-md"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredStudents.length > 0 && (
        <div className="bg-cyan-50/30 dark:bg-cyan-900/20 rounded-lg p-3 sm:p-4 shadow-md border border-cyan-200/30 dark:border-cyan-800/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Showing <span className="font-medium text-slate-900 dark:text-white">{startIndex + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(endIndex, filteredStudents.length)}</span> of <span className="font-medium text-slate-900 dark:text-white">{filteredStudents.length}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-start sm:justify-end">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <div className="flex items-center gap-0.5 sm:gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                          currentPage === page ? 'bg-cyan-500 text-white' : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-1 text-slate-500 dark:text-slate-400 text-xs">...</span>
                    )
                  }
                  return null
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Student Modal */}
      {isLeaveModalOpen && studentForStatusUpdate && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !statusActionLoading) {
              setIsLeaveModalOpen(false)
              setStudentForStatusUpdate(null)
            }
          }}
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Mark Student Leave</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {studentForStatusUpdate.Name || 'Student'} (Roll: {studentForStatusUpdate.Roll || '--'})
            </p>

            <form onSubmit={handleLeaveSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Leave Date</label>
                <input
                  type="date"
                  value={leaveForm.leave_date}
                  onChange={(e) => setLeaveForm((prev) => ({ ...prev, leave_date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Optional reason"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsLeaveModalOpen(false)
                    setStudentForStatusUpdate(null)
                  }}
                  disabled={statusActionLoading}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
      
                <button
                  type="submit"
                  disabled={statusActionLoading}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-500/90 disabled:opacity-50"
                >
                  {statusActionLoading ? 'Saving...' : 'Confirm Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejoin Student Modal */}
      {isRejoinModalOpen && studentForStatusUpdate && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !statusActionLoading) {
              setIsRejoinModalOpen(false)
              setStudentForStatusUpdate(null)
            }
          }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Rejoin Student</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Fill class, section, roll and academic year.
            </p>

            <form onSubmit={handleRejoinSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Class</label>
                <input
                  value={rejoinForm.class}
                  onChange={(e) => setRejoinForm((prev) => ({ ...prev, class: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Section</label>
                <input
                  value={rejoinForm.section}
                  onChange={(e) => setRejoinForm((prev) => ({ ...prev, section: e.target.value.toUpperCase() }))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Roll No</label>
                <input
                  value={rejoinForm.roll_no}
                  onChange={(e) => setRejoinForm((prev) => ({ ...prev, roll_no: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Academic Year</label>
                <input
                  value={rejoinForm.academic_year}
                  onChange={(e) => setRejoinForm((prev) => ({ ...prev, academic_year: e.target.value }))}
                  required
                  placeholder="2026-27"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRejoinModalOpen(false)
                    setStudentForStatusUpdate(null)
                  }}
                  disabled={statusActionLoading}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusActionLoading}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-500/90 disabled:opacity-50"
                >
                  {statusActionLoading ? 'Saving...' : 'Confirm Rejoin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      <EditStudent
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedStudent(null)
        }}
        onSuccess={() => {
          fetchStudents()
        }}
        studentData={selectedStudent}
      />
    </div>
  )
}

export default AllStudentDetails
