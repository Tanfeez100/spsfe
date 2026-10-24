import React from 'react'
import schoolLogo from '../../../assets/logo.png'
import stampcert from '../../../assets/stampcert.png'
import { SAMPLE_TC_DATA } from '../../../constants/documentTemplateRegistry'

export default function ElegantBorderTc({
  student = {},
  tcData = {},
  customization = {},
  id,
}) {
  const data = { ...SAMPLE_TC_DATA, ...tcData }
  const pupilName = student.Name || student.name || data.pupilName
  const fatherName = student.father_name || student.FatherName || data.fatherName
  const rawClass = student.Class || student.class || data.lastClassAttended
  const admissionNo = student.admission_number || student.admissionNo || data.admissionNo
  const dobFigure = student.date_of_birth || student.dob || data.dobFigure

  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const prefixNo = customization.prefixNo || data.tcNo || 'TC/2026/0142'
  const primaryColor = customization.primaryColor || '#92400e'

  return (
    <div
      id={id || `elegant-border-tc-${admissionNo}`}
      className="sps-document-sheet w-full max-w-[820px] min-h-[1140px] bg-[#fffefb] border-8 border-double border-amber-900/60 p-8 text-slate-900 shadow-2xl mx-auto flex flex-col justify-between relative"
      style={{ fontFamily: "'Cinzel', 'Times New Roman', serif" }}
    >
      {/* Corner Ornaments */}
      <div className="absolute top-2 left-2 text-amber-700/60 text-2xl">❖</div>
      <div className="absolute top-2 right-2 text-amber-700/60 text-2xl">❖</div>
      <div className="absolute bottom-2 left-2 text-amber-700/60 text-2xl">❖</div>
      <div className="absolute bottom-2 right-2 text-amber-700/60 text-2xl">❖</div>

      <div className="border border-amber-700/40 p-6 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="text-center pb-4 border-b border-amber-700/40">
            <img src={schoolLogo} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-2" />
            <h1 className="text-2xl font-bold uppercase tracking-widest text-amber-950">
              {schoolName}
            </h1>
            <p className="text-xs uppercase tracking-wider text-slate-600 font-sans mt-0.5">
              Bettiah, West Champaran, Bihar · Established 2018
            </p>
            <div className="mt-3">
              <span className="text-lg font-bold tracking-widest uppercase text-amber-900 border-y border-amber-900/30 py-1 px-8 inline-block">
                CERTIFICATE OF TRANSFER
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 mt-2">Registration No: {prefixNo} · S.R. #{admissionNo}</p>
          </div>

          {/* Elegant Proclamation */}
          <div className="mt-6 text-sm leading-relaxed text-slate-800 space-y-4 px-2">
            <p>
              This is to formally certify that <strong className="text-base text-slate-950 uppercase border-b border-slate-400 pb-0.5 px-2">{pupilName}</strong>, 
              son/daughter of <strong className="text-slate-950 border-b border-slate-400 pb-0.5 px-2">{fatherName}</strong>, 
              was admitted to this institution on <strong className="font-mono">{data.dateOfFirstAdmission}</strong> and has successfully completed his/her academic tenure in <strong className="border-b border-slate-400 px-2">Class {rawClass}</strong>.
            </p>

            <div className="bg-amber-50/40 border border-amber-700/20 p-4 rounded-lg space-y-2 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-slate-500">Date of Birth:</span> <strong className="font-mono text-slate-900">{dobFigure}</strong></div>
                <div><span className="text-slate-500">Annual Evaluation:</span> <strong className="text-slate-900">{data.schoolBoardResult}</strong></div>
                <div><span className="text-slate-500">Subjects Studied:</span> <span className="font-semibold text-slate-900">{data.subjectsStudied}</span></div>
                <div><span className="text-slate-500">Total Attendance:</span> <strong className="text-slate-900">{data.totalPresentDays} of {data.totalWorkingDays} Days</strong></div>
                <div><span className="text-slate-500">School Dues:</span> <span className="text-emerald-800 font-bold">{data.feesPaidUpto}</span></div>
                <div><span className="text-slate-500">General Conduct:</span> <strong className="text-emerald-800">{data.generalConduct}</strong></div>
              </div>
            </div>

            <p>
              He / She bears good moral conduct. The reason for leaving the school is recorded as: <strong className="italic text-slate-950 font-sans">{data.leavingReason}</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-amber-700/30 grid grid-cols-3 gap-6 text-center text-xs font-sans">
          <div>
            <div className="h-10 border-b border-slate-400 mb-1 flex items-end justify-center font-mono text-[11px] text-slate-400">
              Verified
            </div>
            <span className="font-bold uppercase text-[10px] text-slate-700">Administrative Incharge</span>
          </div>

          <div>
            <div className="h-10 flex items-center justify-center">
              <img src={stampcert} alt="Seal" className="h-12 object-contain opacity-75" />
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span className="font-bold uppercase text-[10px] text-slate-700">Official Seal</span>
            </div>
          </div>

          <div>
            <div className="h-10 border-b border-slate-400 mb-1 flex items-end justify-center font-serif italic text-base font-bold text-amber-950">
              Principal
            </div>
            <span className="font-bold uppercase text-[10px] text-slate-700">Principal Signature</span>
          </div>
        </div>
      </div>
    </div>
  )
}
