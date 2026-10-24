import React, { useState, useEffect, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import { getStudents } from '../../Api/students'
import { submitMarks, publishResults } from '../../Api/marks'

// Initial student dataset matching Canva blueprint screenshot
const INITIAL_STUDENTS = [
  { id: 1, roll: '1001', name: 'Aarav Patel', theory: 74, practical: 19, remarks: 'Fast learner, sharp in numericals' },
  { id: 2, roll: '1002', name: 'Diya Sharma', theory: 68, practical: 18, remarks: 'Steady progress' },
  { id: 3, roll: '1003', name: 'Kabir Verma', theory: 45, practical: 15, remarks: 'Needs extra practice in lab' },
  { id: 4, roll: '1004', name: 'Sam Smith', theory: 78, practical: 20, remarks: 'Class topper, outstanding' },
  { id: 5, roll: '1005', name: 'Ananya Gupta', theory: '', practical: '', remarks: 'Absent in practicals' },
  { id: 6, roll: '1006', name: 'Rohan Mehra', theory: 62, practical: 16, remarks: 'Good conceptual understanding' },
  { id: 7, roll: '1007', name: 'Pooja Singh', theory: 55, practical: 17, remarks: 'Active participation in viva' },
  { id: 8, roll: '1008', name: 'Aditya Kumar', theory: 40, practical: 14, remarks: 'Revise chapter 3 formulas' },
  { id: 9, roll: '1009', name: 'Sneha Reddy', theory: 70, practical: 19, remarks: 'Consistent performance' },
  { id: 10, roll: '1010', name: 'Manish Tiwari', theory: 50, practical: 15, remarks: 'Satisfactory' },
  { id: 11, roll: '1011', name: 'Ishaan Roy', theory: 75, practical: 18, remarks: 'Excellent exam presentation' },
  { id: 12, roll: '1012', name: 'Tanya Verma', theory: 58, practical: 16, remarks: 'Improving steadily' },
]

// Grade calculation helper based on standard scale
const calculateGrade = (total, max = 100) => {
  if (total === '' || total === null || total === undefined) return null
  const num = Number(total)
  if (isNaN(num)) return null
  const percentage = (num / max) * 100

  if (percentage >= 91) return { grade: 'A1', bg: 'bg-[#ede9fe]', text: 'text-[#6d28d9]' }
  if (percentage >= 81) return { grade: 'A2', bg: 'bg-[#dbeafe]', text: 'text-[#1d4ed8]' }
  if (percentage >= 71) return { grade: 'B1', bg: 'bg-[#cffafe]', text: 'text-[#0e7490]' }
  if (percentage >= 61) return { grade: 'B2', bg: 'bg-[#dcfce7]', text: 'text-[#15803d]' }
  if (percentage >= 51) return { grade: 'C1', bg: 'bg-[#fef3c7]', text: 'text-[#b45309]' }
  if (percentage >= 41) return { grade: 'C2', bg: 'bg-[#fef9c3]', text: 'text-[#854d0e]' }
  if (percentage >= 33) return { grade: 'D', bg: 'bg-[#ffedd5]', text: 'text-[#c2410c]' }
  return { grade: 'E', bg: 'bg-[#ffe4e6]', text: 'text-[#be123c]' }
}

function UploadMarks() {
  // Context dropdown selectors
  const [examType, setExamType] = useState('Term 1 Assessment (Half-Yearly)')
  const [selectedClass, setSelectedClass] = useState('Class 10')
  const [selectedSection, setSelectedSection] = useState('Section A')
  const [selectedSubject, setSelectedSubject] = useState('Physics (086) - Dr. Ramesh Mehta')

  // Maximum Marks configuration
  const [maxTheory, setMaxTheory] = useState(80)
  const [maxPractical, setMaxPractical] = useState(20)
  const [passingMarks, setPassingMarks] = useState(33)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')

  // Student marks state
  const [studentsData, setStudentsData] = useState(INITIAL_STUDENTS)
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [bulkAction, setBulkAction] = useState('')

  // Pagination (5 per page to match Canva screenshot)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Right column state
  const [teacherNotes, setTeacherNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [checklist, setChecklist] = useState({
    allEntered: false,
    notesReviewed: false,
    readyToPublish: false,
  })
  const [auditLogs, setAuditLogs] = useState([])
  const [isLocked, setIsLocked] = useState(false)
  const [saveDraftToast, setSaveDraftToast] = useState('')

  const fileInputRef = useRef(null)

  // Log action helper
  const addAuditLog = (action) => {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    setAuditLogs((prev) => [`${time} — ${action}`, ...prev.slice(0, 9)])
  }

  // Load drafted state if exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`sps_marks_draft_${selectedClass}_${selectedSection}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStudentsData(parsed)
        }
      }
    } catch {
      // Ignore fallback
    }
  }, [selectedClass, selectedSection])

  // Try fetching real students from backend if available
  useEffect(() => {
    let isMounted = true
    const fetchRealClassStudents = async () => {
      try {
        const cleanClass = selectedClass.replace('Class ', '').trim()
        const cleanSec = selectedSection.replace('Section ', '').trim()
        const res = await getStudents({ class: cleanClass, section: cleanSec, status: 'active' })
        const list = res?.students || res
        if (isMounted && Array.isArray(list) && list.length > 0) {
          const mapped = list.map((st, idx) => ({
            id: st.id || idx + 1,
            roll: st.roll_no || st.roll || String(1001 + idx),
            name: st.name || st.student_name || `Student ${idx + 1}`,
            theory: '',
            practical: '',
            remarks: '',
          }))
          setStudentsData(mapped)
          addAuditLog(`Loaded ${mapped.length} active students for ${selectedClass}-${selectedSection}`)
        }
      } catch {
        // Retain default demo set
      }
    }
    fetchRealClassStudents()
    return () => { isMounted = false }
  }, [selectedClass, selectedSection])

  // Mark update handler
  const handleMarkChange = (id, field, value) => {
    if (isLocked) return

    setStudentsData((prev) =>
      prev.map((student) => {
        if (student.id !== id) return student

        if (value === '') {
          return { ...student, [field]: '' }
        }

        const num = Number(value)
        if (isNaN(num)) return student

        // Bound to max marks
        const maxVal = field === 'theory' ? maxTheory : maxPractical
        const clamped = Math.max(0, Math.min(num, maxVal))

        return { ...student, [field]: clamped }
      })
    )
  }

  // Remarks update
  const handleRemarkChange = (id, value) => {
    if (isLocked) return
    setStudentsData((prev) =>
      prev.map((st) => (st.id === id ? { ...st, remarks: value } : st))
    )
  }

  // Save Draft
  const handleSaveDraft = () => {
    try {
      localStorage.setItem(`sps_marks_draft_${selectedClass}_${selectedSection}`, JSON.stringify(studentsData))
      setSaveDraftToast('Draft saved successfully to local workspace!')
      addAuditLog(`Saved draft for ${selectedClass} ${selectedSubject.split('-')[0]}`)
      setTimeout(() => setSaveDraftToast(''), 3500)
    } catch {
      setSaveDraftToast('Failed to save draft locally')
    }
  }

  // Publish & Lock
  const handlePublishAndLock = async () => {
    if (!checklist.readyToPublish) {
      if (!window.confirm('Checklist items are incomplete. Do you wish to override and publish now?')) {
        return
      }
    }

    try {
      setIsLocked(true)
      addAuditLog(`Published & locked assessment for ${selectedClass} ${selectedSection}`)
      setSaveDraftToast('Results successfully published and locked!')
      setTimeout(() => setSaveDraftToast(''), 4000)
    } catch (err) {
      console.error(err)
    }
  }

  // Bulk action handler
  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedStudentIds.length === 0) return

    setStudentsData((prev) =>
      prev.map((st) => {
        if (!selectedStudentIds.includes(st.id)) return st

        if (bulkAction === 'set_pass') {
          return {
            ...st,
            theory: Math.round(maxTheory * 0.5),
            practical: Math.round(maxPractical * 0.7),
          }
        }
        if (bulkAction === 'clear') {
          return { ...st, theory: '', practical: '', remarks: '' }
        }
        return st
      })
    )

    addAuditLog(`Applied "${bulkAction}" to ${selectedStudentIds.length} students`)
    setSelectedStudentIds([])
    setBulkAction('')
  }

  // Excel Import (.xlsx)
  const handleExcelImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)

        if (Array.isArray(data) && data.length > 0) {
          const imported = data.map((row, idx) => ({
            id: idx + 1,
            roll: String(row.RollNo || row['Roll No'] || row.roll || 1001 + idx),
            name: String(row.StudentName || row['Student Name'] || row.Name || `Student ${idx + 1}`),
            theory: row.Theory !== undefined ? Number(row.Theory) : '',
            practical: row.Practical !== undefined ? Number(row.Practical) : '',
            remarks: row.Remarks || '',
          }))

          setStudentsData(imported)
          addAuditLog(`Imported ${imported.length} rows via Excel (${file.name})`)
          setSaveDraftToast(`Imported ${imported.length} students from ${file.name}`)
          setTimeout(() => setSaveDraftToast(''), 3500)
        }
      } catch (err) {
        console.error(err)
        alert('Invalid Excel file structure. Please ensure columns: RollNo, StudentName, Theory, Practical')
      }
    }
    reader.readAsBinaryString(file)
  }

  // Excel Export (.xlsx)
  const handleExportSummary = () => {
    const exportRows = studentsData.map((st) => {
      const theory = Number(st.theory) || 0
      const practical = Number(st.practical) || 0
      const total = st.theory !== '' || st.practical !== '' ? theory + practical : ''
      const grade = calculateGrade(total, maxTheory + maxPractical)?.grade || 'N/A'

      return {
        'Roll No': st.roll,
        'Student Name': st.name,
        'Class': selectedClass,
        'Section': selectedSection,
        'Subject': selectedSubject,
        'Theory (80)': st.theory,
        'Practical (20)': st.practical,
        'Total (100)': total,
        'Grade': grade,
        'Remarks': st.remarks || '',
      }
    })

    const ws = XLSX.utils.json_to_sheet(exportRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Marks_Assessment')
    XLSX.writeFile(wb, `Marks_${selectedClass}_${selectedSection}_${Date.now()}.xlsx`)
    addAuditLog('Exported full assessment marks sheet to Excel')
  }

  // Teacher note addition
  const handleAddNote = () => {
    if (!newNote.trim()) return
    const noteObj = {
      id: Date.now(),
      text: newNote.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setTeacherNotes((prev) => [noteObj, ...prev])
    setNewNote('')
    addAuditLog('Added teacher assessment note')
  }

  // Filtered & Searched student list
  const filteredStudents = useMemo(() => {
    return studentsData.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(student.roll).includes(searchQuery)

      if (!matchesSearch) return false

      if (filterStatus === 'Pending') {
        return student.theory === '' || student.practical === ''
      }
      if (filterStatus === 'Completed') {
        return student.theory !== '' && student.practical !== ''
      }
      return true
    })
  }, [studentsData, searchQuery, filterStatus])

  // Pagination slice
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredStudents.slice(start, start + itemsPerPage)
  }, [filteredStudents, currentPage])

  // Analytics Computations for Right Column
  const analytics = useMemo(() => {
    const totalPossible = maxTheory + maxPractical
    const gradedStudents = studentsData.filter((s) => s.theory !== '' || s.practical !== '')
    const pendingCount = studentsData.filter((s) => s.theory === '' || s.practical === '').length

    if (gradedStudents.length === 0) {
      return {
        classAvg: 0,
        highestScore: '—',
        passPercentage: 0,
        gradeDist: { A1: 0, A2: 0, B1: 0, B2: 0, C: 0 },
        pendingCount,
      }
    }

    let sum = 0
    let highest = -1
    let highestStudent = ''
    let passedCount = 0

    const gradeDist = { A1: 0, A2: 0, B1: 0, B2: 0, C: 0 }

    gradedStudents.forEach((st) => {
      const total = (Number(st.theory) || 0) + (Number(st.practical) || 0)
      sum += total

      if (total > highest) {
        highest = total
        highestStudent = st.name
      }

      if (total >= passingMarks) {
        passedCount++
      }

      const gradeInfo = calculateGrade(total, totalPossible)
      if (gradeInfo?.grade === 'A1') gradeDist.A1++
      else if (gradeInfo?.grade === 'A2') gradeDist.A2++
      else if (gradeInfo?.grade === 'B1') gradeDist.B1++
      else if (gradeInfo?.grade === 'B2') gradeDist.B2++
      else gradeDist.C++
    })

    const classAvg = (sum / gradedStudents.length).toFixed(1)
    const passPercentage = ((passedCount / gradedStudents.length) * 100).toFixed(1)

    return {
      classAvg,
      highestScore: `${highest} / ${totalPossible} (${highestStudent})`,
      passPercentage,
      gradeDist,
      pendingCount,
    }
  }, [studentsData, maxTheory, maxPractical, passingMarks])

  // Pending students for right column
  const pendingStudents = useMemo(() => {
    return studentsData.filter((s) => s.theory === '' || s.practical === '').slice(0, 4)
  }, [studentsData])

  return (
    <div className="w-full space-y-6 pb-12 font-sans text-slate-800 antialiased">
      {/* Toast notification */}
      {saveDraftToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-[#0f1e36] px-4 py-3 text-xs font-bold text-white shadow-xl animate-fade-in">
          <span className="text-emerald-400">✓</span>
          <span>{saveDraftToast}</span>
        </div>
      )}

      {/* Hidden File Input for Excel Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleExcelImport}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* ================= 1. TOP HEADER & ACTION BUTTONS ================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            SPS / ACADEMICS / EXAMS
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f1e36] tracking-tight mt-0.5">
            Marks Entry & Assessment Sheet
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Input marks for term assessments, unit tests and CBSE grading.
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Local demo · not submitted to a board
          </p>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            title="Upload student marks Excel sheet"
          >
            <span className="material-symbols-outlined text-base text-slate-500">table_view</span>
            <span>Import Marks via Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            title="Save current marks state"
          >
            <span className="material-symbols-outlined text-base text-slate-500">bookmark</span>
            <span>Save Draft</span>
          </button>

          <button
            onClick={handlePublishAndLock}
            disabled={isLocked}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all ${
              isLocked
                ? 'bg-emerald-700 cursor-not-allowed opacity-90'
                : 'bg-[#0f1e36] hover:bg-[#162a4a] active:scale-[0.98]'
            }`}
          >
            <span className="material-symbols-outlined text-base text-amber-300">
              {isLocked ? 'lock' : 'lock_open'}
            </span>
            <span>{isLocked ? 'Results Published & Locked' : 'Publish & Lock Results'}</span>
          </button>
        </div>
      </div>

      {/* ================= 2. TOP METRIC CARDS (4 ROW) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ongoing Exams */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-shadow hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Ongoing Exams (Term 1)</span>
            <span className="material-symbols-outlined text-lg text-slate-400">calendar_month</span>
          </div>
          <p className="text-2xl font-black text-[#0f1e36] mt-2">Term 1</p>
          <a href="#exam-context" className="inline-block text-[11px] font-semibold text-blue-600 hover:underline mt-2">
            View exam context →
          </a>
        </div>

        {/* Card 2: Total Papers */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-shadow hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Papers</span>
            <span className="material-symbols-outlined text-lg text-slate-400">content_copy</span>
          </div>
          <p className="text-2xl font-black text-[#0f1e36] mt-2">34</p>
          <a href="#papers" className="inline-block text-[11px] font-semibold text-blue-600 hover:underline mt-2">
            View paper list →
          </a>
        </div>

        {/* Card 3: Marks Uploaded */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-shadow hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Marks Uploaded</span>
            <span className="material-symbols-outlined text-lg text-slate-400">upload_file</span>
          </div>
          <p className="text-2xl font-black text-[#0f1e36] mt-2">82%</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-[#183d7d] h-full rounded-full transition-all duration-500" style={{ width: '82%' }} />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-2">
            12 of 15 subjects · <span className="text-blue-600 hover:underline cursor-pointer">View progress →</span>
          </p>
        </div>

        {/* Card 4: Pending */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-shadow hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Pending</span>
            <span className="material-symbols-outlined text-lg text-slate-400">schedule</span>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{analytics.pendingCount}</p>
          <button
            onClick={() => setFilterStatus('Pending')}
            className="text-[11px] font-semibold text-blue-600 hover:underline mt-2 text-left"
          >
            Focus pending rows →
          </button>
        </div>
      </div>

      {/* ================= 3. EXAM CONTEXT CARD ================= */}
      <div id="exam-context" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-[#0f1e36] tracking-tight">Exam Context</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Exam Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Type</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none transition-colors"
            >
              <option value="Term 1 Assessment (Half-Yearly)">Term 1 Assessment (Half-Yearly)</option>
              <option value="Term 2 Assessment (Annual)">Term 2 Assessment (Annual)</option>
              <option value="Unit Test 1 (Periodic 1)">Unit Test 1 (Periodic 1)</option>
              <option value="Unit Test 2 (Periodic 2)">Unit Test 2 (Periodic 2)</option>
              <option value="Pre-Board Examination">Pre-Board Examination</option>
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none transition-colors"
            >
              <option value="Class 10">Class 10</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 4">Class 4</option>
              <option value="Class 3">Class 3</option>
              <option value="Class 2">Class 2</option>
              <option value="Class 1">Class 1</option>
              <option value="UKG">UKG</option>
              <option value="LKG">LKG</option>
              <option value="Nursery">Nursery</option>
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none transition-colors"
            >
              <option value="Section A">Section A</option>
              <option value="Section B">Section B</option>
              <option value="Section C">Section C</option>
              <option value="Section D">Section D</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none transition-colors"
            >
              <option value="Physics (086) - Dr. Ramesh Mehta">Physics (086) - Dr. Ramesh Mehta</option>
              <option value="Chemistry (043) - Mrs. Sunita Verma">Chemistry (043) - Mrs. Sunita Verma</option>
              <option value="Mathematics (041) - Mr. K.K. Sharma">Mathematics (041) - Mr. K.K. Sharma</option>
              <option value="English Core (301) - Ms. Priya Paul">English Core (301) - Ms. Priya Paul</option>
              <option value="Computer Science (083) - Mr. Amit Sen">Computer Science (083) - Mr. Amit Sen</option>
              <option value="Biology (044) - Dr. A. Mukherjee">Biology (044) - Dr. A. Mukherjee</option>
              <option value="Social Science (087) - Mr. Rajesh Roy">Social Science (087) - Mr. Rajesh Roy</option>
            </select>
          </div>
        </div>

        {/* Selected Context Summary & Max Marks Banner */}
        <div className="space-y-2 pt-1">
          <p className="text-xs text-slate-500 font-medium truncate">
            {examType} · {selectedClass} · {selectedSection} · {selectedSubject}
          </p>

          <div className="rounded-xl border border-blue-100 bg-[#f0f4fc] px-4 py-2.5 text-xs font-bold text-[#183d7d] flex flex-wrap items-center justify-between gap-2">
            <span>
              Theory Max: {maxTheory} | Practical Max: {maxPractical} | Total Max: {maxTheory + maxPractical}
            </span>
            <span className="text-[11px] font-semibold text-slate-600">
              Min. Passing Marks: {passingMarks} / {maxTheory + maxPractical}
            </span>
          </div>
        </div>
      </div>

      {/* ================= 4. MAIN CONTENT (2-COLUMN GRID) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT COLUMN: MARKS ENTRY DATA SHEET (8 Cols) ================= */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            
            {/* Table Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base font-bold text-[#0f1e36]">Marks Entry Data Sheet</h2>

              <button
                onClick={() => alert('Keyboard Navigation:\n• Tab: Next input cell\n• Shift+Tab: Previous cell\n• Enter: Next row\n• Numbers: Direct marks input')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-sm">keyboard</span>
                <span>Keyboard shortcuts</span>
              </button>
            </div>

            {/* Max Marks Configuration Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <span>Max Theory:</span>
                <input
                  type="number"
                  value={maxTheory}
                  onChange={(e) => setMaxTheory(Math.max(10, Number(e.target.value) || 0))}
                  className="w-16 h-8 text-center rounded-lg border border-slate-200 bg-white font-bold text-[#0f1e36] focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span>Max Practical:</span>
                <input
                  type="number"
                  value={maxPractical}
                  onChange={(e) => setMaxPractical(Math.max(0, Number(e.target.value) || 0))}
                  className="w-16 h-8 text-center rounded-lg border border-slate-200 bg-white font-bold text-[#0f1e36] focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span>Passing Marks:</span>
                <input
                  type="number"
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(Math.max(1, Number(e.target.value) || 0))}
                  className="w-16 h-8 text-center rounded-lg border border-slate-200 bg-white font-bold text-[#0f1e36] focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Demo Grading Scale Explanatory Caption */}
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Demo grading scale: A1 91–100, A2 81–90, B1 71–80, B2 61–70, C1 51–60, C2 41–50, D 33–40, E below 33. Local illustration, not official grading policy.
            </p>

            {/* Search & Filter Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="relative flex-1 max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-base text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by student name or roll number..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none"
                >
                  <option value="All">All</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>

                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                  {filteredStudents.length} results
                </span>
              </div>
            </div>

            {/* Bulk Action Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none"
              >
                <option value="">Bulk action...</option>
                <option value="set_pass">Set Default Pass Marks</option>
                <option value="clear">Clear Marks for Selected</option>
              </select>

              <button
                onClick={handleApplyBulkAction}
                disabled={selectedStudentIds.length === 0 || !bulkAction}
                className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply to selected
              </button>

              <span className="text-xs text-slate-400 ml-2">
                {selectedStudentIds.length} selected
              </span>
            </div>

            {/* Editable Spreadsheet Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          paginatedStudents.length > 0 &&
                          paginatedStudents.every((s) => selectedStudentIds.includes(s.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const ids = paginatedStudents.map((s) => s.id)
                            setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...ids])))
                          } else {
                            const ids = paginatedStudents.map((s) => s.id)
                            setSelectedStudentIds((prev) => prev.filter((id) => !ids.includes(id)))
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0"
                      />
                    </th>
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3 text-center">Theory Marks (Max: {maxTheory})</th>
                    <th className="p-3 text-center">Practical Marks (Max: {maxPractical})</th>
                    <th className="p-3 text-center">Total Calculated</th>
                    <th className="p-3 text-center">Grade Badge</th>
                    <th className="p-3">Remarks / Feedback</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map((student) => {
                    const theoryNum = student.theory !== '' ? Number(student.theory) : null
                    const practicalNum = student.practical !== '' ? Number(student.practical) : null
                    const hasMarks = theoryNum !== null || practicalNum !== null
                    const totalScore = hasMarks ? (theoryNum || 0) + (practicalNum || 0) : null
                    const gradeInfo = hasMarks ? calculateGrade(totalScore, maxTheory + maxPractical) : null
                    const isSelected = selectedStudentIds.includes(student.id)

                    return (
                      <tr
                        key={student.id}
                        className={`transition-colors hover:bg-slate-50/70 ${
                          isSelected ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds((prev) => [...prev, student.id])
                              } else {
                                setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id))
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0"
                          />
                        </td>

                        {/* Roll No */}
                        <td className="p-3 font-semibold text-slate-700 whitespace-nowrap">
                          {student.roll}
                        </td>

                        {/* Student Name */}
                        <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                          {student.name}
                        </td>

                        {/* Theory Marks Input */}
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={maxTheory}
                            disabled={isLocked}
                            value={student.theory}
                            placeholder="—"
                            onChange={(e) => handleMarkChange(student.id, 'theory', e.target.value)}
                            className="w-16 h-8 text-center rounded-lg border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-colors"
                          />
                        </td>

                        {/* Practical Marks Input */}
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={maxPractical}
                            disabled={isLocked}
                            value={student.practical}
                            placeholder="—"
                            onChange={(e) => handleMarkChange(student.id, 'practical', e.target.value)}
                            className="w-16 h-8 text-center rounded-lg border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-colors"
                          />
                        </td>

                        {/* Total Calculated */}
                        <td className="p-3 text-center font-bold text-slate-800 whitespace-nowrap">
                          {totalScore !== null ? `${totalScore} / ${maxTheory + maxPractical}` : '—'}
                        </td>

                        {/* Grade Badge */}
                        <td className="p-3 text-center whitespace-nowrap">
                          {gradeInfo ? (
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${gradeInfo.bg} ${gradeInfo.text}`}
                            >
                              {gradeInfo.grade}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>

                        {/* Remarks */}
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Add remarks..."
                            disabled={isLocked}
                            value={student.remarks || ''}
                            onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                            className="w-full min-w-[140px] rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent px-2 py-1 text-xs text-slate-700 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>
                      </tr>
                    )
                  })}

                  {paginatedStudents.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-400">
                        No students found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 text-xs text-slate-500">
              <p>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
              </p>

              <div className="flex items-center gap-1.5 self-center sm:self-auto">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      currentPage === page
                        ? 'bg-[#0f1e36] text-white shadow-2xs'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ================= RIGHT COLUMN: ANALYTICS & TOOLS (4 Cols) ================= */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card 1: Class Performance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#0f1e36]">Class Performance</h3>
              <p className="text-[11px] text-slate-400">Demo data · selected context</p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Class Average</p>
                <p className="text-xl font-black text-slate-900">{analytics.classAvg}%</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500">Highest Score</p>
                <p className="text-xs font-bold text-slate-900">{analytics.highestScore}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500">Pass Percentage</p>
                <p className="text-xl font-black text-emerald-600">{analytics.passPercentage}%</p>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Grade Distribution Bar Visuals */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Grade distribution</p>

              <div className="space-y-1.5 text-xs">
                {/* A1 */}
                <div className="flex items-center justify-between gap-2">
                  <span className="w-12 text-slate-500 font-medium">A1 ({analytics.gradeDist.A1})</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#183d7d] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, analytics.gradeDist.A1 * 8)}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-bold text-slate-700">{analytics.gradeDist.A1}</span>
                </div>

                {/* A2 */}
                <div className="flex items-center justify-between gap-2">
                  <span className="w-12 text-slate-500 font-medium">A2 ({analytics.gradeDist.A2})</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#2563eb] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, analytics.gradeDist.A2 * 8)}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-bold text-slate-700">{analytics.gradeDist.A2}</span>
                </div>

                {/* B1 */}
                <div className="flex items-center justify-between gap-2">
                  <span className="w-12 text-slate-500 font-medium">B1 ({analytics.gradeDist.B1})</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#0284c7] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, analytics.gradeDist.B1 * 8)}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-bold text-slate-700">{analytics.gradeDist.B1}</span>
                </div>

                {/* B2 */}
                <div className="flex items-center justify-between gap-2">
                  <span className="w-12 text-slate-500 font-medium">B2 ({analytics.gradeDist.B2})</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#16a34a] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, analytics.gradeDist.B2 * 8)}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-bold text-slate-700">{analytics.gradeDist.B2}</span>
                </div>

                {/* C */}
                <div className="flex items-center justify-between gap-2">
                  <span className="w-12 text-slate-500 font-medium">C ({analytics.gradeDist.C})</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#d97706] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, analytics.gradeDist.C * 8)}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-bold text-slate-700">{analytics.gradeDist.C}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => alert(`Full Analytics:\nTotal Evaluated: ${studentsData.length}\nClass Avg: ${analytics.classAvg}%\nPassing Rate: ${analytics.passPercentage}%`)}
                className="font-bold text-blue-600 hover:underline"
              >
                View full analytics
              </button>

              <button
                onClick={handleExportSummary}
                className="font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Export summary
              </button>
            </div>
          </div>

          {/* Card 2: Pending Submissions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <div>
              <h3 className="text-sm font-bold text-[#0f1e36]">Pending submissions</h3>
              <p className="text-[11px] text-slate-400">Students needing marks or review in this local sheet</p>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingStudents.map((st) => (
                <div key={st.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{st.name}</p>
                    <p className="text-[11px] text-amber-600 font-semibold">(Needs Review)</p>
                  </div>

                  <button
                    onClick={() => {
                      setSearchQuery(st.name)
                      setCurrentPage(1)
                    }}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    Review
                  </button>
                </div>
              ))}

              {pendingStudents.length === 0 && (
                <p className="py-4 text-xs text-emerald-600 font-bold text-center">
                  ✓ All student marks are completed!
                </p>
              )}
            </div>
          </div>

          {/* Card 3: Assessment Notes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <div>
              <h3 className="text-sm font-bold text-[#0f1e36]">Assessment notes</h3>
              <p className="text-[11px] text-slate-400">Notes for this selected class and subject only.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Teacher note</label>
              <textarea
                rows="3"
                placeholder="Add an assessment note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              Add note
            </button>

            {/* Notes List */}
            <div className="space-y-2 pt-1">
              {teacherNotes.map((note) => (
                <div key={note.id} className="rounded-lg bg-slate-50 p-2 text-xs border border-slate-100">
                  <p className="text-slate-800">{note.text}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{note.time}</span>
                </div>
              ))}

              {teacherNotes.length === 0 && (
                <p className="text-xs text-slate-400 italic">No assessment notes yet.</p>
              )}
            </div>
          </div>

          {/* Card 4: Submission Checklist */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-[#0f1e36]">Submission checklist</h3>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.allEntered}
                  onChange={(e) => setChecklist((prev) => ({ ...prev, allEntered: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-700 font-medium">All marks entered</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.notesReviewed}
                  onChange={(e) => setChecklist((prev) => ({ ...prev, notesReviewed: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-700 font-medium">Notes reviewed</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.readyToPublish}
                  onChange={(e) => setChecklist((prev) => ({ ...prev, readyToPublish: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-700 font-medium">Ready for publish</span>
              </label>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              Incomplete items trigger an explicit override warning.
            </p>
          </div>

          {/* Card 5: Audit Trail */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
            <div>
              <h3 className="text-sm font-bold text-[#0f1e36]">Audit trail</h3>
              <p className="text-[11px] text-slate-400">Events in this browser only · not server audit logs.</p>
            </div>

            <div className="space-y-1 pt-1 max-h-36 overflow-y-auto scrollbar-none text-xs text-slate-600">
              {auditLogs.map((log, idx) => (
                <p key={idx} className="text-[11px] text-slate-500 truncate">
                  • {log}
                </p>
              ))}

              {auditLogs.length === 0 && (
                <p className="text-xs text-slate-400 italic">No lock activity yet.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default UploadMarks
