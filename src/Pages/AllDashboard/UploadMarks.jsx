import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { getStudents } from '../../Api/students'
import { submitMarks, getMarks, publishResults } from '../../Api/marks'
import { getSubjectsForClass } from '../../Api/subjects'
import { FORMATTED_CLASS_OPTIONS, SECTION_OPTIONS } from '../../constants/schoolOptions'
import { getUser } from '../../Api/auth'

// Grade calculation helper based on standard scale
const calculateGrade = (total, max = 100) => {
  if (total === '' || total === null || total === undefined) return null
  const num = Number(total)
  if (isNaN(num)) return null
  const percentage = (num / (max || 100)) * 100

  if (percentage >= 91) return { grade: 'A1', bg: 'bg-[#ede9fe]', text: 'text-[#6d28d9]' }
  if (percentage >= 81) return { grade: 'A2', bg: 'bg-[#dbeafe]', text: 'text-[#1d4ed8]' }
  if (percentage >= 71) return { grade: 'B1', bg: 'bg-[#cffafe]', text: 'text-[#0e7490]' }
  if (percentage >= 61) return { grade: 'B2', bg: 'bg-[#dcfce7]', text: 'text-[#15803d]' }
  if (percentage >= 51) return { grade: 'C1', bg: 'bg-[#fef3c7]', text: 'text-[#b45309]' }
  if (percentage >= 41) return { grade: 'C2', bg: 'bg-[#fef9c3]', text: 'text-[#854d0e]' }
  if (percentage >= 33) return { grade: 'D', bg: 'bg-[#ffedd5]', text: 'text-[#c2410c]' }
  return { grade: 'E', bg: 'bg-[#ffe4e6]', text: 'text-[#be123c]' }
}

