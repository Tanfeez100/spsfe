import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import { highQualityQrBase64 as highQualityQr } from '../../../assets/highQualityQrBase64'

export default function ModernBlueIdCard({
  student = {},
  customization = {},
  orientation = 'vertical',
  scale = 1,
  id,
}) {
  const studentName = student.Name || student.name || '—'
  const fatherName = student.father_name || student.FatherName || student.fatherName || '—'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '—').toString()
  const rawClass = (student.Class || student.class || '—').toString()
  const studentSection = (student.Section || student.section || '—').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || '—'
  const dob = student.date_of_birth || student.dob || '—'
  const studentAddress = student.address || ''
  const mobile = student.mobile || student.Mobile || student.phone || student.contact_no || ''
  const validTill = customization.validTill || '31/03/2027'
  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const tagline = customization.tagline || 'Affiliated to State Board | Bettiah, West Champaran'
  const primaryColor = customization.primaryColor || '#071d3f'
  const secondaryColor = customization.secondaryColor || '#d4af37'
  const principalSignLabel = customization.principalSignLabel || 'Principal Sign'

  // Photo resolution
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
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => { if (isCurrent) setQrDataUrl(highQualityQr) })
    return () => { isCurrent = false }
  }, [studentName, rollNo, rawClass, mobile])

  return (
    <div
      id={id || `modern-blue-card-${rollNo}-${studentName.replace(/\s+/g, '')}`}
      className="relative w-[350px] h-[541px] rounded-[18px] bg-white shadow-xl overflow-hidden select-none text-slate-900 border-[2.5px]"
      style={{
        borderColor: primaryColor,
        fontFamily: "'Lexend', 'Manrope', -apple-system, sans-serif",
        aspectRatio: '55 / 85',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      {/* 1. Header with Curved Arch Design & Gold Ribbon */}
      <div
        className="relative pt-3 pb-3.5 px-3.5 text-white z-10 shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="flex-shrink-0">
            <div className="w-[50px] h-[50px] rounded-full bg-white/10 p-1 flex items-center justify-center border border-white/20">
              <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex-1 min-w-0 text-center">
            <h1 className="font-extrabold text-[17px] tracking-tight leading-tight uppercase font-serif drop-shadow-sm truncate">
              {schoolName}
            </h1>
            <p className="text-[9px] font-medium text-blue-100 tracking-wide mt-0.5 truncate">
              {tagline}
            </p>
          </div>
        </div>

        {/* Golden Arch Ribbon */}
        <div
          className="absolute -bottom-3 left-0 right-0 h-4 border-t-2 flex items-center justify-center z-10"
          style={{
            backgroundColor: secondaryColor,
            borderColor: '#ffffff',
            borderRadius: '0 0 50% 50% / 0 0 100% 100%',
          }}
        >
          <span className="text-[9px] font-black tracking-widest text-[#071d3f] uppercase">
            STUDENT IDENTITY CARD
          </span>
        </div>
      </div>

      {/* 2. Photo Section */}
      <div className="flex flex-col items-center pt-5 pb-1 z-10 relative">
        <div
          className="relative w-[98px] h-[116px] rounded-[10px] bg-slate-100 p-1 shadow-md border-[2px]"
          style={{ borderColor: primaryColor }}
        >
          {photo ? (
            <img src={photo} alt={studentName} className="w-full h-full object-cover rounded-[7px]" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
              <span className="material-symbols-outlined text-4xl">person</span>
              <span className="text-[9px] font-bold mt-1">PHOTO</span>
            </div>
          )}
        </div>
        <h2 className="font-black text-[15px] text-center mt-1 text-slate-900 tracking-tight leading-snug px-2 truncate max-w-[320px]">
          {studentName}
        </h2>
        <span
          className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white mt-0.5"
          style={{ backgroundColor: primaryColor }}
        >
          CLASS {rawClass} (SEC {studentSection})
        </span>
      </div>

      {/* 3. Details Body (8 Rows) */}
      <div className="px-5 py-1 text-[11.5px] space-y-0.5 text-slate-800 z-10 relative">
        <div className="flex items-baseline">
          <span className="w-[96px] shrink-0 font-bold" style={{ color: primaryColor }}>Roll Number</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-black text-slate-900 font-mono text-[12.5px]">{rollNo}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[96px] shrink-0 font-bold" style={{ color: primaryColor }}>Admission No</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-black text-slate-900 font-mono text-[11px] truncate">{admissionNo}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[96px] shrink-0 font-bold" style={{ color: primaryColor }}>Father's Name</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-black text-slate-900 truncate">{fatherName}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[96px] shrink-0 font-bold" style={{ color: primaryColor }}>Contact No</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-black text-slate-900 font-mono">{mobile || 'Not Configured'}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[96px] shrink-0 font-bold" style={{ color: primaryColor }}>Date of Birth</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-black text-slate-900 font-mono">{dob}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[96px] shrink-0 font-bold" style={{ color: primaryColor }}>Address</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-black text-slate-900 text-[11px] truncate leading-tight">{studentAddress}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[96px] shrink-0 font-bold" style={{ color: primaryColor }}>Valid Till</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-black text-slate-900 font-mono">{validTill}</span>
        </div>
      </div>

      {/* 4. Bottom Footer: QR & Principal Signature */}
      <div className="absolute bottom-2 left-0 right-0 px-4 flex items-end justify-between z-10">
        <div className="flex flex-col items-center">
          <div
            className="w-[66px] h-[66px] rounded-[8px] bg-white p-0.5 border-[1.5px] shadow-xs flex items-center justify-center overflow-hidden"
            style={{ borderColor: primaryColor }}
          >
            <img
              src={qrDataUrl || highQualityQr}
              alt="QR Code"
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <span className="text-[7px] font-black uppercase tracking-wider mt-0.5 text-blue-900 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
            Scan to Verify
          </span>
        </div>

        <div className="flex flex-col items-center text-center pb-1">
          <div className="h-6 w-24 flex items-center justify-center">
            <span
              className="text-[20px] font-serif italic font-bold select-none leading-none"
              style={{ color: primaryColor, fontFamily: "'Dancing Script', cursive" }}
            >
              Principal
            </span>
          </div>
          <div className="w-24 h-[1.5px] mt-0.5" style={{ backgroundColor: primaryColor }} />
          <span className="text-[9.5px] font-black uppercase tracking-wider mt-0.5" style={{ color: primaryColor }}>
            {principalSignLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
