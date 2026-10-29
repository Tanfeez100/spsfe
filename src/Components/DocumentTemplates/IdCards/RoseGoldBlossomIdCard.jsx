import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import { highQualityQrBase64 as highQualityQr } from '../../../assets/highQualityQrBase64'

export default function RoseGoldBlossomIdCard({
  student = {},
  customization = {},
  scale = 1,
  id,
}) {
  const studentName = student.Name || student.name || 'AARAV SHARMA'
  const fatherName = student.father_name || student.FatherName || student.fatherName || 'Mr. Rajesh Sharma'
  const motherName = student.mother_name || student.MotherName || student.motherName || 'Mrs. Sunita Sharma'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '-').toString()
  const rawClass = (student.Class || student.class || '1').toString()
  const studentSection = (student.Section || student.section || 'A').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || rollNo || '-'
  const studentAddress = student.address || '-'
  const mobile = student.mobile || student.Mobile || student.phone || student.contact_no || '-'
  const schoolName = customization.schoolName || 'ANTI-GRAVITY ACADEMY'
  const schoolEmail = customization.schoolEmail || 'contact@antigravity.com'

  const photo = student.PhotoUrl || student.photoUrl || student.photo_url || student.photo || student.image || null

  const qrLines = [
    schoolName,
    `Name: ${studentName}`,
    `Class: ${rawClass} ${studentSection ? '(' + studentSection + ')' : ''}`,
    `Roll: ${rollNo}`,
    `Father: ${fatherName}`,
    `Phone: ${mobile}`,
    `Adm: ${admissionNo}`,
  ].filter(Boolean)

  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    let isCurrent = true
    QRCode.toDataURL(qrLines.join('\n'), {
      margin: 1,
      width: 160,
      errorCorrectionLevel: 'L',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => { if (isCurrent) setQrDataUrl(highQualityQr) })
    return () => { isCurrent = false }
  }, [studentName, rollNo, rawClass, mobile])

  return (
    <div
      id={id || `rose-gold-card-${rollNo}-${studentName.replace(/\s+/g, '')}`}
      className="relative w-[350px] h-[541px] rounded-[18px] bg-white shadow-xl overflow-hidden select-none text-slate-800 border-[1.5px] border-slate-200/80 flex flex-col justify-between"
      style={{
        fontFamily: "'Lexend', 'Manrope', -apple-system, sans-serif",
        aspectRatio: '55 / 85',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      {/* ================= 1. BACKGROUND GRAPHICS ================= */}
      {/* Soft Peach / Cream Backdrop on Right Half */}
      <div className="absolute top-0 right-0 w-[210px] h-full pointer-events-none z-0">
        <svg viewBox="0 0 210 541" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M 70,0 C 25,130 90,230 40,370 C 20,430 45,490 70,541 L 210,541 L 210,0 Z"
            fill="#fef4ed"
          />
        </svg>
      </div>

      {/* Top-Right Diagonal Parallel Golden Stripes */}
      <div className="absolute top-0 right-0 w-[125px] h-[100px] pointer-events-none z-0">
        <svg viewBox="0 0 125 100" className="w-full h-full stroke-[#c8a466]" strokeWidth="2" strokeLinecap="round">
          <line x1="28" y1="0" x2="125" y2="97" />
          <line x1="44" y1="0" x2="125" y2="81" />
          <line x1="60" y1="0" x2="125" y2="65" />
          <line x1="76" y1="0" x2="125" y2="49" />
          <line x1="92" y1="0" x2="125" y2="33" />
          <line x1="108" y1="0" x2="125" y2="17" />
        </svg>
      </div>

      {/* Top-Left Rich Golden Metallic Organic Wave Shape */}
      <div className="absolute top-0 left-0 w-[175px] h-[225px] pointer-events-none z-0">
        <svg viewBox="0 0 175 225" className="w-full h-full">
          <defs>
            <linearGradient id="goldMetallicGradExact" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dfb758" />
              <stop offset="35%" stopColor="#ca9a3e" />
              <stop offset="70%" stopColor="#c18e32" />
              <stop offset="100%" stopColor="#ab7d26" />
            </linearGradient>
          </defs>
          <path
            d="M 0,0 L 152,0 C 128,45 104,55 110,85 C 118,122 75,140 88,172 C 96,190 74,205 0,225 Z"
            fill="url(#goldMetallicGradExact)"
          />
        </svg>
      </div>

      {/* ================= 2. TOP SCHOOL LOGO BADGE ================= */}
      <div className="absolute top-3.5 left-4 z-10">
        <div className="w-[54px] h-[54px] rounded-full bg-white p-1 shadow-md border-2 border-[#c8a466] flex items-center justify-center">
          <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* ================= 3. CENTER CIRCULAR PHOTO & CURVED REG NO RIBBON ================= */}
      <div className="relative pt-6 pb-1 flex flex-col items-center z-10">
        <div className="relative w-[156px] h-[156px] flex items-center justify-center">
          {/* SVG Complex Curved Pink / Magenta Ribbon Array */}
          <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              {/* Path exactly curving along the top-right arc from top down to mid-right */}
              <path
                id="curvedRegPathExact"
                d="M 132,46 A 65,65 0 0,1 106,142"
                fill="none"
              />
            </defs>

            {/* Bottom-Left Pink Crescent Accent */}
            <path
              d="M 30,114 A 65,65 0 0,1 46,36"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="15"
              strokeLinecap="round"
              opacity="0.95"
            />

            {/* Top-Right Deep Magenta Ribbon Band with Radial Flat Cuts */}
            <path
              d="M 132,46 A 65,65 0 0,1 106,142"
              fill="none"
              stroke="#c2185b"
              strokeWidth="22"
              strokeLinecap="round"
            />

            {/* Curved White Text Following the Arc */}
            <text
              fill="#ffffff"
              fontSize="9.5"
              fontWeight="900"
              letterSpacing="1.2"
              dy="3.5"
            >
              <textPath href="#curvedRegPathExact" startOffset="14%">
                {`Reg. No. ${admissionNo}`}
              </textPath>
            </text>
          </svg>

          {/* Circular Photo Box */}
          <div className="w-[114px] h-[114px] rounded-full overflow-hidden bg-slate-100 border-[4px] border-white shadow-xl z-20">
            {photo ? (
              <img src={photo} alt={studentName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                <span className="material-symbols-outlined text-4xl">person</span>
                <span className="text-[9px] font-bold mt-0.5">PHOTO</span>
              </div>
            )}
          </div>
        </div>

        {/* Student Name */}
        <h2
          className="font-black text-[22px] text-center mt-2 tracking-wide uppercase px-3 truncate max-w-[325px] leading-tight"
          style={{ color: '#805b10' }}
        >
          {studentName}
        </h2>

        {/* Class Subtitle with Olive-Gold Underline (Exact to Photo) */}
        <div className="flex flex-col items-center mt-0.5">
          <span className="text-[13px] font-black italic tracking-wider text-[#d81b60] uppercase">
            CLASS - {rawClass} {studentSection ? `(${studentSection})` : ''}
          </span>
          <div className="w-24 h-[2px] bg-[#805b10] rounded-full mt-1" />
        </div>
      </div>

      {/* ================= 4. STUDENT DETAILS SECTION ================= */}
      <div className="px-7 space-y-1.5 z-10 relative text-[12px]">
        {/* Father's Name Row */}
        <div className="flex items-center">
          {/* Slanted Pink Parallelogram Ribbon Bullet */}
          <div className="w-4 h-2.5 bg-[#f43f5e] -skew-x-[25deg] rounded-[1px] shrink-0 mr-2.5 shadow-2xs" />
          <span className="w-[105px] shrink-0 font-medium text-[#4a3810]">Father's name</span>
          <span className="font-bold text-[#4a3810] mr-2">-</span>
          <span className="font-bold text-[#352507] truncate">{fatherName}</span>
        </div>

        {/* Mother's Name Row */}
        <div className="flex items-center">
          <div className="w-4 h-2.5 bg-[#f43f5e] -skew-x-[25deg] rounded-[1px] shrink-0 mr-2.5 shadow-2xs" />
          <span className="w-[105px] shrink-0 font-medium text-[#4a3810]">Mother's name</span>
          <span className="font-bold text-[#4a3810] mr-2">-</span>
          <span className="font-bold text-[#352507] truncate">{motherName !== '—' ? motherName : 'Mrs. Sunita Sharma'}</span>
        </div>

        {/* Address Row */}
        <div className="flex items-start">
          <div className="w-4 h-2.5 bg-[#f43f5e] -skew-x-[25deg] rounded-[1px] shrink-0 mr-2.5 mt-1 shadow-2xs" />
          <span className="w-[105px] shrink-0 font-medium text-[#4a3810] mt-0.5">Address</span>
          <span className="font-bold text-[#4a3810] mr-2 mt-0.5">-</span>
          <span className="font-bold text-[#352507] text-[11.5px] leading-snug line-clamp-2">
            {studentAddress}
          </span>
        </div>

        {/* Blue Phone Call Row (Centered) */}
        <div className="flex items-center justify-center gap-2 pt-2 text-[#1e3a8a]">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#1e3a8a] shrink-0">
            <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z" />
          </svg>
          <span className="text-[14px] font-black tracking-wider font-mono text-[#1e3a8a]">
            {mobile}
          </span>
        </div>
      </div>

      {/* ================= 5. BOTTOM FOOTER SECTION ================= */}
      <div className="px-5 pb-3 z-10 relative">
        {/* Pink Divider with Dashed Right Effect */}
        <div className="flex items-center w-full mb-2">
          <div className="flex-1 h-[2px] bg-[#f43f5e]" />
          <div className="w-20 flex gap-1.5 ml-2">
            <div className="flex-1 h-[2px] bg-[#f43f5e]" />
            <div className="flex-1 h-[2px] bg-[#f43f5e]" />
            <div className="flex-1 h-[2px] bg-[#f43f5e]" />
          </div>
        </div>

        {/* School Name Title */}
        <h3
          className="font-black text-[17.5px] tracking-wide uppercase text-center truncate leading-tight mb-1"
          style={{ color: '#805b10' }}
        >
          {schoolName}
        </h3>

        <div className="flex items-end justify-between">
          {/* Phone & Email on Left */}
          <div className="text-[10px] font-bold space-y-0.5 text-[#4a3810]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#d81b60] text-[13px] leading-none">☎</span>
              <span className="font-mono tracking-wider">{mobile}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#d81b60] text-[13px] leading-none">✉</span>
              <span className="truncate max-w-[200px]">{schoolEmail}</span>
            </div>
          </div>

          {/* 4 Diagonal Slanted Pink Stripes on Right */}
          <div className="flex gap-1.5 items-center pb-0.5 shrink-0">
            <div className="w-[3.5px] h-6 bg-[#f43f5e] rounded-full rotate-[20deg]" />
            <div className="w-[3.5px] h-6 bg-[#f43f5e] rounded-full rotate-[20deg]" />
            <div className="w-[3.5px] h-6 bg-[#f43f5e] rounded-full rotate-[20deg]" />
            <div className="w-[3.5px] h-6 bg-[#f43f5e] rounded-full rotate-[20deg]" />
          </div>
        </div>
      </div>
    </div>
  )
}
