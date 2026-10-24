import React from 'react'
import schoolLogo from '../../../assets/logo.png'
import stampcert from '../../../assets/stampcert.png'
import { SAMPLE_MARKS_DATA } from '../../../constants/documentTemplateRegistry'

export default function BiharBoardMarksheet({
  student = {},
  marksData = {},
  customization = {},
  id,
}) {
  const data = { ...SAMPLE_MARKS_DATA, ...marksData }
  const studentName = student.Name || student.name || 'Aarav Kumar Sharma'
  const fatherName = student.father_name || student.FatherName || 'Rajesh Sharma'
  const motherName = student.mother_name || student.MotherName || 'Sunita Sharma'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '12').toString()
  const rawClass = (student.Class || student.class || '10').toString()
  const studentSection = (student.Section || student.section || 'A').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || 'SPS-2024-0012'

  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL, WEST CHAMPARAN'
  const boardName = customization.boardName || 'BIHAR SCHOOL EXAMINATION COUNCIL / ACADEMIC BOARD'
  const session = customization.session || data.session || '2026-2027'
  const examName = customization.examName || data.examName || 'ANNUAL SECONDARY SCHOOL EXAMINATION'

  return (
    <div
      id={id || `bihar-board-marksheet-${rollNo}`}
      className="sps-document-sheet w-full max-w-[820px] min-h-[1140px] bg-[#fffefb] border-2 border-slate-900 p-8 text-slate-900 shadow-xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Times New Roman', serif" }}
    >
      <div className="border border-slate-400 p-5 flex flex-col justify-between h-full">
        <div>
          {/* Official Board Style Header */}
          <div className="text-center pb-3 border-b-2 border-slate-950">
            <div className="flex items-center justify-center gap-3">
              <img src={schoolLogo} alt="Logo" className="w-16 h-16 object-contain" />
              <div>
                <p className="text-xs font-sans font-bold text-slate-700 uppercase tracking-widest">{boardName}</p>
                <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-950">{schoolName}</h1>
                <p className="text-xs font-sans text-slate-600">BETTIAH, WEST CHAMPARAN, BIHAR · SCHOOL CODE: 845438</p>
              </div>
            </div>
            <div className="mt-2.5 bg-slate-100 py-1 border-y border-slate-400 font-sans">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">{examName}</h2>
              <p className="text-xs text-slate-600">STATEMENT OF MARKS & EVALUATION RECORD · SESSION {session}</p>
            </div>
          </div>

          {/* Student Bio Matrix */}
          <div className="mt-3.5 border border-slate-400 p-3 bg-slate-50/50 font-sans text-xs grid grid-cols-2 gap-x-4 gap-y-1">
            <div><span className="text-slate-500 font-medium">Candidate Name:</span> <strong className="text-slate-950 uppercase ml-1">{studentName}</strong></div>
            <div><span className="text-slate-500 font-medium">Roll Code & Roll No:</span> <strong className="text-slate-950 font-mono ml-1">845438 · #{rollNo}</strong></div>
            <div><span className="text-slate-500 font-medium">Father's Name:</span> <span className="font-semibold text-slate-800 uppercase ml-1">{fatherName}</span></div>
            <div><span className="text-slate-500 font-medium">Mother's Name:</span> <span className="font-semibold text-slate-800 uppercase ml-1">{motherName}</span></div>
            <div><span className="text-slate-500 font-medium">Class / Section:</span> <strong className="text-slate-900 ml-1">Class {rawClass} (Sec {studentSection})</strong></div>
            <div><span className="text-slate-500 font-medium">Registration / Adm No:</span> <span className="font-mono font-bold text-slate-900 ml-1">{admissionNo}</span></div>
          </div>

          {/* Marks Breakdown Table */}
          <div className="mt-4">
            <table className="w-full text-left text-xs font-sans border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-400 text-[10.5px]">
                  <th className="border-r border-slate-400 p-2">Subject Name</th>
                  <th className="border-r border-slate-400 p-2 text-center">Full Marks</th>
                  <th className="border-r border-slate-400 p-2 text-center">Pass Marks</th>
                  <th className="border-r border-slate-400 p-2 text-center">Theory</th>
                  <th className="border-r border-slate-400 p-2 text-center">Practical / Int.</th>
                  <th className="border-r border-slate-400 p-2 text-center">Total Marks</th>
                  <th className="border-r border-slate-400 p-2 text-center">Grade</th>
                  <th className="p-2 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {data.subjects.map((s, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="border-r border-slate-300 p-2 font-bold text-slate-900">{s.subject}</td>
                    <td className="border-r border-slate-300 p-2 text-center font-mono text-slate-600">{s.maxMarks}</td>
                    <td className="border-r border-slate-300 p-2 text-center font-mono text-slate-600">{s.passMarks}</td>
                    <td className="border-r border-slate-300 p-2 text-center font-mono font-bold">{s.theory}</td>
                    <td className="border-r border-slate-300 p-2 text-center font-mono">{s.practical}</td>
                    <td className="border-r border-slate-300 p-2 text-center font-mono font-black text-slate-950">{s.total}</td>
                    <td className="border-r border-slate-300 p-2 text-center font-bold text-blue-900">{s.grade}</td>
                    <td className="p-2 text-center font-bold text-emerald-700">{s.result}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-400 font-bold text-xs">
                  <td className="p-2 font-black uppercase text-slate-900">Aggregate Summary</td>
                  <td className="p-2 text-center font-mono">{data.totalMaxMarks}</td>
                  <td className="p-2 text-center font-mono">198</td>
                  <td colSpan={2} className="p-2 text-right text-slate-600 font-medium">Obtained:</td>
                  <td className="p-2 text-center font-mono font-black text-sm text-slate-950">{data.totalObtained}</td>
                  <td colSpan={2} className="p-2 text-center text-emerald-800 font-black">{data.percentage}%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Division & Remarks Box */}
          <div className="mt-4 border border-slate-400 p-3 bg-slate-50 font-sans text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <p><span className="text-slate-500 font-medium">Final Result:</span> <strong className="text-emerald-800 uppercase text-sm ml-1">{data.resultStatus}</strong></p>
              <p><span className="text-slate-500 font-medium">Awarded Division:</span> <strong className="text-slate-900 uppercase ml-1">{data.division}</strong></p>
              <p><span className="text-slate-500 font-medium">Class Section Rank:</span> <strong className="text-blue-900 ml-1">Rank #{data.rank}</strong></p>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[11px] block">Overall Remarks:</span>
              <span className="font-serif italic font-bold text-slate-900">{data.remarks}</span>
            </div>
          </div>

          {/* Grading Legend */}
          <div className="mt-3 text-[10px] font-sans text-slate-500 border border-slate-300 p-2 bg-white">
            <span className="font-bold text-slate-700 uppercase">Grading Scale:</span> A+ (90-100% Outstanding), A (80-89% Excellent), B+ (70-79% Very Good), B (60-69% Good), C (50-59% Satisfactory), D (33-49% Pass), F (Below 33% Fail)
          </div>
        </div>

        {/* Footer Signatures */}
        <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs font-sans">
          <div>
            <div className="h-10 flex items-end justify-center pb-1">
              <span className="font-mono text-[11px] text-slate-500">Teacher Sign</span>
            </div>
            <div className="border-t border-slate-700 pt-1">
              <span className="font-bold text-slate-900 uppercase block">Class Teacher</span>
            </div>
          </div>

          <div>
            <div className="h-10 flex items-center justify-center">
              <img src={stampcert} alt="Official Seal" className="h-14 object-contain opacity-80" />
            </div>
            <div className="border-t border-slate-700 pt-1">
              <span className="font-bold text-slate-900 uppercase block">Controller of Exam</span>
            </div>
          </div>

          <div>
            <div className="h-10 flex items-end justify-center pb-1">
              <span className="font-serif italic font-bold text-lg text-slate-900">Principal</span>
            </div>
            <div className="border-t border-slate-700 pt-1">
              <span className="font-bold text-slate-900 uppercase block">Headmaster / Principal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
