import React, { useState, useEffect } from 'react'
import { schoolLogoBase64 as schoolLogo } from '../../assets/logoBase64'
import { highQualityQrBase64 as highQualityQr } from '../../assets/highQualityQrBase64'
import QRCode from 'qrcode'
import { useDocumentTemplates } from '../../context/DocumentTemplateContext'
import UniversalIdCard from '../DocumentTemplates/IdCards/UniversalIdCard'
import UniversalAdmitCard from '../DocumentTemplates/AdmitCards/UniversalAdmitCard'

const formatDateToIndian = (dateStr) => {
  if (!dateStr) return '12-12-2012'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) {
      return dateStr.replace(/\//g, '-')
    }
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
  } catch {
    return dateStr
  }
}

/**
 * StudentIdCard Component
 * Faithfully matches the official portrait identity card:
 * 1. Deep Navy top header with gold crest, bold white STAR PUBLIC SCHOOL, and gold star divider
 * 2. School address right below school name
 * 3. Centered rounded photo frame (Clean - No 'PHOTO HERE' placeholder)
 * 4. Clean, aligned details: Student Name, Class, Roll No., Father's Name, DOB, Address, Valid Till
 * 5. Bottom row: QR Code on left, Principal Cursive Signature on right
 * 6. Bottom navy swoosh wave with golden accent ribbon
 */
