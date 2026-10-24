import React from 'react'
import schoolLogo from '../../../assets/logo.png'
import { SAMPLE_TC_DATA } from '../../../constants/documentTemplateRegistry'

export default function MinimalProfessionalTc({
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

  return (
    <div
      id={id || `minimal-tc-${admissionNo}`}
      className="sps-document-sheet w-full max-w-[820px] min-h-[1140px] bg-white border border-slate-300 p-8 text-slate-900 shadow-xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div>
        {/* Minimal Clean Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <img src={schoolLogo} alt="Logo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">{schoolName}</h1>
              <p className="text-xs text-slate-500 font-medium">Bettiah, West Champaran, Bihar</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black uppercase tracking-wider bg-slate-900 text-white px-3 py-1 rounded">
              TRANSFER CERTIFICATE
            </span>
            <p className="text-[11px] font-mono text-slate-500 mt-1">Ref: {prefixNo}</p>
          </div>
        </div>

        {/* Candidate Highlight */}
        <div className="my-5 p-3.5 border-l-4 border-slate-900 bg-slate-50">
          <span className="text-[10px] font-bold uppercase text-slate-400">STUDENT RECORD</span>
          <h2 className="text-lg font-black uppercase text-slate-900">{pupilName}</h2>
          <p className="text-xs text-slate-600 mt-0.5">S.R. No: <strong>{admissionNo}</strong> · Last Class Attended: <strong>Class {rawClass}</strong></p>
        </div>

        {/* Minimalist Data Table */}
        <div className="border border-slate-200 divide-y divide-slate-200 text-xs">
          <div className="grid grid-cols-2 p-2.5">
            <span className="text-slate-500">Father's Name:</span>
            <span className="font-bold text-slate-900">{fatherName}</span>
          </div>
          <div className="grid grid-cols-2 p-2.5 bg-slate-50/50">
            <span className="text-slate-500">Date of Birth:</span>
            <span className="font-mono font-bold text-slate-900">{dobFigure}</span>
          </div>
          <div className="grid grid-cols-2 p-2.5">
            <span className="text-slate-500">Date of First Admission:</span>
            <span className="font-medium text-slate-900">{data.dateOfFirstAdmission}</span>
          </div>
          <div className="grid grid-cols-2 p-2.5 bg-slate-50/50">
            <span className="text-slate-500">Annual Evaluation Status:</span>
            <span className="font-bold text-slate-900">{data.schoolBoardResult}</span>
          </div>
          <div className="grid grid-cols-2 p-2.5">
            <span className="text-slate-500">Subjects Studied:</span>
            <span className="text-slate-800">{data.subjectsStudied}</span>
          </div>
          <div className="grid grid-cols-2 p-2.5 bg-slate-50/50">
            <span className="text-slate-500">Dues Cleared Through:</span>
            <span className="font-bold text-emerald-800">{data.feesPaidUpto}</span>
          </div>
          <div className="grid grid-cols-2 p-2.5">
            <span className="text-slate-500">Total Working Days Present:</span>
            <span className="text-slate-900 font-medium">{data.totalPresentDays} / {data.totalWorkingDays}</span>
          </div>
          <div className="grid grid-cols-2 p-2.5 bg-slate-50/50">
            <span className="text-slate-500">Conduct & Character:</span>
            <span className="font-bold text-slate-900">{data.generalConduct}</span>
          </div>
          <div className="grid grid-cols-2 p-2.5">
            <span className="text-slate-500">Reason for Leaving:</span>
            <span className="font-bold text-slate-900">{data.leavingReason}</span>
          </div>
          <div className="grid grid-cols-2 p-2.5 bg-slate-50/50">
            <span className="text-slate-500">Date of Issue:</span>
            <span className="font-mono font-bold text-slate-900">{data.issueDate}</span>
          </div>
        </div>
      </div>

      {/* Clean Dual Signatures */}
      <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
        <div className="text-center">
          <div className="h-8 border-b border-slate-300 mb-1" />
          <span className="text-[10px] font-bold text-slate-600 uppercase">Prepared & Checked By</span>
        </div>
        <div className="text-center">
          <div className="h-8 border-b border-slate-300 mb-1 font-serif italic text-base text-slate-900 font-bold">
            Principal
          </div>
          <span className="text-[10px] font-bold text-slate-600 uppercase">Headmaster / Principal</span>
        </div>
      </div>
    </div>
  )
}
