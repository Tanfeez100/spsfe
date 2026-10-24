import React from 'react'
import schoolLogo from '../../../assets/logo.png'
import stampcert from '../../../assets/stampcert.png'
import { SAMPLE_TC_DATA } from '../../../constants/documentTemplateRegistry'

export default function ModernFormalTc({
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
  const schoolCode = customization.schoolCode || '845438'
  const prefixNo = customization.prefixNo || data.tcNo || 'TC/2026/0142'
  const primaryColor = customization.primaryColor || '#0f2b5c'
  const principalSignLabel = customization.principalSignLabel || 'Principal (Head of School)'

  return (
    <div
      id={id || `modern-formal-tc-${admissionNo}`}
      className="sps-document-sheet w-full max-w-[820px] min-h-[1140px] bg-white border border-slate-300 p-8 text-slate-900 shadow-xl rounded-xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div>
        {/* Top Header Bar */}
        <div className="rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#0f2b5c] text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/10 p-2 flex items-center justify-center border border-white/20">
                <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-white">{schoolName}</h1>
                <p className="text-xs text-blue-200 mt-0.5">Senior Secondary Institution · Bettiah, West Champaran</p>
                <p className="text-[11px] text-blue-300">Affiliation No: {affiliationNo} · School Code: {schoolCode}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-amber-400 text-slate-950 font-black text-xs uppercase px-3 py-1 rounded shadow-xs">
                OFFICIAL RECORD
              </span>
              <p className="text-[11px] font-mono text-blue-200 mt-1.5">No: {prefixNo}</p>
            </div>
          </div>
          <div className="bg-amber-400 h-1.5" />
        </div>

        {/* Certificate Title */}
        <div className="text-center my-6">
          <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
            TRANSFER CERTIFICATE
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Issued upon withdrawal / completion of schooling tenure</p>
        </div>

        {/* Student Highlight Banner */}
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-blue-900 tracking-wider">Student Name</span>
            <h3 className="text-lg font-black text-slate-950 uppercase">{pupilName}</h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-blue-900 tracking-wider">Admission / Scholar No</span>
            <p className="text-sm font-black font-mono text-slate-900">{admissionNo}</p>
          </div>
        </div>

        {/* Structured Grid Table */}
        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-2xs text-xs">
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-2 p-3 bg-white">
              <div><span className="text-slate-500 font-medium">Father's / Guardian's Name:</span> <strong className="text-slate-900 ml-1">{fatherName}</strong></div>
              <div><span className="text-slate-500 font-medium">Mother's Name:</span> <strong className="text-slate-900 ml-1">{motherName}</strong></div>
            </div>
            <div className="grid grid-cols-2 p-3 bg-slate-50/50">
              <div><span className="text-slate-500 font-medium">Nationality:</span> <strong className="text-slate-900 ml-1">{data.nationality}</strong></div>
              <div><span className="text-slate-500 font-medium">Social Category:</span> <strong className="text-slate-900 ml-1">{data.casteCategory}</strong></div>
            </div>
            <div className="grid grid-cols-2 p-3 bg-white">
              <div><span className="text-slate-500 font-medium">Date of Birth (Figures):</span> <strong className="text-slate-900 font-mono ml-1">{dobFigure}</strong></div>
              <div><span className="text-slate-500 font-medium">Date of Birth (Words):</span> <em className="text-slate-800 ml-1">{data.dobWords}</em></div>
            </div>
            <div className="grid grid-cols-2 p-3 bg-slate-50/50">
              <div><span className="text-slate-500 font-medium">Date of Admission:</span> <strong className="text-slate-900 ml-1">{data.dateOfFirstAdmission}</strong></div>
              <div><span className="text-slate-500 font-medium">Class in which Admitted:</span> <strong className="text-slate-900 ml-1">{data.firstAdmissionClass}</strong></div>
            </div>
            <div className="grid grid-cols-2 p-3 bg-white">
              <div><span className="text-slate-500 font-medium">Class Last Studied:</span> <strong className="text-slate-900 ml-1">Class {rawClass}</strong></div>
              <div><span className="text-slate-500 font-medium">Annual Result Status:</span> <strong className="text-slate-900 ml-1">{data.schoolBoardResult}</strong></div>
            </div>
            <div className="p-3 bg-slate-50/50">
              <span className="text-slate-500 font-medium">Subjects Studied:</span> <strong className="text-slate-900 ml-1">{data.subjectsStudied}</strong>
            </div>
            <div className="grid grid-cols-2 p-3 bg-white">
              <div><span className="text-slate-500 font-medium">Qualified for Promotion:</span> <strong className="text-emerald-700 ml-1">{data.whetherQualifiedPromotion}</strong></div>
              <div><span className="text-slate-500 font-medium">School Dues Status:</span> <strong className="text-slate-900 ml-1">{data.feesPaidUpto}</strong></div>
            </div>
            <div className="grid grid-cols-2 p-3 bg-slate-50/50">
              <div><span className="text-slate-500 font-medium">Attendance Record:</span> <strong className="text-slate-900 ml-1">{data.totalPresentDays} / {data.totalWorkingDays} Days ({Math.round((data.totalPresentDays / data.totalWorkingDays) * 100)}%)</strong></div>
              <div><span className="text-slate-500 font-medium">General Conduct:</span> <strong className="text-emerald-700 ml-1">{data.generalConduct}</strong></div>
            </div>
            <div className="grid grid-cols-2 p-3 bg-white">
              <div><span className="text-slate-500 font-medium">Date of Application:</span> <span className="font-mono text-slate-800 ml-1">{data.applicationDate}</span></div>
              <div><span className="text-slate-500 font-medium">Date of Issue:</span> <strong className="font-mono text-slate-950 ml-1">{data.issueDate}</strong></div>
            </div>
            <div className="p-3 bg-amber-50/40">
              <span className="text-slate-600 font-bold">Reason for Leaving School:</span> <strong className="text-slate-950 ml-2">{data.leavingReason}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Footer Attestation */}
      <div className="pt-8 border-t border-slate-200 mt-6 grid grid-cols-3 gap-6 text-center text-xs">
        <div>
          <div className="h-10 flex items-end justify-center pb-1">
            <span className="text-slate-400 font-mono text-[11px]">Officer Sign</span>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <span className="font-bold text-slate-800 uppercase block">Prepared By</span>
          </div>
        </div>

        <div>
          <div className="h-10 flex items-center justify-center">
            <img src={stampcert} alt="Stamp" className="h-12 object-contain opacity-80" />
          </div>
          <div className="border-t border-slate-400 pt-1">
            <span className="font-bold text-slate-800 uppercase block">Verified (Checked By)</span>
          </div>
        </div>

        <div>
          <div className="h-10 flex items-end justify-center pb-1">
            <span className="font-serif italic font-bold text-lg text-blue-950">Principal</span>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <span className="font-bold text-slate-800 uppercase block">{principalSignLabel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
