import React from 'react'
import schoolLogo from '../../../assets/logo.png'
import stampcert from '../../../assets/stampcert.png'
import { SAMPLE_TC_DATA } from '../../../constants/documentTemplateRegistry'

export default function PremiumInstitutionalTc({
  student = {},
  tcData = {},
  customization = {},
  id,
}) {
  const data = { ...SAMPLE_TC_DATA, ...tcData }
  const pupilName = student.Name || student.name || data.pupilName
  const fatherName = student.father_name || student.FatherName || data.fatherName
  const motherName = student.mother_name || student.MotherName || data.motherName
  const rawClass = student.Class || student.class || data.lastClassAttended
  const admissionNo = student.admission_number || student.admissionNo || data.admissionNo
  const dobFigure = student.date_of_birth || student.dob || data.dobFigure

  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const affiliationNo = customization.affiliationNo || 'SPS/BIH/2018/094'
  const prefixNo = customization.prefixNo || data.tcNo || 'TC/2026/0142'

  return (
    <div
      id={id || `premium-inst-tc-${admissionNo}`}
      className="sps-document-sheet w-full max-w-[820px] min-h-[1140px] bg-white border-2 border-slate-900 p-8 text-slate-900 shadow-2xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Cinzel', 'Times New Roman', serif" }}
    >
      <div className="border border-slate-300 p-6 flex flex-col justify-between h-full bg-[radial-gradient(#071d3f_0.5px,transparent_0.5px)] [background-size:24px_24px] bg-opacity-5">
        <div>
          {/* Executive Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img src={schoolLogo} alt="Logo" className="w-16 h-16 object-contain" />
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-950">
                  {schoolName}
                </h1>
                <p className="text-xs uppercase font-sans text-slate-600 font-semibold tracking-widest mt-0.5">
                  Institutional Record of Academic Transfer
                </p>
                <p className="text-[11px] font-sans text-slate-500">Bettiah, West Champaran · Affiliation: {affiliationNo}</p>
              </div>
            </div>
            <div className="inline-block bg-slate-950 text-amber-300 font-sans font-black text-xs uppercase px-5 py-1 tracking-widest rounded-sm">
              Official Transfer Certificate
            </div>
            <div className="flex justify-between items-center text-xs font-sans text-slate-600 mt-3 px-2">
              <span>Serial No: <strong className="font-mono text-slate-900">{prefixNo}</strong></span>
              <span>Scholar Ref: <strong className="font-mono text-slate-900">{admissionNo}</strong></span>
              <span>Issue Date: <strong className="font-mono text-slate-900">{data.issueDate}</strong></span>
            </div>
          </div>

          {/* Formal Certified Narrative */}
          <div className="mt-6 text-sm leading-loose text-slate-800 space-y-4 font-serif px-2">
            <p className="text-justify indent-8">
              This official parchment certifies that <strong className="text-slate-950 font-bold uppercase tracking-wide border-b border-slate-400 pb-0.5 px-2">{pupilName}</strong>, 
              born on <strong className="font-mono border-b border-slate-400 pb-0.5 px-1">{dobFigure}</strong> ({data.dobWords}), 
              child of Shri <strong className="text-slate-950 border-b border-slate-400 pb-0.5 px-2">{fatherName}</strong> 
              and Smt. <strong className="text-slate-950 border-b border-slate-400 pb-0.5 px-2">{motherName}</strong>, 
              was a verified pupil of this institution.
            </p>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg font-sans text-xs space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-slate-500 font-medium">Last Grade Attended:</span> <strong className="text-slate-900 ml-1">Class {rawClass}</strong></div>
                <div><span className="text-slate-500 font-medium">Evaluation Outcome:</span> <strong className="text-slate-900 ml-1">{data.schoolBoardResult}</strong></div>
                <div><span className="text-slate-500 font-medium">Curriculum Studied:</span> <span className="text-slate-800 ml-1">{data.subjectsStudied}</span></div>
                <div><span className="text-slate-500 font-medium">Fee Clearance:</span> <strong className="text-emerald-700 ml-1">{data.feesPaidUpto}</strong></div>
                <div><span className="text-slate-500 font-medium">Working Days Record:</span> <strong className="text-slate-900 ml-1">{data.totalPresentDays} / {data.totalWorkingDays} Days</strong></div>
                <div><span className="text-slate-500 font-medium">Moral Conduct:</span> <strong className="text-emerald-700 ml-1">{data.generalConduct}</strong></div>
              </div>
            </div>

            <p className="text-justify indent-8">
              All institutional dues and library securities have been discharged in full. The pupil is hereby granted academic transfer on grounds of: <strong className="font-sans text-slate-950 font-bold">{data.leavingReason}</strong>.
            </p>
          </div>
        </div>

        {/* Executive Triple Signatures */}
        <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs font-sans">
          <div>
            <div className="h-10 flex items-end justify-center pb-1">
              <span className="font-mono text-slate-400 text-[11px]">Registrar Initial</span>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span className="font-bold text-slate-800 uppercase block">Office Registrar</span>
            </div>
          </div>

          <div>
            <div className="h-10 flex items-center justify-center">
              <img src={stampcert} alt="Seal" className="h-12 object-contain opacity-85" />
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span className="font-bold text-slate-800 uppercase block">School Stamp</span>
            </div>
          </div>

          <div>
            <div className="h-10 flex items-end justify-center pb-1">
              <span className="font-serif italic font-bold text-lg text-slate-950">Principal</span>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span className="font-bold text-slate-800 uppercase block">Principal / Headmaster</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
