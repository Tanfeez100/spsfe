import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import { highQualityQrBase64 as highQualityQr } from '../../../assets/highQualityQrBase64'

export default function PremiumGradientIdCard({
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
  const validTill = customization.validTill || '2026-27'
  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const principalSignLabel = customization.principalSignLabel || 'Authorized Sign'

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
      id={id || `premium-gradient-card-${rollNo}`}
      className="relative w-[350px] h-[541px] rounded-[20px] bg-white shadow-2xl overflow-hidden select-none text-slate-900 border border-slate-200 flex flex-col justify-between"
      style={{
        fontFamily: "'Outfit', 'Inter', sans-serif",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      {/* 1. Dynamic Gradient Top Header */}
      <div className="relative bg-gradient-to-br from-indigo-950 via-blue-900 to-indigo-900 text-white p-4 pb-6 rounded-b-[28px] shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-xl bg-white/10 p-1.5 backdrop-blur-md border border-white/20 shrink-0 shadow-inner flex items-center justify-center">
            <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-black tracking-tight leading-tight uppercase font-sans truncate drop-shadow-sm">
              {schoolName}
            </h1>
            <p className="text-[9px] text-cyan-200 font-semibold tracking-wider uppercase mt-0.5">
              Empowering Future Leaders
            </p>
          </div>
          <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[8px] font-black uppercase px-2 py-1 rounded-md shadow-xs shrink-0 tracking-wider">
            {validTill}
          </div>
        </div>
      </div>

      {/* 2. Overlapping Photo Avatar with Cyan Glow Ring */}
      <div className="flex flex-col items-center -mt-8 relative z-10">
        <div className="w-[104px] h-[104px] rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 shadow-xl">
          <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden">
            {photo ? (
              <img src={photo} alt={studentName} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-4xl">person</span>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-[16px] font-black text-slate-900 mt-1 tracking-tight text-center truncate max-w-[320px]">
          {studentName}
        </h2>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="bg-blue-100 text-blue-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            CLASS {rawClass} · SEC {studentSection}
          </span>
          <span className="bg-slate-900 text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
            ROLL #{rollNo}
          </span>
        </div>
      </div>

      {/* 3. Sleek Key-Value Details */}
      <div className="px-5 py-1 text-[11px] space-y-1 text-slate-700">
        <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
          <span className="text-slate-400 font-medium">Admission No:</span>
          <span className="font-bold text-slate-900 font-mono">{admissionNo}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
          <span className="text-slate-400 font-medium">Father's Name:</span>
          <span className="font-bold text-slate-900 truncate max-w-[190px]">{fatherName}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
          <span className="text-slate-400 font-medium">Emergency Contact:</span>
          <span className="font-bold text-slate-900 font-mono text-blue-600">{mobile || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
          <span className="text-slate-400 font-medium">Date of Birth:</span>
          <span className="font-bold text-slate-900 font-mono">{dob}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Address:</span>
          <span className="font-bold text-slate-900 truncate max-w-[190px]">{studentAddress}</span>
        </div>
      </div>

      {/* 4. Bottom Footer with Holographic Bar & QR */}
      <div className="bg-slate-50 border-t border-slate-200 p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-[56px] h-[56px] rounded-lg border border-slate-300 p-0.5 bg-white shadow-xs">
            <img src={qrDataUrl || highQualityQr} alt="QR" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
          </div>
          <div>
            <div className="h-1.5 w-16 bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300 rounded-full mb-1" />
            <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-500">Digital Verify</span>
          </div>
        </div>

        <div className="text-center pr-2">
          <span className="font-serif italic text-base font-bold text-indigo-950">Principal</span>
          <div className="w-20 h-0.5 bg-indigo-900 mt-0.5" />
          <span className="text-[8px] font-black uppercase text-slate-500 mt-0.5 block">
            {principalSignLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
