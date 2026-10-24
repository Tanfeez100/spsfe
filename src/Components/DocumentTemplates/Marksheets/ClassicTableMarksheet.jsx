import React from 'react'
import schoolLogo from '../../../assets/logo.png'
import stampcert from '../../../assets/stampcert.png'
import { SAMPLE_MARKS_DATA } from '../../../constants/documentTemplateRegistry'

export default function ClassicTableMarksheet({
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
  const examName = customization.examName || data.examName || 'Annual Examination Marksheet'

  return (
    <div
      id={id || `classic-table-marksheet-${rollNo}`}
      className="sps-document-sheet w-full max-w-[820px] min-h-[1140px] bg-white border-2 border-slate-800 p-8 text-slate-900 shadow-xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <div className="border border-slate-500 p-5 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-slate-900">
            <div className="flex items-center justify-center gap-3 mb-1">
              <img src={schoolLogo} alt="Logo" className="w-14 h-14 object-contain" />
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-950">{schoolName}</h1>
                <p className="text-xs font-sans text-slate-600">Bettiah, West Champaran, Bihar - 845438</p>
              </div>
            </div>
            <div className="inline-block border border-slate-800 px-6 py-0.5 mt-1 font-bold text-sm tracking-widest uppercase bg-slate-50">
              ACADEMIC MARKSHEET · SESSION {session}
            </div>
            <p className="text-xs font-bold font-sans text-slate-700 mt-1 uppercase">{examName}</p>
          </div>

          {/* Student Bio Grid */}
          <div className="mt-4 border border-slate-400 p-3 bg-slate-50/50 font-sans text-xs grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div><span className="text-slate-500 font-medium">Student Name:</span> <strong className="text-slate-950 uppercase ml-1">{studentName}</strong></div>
            <div><span className="text-slate-500 font-medium">Roll Number:</span> <strong className="text-slate-950 font-mono ml-1">#{rollNo}</strong></div>
            <div><span className="text-slate-500 font-medium">Class & Section:</span> <strong className="text-slate-900 ml-1">Class {rawClass} ({studentSection})</strong></div>
            <div><span className="text-slate-500 font-medium">Admission / Scholar No:</span> <span className="font-mono font-bold text-slate-900 ml-1">{admissionNo}</span></div>
            <div className="col-span-2"><span className="text-slate-500 font-medium">Father's Name:</span> <span className="font-semibold text-slate-800 uppercase ml-1">{fatherName}</span></div>
          </div>

          {/* Full Table */}
          <div className="mt-5">
            <table className="w-full text-left text-xs font-sans border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400 text-[10.5px]">
                  <th className="border-r border-slate-400 p-2">Subject</th>
                  <th className="border-r border-slate-400 p-2 text-center">Max Marks</th>
                  <th className="border-r border-slate-400 p-2 text-center">Pass Marks</th>
                  <th className="border-r border-slate-400 p-2 text-center">Theory</th>
                  <th className="border-r border-slate-400 p-2 text-center">Practical</th>
                  <th className="border-r border-slate-400 p-2 text-center">Total Marks</th>
                  <th className="border-r border-slate-400 p-2 text-center">Grade</th>
                  <th className="p-2 text-center">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((s, idx) => (
                  <tr key={idx} className="border-b border-slate-300">
                    <td className="border-r border-slate-300 p-2 font-bold">{s.subject}</td>
                    <td className="border-r border-slate-300 p-2 text-center font-mono">{s.maxMarks}</td>
                    <td className="border-r border-slate-300 p-2 text-center font-mono">{s.passMarks}</td>
                    <td className="border-r border-slate-300 p-2 text-center font-mono">{s.theory}</td>
                    <td className="border-r border-slate-300 p-2 text-center font-mono">{s.practical}</td>
                    <td className="border-r border-slate-300 p-2 text-center font-mono font-bold">{s.total}</td>
                    <td className="border-r border-slate-300 p-2 text-center font-bold text-blue-900">{s.grade}</td>
                    <td className="p-2 text-center text-slate-600 text-[11px]">{s.result}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-400 font-bold">
                  <td className="p-2 uppercase font-black">Total</td>
                  <td className="p-2 text-center font-mono">{data.totalMaxMarks}</td>
                  <td colSpan={3} className="text-right p-2 text-slate-600">Total Scored:</td>
                  <td className="p-2 text-center font-mono font-black text-sm">{data.totalObtained}</td>
                  <td colSpan={2} className="p-2 text-center text-emerald-800 font-bold">{data.percentage}% ({data.division})</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Result Summary Box */}
          <div className="mt-4 border border-slate-300 p-3 bg-slate-50 font-sans text-xs flex justify-between items-center">
            <div>
              <p><strong>Result:</strong> <span className="text-emerald-800 font-bold uppercase">{data.resultStatus}</span></p>
              <p><strong>Attendance:</strong> {data.attendance}</p>
            </div>
            <div>
              <p><strong>Class Rank:</strong> #{data.rank}</p>
              <p><strong>General Remarks:</strong> <span className="italic">{data.remarks}</span></p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-slate-400 grid grid-cols-3 gap-6 text-center text-xs font-sans">
          <div>
            <div className="h-8 border-b border-slate-400 mb-1" />
            <span className="font-bold uppercase text-[10px] text-slate-800">Class Teacher</span>
          </div>
          <div>
            <div className="h-8 border-b border-slate-400 mb-1 flex items-center justify-center">
              <img src={stampcert} alt="Stamp" className="h-10 object-contain opacity-75" />
            </div>
            <span className="font-bold uppercase text-[10px] text-slate-800">School Seal</span>
          </div>
          <div>
            <div className="h-8 border-b border-slate-400 mb-1 flex items-end justify-center font-serif italic text-base">
              Principal
            </div>
            <span className="font-bold uppercase text-[10px] text-slate-800">Headmaster / Principal</span>
          </div>
        </div>
      </div>
    </div>
  )
}
