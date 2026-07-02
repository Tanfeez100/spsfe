import React, { useState, useEffect } from 'react'
import { getMarks, publishResults } from '../../Api/marks'
import { getAllSubjects } from '../../Api/subjects'
import { getAllClasses } from '../../Api/classes'
import { normalizeSchoolClass, sortSchoolClasses } from '../../constants/schoolOptions'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ScatterChart, Scatter
} from 'recharts'

// Enhanced View Marks Component - Fully responsive and modern UI

function ViewMarks() {
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    terminal: ''
  })
  const [marksData, setMarksData] = useState(null)
  const [subjectsData, setSubjectsData] = useState(null)
  const [availableClasses, setAvailableClasses] = useState([])
  const [availableSections, setAvailableSections] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5) // Show 5 students per page
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [publishData, setPublishData] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const terminals = ['First', 'Second', 'Third', 'Annual']

  useEffect(() => {
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (filters.class) {
      loadSectionsForClass()
    } else {
      setAvailableSections([])
    }
  }, [filters.class])

  useEffect(() => {
    if (filters.class && filters.terminal) {
      fetchMarks()
      setCurrentPage(1) // Reset to first page when filters change
    } else {
      setMarksData(null)
      setSelectedStudent('')
      setCurrentPage(1)
    }
  }, [filters.class, filters.section, filters.terminal])

  // Auto-select first student (roll number 1) when marks data loads
  useEffect(() => {
    if (marksData?.students && marksData.students.length > 0 && !selectedStudent) {
      // Find student with roll number 1, or select first student
      const studentWithRoll1 = marksData.students.find(s => s.roll_no === '1' || s.roll_no === 1)
      if (studentWithRoll1) {
        setSelectedStudent(studentWithRoll1.student_id)
      } else if (marksData.students[0]) {
        setSelectedStudent(marksData.students[0].student_id)
      }
    }
  }, [marksData])

  const fetchSubjects = async () => {
    setLoadingSubjects(true)
    setError('')
    try {
      const [subjectsResponse, classesResponse] = await Promise.all([
        getAllSubjects(),
        getAllClasses()
      ])
      
      if (subjectsResponse.success) {
        setSubjectsData(subjectsResponse)
      }
      
      if (classesResponse && classesResponse.length > 0) {
        const sorted = sortSchoolClasses(classesResponse.map((item) => (
          typeof item === 'string'
            ? normalizeSchoolClass(item)
            : { ...item, class: normalizeSchoolClass(item.class) }
        )))
        setAvailableClasses(sorted)
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch classes')
    } finally {
      setLoadingSubjects(false)
    }
  }

  const loadSectionsForClass = () => {
    if (!subjectsData?.classes) return

    const selectedClassData = subjectsData.classes.find(cls => normalizeSchoolClass(cls.class) === filters.class)
    if (!selectedClassData) {
      setAvailableSections([])
      return
    }

    const sections = []
    if (selectedClassData.sections && selectedClassData.sections.length > 0) {
      selectedClassData.sections.forEach(sec => {
        sections.push(sec.section)
      })
    }
    setAvailableSections([...new Set(sections)].sort())
  }

  const fetchMarks = async () => {
    if (!filters.class || !filters.terminal) return

    setLoading(true)
    setError('')
    try {
      const response = await getMarks(filters.class, filters.section || undefined, filters.terminal)
      if (response.success) {
        setMarksData(response)
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch marks')
      setMarksData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  // Calculate statistics for charts
  const getChartData = () => {
    if (!marksData?.students) return { barData: [], pieData: [], subjectWiseData: [] }

    // Calculate pie chart data from all students (always show status distribution)
    const statusCounts = marksData.students.reduce((acc, student) => {
      student.marks.forEach(mark => {
        acc[mark.status] = (acc[mark.status] || 0) + 1
      })
      return acc
    }, {})

    const pieData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value
    }))

    // If student is selected, show subject-wise data for that student
    if (selectedStudent) {
      const student = marksData.students.find(s => s.student_id === selectedStudent)
      if (student && student.marks) {
        const subjectWiseData = student.marks.map(mark => ({
          name: mark.subject_name,
          subjectCode: mark.subject_code,
          external: mark.external_marks || 0,
          internal: mark.internal_marks || 0,
          total: (mark.external_marks || 0) + (mark.internal_marks || 0),
          status: mark.status
        }))
        return { barData: [], pieData, subjectWiseData }
      }
    }

    // Default: Average marks by student
    const barData = marksData.students.map(student => {
      const totalMarks = student.marks.reduce((sum, mark) => {
        return sum + (mark.external_marks || 0) + (mark.internal_marks || 0)
      }, 0)
      const averageMarks = student.marks.length > 0 ? (totalMarks / student.marks.length).toFixed(2) : 0
      
      return {
        name: student.name,
        rollNo: student.roll_no,
        totalMarks: parseFloat(averageMarks),
        externalMarks: student.marks.reduce((sum, m) => sum + (m.external_marks || 0), 0) / student.marks.length,
        internalMarks: student.marks.reduce((sum, m) => sum + (m.internal_marks || 0), 0) / student.marks.length
      }
    })

    return { barData, pieData, subjectWiseData: [] }
  }

  const { pieData, subjectWiseData } = getChartData()

  const COLORS = {
    LOCKED: '#ef4444',
    SUBMITTED: '#10b981',
    PENDING: '#f59e0b'
  }

  const getStatusColor = (status) => {
    return COLORS[status] || '#6b7280'
  }

  const getStatusBadge = (status) => {
    const color = getStatusColor(status)
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        style={{
          backgroundColor: `${color}20`,
          color: color
        }}
      >
        {status}
      </span>
    )
  }

  const handlePublishResults = async () => {
    if (!filters.class || !filters.terminal) {
      setError('Please select Class and Terminal to publish results')
      return
    }

    setPublishing(true)
    setError('')
    try {
      const response = await publishResults(filters.class, filters.section || undefined, filters.terminal)
      if (response.success) {
        setPublishData(response)
        setIsPublishModalOpen(true)
        // Refresh marks data after publishing
        fetchMarks()
      }
    } catch (err) {
      setError(err?.message || 'Failed to publish results')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-[#0d141b] dark:text-white">View Marks</h2>
        {marksData && marksData.students && marksData.students.length > 0 && (
          <button
            onClick={handlePublishResults}
            disabled={publishing || !filters.class || !filters.terminal}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg shadow-lg shadow-green-600/20 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">sync</span>
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">publish</span>
                <span>Publish Results</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Class */}
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Class <span className="text-red-500">*</span>
            </label>
            <div className="relative flex min-w-0 overflow-hidden items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/50 transition-all">
              <span className="material-symbols-outlined pl-3 text-slate-500 dark:text-slate-400 text-base">class</span>
              {loadingSubjects ? (
                <div className="min-w-0 w-full py-2.5 px-2 text-sm text-slate-500 dark:text-slate-400">Loading...</div>
              ) : (
                <select
                  value={filters.class}
                  onChange={(e) => handleFilterChange('class', e.target.value)}
                  className="min-w-0 w-full appearance-none bg-transparent border-none focus:ring-0 py-2.5 pl-2 pr-9 text-sm text-slate-900 dark:text-white"
                  required
                >
                  <option value="">Select Class</option>
                  {availableClasses.map((cls) => (
                    <option key={cls.class || cls} value={cls.class || cls}>Class {cls.class || cls}</option>
                  ))}
                </select>
              )}
              {!loadingSubjects ? (
                <span className="pointer-events-none absolute right-2 text-slate-700 dark:text-slate-300 material-symbols-outlined text-base">
                  expand_more
                </span>
              ) : null}
            </div>
          </div>

          {/* Section */}
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Section
            </label>
            <div className="relative flex min-w-0 overflow-hidden items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/50 transition-all">
              <span className="material-symbols-outlined pl-3 text-slate-500 dark:text-slate-400 text-base">category</span>
              <select
                value={filters.section}
                onChange={(e) => handleFilterChange('section', e.target.value)}
                className="min-w-0 w-full appearance-none bg-transparent border-none focus:ring-0 py-2.5 pl-2 pr-9 text-sm text-slate-900 dark:text-white"
                disabled={!filters.class}
              >
                <option value="">All Sections</option>
                {availableSections.map((section) => (
                  <option key={section} value={section}>Section {section}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 text-slate-700 dark:text-slate-300 material-symbols-outlined text-base">
                expand_more
              </span>
            </div>
          </div>

          {/* Terminal */}
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Terminal <span className="text-red-500">*</span>
            </label>
            <div className="relative flex min-w-0 overflow-hidden items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/50 transition-all">
              <span className="material-symbols-outlined pl-3 text-slate-500 dark:text-slate-400 text-base">calendar_today</span>
              <select
                value={filters.terminal}
                onChange={(e) => handleFilterChange('terminal', e.target.value)}
                className="min-w-0 w-full appearance-none bg-transparent border-none focus:ring-0 py-2.5 pl-2 pr-9 text-sm text-slate-900 dark:text-white"
                required
              >
                <option value="">Select Terminal</option>
                {terminals.map((terminal) => (
                  <option key={terminal} value={terminal}>{terminal}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 text-slate-700 dark:text-slate-300 material-symbols-outlined text-base">
                expand_more
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-4xl text-cyan-200">sync</span>
        </div>
      )}

      {/* Charts and Table */}
      {!loading && marksData && marksData.students && marksData.students.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Students</span>
                <div className="w-10 h-10 rounded-lg bg-cyan-300/15 flex items-center justify-center border border-cyan-400/30">
                  <span className="material-symbols-outlined text-cyan-200 text-lg">people</span>
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{marksData.count || marksData.students.length}</p>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Locked Marks</span>
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-500 text-lg">lock</span>
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {marksData.students.reduce((count, s) => 
                  count + s.marks.filter(m => m.status === 'LOCKED').length, 0
                )}
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Submitted Marks</span>
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {marksData.students.reduce((count, s) => 
                  count + s.marks.filter(m => m.status === 'SUBMITTED').length, 0
                )}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar Chart - Subject-wise Marks */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Subject-wise Marks
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  {/* Student Dropdown - Small, inside card on right */}
                  <div className="relative flex min-w-0 overflow-hidden items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/50 transition-all w-full sm:w-48">
                    <span className="material-symbols-outlined pl-2 text-slate-500 dark:text-slate-400 text-sm">person</span>
                    <select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      className="min-w-0 w-full appearance-none bg-transparent border-none focus:ring-0 py-1.5 pl-2 pr-8 text-xs text-slate-900 dark:text-white"
                    >
                      {marksData.students.map((student) => (
                        <option key={student.student_id} value={student.student_id}>
                          {student.name} (Roll: {student.roll_no})
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2 text-slate-700 dark:text-slate-300 material-symbols-outlined text-sm">
                      expand_more
                    </span>
                  </div>

                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                {selectedStudent && subjectWiseData.length > 0 ? (
                  <BarChart data={subjectWiseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={0} 
                      textAnchor="middle" 
                      height={60}
                      tick={{ fontSize: 11 }}
                      interval={0}
                      tickFormatter={(value) => String(value ?? '').slice(0, 3)}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(7, 20, 36, 0.96)',
                        border: '1px solid rgba(64, 212, 255, 0.25)',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      itemStyle={{ color: '#ffffff' }}
                      wrapperStyle={{ background: 'transparent' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="external" fill="#06b6d4" name="External Marks" cursor="pointer" />
                    <Bar dataKey="internal" fill="#10b981" name="Internal Marks" cursor="pointer" />
                  </BarChart>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading student data...</p>
                  </div>
                )}
              </ResponsiveContainer>
            </div>

            {/* Pie Chart - Status Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Marks Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(7, 20, 36, 0.96)',
                      border: '1px solid rgba(64, 212, 255, 0.25)',
                      borderRadius: '12px',
                      padding: '8px 12px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#ffffff' }}
                    wrapperStyle={{ background: 'transparent' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>


          {/* Students Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Students Marks Details
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Class {marksData.class} {marksData.section && `• Section ${marksData.section}`} • Terminal {marksData.terminal}
                  </p>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Total: {marksData.students.length} students
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300">Roll No</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300">Student Name</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300">Subject</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-slate-700 dark:text-slate-300">External</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-slate-700 dark:text-slate-300">Internal</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-slate-700 dark:text-slate-300">Total</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-slate-700 dark:text-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {marksData.students
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((student) => (
                    <React.Fragment key={student.student_id}>
                      {student.marks.map((mark, markIndex) => (
                        <tr
                          key={`${student.student_id}-${mark.subject_id}`}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          {markIndex === 0 && (
                            <>
                              <td
                                rowSpan={student.marks.length}
                                className="px-2 py-2 text-xs font-bold text-slate-900 dark:text-white align-top"
                              >
                                {student.roll_no}
                              </td>
                              <td
                                rowSpan={student.marks.length}
                                className="px-2 py-2 text-xs font-bold text-slate-900 dark:text-white align-top"
                              >
                                {student.name}
                              </td>
                            </>
                          )}
                          <td className="px-2 py-2 text-xs text-slate-700 dark:text-slate-300">
                            <div>
                              <span className="font-medium">{mark.subject_name}</span>
                              {mark.subject_code && (
                                <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                                  ({mark.subject_code})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-xs text-center text-slate-700 dark:text-slate-300">
                            {mark.external_marks || 0}
                          </td>
                          <td className="px-2 py-2 text-xs text-center text-slate-700 dark:text-slate-300">
                            {mark.internal_marks || 0}
                          </td>
                          <td className="px-2 py-2 text-xs text-center font-bold text-slate-900 dark:text-white">
                            {(mark.external_marks || 0) + (mark.internal_marks || 0)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {getStatusBadge(mark.status)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {marksData.students.length > itemsPerPage && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, marksData.students.length)} of {marksData.students.length} students
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(marksData.students.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                            : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-cyan-200/30 dark:border-cyan-700/50 hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(marksData.students.length / itemsPerPage), prev + 1))}
                    disabled={currentPage >= Math.ceil(marksData.students.length / itemsPerPage)}
                    className="px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* No Data */}
      {!loading && filters.class && filters.terminal && (!marksData || !marksData.students || marksData.students.length === 0) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-5xl text-slate-400 mb-3">assessment</span>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No marks found for the selected filters</p>
        </div>
      )}

      {/* Publish Results Modal */}
      {isPublishModalOpen && publishData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
          {/* Blurred Background */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsPublishModalOpen(false)}
          ></div>

          {/* Modal */}
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
                <div>
                  <h2 className="text-xl font-black">Results Published Successfully</h2>
                  <p className="text-sm text-white/80">Class {publishData.class} {publishData.section && `• Section ${publishData.section}`} • Terminal {publishData.terminal}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Success Message */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    {publishData.message}
                  </p>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Students</span>
                    <div className="w-8 h-8 rounded-lg bg-cyan-300/15 flex items-center justify-center border border-cyan-400/30">
                      <span className="material-symbols-outlined text-cyan-200 text-sm">people</span>
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{publishData.total_students || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Published</span>
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-500 text-sm">publish</span>
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{publishData.published || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Success Rate</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-500 text-sm">trending_up</span>
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {publishData.total_students > 0 
                      ? ((publishData.published / publishData.total_students) * 100).toFixed(0) 
                      : 0}%
                  </p>
                </div>
              </div>

              {/* Results Table */}
              {publishData.results && publishData.results.length > 0 && (
                <div className="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Published Results</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300">Roll No</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300">Student Name</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-slate-700 dark:text-slate-300">Total Obtained</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-slate-700 dark:text-slate-300">Percentage</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-slate-700 dark:text-slate-300">Division</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {publishData.results.map((result) => (
                          <tr
                            key={result.student_id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <td className="px-3 py-2 text-xs font-bold text-slate-900 dark:text-white">
                              {result.roll_no}
                            </td>
                            <td className="px-3 py-2 text-xs font-medium text-slate-900 dark:text-white">
                              {result.name}
                            </td>
                            <td className="px-3 py-2 text-xs text-center text-slate-700 dark:text-slate-300">
                              {result.total_obtained}
                            </td>
                            <td className="px-3 py-2 text-xs text-center font-bold text-slate-900 dark:text-white">
                              {result.percentage}%
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: result.division === 'First' ? '#10b98120' : result.division === 'Second' ? '#f59e0b20' : '#ef444420',
                                  color: result.division === 'First' ? '#10b981' : result.division === 'Second' ? '#f59e0b' : '#ef4444'
                                }}
                              >
                                {result.division}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewMarks

