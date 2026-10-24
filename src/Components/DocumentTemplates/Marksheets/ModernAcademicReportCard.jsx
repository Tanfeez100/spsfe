import React from 'react'
import schoolLogo from '../../../assets/logo.png'
import stampcert from '../../../assets/stampcert.png'
import { SAMPLE_MARKS_DATA } from '../../../constants/documentTemplateRegistry'

export default function ModernAcademicReportCard({
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
  const examName = customization.examName || data.examName || 'Annual Evaluation & Progress Report'

  return (
    <div
      id={id || `modern-academic-report-${rollNo}`}
      className="sps-document-sheet w-full max-w-[820px] min-h-[1140px] bg-white border border-slate-300 p-8 text-slate-900 shadow-xl rounded-xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div>
        {/* Modern Navy Header */}
        <div className="rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#1e40af] text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/10 p-2 flex items-center justify-center border border-white/20">
                <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-white">{schoolName}</h1>
                <p className="text-xs text-blue-200 mt-0.5">Academic Evaluation & Student Progress Report</p>
                <p className="text-[11px] text-blue-300">Session {session} · Bettiah, West Champaran</p>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-amber-400 text-slate-950 font-black text-xs uppercase px-3 py-1 rounded shadow-xs">
                {examName}
              </span>
            </div>
          </div>
          <div className="bg-amber-400 h-1.5" />
        </div>

        {/* Student Info & Visual Percentage Circle */}
        <div className="my-5 p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="space-y-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">STUDENT PROFILE</span>
            <h2 className="text-lg font-black text-slate-900 uppercase">{studentName}</h2>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold">Class {rawClass} ({studentSection})</span>
              <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-mono font-bold">Roll #{rollNo}</span>
              <span className="text-slate-500 font-mono text-[11px]">Adm No: {admissionNo}</span>
            </div>
            <p className="text-slate-600 text-[11px] pt-1">
              <strong className="text-slate-800">Father's Name:</strong> {fatherName} · Attendance: <strong className="text-emerald-700">{data.attendance}</strong>
            </p>
          </div>

          {/* Percentage Circular Badge */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="w-18 h-18 rounded-full border-4 border-blue-600 flex flex-col items-center justify-center bg-white shadow-xs p-1">
              <span className="text-base font-black text-blue-900 leading-none">{data.percentage}%</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Score</span>
            </div>
            <div className="text-left text-xs">
              <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                {data.resultStatus}
              </span>
              <p className="font-bold text-slate-900 text-[11px] mt-1">{data.division}</p>
              <p className="text-[10px] text-blue-700 font-bold">Class Rank #{data.rank}</p>
            </div>
          </div>
        </div>

        {/* Modern Subjects Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 text-[10.5px] uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Subject Name</th>
                <th className="py-2.5 px-2 text-center">Max Marks</th>
                <th className="py-2.5 px-2 text-center">Theory</th>
                <th className="py-2.5 px-2 text-center">Practical</th>
                <th className="py-2.5 px-3 text-center">Total Marks</th>
                <th className="py-2.5 px-2 text-center">Grade</th>
                <th className="py-2.5 px-3 text-center">Performance Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.subjects.map((s, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                  <td className="py-2 px-3 font-bold text-slate-900">{s.subject}</td>
                  <td className="py-2 px-2 text-center font-mono text-slate-500">{s.maxMarks}</td>
                  <td className="py-2 px-2 text-center font-mono font-semibold">{s.theory}</td>
                  <td className="py-2 px-2 text-center font-mono text-slate-600">{s.practical}</td>
                  <td className="py-2 px-3 text-center font-mono font-black text-slate-950">{s.total}</td>
                  <td className="py-2 px-2 text-center">
                    <span className="bg-blue-50 text-blue-900 font-bold px-1.5 py-0.5 rounded text-[10px] border border-blue-200">
                      {s.grade}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden mx-auto">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(s.total / s.maxMarks) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/80 border-t border-slate-300 font-bold text-xs">
                <td className="py-2.5 px-3 text-slate-900 uppercase">Grand Total</td>
                <td className="py-2.5 px-2 text-center font-mono">{data.totalMaxMarks}</td>
                <td colSpan={2} className="text-right px-2 text-slate-500">Total Marks Scored:</td>
                <td className="py-2.5 px-3 text-center font-mono text-sm font-black text-slate-950">{data.totalObtained}</td>
                <td colSpan={2} className="py-2.5 px-3 text-center text-emerald-700 font-black">{data.percentage}% Aggregate</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Remarks Box */}
        <div className="mt-4 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Educator Remarks</span>
            <p className="font-semibold text-slate-800 text-[11px] mt-0.5">{data.remarks}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Promoted Status</span>
            <p className="font-black text-emerald-800 uppercase text-xs mt-0.5">Promoted to Next Class</p>
          </div>
        </div>
      </div>

      {/* Footer Signatures */}
      <div className="pt-8 border-t border-slate-200 mt-6 grid grid-cols-3 gap-6 text-center text-xs">
        <div>
          <div className="h-10 flex items-end justify-center pb-1">
            <span className="text-slate-400 font-mono text-[11px]">Class Teacher</span>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <span className="font-bold text-slate-800 uppercase block">Class Teacher</span>
          </div>
        </div>

        <div>
          <div className="h-10 flex items-center justify-center">
            <img src={stampcert} alt="Stamp" className="h-12 object-contain opacity-80" />
          </div>
          <div className="border-t border-slate-400 pt-1">
            <span className="font-bold text-slate-800 uppercase block">School Stamp</span>
          </div>
        </div>

        <div>
          <div className="h-10 flex items-end justify-center pb-1">
            <span className="font-serif italic font-bold text-lg text-blue-950">Principal</span>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <span className="font-bold text-slate-800 uppercase block">Principal Signature</span>
          </div>
        </div>
      </div>
    </div>
  )
}