function StudentIdCard({
  student = {},
  validTill = '2027',
  orientation = 'vertical',
  cardType = 'id_card', // 'id_card' | 'admit_card'
  templateId = null,
  onPrint = null,
  showPrintButton = false,
  showCutLines = true,
}) {
  const studentName = student.Name || student.name || 'Student Name'
  const studentClass = student.Class || student.class || ''
  const formattedClass = studentClass.startsWith('Class') || ['Nursery', 'LKG', 'UKG'].includes(studentClass)
    ? studentClass
    : studentClass ? `Class ${studentClass}` : 'Class 1'
  const rollNo = student.Roll || student.roll_no || student.roll || student.RollNo || '01'
  const studentSection = student.Section || student.section || 'A'
  const fatherName = student.Father || student.FatherName || student.father_name || student.father || 'Father Name'
  const dob = formatDateToIndian(student.DateOfBirth || student.date_of_birth || student.dob || student.DOB)
  const studentAddress = student.Address || student.address || student.residential_address || 'Meghwal Mathia, West Champaran'
  const admissionNo =
    student.AdmissionNumber ||
    student.admission_number ||
    student.admissionNumber ||
    student.AdmissionNo ||
    student.admissionNo ||
    student.ID ||
    student.id ||
    `SPS-${rollNo}`

  const rawMobile =
    student.Mobile ||
    student.mobile ||
    student.phone ||
    student.Phone ||
    student.emergency_contact ||
    student.EmergencyContact ||
    student.contact ||
    ''

  const mobileFormatted = rawMobile
    ? (rawMobile.startsWith('+91')
        ? rawMobile
        : rawMobile.replace(/\D/g, '').length === 10
        ? `+91 ${rawMobile.replace(/\D/g, '').slice(0, 5)} ${rawMobile.replace(/\D/g, '').slice(5)}`
        : rawMobile)
    : '+91 94702 46849'

  // Comprehensive student photo resolution supporting all casing conventions & objects
  const rawPhoto =
    student.PhotoUrl ||
    student.photoUrl ||
    student.photo_url ||
    student.Photo ||
    student.photo ||
    student.image ||
    student.Image ||
    student.imageUrl ||
    student.avatar ||
    student.avatarUrl ||
    student.student_photo ||
    student.studentPhoto ||
    null

  const extractedPhotoUrl =
    typeof rawPhoto === 'object' && rawPhoto !== null
      ? (rawPhoto.url || rawPhoto.secure_url || rawPhoto.src || null)
      : typeof rawPhoto === 'string' && rawPhoto.trim()
        ? rawPhoto.trim()
        : null

  const photoUrl = extractedPhotoUrl
    ? (extractedPhotoUrl.startsWith('http://') ||
      extractedPhotoUrl.startsWith('https://') ||
      extractedPhotoUrl.startsWith('data:') ||
      extractedPhotoUrl.startsWith('blob:')
      ? extractedPhotoUrl
      : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${extractedPhotoUrl.startsWith('/') ? '' : '/'}${extractedPhotoUrl}`)
    : null

  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [photoUrl])

  // Streamlined student info for instant smartphone camera QR scanning
  const qrLines = [
    'STAR PUBLIC SCHOOL',
    `Name: ${studentName}`,
    `Class: ${formattedClass} (Sec: ${studentSection})`,
    `Roll No: ${rollNo}`,
    `Father: ${fatherName}`,
    mobileFormatted ? `Phone: ${mobileFormatted}` : null,
    dob ? `DOB: ${dob}` : null,
    studentAddress ? `Address: ${studentAddress}` : null,
    admissionNo ? `Adm No: ${admissionNo}` : null,
  ].filter(Boolean)

  const qrData = qrLines.join('\n')
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    let isCurrent = true
    QRCode.toDataURL(qrData, {
      margin: 1,
      width: 280,
      errorCorrectionLevel: 'L',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isCurrent) setQrDataUrl(url)
      })
      .catch(() => {
        if (isCurrent) setQrDataUrl(highQualityQr)
      })
    return () => {
      isCurrent = false
    }
  }, [qrData])

  // Global Active Document Template from Document Management System
  let activeTemplateId = templateId || 'id_card_modern_blue'
  try {
    const docContext = useDocumentTemplates()
    if (!templateId && docContext?.getActiveTemplateId) {
      activeTemplateId = docContext.getActiveTemplateId(cardType === 'admit_card' ? 'admit_card' : 'id_card')
    }
  } catch {
    // Context fallback
  }

  // Dynamic dispatch for Admit Card
  if (cardType === 'admit_card') {
    return (
      <div className="sps-id-card-wrapper flex flex-col items-center">
        <UniversalAdmitCard
          id={`sps-id-card-${rollNo}-${studentName.replace(/\s+/g, '')}`}
          templateId={activeTemplateId}
          student={student}
        />
      </div>
    )
  }

  // Dynamic dispatch for ID Card (when template is switched from Modern Blue)
  if (cardType === 'id_card' && activeTemplateId && activeTemplateId !== 'id_card_modern_blue') {
    return (
      <div className="sps-id-card-wrapper flex flex-col items-center">
        <UniversalIdCard
          id={`sps-id-card-${rollNo}-${studentName.replace(/\s+/g, '')}`}
          templateId={activeTemplateId}
          student={student}
        />
        {showPrintButton && (
          <div className="mt-2 flex items-center gap-2 sps-print-no-show">
            <button
              type="button"
              onClick={onPrint || (() => window.print())}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Print This Card</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  // ==================== VERTICAL (PORTRAIT) EXACT REPLICA ====================
  if (orientation === 'vertical') {
    return (
      <div className="sps-id-card-wrapper flex flex-col items-center">
        <div
          id={`sps-id-card-${rollNo}-${studentName.replace(/\s+/g, '')}`}
          className={`sps-id-card relative w-[350px] h-[541px] rounded-[18px] border-[2.5px] border-[#071d3f] bg-white shadow-xl overflow-hidden select-none text-slate-900 transition-transform ${showCutLines ? 'ring-1 ring-slate-300/60' : ''
            }`}
          style={{
            fontFamily: "'Lexend', 'Manrope', -apple-system, sans-serif",
            aspectRatio: '55 / 85',
          }}
        >
          {/* ================= 1. TOP HEADER (Curved Arch Design + Gold Ribbon) ================= */}
          <div className="sps-id-card-header relative bg-[#071d3f] pt-3 pb-3.5 px-3.5 text-white z-10 shrink-0">
            <div className="flex items-center gap-2.5 relative z-10">
              {/* Left: Golden Crest Logo */}
              <div className="flex-shrink-0">
                <img
                  src={schoolLogo}
                  alt="Star Public School Crest"
                  crossOrigin="anonymous"
                  className="sps-id-logo h-[48px] w-[48px] object-contain drop-shadow"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>

              {/* Thin Vertical Gold Divider Line */}
              <div className="h-[44px] w-[1.5px] bg-gradient-to-b from-transparent via-[#d4af37] to-transparent flex-shrink-0" />

              {/* Right: School Title, Star Divider & Address */}
              <div className="flex-1 min-w-0 pr-0.5">
                <h1 className="sps-id-title text-[16px] font-black uppercase tracking-tight text-white leading-tight font-sans">
                  STAR PUBLIC SCHOOL
                </h1>

                {/* Gold Star Divider Line */}
                <div className="flex items-center gap-1.5 my-0.5 w-full max-w-[210px]">
                  <span className="h-[1.2px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37] to-[#d4af37]" />
                  <span className="text-[#f59e0b] text-[9.5px] leading-none drop-shadow">★</span>
                  <span className="h-[1.2px] flex-1 bg-gradient-to-l from-transparent via-[#d4af37] to-[#d4af37]" />
                </div>

                {/* Address - Directly below school name inside header */}
                <p className="sps-id-address text-[8.5px] font-medium text-slate-200 tracking-tight leading-tight">
                  Meghwal mathia Bazar, West Champaran, Bihar 845106
                </p>
              </div>
            </div>

            {/* Gleaming Curved Arched Ribbon at Bottom of Header */}
            <div className="absolute -bottom-[12px] left-0 right-0 w-full h-[14px] overflow-hidden pointer-events-none z-20">
              <svg viewBox="0 0 350 14" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="goldHeaderCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9b7722" />
                    <stop offset="35%" stopColor="#f7dc8a" />
                    <stop offset="60%" stopColor="#d4af37" />
                    <stop offset="100%" stopColor="#9b7722" />
                  </linearGradient>
                </defs>
                <path d="M 0,0 L 350,0 C 265,11 85,11 0,0 Z" fill="#071d3f" />
                <path d="M 0,1 C 85,12 265,12 350,1" stroke="url(#goldHeaderCurveGrad)" strokeWidth="3" fill="none" />
              </svg>
            </div>
          </div>

          {/* ================= 2. CARD BODY (Centered Photo & Aligned Details) ================= */}
          <div className="relative px-4 pt-4 pb-2.5 flex-1 flex flex-col items-center justify-between z-10">
            {/* Subtle School Watermark */}
            <div className="pointer-events-none absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 opacity-[0.05] w-[200px] h-[200px] select-none">
              <img src={schoolLogo} alt="" crossOrigin="anonymous" className="w-full h-full object-contain grayscale" />
            </div>

            {/* Document Title Badge */}
            <div className="sps-card-type-badge mb-1.5 z-20">
              <span className="inline-block rounded-full bg-[#071d3f] border border-[#d4af37] px-3 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-[#f59e0b] shadow-2xs">
                {cardType === 'admit_card' ? 'EXAMINATION ADMIT CARD' : 'STUDENT IDENTITY CARD'}
              </span>
            </div>

            {/* Centered Passport Photo Box with Navy Frame (Clean - No 'PHOTO HERE') */}
            <div className="sps-id-photo-frame relative w-[100px] h-[120px] rounded-[10px] border-[2.2px] border-[#071d3f] overflow-hidden bg-slate-100 shadow-sm shrink-0 z-10 mb-1.5">
              {photoUrl && !imgError ? (
                <img
                  src={photoUrl}
                  alt={studentName}
                  className="w-full h-full object-cover object-top"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-b from-[#e8f0fc] to-[#d0e2f9] relative">
                  {/* Professional School Student Avatar Placeholder */}
                  <svg viewBox="0 0 80 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {/* Head */}
                    <circle cx="40" cy="32" r="18" fill="#1e3a6a" opacity="0.85" />
                    {/* Hair shape */}
                    <path d="M22,32 C22,18 30,12 40,12 C50,12 58,18 58,32 C54,26 48,22 40,22 C32,22 26,26 22,32 Z" fill="#071d3f" />
                    {/* Uniform Blazer / Shoulders */}
                    <path d="M10,88 C10,65 24,56 40,56 C56,56 70,65 70,88 L10,88 Z" fill="#071d3f" />
                    {/* White Shirt Collar */}
                    <polygon points="32,56 40,70 48,56 40,58" fill="#ffffff" />
                    <polygon points="32,56 40,68 36,56" fill="#f1f5f9" />
                    <polygon points="48,56 40,68 44,56" fill="#e2e8f0" />
                    {/* School Gold Tie */}
                    <polygon points="38,64 42,64 43,84 40,88 37,84" fill="#d4af37" />
                    <polygon points="37.5,62 42.5,62 41.5,65 38.5,65" fill="#b89326" />
                  </svg>
                </div>
              )}
            </div>

            {/* Student Details (Including Contact No. with Optimal Row Spacing) */}
            <div className="sps-id-details-box w-full max-w-[305px] mx-auto space-y-1 z-10 pt-0.5 pb-0.5 text-[12.5px] leading-tight shrink-0 font-sans">
              <div className="flex items-baseline">
                <span className="sps-id-details-label w-[102px] flex-shrink-0 font-bold text-[#071d3f] text-left">
                  Student Name
                </span>
                <span className="font-bold text-[#071d3f] mr-2">:</span>
                <span className="font-black text-slate-900 tracking-tight text-[13.5px] leading-tight flex-1 text-left break-words">
                  {studentName}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="sps-id-details-label w-[102px] flex-shrink-0 font-bold text-[#071d3f] text-left">
                  Class
                </span>
                <span className="font-bold text-[#071d3f] mr-2">:</span>
                <span className="font-black text-slate-900 tracking-tight text-[13.5px] leading-tight flex-1 text-left">
                  {formattedClass}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="sps-id-details-label w-[102px] flex-shrink-0 font-bold text-[#071d3f] text-left">
                  Roll No.
                </span>
                <span className="font-bold text-[#071d3f] mr-2">:</span>
                <span className="font-black text-slate-900 tracking-tight text-[13.5px] leading-tight flex-1 text-left">
                  {rollNo}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="sps-id-details-label w-[102px] flex-shrink-0 font-bold text-[#071d3f] text-left">
                  Father&apos;s Name
                </span>
                <span className="font-bold text-[#071d3f] mr-2">:</span>
                <span className="font-black text-slate-900 tracking-tight text-[13px] leading-tight flex-1 text-left break-words">
                  {fatherName}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="sps-id-details-label w-[102px] flex-shrink-0 font-bold text-[#071d3f] text-left">
                  Contact No.
                </span>
                <span className="font-bold text-[#071d3f] mr-2">:</span>
                <span className="font-black text-slate-900 font-mono tracking-tight text-[13px] leading-tight flex-1 text-left">
                  {mobileFormatted}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="sps-id-details-label w-[102px] flex-shrink-0 font-bold text-[#071d3f] text-left">
                  Date of Birth
                </span>
                <span className="font-bold text-[#071d3f] mr-2">:</span>
                <span className="font-black text-slate-900 font-mono tracking-tight text-[13px] leading-tight flex-1 text-left">
                  {dob}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="sps-id-details-label w-[102px] flex-shrink-0 font-bold text-[#071d3f] text-left">
                  Address
                </span>
                <span className="font-bold text-[#071d3f] mr-2">:</span>
                <span className="font-black text-slate-900 tracking-tight text-[12.5px] leading-tight flex-1 text-left break-words line-clamp-1">
                  {studentAddress}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="sps-id-details-label w-[102px] flex-shrink-0 font-bold text-[#071d3f] text-left">
                  {cardType === 'admit_card' ? 'Exam Session' : 'Valid Till'}
                </span>
                <span className="font-bold text-[#071d3f] mr-2">:</span>
                <span className="font-black text-slate-900 font-mono tracking-tight text-[13px] leading-tight flex-1 text-left">
                  {cardType === 'admit_card' ? '2026–27' : validTill}
                </span>
              </div>
            </div>

            {/* Bottom Row: Enhanced QR Code on Left, Principal Signature on Right */}
            <div className="w-full flex items-end justify-between z-10 px-2 pt-1 pb-1 shrink-0 mt-1">
              {/* QR Code Container with Scan Label */}
              <div className="flex flex-col items-center">
                <div className="sps-id-qr-box relative w-[68px] h-[68px] rounded-[8px] border-[1.5px] border-[#071d3f] bg-white p-0.5 shadow-xs flex items-center justify-center overflow-hidden">
                  <img
                    src={qrDataUrl || highQualityQr}
                    alt="Student QR"
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <span className="text-[7.5px] font-black uppercase tracking-wider text-[#071d3f] mt-1 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200">
                  Scan to Verify
                </span>
              </div>

              {/* Principal Signature & Label */}
              <div className="flex flex-col items-center text-center pr-1 pb-1">
                {/* Cursive Signature matching image */}
                <div className="sps-id-sign-img h-7 w-24 flex items-center justify-center">
                  <span
                    className="text-[23px] text-[#071d3f] font-serif italic font-normal leading-none select-none tracking-normal"
                    style={{
                      fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                    }}
                  >
                    Principal
                  </span>
                </div>
                {/* Horizontal Underline */}
                <div className="w-24 h-[1.5px] bg-[#071d3f] mt-0.5" />
                <p className="sps-id-sign-label text-[10px] font-black text-[#071d3f] tracking-wider mt-0.5 uppercase">
                  {cardType === 'admit_card' ? 'Controller of Exam' : 'Principal'}
                </p>
              </div>
            </div>
          </div>

          {/* ================= 3. BOTTOM NAVY & GOLD CURVED FLOURISH ================= */}
          <div className="sps-id-card-bottom-wave absolute bottom-0 left-0 right-0 w-full h-[24px] overflow-hidden pointer-events-none z-0">
            <svg
              viewBox="0 0 350 24"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="goldBottomWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9b7722" />
                  <stop offset="35%" stopColor="#f7dc8a" />
                  <stop offset="60%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#9b7722" />
                </linearGradient>
              </defs>
              {/* Bottom Navy Wave */}
              <path
                d="M 0,18 C 70,6 160,4 230,14 C 290,22 325,16 350,10 L 350,24 L 0,24 Z"
                fill="#071d3f"
              />
              {/* Golden Wave Ribbon */}
              <path
                d="M 0,16 C 70,4 160,2 230,12 C 290,20 325,14 350,8"
                stroke="url(#goldBottomWaveGrad)"
                strokeWidth="2.5"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {showPrintButton && (
          <div className="mt-2 flex items-center gap-2 sps-print-no-show">
            <button
              type="button"
              onClick={onPrint || (() => window.print())}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Print This Card</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  // ==================== HORIZONTAL (LANDSCAPE) CARD LAYOUT ====================
  return (
    <div className="sps-id-card-wrapper flex flex-col items-center">
      <div
        id={`sps-id-card-${rollNo}-${studentName.replace(/\s+/g, '')}`}
        className={`sps-id-card relative w-[540px] h-[340px] max-w-full rounded-[22px] border-[3px] border-[#071d3f] bg-white shadow-xl overflow-hidden select-none text-slate-900 transition-transform ${showCutLines ? 'ring-1 ring-slate-300/60' : ''
          }`}
        style={{
          fontFamily: "'Lexend', 'Manrope', -apple-system, sans-serif",
          aspectRatio: '1.588 / 1',
        }}
      >
        {/* Header */}
        <div className="sps-id-card-header relative bg-[#071d3f] pt-2.5 pb-2 px-4 text-white z-10">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <img
                src={schoolLogo}
                alt="Star Public School Logo"
                className="sps-id-logo h-[64px] w-[64px] object-contain drop-shadow-md"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <h1 className="sps-id-title text-[25px] sm:text-[27px] font-black uppercase tracking-tight text-white leading-none font-sans">
                STAR PUBLIC SCHOOL
              </h1>

              <div className="flex items-center gap-2 my-1">
                <span className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37] to-[#d4af37]" />
                <span className="text-[#f59e0b] text-[13px] leading-none drop-shadow">★</span>
                <span className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-[#d4af37] to-[#d4af37]" />
              </div>

              <p className="sps-id-address text-[10.5px] sm:text-[11.5px] font-medium text-slate-200 tracking-wide leading-tight truncate">
                Meghwal mathia Bazar, West Champaran, Bihar 845106
              </p>
            </div>
          </div>

          <div className="absolute -bottom-[5px] left-0 right-0 h-[5px] bg-gradient-to-r from-[#9b7722] via-[#f3d37a] to-[#9b7722] shadow-xs" />
        </div>

        {/* Body */}
        <div className="relative p-3.5 pt-3.5 flex items-stretch gap-4 h-[calc(100%-88px)] bg-white">
          <div className="pointer-events-none absolute right-14 top-1/2 -translate-y-1/2 opacity-[0.06] w-[210px] h-[210px] select-none">
            <img src={schoolLogo} alt="" className="w-full h-full object-contain grayscale" />
          </div>

          {/* Left: Photo Box */}
          <div className="flex flex-col items-center justify-start flex-shrink-0 z-10 pt-0.5">
            <div className="sps-id-photo-frame relative w-[118px] h-[150px] rounded-[14px] border-[2.5px] border-[#071d3f] overflow-hidden bg-slate-100 shadow-sm">
              {photoUrl && !imgError ? (
                <img
                  src={photoUrl}
                  alt={studentName}
                  className="w-full h-full object-cover object-top"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-b from-[#e8f0fc] to-[#d0e2f9] relative">
                  <svg viewBox="0 0 80 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    <circle cx="40" cy="32" r="18" fill="#1e3a6a" opacity="0.85" />
                    <path d="M22,32 C22,18 30,12 40,12 C50,12 58,18 58,32 C54,26 48,22 40,22 C32,22 26,26 22,32 Z" fill="#071d3f" />
                    <path d="M10,88 C10,65 24,56 40,56 C56,56 70,65 70,88 L10,88 Z" fill="#071d3f" />
                    <polygon points="32,56 40,70 48,56 40,58" fill="#ffffff" />
                    <polygon points="32,56 40,68 36,56" fill="#f1f5f9" />
                    <polygon points="48,56 40,68 44,56" fill="#e2e8f0" />
                    <polygon points="38,64 42,64 43,84 40,88 37,84" fill="#d4af37" />
                    <polygon points="37.5,62 42.5,62 41.5,65 38.5,65" fill="#b89326" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Center: Details */}
          <div className="sps-id-details-box flex-1 flex flex-col justify-center min-w-0 z-10 space-y-1.5 py-0.5 pl-1">
            <div className="flex items-baseline text-[13px] sm:text-[14px] leading-tight">
              <span className="sps-id-details-label w-[110px] flex-shrink-0 font-bold text-[#071d3f]">Student Name</span>
              <span className="font-bold text-[#071d3f] mr-2.5">:</span>
              <span className="font-black text-slate-900 truncate tracking-tight text-[14px] sm:text-[15px]">
                {studentName}
              </span>
            </div>

            <div className="flex items-baseline text-[13px] sm:text-[14px] leading-tight">
              <span className="sps-id-details-label w-[110px] flex-shrink-0 font-bold text-[#071d3f]">Class</span>
              <span className="font-bold text-[#071d3f] mr-2.5">:</span>
              <span className="font-black text-slate-900 tracking-tight text-[14px] sm:text-[15px]">
                {formattedClass}
              </span>
            </div>

            <div className="flex items-baseline text-[13px] sm:text-[14px] leading-tight">
              <span className="sps-id-details-label w-[110px] flex-shrink-0 font-bold text-[#071d3f]">Roll No.</span>
              <span className="font-bold text-[#071d3f] mr-2.5">:</span>
              <span className="font-black text-slate-900 tracking-tight text-[14px] sm:text-[15px]">
                {rollNo}
              </span>
            </div>

            <div className="flex items-baseline text-[13px] sm:text-[14px] leading-tight">
              <span className="sps-id-details-label w-[110px] flex-shrink-0 font-bold text-[#071d3f]">Father&apos;s Name</span>
              <span className="font-bold text-[#071d3f] mr-2.5">:</span>
              <span className="font-black text-slate-900 truncate tracking-tight text-[14px] sm:text-[15px]">
                {fatherName}
              </span>
            </div>

            <div className="flex items-baseline text-[13px] sm:text-[14px] leading-tight">
              <span className="sps-id-details-label w-[110px] flex-shrink-0 font-bold text-[#071d3f]">Contact No.</span>
              <span className="font-bold text-[#071d3f] mr-2.5">:</span>
              <span className="font-black text-slate-900 font-mono tracking-tight text-[13px] sm:text-[14px]">
                {mobileFormatted}
              </span>
            </div>

            <div className="flex items-baseline text-[13px] sm:text-[14px] leading-tight">
              <span className="sps-id-details-label w-[110px] flex-shrink-0 font-bold text-[#071d3f]">Date of Birth</span>
              <span className="font-bold text-[#071d3f] mr-2.5">:</span>
              <span className="font-black text-slate-900 font-mono tracking-tight text-[14px] sm:text-[15px]">
                {dob}
              </span>
            </div>

            <div className="flex items-baseline text-[13px] sm:text-[14px] leading-tight">
              <span className="sps-id-details-label w-[110px] flex-shrink-0 font-bold text-[#071d3f]">Address</span>
              <span className="font-bold text-[#071d3f] mr-2.5">:</span>
              <span className="font-black text-slate-900 tracking-tight text-[13px] sm:text-[14px] truncate">
                {studentAddress}
              </span>
            </div>

            <div className="flex items-baseline text-[13px] sm:text-[14px] leading-tight">
              <span className="sps-id-details-label w-[110px] flex-shrink-0 font-bold text-[#071d3f]">Valid Till</span>
              <span className="font-bold text-[#071d3f] mr-2.5">:</span>
              <span className="font-black text-slate-900 font-mono tracking-tight text-[14px] sm:text-[15px]">
                {validTill}
              </span>
            </div>
          </div>

          {/* Right: Signature & QR */}
          <div className="flex flex-col justify-end items-end flex-shrink-0 z-10 w-[96px] pb-1 space-y-2">
            <div className="flex flex-col items-center text-center w-full">
              <div className="sps-id-sign-img h-7 w-20 flex items-center justify-center">
                <span
                  className="text-[24px] text-[#071d3f] font-serif italic font-normal leading-none select-none"
                  style={{
                    fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                  }}
                >
                  Principal
                </span>
              </div>

              <div className="w-18 h-[1.5px] bg-[#071d3f] mt-0.5" />
              <p className="sps-id-sign-label text-[11px] font-black text-[#071d3f] tracking-wide mt-0.5">
                Principal
              </p>
            </div>

            <div className="sps-id-qr-box relative w-[76px] h-[76px] rounded-[10px] border-[1.5px] border-[#071d3f] bg-white p-0.5 shadow-xs flex items-center justify-center overflow-hidden">
              <img
                src={qrDataUrl || highQualityQr}
                alt="Student Verification QR"
                className="w-full h-full object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Decorative Curves */}
        <div className="absolute -bottom-6 -left-6 w-32 h-14 bg-[#071d3f] rounded-full -rotate-6 z-0" />
        <div className="absolute -bottom-5 -left-5 w-32 h-13 border-t-2 border-[#d4af37] rounded-full -rotate-6 z-0" />
        <div className="absolute -bottom-7 right-12 w-28 h-10 bg-[#071d3f] rounded-full rotate-3 z-0" />
        <div className="absolute -bottom-6 right-12 w-28 h-9 border-t-2 border-[#d4af37] rounded-full rotate-3 z-0" />
      </div>

      {showPrintButton && (
        <div className="mt-2 flex items-center gap-2 sps-print-no-show">
          <button
            type="button"
            onClick={onPrint || (() => window.print())}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Print This Card</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default StudentIdCard
