import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import { highQualityQrBase64 as highQualityQr } from '../../../assets/highQualityQrBase64'

export default function CompactVerticalIdCard({
  student = {},
  customization = {},
  scale = 1,
  id,
}) {
  const studentName = student.Name || student.name || 'Student Name'
  const fatherName = student.father_name || student.FatherName || student.fatherName || 'Father Name'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '00').toString()
  const rawClass = (student.Class || student.class || '').toString()
  const studentSection = (student.Section || student.section || 'A').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || `SPS-2024-${rollNo.padStart(3, '0')}`
  const dob = student.date_of_birth || student.dob || '01/01/2012'
  const studentAddress = student.address || 'Bettiah, West Champaran, Bihar'
  const mobile = student.mobile || student.Mobile || student.phone || student.contact_no || ''
  const validTill = customization.validTill || '31/03/2027'
  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const primaryColor = customization.primaryColor || '#0f172a'
  const principalSignLabel = customization.principalSignLabel || 'Principal'

  const photo = student.PhotoUrl || student.photoUrl || student.photo_url || student.photo || student.image || null

  const qrLines = [
    schoolName,
    `Name: ${studentName}`,
    `Class: ${rawClass} (${studentSection})`,
    `Roll: ${rollNo}`,
    `Father: ${fatherName}`,
    mobile ? `Phone: ${mobile}` : null,
    `DOB: ${dob}`,
    `Adm: ${admissionNo}`,
  ].filter(Boolean)

  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    let isCurrent = true
    QRCode.toDataURL(qrLines.join('\n'), {
      margin: 1,
      width: 260,
      errorCorrectionLevel: 'L',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => { if (isCurrent) setQrDataUrl(highQualityQr) })
    return () => { isCurrent = false }
  }, [studentName, rollNo, rawClass, mobile])

  return (
    <div
      id={id || `compact-vertical-card-${rollNo}`}
      className="relative w-[350px] h-[541px] rounded-[16px] bg-white shadow-xl overflow-hidden select-none text-slate-900 border-[3px] border-slate-900 flex flex-col justify-between"
      style={{
        fontFamily: "'Inter', sans-serif",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      {/* Top Bold Header */}
      <div className="bg-slate-950 text-white p-3 text-center border-b-2 border-amber-400">
        <div className="flex items-center justify-center gap-2">
          <img src={schoolLogo} alt="Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-[17px] font-black uppercase tracking-tight truncate leading-none">
            {schoolName}
          </h1>
        </div>
        <p className="text-[8px] font-bold text-amber-300 tracking-widest uppercase mt-1">
          Identity Document · Session 2026-27
        </p>
      </div>

      {/* Prominent Photo Box */}
      <div className="flex flex-col items-center pt-2">
        <div className="w-[110px] h-[130px] rounded-lg border-2 border-slate-900 p-1 bg-white shadow-md">
          {photo ? (
            <img src={photo} alt={studentName} className="w-full h-full object-cover rounded-md" />
          ) : (
            <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-4xl">person</span>
              <span className="text-[8px] font-bold mt-0.5">STUDENT PHOTO</span>
            </div>
          )}
        </div>
        <h2 className="text-[16px] font-black text-slate-950 mt-1.5 leading-snug truncate max-w-[320px]">
          {studentName}
        </h2>
      </div>

      {/* Structured 2-Column Details Grid */}
      <div className="mx-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] grid grid-cols-2 gap-x-2 gap-y-1.5">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase block">Class & Sec</span>
          <span className="font-black text-slate-900 text-xs">Class {rawClass} ({studentSection})</span>
        </div>
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase block">Roll Number</span>
          <span className="font-black text-slate-900 text-xs font-mono">#{rollNo}</span>
        </div>
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase block">Admission No</span>
          <span className="font-bold text-slate-900 truncate block font-mono text-[10.5px]">{admissionNo}</span>
        </div>
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase block">Date of Birth</span>
          <span className="font-bold text-slate-900 font-mono text-[10.5px]">{dob}</span>
        </div>
        <div className="col-span-2 border-t border-slate-200 pt-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase block">Father's Name</span>
          <span className="font-bold text-slate-900 truncate block">{fatherName}</span>
        </div>
        <div className="col-span-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase block">Phone / Address</span>
          <span className="font-bold text-slate-900 truncate block">{mobile} · {studentAddress}</span>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="px-3 pb-2.5 pt-1 flex items-end justify-between border-t border-slate-200">
        <div className="flex items-center gap-1.5">
          <div className="w-[52px] h-[52px] border border-slate-900 p-0.5 bg-white rounded">
            <img src={qrDataUrl || highQualityQr} alt="QR" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
          </div>
          <div className="text-[8px] font-bold text-slate-600">
            <p>VALID TILL</p>
            <p className="font-mono text-slate-950 font-black">{validTill}</p>
          </div>
        </div>

        <div className="text-center pr-2">
          <div className="font-serif italic text-base text-slate-950 font-bold">Principal</div>
          <div className="w-20 h-0.5 bg-slate-900" />
          <span className="text-[8.5px] font-black uppercase text-slate-700 tracking-wider mt-0.5 block">
            {principalSignLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
