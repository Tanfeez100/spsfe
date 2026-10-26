import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import { SAMPLE_EXAM_TIMETABLE } from '../../../constants/documentTemplateRegistry'

export default function ModernBlueHallTicket({
  student = {},
  timetable = SAMPLE_EXAM_TIMETABLE,
  customization = {},
  id,
}) {
  const studentName = student.Name || student.name || '—'
  const fatherName = student.father_name || student.FatherName || student.fatherName || '—'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '—').toString()
  const rawClass = (student.Class || student.class || '—').toString()
  const studentSection = (student.Section || student.section || '—').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || '—'
  const dob = student.date_of_birth || student.dob || '—'
  const photo = student.PhotoUrl || student.photoUrl || student.photo_url || student.photo || student.image || null

  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const tagline = customization.tagline || 'Affiliated to State Board | Bettiah, West Champaran'
  const examName = customization.examName || 'ANNUAL EXAMINATION 2026-27'
  const session = customization.session || '2026-2027'
  const centerName = customization.centerName || 'Star Public School Campus - Examination Hall (Center Code: 845438)'
  const reportingTime = customization.reportingTime || '08:30 AM'
  const primaryColor = customization.primaryColor || '#0f2b5c'
  const controllerSignLabel = customization.controllerSignLabel || 'Controller of Examinations'
  const instructions = customization.instructions || [
    'Candidates must occupy their seats 15 minutes before the examination commences.',
    'Entry into the examination hall is permitted strictly upon showing this Admit Card and Student ID.',
    'Mobile phones, calculators, electronic watches, and unauthorized material are strictly prohibited.',
    'Write your Roll Number & Paper Code accurately on the first page of the answer booklet.',
  ]

  const [qrDataUrl, setQrDataUrl] = useState('')
  useEffect(() => {
    let isCurrent = true
    const qrPayload = `ADMIT CARD - ${schoolName}\nExam: ${examName}\nCandidate: ${studentName}\nRoll: ${rollNo} | Class: ${rawClass}-${studentSection}\nAdm: ${admissionNo}\nCenter: ${centerName}`
    QRCode.toDataURL(qrPayload, { margin: 1, width: 200, errorCorrectionLevel: 'L' })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => {})
    return () => { isCurrent = false }
  }, [studentName, rollNo, rawClass, examName])

  return (
    <div
      id={id || `admit-card-modern-blue-${rollNo}`}
      className="sps-document-sheet w-full max-w-[800px] min-h-[1100px] bg-white border border-slate-300 p-8 text-slate-900 shadow-xl rounded-xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* 1. Header with Logo & Exam Title */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b-2" style={{ borderColor: primaryColor }}>
          <div className="flex items-center gap-4">
            <img src={schoolLogo} alt="Logo" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: primaryColor }}>
                {schoolName}
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">{tagline}</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">ACADEMIC SESSION: {session}</p>
            </div>
          </div>
          <div className="text-right">
            <span
              className="inline-block px-4 py-1.5 rounded-lg text-white font-black text-sm uppercase tracking-wider shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              HALL TICKET
            </span>
            <p className="text-[11px] font-mono text-slate-500 mt-1">ADMIT NO: {admissionNo}</p>
          </div>
        </div>

        {/* Exam Title Banner */}
        <div className="my-4 py-2 px-4 rounded-lg bg-blue-50/80 border border-blue-200 text-center">
          <h2 className="text-base font-extrabold tracking-wide uppercase" style={{ color: primaryColor }}>
            {examName}
          </h2>
        </div>

        {/* 2. Candidate Information Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/60 items-center">
          {/* Photo */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-28 rounded-lg border-2 border-slate-300 bg-white p-0.5 overflow-hidden shadow-xs flex items-center justify-center">
              {photo ? (
                <img src={photo} alt={studentName} className="w-full h-full object-cover rounded" />
              ) : (
                <span className="material-symbols-outlined text-5xl text-slate-400">person</span>
              )}
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Candidate Photo</span>
          </div>

          {/* Candidate Details */}
          <div className="md:col-span-2 space-y-1.5 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Candidate's Full Name</span>
              <span className="text-sm font-black text-slate-900">{studentName}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Class & Section</span>
                <span className="font-bold text-slate-900">Class {rawClass} - Sec {studentSection}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Roll Number</span>
                <span className="font-black text-slate-900 font-mono text-sm">#{rollNo}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Father's Name</span>
                <span className="font-semibold text-slate-800 truncate block">{fatherName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Date of Birth</span>
                <span className="font-mono text-slate-800">{dob}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Examination Center</span>
              <span className="font-semibold text-slate-800 text-[11px]">{centerName}</span>
            </div>
          </div>

          {/* QR Verification & Reporting Time */}
          <div className="flex flex-col items-center justify-center border-l border-slate-200 pl-2">
            <div className="w-20 h-20 p-1 bg-white border border-slate-300 rounded-lg shadow-2xs">
              {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />}
            </div>
            <span className="text-[9px] font-bold text-slate-600 mt-1 uppercase">Official QR</span>
            <div className="mt-2 bg-amber-50 border border-amber-300 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold text-center">
              Gate: {reportingTime}
            </div>
          </div>
        </div>

        {/* 3. Examination Timetable Table */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              Subject-Wise Examination Schedule
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Reporting Time: 15 Mins Prior</span>
          </div>

          <div className="overflow-hidden border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Date & Day</th>
                  <th className="py-2.5 px-2">Code</th>
                  <th className="py-2.5 px-3">Subject Name</th>
                  <th className="py-2.5 px-3">Timing</th>
                  <th className="py-2.5 px-3">Room / Hall</th>
                  <th className="py-2.5 px-3 text-center">Invigilator Sign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timetable.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2 px-3 font-semibold text-slate-900">{row.date} ({row.day})</td>
                    <td className="py-2 px-2 font-mono text-slate-500">{row.code}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{row.subject}</td>
                    <td className="py-2 px-3 text-slate-700 font-mono text-[11px]">{row.time}</td>
                    <td className="py-2 px-3 text-slate-600">{row.room || 'Main Hall'}</td>
                    <td className="py-2 px-3 border-l border-slate-100 text-center text-slate-300">__________</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Important Instructions for Candidate */}
        <div className="mt-5 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <h4 className="font-black text-slate-900 uppercase text-[11px] mb-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-blue-600">info</span>
            Important Instructions for Candidate
          </h4>
          <ul className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
            {instructions.map((ins, i) => (
              <li key={i}>{ins}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. Footer Signatures */}
      <div className="pt-8 border-t border-slate-200 mt-6 grid grid-cols-3 gap-4 text-center text-xs">
        <div>
          <div className="h-10 flex items-end justify-center pb-1">
            <span className="text-[11px] text-slate-400 font-mono italic">Candidate Sign</span>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <span className="text-[11px] font-bold text-slate-800 uppercase block">Candidate's Signature</span>
            <span className="text-[9px] text-slate-400">(In presence of Invigilator)</span>
          </div>
        </div>

        <div>
          <div className="h-10 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[8px] text-slate-400 uppercase text-center font-bold">
              School Seal
            </div>
          </div>
          <div className="border-t border-slate-400 pt-1 mt-1">
            <span className="text-[11px] font-bold text-slate-800 uppercase block">Official School Stamp</span>
          </div>
        </div>

        <div>
          <div className="h-10 flex items-end justify-center pb-1">
            <span className="font-serif italic font-bold text-lg text-blue-950">Examination Incharge</span>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <span className="text-[11px] font-bold text-slate-800 uppercase block">{controllerSignLabel}</span>
            <span className="text-[9px] text-slate-400">Star Public School</span>
          </div>
        </div>
      </div>
    </div>
  )
}
