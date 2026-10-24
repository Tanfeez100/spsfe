import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'

export default function ModernTechDualToneIdCard({
  student = {},
  customization = {},
  scale = 1,
  id,
}) {
  const studentName = student.Name || student.name || 'Daniel Adebayo'
  const fatherName = student.father_name || student.FatherName || student.fatherName || 'Father Name'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '147890').toString()
  const rawClass = (student.Class || student.class || '9').toString()
  const studentSection = (student.Section || student.section || 'C').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || `099834`
  const dob = student.date_of_birth || student.dob || '18/03/2010'
  const mobile = student.mobile || student.Mobile || student.phone || student.contact_no || ''
  const validTill = customization.validTill || '2026-27'
  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'

  const photo = student.PhotoUrl || student.photoUrl || student.photo_url || student.photo || student.image || null

  // Fast-scanning QR code payload
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
      color: { dark: '#0a192f', light: '#ffffff' },
    })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => {})
    return () => { isCurrent = false }
  }, [studentName, rollNo, rawClass, mobile])

  return (
    <div
      id={id || `modern-tech-card-${rollNo}`}
      className="relative w-[350px] h-[541px] rounded-[18px] bg-white shadow-2xl overflow-hidden select-none text-slate-900 border border-slate-200 flex flex-col justify-between"
      style={{
        fontFamily: "'Inter', sans-serif",
        aspectRatio: '55 / 85',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      {/* 1. Dynamic Top-Right Emerald & Navy Diagonal Ribbons with Gold Divider */}
      <div className="absolute top-0 right-0 w-[240px] h-[190px] pointer-events-none overflow-hidden z-0">
        {/* Navy Ribbon */}
        <div
          className="absolute -top-12 -right-12 w-[220px] h-[180px] bg-[#071933] transform rotate-[-30deg]"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 20% 100%)' }}
        />
        {/* Gold Hairline Stripe */}
        <div
          className="absolute top-10 right-4 w-[240px] h-[4px] bg-[#d4af37] transform rotate-[-30deg] z-1"
        />
        {/* Emerald Green Ribbon */}
        <div
          className="absolute -top-4 right-10 w-[180px] h-[120px] bg-gradient-to-br from-[#059669] to-[#047857] transform rotate-[-30deg]"
          style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)' }}
        />
      </div>

      {/* Top Header: Logo + Star Laurel Crest + Green STAR / Navy PUBLIC SCHOOL */}
      <div className="relative pt-4 px-4 flex items-center gap-2.5 z-10">
        <div className="flex items-center gap-1.5">
          {/* Laurel Crest */}
          <div className="flex items-center justify-center">
            <span className="text-[#047857] text-2xl font-bold">★</span>
          </div>
          <div>
            <h1 className="text-[17px] font-black text-[#047857] tracking-tight leading-none uppercase">
              STAR
            </h1>
            <p className="text-[10px] font-black text-[#071933] tracking-widest uppercase mt-0.5">
              PUBLIC SCHOOL
            </p>
          </div>
        </div>
      </div>

      {/* 2. Photo Section: Rounded Frame with Gold/Emerald Ring and Active Badge */}
      <div className="flex flex-col items-center z-10 -mt-2">
        <div className="relative p-1 rounded-full bg-gradient-to-tr from-[#059669] via-[#d4af37] to-[#071933] shadow-lg">
          <div className="w-[94px] h-[94px] rounded-full p-0.5 bg-white overflow-hidden flex items-center justify-center">
            {photo ? (
              <img src={photo} alt={studentName} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-3xl">person</span>
              </div>
            )}
          </div>
        </div>

        {/* Glowing Pill Badge: ACTIVE */}
        <div className="bg-emerald-600 text-white text-[8px] font-black tracking-widest uppercase px-3 py-0.5 rounded-full shadow-xs -mt-2 z-20 flex items-center gap-1 border border-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span>ACTIVE</span>
        </div>

        {/* Student Name */}
        <h2 className="text-[16px] font-black text-[#071933] mt-1 tracking-tight uppercase text-center truncate max-w-[310px]">
          {studentName}
        </h2>

        {/* Two Deep Navy Pill Badges */}
        <div className="flex items-center gap-2 mt-1">
          <span className="bg-[#071933] text-white text-[9.5px] font-extrabold px-3 py-0.5 rounded-full tracking-wide uppercase shadow-2xs">
            CLASS: {rawClass} ({studentSection})
          </span>
          <span className="bg-[#071933] text-white text-[9.5px] font-mono font-extrabold px-3 py-0.5 rounded-full tracking-wide uppercase shadow-2xs">
            ROLL NO: {rollNo}
          </span>
        </div>

        {/* Structured Primary Details Box */}
        <div className="mt-1.5 w-[305px] bg-slate-50 border border-slate-200/90 rounded-xl p-2 text-[10.5px] font-sans text-slate-700 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-0.5">
            <span className="text-slate-400 text-[9.5px] uppercase font-bold tracking-wider">Father's Name:</span>
            <span className="font-bold text-slate-900 truncate max-w-[190px]">{fatherName}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-0.5">
            <span className="text-slate-400 text-[9.5px] uppercase font-bold tracking-wider">Mobile / Phone:</span>
            <span className="font-mono font-bold text-emerald-800">{mobile || '+91 94702 46849'}</span>
          </div>
          <div className="flex justify-between items-center text-[9.5px] pt-0.5 font-mono">
            <span>ID: <strong className="text-slate-900">{admissionNo}</strong></span>
            <span>DOB: <strong className="text-slate-900">{dob}</strong></span>
            <span>Valid: <strong className="text-slate-900">{validTill}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Centered Clean QR Code */}
      <div className="flex flex-col items-center z-10 -mt-1">
        <div className="w-[66px] h-[66px] rounded-lg border border-slate-300 p-0.5 bg-white shadow-xs flex items-center justify-center">
          <img
            src={qrDataUrl}
            alt="Student QR"
            className="w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>

      {/* 4. Bottom Deep Navy Footer with Gold Ribbon */}
      <div className="relative w-full z-10">
        <div className="h-1 w-full bg-[#d4af37]" />
        <div className="bg-[#071933] py-2.5 px-4 text-center">
          <p className="text-[10px] font-black tracking-[0.2em] text-white uppercase">
            TECHNOLOGY ACADEMY
          </p>
        </div>
      </div>
    </div>
  )
}
