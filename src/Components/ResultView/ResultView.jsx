import React, { useState, useEffect, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import SingleMarksheet from './SingleMarksheet'
import { getMarks, bulkImportClassMarks } from '../../Api/marks'
import { getAllStudents } from '../../Api/students'
import { FORMATTED_CLASS_OPTIONS, SECTION_OPTIONS } from '../../constants/schoolOptions'
import { getUser } from '../../Api/auth'

const DEFAULT_SUBJECTS_MAP = {
  default: [
    { name: 'HINDI', fullMarks: 100, passMarks: 30 },
    { name: 'ENGLISH', fullMarks: 100, passMarks: 30 },
    { name: 'MATH', fullMarks: 100, passMarks: 30 },
    { name: 'SCIENCE', fullMarks: 100, passMarks: 30 },
    { name: 'S.S.T', fullMarks: 100, passMarks: 30 },
    { name: 'G.K', fullMarks: 100, passMarks: 30 },
    { name: 'URDU / SANS', fullMarks: 100, passMarks: 30 },
    { name: 'COMP / TAB', fullMarks: 100, passMarks: 30 },
    { name: 'DRAWING', fullMarks: 50, passMarks: 15 },
  ],
}

export default function ResultView() {
  const currentUser = getUser()
  const isTeacher = currentUser?.role === 'teacher'

  // Form Controls
  const [selectedClass, setSelectedClass] = useState(
    currentUser?.assignedClass ? `Class ${String(currentUser.assignedClass).replace(/^Class\s+/i, '')}` : 'Class 1'
  )
  const [selectedSection, setSelectedSection] = useState('all')
  const [selectedTerminal, setSelectedTerminal] = useState('First')
  const [academicYear, setAcademicYear] = useState('2026-27')

  // Operating Mode: 'studio' (View/Batch Print) | 'importer' (Fast-Track Excel Upload)
  const [activeMode, setActiveMode] = useState('studio')

  // Loaded Students and Marksheets
  const [loading, setLoading] = useState(false)
  const [classMarksheets, setClassMarksheets] = useState([])
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0)
  const [viewStyle, setViewStyle] = useState('single') // 'single' | 'all'

  // Excel Importer State
  const fileInputRef = useRef(null)
  const [parsedData, setParsedData] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState(null)

  const cleanClassName = useMemo(() => {
    return String(selectedClass).replace(/^Class\s+/i, '').trim()
  }, [selectedClass])

  const terminalTitle = useMemo(() => {
    if (selectedTerminal === 'First') return 'FIRST TERMINAL EXAMINATION RESULT - 2026'
    if (selectedTerminal === 'Second') return 'SECOND TERMINAL EXAMINATION RESULT - 2026'
    if (selectedTerminal === 'Third') return 'THIRD TERMINAL EXAMINATION RESULT - 2026'
    return 'ANNUAL EXAMINATION RESULT - 2026'
  }, [selectedTerminal])

  const termLabel = useMemo(() => {
    if (selectedTerminal === 'First') return 'First Term'
    if (selectedTerminal === 'Second') return 'Second Term'
    if (selectedTerminal === 'Third') return 'Third Term'
    return 'Annual Exam'
  }, [selectedTerminal])

  // Fetch Class Marksheets whenever filters change
  const fetchClassResults = async () => {
    setLoading(true)
    try {
      // 1. Get real marks for class
      const marksRes = await getMarks(cleanClassName, selectedSection === 'all' ? undefined : selectedSection, selectedTerminal)
      const studentsList = Array.isArray(marksRes?.students) ? marksRes.students : []

      // 2. Fallback to students list if no marks yet
      if (studentsList.length > 0) {
        const marksheets = studentsList.map((st) => {
          const subjects = Object.entries(st.marks || {}).map(([subName, markData]) => {
            const raw = typeof markData === 'object' ? (markData.theory ?? markData.external_marks ?? markData.total ?? markData) : markData
            const isDrawing = /drawing|art/i.test(subName) || markData?.full_marks === 50 || markData?.fullMarks === 50
            const fullMarks = isDrawing ? 50 : (Number(markData?.full_marks || markData?.fullMarks) || 100)
            const passMarks = isDrawing ? 15 : (Number(markData?.pass_marks || markData?.passMarks) || 30)
            return {
              subject_name: subName,
              full_marks: fullMarks,
              pass_marks: passMarks,
              marks_obtained: raw ?? '-',
            }
          })

          const totalObtained = subjects.reduce((sum, s) => {
            const num = Number(s.marks_obtained)
            return Number.isFinite(num) ? sum + num : sum
          }, 0)

          const totalFull = subjects.reduce((sum, s) => sum + (Number(s.full_marks) || 100), 0) || 800
          const pct = totalFull > 0 ? ((totalObtained / totalFull) * 100).toFixed(2) : '0.00'

          let div = 'Failed'
          if (Number(pct) >= 60) div = 'First'
          else if (Number(pct) >= 45) div = 'Second'
          else if (Number(pct) >= 33) div = 'Third'

          return {
            id: st.id || st.student_id,
            name: st.name || st.student_name,
            father_name: st.father_name || st.fatherName,
            class: cleanClassName,
            section: st.section || 'A',
            roll_no: st.roll_no ?? st.rollNo,
            subjects,
            total_marks: totalFull,
            total_obtained: totalObtained,
            percentage: pct,
            division: div,
          }
        })

        // Sort by roll number
        marksheets.sort((a, b) => (parseInt(a.roll_no, 10) || 0) - (parseInt(b.roll_no, 10) || 0))
        setClassMarksheets(marksheets)
        setCurrentStudentIndex(0)
      } else {
        // Check if students exist in directory
        const studRes = await getAllStudents({ class: cleanClassName })
        const rawStuds = Array.isArray(studRes?.students) ? studRes.students : Array.isArray(studRes) ? studRes : []
        if (rawStuds.length > 0) {
          const emptyMarksheets = rawStuds.map((s) => ({
            id: s.id,
            name: s.name,
            father_name: s.father_name || s.fatherName,
            class: cleanClassName,
            section: s.section || 'A',
            roll_no: s.roll_no,
            subjects: DEFAULT_SUBJECTS_MAP.default.map((sub) => ({
              subject_name: sub.name,
              full_marks: sub.fullMarks,
              pass_marks: sub.passMarks,
              marks_obtained: '-',
            })),
            total_marks: 800,
            total_obtained: 0,
            percentage: '0.00',
            division: 'Pending',
          }))
          emptyMarksheets.sort((a, b) => (parseInt(a.roll_no, 10) || 0) - (parseInt(b.roll_no, 10) || 0))
          setClassMarksheets(emptyMarksheets)
        } else {
          setClassMarksheets([])
        }
      }
    } catch (err) {
      console.warn('Could not fetch marksheets:', err)
      setClassMarksheets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClassResults()
  }, [cleanClassName, selectedSection, selectedTerminal])

  // 1-Click Sample Excel Template Generator
  const handleDownloadSampleExcel = () => {
    const subjects = DEFAULT_SUBJECTS_MAP.default
    const sampleHeaders = ['Roll No', 'Student Name', 'Father Name', ...subjects.map((s) => s.name)]
    const sampleRows = [
      [1, 'SAIMA KHATOON', 'SHAMAD ANSARI', 48, 62, 42, 30, 59, 96, 70, 50],
      [2, 'ROHIT KUMAR', 'MANOJ PRASAD', 75, 80, 85, 78, 65, 88, 82, 70],
      [3, 'ANANYA VERMA', 'RAJESH VERMA', 88, 92, 95, 90, 89, 94, 90, 85],
    ]

    const ws = XLSX.utils.aoa_to_sheet([sampleHeaders, ...sampleRows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Class_${cleanClassName}_Marksheet`)
    XLSX.writeFile(wb, `SPS_Sample_Marksheet_Class_${cleanClassName}_${selectedTerminal}Term.xlsx`)
  }

  // Parse Uploaded Excel File
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 })

        if (!json || json.length < 2) {
          alert('Excel file is empty or does not have data rows.')
          return
        }

        // Auto-detect the actual table header row (skips school banners, titles, or empty rows)
        let headerRowIdx = -1
        for (let i = 0; i < Math.min(json.length, 15); i++) {
          const row = json[i]
          if (!Array.isArray(row)) continue
          const strCells = row.map((c) => String(c || '').trim().toLowerCase())

          const hasRoll = strCells.some((c) => /roll/i.test(c) || /adm(ission)?[\s_.]*no/i.test(c) || /^(s\.?no|sr\.?no)$/i.test(c))
          const hasName = strCells.some((c) => /(student[\s_.]*name|name[\s_.]*of[\s_.]*student|^name$)/i.test(c) && !/father|mother|school|parent/i.test(c))
          const hasFather = strCells.some((c) => /father|parent|guardian/i.test(c))

          if ((hasRoll && hasName) || (hasName && hasFather) || (hasRoll && hasFather)) {
            headerRowIdx = i
            break
          }
        }

        if (headerRowIdx === -1) {
          headerRowIdx = 0
        }

        const headers = json[headerRowIdx].map((h) => String(h || '').trim())
        const rows = json.slice(headerRowIdx + 1).filter((r) => Array.isArray(r) && r.some((c) => c !== undefined && c !== null && String(c).trim() !== ''))

        // Find fixed column indexes with intelligent matching
        let rollIdx = headers.findIndex((h) => /roll/i.test(h))
        if (rollIdx === -1) {
          rollIdx = headers.findIndex((h) => /adm(ission)?[\s_.]*no/i.test(h))
        }
        if (rollIdx === -1) {
          rollIdx = headers.findIndex((h) => /^(s\.?no|sr\.?no|serial)$/i.test(h.trim()))
        }

        let nameIdx = headers.findIndex((h) => /(student[\s_.]*name|name[\s_.]*of[\s_.]*student)/i.test(h))
        if (nameIdx === -1) {
          nameIdx = headers.findIndex((h) => /name/i.test(h) && !/father|mother|school|parent|guardian/i.test(h))
        }

        let fatherIdx = headers.findIndex((h) => /father|parent|guardian/i.test(h))

        // Safe fallbacks only if not matched
        if (rollIdx === -1) rollIdx = 0
        if (nameIdx === -1) nameIdx = rollIdx === 0 ? 1 : 0
        if (fatherIdx === -1) fatherIdx = 2

        // All other columns except computed/summary columns are treated as examination Subjects
        const summaryColsRegex = /total|percentage|percent|result|grade|rank|division|remarks|status|pass|fail/i
        const subjectCols = []
        headers.forEach((h, idx) => {
          if (idx !== rollIdx && idx !== nameIdx && idx !== fatherIdx && h) {
            const cleanHeader = h.trim()
            if (!summaryColsRegex.test(cleanHeader)) {
              subjectCols.push({ name: cleanHeader.toUpperCase(), colIdx: idx })
            }
          }
        })

        const parsedStudents = []
        rows.forEach((row) => {
          const roll = parseInt(row[rollIdx], 10)
          const name = String(row[nameIdx] || '').trim()
          const father = String(row[fatherIdx] || '').trim()
          if (!roll || !name) return

          const marks = {}
          subjectCols.forEach((sc) => {
            const raw = row[sc.colIdx]
            marks[sc.name] = raw !== undefined && raw !== null ? raw : '-'
          })

          parsedStudents.push({
            rollNo: roll,
            name,
            fatherName: father,
            marks,
          })
        })

        setParsedData({
          headers,
          subjectCols,
          students: parsedStudents,
          fileName: file.name,
        })
        setImportStatus(null)
      } catch (err) {
        console.error('Error parsing Excel:', err)
        alert('Failed to parse Excel file. Please use the sample template.')
      }
    }
    reader.readAsBinaryString(file)
  }

  // Execute Bulk Import
  const handleExecuteImport = async () => {
    if (!parsedData || parsedData.students.length === 0) return

    setImporting(true)
    setImportStatus({ type: 'info', message: 'Importing students and saving marks into database...' })

    try {
      const payload = {
        className: cleanClassName,
        section: selectedSection === 'all' ? 'A' : selectedSection,
        terminal: selectedTerminal,
        academicYear,
        examTitle: terminalTitle,
        subjects: parsedData.subjectCols.map((s) => {
          const isDrawing = /drawing|art/i.test(s.name) || /50/.test(s.name)
          return {
            name: s.name,
            fullMarks: isDrawing ? 50 : 100,
            passMarks: isDrawing ? 15 : 30,
          }
        }),
        students: parsedData.students,
      }

      const res = await bulkImportClassMarks(payload)

      setImportStatus({
        type: 'success',
        message: `Success! Imported ${res.importedCount || parsedData.students.length} students with marks. Marksheets generated!`,
      })

      // Switch to studio mode and reload marks
      setTimeout(() => {
        setActiveMode('studio')
        fetchClassResults()
      }, 1500)
    } catch (err) {
      console.error('Import error:', err)
      setImportStatus({
        type: 'error',
        message: err.message || 'Failed to import. Please check file format and try again.',
      })
    } finally {
      setImporting(false)
    }
  }

  // Batch Print
  const handlePrintAll = () => {
    setViewStyle('all')
    setTimeout(() => {
      window.print()
    }, 300)
  }

  const handlePrintCurrent = () => {
    setViewStyle('single')
    setTimeout(() => {
      window.print()
    }, 200)
  }

  const currentStudent = classMarksheets[currentStudentIndex] || classMarksheets[0] || null

  return (
    <div className="w-full min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6 print:p-0 print:bg-white">
      {/* Top Navigation & Mode Switcher Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 mb-1">
            <span className="material-symbols-outlined text-sm">workspace_premium</span>
            <span>Official Marksheet Studio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f1e36]">
            Star Public School - Marksheet & Results
          </h1>
          <p className="text-xs text-slate-500">
            Generate, batch-print, or fast-track import class marks with 1-click.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="inline-flex items-center rounded-2xl bg-slate-100 p-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveMode('studio')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all ${activeMode === 'studio'
                ? 'bg-[#132c4e] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Marksheet Studio</span>
          </button>
          <button
            onClick={() => setActiveMode('importer')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all ${activeMode === 'importer'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            <span>Fast-Track Excel Importer</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar (Class, Section, Terminal) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Select Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              {FORMATTED_CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Section:</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Examination Term:</label>
            <select
              value={selectedTerminal}
              onChange={(e) => setSelectedTerminal(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="First">First Terminal Examination</option>
              <option value="Second">Second Terminal Examination</option>
              <option value="Third">Third Terminal Examination</option>
              <option value="Annual">Annual Examination</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Academic Year:</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Mode Actions */}
        {activeMode === 'studio' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintAll}
              disabled={classMarksheets.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f1e36] hover:bg-[#1e40af] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Batch Print All ({classMarksheets.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: MARKSHEET STUDIO (VIEW & BATCH PRINT) */}
      {/* ========================================================================= */}
      {activeMode === 'studio' && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl animate-spin text-blue-600">sync</span>
              <p className="mt-2 text-sm font-bold text-slate-700">Loading marksheets...</p>
            </div>
          ) : classMarksheets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4">
              <span className="material-symbols-outlined text-5xl text-slate-300">description</span>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">
                  No marksheets found for {selectedClass} - {termLabel}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Students are not yet imported or marks have not been uploaded for this terminal exam.
                </p>
              </div>
              <button
                onClick={() => setActiveMode('importer')}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                <span>Fast-Track Import from Excel Now</span>
              </button>
            </div>
          ) : (
            <div>
              {/* Single / All View Switcher & Pagination Bar (Hidden on Print) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
                {/* View Switch */}
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-slate-500">View Mode:</span>
                  <div className="inline-flex rounded-xl bg-slate-100 p-1">
                    <button
                      onClick={() => setViewStyle('single')}
                      className={`px-3 py-1 rounded-lg transition-all ${viewStyle === 'single' ? 'bg-white shadow-2xs text-[#0f1e36]' : 'text-slate-500'
                        }`}
                    >
                      Single Card
                    </button>
                    <button
                      onClick={() => setViewStyle('all')}
                      className={`px-3 py-1 rounded-lg transition-all ${viewStyle === 'all' ? 'bg-white shadow-2xs text-[#0f1e36]' : 'text-slate-500'
                        }`}
                    >
                      All Cards ({classMarksheets.length})
                    </button>
                  </div>
                </div>

                {/* Single Card Pagination Controls */}
                {viewStyle === 'single' && (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => setCurrentStudentIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentStudentIndex === 0}
                      className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 flex items-center justify-center font-bold"
                    >
                      ‹
                    </button>

                    <select
                      value={currentStudentIndex}
                      onChange={(e) => setCurrentStudentIndex(Number(e.target.value))}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-bold text-slate-800 text-xs cursor-pointer"
                    >
                      {classMarksheets.map((st, idx) => (
                        <option key={st.id || idx} value={idx}>
                          Roll #{st.roll_no} - {st.name} ({st.percentage}%)
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setCurrentStudentIndex((prev) => Math.min(classMarksheets.length - 1, prev + 1))}
                      disabled={currentStudentIndex === classMarksheets.length - 1}
                      className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 flex items-center justify-center font-bold"
                    >
                      ›
                    </button>

                    <span className="text-slate-400 font-medium ml-1">
                      {currentStudentIndex + 1} of {classMarksheets.length}
                    </span>
                  </div>
                )}

                {/* Print Current Button */}
                <button
                  onClick={viewStyle === 'single' ? handlePrintCurrent : handlePrintAll}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span>{viewStyle === 'single' ? 'Print This Marksheet' : 'Print All Marksheets'}</span>
                </button>
              </div>

              {/* Render Marksheet(s) */}
              {viewStyle === 'single' ? (
                currentStudent && (
                  <SingleMarksheet
                    student={currentStudent}
                    examTitle={terminalTitle}
                    termName={termLabel}
                  />
                )
              ) : (
                <div className="space-y-10 print:space-y-0">
                  {classMarksheets.map((st, idx) => (
                    <div key={st.id || idx} className="marksheet-print-wrapper print:page-break-after-always">
                      <SingleMarksheet
                        student={st}
                        examTitle={terminalTitle}
                        termName={termLabel}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: FAST-TRACK EXCEL IMPORTER (STUDENTS + MARKS IN 1 STEP) */}
      {/* ========================================================================= */}
      {activeMode === 'importer' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#0f1e36]">
                  Fast-Track Class Result Importer (Excel / CSV)
                </h2>
                <p className="text-xs text-slate-500 max-w-xl">
                  Upload your class Excel sheet containing Student Name, Roll No, Father's Name, and Subject Marks.
                  The system will create the students and record marks in one single click!
                </p>
              </div>

              {/* 1-Click Sample Template Download Button */}
              <button
                type="button"
                onClick={handleDownloadSampleExcel}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-4 py-2.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Download Sample Excel for Class {cleanClassName}</span>
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />

            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50/60 rounded-3xl p-8 text-center cursor-pointer transition-all space-y-3"
            >
              <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">cloud_upload</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  {parsedData ? `Selected: ${parsedData.fileName}` : 'Click here to upload your class marks Excel sheet'}
                </p>
                <p className="text-xs text-slate-400">
                  Supports .XLSX, .XLS, or .CSV formatted with Roll No, Student Name, Father Name, and Subject columns.
                </p>
              </div>
              {parsedData && (
                <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
                  ✓ {parsedData.students.length} students & {parsedData.subjectCols.length} subjects parsed
                </span>
              )}
            </div>

            {/* Live Interactive Preview Table */}
            {parsedData && parsedData.students.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span>Parsed Data Preview</span>
                    <span className="rounded-full bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5">
                      {parsedData.students.length} Students
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    Detected Subjects: <strong>{parsedData.subjectCols.map((s) => s.name).join(', ')}</strong>
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 overflow-hidden max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 sticky top-0 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Roll</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Father's Name</th>
                        {parsedData.subjectCols.map((s) => (
                          <th key={s.name} className="p-3 text-center">{s.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedData.students.map((st, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{st.rollNo}</td>
                          <td className="p-3 font-semibold text-slate-800 uppercase">{st.name}</td>
                          <td className="p-3 text-slate-600 uppercase">{st.fatherName || '-'}</td>
                          {parsedData.subjectCols.map((s) => (
                            <td key={s.name} className="p-3 text-center font-bold text-slate-700">
                              {st.marks[s.name] ?? '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Import Status Alert */}
                {importStatus && (
                  <div
                    className={`rounded-2xl p-4 text-xs font-semibold flex items-center gap-2 ${importStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : importStatus.type === 'error'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {importStatus.type === 'success' ? 'check_circle' : 'info'}
                    </span>
                    <span>{importStatus.message}</span>
                  </div>
                )}

                {/* Execution Button */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setParsedData(null)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={importing}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">
                      {importing ? 'sync' : 'done_all'}
                    </span>
                    <span>
                      {importing
                        ? 'Importing & Generating Marksheets...'
                        : `Confirm & Import ${parsedData.students.length} Students with Marks`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
