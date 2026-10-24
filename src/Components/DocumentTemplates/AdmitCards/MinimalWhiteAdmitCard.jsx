import React from 'react'
import schoolLogo from '../../../assets/logo.png'
import { SAMPLE_EXAM_TIMETABLE } from '../../../constants/documentTemplateRegistry'

export default function MinimalWhiteAdmitCard({
  student = {},
  timetable = SAMPLE_EXAM_TIMETABLE,
  customization = {},
  id,
}) {
  const studentName = student.Name || student.name || 'Student Name'
  const fatherName = student.father_name || student.FatherName || student.fatherName || 'Father Name'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '00').toString()
  const rawClass = (student.Class || student.class || '10').toString()
  const studentSection = (student.Section || student.section || 'A').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || `SPS-2024-${rollNo.padStart(3, '0')}`
  const photo = student.PhotoUrl || student.photoUrl || student.photo_url || student.photo || student.image || null

  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const examName = customization.examName || 'ANNUAL EXAMINATION 2026-27'
  const session = customization.session || '2026-2027'
  const centerName = customization.centerName || 'Main School Campus'

  return (
    <div
      id={id || `minimal-white-admit-card-${rollNo}`}
      className="sps-document-sheet w-full max-w-[800px] min-h-[1100px] bg-white border border-slate-300 p-8 text-slate-900 shadow-xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div>
        {/* Minimal Clean Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <img src={schoolLogo} alt="Logo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">{schoolName}</h1>
              <p className="text-xs text-slate-500 font-medium">Bettiah, West Champaran · Session {session}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black uppercase tracking-wider bg-slate-900 text-white px-3 py-1 rounded">
              ADMIT CARD
            </span>
          </div>
        </div>

        <div className="my-3 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">{examName}</h2>
        </div>

        {/* Candidate Details */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="w-20 h-24 bg-white border border-slate-300 rounded overflow-hidden shrink-0 flex items-center justify-center">
            {photo ? (
              <img src={photo} alt={studentName} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-4xl text-slate-300">person</span>
            )}
          </div>

          <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-400 font-medium block text-[10px]">CANDIDATE</span>
              <span className="font-bold text-slate-900 text-sm">{studentName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px]">ROLL NUMBER</span>
              <span className="font-black text-slate-900 font-mono text-sm">#{rollNo}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px]">CLASS & SEC</span>
              <span className="font-bold text-slate-900">Class {rawClass} ({studentSection})</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px]">ADMISSION NO</span>
              <span className="font-mono text-slate-700">{admissionNo}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px]">FATHER'S NAME</span>
              <span className="text-slate-800 truncate block">{fatherName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px]">EXAM CENTER</span>
              <span className="text-slate-800 truncate block">{centerName}</span>
            </div>
          </div>
        </div>

        {/* Timetable */}
        <div className="mt-5">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-2 border-b border-slate-200">Date & Day</th>
                <th className="p-2 border-b border-slate-200">Code</th>
                <th className="p-2 border-b border-slate-200">Subject</th>
                <th className="p-2 border-b border-slate-200">Time</th>
                <th className="p-2 border-b border-slate-200 text-center">Invigilator Sign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {timetable.map((row, idx) => (
                <tr key={idx}>
                  <td className="p-2 font-semibold">{row.date} ({row.day})</td>
                  <td className="p-2 font-mono text-slate-500">{row.code}</td>
                  <td className="p-2 font-bold text-slate-900">{row.subject}</td>
                  <td className="p-2 text-slate-600 font-mono text-[11px]">{row.time}</td>
                  <td className="p-2 text-center text-slate-300">_________</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Simple Note */}
        <div className="mt-4 p-2 text-[11px] text-slate-500 border-l-2 border-slate-900">
          <p>Please report 15 minutes before the exam time. Carry necessary stationery items only.</p>
        </div>
      </div>

      {/* Clean Footer Signatures */}
      <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
        <div className="text-center">
          <div className="h-8 border-b border-slate-300 mb-1" />
          <span className="text-slate-600 uppercase text-[10px] font-bold">Candidate's Signature</span>
        </div>
        <div className="text-center">
          <div className="h-8 border-b border-slate-300 mb-1 font-serif italic text-base text-slate-900 font-bold">
            Principal
          </div>
          <span className="text-slate-600 uppercase text-[10px] font-bold">Principal / Controller</span>
        </div>
      </div>
    </div>
  )
}
