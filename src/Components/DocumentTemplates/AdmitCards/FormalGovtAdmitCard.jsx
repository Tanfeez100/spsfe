import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import { SAMPLE_EXAM_TIMETABLE } from '../../../constants/documentTemplateRegistry'

export default function FormalGovtAdmitCard({
  student = {},
  timetable = SAMPLE_EXAM_TIMETABLE,
  customization = {},
  id,
}) {
  const studentName = student.Name || student.name || 'Student Name'
  const fatherName = student.father_name || student.FatherName || student.fatherName || 'Father Name'
  const motherName = student.mother_name || student.MotherName || 'Mother Name'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '00').toString()
  const rawClass = (student.Class || student.class || '10').toString()
  const studentSection = (student.Section || student.section || 'A').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || `SPS-2024-${rollNo.padStart(3, '0')}`
  const dob = student.date_of_birth || student.dob || '01/01/2012'
  const photo = student.PhotoUrl || student.photoUrl || student.photo_url || student.photo || student.image || null

  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const examName = customization.examName || 'SECONDARY SCHOOL ANNUAL EXAMINATION 2026-27'
  const session = customization.session || '2026-2027'
  const centerName = customization.centerName || 'Star Public School Main Campus (Code: 845438)'

  const [qrDataUrl, setQrDataUrl] = useState('')
  useEffect(() => {
    let isCurrent = true
    QRCode.toDataURL(`GOVT_FORMAT:${admissionNo}:${rollNo}:${studentName}`, { margin: 1, width: 180 })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => {})
    return () => { isCurrent = false }
  }, [studentName, rollNo, admissionNo])

  return (
    <div
      id={id || `formal-govt-admit-card-${rollNo}`}
      className="sps-document-sheet w-full max-w-[800px] min-h-[1100px] bg-white border border-slate-400 p-8 text-slate-900 shadow-xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Times New Roman', serif" }}
    >
      <div>
        {/* State Board Style Header */}
        <div className="text-center pb-3 border-b-2 border-slate-950">
          <div className="flex items-center justify-center gap-3">
            <img src={schoolLogo} alt="Logo" className="w-16 h-16 object-contain" />
            <div>
              <p className="text-xs uppercase tracking-widest font-sans font-bold text-slate-600">STATE RECOGNIZED INSTITUTION</p>
              <h1 className="text-2xl font-black uppercase tracking-tight">{schoolName}</h1>
              <p className="text-xs font-sans text-slate-700">WEST CHAMPARAN, BIHAR · AFFILIATION CODE: 2130894</p>
            </div>
          </div>
          <div className="mt-2 bg-slate-100 py-1 border-y border-slate-400">
            <h2 className="text-sm font-bold uppercase tracking-wider font-sans">{examName}</h2>
            <p className="text-xs font-sans text-slate-600">OFFICIAL ADMIT CARD & ENTRY PASS · SESSION {session}</p>
          </div>
        </div>

        {/* Detailed Verification Matrix */}
        <div className="mt-4 border border-slate-400 p-3 flex gap-4 items-center">
          <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-sans">
            <div>
              <span className="text-slate-500 font-bold block text-[10px]">CANDIDATE NAME:</span>
              <span className="font-black text-sm uppercase text-slate-900">{studentName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px]">ROLL NUMBER:</span>
              <span className="font-black text-sm font-mono text-slate-900">#{rollNo}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px]">FATHER'S NAME:</span>
              <span className="font-semibold text-slate-800 uppercase">{fatherName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px]">MOTHER'S NAME:</span>
              <span className="font-semibold text-slate-800 uppercase">{motherName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px]">CLASS / STREAM:</span>
              <span className="font-bold text-slate-900">Class {rawClass} (Sec {studentSection})</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px]">REGISTRATION / ADM NO:</span>
              <span className="font-mono font-bold text-slate-900">{admissionNo}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px]">DATE OF BIRTH:</span>
              <span className="font-mono font-bold text-slate-900">{dob}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px]">CENTER CODE & NAME:</span>
              <span className="font-semibold text-slate-800 text-[11px] truncate block">{centerName}</span>
            </div>
          </div>

          <div className="w-24 h-32 border-2 border-slate-500 p-0.5 bg-white shrink-0 flex flex-col items-center justify-center">
            {photo ? (
              <img src={photo} alt={studentName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[9px] text-slate-400 font-sans text-center">Affix Attested Photo</span>
            )}
          </div>
        </div>

        {/* Timetable Matrix */}
        <div className="mt-5">
          <p className="text-xs font-bold font-sans uppercase mb-1">PROGRAMME OF EXAMINATION:</p>
          <table className="w-full text-left text-xs font-sans border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-400 text-[10.5px]">
                <th className="border-r border-slate-400 p-2">Date of Exam</th>
                <th className="border-r border-slate-400 p-2">Subject Code</th>
                <th className="border-r border-slate-400 p-2">Subject Name</th>
                <th className="border-r border-slate-400 p-2">Time of Examination</th>
                <th className="p-2 text-center">Room No & Invigilator Initial</th>
              </tr>
            </thead>
            <tbody>
              {timetable.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-300">
                  <td className="border-r border-slate-300 p-1.5 font-bold">{row.date} ({row.day})</td>
                  <td className="border-r border-slate-300 p-1.5 font-mono">{row.code}</td>
                  <td className="border-r border-slate-300 p-1.5 font-bold">{row.subject}</td>
                  <td className="border-r border-slate-300 p-1.5 font-mono text-[11px]">{row.time}</td>
                  <td className="p-1.5 text-center text-slate-400 text-[10px]">Hall 1 · [ _________ ]</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Statutory Rules */}
        <div className="mt-4 border border-slate-400 p-2.5 bg-slate-50 text-[10.5px] font-sans text-slate-700 space-y-0.5">
          <p className="font-bold text-slate-900 uppercase">Statutory Regulations for Examinees:</p>
          <p>• The admit card is issued provisionally subject to fulfillment of school attendance eligibility norms.</p>
          <p>• Candidates must take their allotted desks 15 minutes prior to bell time. No entry permitted 10 minutes past commencement.</p>
          <p>• Use of unauthorized chits, unfair means, or tampering with answer script will result in debarment.</p>
        </div>
      </div>

      {/* Footer Attestation */}
      <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-4 gap-2 text-center text-xs font-sans items-end">
        <div>
          <div className="w-16 h-16 p-0.5 border border-slate-300 mx-auto">
            {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />}
          </div>
          <span className="text-[9px] font-bold text-slate-500 mt-1 block">Security QR</span>
        </div>
        <div>
          <div className="h-8 border-b border-slate-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-800 uppercase block">Candidate Sign</span>
        </div>
        <div>
          <div className="h-8 border-b border-slate-400 mb-1 flex items-center justify-center text-[9px] text-slate-400">
            [ Seal ]
          </div>
          <span className="text-[10px] font-bold text-slate-800 uppercase block">Center Superintendent</span>
        </div>
        <div>
          <div className="h-8 border-b border-slate-400 mb-1 flex items-end justify-center font-serif italic text-base">
            Principal
          </div>
          <span className="text-[10px] font-bold text-slate-800 uppercase block">Head of Institution</span>
        </div>
      </div>
    </div>
  )
}
