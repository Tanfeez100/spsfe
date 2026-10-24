import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import stampcert from '../../../assets/stampcert.png'
import { SAMPLE_MARKS_DATA } from '../../../constants/documentTemplateRegistry'

export default function PremiumBlueWhiteMarksheet({
  student = {},
  marksData = {},
  customization = {},
  id,
}) {
  const data = { ...SAMPLE_MARKS_DATA, ...marksData }
  const studentName = student.Name || student.name || 'Aarav Kumar Sharma'
  const fatherName = student.father_name || student.FatherName || student.fatherName || 'Rajesh Sharma'
  const motherName = student.mother_name || student.MotherName || student.motherName || 'Sunita Sharma'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '12').toString()
  const rawClass = (student.Class || student.class || '10').toString()
  const studentSection = (student.Section || student.section || 'A').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || 'SPS-2024-0012'
  const dob = student.date_of_birth || student.dob || '15/08/2011'
  const bloodGroup = student.blood_group || 'B+'

  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const session = customization.session || data.session || '2026-2027'
  const examName = customization.examName || data.examName || 'Annual Academic Performance & Evaluation Record'
  const affiliationNo = customization.affiliationNo || 'Affiliation No: 2130894 · School Code: 845438'

  const coScholastic = [
    { skill: 'Work Education & Computer Literacy', grade: 'A1', desc: 'Outstanding in practical computing and software skills' },
    { skill: 'Visual & Performing Arts', grade: 'A', desc: 'Active participation in design, drama and fine arts' },
    { skill: 'Physical Fitness & Sports', grade: 'A1', desc: 'Excellent physical endurance, teamwork, and athletic discipline' },
    { skill: 'Social & Emotional Traits', grade: 'A1', desc: 'Exemplary empathy, mutual respect, and ethical values' },
  ]

  const gradingSystem = [
    { grade: 'A1', range: '91-100', point: '10.0' },
    { grade: 'A2', range: '81-90', point: '9.0' },
    { grade: 'B1', range: '71-80', point: '8.0' },
    { grade: 'B2', range: '61-70', point: '7.0' },
    { grade: 'C1', range: '51-60', point: '6.0' },
    { grade: 'C2', range: '41-50', point: '5.0' },
    { grade: 'D', range: '33-40', point: '4.0' },
    { grade: 'E', range: '<33', point: '0.0' },
  ]

  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    let isCurrent = true
    const qrPayload = [
      schoolName,
      `Grade Report: ${examName}`,
      `Student: ${studentName}`,
      `Class: ${rawClass} (${studentSection}) · Roll: ${rollNo}`,
      `Adm No: ${admissionNo}`,
      `Grand Total: ${data.totalObtained} / ${data.totalMaxMarks} (${data.percentage}%)`,
      `Status: ${data.resultStatus} · ${data.division}`,
      `Session: ${session}`,
    ].join('\n')

    QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 220,
      errorCorrectionLevel: 'M',
      color: { dark: '#1e3a8a', light: '#ffffff' },
    })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => {})

    return () => { isCurrent = false }
  }, [studentName, rollNo, rawClass, data.totalObtained])

  return (
    <div
      id={id || `premium-blue-white-marksheet-${rollNo}`}
      className="sps-document-sheet w-full max-w-[850px] min-h-[1140px] bg-white border border-blue-900/30 p-8 text-slate-900 shadow-2xl rounded-2xl mx-auto flex flex-col justify-between relative overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background Crest Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
        <img src={schoolLogo} alt="" className="w-[520px] h-[520px] object-contain" />
      </div>

      <div className="relative z-10 space-y-4">
        {/* ================= 1. ROYAL BLUE EXECUTIVE HEADER ================= */}
        <div className="border-b-4 border-blue-950 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 p-2 shadow-md flex items-center justify-center shrink-0 border border-amber-400">
                <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    Senior Secondary
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">{affiliationNo}</span>
                </div>
                <h1 className="text-2xl sm:text-[27px] font-black uppercase tracking-tight text-blue-950 mt-1 leading-none">
                  {schoolName}
                </h1>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Meghwal Mathia, Bettiah, West Champaran, Bihar - 845438 · Affiliated to State & CBSE Boards
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 flex flex-col items-end">
              <span className="bg-blue-950 text-white font-black text-xs uppercase px-4 py-1.5 rounded-lg shadow-sm tracking-wider">
                EXECUTIVE REPORT CARD
              </span>
              <p className="text-xs text-blue-900 font-black mt-1">SESSION {session}</p>
              <span className="text-[10.5px] font-mono text-slate-500">Reg No: {admissionNo}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase text-slate-800 tracking-wide">{examName}</span>
            <span className="text-blue-900 font-bold font-mono">Academic Performance Report & Cumulative Record</span>
          </div>
        </div>

        {/* ================= 2. CANDIDATE BIO 4-CARD MATRIX ================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50">
            <span className="text-slate-400 block text-[9.5px] font-bold uppercase tracking-wider">Student Name</span>
            <span className="font-black text-slate-950 text-sm truncate block mt-0.5">{studentName}</span>
            <span className="text-[10px] text-slate-500 font-mono">Adm: {admissionNo}</span>
          </div>

          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80">
            <span className="text-slate-400 block text-[9.5px] font-bold uppercase tracking-wider">Class & Section</span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5">Class {rawClass} - Sec {studentSection}</span>
            <span className="text-[10px] font-mono font-bold text-blue-900">Roll Number: #{rollNo}</span>
          </div>

          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80">
            <span className="text-slate-400 block text-[9.5px] font-bold uppercase tracking-wider">Parentage</span>
            <span className="font-bold text-slate-900 truncate block mt-0.5">{fatherName}</span>
            <span className="text-[10px] text-slate-500 truncate block">M: {motherName}</span>
          </div>

          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80">
            <span className="text-slate-400 block text-[9.5px] font-bold uppercase tracking-wider">Attendance & DOB</span>
            <span className="font-bold text-emerald-800 text-sm block mt-0.5">{data.attendance}</span>
            <span className="text-[10px] text-slate-500 font-mono">DOB: {dob} · {bloodGroup}</span>
          </div>
        </div>

        {/* ================= 3. PART 1: SCHOLASTIC CURRICULUM TABLE ================= */}
        <div>
          <div className="flex items-center justify-between pb-1 px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-900" />
              <span>Part I: Academic Subject Evaluation</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500 font-medium">Standard Grading System</span>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-blue-950 text-white text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 border-r border-blue-900">Subject Code</th>
                  <th className="py-2.5 px-3 border-r border-blue-900">Curricular Subject</th>
                  <th className="py-2.5 px-2 text-center border-r border-blue-900">Max</th>
                  <th className="py-2.5 px-2 text-center border-r border-blue-900">Min Pass</th>
                  <th className="py-2.5 px-2 text-center border-r border-blue-900">Theory (80)</th>
                  <th className="py-2.5 px-2 text-center border-r border-blue-900">Practical (20)</th>
                  <th className="py-2.5 px-3 text-center border-r border-blue-900">Total Marks</th>
                  <th className="py-2.5 px-2 text-center border-r border-blue-900">Grade</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.subjects.map((s, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-500 border-r border-slate-200 text-[11px]">{s.code || `SUB10${idx + 1}`}</td>
                    <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">{s.subject}</td>
                    <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-200">{s.maxMarks}</td>
                    <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-200">{s.passMarks}</td>
                    <td className="py-2 px-2 text-center font-mono font-semibold text-slate-800 border-r border-slate-200">{s.theory}</td>
                    <td className="py-2 px-2 text-center font-mono font-semibold text-slate-800 border-r border-slate-200">{s.practical}</td>
                    <td className="py-2 px-3 text-center font-mono font-black text-blue-950 border-r border-slate-200 text-[13px] bg-blue-50/40">
                      {s.total}
                    </td>
                    <td className="py-2 px-2 text-center font-black text-blue-900 border-r border-slate-200 text-[11px]">{s.grade}</td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-700">{s.result}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 border-t-2 border-blue-900 font-bold text-xs">
                  <td colSpan={2} className="py-2.5 px-3 uppercase font-black text-blue-950">
                    Grand Total
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono">{data.totalMaxMarks}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-500">200</td>
                  <td colSpan={2} className="text-right px-3 text-slate-700">Total Marks Scored:</td>
                  <td className="py-2.5 px-3 text-center font-mono font-black text-sm text-blue-950 bg-blue-100">
                    {data.totalObtained}
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 text-center text-emerald-800 font-black">
                    {data.percentage}% Aggregate · {data.division}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ================= 4. PART 2: CO-SCHOLASTIC & LIFE SKILLS ================= */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5 pb-1 px-1">
            <span className="w-2 h-2 rounded-full bg-indigo-700" />
            <span>Part II: Co-Scholastic Traits & Developmental Skills</span>
          </h3>

          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-300">
                <tr>
                  <th className="py-1.5 px-3 w-1/3">Key Evaluation Area</th>
                  <th className="py-1.5 px-3">Skill Competency Descriptor</th>
                  <th className="py-1.5 px-2 text-center w-24">Performance Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {coScholastic.map((cs, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-1.5 px-3 font-bold text-slate-800">{cs.skill}</td>
                    <td className="py-1.5 px-3 text-slate-600">{cs.desc}</td>
                    <td className="py-1.5 px-2 text-center font-black text-blue-900 font-mono">{cs.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= 5. PART 3: GRADING SCALE MATRIX & SUMMARY ================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
          <div className="md:col-span-8 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[10px]">
            <span className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Grading Reference Matrix (Scale A1 to E)
            </span>
            <div className="grid grid-cols-8 gap-1 text-center">
              {gradingSystem.map((g, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded p-1">
                  <strong className="text-blue-950 block">{g.grade}</strong>
                  <span className="text-[9px] text-slate-500 block">{g.range}</span>
                  <span className="text-[8.5px] font-mono text-emerald-700 font-bold">{g.point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-4 p-3 rounded-xl border border-blue-200 bg-blue-50/60 text-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-950 uppercase block">Annual Performance Status</span>
              <p className="font-bold text-emerald-800 uppercase mt-0.5 text-sm">{data.resultStatus} · {data.division}</p>
            </div>
            <div className="pt-2 border-t border-blue-200/70 text-[10.5px]">
              <span className="text-slate-600 font-medium">Remarks: <em>{data.remarks}</em></span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 6. EXECUTIVE VERIFICATION & FOOTER ================= */}
      <div className="relative z-10 pt-4 border-t-2 border-blue-950 mt-3">
        <div className="grid grid-cols-4 gap-4 items-end text-center text-xs">
          {/* QR Code */}
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-14 h-14 rounded-lg border border-slate-300 p-0.5 bg-white shrink-0 shadow-xs flex items-center justify-center">
              <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
            </div>
            <div className="text-[9px] text-slate-600 leading-tight">
              <span className="font-black text-blue-950 block uppercase">Digitally Authenticated</span>
              <span>Scan to verify on school portal</span>
              <span className="block font-mono text-[9px] text-slate-400 mt-0.5">Date of Issue: 28/03/2027</span>
            </div>
          </div>

          {/* Teacher */}
          <div>
            <div className="h-9 flex items-end justify-center pb-1">
              <span className="font-serif italic text-base text-slate-700 font-bold select-none">
                M. Sharma
              </span>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span className="font-bold text-slate-900 uppercase block text-[11px]">Class Mentor</span>
              <span className="text-[9px] text-slate-400">Teacher Signature</span>
            </div>
          </div>

          {/* School Stamp */}
          <div className="flex flex-col items-center">
            <div className="h-10 flex items-center justify-center">
              <img src={stampcert} alt="Official Seal" className="h-14 object-contain opacity-85 select-none" />
            </div>
            <div className="border-t border-slate-400 pt-1 w-full">
              <span className="font-bold text-slate-900 uppercase block text-[11px]">Examination Cell</span>
              <span className="text-[9px] text-slate-400">Official Stamp</span>
            </div>
          </div>

          {/* Principal */}
          <div>
            <div className="h-9 flex items-end justify-center pb-1">
              <span
                className="text-[22px] text-blue-950 font-bold leading-none select-none tracking-normal"
                style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
              >
                S. Thompson
              </span>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span className="font-bold text-slate-900 uppercase block text-[11px]">Principal</span>
              <span className="text-[9px] text-slate-400">Star Public School</span>
            </div>
          </div>
        </div>

        <p className="text-center text-[9px] text-slate-400 mt-3 pt-2 border-t border-slate-100 font-mono">
          Star Public School Executive Grade Sheet · System certified valid document for official transfer & progression records
        </p>
      </div>
    </div>
  )
}
