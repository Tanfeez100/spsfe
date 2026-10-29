import React, { useState, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import { bulkImportClassMarks } from '../../Api/marks'
import { FORMATTED_CLASS_OPTIONS } from '../../constants/schoolOptions'
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

  // Form Controls
  const [selectedClass, setSelectedClass] = useState(
    currentUser?.assignedClass ? `Class ${String(currentUser.assignedClass).replace(/^Class\s+/i, '')}` : 'Class 1'
  )
  const [selectedSection, setSelectedSection] = useState('all')
  const [selectedTerminal, setSelectedTerminal] = useState('First')
  const [academicYear, setAcademicYear] = useState('2026-27')

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

  // Download Sample Excel Template
  const handleDownloadSampleExcel = () => {
    const subjects = DEFAULT_SUBJECTS_MAP.default
    const sampleHeaders = ['Roll No', 'Student Name', 'Father Name', ...subjects.map((s) => s.name)]
    const sampleRows = [
      [1, 'SAIMA KHATOON', 'SHAMAD ANSARI', 48, 62, 42, 30, 59, 96, 70, 50, 42],
      [2, 'MD SOHAIL', 'MD ALAM', 65, 58, 70, 62, 54, 88, 75, 60, 40],
      [3, 'PRIYA KUMARI', 'RAJESH PRASAD', 72, 80, 85, 78, 69, 92, 82, 70, 45],
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([sampleHeaders, ...sampleRows])
    XLSX.utils.book_append_sheet(wb, ws, 'Marks_Template')
    XLSX.writeFile(wb, `Sample_Marksheet_${cleanClassName}_${selectedTerminal}.xlsx`)
  }

  // Handle Excel File Drop/Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsName = wb.SheetNames[0]
        const ws = wb.Sheets[wsName]
        const rawJson = XLSX.utils.sheet_to_json(ws, { header: 1 })

        if (!rawJson || rawJson.length === 0) {
          alert('Excel file is empty.')
          return
        }

        // Find Header Row: row containing 'Roll', 'Name' or 'Student Name'
        let headerRowIdx = 0
        for (let i = 0; i < Math.min(rawJson.length, 10); i++) {
          const row = rawJson[i]
          if (Array.isArray(row)) {
            const strCells = row.map((c) => String(c || '').toLowerCase().trim())
            const hasRoll = strCells.some((c) => /roll/i.test(c) || /adm(ission)?[\s_.]*no/i.test(c) || /^(s\.?no|sr\.?no)$/i.test(c))
            const hasName = strCells.some((c) => /(student[\s_.]*name|name[\s_.]*of[\s_.]*student|^name$)/i.test(c) && !/father|mother|school|parent/i.test(c))
            const hasFather = strCells.some((c) => /father|parent|guardian/i.test(c))

            if ((hasRoll && hasName) || (hasName && hasFather)) {
              headerRowIdx = i
              break
            }
          }
        }

        const headers = (rawJson[headerRowIdx] || []).map((h) => String(h || '').trim())
        const rows = rawJson.slice(headerRowIdx + 1).filter((r) => Array.isArray(r) && r.some((c) => c !== null && c !== ''))

        // Find primary column indices
        let rollIdx = headers.findIndex((h) => /roll/i.test(h) || /adm(ission)?[\s_.]*no/i.test(h) || /^(s\.?no|sr\.?no)$/i.test(h))
        let nameIdx = headers.findIndex((h) => /(student[\s_.]*name|name[\s_.]*of[\s_.]*student|^name$)/i.test(h) && !/father|mother|school|parent/i.test(c))
        let fatherIdx = headers.findIndex((h) => /father|parent|guardian/i.test(h))

        if (rollIdx === -1) rollIdx = 0
        if (nameIdx === -1) nameIdx = 1
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
        message: `Success! Imported ${res.importedCount || parsedData.students.length} students with marks for ${selectedClass} (${termLabel})!`,
      })
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

  return (
    <div className="w-full min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 mb-2">
            <span className="material-symbols-outlined text-sm">upload_file</span>
            <span>Fast-Track Excel Importer</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f1e36]">
            Star Public School - Fast-Track Excel Marks Import
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select class & exam term, download sample template or upload your Excel marksheet to import in 1-click.
          </p>
        </div>

        {/* 1-Click Sample Template Download Button */}
        <button
          type="button"
          onClick={handleDownloadSampleExcel}
          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-4 py-2.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">download</span>
          <span>Download Sample Excel Template</span>
        </button>
      </div>

      {/* Context Filter Bar (Class, Section, Terminal, Year) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Select Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer min-w-[120px]"
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
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer min-w-[120px]"
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
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer min-w-[200px]"
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
              className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* FAST-TRACK EXCEL IMPORTER CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-[#0f1e36]">
            Upload Class Marks Excel Sheet
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Upload your class Excel sheet containing Student Name, Roll No, Father's Name, and Subject Marks.
            The system will automatically register students and record marks in one single click!
          </p>
        </div>

        {/* Drag & Drop File Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/80 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all space-y-3 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-3xl">cloud_upload</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">
              {parsedData ? `Selected: ${parsedData.fileName}` : 'Click to select or drag & drop class marksheet Excel'}
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
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Preview Detected Records</span>
                <span className="rounded-full bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5">
                  {parsedData.students.length} Students
                </span>
                <span className="rounded-full bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5">
                  {parsedData.subjectCols.length} Subjects
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setParsedData(null)}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Clear Selection
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[380px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
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
                      <td className="p-3 font-bold text-blue-900 uppercase">{st.name}</td>
                      <td className="p-3 text-slate-600 uppercase">{st.fatherName || '-'}</td>
                      {parsedData.subjectCols.map((sc) => (
                        <td key={sc.name} className="p-3 text-center font-semibold text-slate-700">
                          {st.marks[sc.name] ?? '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Status Alert */}
            {importStatus && (
              <div
                className={`rounded-2xl p-4 text-xs font-bold flex items-center gap-3 ${
                  importStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : importStatus.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {importStatus.type === 'success' ? 'check_circle' : importStatus.type === 'error' ? 'error' : 'info'}
                </span>
                <span>{importStatus.message}</span>
              </div>
            )}

            {/* Execute Import Action Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importing}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-6 py-3.5 text-xs font-bold shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {importing ? (
                  <span className="material-symbols-outlined text-base animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-base">cloud_done</span>
                )}
                <span>
                  {importing
                    ? 'Importing & Saving Marks...'
                    : `Confirm & Import ${parsedData.students.length} Students with Marks`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
