import React from 'react'
import schoolLogo from '../../../assets/logo.png'
import { SAMPLE_MARKS_DATA } from '../../../constants/documentTemplateRegistry'

export default function MinimalPrintMarksheet({
  student = {},
  marksData = {},
  customization = {},
  id,
}) {
  const data = { ...SAMPLE_MARKS_DATA, ...marksData }
  const studentName = student.Name || student.name || 'Aarav Kumar Sharma'
  const fatherName = student.father_name || student.FatherName || 'Rajesh Sharma'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '12').toString()
  const rawClass = (student.Class || student.class || '10').toString()
  const studentSection = (student.Section || student.section || 'A').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || 'SPS-2024-0012'

  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const session = customization.session || data.session || '2026-2027'
  const examName = customization.examName || data.examName || 'Annual Examination Statement of Marks'

  return (
    <div
      id={id || `minimal-print-marksheet-${rollNo}`}
      className="sps-document-sheet w-full max-w-[820px] min-h-[1140px] bg-white border border-slate-400 p-8 text-slate-900 shadow-xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div>
        {/* Minimal Clean Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <div className="flex items-center gap-3">
            <img src={schoolLogo} alt="Logo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">{schoolName}</h1>
              <p className="text-xs text-slate-500">Bettiah, West Champaran · Session {session}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black uppercase tracking-wider bg-slate-900 text-white px-3 py-1 rounded">
              GRADE SHEET
            </span>
          </div>
        </div>

        <div className="my-3 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">{examName}</h2>
        </div>

        {/* Bio Grid */}
        <div className="p-3 border border-slate-300 rounded bg-slate-50 text-xs grid grid-cols-2 md:grid-cols-4 gap-2">
          <div><span className="text-slate-400 text-[10px] block">CANDIDATE</span><span className="font-bold text-slate-900">{studentName}</span></div>
          <div><span className="text-slate-400 text-[10px] block">CLASS & SEC</span><span className="font-bold text-slate-900">Class {rawClass} ({studentSection})</span></div>
          <div><span className="text-slate-400 text-[10px] block">ROLL NUMBER</span><span className="font-black text-slate-900 font-mono">#{rollNo}</span></div>
          <div><span className="text-slate-400 text-[10px] block">ADMISSION NO</span><span className="font-mono text-slate-700">{admissionNo}</span></div>
        </div>

        {/* Table */}
        <div className="mt-4 border border-slate-300">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-300">Subject</th>
                <th className="p-2 border-r border-slate-300 text-center">Max Marks</th>
                <th className="p-2 border-r border-slate-300 text-center">Theory</th>
                <th className="p-2 border-r border-slate-300 text-center">Practical</th>
                <th className="p-2 border-r border-slate-300 text-center">Total Scored</th>
                <th className="p-2 border-r border-slate-300 text-center">Grade</th>
                <th className="p-2 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.subjects.map((s, idx) => (
                <tr key={idx}>
                  <td className="p-2 border-r border-slate-200 font-semibold">{s.subject}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500">{s.maxMarks}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono">{s.theory}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600">{s.practical}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-900">{s.total}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-bold">{s.grade}</td>
                  <td className="p-2 text-center font-bold text-slate-800">{s.result}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-300 font-bold">
                <td className="p-2 uppercase font-black">Grand Total</td>
                <td className="p-2 text-center font-mono">{data.totalMaxMarks}</td>
                <td colSpan={2} className="text-right p-2 text-slate-500">Obtained:</td>
                <td className="p-2 text-center font-mono font-black">{data.totalObtained}</td>
                <td colSpan={2} className="p-2 text-center font-black">{data.percentage}% ({data.division})</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Minimal Remarks */}
        <div className="mt-4 p-2.5 border border-slate-200 text-xs flex justify-between">
          <div><strong className="text-slate-900">Result Status:</strong> <span className="uppercase text-emerald-700 font-bold">{data.resultStatus}</span></div>
          <div><strong className="text-slate-900">Class Rank:</strong> #{data.rank}</div>
          <div><strong className="text-slate-900">Remarks:</strong> <span>{data.remarks}</span></div>
        </div>
      </div>

      {/* Signatures */}
      <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
        <div className="text-center">
          <div className="h-8 border-b border-slate-300 mb-1" />
          <span className="text-[10px] font-bold text-slate-600 uppercase">Class Teacher Signature</span>
        </div>
        <div className="text-center">
          <div className="h-8 border-b border-slate-300 mb-1 font-serif italic text-base text-slate-900 font-bold">
            Principal
          </div>
          <span className="text-[10px] font-bold text-slate-600 uppercase">Headmaster / Principal</span>
        </div>
      </div>
    </div>
  )
}
