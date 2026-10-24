import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'

export default function RoyalPrestigeIdCard({
  student = {},
  customization = {},
  scale = 1,
  id,
}) {
  const studentName = student.Name || student.name || 'Emma Harrison'
  const fatherName = student.father_name || student.FatherName || student.fatherName || 'Father Name'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '12').toString()
  const rawClass = (student.Class || student.class || '10').toString()
  const studentSection = (student.Section || student.section || 'B').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || `104523`
  const dob = student.date_of_birth || student.dob || '12/05/2009'
  const mobile = student.mobile || student.Mobile || student.phone || student.contact_no || ''
  const validTill = customization.validTill || '2026-27'
  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'

  const photo = student.PhotoUrl || student.photoUrl || student.photo_url || student.photo || student.image || null

  // Fast-scanning streamlined QR payload
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
      id={id || `royal-prestige-card-${rollNo}`}
      className="relative w-[350px] h-[541px] rounded-[18px] bg-[#071426] shadow-2xl overflow-hidden select-none text-white p-3 flex flex-col justify-between items-center border-[2px] border-[#d4af37]"
      style={{
        fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', serif",
        aspectRatio: '55 / 85',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
        background: 'radial-gradient(ellipse at 50% 20%, #0d223f 0%, #071426 70%, #040d1a 100%)',
      }}
    >
      {/* Outer & Inner Dual Gold Borders with Ornate Corner Notches */}
      <div className="absolute inset-2 border border-[#d4af37]/70 rounded-[12px] pointer-events-none" />
      <div className="absolute inset-3.5 border border-[#d4af37]/40 rounded-[9px] pointer-events-none" />

      {/* Decorative Corner Filigree Highlights */}
      <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-[#d4af37]" />
      <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t-2 border-r-2 border-[#d4af37]" />
      <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b-2 border-l-2 border-[#d4af37]" />
      <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-[#d4af37]" />

      {/* 1. Header: Golden Laurel Wreath with 5-Pointed Star Crest */}
      <div className="pt-2 text-center z-10 w-full flex flex-col items-center">
        {/* Laurel Star Crest */}
        <div className="flex items-center justify-center gap-1 mb-1">
          <svg className="w-6 h-8 text-[#d4af37]" viewBox="0 0 24 32" fill="currentColor">
            <path d="M12 2C9 6 6 12 7 20C8 17 10 14 12 13C10 16 9 20 10 24C12 21 14 19 16 19C14 22 13 26 15 28C11 25 8 18 10 10C11 6 12 2 12 2Z" opacity="0.9" />
          </svg>
          <div className="relative flex items-center justify-center">
            <span className="text-[#fde047] text-2xl drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">★</span>
          </div>
          <svg className="w-6 h-8 text-[#d4af37] -scale-x-100" viewBox="0 0 24 32" fill="currentColor">
            <path d="M12 2C9 6 6 12 7 20C8 17 10 14 12 13C10 16 9 20 10 24C12 21 14 19 16 19C14 22 13 26 15 28C11 25 8 18 10 10C11 6 12 2 12 2Z" opacity="0.9" />
          </svg>
        </div>

        {/* School Name */}
        <h1 className="text-[17px] font-black tracking-[0.18em] text-[#ecd696] uppercase leading-none drop-shadow-sm">
          {schoolName}
        </h1>
      </div>

      {/* 2. Photo: Inset Beveled Golden Frame */}
      <div className="z-10 flex flex-col items-center my-auto">
        <div className="relative p-1 bg-gradient-to-br from-[#fde68a] via-[#d4af37] to-[#785412] rounded-[10px] shadow-xl">
          <div className="w-[104px] h-[122px] bg-[#071426] rounded-[8px] p-0.5 border border-[#d4af37]/60 overflow-hidden flex items-center justify-center">
            {photo ? (
              <img src={photo} alt={studentName} className="w-full h-full object-cover rounded-[6px]" />
            ) : (
              <div className="w-full h-full bg-[#0a1b32] flex flex-col items-center justify-center text-[#d4af37]/60">
                <span className="material-symbols-outlined text-4xl">person</span>
                <span className="text-[8px] font-sans font-bold tracking-wider mt-0.5">PHOTO</span>
              </div>
            )}
          </div>
          {/* Beveled frame corner pins */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#fde68a] rounded-full border border-[#785412]" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#fde68a] rounded-full border border-[#785412]" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#fde68a] rounded-full border border-[#785412]" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#fde68a] rounded-full border border-[#785412]" />
        </div>

        {/* Student Name & Grade */}
        <h2 className="text-[17px] font-black tracking-[0.08em] text-[#f6e5ad] mt-2 text-center uppercase leading-tight truncate max-w-[310px]">
          {studentName}
        </h2>
        <p className="text-[12px] font-semibold text-[#d4af37] tracking-wider mt-0.5 font-sans">
          Student, Gr. {rawClass}{studentSection}
        </p>

        {/* Ribbon Pill: STUDENT IDENTITY CARD */}
        <div className="my-1.5 flex items-center gap-2">
          <span className="text-[9px] text-[#d4af37]">★</span>
          <span className="text-[10px] font-black tracking-[0.2em] text-[#fae8b4] uppercase">
            STUDENT IDENTITY CARD
          </span>
          <span className="text-[9px] text-[#d4af37]">★</span>
        </div>

        {/* Key Metadata Row */}
        <div className="text-[10px] text-[#d4af37]/90 font-sans tracking-wide space-y-0.5 text-center">
          <p className="font-mono">
            ID: <strong className="text-white">{admissionNo}</strong> · DOB: <strong className="text-white">{dob}</strong> · VALID: <strong className="text-white">{validTill}</strong>
          </p>
          {mobile && (
            <p className="text-[9.5px] text-slate-300 font-mono">
              Contact: {mobile} {fatherName ? `· Father: ${fatherName}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* 3. Golden QR Code & Royal Prestige Title */}
      <div className="z-10 pb-1.5 flex flex-col items-center">
        {/* Gold Inset QR Frame */}
        <div className="p-1 rounded-[6px] bg-gradient-to-br from-[#fde68a] via-[#d4af37] to-[#926214] shadow-md">
          <div className="w-[58px] h-[58px] bg-white p-0.5 rounded-[4px] flex items-center justify-center overflow-hidden">
            <img
              src={qrDataUrl}
              alt="Security QR"
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>

        {/* Footer Sub-title */}
        <p className="text-[10.5px] font-black tracking-[0.26em] text-[#d4af37] uppercase mt-1.5">
          ROYAL PRESTIGE
        </p>
      </div>
    </div>
  )
}
