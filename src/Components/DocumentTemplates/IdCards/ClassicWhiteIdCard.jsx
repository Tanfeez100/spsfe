import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import { highQualityQrBase64 as highQualityQr } from '../../../assets/highQualityQrBase64'

export default function ClassicWhiteIdCard({
  student = {},
  customization = {},
  scale = 1,
  id,
}) {
  const studentName = student.Name || student.name || 'Student Name'
  const fatherName = student.father_name || student.FatherName || student.fatherName || 'Father Name'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '00').toString()
  const rawClass = (student.Class || student.class || '').toString()
  const studentSection = (student.Section || student.section || 'A').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || `SPS-2024-${rollNo.padStart(3, '0')}`
  const dob = student.date_of_birth || student.dob || '01/01/2012'
  const studentAddress = student.address || 'Bettiah, West Champaran, Bihar'
  const mobile = student.mobile || student.Mobile || student.phone || student.contact_no || ''
  const validTill = customization.validTill || '31/03/2027'
  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const tagline = customization.tagline || 'Excellence in Education Since 2018'
  const primaryColor = customization.primaryColor || '#1e3a8a'
  const secondaryColor = customization.secondaryColor || '#94a3b8'
  const principalSignLabel = customization.principalSignLabel || 'Headmaster'

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
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => { if (isCurrent) setQrDataUrl(highQualityQr) })
    return () => { isCurrent = false }
  }, [studentName, rollNo, rawClass, mobile])

  return (
    <div
      id={id || `classic-white-card-${rollNo}`}
      className="relative w-[350px] h-[541px] rounded-[14px] bg-white shadow-xl overflow-hidden select-none text-slate-900 border-[2px] p-3 flex flex-col justify-between"
      style={{
        borderColor: primaryColor,
        fontFamily: "'Inter', -apple-system, sans-serif",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      {/* Outer Fine Double Border Frame */}
      <div className="absolute inset-1.5 border border-slate-300 rounded-[10px] pointer-events-none" />

      {/* Top Header */}
      <div className="text-center pt-1 pb-2 border-b border-slate-200">
        <div className="flex items-center justify-center gap-2 mb-1">
          <img src={schoolLogo} alt="Logo" className="w-9 h-9 object-contain" />
          <div className="text-left">
            <h1 className="text-[16px] font-black tracking-tight uppercase leading-none text-slate-900 font-serif">
              {schoolName}
            </h1>
            <p className="text-[8.5px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
              {tagline}
            </p>
          </div>
        </div>
        <div className="inline-block bg-slate-900 text-white text-[8px] font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-sm">
          Official Identity Card
        </div>
      </div>

      {/* Middle Grid: Photo on Left, Key Info on Right */}
      <div className="flex gap-3 items-center px-1 py-2">
        <div className="w-[102px] h-[122px] rounded-md border-2 border-slate-300 p-0.5 bg-slate-50 shrink-0 shadow-xs flex items-center justify-center overflow-hidden">
          {photo ? (
            <img src={photo} alt={studentName} className="w-full h-full object-cover rounded-xs" />
          ) : (
            <div className="flex flex-col items-center text-slate-400">
              <span className="material-symbols-outlined text-3xl">account_circle</span>
              <span className="text-[8px] font-bold">AFFIX PHOTO</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-black text-slate-900 leading-tight truncate">
            {studentName}
          </h2>
          <div className="mt-1 space-y-0.5 text-[11px] text-slate-700">
            <p>
              <strong className="text-slate-900">Class:</strong> {rawClass} (Sec {studentSection})
            </p>
            <p>
              <strong className="text-slate-900">Roll No:</strong> {rollNo}
            </p>
            <p className="truncate">
              <strong className="text-slate-900">Adm No:</strong> {admissionNo}
            </p>
            <p>
              <strong className="text-slate-900">Blood Grp:</strong> {student.blood_group || 'O+'}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Key-Value Rows */}
      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-[11px] space-y-1 text-slate-800">
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Father's Name:</span>
          <span className="font-bold text-slate-900 truncate max-w-[170px]">{fatherName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Contact Number:</span>
          <span className="font-bold text-slate-900 font-mono">{mobile || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Date of Birth:</span>
          <span className="font-bold text-slate-900 font-mono">{dob}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Residential Area:</span>
          <span className="font-bold text-slate-900 truncate max-w-[170px]">{studentAddress}</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-1">
          <span className="text-slate-500 font-medium">Valid Till:</span>
          <span className="font-bold text-slate-900 font-mono">{validTill}</span>
        </div>
      </div>

      {/* Bottom Bar: Verification QR and Headmaster Sign */}
      <div className="flex items-end justify-between px-2 pt-2 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-[58px] h-[58px] rounded border border-slate-300 p-0.5 bg-white">
            <img src={qrDataUrl || highQualityQr} alt="QR" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
          </div>
          <div className="text-[7.5px] text-slate-500 leading-tight">
            <p className="font-bold text-slate-800 uppercase">Tamper Proof</p>
            <p>Scan to verify authenticity</p>
          </div>
        </div>

        <div className="text-center pb-0.5">
          <div className="h-6 w-20 flex items-center justify-center font-serif italic text-base text-slate-900">
            Sign
          </div>
          <div className="w-20 h-px bg-slate-400 mb-0.5" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
            {principalSignLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
