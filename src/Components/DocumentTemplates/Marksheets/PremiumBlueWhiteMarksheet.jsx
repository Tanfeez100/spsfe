import React from 'react'
import schoolLogo from '../../../assets/logo.png'
import stampcert from '../../../assets/stampcert.png'
import { SAMPLE_MARKS_DATA } from '../../../constants/documentTemplateRegistry'

export default function PremiumBlueWhiteMarksheet({
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
  const examName = customization.examName || data.examName || 'Academic Performance & Grade Card'

  return (
    <div
      id={id || `premium-blue-white-marksheet-${rollNo}`}
      className="sps-document-sheet w-full max-w-[820px] min-h-[1140px] bg-white border border-slate-300 p-8 text-slate-900 shadow-xl rounded-xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div>
        {/* Royal Blue Top Bar */}
        <div className="border-b-4 border-blue-900 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={schoolLogo} alt="Logo" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-blue-950">{schoolName}</h1>
              <p className="text-xs text-slate-500 font-medium">Bettiah, West Champaran · Session {session}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-blue-900 text-white text-xs font-black uppercase px-3 py-1 rounded shadow-xs">
              REPORT CARD
            </span>
            <p className="text-[11px] font-mono text-slate-500 mt-1">S.R. No: {admissionNo}</p>
          </div>
        </div>

        <div className="my-3 text-center">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800">{examName}</h2>
        </div>

        {/* Candidate Bio Header */}
        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
            <span className="font-black text-slate-950 text-sm">{studentName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Class & Section</span>
            <span className="font-bold text-slate-900">Class {rawClass} - Sec {studentSection}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Roll Number</span>
            <span className="font-black text-blue-950 font-mono text-sm">#{rollNo}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Father's Name</span>
            <span className="font-semibold text-slate-800 truncate block">{fatherName}</span>
          </div>
        </div>

        {/* Subjects Evaluation Table */}
        <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-900 text-white text-[10.5px] uppercase font-bold">
              <tr>
                <th className="py-2.5 px-3">Subject Name</th>
                <th className="py-2.5 px-2 text-center">Max Marks</th>
                <th className="py-2.5 px-2 text-center">Theory</th>
                <th className="py-2.5 px-2 text-center">Practical</th>
                <th className="py-2.5 px-3 text-center">Marks Scored</th>
                <th className="py-2.5 px-2 text-center">Grade</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.subjects.map((s, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="py-2 px-3 font-bold text-slate-900">{s.subject}</td>
                  <td className="py-2 px-2 text-center font-mono text-slate-500">{s.maxMarks}</td>
                  <td className="py-2 px-2 text-center font-mono">{s.theory}</td>
                  <td className="py-2 px-2 text-center font-mono text-slate-600">{s.practical}</td>
                  <td className="py-2 px-3 text-center font-mono font-black text-blue-950">{s.total}</td>
                  <td className="py-2 px-2 text-center font-black text-blue-900">{s.grade}</td>
                  <td className="py-2 px-3 text-center font-bold text-emerald-700">{s.result}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50/70 border-t border-blue-200 font-bold text-xs">
                <td className="py-2.5 px-3 uppercase text-blue-950 font-black">Total Aggregate</td>
                <td className="py-2.5 px-2 text-center font-mono">{data.totalMaxMarks}</td>
                <td colSpan={2} className="text-right px-2 text-slate-500">Obtained:</td>
                <td className="py-2.5 px-3 text-center font-mono text-sm font-black text-blue-950">{data.totalObtained}</td>
                <td colSpan={2} className="py-2.5 px-3 text-center text-emerald-800 font-black text-sm">{data.percentage}% ({data.division})</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Performance Box */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Class Rank</span>
            <p className="text-base font-black text-blue-950">Rank #{data.rank}</p>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Annual Attendance</span>
            <p className="text-base font-black text-slate-900">{data.attendance}</p>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Academic Standing</span>
            <p className="text-base font-black text-emerald-700 uppercase">{data.resultStatus}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-8 border-t border-slate-200 mt-6 grid grid-cols-3 gap-6 text-center text-xs">
        <div>
          <div className="h-10 flex items-end justify-center pb-1">
            <span className="text-slate-400 font-mono text-[11px]">Class Teacher</span>
          </div>
          <div className="border-t border-slate-300 pt-1">
            <span className="font-bold text-slate-800 uppercase block">Class Teacher</span>
          </div>
        </div>

        <div>
          <div className="h-10 flex items-center justify-center">
            <img src={stampcert} alt="Stamp" className="h-12 object-contain opacity-80" />
          </div>
          <div className="border-t border-slate-300 pt-1">
            <span className="font-bold text-slate-800 uppercase block">School Seal</span>
          </div>
        </div>

        <div>
          <div className="h-10 flex items-end justify-center pb-1">
            <span className="font-serif italic font-bold text-lg text-blue-950">Principal</span>
          </div>
          <div className="border-t border-slate-300 pt-1">
            <span className="font-bold text-slate-800 uppercase block">Headmaster / Principal</span>
          </div>
        </div>
      </div>
    </div>
  )
}
