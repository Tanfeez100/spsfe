import React, { useState, useEffect } from 'react'
import {
  calculateAndGetResultsApi,
  togglePublishResultsApi,
} from '../../../Api/examinations'
import { emitToast, getUser } from '../../../Api/auth'

const ALL_CLASSES = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8']

export default function ExamResultsTab({ activeExam, exams = [] }) {
  const currentUser = getUser()
  const isAdmin = currentUser?.role === 'admin'

  const [selectedExamId, setSelectedExamId] = useState(activeExam?.id || exams[0]?.id || '')
  const [selectedClass, setSelectedClass] = useState('Class 1')
  const [selectedSection, setSelectedSection] = useState('A')
  const [loading, setLoading] = useState(false)
  const [resultData, setResultData] = useState(null)

  // Report Card Modal / Print State
  const [activeReportStudent, setActiveReportStudent] = useState(null)
  const [isBulkPrint, setIsBulkPrint] = useState(false)

  // Sync selected exam from prop
  useEffect(() => {
    if (activeExam?.id && activeExam.id !== selectedExamId) {
      setSelectedExamId(activeExam.id)
    } else if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(exams[0].id)
    }
  }, [activeExam, exams])

  const loadResults = async () => {
    if (!selectedExamId) return
    setLoading(true)
    try {
      const res = await calculateAndGetResultsApi(selectedExamId, {
        className: selectedClass,
        section: selectedSection,
      })
      if (res?.success) {
        setResultData(res.data)
      }
    } catch (err) {
      emitToast('error', err.message || 'Failed to calculate examination results')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [selectedExamId, selectedClass, selectedSection])

  const handleTogglePublish = async (publish) => {
    try {
      const res = await togglePublishResultsApi(selectedExamId, {
        publish,
        reason: publish ? 'Official Result Declaration' : 'Administrative Retraction',
      })
      emitToast('success', res.message || 'Result publication state updated')
      loadResults()
    } catch (err) {
      emitToast('error', err.message || 'Failed to update result publication')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      {/* Print Styles for A4 Report Cards */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-report-card, #printable-report-card * {
            visibility: visible !important;
          }
          #printable-report-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Control Strip */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
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

          <button
            onClick={loadResults}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs"
            title="Recalculate Results"
          >
            <span className="material-symbols-outlined text-sm">sync</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {resultData?.results?.length > 0 && (
            <button
              onClick={() => {
                setActiveReportStudent(null)
                setIsBulkPrint(true)
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Bulk Print Class ({resultData.results.length})
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => handleTogglePublish(!resultData?.isPublished)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold shadow-2xs transition-colors ${
                resultData?.isPublished
                  ? 'border border-amber-300 bg-white text-amber-700 hover:bg-amber-50'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {resultData?.isPublished ? 'Unpublish Results' : 'Publish Examination Results'}
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Enrolled</span>
          <p className="text-xl font-extrabold text-slate-800 mt-0.5">{resultData?.totalStudents || 0}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-emerald-700">Passed</span>
          <p className="text-xl font-extrabold text-emerald-800 mt-0.5">{resultData?.passedCount || 0}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-rose-700">Failed / Needs Imp.</span>
          <p className="text-xl font-extrabold text-rose-800 mt-0.5">{resultData?.failedCount || 0}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-amber-700">Absent</span>
          <p className="text-xl font-extrabold text-amber-800 mt-0.5">{resultData?.absentCount || 0}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-blue-700">Publication State</span>
          <p className="text-sm font-extrabold text-blue-900 mt-1">
            {resultData?.isPublished ? 'PUBLISHED' : 'DRAFT'}
          </p>
        </div>
      </div>

      {/* Results Table (Screen View) */}
      <div className="no-print overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3 w-14 text-center">Rank</th>
                <th className="px-3 py-3 w-16 text-center">Roll</th>
                <th className="px-3 py-3">Student Name</th>
                <th className="px-3 py-3 text-center">Marks Obtained</th>
                <th className="px-3 py-3 text-center">Percentage</th>
                <th className="px-3 py-3 text-center">Grade</th>
                <th className="px-3 py-3 text-center">Result Status</th>
                <th className="px-4 py-3 text-right">Report Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                    Computing student grades and examination aggregates...
                  </td>
                </tr>
              ) : !resultData?.results || resultData.results.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                    No results calculated. Ensure marks have been entered for this class.
                  </td>
                </tr>
              ) : (
                resultData.results.map((res) => (
                  <tr key={res.studentId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-center font-extrabold text-slate-800">
                      {res.rank ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                          #{res.rank}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-700">
                      {res.rollNo}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-[#0f1e36] text-xs">{res.studentName}</p>
                      <p className="text-[10px] text-slate-400">{res.fatherName}</p>
                    </td>
                    <td className="px-3 py-3 text-center font-extrabold text-slate-800">
                      {res.totalObtained} / {res.totalMax}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-blue-700">
                      {res.percentage}%
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                        {res.grade}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          res.resultStatus === 'passed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : res.resultStatus === 'absent'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {res.resultStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setIsBulkPrint(false)
                          setActiveReportStudent(res)
                        }}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                      >
                        View Report Card
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Report Card Modal / Print Area */}
      {(activeReportStudent || isBulkPrint) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Toolbar */}
            <div className="no-print flex items-center justify-between border-b border-slate-200 px-5 py-3 bg-slate-50">
              <span className="text-xs font-bold text-slate-800">
                {isBulkPrint ? `Class Report Cards (${resultData?.results?.length} Students)` : `Report Card: ${activeReportStudent?.studentName}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  Print A4 Report Card
                </button>
                <button
                  onClick={() => {
                    setActiveReportStudent(null)
                    setIsBulkPrint(false)
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div id="printable-report-card" className="p-8 overflow-y-auto flex-1 bg-white space-y-12">
              {(isBulkPrint ? resultData?.results || [] : [activeReportStudent]).map((student, idx) => (
                <div
                  key={student?.studentId || idx}
                  className={`max-w-3xl mx-auto rounded-xl border-2 border-slate-800 p-8 bg-white text-slate-900 shadow-sm ${
                    isBulkPrint ? 'page-break' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                    <h1 className="text-2xl font-black tracking-tight text-[#071d3f] uppercase">
                      STAR PUBLIC SCHOOL
                    </h1>
                    <p className="text-xs font-medium text-slate-600">
                      Affiliated to State Board | Bettiah, West Champaran, Bihar - 845438
                    </p>
                    <p className="text-[11px] font-bold text-blue-700 mt-1 uppercase tracking-wider">
                      PROGRESS REPORT & MARKS STATEMENT
                    </p>
                    <div className="mt-1 inline-block bg-slate-100 border border-slate-300 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-slate-800">
                      {resultData?.examName || 'ANNUAL EXAMINATION'} · ACADEMIC SESSION {resultData?.session || '2026-27'}
                    </div>
                  </div>

                  {/* Student Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border border-slate-300 bg-slate-50/60 rounded-lg p-3 text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Student Name</span>
                      <span className="font-extrabold text-slate-900">{student?.studentName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Father's Name</span>
                      <span className="font-semibold text-slate-800">{student?.fatherName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Class & Section</span>
                      <span className="font-bold text-slate-900">{student?.className} ({student?.section})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Roll Number</span>
                      <span className="font-bold text-slate-900">{student?.rollNo}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Academic Year</span>
                      <span className="font-bold text-slate-900">{resultData?.session}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Class Standing</span>
                      <span className="font-bold text-amber-700">{student?.rank ? `Rank #${student.rank}` : 'Qualified'}</span>
                    </div>
                  </div>

                  {/* Subject Scores Table */}
                  <table className="w-full border-collapse border border-slate-400 text-xs text-left mb-4">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px] border-b border-slate-400">
                        <th className="border border-slate-400 px-3 py-2 text-center w-12">S.No</th>
                        <th className="border border-slate-400 px-3 py-2">Subject</th>
                        <th className="border border-slate-400 px-3 py-2 text-center">Max Marks</th>
                        <th className="border border-slate-400 px-3 py-2 text-center">Pass Marks</th>
                        <th className="border border-slate-400 px-3 py-2 text-center">Marks Obtained</th>
                        <th className="border border-slate-400 px-3 py-2 text-center w-16">Grade</th>
                        <th className="border border-slate-400 px-3 py-2 text-center w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(student?.subjectDetails || []).map((sub, sIdx) => (
                        <tr key={sIdx} className="border-b border-slate-300">
                          <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-slate-500">
                            {sIdx + 1}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 font-bold">
                            {sub.subjectName}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center">
                            {sub.maxMarks}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center font-semibold text-slate-600">
                            {sub.passMarks}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center font-extrabold text-slate-900">
                            {sub.attendanceStatus === 'absent' ? 'AB' : sub.attendanceStatus === 'exempted' ? 'EX' : sub.marksObtained !== null ? sub.marksObtained : '—'}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center font-bold">
                            {sub.grade}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-[10px]">
                            {sub.attendanceStatus === 'absent' ? (
                              <span className="text-rose-600">ABSENT</span>
                            ) : sub.isPassed ? (
                              <span className="text-emerald-700">PASS</span>
                            ) : (
                              <span className="text-rose-600">FAIL</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {/* Summary Row */}
                      <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-400">
                        <td colSpan="2" className="border border-slate-400 px-3 py-2 text-right uppercase">
                          Grand Total
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-center">
                          {student?.totalMax}
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-center">—</td>
                        <td className="border border-slate-400 px-3 py-2 text-center text-blue-800 text-sm">
                          {student?.totalObtained}
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-center">
                          {student?.grade}
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-center text-emerald-800 uppercase">
                          {student?.resultStatus}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Aggregate Highlights & Remarks */}
                  <div className="grid grid-cols-2 gap-3 border border-slate-300 rounded-lg p-3 text-xs mb-8">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Aggregate Percentage</p>
                      <p className="text-lg font-black text-blue-700">{student?.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Class Teacher Remarks</p>
                      <p className="text-xs font-medium text-slate-800 italic mt-0.5">
                        "{student?.remarks || 'Satisfactory academic performance and steady class participation.'}"
                      </p>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-3 pt-8 text-center text-xs text-slate-800">
                    <div className="space-y-12">
                      <div />
                      <p className="border-t border-slate-400 pt-1 font-semibold">Class Teacher</p>
                    </div>
                    <div className="space-y-12">
                      <div />
                      <p className="border-t border-slate-400 pt-1 font-semibold">Parent / Guardian</p>
                    </div>
                    <div className="space-y-12">
                      <div />
                      <p className="border-t border-slate-400 pt-1 font-bold">Principal Signature & Seal</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
