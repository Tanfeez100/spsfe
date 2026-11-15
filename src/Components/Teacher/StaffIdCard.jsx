import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../assets/logo.png'
import stampCert from '../../assets/stampcert.png'
import { highQualityQrBase64 as highQualityQr } from '../../assets/highQualityQrBase64'

export default function StaffIdCard({
  teacher = {},
  isBack = false,
  scale = 1,
  id,
  validTill = '31/03/2027',
  issueDate,
}) {
  const isTeaching = teacher?.staffType !== 'non_teaching'
  const fullName = teacher?.fullName || teacher?.name || 'Staff Member'
  const employeeId = teacher?.employeeId || teacher?.employee_id || 'TCH-101'
  const designation = teacher?.designation || (isTeaching ? 'Faculty Member' : 'Support Staff')
  const department = teacher?.department || (isTeaching ? 'Academics' : 'Administration & Operations')
  const subject = teacher?.subject || teacher?.roleTitle || (isTeaching ? 'General Academics' : 'Services')
  const fatherName = teacher?.fatherName || teacher?.father_name || '—'
  const mobile = teacher?.mobile || teacher?.phone || '—'
  const dob = teacher?.dateOfBirth || teacher?.date_of_birth || teacher?.dob || '—'
  const address = teacher?.address || 'Bettiah, West Champaran, Bihar'
  const photo = teacher?.photoUrl || teacher?.photo_url || teacher?.photo || null
  const aadharNumber = teacher?.aadharNumber || teacher?.aadhar_number || ''

  // Format or resolve Issue Date (Staff ID card uses Issue Date instead of session)
  const effectiveIssueDate = (() => {
    if (issueDate) return issueDate
    const candidate = teacher?.joiningDate || teacher?.joining_date || teacher?.issueDate || teacher?.issue_date
    if (candidate && candidate !== '-' && candidate.trim() !== '') {
      try {
        if (candidate.includes('-')) {
          const parts = candidate.split('T')[0].split('-')
          if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`
          }
        }
      } catch (_) {}
      return candidate
    }
    const now = new Date()
    const d = String(now.getDate()).padStart(2, '0')
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const y = now.getFullYear()
    return `${d}/${m}/${y}`
  })()

  const primaryColor = '#071d3f'
  const secondaryColor = '#d4af37'
  const schoolName = 'STAR PUBLIC SCHOOL'
  const tagline = 'Affiliated to State Board | Bettiah, West Champaran'

  // Dynamic QR Code payload for scanner authentication
  const qrLines = [
    schoolName,
    `STAFF VERIFICATION: VERIFIED`,
    `Name: ${fullName}`,
    `Emp ID: ${employeeId}`,
    `Designation: ${designation}`,
    `Department: ${department}`,
    `Contact: ${mobile}`,
    `Issue Date: ${effectiveIssueDate}`,
    `School: Star Public School, Meghwal Mathia`,
  ].filter(Boolean)

  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    let isCurrent = true
    QRCode.toDataURL(qrLines.join('\n'), {
      margin: 1,
      width: 260,
      errorCorrectionLevel: 'M',
      color: { dark: '#071d3f', light: '#ffffff' },
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
  }, [fullName, employeeId, designation, mobile, effectiveIssueDate])

  // Get Initials for Avatar Fallback
  const getInitials = (name) => {
    if (!name) return 'ST'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  /* ====================================================
     CASE A: BACK SIDE OF STAFF IDENTITY CARD
     ==================================================== */
  if (isBack) {
    return (
      <div
        id={id || `staff-card-back-${employeeId}`}
        className="relative w-[350px] h-[541px] rounded-[18px] bg-white shadow-xl overflow-hidden select-none text-slate-900 border-[2.5px] flex flex-col justify-between"
        style={{
          borderColor: primaryColor,
          fontFamily: "'Lexend', 'Manrope', -apple-system, sans-serif",
          aspectRatio: '55 / 85',
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
        }}
      >
        {/* Header */}
        <div
          className="relative pt-3 pb-3 px-3.5 text-white text-center shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center justify-center gap-2">
            <img src={schoolLogo} alt="Logo" className="w-8 h-8 object-contain rounded-full bg-white/10 p-0.5 border border-white/20" />
            <h3 className="font-extrabold text-[15px] uppercase tracking-wide font-serif">
              {schoolName}
            </h3>
          </div>
          <div
            className="mt-1.5 py-0.5 px-2 rounded-full inline-block text-[9px] font-black uppercase tracking-widest text-[#071d3f]"
            style={{ backgroundColor: secondaryColor }}
          >
            TERMS & INSTITUTIONAL GUIDELINES
          </div>
        </div>

        {/* Guidelines & Terms Body */}
        <div className="px-5 py-3 text-[10.5px] text-slate-700 space-y-2 flex-1 flex flex-col justify-center">
          <div className="space-y-1.5">
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[#071d3f]">1.</span>
              <p className="leading-tight">
                This identity card is strictly the institutional property of <strong>Star Public School</strong>.
              </p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[#071d3f]">2.</span>
              <p className="leading-tight">
                The bearer must wear or carry this badge visibly on campus and during official institutional duties.
              </p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[#071d3f]">3.</span>
              <p className="leading-tight">
                Non-transferable and valid exclusively for the personnel named on the front.
              </p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[#071d3f]">4.</span>
              <p className="leading-tight">
                Immediate notification to the Administrative Office is required in case of loss or mutilation.
              </p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[#071d3f]">5.</span>
              <p className="leading-tight">
                Must be surrendered upon cessation of employment or service at Star Public School.
              </p>
            </div>
          </div>

          {/* Contact Details Box */}
          <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] space-y-1 text-slate-700">
            <p className="font-extrabold text-[#071d3f] uppercase tracking-wider text-[10px] border-b border-slate-200 pb-0.5">
              Institutional Address & Helpdesk
            </p>
            <p className="leading-tight font-medium">
              📍 Meghwal Mathia, Bettiah, West Champaran, Bihar - 845438
            </p>
            <p className="leading-tight">
              📞 <strong>Office:</strong> +91 98765 43210 &nbsp;|&nbsp; 📧 info@starpublicschool.com
            </p>
            <p className="leading-tight text-blue-700 font-semibold">
              🌐 www.starpublicschool.com
            </p>
          </div>
        </div>

        {/* Bottom Signatory & Stamp */}
        <div className="px-5 pb-3 pt-1 shrink-0">
          <div className="flex items-center justify-between border-t border-slate-200 pt-2">
            <div className="text-left">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Issuer / Authority</p>
              <p className="text-[10px] font-extrabold text-[#071d3f]">Star Public School</p>
            </div>
            <div className="flex flex-col items-center">
              <img src={stampCert} alt="Stamp" className="h-8 w-auto object-contain opacity-80" />
              <p className="text-[9px] font-bold text-slate-800 uppercase tracking-tight mt-0.5">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Navy Wave Ribbon */}
        <div
          className="h-2 w-full shrink-0"
          style={{ backgroundColor: primaryColor }}
        />
      </div>
    )
  }

  /* ====================================================
     CASE B: FRONT SIDE OF STAFF IDENTITY CARD
     ==================================================== */
  return (
    <div
      id={id || `staff-card-front-${employeeId}`}
      className="relative w-[350px] h-[541px] rounded-[18px] bg-white shadow-xl overflow-hidden select-none text-slate-900 border-[2.5px] flex flex-col justify-between"
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
            <h1 className="font-extrabold text-[16.5px] tracking-tight leading-tight uppercase font-serif drop-shadow-sm truncate">
              {schoolName}
            </h1>
            <p className="text-[8.5px] font-medium text-blue-100 tracking-wide mt-0.5 truncate">
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
            {isTeaching ? 'FACULTY IDENTITY CARD' : 'STAFF IDENTITY CARD'}
          </span>
        </div>
      </div>

      {/* 2. Photo & Title Section */}
      <div className="flex flex-col items-center pt-4 pb-0.5 z-10 relative shrink-0">
        <div
          className="relative w-[96px] h-[114px] rounded-[11px] bg-slate-100 p-1 shadow-md border-[2px]"
          style={{ borderColor: primaryColor }}
        >
          {photo ? (
            <img src={photo} alt={fullName} className="w-full h-full object-cover rounded-[8px]" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center rounded-[8px] bg-gradient-to-br from-slate-100 to-blue-50 text-indigo-700">
              <span className="text-2xl font-black">{getInitials(fullName)}</span>
              <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Staff</span>
            </div>
          )}
        </div>
        <h2 className="font-black text-[15px] text-center mt-1 text-slate-900 tracking-tight leading-snug px-3 truncate max-w-[320px]">
          {fullName}
        </h2>
        <span
          className="inline-block px-3 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider text-white mt-0.5 shadow-2xs truncate max-w-[280px]"
          style={{ backgroundColor: primaryColor }}
        >
          {designation}
        </span>
      </div>

      {/* 3. Details Body (Key-Value aligned) */}
      <div className="px-5 py-1 text-[11px] space-y-1 text-slate-800 z-10 relative flex-1 flex flex-col justify-center">
        <div className="flex items-baseline">
          <span className="w-[100px] shrink-0 font-bold" style={{ color: primaryColor }}>Employee ID</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-black text-indigo-900 font-mono text-[12px]">{employeeId}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[100px] shrink-0 font-bold" style={{ color: primaryColor }}>Department</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-semibold text-slate-900 truncate">{department}</span>
        </div>
        {isTeaching ? (
          <div className="flex items-baseline">
            <span className="w-[100px] shrink-0 font-bold" style={{ color: primaryColor }}>Subject</span>
            <span className="font-bold mr-2">:</span>
            <span className="font-semibold text-slate-900 truncate">{subject}</span>
          </div>
        ) : (
          <div className="flex items-baseline">
            <span className="w-[100px] shrink-0 font-bold" style={{ color: primaryColor }}>Role</span>
            <span className="font-bold mr-2">:</span>
            <span className="font-semibold text-slate-900 truncate">{designation}</span>
          </div>
        )}
        <div className="flex items-baseline">
          <span className="w-[100px] shrink-0 font-bold" style={{ color: primaryColor }}>Contact No</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-bold text-slate-900 font-mono">{mobile}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-[100px] shrink-0 font-bold" style={{ color: primaryColor }}>Date of Birth</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-bold text-slate-900 font-mono">{dob}</span>
        </div>
        {aadharNumber && (
          <div className="flex items-baseline">
            <span className="w-[100px] shrink-0 font-bold" style={{ color: primaryColor }}>Aadhaar No</span>
            <span className="font-bold mr-2">:</span>
            <span className="font-bold text-slate-900 font-mono">
              {aadharNumber.length >= 12
                ? `XXXX-XXXX-${aadharNumber.slice(-4)}`
                : aadharNumber}
            </span>
          </div>
        )}
        <div className="flex items-baseline">
          <span className="w-[100px] shrink-0 font-bold" style={{ color: primaryColor }}>Issue Date</span>
          <span className="font-bold mr-2">:</span>
          <span className="font-bold text-emerald-700 font-mono">{effectiveIssueDate}</span>
        </div>
      </div>

      {/* 4. Footer Row: QR code + Signatory */}
      <div className="px-5 pb-3 pt-1 z-10 relative shrink-0">
        <div className="flex items-center justify-between border-t border-slate-200/80 pt-1.5">
          {/* QR Code */}
          <div className="flex items-center gap-1.5">
            <div className="w-[52px] h-[52px] rounded-lg bg-white p-0.5 border border-slate-300 shadow-2xs flex items-center justify-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">
                  QR
                </div>
              )}
            </div>
            <div className="text-[9px] text-slate-500 leading-tight">
              <p className="font-extrabold text-[#071d3f]">SCAN TO</p>
              <p className="font-extrabold text-[#071d3f]">VERIFY</p>
              <p className="text-[8px] text-emerald-600 font-bold mt-0.5">● Official</p>
            </div>
          </div>

          {/* Principal Signature */}
          <div className="flex flex-col items-center">
            <div className="h-7 flex items-center justify-center">
              <span className="font-serif italic text-sm text-[#071d3f] font-bold tracking-wider">
                Principal
              </span>
            </div>
            <div className="w-24 border-t border-slate-400 my-0.5" />
            <p className="text-[9px] font-bold text-slate-700 uppercase tracking-tight">
              Authorized Signatory
            </p>
          </div>
        </div>
      </div>

      {/* 5. Bottom Navy Wave Ribbon */}
      <div
        className="h-2.5 w-full shrink-0 flex items-center justify-center"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="w-24 h-0.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
      </div>
    </div>
  )
}

