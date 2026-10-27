import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import { highQualityQrBase64 as highQualityQr } from '../../../assets/highQualityQrBase64'

export default function NavyWaveTechIdCard({
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
  const admissionNo = student.admission_number || student.admissionNo || student.id || `SPS/25/${rollNo.padStart(4, '0')}`
  const dob = student.date_of_birth || student.dob || '—'
  const bloodGroup = student.blood_group || student.bloodGroup || 'O+'
  const studentAddress = student.address || 'Campus / Surat'
  const mobile = student.mobile || student.Mobile || student.phone || student.contact_no || ''
  const session = customization.session || '2025-26'
  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const primaryNavy = '#0a2540'

  const photo = student.PhotoUrl || student.photoUrl || student.photo_url || student.photo || student.image || null

  const qrLines = [
    schoolName,
    `Name: ${studentName}`,
    `Class: ${rawClass} ${studentSection ? '(' + studentSection + ')' : ''}`,
    `Roll: ${rollNo}`,
    `Father: ${fatherName}`,
    `DOB: ${dob}`,
    `Blood: ${bloodGroup}`,
    `ID: ${admissionNo}`,
  ].filter(Boolean)

  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    let isCurrent = true
    QRCode.toDataURL(qrLines.join('\n'), {
      margin: 1,
      width: 220,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => { if (isCurrent) setQrDataUrl(highQualityQr) })
    return () => { isCurrent = false }
  }, [studentName, rollNo, rawClass, mobile])

  return (
    <div
      id={id || `navy-wave-card-${rollNo}-${studentName.replace(/\s+/g, '')}`}
      className="relative w-[350px] h-[541px] rounded-[18px] bg-white shadow-xl overflow-hidden select-none text-slate-900 border-[2.5px] border-[#0a2540]"
      style={{
        fontFamily: "'Lexend', 'Manrope', -apple-system, sans-serif",
        aspectRatio: '55 / 85',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      {/* 1. Top Header with Deep Navy Background */}
      <div className="relative bg-[#0a2540] pt-2 pb-5 px-3 text-white z-10 shrink-0">
        {/* Lanyard Slot Cutout Graphic */}
        <div className="w-12 h-2.5 rounded-full bg-white/90 border border-white/50 mx-auto mb-2 shadow-inner" />

        <div className="flex items-center gap-2.5">
          {/* School Crest Logo */}
          <div className="w-[44px] h-[44px] rounded-lg bg-white/10 p-1 flex items-center justify-center border border-white/20 shrink-0">
            <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
          </div>

          {/* School Name */}
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-[16px] tracking-tight leading-tight uppercase font-serif truncate drop-shadow-xs">
              {schoolName}
            </h1>
            <p className="text-[8.5px] font-bold text-blue-200 tracking-wider uppercase">
              Identity Card
            </p>
          </div>
        </div>

        {/* Dynamic Curved Yellow & Blue Waves below Header */}
        <div className="absolute -bottom-3 left-0 right-0 h-4 overflow-hidden pointer-events-none z-10">
          <svg viewBox="0 0 350 20" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,0 Q175,20 350,0 L350,20 L0,20 Z" fill="#60a5fa" opacity="0.6" />
            <path d="M0,0 Q120,18 350,2 L350,8 Q120,22 0,4 Z" fill="#f59e0b" />
          </svg>
        </div>
      </div>

      {/* 2. Photo & QR Code Section */}
      <div className="px-5 pt-3 pb-1 flex items-center justify-between z-10 relative">
        {/* Left: Rounded Photo Frame */}
        <div className="w-[110px] h-[126px] rounded-2xl bg-slate-100 p-1 border-2 border-[#0a2540] shadow-md overflow-hidden shrink-0">
          {photo ? (
            <img src={photo} alt={studentName} className="w-full h-full object-cover rounded-[12px]" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
              <span className="material-symbols-outlined text-4xl">person</span>
              <span className="text-[9px] font-bold mt-0.5">PHOTO</span>
            </div>
          )}
        </div>

        {/* Right: Session Badge & QR Code */}
        <div className="flex flex-col items-center justify-center pl-2 flex-1">
          <span className="text-[9.5px] font-black text-[#0a2540] uppercase tracking-wider mb-1">
            SESSION
          </span>
          <span className="text-[11px] font-extrabold text-[#0a2540] mb-2 font-mono">
            {session}
          </span>
          <div className="w-[74px] h-[74px] bg-white rounded-lg p-0.5 border border-slate-300 shadow-xs flex items-center justify-center">
            <img src={qrDataUrl || highQualityQr} alt="QR" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      {/* 3. Student Name & Class Banner */}
      <div className="px-5 pt-1 text-center z-10 relative">
        <h2 className="font-black text-[17px] text-[#0a2540] tracking-tight uppercase truncate">
          {studentName}
        </h2>
        <p className="text-[12px] font-extrabold text-slate-800 tracking-wide mt-0.5">
          Class : <span className="text-[#0a2540]">{rawClass} {studentSection ? `(${studentSection})` : ''}</span>
        </p>
      </div>

      {/* 4. Details List with Aligned Colons */}
      <div className="px-6 pt-2 text-[11px] space-y-1 text-slate-800 z-10 relative">
        <div className="flex items-baseline">
          <span className="w-[95px] shrink-0 font-bold text-slate-700">Father's Name</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-bold text-slate-900 truncate">{fatherName}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[95px] shrink-0 font-bold text-slate-700">Mother's Name</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-bold text-slate-900 truncate">{motherName !== '—' ? motherName : 'Pooja Sharma'}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[95px] shrink-0 font-bold text-slate-700">Date of Birth</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-bold text-slate-900 font-mono">{dob}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[95px] shrink-0 font-bold text-slate-700">Blood Group</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-extrabold text-rose-600 font-mono">{bloodGroup}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[95px] shrink-0 font-bold text-slate-700">Address</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-bold text-slate-900 text-[10.5px] truncate">{studentAddress}</span>
        </div>
      </div>

      {/* 5. Bottom Background Waves & Signature / ID Pill */}
      <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden pointer-events-none z-0">
        <svg viewBox="0 0 350 80" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,40 Q160,10 350,50 L350,80 L0,80 Z" fill="#93c5fd" opacity="0.5" />
          <path d="M0,55 Q180,25 350,35 L350,80 L0,80 Z" fill="#0a2540" />
        </svg>
      </div>

      {/* 6. Bottom Signature & ID Badge */}
      <div className="absolute bottom-2 left-0 right-0 px-5 flex items-end justify-between z-10">
        {/* Principal Signature */}
        <div className="flex flex-col items-center">
          <span
            className="text-[17px] italic font-bold select-none leading-none text-[#0a2540]"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            Principal
          </span>
          <div className="w-16 h-[1px] bg-[#0a2540] mt-0.5" />
          <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-600 mt-0.5">
            Principal
          </span>
        </div>

        {/* ID No Pill Box */}
        <div className="bg-[#0a2540] text-white rounded-tl-2xl rounded-br-md px-3 py-1 text-right shadow-sm border border-blue-400/30">
          <div className="text-[7.5px] font-bold text-blue-200 uppercase tracking-wider">
            ID No.
          </div>
          <div className="text-[10.5px] font-black font-mono tracking-wider">
            {admissionNo}
          </div>
        </div>
      </div>
    </div>
  )
}
