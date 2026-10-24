import React from 'react'
import schoolLogo from '../../../assets/logo.png'
import stampcert from '../../../assets/stampcert.png'
import { SAMPLE_TC_DATA } from '../../../constants/documentTemplateRegistry'

export default function TraditionalOfficialTc({
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
  const bookNo = customization.bookNo || data.bookNo || '04'
  const prefixNo = customization.prefixNo || data.tcNo || 'TC/2026/0142'
  const preparedByLabel = customization.preparedByLabel || 'Prepared By (Office)'
  const verifiedByLabel = customization.verifiedByLabel || 'Checked By (Incharge)'
  const principalSignLabel = customization.principalSignLabel || 'Principal (with School Seal)'

  return (
    <div
      id={id || `traditional-tc-${admissionNo}`}
      className="sps-document-sheet w-full max-w-[820px] min-h-[1140px] bg-[#fffdfa] border-4 border-double border-slate-800 p-8 text-slate-900 shadow-xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Times New Roman', serif" }}
    >
      <div className="border border-slate-700 p-6 flex flex-col justify-between h-full relative">
        {/* Faint Center Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
          <img src={schoolLogo} alt="Watermark" className="w-[380px] h-[380px] object-contain" />
        </div>

        <div>
          {/* Top School Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900">
            <div className="flex items-center justify-center gap-4 mb-1">
              <img src={schoolLogo} alt="Logo" className="w-16 h-16 object-contain" />
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-950 font-serif">
                  {schoolName}
                </h1>
                <p className="text-xs uppercase font-sans font-medium text-slate-700 tracking-wide">
                  Main Road, Bettiah, West Champaran, Bihar - 845438
                </p>
                <div className="flex items-center justify-center gap-4 text-xs font-sans text-slate-600 mt-0.5">
                  <span>Affiliation No: <strong>{affiliationNo}</strong></span>
                  <span>·</span>
                  <span>School Code: <strong>{schoolCode}</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <span className="inline-block border-2 border-slate-900 px-6 py-1 text-base font-bold uppercase tracking-widest bg-amber-50/50">
                SCHOOL LEAVING / TRANSFER CERTIFICATE
              </span>
            </div>
          </div>

          {/* Book No & Serial Metadata */}
          <div className="flex items-center justify-between text-xs font-sans py-2.5 border-b border-slate-400 font-semibold text-slate-800">
            <div>Book No: <span className="font-mono font-bold text-slate-950">{bookNo}</span></div>
            <div>Certificate No: <span className="font-mono font-bold text-slate-950">{prefixNo}</span></div>
            <div>Admission / S.R. No: <span className="font-mono font-bold text-slate-950">{admissionNo}</span></div>
          </div>

          {/* 16 Official Numbered Clauses */}
          <div className="mt-4 space-y-2 text-xs font-serif leading-relaxed text-slate-900">
            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">1.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">Name of the Pupil:</span>
              <span className="flex-1 font-bold uppercase tracking-wide border-b border-dotted border-slate-500 pb-0.5">{pupilName}</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">2.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">Father's / Guardian's Name:</span>
              <span className="flex-1 font-bold uppercase border-b border-dotted border-slate-500 pb-0.5">{fatherName}</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">3.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">Mother's Name:</span>
              <span className="flex-1 font-bold uppercase border-b border-dotted border-slate-500 pb-0.5">{motherName}</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">4.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">Nationality & Category:</span>
              <span className="flex-1 font-semibold border-b border-dotted border-slate-500 pb-0.5">{data.nationality} · Category: {data.casteCategory}</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">5.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">Date of First Admission in School:</span>
              <span className="flex-1 font-semibold border-b border-dotted border-slate-500 pb-0.5">{data.dateOfFirstAdmission} with Class {data.firstAdmissionClass}</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">6.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">Date of Birth (in Christian Era):</span>
              <span className="flex-1 font-semibold border-b border-dotted border-slate-500 pb-0.5">
                (in figures) <strong className="font-mono">{dobFigure}</strong> · (in words) <em>{data.dobWords}</em>
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">7.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">Class in which the Pupil Last Studied:</span>
              <span className="flex-1 font-bold border-b border-dotted border-slate-500 pb-0.5">Class {rawClass}</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">8.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">School / Board Annual Examination Result:</span>
              <span className="flex-1 font-semibold border-b border-dotted border-slate-500 pb-0.5">{data.schoolBoardResult}</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">9.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">Whether Failed, if so once/twice:</span>
              <span className="flex-1 font-semibold border-b border-dotted border-slate-500 pb-0.5">{data.whetherFailed}</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">10.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">Subjects Studied:</span>
              <span className="flex-1 font-semibold border-b border-dotted border-slate-500 pb-0.5">{data.subjectsStudied}</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">11.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">Whether Qualified for Promotion:</span>
              <span className="flex-1 font-bold text-slate-900 border-b border-dotted border-slate-500 pb-0.5">{data.whetherQualifiedPromotion}</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">12.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">Month up to which School Dues Paid:</span>
              <span className="flex-1 font-semibold border-b border-dotted border-slate-500 pb-0.5">{data.feesPaidUpto}</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">13.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">Total No. of Working & Present Days:</span>
              <span className="flex-1 font-semibold border-b border-dotted border-slate-500 pb-0.5">{data.totalPresentDays} Days Present out of {data.totalWorkingDays} Total School Days</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">14.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">General Conduct & Character:</span>
              <span className="flex-1 font-bold text-emerald-800 border-b border-dotted border-slate-500 pb-0.5">{data.generalConduct}</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">15.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">Date of Application for Certificate:</span>
              <span className="flex-1 font-mono font-semibold border-b border-dotted border-slate-500 pb-0.5">{data.applicationDate} · Date of Issue: <strong>{data.issueDate}</strong></span>
            </div>

            <div className="flex items-baseline">
              <span className="w-6 shrink-0 font-bold">16.</span>
              <span className="w-64 shrink-0 font-medium text-slate-700">Reason for Leaving the School:</span>
              <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-500 pb-0.5">{data.leavingReason}</span>
            </div>
          </div>
        </div>

        {/* Triple Attestation Footer */}
        <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs font-sans">
          <div>
            <div className="h-10 flex items-end justify-center pb-1">
              <span className="font-mono text-[11px] text-slate-500">Clerk Initial</span>
            </div>
            <div className="border-t border-slate-700 pt-1">
              <span className="font-bold text-slate-900 uppercase block">{preparedByLabel}</span>
            </div>
          </div>

          <div>
            <div className="h-10 flex items-center justify-center">
              <img src={stampcert} alt="Official Stamp" className="h-14 object-contain opacity-80" />
            </div>
            <div className="border-t border-slate-700 pt-1">
              <span className="font-bold text-slate-900 uppercase block">{verifiedByLabel}</span>
            </div>
          </div>

          <div>
            <div className="h-10 flex items-end justify-center pb-1">
              <span className="font-serif italic font-bold text-lg text-slate-900">Principal</span>
            </div>
            <div className="border-t border-slate-700 pt-1">
              <span className="font-bold text-slate-900 uppercase block">{principalSignLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
