import React, { useState, useEffect } from 'react'
import { getReportsApi } from '../../../Api/examinations'
import { emitToast } from '../../../Api/auth'

const ALL_CLASSES = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8']
const REPORT_TYPES = [
  { value: 'class_summary', label: '1. Class-wise Result Summary' },
  { value: 'marks_register', label: '2. Student-wise Marks Register' },
  { value: 'subject_averages', label: '3. Subject-wise Performance & Averages' },
  { value: 'missing_marks', label: '4. Incomplete / Missing Marks Audit' },
]

export default function ExamReportsTab({ activeExam, exams = [] }) {
  const [selectedExamId, setSelectedExamId] = useState(activeExam?.id || exams[0]?.id || '')
  const [selectedClass, setSelectedClass] = useState('Class 1')
  const [reportType, setReportType] = useState('class_summary')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    if (activeExam?.id && activeExam.id !== selectedExamId) {
      setSelectedExamId(activeExam.id)
    } else if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(exams[0].id)
    }
  }, [activeExam, exams])

  const loadReport = async () => {
    if (!selectedExamId) return
    setLoading(true)
    try {
      const res = await getReportsApi(selectedExamId, {
        reportType,
        className: selectedClass,
      })
      if (res?.success) {
        setReportData(res.data)
      }
    } catch (err) {
      emitToast('error', err.message || 'Failed to generate examination report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [selectedExamId, selectedClass, reportType])

  // Safe CSV Export preventing spreadsheet formula injection
  const exportToCSV = () => {
    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      emitToast('warning', 'No data available to export')
      return
    }

    const sanitizeCell = (val) => {
      if (val === null || val === undefined) return '""'
      let str = String(val).replace(/"/g, '""')
      // Formula injection prevention: prepend single quote if cell starts with =, +, -, @
      if (['=', '+', '-', '@'].includes(str.charAt(0))) {
        str = `'${str}`
      }
      return `"${str}"`
    }

    let csvContent = ''
    if (reportType === 'class_summary') {
      const headers = ['Class Name', 'Total Students', 'Passed', 'Failed', 'Absent', 'Pass Percentage']
      const rows = reportData.map((r) => [
        r.className,
        r.totalStudents,
        r.passed,
        r.failed,
        r.absent,
        `${r.passPercentage}%`,
      ])
      csvContent = [headers.map(sanitizeCell).join(','), ...rows.map((row) => row.map(sanitizeCell).join(','))].join('\n')
    } else if (reportType === 'marks_register') {
      const headers = ['Roll No', 'Student Name', 'Class', 'Total Obtained', 'Max Marks', 'Percentage', 'Grade', 'Result Status']
      const rows = reportData.map((r) => [
        r.roll_no,
        r.student_name,
        r.class_name,
        r.total_obtained,
        r.total_max,
        `${r.percentage}%`,
        r.grade,
        r.result_status,
      ])
      csvContent = [headers.map(sanitizeCell).join(','), ...rows.map((row) => row.map(sanitizeCell).join(','))].join('\n')
    } else if (reportType === 'subject_averages') {
      const headers = ['Subject', 'Class', 'Max Marks', 'Pass Marks', 'Students Evaluated', 'Average Score', 'Highest', 'Lowest', 'Pass Rate']
      const rows = reportData.map((r) => [
        r.subjectName,
        r.className,
        r.maxMarks,
        r.passMarks,
        r.studentCount,
        r.averageScore,
        r.highestScore,
        r.lowestScore,
        `${r.passRatePercentage}%`,
      ])
      csvContent = [headers.map(sanitizeCell).join(','), ...rows.map((row) => row.map(sanitizeCell).join(','))].join('\n')
    } else if (reportType === 'missing_marks') {
      const headers = ['Roll No', 'Student Name', 'Class', 'Subject', 'Audit Status']
      const rows = reportData.map((r) => [
        r.rollNo,
        r.studentName,
        r.className,
        r.subjectName,
        r.status,
      ])
      csvContent = [headers.map(sanitizeCell).join(','), ...rows.map((row) => row.map(sanitizeCell).join(','))].join('\n')
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Exam_Report_${reportType}_${selectedClass}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    emitToast('success', 'CSV file generated and downloaded safely')
  }

  return (
    <div className="space-y-4">
      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Exam Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Exam:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 focus:outline-none max-w-xs"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>

          {/* Report Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Report:</span>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-blue-800 focus:outline-none"
            >
              {REPORT_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          {reportType !== 'class_summary' && (
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
          )}
        </div>

        {/* Export & Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm text-emerald-600">file_download</span>
            Export Safe CSV
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#132c4e] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1e3a8a] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Print Report
          </button>
        </div>
      </div>

      {/* Report Render Body */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Generating analytical examination report...
          </div>
        ) : !reportData || (Array.isArray(reportData) && reportData.length === 0) ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No records found for the selected report filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* 1. Class-wise Result Summary */}
            {reportType === 'class_summary' && (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Class Name</th>
                    <th className="px-3 py-3 text-center">Total Students</th>
                    <th className="px-3 py-3 text-center text-emerald-700">Passed</th>
                    <th className="px-3 py-3 text-center text-rose-700">Failed</th>
                    <th className="px-3 py-3 text-center text-amber-700">Absent</th>
                    <th className="px-4 py-3 text-right">Pass Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportData.map((row) => (
                    <tr key={row.className} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-bold text-slate-900">{row.className}</td>
                      <td className="px-3 py-3 text-center font-bold text-slate-800">{row.totalStudents}</td>
                      <td className="px-3 py-3 text-center font-extrabold text-emerald-700">{row.passed}</td>
                      <td className="px-3 py-3 text-center font-extrabold text-rose-700">{row.failed}</td>
                      <td className="px-3 py-3 text-center font-extrabold text-amber-700">{row.absent}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                          {row.passPercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. Marks Register */}
            {reportType === 'marks_register' && (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">Roll</th>
                    <th className="px-3 py-3">Student Name</th>
                    <th className="px-3 py-3 text-center">Class & Section</th>
                    <th className="px-3 py-3 text-center">Total Obtained</th>
                    <th className="px-3 py-3 text-center">Max Marks</th>
                    <th className="px-3 py-3 text-center">Percentage</th>
                    <th className="px-3 py-3 text-center">Grade</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportData.map((row) => (
                    <tr key={row.id || row.student_id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{row.roll_no}</td>
                      <td className="px-3 py-3 font-bold text-slate-900">{row.student_name}</td>
                      <td className="px-3 py-3 text-center text-slate-600">{row.class_name} ({row.section})</td>
                      <td className="px-3 py-3 text-center font-extrabold text-slate-800">{row.total_obtained}</td>
                      <td className="px-3 py-3 text-center text-slate-600">{row.total_max}</td>
                      <td className="px-3 py-3 text-center font-bold text-blue-700">{row.percentage}%</td>
                      <td className="px-3 py-3 text-center font-bold">{row.grade}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            row.result_status === 'passed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.result_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. Subject-wise Averages */}
            {reportType === 'subject_averages' && (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Subject Name</th>
                    <th className="px-3 py-3 text-center">Class</th>
                    <th className="px-3 py-3 text-center">Evaluated Count</th>
                    <th className="px-3 py-3 text-center">Class Average</th>
                    <th className="px-3 py-3 text-center">Highest Score</th>
                    <th className="px-3 py-3 text-center">Lowest Score</th>
                    <th className="px-4 py-3 text-right">Subject Pass Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportData.map((row) => (
                    <tr key={row.subjectName} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-bold text-slate-900">{row.subjectName}</td>
                      <td className="px-3 py-3 text-center text-slate-600">{row.className}</td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-700">{row.studentCount}</td>
                      <td className="px-3 py-3 text-center font-extrabold text-blue-700">{row.averageScore} / {row.maxMarks}</td>
                      <td className="px-3 py-3 text-center font-extrabold text-emerald-700">{row.highestScore}</td>
                      <td className="px-3 py-3 text-center font-extrabold text-rose-700">{row.lowestScore}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-slate-800">{row.passRatePercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. Missing Marks Audit */}
            {reportType === 'missing_marks' && (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">Roll</th>
                    <th className="px-3 py-3">Student Name</th>
                    <th className="px-3 py-3">Class</th>
                    <th className="px-3 py-3">Missing Subject</th>
                    <th className="px-4 py-3 text-right">Audit Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{row.rollNo}</td>
                      <td className="px-3 py-3 font-bold text-slate-900">{row.studentName}</td>
                      <td className="px-3 py-3 text-slate-600">{row.className}</td>
                      <td className="px-3 py-3 font-semibold text-rose-700">{row.subjectName}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
