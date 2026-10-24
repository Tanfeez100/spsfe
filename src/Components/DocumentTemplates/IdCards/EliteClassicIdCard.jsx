import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'

export default function EliteClassicIdCard({
  student = {},
  customization = {},
  scale = 1,
  id,
}) {
  const studentName = student.Name || student.name || 'Sarah Johnson'
  const fatherName = student.father_name || student.FatherName || student.fatherName || 'Father Name'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '2024115').toString()
  const rawClass = (student.Class || student.class || '11').toString()
  const studentSection = (student.Section || student.section || 'A').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || `112210`
  const dob = student.date_of_birth || student.dob || '05/11/2008'
  const mobile = student.mobile || student.Mobile || student.phone || student.contact_no || ''
  const validTill = customization.validTill || '2026-27'
  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
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
      color: { dark: '#0a1628', light: '#ffffff' },
    })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => {})
    return () => { isCurrent = false }
  }, [studentName, rollNo, rawClass, mobile])

  return (
    <div
      id={id || `elite-classic-card-${rollNo}`}
      className="relative w-[350px] h-[541px] rounded-[18px] bg-[#fbf8f0] shadow-2xl overflow-hidden select-none text-slate-900 border border-[#e2d8c3] flex flex-col justify-between"
      style={{
        fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', serif",
        aspectRatio: '55 / 85',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
        background: 'linear-gradient(180deg, #fbf8f0 0%, #f6f0df 100%)',
      }}
    >
      {/* 1. Top Header: Gold Star with Flanking Hairlines */}
      <div className="pt-3 px-4 text-center z-20">
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#d4af37] to-[#d4af37]" />
          <span className="text-[#c89d26] text-sm">★</span>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent via-[#d4af37] to-[#d4af37]" />
        </div>

        <h1 className="text-[17px] font-black tracking-[0.14em] text-[#0f1d33] uppercase leading-tight font-serif">
          {schoolName}
        </h1>
      </div>

      {/* 2. Sweeping 3D Wavy Metallic Gold & Royal Navy Ribbon */}
      <div className="absolute top-[82px] inset-x-0 h-[150px] pointer-events-none z-10 overflow-hidden">
        {/* Navy Wave */}
        <svg
          viewBox="0 0 350 150"
          className="absolute inset-0 w-full h-full text-[#0a1b32]"
          fill="none"
        >
          <path
            d="M -20,60 C 80,10 180,110 370,40 L 370,120 C 180,170 80,80 -20,120 Z"
            fill="currentColor"
            opacity="0.95"
          />
        </svg>

        {/* 3D Gold Ribbon S-Curve */}
        <svg
          viewBox="0 0 350 150"
          className="absolute inset-0 w-full h-full drop-shadow-md"
          fill="none"
        >
          <defs>
            <linearGradient id="goldRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4af37" />
              <stop offset="35%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          <path
            d="M -20,85 C 90,40 185,125 370,60 L 370,82 C 185,145 90,60 -20,105 Z"
            fill="url(#goldRibbonGrad)"
          />
        </svg>
      </div>

      {/* 3. Centered Golden Framed Photo (Intersecting Ribbon) */}
      <div className="flex flex-col items-center z-20 mt-4">
        <div className="relative p-1 bg-gradient-to-br from-[#fde047] via-[#d4af37] to-[#854d0e] rounded-[6px] shadow-xl">
          <div className="w-[94px] h-[110px] bg-white rounded-[4px] p-0.5 border border-[#ca8a04] overflow-hidden flex items-center justify-center">
            {photo ? (
              <img src={photo} alt={studentName} className="w-full h-full object-cover rounded-[2px]" />
            ) : (
              <div className="w-full h-full bg-[#f4ecd8] flex flex-col items-center justify-center text-[#854d0e]">
                <span className="material-symbols-outlined text-3xl">person</span>
                <span className="text-[7.5px] font-sans font-bold tracking-wider mt-0.5">PHOTO</span>
              </div>
            )}
          </div>
        </div>

        {/* Student Name */}
        <h2 className="text-[16px] font-black text-[#0f1d33] mt-1.5 tracking-tight text-center uppercase truncate max-w-[310px]">
          {studentName}
        </h2>

        {/* Structured Primary Details Box */}
        <div className="mt-1.5 w-[305px] bg-white/85 border border-[#e2d8c3] rounded-xl p-2 text-[10.5px] font-sans text-slate-800 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center border-b border-[#e2d8c3]/60 pb-0.5">
            <span className="text-[#854d0e] text-[9.5px] uppercase font-bold tracking-wider">Class & Roll:</span>
            <span className="font-bold text-slate-900">Class {rawClass} ({studentSection}) &nbsp;·&nbsp; Roll #{rollNo}</span>
          </div>
          <div className="flex justify-between items-center border-b border-[#e2d8c3]/60 pb-0.5">
            <span className="text-[#854d0e] text-[9.5px] uppercase font-bold tracking-wider">Father's Name:</span>
            <span className="font-semibold text-slate-900 truncate max-w-[190px]">{fatherName}</span>
          </div>
          <div className="flex justify-between items-center border-b border-[#e2d8c3]/60 pb-0.5">
            <span className="text-[#854d0e] text-[9.5px] uppercase font-bold tracking-wider">Mobile / Phone:</span>
            <span className="font-mono font-bold text-slate-900">{mobile || '+91 94702 46849'}</span>
          </div>
          <div className="flex justify-between items-center text-[9.5px] pt-0.5 font-mono">
            <span>ID: <strong className="text-slate-900">{admissionNo}</strong></span>
            <span>DOB: <strong className="text-slate-900">{dob}</strong></span>
            <span>Valid: <strong className="text-[#854d0e]">{validTill}</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Verified QR on Left, Cursive Principal Signature on Right */}
      <div className="z-20 px-6 pb-4 pt-2 border-t border-[#e2d8c3] flex items-end justify-between bg-[#fbf8f0]/80 backdrop-blur-xs">
        {/* Verified Badge + QR Code */}
        <div className="flex flex-col items-start">
          <div className="bg-[#0369a1] text-white text-[7.5px] font-sans font-black tracking-wider uppercase px-1.5 py-0.2 rounded-t flex items-center gap-0.5">
            <span>✔</span>
            <span>VERIFIED</span>
          </div>
          <div className="w-[56px] h-[56px] rounded-b border border-slate-300 p-0.5 bg-white shadow-2xs">
            <img
              src={qrDataUrl}
              alt="Verification QR"
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>

        {/* Cursive Principal Signature & Validity */}
        <div className="text-center font-sans">
          <div className="h-7 w-24 flex items-center justify-center">
            <span
              className="text-[21px] text-[#0f1d33] font-serif italic font-bold leading-none select-none tracking-normal"
              style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
            >
              S. Thompson
            </span>
          </div>
          <div className="w-24 h-[1px] bg-slate-400 mt-0.5 mb-0.5" />
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-700">
            {principalSignLabel}
          </p>
          <p className="text-[8.5px] text-slate-500 font-mono mt-0.5">
            Card validity: {validTill}
          </p>
        </div>
      </div>
    </div>
  )
}
