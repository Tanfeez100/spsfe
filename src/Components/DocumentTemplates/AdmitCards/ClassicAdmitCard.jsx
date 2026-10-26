import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import { SAMPLE_EXAM_TIMETABLE } from '../../../constants/documentTemplateRegistry'

export default function ClassicAdmitCard({
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
  const centerName = customization.centerName || 'Star Public School Main Campus, Bettiah'
  const controllerSignLabel = customization.controllerSignLabel || 'Controller of Examination'

  const [qrDataUrl, setQrDataUrl] = useState('')
  useEffect(() => {
    let isCurrent = true
    QRCode.toDataURL(`ADMIT_CARD:${rollNo}:${studentName}:${examName}`, { margin: 1, width: 160 })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => {})
    return () => { isCurrent = false }
  }, [studentName, rollNo, examName])

  return (
    <div
      id={id || `classic-admit-card-${rollNo}`}
      className="sps-document-sheet w-full max-w-[800px] min-h-[1100px] bg-white border-2 border-slate-800 p-8 text-slate-900 shadow-xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* Outer Border Decor */}
      <div className="border border-slate-400 p-6 flex flex-col justify-between h-full">
        {/* Header */}
        <div>
          <div className="text-center pb-3 border-b-2 border-slate-900">
            <div className="flex items-center justify-center gap-3 mb-1">
              <img src={schoolLogo} alt="Logo" className="w-14 h-14 object-contain" />
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-tight">{schoolName}</h1>
                <p className="text-xs text-slate-600 font-sans">BETTIAH, WEST CHAMPARAN, BIHAR</p>
              </div>
            </div>
            <div className="inline-block border border-slate-800 px-4 py-0.5 mt-1 font-bold text-sm tracking-wider uppercase">
              EXAMINATION ADMIT CARD · SESSION {session}
            </div>
            <p className="text-sm font-bold text-slate-800 mt-1 uppercase tracking-wide">{examName}</p>
          </div>

          {/* Candidate Grid */}
          <div className="mt-4 flex gap-4 items-center border border-slate-300 p-3 bg-slate-50/50">
            <div className="w-24 h-28 border border-slate-400 bg-white p-0.5 flex items-center justify-center shrink-0">
              {photo ? (
                <img src={photo} alt={studentName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-slate-400 font-sans text-center">Affix Passport Photo</span>
              )}
            </div>

            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-sans">
              <div>
                <span className="text-slate-500 font-medium">Candidate Name:</span>
                <p className="font-bold text-slate-900 text-sm">{studentName}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Roll Number:</span>
                <p className="font-black text-slate-900 text-sm font-mono">#{rollNo}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Class & Section:</span>
                <p className="font-bold text-slate-900">Class {rawClass} (Section {studentSection})</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Admission No:</span>
                <p className="font-bold text-slate-900 font-mono">{admissionNo}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Father's Name:</span>
                <p className="font-semibold text-slate-800">{fatherName}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Date of Birth:</span>
                <p className="font-semibold text-slate-800 font-mono">{dob}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 font-medium">Center of Examination:</span>
                <p className="font-semibold text-slate-800">{centerName}</p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center">
              <div className="w-18 h-18 p-0.5 border border-slate-400 bg-white">
                {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />}
              </div>
              <span className="text-[8px] font-sans text-slate-500 mt-1 uppercase">Official</span>
            </div>
          </div>

          {/* Timetable */}
          <div className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-1 font-sans">Subject Schedule:</h3>
            <table className="w-full text-left text-xs font-sans border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400 text-[10.5px]">
                  <th className="border-r border-slate-400 p-2">Date</th>
                  <th className="border-r border-slate-400 p-2">Day</th>
                  <th className="border-r border-slate-400 p-2">Code</th>
                  <th className="border-r border-slate-400 p-2">Subject Name</th>
                  <th className="border-r border-slate-400 p-2">Timing</th>
                  <th className="p-2 text-center">Invigilator Sign</th>
                </tr>
              </thead>
              <tbody>
                {timetable.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-300">
                    <td className="border-r border-slate-300 p-1.5 font-medium">{row.date}</td>
                    <td className="border-r border-slate-300 p-1.5">{row.day}</td>
                    <td className="border-r border-slate-300 p-1.5 font-mono">{row.code}</td>
                    <td className="border-r border-slate-300 p-1.5 font-bold">{row.subject}</td>
                    <td className="border-r border-slate-300 p-1.5 font-mono text-[11px]">{row.time}</td>
                    <td className="p-1.5 text-center text-slate-300">___________</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Guidelines */}
          <div className="mt-4 p-2.5 border border-slate-300 font-sans text-[11px] text-slate-700 bg-slate-50">
            <p className="font-bold text-slate-900 mb-0.5 uppercase">Instructions to the Examinee:</p>
            <p>1. Must carry this Admit Card & school uniform to the examination hall daily.</p>
            <p>2. No candidate shall be permitted to enter 15 minutes after paper commencement.</p>
            <p>3. Adoption of unfair means will lead to immediate cancellation of candidature.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs font-sans">
          <div>
            <div className="h-8 border-b border-slate-500 mb-1" />
            <span className="font-bold uppercase text-[10px] text-slate-800">Candidate Signature</span>
          </div>
          <div>
            <div className="h-8 border-b border-slate-500 mb-1 flex items-center justify-center text-[10px] text-slate-400">
              Seal
            </div>
            <span className="font-bold uppercase text-[10px] text-slate-800">School Stamp</span>
          </div>
          <div>
            <div className="h-8 border-b border-slate-500 mb-1 flex items-end justify-center font-serif italic text-base">
              Controller
            </div>
            <span className="font-bold uppercase text-[10px] text-slate-800">{controllerSignLabel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
