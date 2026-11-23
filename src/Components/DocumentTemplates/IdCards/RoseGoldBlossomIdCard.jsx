import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { highQualityQrBase64 as highQualityQr } from '../../../assets/highQualityQrBase64'

export default function RoseGoldBlossomIdCard({
  student = {},
  customization = {},
  scale = 1,
  id,
}) {
  const studentName = student.Name || student.name || 'RAHAT HOSSAIN'
  const fatherName = student.father_name || student.FatherName || student.fatherName || '—'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '1025').toString()
  const rawClass = (student.Class || student.class || '10').toString()
  const studentSection = (student.Section || student.section || 'A').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || `VU24CS${rollNo}`
  const mobile = student.mobile || student.Mobile || student.phone || student.contact_no || ''
  const bloodGroup = student.blood_group || student.BloodGroup || student.bloodGroup || 'O+ Pos'

  // Customization bindings
  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const campusName = customization.tagline || 'Meghwal Mathia Bazar, West Champaran'
  const batch = customization.session || customization.validTill || '2024 – 2028'
  const dateOfIssue = customization.dateOfIssue || '15 May 2024'
  const principalSignLabel = customization.principalSignLabel || 'Registrar'
  const principalSign = customization.principalSignature || 'B. Veridian'
  const department = student.department || student.Department || student.stream || (rawClass ? `Class ${rawClass} (${studentSection})` : 'Computer Science')

  const photo = student.PhotoUrl || student.photoUrl || student.photo_url || student.photo || student.image || null

  // Fast-scanning QR code payload
  const qrLines = [
    schoolName,
    `Name: ${studentName}`,
    `Class: ${rawClass} (${studentSection})`,
    `ID: ${admissionNo}`,
    `Roll: ${rollNo}`,
    `Father: ${fatherName}`,
    mobile ? `Phone: ${mobile}` : null,
    `Blood: ${bloodGroup}`,
  ].filter(Boolean)

  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    let isCurrent = true
    QRCode.toDataURL(qrLines.join('\n'), {
      margin: 1,
      width: 160,
      errorCorrectionLevel: 'L',
      color: { dark: '#051329', light: '#ffffff' },
    })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => { if (isCurrent) setQrDataUrl(highQualityQr) })
    return () => { isCurrent = false }
  }, [studentName, rollNo, rawClass, mobile, admissionNo])

  return (
    <div
      id={id || `veridian-id-card-${rollNo}-${studentName.replace(/\s+/g, '')}`}
      style={{
        width: '356px',
        height: '590px',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
      className="relative bg-white rounded-[24px] overflow-hidden flex flex-col justify-between select-none border border-slate-200/80 transition-all duration-300 shadow-2xl"
    >
      {/* ================= 1. SECURITY GUILLOCHE OVERLAY ================= */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(14, 116, 233, 0.04) 1px, transparent 1px), repeating-radial-gradient(circle at 100% 100%, transparent 0, transparent 8px, rgba(14, 116, 233, 0.02) 9px, transparent 10px)',
          backgroundSize: '16px 16px, 100% 100%',
        }}
      />

      {/* ================= 2. CARD HEADER GEOMETRIC ================= */}
      <header className="relative w-full z-10 flex-shrink-0">
        {/* Dark Blue Geometric Prism Header Block */}
        <div
          className="relative w-full h-[190px] bg-gradient-to-br from-[#051329] via-[#0B1E3F] to-[#0D3B78] px-5 pt-3 pb-8 flex flex-col items-center"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 72%, 0 100%)',
          }}
        >
          {/* Punch Hole Slot (Lanyard attachment cutout) */}
          <div
            className="w-14 h-[10px] rounded-full bg-[#050C16] mb-2.5 border border-white/10"
            style={{
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6), 0 1px 1px rgba(255, 255, 255, 0.2)',
            }}
            title="Lanyard Slot Hole"
          />

          {/* Institution Branding / Crest */}
          <div className="flex items-center gap-2.5 w-full justify-center px-1">
          <div className="flex items-center gap-2.5 justify-center px-1">
            {/* University Star Crest Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1E6BF3] to-[#00D2FF] p-[1.5px] shadow-md flex items-center justify-center flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1E6BF3] to-[#00D2FF] p-[1.5px] shadow-md flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-[#051329] rounded-[10px] flex items-center justify-center">
                {/* SVG Crest with Star & Shield */}
                <svg
                  className="w-6 h-6 text-[#00D2FF]"
                  className="w-5 h-5 text-[#00D2FF]"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polygon
                    fill="currentColor"
                    points="12 8 13.5 11 17 11.5 14.5 14 15 17.5 12 16 9 17.5 9.5 14 7 11.5 10.5 11"
                    stroke="none"
                  />
                </svg>
              </div>
            </div>

            {/* University Textual Identity */}
            <div className="text-left flex-1 min-w-0 pr-1">
              <h1 className="text-white text-[13.5px] sm:text-[14.5px] font-extrabold tracking-wide uppercase leading-tight font-sans break-words">
                {schoolName}
              </h1>
              <p className="text-[8.5px] sm:text-[9px] text-[#00D2FF] tracking-wide font-semibold uppercase leading-tight mt-0.5 break-words">
                {campusName}
              </p>
            </div>
            <h1 className="text-white text-[14px] sm:text-[15px] font-extrabold tracking-wide uppercase leading-tight font-sans">
              {schoolName}
            </h1>
          </div>

          {/* Centered Address / Subtitle */}
          <p className="text-[8.5px] sm:text-[9px] text-[#00D2FF] tracking-wide font-semibold uppercase leading-tight mt-1 text-center max-w-[320px] px-2 break-words">
            {campusName}
          </p>

          {/* Motto Slogan */}
          <div className="mt-2 text-[8px] tracking-[0.2em] uppercase font-medium text-slate-300/80 flex items-center gap-2">
          <div className="mt-1.5 text-[8px] tracking-[0.2em] uppercase font-medium text-slate-300/80 flex items-center gap-2">
            <span>Learn</span>
            <span className="w-1 h-1 rounded-full bg-[#00D2FF]" />
            <span>Grow</span>
            <span className="w-1 h-1 rounded-full bg-[#00D2FF]" />
            <span>Achieve</span>
          </div>
        </div>

        {/* Overlapping Dynamic Cyan Accent Angle */}
        <div
          className="absolute bottom-[-16px] right-0 w-44 h-14 bg-gradient-to-l from-[#1E6BF3] to-[#00D2FF] opacity-90 pointer-events-none -z-0"
          style={{
            clipPath: 'polygon(100% 40%, 100% 86%, 52% 100%, 0 88%, 0 100%)',
          }}
        />
      </header>

      {/* ================= 3. CARD BODY: STUDENT DETAILS ================= */}
      <div className="relative z-10 px-6 flex flex-col items-center flex-grow -mt-14">
        {/* Student Photo Portrait Container */}
        <div className="relative group">
          {/* Outer gradient aura ring */}
          <div className="w-[124px] h-[124px] rounded-full bg-gradient-to-tr from-[#1E6BF3] via-[#00D2FF] to-white p-[3.5px] shadow-xl">
            {/* Pure white spacer rim */}
            <div className="w-full h-full rounded-full bg-white p-[3px] overflow-hidden flex items-center justify-center">
              {photo ? (
                <img
                  alt={`Student Portrait - ${studentName}`}
                  className="w-full h-full object-cover object-top rounded-full"
                  src={photo}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-extrabold text-2xl uppercase">
                  {studentName.charAt(0) || 'S'}
                </div>
              )}
            </div>
          </div>

          {/* Floating Status Badge (Enrolled/Verified) */}
          <div
            className="absolute bottom-1 right-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-full p-[3px] shadow-md border-2 border-white"
            title="Verified Active Student"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                clipRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                fillRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Student Name & Specialization */}
        <div className="mt-3 text-center w-full">
          <h2 className="text-[19px] font-extrabold text-[#051329] tracking-tight uppercase leading-snug truncate px-2">
            {studentName}
          </h2>
          <div className="inline-flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-bold text-[#1E6BF3] tracking-wide">
              {rawClass ? `Class ${rawClass} • Section ${studentSection}` : 'BSc in Computer Science'}
            </span>
          </div>
          {/* Decorative Minimal Pill Underline */}
          <div className="w-10 h-[3px] bg-gradient-to-r from-[#1E6BF3] to-[#00D2FF] rounded-full mx-auto mt-1.5" />
        </div>

        {/* Student Formal Credentials Table Grid */}
        <div className="w-full mt-4 bg-slate-50/90 backdrop-blur-xs rounded-xl p-3 border border-slate-200/70 shadow-xs relative">
          <div className="flex items-center justify-between gap-2">
            <dl className="space-y-1.5 text-[11px] flex-1">
              {/* Student ID Number */}
              <div className="grid grid-cols-12 items-baseline">
                <dt className="col-span-5 font-semibold text-slate-500 uppercase tracking-wider text-[9.5px]">
                  Student ID
                </dt>
                <dd className="col-span-1 text-slate-400 font-bold">:</dd>
                <dd className="col-span-6 font-mono font-bold text-[#051329] text-[11.5px] tracking-wider truncate">
                  {admissionNo}
                </dd>
              </div>

              {/* Batch / Academic Year */}
              <div className="grid grid-cols-12 items-baseline">
                <dt className="col-span-5 font-semibold text-slate-500 uppercase tracking-wider text-[9.5px]">
                  Batch
                </dt>
                <dd className="col-span-1 text-slate-400 font-bold">:</dd>
                <dd className="col-span-6 font-medium text-slate-800 truncate">
                  {batch}
                </dd>
              </div>

              {/* Department */}
              <div className="grid grid-cols-12 items-baseline">
                <dt className="col-span-5 font-semibold text-slate-500 uppercase tracking-wider text-[9.5px]">
                  Department
                </dt>
                <dd className="col-span-1 text-slate-400 font-bold">:</dd>
                <dd className="col-span-6 font-semibold text-slate-800 truncate">
                  {department}
                </dd>
              </div>

              {/* Date of Issue */}
              <div className="grid grid-cols-12 items-baseline">
                <dt className="col-span-5 font-semibold text-slate-500 uppercase tracking-wider text-[9.5px]">
                  Date of Issue
                </dt>
                <dd className="col-span-1 text-slate-400 font-bold">:</dd>
                <dd className="col-span-6 font-medium text-slate-700 truncate">
                  {dateOfIssue}
                </dd>
              </div>

              {/* Blood Group Badge Tag */}
              <div className="grid grid-cols-12 items-center pt-0.5">
                <dt className="col-span-5 font-semibold text-slate-500 uppercase tracking-wider text-[9.5px]">
                  Blood Group
                </dt>
                <dd className="col-span-1 text-slate-400 font-bold">:</dd>
                <dd className="col-span-6">
                  <span className="inline-block px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[9.5px] font-bold border border-red-200/60 leading-none">
                    {bloodGroup}
                  </span>
                </dd>
              </div>
            </dl>

            {/* High-Resolution Micro QR Code for Turnstile Verification */}
            {qrDataUrl && (
              <div className="flex-shrink-0 flex flex-col items-center bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                <img
                  src={qrDataUrl}
                  alt="Student QR Verification"
                  className="w-12 h-12 object-contain"
                />
                <span className="text-[7px] font-mono text-slate-400 font-semibold uppercase mt-0.5">
                  VERIFIED
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= 4. CARD FOOTER ================= */}
      <footer className="relative z-10 w-full mt-auto flex-shrink-0">
        {/* Security Hologram Nano-Bar Indicator */}
        <div
          className="w-full h-[5px] border-y border-slate-200/40"
          style={{
            background:
              'linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(0, 210, 255, 0.15) 25%, rgba(238, 130, 238, 0.15) 50%, rgba(255, 215, 0, 0.15) 75%, rgba(255,255,255,0) 100%)',
          }}
        />

        <div className="relative bg-white px-6 pt-3 pb-4 flex items-end justify-between overflow-hidden">
          {/* Official Registrar Signature Block */}
          <div className="text-left z-10">
            <div className="h-8 flex items-end">
              {/* Stylized Authentic Registrar Signature */}
              <span
                style={{
                  fontFamily: "'Alex Brush', 'Dancing Script', cursive",
                }}
                className="text-2xl text-slate-800 tracking-wide font-normal -rotate-2 origin-bottom-left select-none"
              >
                {principalSign}
              </span>
            </div>
            <div className="w-24 h-[1px] bg-slate-300 mt-0.5" />
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500 mt-1">
              {principalSignLabel}
            </p>
          </div>

          {/* Validity Chip Indicator */}
          <div className="z-10 text-right pr-6 pb-1">
            <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-widest leading-none">
              Card Status
            </span>
            <span className="text-[10px] font-bold text-[#0D3B78] tracking-wide">
              Official Valid
            </span>
          </div>

          {/* Bottom Right Geometric Blue Wedge with University Monogram "V" */}
          <div
            className="absolute bottom-0 right-0 w-28 h-20 bg-gradient-to-tl from-[#051329] via-[#0B1E3F] to-[#0D3B78] flex items-end justify-end p-2.5 pointer-events-none"
            style={{
              clipPath: 'polygon(100% 28%, 100% 100%, 54% 100%)',
            }}
          >
            {/* Monogram Watermark */}
            <span
              style={{ fontFamily: "'Space Grotesk', monospace" }}
              className="text-[#1E6BF3]/70 font-black text-2xl tracking-tighter italic select-none transform translate-x-0.5 translate-y-0.5"
            >
              V
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
