import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import { highQualityQrBase64 as highQualityQr } from '../../../assets/highQualityQrBase64'

export default function CrimsonArchClassicIdCard({
  student = {},
  customization = {},
  scale = 1,
  id,
}) {
  const studentName = student.Name || student.name || '—'
  const fatherName = student.father_name || student.FatherName || student.fatherName || '—'
  const motherName = student.mother_name || student.MotherName || student.motherName || '—'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '—').toString()
  const rawClass = (student.Class || student.class || '—').toString()
  const studentSection = (student.Section || student.section || '').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || rollNo || '—'
  const dob = student.date_of_birth || student.dob || '—'
  const studentAddress = student.address || 'Surat / Campus'
  const mobile = student.mobile || student.Mobile || student.phone || student.contact_no || '1234567890'
  const session = customization.session || '2025-26'
  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const tagline = customization.tagline || 'BETTIAH, WEST CHAMPARAN (BIHAR)'

  const photo = student.PhotoUrl || student.photoUrl || student.photo_url || student.photo || student.image || null

  const qrLines = [
    schoolName,
    `Name: ${studentName}`,
    `Class: ${rawClass} ${studentSection ? '(' + studentSection + ')' : ''}`,
    `Roll: ${rollNo}`,
    `Father: ${fatherName}`,
    mobile ? `Mobile: ${mobile}` : null,
    `DOB: ${dob}`,
    `Adm: ${admissionNo}`,
  ].filter(Boolean)

  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    let isCurrent = true
    QRCode.toDataURL(qrLines.join('\n'), {
      margin: 1,
      width: 200,
      errorCorrectionLevel: 'L',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => { if (isCurrent) setQrDataUrl(highQualityQr) })
    return () => { isCurrent = false }
  }, [studentName, rollNo, rawClass, mobile])

  return (
    <div
      id={id || `crimson-arch-card-${rollNo}-${studentName.replace(/\s+/g, '')}`}
      className="relative w-[350px] h-[541px] rounded-[18px] bg-[#fbfbfa] shadow-xl overflow-hidden select-none text-slate-800 border-[2.5px] border-[#991b1b]/20"
      style={{
        fontFamily: "'Lexend', 'Manrope', -apple-system, sans-serif",
        aspectRatio: '55 / 85',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      {/* 1. Top Decorative Arch Background */}
      <div className="absolute top-0 left-0 right-0 h-[140px] pointer-events-none z-0">
        <svg viewBox="0 0 350 140" preserveAspectRatio="none" className="w-full h-full">
          {/* Subtle beige arch background */}
          <path d="M0,0 L350,0 L350,110 Q175,145 0,110 Z" fill="#f5ede6" />
          <path d="M0,0 L350,0 L350,102 Q175,134 0,102 Z" fill="#faf6f0" />
          {/* Crimson accent on top right corner */}
          <path d="M260,0 L350,0 L350,120 Q300,70 260,0 Z" fill="#991b1b" opacity="0.85" />
        </svg>
      </div>

      {/* Top Right Session Badge with Paper Airplane Motif */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        <span className="bg-[#991b1b] text-white text-[8px] font-black px-2 py-0.5 rounded-l-md shadow-xs">
          {session}
        </span>
        {/* Geometric plane icon */}
        <div className="w-6 h-5 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-yellow-300 fill-current drop-shadow-xs">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </div>
      </div>

      {/* Top Center Crest Logo */}
      <div className="pt-3 flex justify-center z-10 relative">
        <div className="w-[52px] h-[52px] rounded-full bg-white p-1 shadow-md border-2 border-[#d97706] flex items-center justify-center">
          <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* School Name & Location Subtitle */}
      <div className="text-center px-4 pt-1.5 z-10 relative">
        <h1 className="font-black text-[16px] text-[#7f1d1d] uppercase tracking-tight leading-tight font-serif drop-shadow-xs">
          {schoolName}
        </h1>
        <p className="text-[9px] font-extrabold text-[#0284c7] uppercase tracking-wider mt-0.5 truncate">
          {tagline}
        </p>
      </div>

      {/* Student Photo */}
      <div className="flex justify-center pt-2.5 z-10 relative">
        <div className="w-[104px] h-[120px] rounded-xl bg-slate-100 p-1 border-2 border-slate-300 shadow-sm overflow-hidden">
          {photo ? (
            <img src={photo} alt={studentName} className="w-full h-full object-cover rounded-[8px]" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
              <span className="material-symbols-outlined text-4xl">person</span>
              <span className="text-[9px] font-bold mt-0.5">PHOTO</span>
            </div>
          )}
        </div>
      </div>

      {/* Student Name & Class Banner */}
      <div className="text-center pt-2 z-10 relative">
        <h2 className="font-black text-[16px] text-[#0284c7] uppercase tracking-tight truncate px-3">
          {studentName}
        </h2>
        <div className="inline-block mt-1">
          <span className="bg-[#7f1d1d] text-white px-3.5 py-0.5 rounded-md text-[10.5px] font-black uppercase tracking-wider shadow-2xs">
            CLASS - {rawClass} {studentSection ? `(${studentSection})` : ''}
          </span>
        </div>
      </div>

      {/* Metadata Details List with Aligned Dashes */}
      <div className="px-7 pt-2.5 text-[11px] space-y-1 text-slate-800 z-10 relative">
        <div className="flex items-baseline">
          <span className="w-[90px] shrink-0 font-bold text-slate-700">Father Name</span>
          <span className="font-bold mr-2">-</span>
          <span className="font-bold text-slate-900 truncate">{fatherName}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[90px] shrink-0 font-bold text-slate-700">Mother Name</span>
          <span className="font-bold mr-2">-</span>
          <span className="font-bold text-slate-900 truncate">{motherName !== '—' ? motherName : 'Mrs. Basanti'}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[90px] shrink-0 font-bold text-slate-700">Date of Birth</span>
          <span className="font-bold mr-2">-</span>
          <span className="font-bold text-slate-900 font-mono">{dob}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[90px] shrink-0 font-bold text-slate-700">Mobile No.</span>
          <span className="font-bold mr-2">-</span>
          <span className="font-bold text-slate-900 font-mono">{mobile}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[90px] shrink-0 font-bold text-slate-700">Address</span>
          <span className="font-bold mr-2">-</span>
          <span className="font-bold text-slate-900 text-[10.5px] truncate">{studentAddress}</span>
        </div>
      </div>

      {/* Bottom Section: Call Pill, QR, and Crimson Flare */}
      {/* Dynamic Crimson Wing Flares on bottom right */}
      <div className="absolute bottom-0 right-0 w-[120px] h-[65px] pointer-events-none z-0 overflow-hidden">
        <svg viewBox="0 0 120 65" className="w-full h-full fill-[#7f1d1d]">
          <path d="M120,65 L50,65 Q80,45 120,20 Z" opacity="0.9" />
          <path d="M120,65 L75,65 Q95,35 120,5 Z" opacity="0.75" />
          <path d="M120,65 L95,65 Q105,25 120,0 Z" opacity="0.6" />
        </svg>
      </div>

      {/* Bottom Footer Details */}
      <div className="absolute bottom-2.5 left-0 right-0 px-4 flex items-center justify-between z-10">
        {/* Left: Mini QR code */}
        <div className="w-[42px] h-[42px] bg-white rounded-md p-0.5 border border-slate-300 shadow-2xs">
          <img src={qrDataUrl || highQualityQr} alt="QR" className="w-full h-full object-contain" />
        </div>

        {/* Center: Golden Call Button Pill */}
        <div className="flex items-center gap-1.5 bg-[#fef3c7] text-[#92400e] border border-[#fde68a] px-3 py-1 rounded-full shadow-xs font-black text-[11px]">
          <div className="w-4 h-4 rounded-full bg-[#1e293b] text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[10px]">call</span>
          </div>
          <span className="font-mono tracking-wider">{mobile}</span>
        </div>

        {/* Right spacing placeholder for the crimson flares */}
        <div className="w-[42px] h-[42px]" />
      </div>
    </div>
  )
}