export default function UploadMarks() {
  const currentUser = getUser()
  const isTeacher = currentUser?.role === 'teacher'
  const initialClass = currentUser?.assignedClass
    ? (String(currentUser.assignedClass).startsWith('Class') || ['Nursery', 'LKG', 'UKG'].includes(currentUser.assignedClass)
        ? currentUser.assignedClass
        : `Class ${currentUser.assignedClass}`)
    : 'Class 1'
  const initialSection = currentUser?.assignedSection
    ? (String(currentUser.assignedSection).startsWith('Section') ? currentUser.assignedSection : `Section ${currentUser.assignedSection}`)
    : 'Section A'

  // Context Dropdown Selectors
  const [examType, setExamType] = useState('First')
  const [selectedClass, setSelectedClass] = useState(initialClass)
  const [selectedSection, setSelectedSection] = useState(initialSection)

  // Students in selected class & section
  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Subjects for the selected class (dynamic based on class)
  const [subjectsList, setSubjectsList] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  // Marks data for the currently selected student: array of subject rows
  // { id, name, code, maxTheory, maxPractical, theory, practical, remarks }
  const [studentMarksRows, setStudentMarksRows] = useState([])

  // Class-wide existing marks map: { [student_id]: { [subject_name/code]: { theory, practical, remarks, status } } }
  const [classMarksMap, setClassMarksMap] = useState({})

  // View Mode: 'entry' (Single Student Entry) | 'view_all' (View Student Marks / Full Class Sheet)
  const [activeTab, setActiveTab] = useState('entry')
  const [viewSearchTerm, setViewSearchTerm] = useState('')
  const [viewStatusFilter, setViewStatusFilter] = useState('all') // 'all' | 'graded' | 'pending'
  const [isPublishing, setIsPublishing] = useState(false)
  const [isClassPublished, setIsClassPublished] = useState(false)

  // UI state
  const [saveDraftToast, setSaveDraftToast] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [auditLogs, setAuditLogs] = useState([])
  const [isLocked, setIsLocked] = useState(false)
  const fileInputRef = useRef(null)

  // Helper: Log actions
  const addAuditLog = (action) => {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    setAuditLogs((prev) => [`${time} — ${action}`, ...prev.slice(0, 9)])
  }

  // 1️⃣ Fetch Active Students when Class or Section changes
  useEffect(() => {
    let isMounted = true
    const fetchClassStudents = async () => {
      setLoadingStudents(true)
      try {
        const cleanClass = selectedClass.replace('Class ', '').trim()
        const cleanSec = selectedSection.replace('Section ', '').trim()
        const res = await getStudents({ class: cleanClass, section: cleanSec, status: 'active' })
        const list = res?.students || (Array.isArray(res) ? res : [])

        if (isMounted) {
          if (Array.isArray(list) && list.length > 0) {
            // Sort by roll number ascending
            const sorted = [...list].sort((a, b) => Number(a.roll_no || a.roll || 0) - Number(b.roll_no || b.roll || 0))
            setStudents(sorted)
            setSelectedStudentId((prev) => {
              const stillExists = sorted.some((s) => String(s.id) === String(prev))
              return stillExists ? prev : String(sorted[0].id)
            })
            addAuditLog(`Loaded ${sorted.length} students for ${selectedClass}-${selectedSection}`)
          } else {
            setStudents([])
            setSelectedStudentId('')
          }
        }
      } catch {
        if (isMounted) {
          setStudents([])
          setSelectedStudentId('')
        }
      } finally {
        if (isMounted) setLoadingStudents(false)
      }
    }

    fetchClassStudents()
    return () => { isMounted = false }
  }, [selectedClass, selectedSection])

  // 2️⃣ Fetch Class Subjects whenever Class or Section changes
  useEffect(() => {
    let isMounted = true
    const fetchSubjects = async () => {
      setLoadingSubjects(true)
      const cleanClass = selectedClass.replace('Class ', '').trim()
      const cleanSec = selectedSection.replace('Section ', '').trim()

      try {
        const res = await getSubjectsForClass(cleanClass, cleanSec)
        let rawSubjects = []

        if (res?.success && Array.isArray(res.subjects) && res.subjects.length > 0) {
          rawSubjects = res.subjects.map((item, idx) => {
            const sub = item.subject || item
            return {
              id: sub.id || `sub-${idx}`,
              name: sub.name,
              code: sub.code || `SUB${idx + 1}`,
              maxTheory: Number(sub.max_external_marks) || 80,
              maxPractical: Number(sub.max_internal_marks) || 20,
            }
          })
        }

        // Fallback to class-level without section if empty
        if (rawSubjects.length === 0) {
          const fallbackRes = await getSubjectsForClass(cleanClass, '')
          if (fallbackRes?.success && Array.isArray(fallbackRes.subjects) && fallbackRes.subjects.length > 0) {
            rawSubjects = fallbackRes.subjects.map((item, idx) => {
              const sub = item.subject || item
              return {
                id: sub.id || `sub-${idx}`,
                name: sub.name,
                code: sub.code || `SUB${idx + 1}`,
                maxTheory: Number(sub.max_external_marks) || 80,
                maxPractical: Number(sub.max_internal_marks) || 20,
              }
            })
          }
        }

        if (isMounted) {
          setSubjectsList(rawSubjects)
          if (rawSubjects.length > 0) {
            addAuditLog(`Configured ${rawSubjects.length} subjects for ${selectedClass}`)
          }
        }
      } catch {
        if (isMounted) {
          setSubjectsList([])
        }
      } finally {
        if (isMounted) setLoadingSubjects(false)
      }
    }

    fetchSubjects()
    return () => { isMounted = false }
  }, [selectedClass, selectedSection])

  // 3️⃣ Fetch existing marks from server for this class & terminal
  const loadClassMarks = useCallback(async () => {
    try {
      const cleanClass = selectedClass.replace('Class ', '').trim()
      const cleanSec = selectedSection.replace('Section ', '').trim()
      const res = await getMarks(cleanClass, cleanSec, examType)

      if (res?.students && Array.isArray(res.students)) {
        const map = {}
        let anyPublished = false
        res.students.forEach((st) => {
          const stId = String(st.student_id || st.id)
          map[stId] = {}
          if (Array.isArray(st.marks)) {
            st.marks.forEach((m) => {
              const hasActualMarks = (m.external_marks !== null && m.external_marks !== undefined && m.external_marks !== '') ||
                                     (m.internal_marks !== null && m.internal_marks !== undefined && m.internal_marks !== '')
              const markObj = {
                theory: m.external_marks !== null && m.external_marks !== undefined ? m.external_marks : '',
                practical: m.internal_marks !== null && m.internal_marks !== undefined ? m.internal_marks : '',
                remarks: m.remarks || '',
                status: m.status || 'PENDING',
                hasMarks: hasActualMarks,
              }
              // Index by subject_id, subject_name, subject_code
              if (m.subject_id) map[stId][String(m.subject_id)] = markObj
              if (m.subject_name) map[stId][String(m.subject_name).toLowerCase().trim()] = markObj
              if (m.subject_code) map[stId][String(m.subject_code).toLowerCase().trim()] = markObj

              if (hasActualMarks && String(m.status || '').toUpperCase() === 'PUBLISHED') {
                anyPublished = true
              }
            })
          }
        })
        setClassMarksMap(map)
        setIsClassPublished(anyPublished)
      } else {
        setClassMarksMap({})
        setIsClassPublished(false)
      }
    } catch {
      // non-blocking
    }
  }, [selectedClass, selectedSection, examType])

  useEffect(() => {
    loadClassMarks()
  }, [loadClassMarks])

  // 4️⃣ Synchronize Student's Subject Rows when selected student or subjectsList change
  useEffect(() => {
    if (subjectsList.length === 0 || !selectedStudentId) return

    // Check localStorage draft first
    const draftKey = `sps_student_marks_${selectedClass}_${selectedSection}_${examType}_${selectedStudentId}`
    let savedDraft = null
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) savedDraft = JSON.parse(raw)
    } catch {
      // ignore
    }

    // Check server marks map
    const serverStudentMarks = classMarksMap[selectedStudentId] || {}

    // Initialize rows
    const rows = subjectsList.map((sub, idx) => {
      const subKey = String(sub.name || sub.code || '').toLowerCase()
      const draftRow = savedDraft ? savedDraft.find((d) => String(d.name).toLowerCase() === subKey) : null
      const serverMark = serverStudentMarks[sub.id] ||
                         serverStudentMarks[String(sub.name || '').toLowerCase().trim()] ||
                         serverStudentMarks[String(sub.code || '').toLowerCase().trim()]

      let theory = ''
      let practical = ''
      let remarks = ''

      if (draftRow) {
        theory = draftRow.theory !== undefined ? draftRow.theory : ''
        practical = draftRow.practical !== undefined ? draftRow.practical : ''
        remarks = draftRow.remarks || ''
      } else if (serverMark) {
        theory = serverMark.theory !== undefined ? serverMark.theory : ''
        practical = serverMark.practical !== undefined ? serverMark.practical : ''
        remarks = serverMark.remarks || ''
      }

      return {
        id: sub.id || `row-${idx}`,
        name: sub.name,
        code: sub.code || `SUB${idx + 1}`,
        maxTheory: sub.maxTheory || 80,
        maxPractical: sub.maxPractical || 20,
        theory,
        practical,
        remarks,
      }
    })

    setStudentMarksRows(rows)
  }, [selectedStudentId, subjectsList, selectedClass, selectedSection, examType, classMarksMap])

  // Currently selected student object
  const currentStudent = useMemo(() => {
    return students.find((s) => String(s.id) === String(selectedStudentId)) || students[0] || null
  }, [students, selectedStudentId])

  // Student Index for Stepper
  const currentStudentIndex = useMemo(() => {
    return students.findIndex((s) => String(s.id) === String(selectedStudentId))
  }, [students, selectedStudentId])

  // Previous & Next Navigation Handlers
  const handlePrevStudent = () => {
    if (currentStudentIndex > 0) {
      setSelectedStudentId(String(students[currentStudentIndex - 1].id))
    }
  }

  const handleNextStudent = () => {
    if (currentStudentIndex < students.length - 1) {
      setSelectedStudentId(String(students[currentStudentIndex + 1].id))
    }
  }

  // Handle Mark Change for a Specific Subject Row
  const handleSubjectMarkChange = (subjectId, field, value) => {
    setStudentMarksRows((prev) =>
      prev.map((row) => {
        if (row.id !== subjectId) return row

        if (value === '') {
          return { ...row, [field]: '' }
        }

        const num = Number(value)
        if (isNaN(num)) return row

        const maxBound = field === 'theory' ? row.maxTheory : row.maxPractical
        const clamped = Math.max(0, Math.min(num, maxBound))

        return { ...row, [field]: clamped }
      })
    )
  }

  // Handle Remark Change for a Specific Subject Row
  const handleSubjectRemarkChange = (subjectId, value) => {
    setStudentMarksRows((prev) =>
      prev.map((row) => (row.id === subjectId ? { ...row, remarks: value } : row))
    )
  }

  // Save Draft to LocalStorage for this Student
  const handleSaveStudentDraft = () => {
    if (!selectedStudentId) return
    try {
      const draftKey = `sps_student_marks_${selectedClass}_${selectedSection}_${examType}_${selectedStudentId}`
      localStorage.setItem(draftKey, JSON.stringify(studentMarksRows))
      setSaveDraftToast(`Draft saved for ${currentStudent?.name || 'student'}!`)
      addAuditLog(`Draft saved for Roll ${currentStudent?.roll_no || currentStudent?.roll} (${currentStudent?.name})`)
      setTimeout(() => setSaveDraftToast(''), 3500)
    } catch {
      setSaveDraftToast('Failed to save draft locally')
    }
  }

  // Save & Submit Marks for the Current Student (One-Go Submission)
  const handleSubmitStudentMarks = async (andGoToNext = false) => {
    if (!currentStudent) {
      alert('Please select a student first.')
      return
    }

    setIsSubmitting(true)
    try {
      const cleanClass = selectedClass.replace('Class ', '').trim()
      const cleanSec = selectedSection.replace('Section ', '').trim()
      const rollNo = Number(currentStudent.roll_no || currentStudent.roll || 1)

      const marksPayload = studentMarksRows.map((r) => ({
        subject_name: r.name,
        subject_code: r.code,
        external_marks: r.theory !== '' ? Number(r.theory) : 0,
        internal_marks: r.practical !== '' ? Number(r.practical) : 0,
        remarks: r.remarks || '',
      }))

      await submitMarks({
        class: cleanClass,
        section: cleanSec,
        roll_no: rollNo,
        terminal: examType,
        academic_year: '2026-27',
        marks: marksPayload,
      })

      // Update class marks map in memory
      setClassMarksMap((prev) => {
        const updated = { ...prev }
        if (!updated[selectedStudentId]) updated[selectedStudentId] = {}
        marksPayload.forEach((m) => {
          const key = String(m.subject_name).toLowerCase()
          updated[selectedStudentId][key] = {
            theory: m.external_marks,
            practical: m.internal_marks,
            remarks: m.remarks,
          }
        })
        return updated
      })

      // Clear draft since it is now saved to DB
      const draftKey = `sps_student_marks_${selectedClass}_${selectedSection}_${examType}_${selectedStudentId}`
      localStorage.removeItem(draftKey)

      // Instantly refresh full class marks from server so View Marks Details updates immediately
      await loadClassMarks()

      setSaveDraftToast(`✓ Marks successfully saved for ${currentStudent.name} (Roll ${rollNo})!`)
      addAuditLog(`Saved marks for ${currentStudent.name} (Roll ${rollNo}) - ${marksPayload.length} subjects`)
      setTimeout(() => setSaveDraftToast(''), 4000)

      // Advance to next student if requested
      if (andGoToNext && currentStudentIndex < students.length - 1) {
        setTimeout(() => {
          setSelectedStudentId(String(students[currentStudentIndex + 1].id))
        }, 500)
      }
    } catch (err) {
      console.error(err)
      setSaveDraftToast(`Failed to submit: ${err?.message || 'Server error'}`)
      setTimeout(() => setSaveDraftToast(''), 4000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Real-time calculation summary for currently selected student
  const studentSummary = useMemo(() => {
    let totalMax = 0
    let totalObtained = 0
    let hasAnyMarks = false
    let allEntered = true

    studentMarksRows.forEach((r) => {
      const subMax = (r.maxTheory || 80) + (r.maxPractical || 20)
      totalMax += subMax

      const th = r.theory !== '' ? Number(r.theory) : null
      const pr = r.practical !== '' ? Number(r.practical) : null

      if (th !== null || pr !== null) {
        hasAnyMarks = true
        totalObtained += (th || 0) + (pr || 0)
      } else {
        allEntered = false
      }
    })

    const percentage = totalMax > 0 && hasAnyMarks ? ((totalObtained / totalMax) * 100).toFixed(1) : 0
    const gradeInfo = hasAnyMarks ? calculateGrade(totalObtained, totalMax) : null

    return {
      totalSubjects: studentMarksRows.length,
      totalMax,
      totalObtained: hasAnyMarks ? totalObtained : 0,
      percentage: hasAnyMarks ? percentage : '0.0',
      gradeInfo,
      allEntered,
      hasAnyMarks,
    }
  }, [studentMarksRows])

  // Detailed summary of all students with their subject-wise marks for "View Student Marks"
  const allStudentsOverview = useMemo(() => {
    return students.map((st) => {
      const stId = String(st.id)
      const stMarks = classMarksMap[stId] || {}
      let totalObtained = 0
      let totalMax = 0
      let enteredSubjectCount = 0

      const subjectBreakdown = subjectsList.map((sub) => {
        // Multi-lookup by subject ID, lowercase name, or lowercase code
        const mark = stMarks[sub.id] ||
                     stMarks[String(sub.name || '').toLowerCase().trim()] ||
                     stMarks[String(sub.code || '').toLowerCase().trim()]

        const theory = mark && mark.theory !== '' && mark.theory !== null && mark.theory !== undefined ? Number(mark.theory) : null
        const practical = mark && mark.practical !== '' && mark.practical !== null && mark.practical !== undefined ? Number(mark.practical) : null
        const hasAny = theory !== null || practical !== null
        if (hasAny) enteredSubjectCount += 1

        const maxT = sub.maxTheory || 80
        const maxP = sub.maxPractical || 20
        totalMax += (maxT + maxP)

        const obtained = hasAny ? (theory || 0) + (practical || 0) : null
        if (obtained !== null) totalObtained += obtained

        return {
          id: sub.id,
          name: sub.name,
          code: sub.code,
          theory,
          practical,
          obtained,
          maxTotal: maxT + maxP,
          hasMarks: hasAny,
        }
      })

      const isComplete = subjectsList.length > 0 && enteredSubjectCount === subjectsList.length
      const percentage = totalMax > 0 && enteredSubjectCount > 0
        ? ((totalObtained / totalMax) * 100).toFixed(1)
        : null
      const gradeInfo = percentage !== null ? calculateGrade(totalObtained, totalMax) : null

      return {
        id: st.id,
        roll: st.roll_no || st.roll || '—',
        name: st.name,
        father: st.father_name || st.father || '—',
        subjectBreakdown,
        totalObtained,
        totalMax,
        percentage,
        gradeInfo,
        enteredSubjectCount,
        isComplete,
        hasAnyMarks: enteredSubjectCount > 0,
      }
    })
  }, [students, classMarksMap, subjectsList])

  // Count how many students in the class actually have marks submitted
  const classProgress = useMemo(() => {
    if (!students.length) return { graded: 0, total: 0, percent: 0 }
    let graded = 0
    allStudentsOverview.forEach((st) => {
      if (st.hasAnyMarks) {
        graded++
      }
    })
    const percent = Math.round((graded / students.length) * 100)
    return { graded, total: students.length, percent }
  }, [students, allStudentsOverview])

  // Publish Results for this class & terminal
  const handlePublishResults = async () => {
    if (students.length === 0) {
      alert('No students found in this class to publish results.')
      return
    }

    const cleanClass = selectedClass.replace('Class ', '').trim()

    const confirmMsg = `Are you sure you want to PUBLISH ${examType} results for ${selectedClass} (All Sections)?\n\nResult publishing is class-wide and section-independent. This will compute official percentages, generate student rankings, and make report cards live for all students of ${selectedClass}.`

    if (!window.confirm(confirmMsg)) {
      return
    }

    setIsPublishing(true)
    try {
      const res = await publishResults(cleanClass, undefined, examType)
      if (res?.success) {
        setIsClassPublished(true)
        setSaveDraftToast(`✓ ${res.message || 'Results published successfully for the class!'}`)
        addAuditLog(`Published ${examType} results for ${selectedClass}`)
        await loadClassMarks()
      } else {
        alert(res?.message || 'Failed to publish results')
      }
    } catch (err) {
      const issues = err?.data?.issues
      let errMsg = err?.data?.message || err?.message || 'Failed to publish results'
      if (Array.isArray(issues) && issues.length > 0) {
        errMsg += `\n\nPending students (${issues.length}):\n` + issues.slice(0, 5).map((i) => `• Roll ${i.roll_no}: ${i.name} (Missing subjects: ${i.missing_subjects?.join(', ') || i.not_submitted_subjects?.join(', ') || 'Marks pending'})`).join('\n')
        if (issues.length > 5) errMsg += `\n...and ${issues.length - 5} more.`
      }
      alert(`Publication Notice:\n${errMsg}`)
    } finally {
      setIsPublishing(false)
    }
  }

  // Filtered list for "View Student Marks" tab
  const filteredStudentsOverview = useMemo(() => {
    return allStudentsOverview.filter((st) => {
      if (viewStatusFilter === 'graded' && !st.hasAnyMarks) return false
      if (viewStatusFilter === 'pending' && st.hasAnyMarks) return false

      if (viewSearchTerm.trim()) {
        const q = viewSearchTerm.toLowerCase().trim()
        const matchName = String(st.name || '').toLowerCase().includes(q)
        const matchRoll = String(st.roll || '').includes(q)
        const matchFather = String(st.father || '').toLowerCase().includes(q)
        if (!matchName && !matchRoll && !matchFather) return false
      }
      return true
    })
  }, [allStudentsOverview, viewStatusFilter, viewSearchTerm])

  // Export full class marksheet to Excel
  const handleExportClassMarksheetExcel = () => {
    if (allStudentsOverview.length === 0) {
      alert('No students to export.')
      return
    }

    const rows = allStudentsOverview.map((st, idx) => {
      const row = {
        '#': idx + 1,
        'Roll No': st.roll,
        'Student Name': st.name,
        'Father Name': st.father,
        'Class': selectedClass,
        'Section': selectedSection,
        'Terminal': examType,
      }

      st.subjectBreakdown.forEach((sub) => {
        row[`${sub.name} (Theory)`] = sub.theory !== null ? sub.theory : ''
        row[`${sub.name} (Practical)`] = sub.practical !== null ? sub.practical : ''
        row[`${sub.name} (Total)`] = sub.obtained !== null ? sub.obtained : ''
      })

      row['Grand Total'] = st.hasAnyMarks ? st.totalObtained : ''
      row['Max Marks'] = st.totalMax
      row['Percentage (%)'] = st.percentage ? `${st.percentage}%` : ''
      row['Grade'] = st.gradeInfo ? st.gradeInfo.grade : ''
      row['Evaluation Status'] = st.isComplete ? 'Complete' : (st.hasAnyMarks ? 'Partial' : 'Pending')

      return row
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, `${selectedClass} - ${examType}`)
    XLSX.writeFile(workbook, `SPS_${selectedClass.replace(/\s+/g, '_')}_${selectedSection.replace(/\s+/g, '_')}_${examType}_Marksheet.xlsx`)
  }

  return (
    <div className="w-full space-y-6 pb-12 font-sans text-slate-800 antialiased">
      {/* Toast Notification */}
      {saveDraftToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-[#0f1e36] px-4 py-3 text-xs font-bold text-white shadow-xl animate-fade-in border border-slate-700">
          <span className="text-emerald-400">✓</span>
          <span>{saveDraftToast}</span>
        </div>
      )}

      {/* Hidden File Input for Excel Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={() => alert('Excel Import: Please select student and enter marks below.')}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* ================= 1. TOP HEADER & ACTION BUTTONS ================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            SPS / ACADEMICS / MARKS
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f1e36] tracking-tight mt-0.5">
            Marks Entry & Assessment Sheet
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ek student ke sabhi subjects ke marks ek saath submit karein.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Fast-Track Link */}
          <button
            type="button"
            onClick={() => window.location.href = '/result-view'}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 px-3.5 py-2.5 text-xs font-bold shadow-2xs transition-all"
            title="Fast-Track: Upload entire class Excel to create students and save marks in 1 step"
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            <span>Fast-Track Excel Importer →</span>
          </button>
          {/* Publication Status Badge */}
          {isClassPublished ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 shadow-2xs">
              <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
              <span>Result Published</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 shadow-2xs">
              <span className="material-symbols-outlined text-base text-amber-600">edit_document</span>
              <span>Result Draft</span>
            </span>
          )}

          {/* Publish Result Button */}
          <button
            onClick={handlePublishResults}
            disabled={isPublishing || students.length === 0}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 ${
              isClassPublished
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
            title="Publish official evaluation results for this class and terminal"
          >
            <span className="material-symbols-outlined text-base">
              {isPublishing ? 'sync' : isClassPublished ? 'published_with_changes' : 'campaign'}
            </span>
            <span>{isPublishing ? 'Publishing...' : isClassPublished ? 'Re-publish Result' : 'Publish Result'}</span>
          </button>

          {activeTab === 'view_all' ? (
            <button
              onClick={handleExportClassMarksheetExcel}
              disabled={students.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base text-emerald-600">download</span>
              <span>Export Excel</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleSaveStudentDraft}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                title="Save draft for this student"
              >
                <span className="material-symbols-outlined text-base text-slate-500">bookmark</span>
                <span>Save Draft</span>
              </button>

              <button
                onClick={() => handleSubmitStudentMarks(false)}
                disabled={isSubmitting || !currentStudent}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f1e36] hover:bg-[#162a4a] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base text-amber-300">save</span>
                <span>{isSubmitting ? 'Saving...' : 'Submit Student Marks'}</span>
              </button>

              {currentStudentIndex < students.length - 1 && (
                <button
                  onClick={() => handleSubmitStudentMarks(true)}
                  disabled={isSubmitting || !currentStudent}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <span>Save & Next Student</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ================= 2. TOP METRIC CARDS (4 ROW) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Selected Terminal */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-shadow hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Exam Terminal</span>
            <span className="material-symbols-outlined text-lg text-slate-400">calendar_month</span>
          </div>
          <p className="text-2xl font-black text-[#0f1e36] mt-2">{examType}</p>
          <span className="inline-block text-[11px] font-semibold text-slate-400 mt-2">
            Active Evaluation Terminal
          </span>
        </div>

        {/* Card 2: Selected Student */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-shadow hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Current Student</span>
            <span className="material-symbols-outlined text-lg text-slate-400">person</span>
          </div>
          <p className="text-lg font-black text-[#0f1e36] mt-2 truncate">
            {currentStudent ? `${currentStudent.name}` : 'No student selected'}
          </p>
          <p className="text-[11px] font-semibold text-blue-600 mt-1">
            {currentStudent ? `Roll: ${currentStudent.roll_no || currentStudent.roll || '—'}` : '—'} · {selectedClass}
          </p>
        </div>

        {/* Card 3: Subjects in this Class */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-shadow hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Class Subjects</span>
            <span className="material-symbols-outlined text-lg text-slate-400">menu_book</span>
          </div>
          <p className="text-2xl font-black text-[#0f1e36] mt-2">{subjectsList.length} Subjects</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-2 truncate">
            Total Max: {studentSummary.totalMax} Marks
          </p>
        </div>

        {/* Card 4: Class Evaluation Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-shadow hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Class Progress</span>
            <span className="material-symbols-outlined text-lg text-slate-400">grading</span>
          </div>
          <p className="text-2xl font-black text-[#15803d] mt-2">{classProgress.percent}%</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-[#15803d] h-full rounded-full transition-all duration-500"
              style={{ width: `${classProgress.percent}%` }}
            />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-2">
            {classProgress.graded} of {classProgress.total} students graded
          </p>
        </div>
      </div>

      {/* ================= VIEW MODE SWITCHER TABS ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('entry')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'entry'
                ? 'bg-white text-[#0f1e36] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-base text-blue-600">edit_square</span>
            <span>Enter Student Marks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('view_all')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'view_all'
                ? 'bg-white text-[#0f1e36] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-base text-emerald-600">table_chart</span>
            <span>View Student Marks</span>
            <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700">
              {students.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="font-bold text-slate-700">{selectedClass} ({selectedSection})</span>
          <span>•</span>
          <span className="font-bold text-blue-600">{examType} Terminal</span>
          <span>•</span>
          <span className="font-semibold text-emerald-700">{classProgress.graded} / {classProgress.total} Graded</span>
        </div>
      </div>

      {/* ================= 3. CONTEXT SELECTOR CARD ================= */}
      <div id="exam-context" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0f1e36] tracking-tight">
            {activeTab === 'entry' ? 'Student & Class Selection' : 'Class & Evaluation Filter'}
          </h2>
          <span className="text-[11px] font-medium text-slate-400">
            {activeTab === 'entry'
              ? 'Select student to enter/update their subject marks'
              : 'Viewing complete class marksheet & evaluation records'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Terminal Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Terminal</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none transition-colors"
            >
              <option value="First">First</option>
              <option value="Second">Second</option>
              <option value="Third">Third</option>
              <option value="Annual">Annual</option>
            </select>
          </div>

          {/* 2. Class Selector (Only up to Class 8) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Class (Up to 8)</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none transition-colors"
            >
              {FORMATTED_CLASS_OPTIONS.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* 3. Section Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none transition-colors"
            >
              {SECTION_OPTIONS.map((sec) => (
                <option key={sec} value={`Section ${sec}`}>Section {sec}</option>
              ))}
              <option value="Section D">Section D</option>
            </select>
          </div>

          {/* 4. Adaptive: Student Selector in 'entry' mode vs Search in 'view_all' mode */}
          {activeTab === 'entry' ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-600">Student</label>
                <span className="text-[10px] text-slate-400 font-bold">
                  {currentStudentIndex >= 0 ? `${currentStudentIndex + 1} of ${students.length}` : '—'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevStudent}
                  disabled={currentStudentIndex <= 0}
                  className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                  title="Previous Student"
                >
                  ‹
                </button>

                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={students.length === 0}
                  className="w-full rounded-xl border border-blue-300 bg-blue-50/30 px-3 py-2 text-xs font-bold text-[#0f1e36] focus:border-blue-600 focus:bg-white focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {students.length === 0 ? (
                    <option value="">No active students found in this class</option>
                  ) : (
                    students.map((st) => {
                      const roll = st.roll_no || st.roll || '—'
                      const isGraded = classMarksMap[st.id] && Object.keys(classMarksMap[st.id]).length > 0
                      return (
                        <option key={st.id} value={st.id}>
                          Roll {roll} · {st.name} {isGraded ? '✓' : ''}
                        </option>
                      )
                    })
                  )}
                </select>

                <button
                  type="button"
                  onClick={handleNextStudent}
                  disabled={currentStudentIndex >= students.length - 1 || students.length === 0}
                  className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                  title="Next Student"
                >
                  ›
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Search Student</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-base text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  value={viewSearchTerm}
                  onChange={(e) => setViewSearchTerm(e.target.value)}
                  placeholder="Name, roll no, father..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-7 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none transition-colors"
                />
                {viewSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setViewSearchTerm('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Context Bar */}
        {activeTab === 'entry' ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${currentStudent ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="font-semibold text-slate-800">
                {currentStudent ? `Student: ${currentStudent.name} (Roll ${currentStudent.roll_no || currentStudent.roll || '1'})` : 'No student selected'}
              </span>
              <span className="text-slate-400">·</span>
              <span>{selectedClass} ({selectedSection})</span>
              <span className="text-slate-400">·</span>
              <span className="font-bold text-[#183d7d]">{examType} Terminal</span>
            </div>

            <div className="flex items-center gap-3 font-semibold text-xs">
              <span>Score: <strong className="text-slate-900">{studentSummary.totalObtained}</strong> / {studentSummary.totalMax}</span>
              <span className="text-slate-300">|</span>
              <span>Percentage: <strong className="text-blue-700">{studentSummary.percentage}%</strong></span>
              {studentSummary.gradeInfo && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${studentSummary.gradeInfo.bg} ${studentSummary.gradeInfo.text}`}>
                  Grade {studentSummary.gradeInfo.grade}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">
                Class Marksheet: {selectedClass} ({selectedSection})
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-bold text-[#183d7d]">{examType} Terminal</span>
              <span className="text-slate-400">·</span>
              <span>{subjectsList.length} Subjects</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
              <button
                type="button"
                onClick={() => setViewStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  viewStatusFilter === 'all'
                    ? 'bg-[#0f1e36] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setViewStatusFilter('graded')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  viewStatusFilter === 'graded'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Evaluated ({classProgress.graded})
              </button>
              <button
                type="button"
                onClick={() => setViewStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  viewStatusFilter === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pending ({classProgress.total - classProgress.graded})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= 4. MAIN MARKS ENTRY TABLE (ACTIVE TAB: ENTRY) ================= */}
      {activeTab === 'entry' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0f1e36]">
                Subject Marks for {currentStudent?.name || 'Selected Student'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter theory and practical marks for each subject of {selectedClass}. All subjects submit together.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Clear all marks
                  if (window.confirm('Clear all entered marks for this student?')) {
                    setStudentMarksRows((prev) =>
                      prev.map((r) => ({ ...r, theory: '', practical: '', remarks: '' }))
                    )
                  }
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                <span className="material-symbols-outlined text-xs">clear_all</span>
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-600">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Subject Name</th>
                  <th className="p-3 w-28 text-center">Code</th>
                  <th className="p-3 w-36 text-center">Theory Marks</th>
                  <th className="p-3 w-36 text-center">Practical Marks</th>
                  <th className="p-3 w-32 text-center">Total Marks</th>
                  <th className="p-3 w-28 text-center">Grade</th>
                  <th className="p-3">Teacher Remarks</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {studentMarksRows.map((row, idx) => {
                  const theoryNum = row.theory !== '' ? Number(row.theory) : null
                  const practicalNum = row.practical !== '' ? Number(row.practical) : null
                  const hasMarks = theoryNum !== null || practicalNum !== null
                  const totalScore = hasMarks ? (theoryNum || 0) + (practicalNum || 0) : null
                  const maxTotal = (row.maxTheory || 80) + (row.maxPractical || 20)
                  const gradeInfo = hasMarks ? calculateGrade(totalScore, maxTotal) : null

                  return (
                    <tr key={row.id} className="transition-colors hover:bg-slate-50/60">
                      {/* Index */}
                      <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>

                      {/* Subject Name */}
                      <td className="p-3">
                        <span className="font-bold text-slate-900">{row.name}</span>
                      </td>

                      {/* Subject Code */}
                      <td className="p-3 text-center">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-600">
                          {row.code}
                        </span>
                      </td>

                      {/* Theory Marks Input */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <input
                            type="number"
                            min="0"
                            max={row.maxTheory}
                            value={row.theory}
                            placeholder="0"
                            onChange={(e) => handleSubjectMarkChange(row.id, 'theory', e.target.value)}
                            className="w-16 h-8 text-center rounded-lg border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-colors"
                          />
                          <span className="text-[11px] font-semibold text-slate-400">/ {row.maxTheory}</span>
                        </div>
                      </td>

                      {/* Practical Marks Input */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <input
                            type="number"
                            min="0"
                            max={row.maxPractical}
                            value={row.practical}
                            placeholder="0"
                            onChange={(e) => handleSubjectMarkChange(row.id, 'practical', e.target.value)}
                            className="w-16 h-8 text-center rounded-lg border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-colors"
                          />
                          <span className="text-[11px] font-semibold text-slate-400">/ {row.maxPractical}</span>
                        </div>
                      </td>

                      {/* Total Calculated */}
                      <td className="p-3 text-center font-bold text-slate-800">
                        {totalScore !== null ? (
                          <span>
                            {totalScore} <span className="text-[11px] text-slate-400 font-normal">/ {maxTotal}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold">—</span>
                        )}
                      </td>

                      {/* Grade Badge */}
                      <td className="p-3 text-center">
                        {gradeInfo ? (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${gradeInfo.bg} ${gradeInfo.text}`}>
                            {gradeInfo.grade}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold">—</span>
                        )}
                      </td>

                      {/* Remarks Input */}
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="Optional remarks..."
                          value={row.remarks || ''}
                          onChange={(e) => handleSubjectRemarkChange(row.id, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 focus:border-blue-500 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none transition-colors"
                        />
                      </td>
                    </tr>
                  )
                })}

                {students.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                        <span className="material-symbols-outlined text-4xl text-slate-300">group_off</span>
                        <p className="font-bold text-sm text-slate-700">No active students enrolled in {selectedClass} ({selectedSection})</p>
                        <p className="text-xs text-slate-400">Please enroll students in this class before uploading marks.</p>
                      </div>
                    </td>
                  </tr>
                ) : studentMarksRows.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                        <span className="material-symbols-outlined text-4xl text-slate-300">menu_book</span>
                        <p className="font-bold text-sm text-slate-700">No subjects configured for {selectedClass}</p>
                        <p className="text-xs text-slate-400">Please configure subjects in Subject & Syllabus management.</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>

              {/* Table Footer with Student Totals */}
              {studentMarksRows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-black text-slate-900">
                    <td colSpan="3" className="p-3 text-right">
                      Student Grand Total ({studentSummary.totalSubjects} Subjects):
                    </td>
                    <td colSpan="2" className="p-3 text-center text-blue-900 text-sm">
                      {studentSummary.totalObtained} / {studentSummary.totalMax}
                    </td>
                    <td className="p-3 text-center text-emerald-800 text-sm">
                      {studentSummary.percentage}%
                    </td>
                    <td className="p-3 text-center">
                      {studentSummary.gradeInfo && (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black ${studentSummary.gradeInfo.bg} ${studentSummary.gradeInfo.text}`}>
                          {studentSummary.gradeInfo.grade}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-slate-500 font-medium">
                        {studentSummary.hasAnyMarks
                          ? studentSummary.allEntered
                            ? '✓ All subjects evaluated'
                            : '⚠️ Incomplete evaluation'
                          : 'No marks entered yet'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Bottom Submission Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="material-symbols-outlined text-base text-blue-600">info</span>
              <span>
                Submitting marks saves all {studentMarksRows.length} subjects to student's official evaluation record at once.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveStudentDraft}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                Save Draft
              </button>

              <button
                onClick={() => handleSubmitStudentMarks(false)}
                disabled={isSubmitting || !currentStudent}
                className="rounded-xl bg-[#0f1e36] hover:bg-[#162a4a] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? 'Saving Marks...' : `Submit Marks for ${currentStudent?.name || 'Student'}`}
              </button>

              {currentStudentIndex < students.length - 1 && (
                <button
                  onClick={() => handleSubmitStudentMarks(true)}
                  disabled={isSubmitting || !currentStudent}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <span>Save & Next Student</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. FULL CLASS MARKSHEET (ACTIVE TAB: VIEW_ALL) ================= */}
      {activeTab === 'view_all' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0f1e36]">
                  Class Marksheet: {selectedClass} ({selectedSection})
                </h2>
                {isClassPublished ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                    <span className="material-symbols-outlined text-xs">edit_document</span>
                    Draft (Unpublished)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Terminal: <strong className="text-blue-600">{examType}</strong> · Total Students: <strong>{students.length}</strong> · Showing {filteredStudentsOverview.length} students
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportClassMarksheetExcel}
                disabled={filteredStudentsOverview.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base text-emerald-600">download</span>
                <span>Export Excel</span>
              </button>

              <button
                type="button"
                onClick={handlePublishResults}
                disabled={isPublishing || students.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">
                  {isPublishing ? 'sync' : isClassPublished ? 'published_with_changes' : 'campaign'}
                </span>
                <span>{isPublishing ? 'Publishing...' : isClassPublished ? 'Re-publish Result' : 'Publish Result'}</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 font-bold text-slate-700">
                  <th className="p-3 w-10 text-center sticky left-0 bg-slate-50/90 z-10">#</th>
                  <th className="p-3 w-16 text-center sticky left-10 bg-slate-50/90 z-10">Roll</th>
                  <th className="p-3 min-w-[160px] sticky left-26 bg-slate-50/90 z-10">Student Name</th>
                  <th className="p-3 min-w-[140px]">Father's Name</th>

                  {/* Subject Columns */}
                  {subjectsList.map((sub) => (
                    <th key={sub.id} className="p-3 text-center min-w-[110px] border-l border-slate-200">
                      <div>{sub.name}</div>
                      <span className="text-[10px] font-normal text-slate-400">
                        Max {Number(sub.max_theory || 80) + Number(sub.max_practical || 20)}
                      </span>
                    </th>
                  ))}

                  <th className="p-3 text-center min-w-[110px] border-l-2 border-slate-300 bg-slate-100/70">
                    Grand Total
                  </th>
                  <th className="p-3 text-center min-w-[80px] bg-slate-100/70">Percentage</th>
                  <th className="p-3 text-center min-w-[70px] bg-slate-100/70">Grade</th>
                  <th className="p-3 text-center min-w-[100px]">Evaluation</th>
                  <th className="p-3 text-center min-w-[100px] sticky right-0 bg-slate-50/90 z-10">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredStudentsOverview.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* Index */}
                    <td className="p-3 text-center text-slate-400 font-bold sticky left-0 bg-white z-10">
                      {idx + 1}
                    </td>

                    {/* Roll */}
                    <td className="p-3 text-center font-bold text-slate-700 sticky left-10 bg-white z-10">
                      {st.roll || '—'}
                    </td>

                    {/* Student Name */}
                    <td className="p-3 font-bold text-[#0f1e36] sticky left-26 bg-white z-10">
                      <span>{st.name}</span>
                    </td>

                    {/* Father Name */}
                    <td className="p-3 text-slate-600">
                      {st.father || '—'}
                    </td>

                    {/* Subject Marks */}
                    {st.subjectBreakdown.map((sub) => (
                      <td key={sub.subjectId} className="p-3 text-center border-l border-slate-100">
                        {sub.obtained !== null ? (
                          <div>
                            <span className="font-bold text-slate-900">{sub.obtained}</span>
                            <span className="text-[10px] text-slate-400 block">
                              T:{sub.theory !== null ? sub.theory : '—'} | P:{sub.practical !== null ? sub.practical : '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-bold">—</span>
                        )}
                      </td>
                    ))}

                    {/* Grand Total */}
                    <td className="p-3 text-center font-black text-slate-900 border-l-2 border-slate-300 bg-slate-50/50">
                      {st.hasAnyMarks ? (
                        <span>
                          {st.totalObtained} <span className="text-[10px] font-normal text-slate-400">/ {st.totalMax}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 font-bold">—</span>
                      )}
                    </td>

                    {/* Percentage */}
                    <td className="p-3 text-center font-bold text-blue-700 bg-slate-50/50">
                      {st.percentage !== null ? `${st.percentage}%` : '—'}
                    </td>

                    {/* Grade */}
                    <td className="p-3 text-center bg-slate-50/50">
                      {st.gradeInfo ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${st.gradeInfo.bg} ${st.gradeInfo.text}`}>
                          {st.gradeInfo.grade}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-bold">—</span>
                      )}
                    </td>

                    {/* Evaluation Status */}
                    <td className="p-3 text-center">
                      {st.isComplete ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          Complete
                        </span>
                      ) : st.hasAnyMarks ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          Partial ({st.evaluatedCount}/{st.totalCount})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="p-3 text-center sticky right-0 bg-white z-10">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentId(st.id)
                          setActiveTab('entry')
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs"
                        title="Edit marks for this student"
                      >
                        <span className="material-symbols-outlined text-xs">edit</span>
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Empty State */}
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={subjectsList.length + 8} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                        <span className="material-symbols-outlined text-4xl text-slate-300">group_off</span>
                        <p className="font-bold text-sm text-slate-700">No students enrolled in {selectedClass} ({selectedSection})</p>
                        <p className="text-xs text-slate-400">Enroll students to view or enter marks.</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudentsOverview.length === 0 ? (
                  <tr>
                    <td colSpan={subjectsList.length + 8} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                        <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                        <p className="font-bold text-sm text-slate-700">No students match current filter</p>
                        <button
                          onClick={() => {
                            setViewSearchTerm('')
                            setViewStatusFilter('all')
                          }}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
