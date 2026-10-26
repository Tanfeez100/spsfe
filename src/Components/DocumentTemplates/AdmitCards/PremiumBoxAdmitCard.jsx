import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import { SAMPLE_EXAM_TIMETABLE } from '../../../constants/documentTemplateRegistry'

export default function PremiumBoxAdmitCard({
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
  const examName = customization.examName || 'ANNUAL EXAMINATION 2026-27'
  const session = customization.session || '2026-2027'
  const centerName = customization.centerName || 'Star Public School Center - Bettiah'
  const primaryColor = customization.primaryColor || '#1e3a8a'

  const [qrDataUrl, setQrDataUrl] = useState('')
  useEffect(() => {
    let isCurrent = true
    QRCode.toDataURL(`BOX_ADMIT:${rollNo}:${studentName}`, { margin: 1, width: 160 })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => {})
    return () => { isCurrent = false }
  }, [studentName, rollNo])

  return (
    <div
      id={id || `premium-box-admit-card-${rollNo}`}
      className="sps-document-sheet w-full max-w-[800px] min-h-[1100px] bg-white border border-slate-300 p-7 text-slate-900 shadow-xl rounded-xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div>
        {/* Box 1: Header */}
        <div className="rounded-xl border border-slate-300 p-4 bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/10 rounded-lg p-1.5 border border-white/20 flex items-center justify-center">
              <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-white">{schoolName}</h1>
              <p className="text-xs text-blue-200 font-medium">Official Examination Hall Ticket · Session {session}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-amber-400 text-slate-950 text-xs font-black uppercase px-3 py-1 rounded shadow-xs">
              {examName}
            </span>
          </div>
        </div>

        {/* Box 2: Candidate & Center Info Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Candidate Card */}
          <div className="md:col-span-2 rounded-xl border border-slate-200 p-3.5 bg-slate-50/70 flex gap-3.5 items-center">
            <div className="w-20 h-24 rounded-lg border-2 border-slate-300 bg-white p-0.5 shrink-0 overflow-hidden shadow-xs flex items-center justify-center">
              {photo ? (
                <img src={photo} alt={studentName} className="w-full h-full object-cover rounded" />
              ) : (
                <span className="material-symbols-outlined text-4xl text-slate-400">person</span>
              )}
            </div>
            <div className="flex-1 space-y-1 text-xs">
              <h2 className="text-base font-black text-slate-900 leading-tight">{studentName}</h2>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold">Class {rawClass} ({studentSection})</span>
                <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-mono font-bold">Roll #{rollNo}</span>
              </div>
              <p className="text-slate-600 text-[11px]"><strong className="text-slate-800">Father:</strong> {fatherName}</p>
              <p className="text-slate-600 text-[11px]"><strong className="text-slate-800">Adm No:</strong> {admissionNo} · DOB: {dob}</p>
            </div>
          </div>

          {/* Center & QR Card */}
          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Allotted Center</span>
              <p className="font-bold text-slate-800 text-xs mt-0.5">{centerName}</p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 mt-2">
              <div className="text-[9px] text-slate-500">
                <p className="font-bold text-slate-900">VERIFIED ENTRY</p>
                <p>Gate: 08:30 AM</p>
              </div>
              <div className="w-12 h-12 p-0.5 bg-white border border-slate-300 rounded shadow-2xs">
                {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />}
              </div>
            </div>
          </div>
        </div>

        {/* Box 3: Timetable */}
        <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="bg-slate-100 p-2.5 px-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Examination Schedule</h3>
            <span className="text-[10px] text-slate-500 font-medium">Compulsory Subjects</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Date & Day</th>
                <th className="p-2.5">Code</th>
                <th className="p-2.5">Subject</th>
                <th className="p-2.5">Time</th>
                <th className="p-2.5 text-center">Invigilator Initial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timetable.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                  <td className="p-2.5 font-semibold text-slate-900">{row.date} ({row.day})</td>
                  <td className="p-2.5 font-mono text-slate-500">{row.code}</td>
                  <td className="p-2.5 font-bold text-slate-900">{row.subject}</td>
                  <td className="p-2.5 text-slate-700 font-mono text-[11px]">{row.time}</td>
                  <td className="p-2.5 text-center text-slate-300">__________</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Box 4: Exam Rules Box */}
        <div className="mt-4 rounded-xl border border-slate-200 p-3 bg-slate-50/50 text-[11px] text-slate-600">
          <h4 className="font-bold text-slate-900 uppercase text-[10.5px] mb-1">Key Hall Rules:</h4>
          <p>• Mandatory ID verification at gate. Strict silence must be maintained inside the exam hall.</p>
          <p>• No candidate may leave the hall until 1 hour has elapsed after commencement.</p>
        </div>
      </div>

      {/* Box 5: Signatures Footer */}
      <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
        <div>
          <div className="h-8 border-b border-slate-300 mb-1" />
          <span className="text-[10px] font-bold text-slate-700 uppercase">Candidate Signature</span>
        </div>
        <div>
          <div className="h-8 border-b border-slate-300 mb-1 flex items-center justify-center text-[10px] text-slate-400">
            [ Stamp ]
          </div>
          <span className="text-[10px] font-bold text-slate-700 uppercase">Center Seal</span>
        </div>
        <div>
          <div className="h-8 border-b border-slate-300 mb-1 font-serif italic text-base font-bold text-blue-950">
            Controller
          </div>
          <span className="text-[10px] font-bold text-slate-700 uppercase">Controller of Exams</span>
        </div>
      </div>
    </div>
  )
}
