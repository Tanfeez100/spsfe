import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import { highQualityQrBase64 as highQualityQr } from '../../../assets/highQualityQrBase64'

export default function SmartIdentityIdCard({
  student = {},
  customization = {},
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
  const bloodGroup = student.blood_group || '—'
  const validTill = customization.validTill || '31/03/2027'
  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const principalSignLabel = customization.principalSignLabel || 'Authorized Officer'

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
    `Blood: ${bloodGroup}`,
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
      id={id || `smart-identity-card-${rollNo}`}
      className="relative w-[350px] h-[541px] rounded-[18px] bg-slate-900 shadow-2xl overflow-hidden select-none text-white border-2 border-cyan-500/40 flex flex-col justify-between"
      style={{
        fontFamily: "'Inter', sans-serif",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

      {/* Top Header */}
      <div className="p-3.5 pb-2 border-b border-cyan-500/30 bg-slate-950/80 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-[15px] font-black tracking-tight uppercase leading-tight text-white">
                {schoolName}
              </h1>
              <p className="text-[7.5px] font-mono text-cyan-400 uppercase tracking-widest">
                SMART STUDENT ID · NFC / QR
              </p>
            </div>
          </div>
          {/* Smart Chip Graphic */}
          <div className="w-9 h-7 rounded bg-amber-400 border border-amber-300 p-0.5 flex flex-col justify-between shadow-inner">
            <div className="h-1.5 border-b border-amber-600/40" />
            <div className="h-1.5 border-b border-amber-600/40" />
          </div>
        </div>
      </div>

      {/* Middle: Photo & Smart Security Badge */}
      <div className="flex items-center gap-3 px-4 z-10 pt-2">
        <div className="relative w-[100px] h-[118px] rounded-lg border-2 border-cyan-400/80 p-0.5 bg-slate-950 shadow-lg shrink-0 overflow-hidden">
          {photo ? (
            <img src={photo} alt={studentName} className="w-full h-full object-cover rounded" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
              <span className="material-symbols-outlined text-4xl">person</span>
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-cyan-600/90 text-[7px] font-black uppercase text-center py-0.5 tracking-wider">
            VERIFIED ID
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-[16px] font-black text-white leading-tight truncate">
            {studentName}
          </h2>
          <div className="mt-1 space-y-1 text-[11px]">
            <div className="inline-flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded text-cyan-300 font-bold">
              <span>CLASS {rawClass} ({studentSection})</span>
              <span>·</span>
              <span className="font-mono">ROLL #{rollNo}</span>
            </div>
            <p className="text-slate-300 text-[10.5px] font-mono truncate">
              UID: {admissionNo}
            </p>
            <p className="text-rose-400 text-[10px] font-bold">
              Blood Group: <span className="bg-rose-950/80 border border-rose-500/40 px-1.5 py-0.2 rounded font-mono text-white">{bloodGroup}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Structured Details Box */}
      <div className="mx-4 bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-[10.5px] space-y-1 z-10 text-slate-300">
        <div className="flex justify-between">
          <span className="text-slate-500">Father's Name:</span>
          <span className="font-semibold text-white truncate max-w-[180px]">{fatherName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Emergency Phone:</span>
          <span className="font-bold text-cyan-400 font-mono">{mobile || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Date of Birth:</span>
          <span className="font-mono text-white">{dob}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Address:</span>
          <span className="text-white truncate max-w-[180px]">{studentAddress}</span>
        </div>
      </div>

      {/* Bottom Bar: High Contrast QR & Sign */}
      <div className="bg-slate-950 border-t border-cyan-500/30 p-2.5 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-[56px] h-[56px] rounded bg-white p-0.5 border border-cyan-400 shadow-md">
            <img src={qrDataUrl || highQualityQr} alt="QR" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
          </div>
          <div className="text-[7.5px] text-cyan-300/80 font-mono leading-tight">
            <p className="text-white font-bold">SMART VERIFY</p>
            <p>Scan for secure data</p>
            <p className="text-amber-400 font-bold mt-0.5">Exp: {validTill}</p>
          </div>
        </div>

        <div className="text-center">
          <div className="font-serif italic text-base text-cyan-300 font-bold">Principal</div>
          <div className="w-20 h-px bg-cyan-500/60" />
          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-0.5 block">
            {principalSignLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
