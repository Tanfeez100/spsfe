import React, { useState, useEffect } from 'react'
import {
  getMarksSheetApi,
  batchSaveMarksApi,
  approveMarksApi,
  getExamSubjectsApi,
} from '../../../Api/examinations'
import { emitToast, getUser } from '../../../Api/auth'

const ALL_CLASSES = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Nursery', 'LKG', 'UKG']

export default function ExamMarksEntryTab({ activeExam, exams = [] }) {
  const currentUser = getUser()
  const isAdmin = currentUser?.role === 'admin'

  const [selectedExamId, setSelectedExamId] = useState(activeExam?.id || exams[0]?.id || '')
  const [selectedClass, setSelectedClass] = useState('Class 1')
  const [selectedSection, setSelectedSection] = useState('A')
  const [selectedSubject, setSelectedSubject] = useState('English')
  const [availableSubjects, setAvailableSubjects] = useState([])

  const [loading, setLoading] = useState(false)
  const [marksData, setMarksData] = useState(null)
  const [studentEntries, setStudentEntries] = useState([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sync selected exam from prop
  useEffect(() => {
    if (activeExam?.id && activeExam.id !== selectedExamId) {
      setSelectedExamId(activeExam.id)
    } else if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(exams[0].id)
    }
  }, [activeExam, exams])

  // Load available subjects for this class
  useEffect(() => {
    if (!selectedExamId) return
    const fetchSubjects = async () => {
      try {
        const res = await getExamSubjectsApi(selectedExamId, selectedClass)
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setAvailableSubjects(res.data)
          if (!res.data.some((s) => s.subject_name === selectedSubject)) {
            setSelectedSubject(res.data[0].subject_name)
          }
        } else {
          setAvailableSubjects([
            { subject_name: 'English', max_marks: 50 },
            { subject_name: 'Mathematics', max_marks: 50 },
            { subject_name: 'Hindi', max_marks: 50 },
            { subject_name: 'EVS', max_marks: 50 },
          ])
        }
      } catch {
        // ignore
      }
    }
    fetchSubjects()
  }, [selectedExamId, selectedClass])

  // Load marks sheet
  const loadMarks = async () => {
    if (!selectedExamId || !selectedSubject) return
    setLoading(true)
    try {
      const res = await getMarksSheetApi(selectedExamId, {
        className: selectedClass,
        section: selectedSection,
        subjectName: selectedSubject,
      })
      if (res?.success) {
        setMarksData(res.data)
        setStudentEntries(res.data.entries || [])
        setHasUnsavedChanges(false)
      }
    } catch (err) {
      emitToast('error', err.message || 'Failed to load marks sheet')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMarks()
  }, [selectedExamId, selectedClass, selectedSection, selectedSubject])

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleScoreChange = (index, value) => {
    setStudentEntries((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        marks_obtained: value === '' ? '' : Number(value),
        attendance_status: value !== '' ? 'present' : updated[index].attendance_status,
      }
      return updated
    })
    setHasUnsavedChanges(true)
  }

  const handleAttendanceChange = (index, status) => {
    setStudentEntries((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        attendance_status: status,
        marks_obtained: status === 'absent' ? '' : updated[index].marks_obtained,
      }
      return updated
    })
    setHasUnsavedChanges(true)
  }

  const handleRemarksChange = (index, value) => {
    setStudentEntries((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], remarks: value }
      return updated
    })
    setHasUnsavedChanges(true)
  }

  const handleSaveMarks = async (submitForReview = false) => {
    const maxMarks = marksData?.maxMarks || 100

    // Validate entries
    for (const item of studentEntries) {
      if (item.attendance_status === 'present' && item.marks_obtained !== '' && item.marks_obtained !== null) {
        const val = Number(item.marks_obtained)
        if (isNaN(val) || val < 0 || val > maxMarks) {
          emitToast('error', `Roll ${item.roll_no} (${item.student_name}): Marks must be between 0 and ${maxMarks}`)
          return
        }
      }
    }

    setSaving(true)
    try {
      const res = await batchSaveMarksApi(selectedExamId, {
        className: selectedClass,
        section: selectedSection,
        subjectName: selectedSubject,
        entries: studentEntries,
        submitForReview,
      })
      emitToast('success', res.message || 'Marks saved successfully')
      setHasUnsavedChanges(false)
      loadMarks()
    } catch (err) {
      emitToast('error', err.message || 'Failed to save marks')
    } finally {
      setSaving(false)
    }
  }

  const handleApproveMarks = async (approve = true) => {
    let returnReason = ''
    if (!approve) {
      returnReason = window.prompt('Please provide reason for returning marks back to teacher:')
      if (!returnReason) return
    }

    try {
      const res = await approveMarksApi(selectedExamId, {
        className: selectedClass,
        subjectName: selectedSubject,
        approve,
        returnReason,
      })
      emitToast('success', res.message || 'Marks approval updated')
      loadMarks()
    } catch (err) {
      emitToast('error', err.message || 'Failed to update marks approval status')
    }
  }

  const isLocked = marksData?.status === 'approved'

  return (
    <div className="space-y-4">
      {/* Selection Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Exam Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Exam:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 focus:outline-none max-w-xs"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.academic_session})
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              {ALL_CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Section:</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-blue-700 focus:outline-none"
            >
              {availableSubjects.map((s) => (
                <option key={s.subject_name} value={s.subject_name}>
                  {s.subject_name} (Max {s.max_marks || 100})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}

          {!isLocked && (
            <>
              <button
                onClick={() => handleSaveMarks(false)}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                Save Draft
              </button>
              <button
                onClick={() => handleSaveMarks(true)}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-lg bg-[#132c4e] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1e3a8a] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                Submit for Review
              </button>
            </>
          )}

          {isAdmin && marksData?.status === 'submitted' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                onClick={() => handleApproveMarks(true)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700"
              >
                Approve Marks
              </button>
              <button
                onClick={() => handleApproveMarks(false)}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-2xs hover:bg-rose-100"
              >
                Return
              </button>
            </div>
          )}

          {isAdmin && isLocked && (
            <button
              onClick={() => handleApproveMarks(false)}
              className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 shadow-2xs hover:bg-amber-100"
            >
              Unlock for Correction
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Subject Max Marks:</span>
          <span className="font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[11px]">
            {marksData?.maxMarks || 100}
          </span>
          <span className="text-slate-400">|</span>
          <span className="font-semibold text-slate-700">Pass Marks:</span>
          <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
            {marksData?.passMarks || 33}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Review Status:</span>
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
              marksData?.status === 'approved'
                ? 'bg-emerald-100 text-emerald-800'
                : marksData?.status === 'submitted'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {marksData?.status || 'draft'}
          </span>
        </div>
      </div>

      {/* Student Marks Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3 w-16 text-center">Roll</th>
                <th className="px-3 py-3">Student Name</th>
                <th className="px-3 py-3">Father Name</th>
                <th className="px-3 py-3 text-center">Attendance</th>
                <th className="px-3 py-3 w-36 text-center">Marks Obtained</th>
                <th className="px-3 py-3 text-center">Result Status</th>
                <th className="px-4 py-3">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    Loading enrolled students and marks sheet...
                  </td>
                </tr>
              ) : studentEntries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    No students found enrolled in {selectedClass} ({selectedSection}).
                  </td>
                </tr>
              ) : (
                studentEntries.map((student, idx) => {
                  const max = marksData?.maxMarks || 100
                  const pass = marksData?.passMarks || 33
                  const val = student.marks_obtained !== '' && student.marks_obtained !== null ? Number(student.marks_obtained) : null
                  const isPass = val !== null && val >= pass
                  const isFail = val !== null && val < pass

                  return (
                    <tr
                      key={student.student_id || idx}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        student.attendance_status === 'absent' ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-extrabold text-slate-700 text-center">
                        {student.roll_no || idx + 1}
                      </td>
                      <td className="px-3 py-3 font-bold text-[#0f1e36]">
                        {student.student_name}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {student.father_name || '—'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[10px] font-bold">
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleAttendanceChange(idx, 'present')}
                            className={`rounded px-2 py-0.5 transition-colors ${
                              student.attendance_status === 'present'
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleAttendanceChange(idx, 'absent')}
                            className={`rounded px-2 py-0.5 transition-colors ${
                              student.attendance_status === 'absent'
                                ? 'bg-rose-600 text-white'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleAttendanceChange(idx, 'exempted')}
                            className={`rounded px-2 py-0.5 transition-colors ${
                              student.attendance_status === 'exempted'
                                ? 'bg-amber-600 text-white'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Exempt
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {student.attendance_status === 'absent' ? (
                          <span className="font-extrabold text-rose-600 bg-rose-100 px-3 py-1 rounded text-xs">
                            ABSENT
                          </span>
                        ) : student.attendance_status === 'exempted' ? (
                          <span className="font-extrabold text-amber-600 bg-amber-100 px-3 py-1 rounded text-xs">
                            EXEMPTED
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max={max}
                              step="any"
                              disabled={isLocked}
                              value={student.marks_obtained !== null && student.marks_obtained !== undefined ? student.marks_obtained : ''}
                              onChange={(e) => handleScoreChange(idx, e.target.value)}
                              placeholder={`0 - ${max}`}
                              className="h-8 w-24 rounded-lg border border-slate-300 px-2.5 text-center text-xs font-extrabold text-slate-900 focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
                            />
                            <span className="text-[10px] text-slate-400 font-semibold">/ {max}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {student.attendance_status === 'absent' ? (
                          <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold text-rose-700">
                            Absent
                          </span>
                        ) : val === null ? (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                            Pending
                          </span>
                        ) : isPass ? (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                            Passed
                          </span>
                        ) : isFail ? (
                          <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold text-rose-700">
                            Failed
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          disabled={isLocked}
                          value={student.remarks || ''}
                          onChange={(e) => handleRemarksChange(idx, e.target.value)}
                          placeholder="Optional remarks..."
                          className="h-7 w-full rounded border border-slate-200 px-2 text-[11px] text-slate-700 focus:outline-none disabled:bg-transparent disabled:border-none"
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
