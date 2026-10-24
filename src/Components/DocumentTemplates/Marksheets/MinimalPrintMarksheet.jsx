import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import stampcert from '../../../assets/stampcert.png'
import { SAMPLE_MARKS_DATA } from '../../../constants/documentTemplateRegistry'

export default function MinimalPrintMarksheet({
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

  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const session = customization.session || data.session || '2026-2027'
  const examName = customization.examName || data.examName || 'ANNUAL SECONDARY SCHOOL EXAMINATION'
  const affiliationNo = customization.affiliationNo || 'Affiliation No: 2130894 · School Code: 845438'

  const coScholastic = [
    { area: 'Work Education / Pre-Vocational', descriptor: 'Electrical Circuits, Computer Applications & Craft', grade: 'A' },
    { area: 'Art Education', descriptor: 'Music, Drawing, Painting & Cultural Expression', grade: 'A' },
    { area: 'Health & Physical Education', descriptor: 'Sports, Team Athletics, Yoga & Health Habits', grade: 'A' },
    { area: 'General Discipline & Moral Conduct', descriptor: 'Punctuality, Obedience, Courtesy & Social Responsibility', grade: 'A' },
  ]

  const gradingGuide = [
    { grade: 'A1', range: '91–100', desc: 'Outstanding' },
    { grade: 'A2', range: '81–90', desc: 'Excellent' },
    { grade: 'B1', range: '71–80', desc: 'Very Good' },
    { grade: 'B2', range: '61–70', desc: 'Good' },
    { grade: 'C1', range: '51–60', desc: 'Average' },
    { grade: 'C2', range: '41–50', desc: 'Fair' },
    { grade: 'D', range: '33–40', desc: 'Pass' },
    { grade: 'E', range: 'Below 33', desc: 'Essential Repeat' },
  ]

  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    let isCurrent = true
    const qrPayload = [
      schoolName,
      `Statement of Marks: ${examName}`,
      `Candidate: ${studentName}`,
      `Father: ${fatherName}`,
      `Roll No: ${rollNo} · Class: ${rawClass} (${studentSection})`,
      `Score: ${data.totalObtained} / ${data.totalMaxMarks} (${data.percentage}%)`,
      `Result: ${data.resultStatus} · ${data.division}`,
      `Ref: SPS-ECO-${session}-${rollNo}`,
    ].join('\n')

    QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 200,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => {})

    return () => { isCurrent = false }
  }, [studentName, rollNo, rawClass, data.totalObtained])

  return (
    <div
      id={id || `minimal-print-marksheet-${rollNo}`}
      className="sps-document-sheet w-full max-w-[850px] min-h-[1140px] bg-white border-2 border-slate-900 p-8 text-slate-900 shadow-2xl mx-auto flex flex-col justify-between"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="space-y-4">
        {/* ================= 1. MONOCHROME CRISP PRINT HEADER ================= */}
        <div className="border-b-2 border-slate-900 pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 border-2 border-slate-900 p-1 flex items-center justify-center shrink-0">
                <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain grayscale" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 block">
                  {affiliationNo} · Senior Secondary Section
                </span>
                <h1 className="text-2xl sm:text-[26px] font-black uppercase tracking-tight text-slate-950 leading-none mt-0.5">
                  {schoolName}
                </h1>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Meghwal Mathia, Bettiah, West Champaran, Bihar - 845438
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="border-2 border-slate-900 bg-slate-900 text-white font-black text-xs uppercase px-3.5 py-1 tracking-wider inline-block">
                GRADE SHEET
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1 font-mono">SESSION {session}</p>
              <span className="text-[10.5px] font-mono text-slate-600 block">Roll Code: 845438</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-300 flex items-center justify-between text-xs font-bold uppercase tracking-wide">
            <span>{examName}</span>
            <span className="font-mono text-slate-600">Official Statement of Marks & Evaluation</span>
          </div>
        </div>

        {/* ================= 2. CANDIDATE BIO MATRIX (STRUCTURED GRID) ================= */}
        <div className="border border-slate-900 p-3 bg-slate-50/70 text-xs font-sans">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 block text-[9.5px] font-bold uppercase">Candidate Name</span>
              <span className="font-black text-slate-950 text-sm uppercase block mt-0.5">{studentName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9.5px] font-bold uppercase">Class & Section</span>
              <span className="font-bold text-slate-900 text-sm block mt-0.5">Class {rawClass} ({studentSection})</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9.5px] font-bold uppercase">Roll Number</span>
              <span className="font-mono font-black text-slate-950 text-sm block mt-0.5">#{rollNo}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9.5px] font-bold uppercase">Admission / Reg No</span>
              <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">{admissionNo}</span>
            </div>

            <div className="col-span-2 border-t border-slate-300 pt-1.5">
              <span className="text-slate-500 block text-[9.5px] font-bold uppercase">Parentage</span>
              <span className="font-bold text-slate-900 uppercase">Father: {fatherName} · Mother: {motherName}</span>
            </div>
            <div className="border-t border-slate-300 pt-1.5">
              <span className="text-slate-500 block text-[9.5px] font-bold uppercase">Date of Birth</span>
              <span className="font-mono font-bold text-slate-900">{dob}</span>
            </div>
            <div className="border-t border-slate-300 pt-1.5">
              <span className="text-slate-500 block text-[9.5px] font-bold uppercase">Attendance</span>
              <span className="font-bold text-slate-900">{data.attendance} (212 / 225 Days)</span>
            </div>
          </div>
        </div>

        {/* ================= 3. PART 1: SCHOLASTIC EXAMINATION TABLE ================= */}
        <div>
          <div className="flex items-center justify-between pb-1 px-1">
            <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-950">
              Part I: Scholastic Performance Evaluation
            </span>
            <span className="text-[10px] font-mono text-slate-600">Standard Pass Criteria: 33%</span>
          </div>

          <div className="border border-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-900 text-[10px] uppercase font-bold border-b border-slate-900">
                <tr>
                  <th className="py-2 px-3 border-r border-slate-900 w-16 text-center">Code</th>
                  <th className="py-2 px-3 border-r border-slate-900">Subject Description</th>
                  <th className="py-2 px-2 text-center border-r border-slate-900 w-16">Max</th>
                  <th className="py-2 px-2 text-center border-r border-slate-900 w-14">Pass</th>
                  <th className="py-2 px-2 text-center border-r border-slate-900 w-16">Theory (80)</th>
                  <th className="py-2 px-2 text-center border-r border-slate-900 w-16">Practical (20)</th>
                  <th className="py-2 px-3 text-center border-r border-slate-900 w-20">Total Marks</th>
                  <th className="py-2 px-2 text-center border-r border-slate-900 w-14">Grade</th>
                  <th className="py-2 px-3 text-center w-20">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {data.subjects.map((s, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-600 border-r border-slate-300 text-center text-[11px]">{s.code || `10${idx + 1}`}</td>
                    <td className="py-2 px-3 font-bold text-slate-950 border-r border-slate-300">{s.subject}</td>
                    <td className="py-2 px-2 text-center font-mono text-slate-600 border-r border-slate-300">{s.maxMarks}</td>
                    <td className="py-2 px-2 text-center font-mono text-slate-600 border-r border-slate-300">{s.passMarks}</td>
                    <td className="py-2 px-2 text-center font-mono font-semibold border-r border-slate-300">{s.theory}</td>
                    <td className="py-2 px-2 text-center font-mono font-semibold border-r border-slate-300">{s.practical}</td>
                    <td className="py-2 px-3 text-center font-mono font-black text-slate-950 border-r border-slate-300 text-[13px] bg-slate-100/60">
                      {s.total}
                    </td>
                    <td className="py-2 px-2 text-center font-black border-r border-slate-300 font-mono">{s.grade}</td>
                    <td className="py-2 px-3 text-center font-bold text-slate-900">{s.result}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold text-xs">
                  <td colSpan={2} className="py-2.5 px-3 uppercase font-black text-slate-950">
                    Grand Total Aggregate
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono">{data.totalMaxMarks}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-600">200</td>
                  <td colSpan={2} className="text-right px-3 text-slate-700">Total Marks Scored:</td>
                  <td className="py-2.5 px-3 text-center font-mono font-black text-sm bg-slate-200">
                    {data.totalObtained}
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 text-center font-black text-slate-950">
                    {data.percentage}% · {data.division}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ================= 4. PART 2: CO-SCHOLASTIC ACTIVITIES ================= */}
        <div>
          <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-950 block pb-1 px-1">
            Part II: Co-Scholastic Traits & Developmental Skills (Scale A–C)
          </span>

          <div className="border border-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-900 text-[10px] uppercase font-bold border-b border-slate-900">
                <tr>
                  <th className="py-1.5 px-3 border-r border-slate-900 w-1/4">Assessment Domain</th>
                  <th className="py-1.5 px-3 border-r border-slate-900">Skill Competency Descriptor</th>
                  <th className="py-1.5 px-2 text-center w-24">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {coScholastic.map((cs, i) => (
                  <tr key={i}>
                    <td className="py-1.5 px-3 font-bold border-r border-slate-200 text-slate-900">{cs.area}</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-slate-700">{cs.descriptor}</td>
                    <td className="py-1.5 px-2 text-center font-black font-mono text-slate-950">{cs.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= 5. PART 3: GRADING SCALE GUIDE & RESULT SUMMARY ================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
          <div className="md:col-span-8 p-2 border border-slate-900 bg-slate-50 text-[10px]">
            <span className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
              Grading Scale Reference Key
            </span>
            <div className="grid grid-cols-4 gap-1 text-center font-mono">
              {gradingGuide.map((g, i) => (
                <div key={i} className="border border-slate-300 bg-white p-1">
                  <span className="font-bold text-slate-950 block">{g.grade} ({g.range}%)</span>
                  <span className="text-[9px] text-slate-500 block">{g.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-4 p-2.5 border border-slate-900 bg-white text-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Final Examination Status</span>
              <p className="font-black text-slate-950 uppercase mt-0.5 text-sm">{data.resultStatus} · {data.division}</p>
              <p className="text-[11px] font-bold text-slate-700 mt-0.5">Rank #{data.rank} in Class</p>
            </div>
            <div className="pt-1.5 border-t border-slate-300 text-[10.5px]">
              <span className="text-slate-600">Promoted to Class {Number(rawClass) ? Number(rawClass) + 1 : 'XI'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 6. FORMAL SIGNATURE BLOCKS ================= */}
      <div className="pt-4 border-t-2 border-slate-900 mt-3 font-sans">
        <div className="grid grid-cols-4 gap-4 items-end text-center text-xs">
          {/* Pure B&W QR Code */}
          <div className="flex items-center gap-2 text-left">
            <div className="w-14 h-14 border border-slate-900 p-0.5 bg-white shrink-0 flex items-center justify-center">
              <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
            </div>
            <div className="text-[9px] text-slate-600 leading-tight">
              <span className="font-bold text-slate-950 block">OFFICIAL QR</span>
              <span>Date: 28-03-2027</span>
              <span className="block font-mono text-slate-500">Ref: 2026/MRK</span>
            </div>
          </div>

          {/* Teacher */}
          <div>
            <div className="h-8 flex items-end justify-center pb-0.5">
              <span className="font-serif italic font-bold text-slate-800">S. Roy</span>
            </div>
            <div className="border-t border-slate-900 pt-0.5">
              <span className="font-bold text-slate-900 uppercase block text-[11px]">Class Teacher</span>
            </div>
          </div>

          {/* Controller */}
          <div className="flex flex-col items-center">
            <div className="h-10 flex items-center justify-center">
              <img src={stampcert} alt="Official Seal" className="h-14 object-contain opacity-75 grayscale select-none" />
            </div>
            <div className="border-t border-slate-900 pt-0.5 w-full">
              <span className="font-bold text-slate-900 uppercase block text-[11px]">Exam In-Charge</span>
            </div>
          </div>

          {/* Principal */}
          <div>
            <div className="h-8 flex items-end justify-center pb-0.5">
              <span className="font-serif italic font-bold text-lg text-slate-950 leading-none">
                Principal
              </span>
            </div>
            <div className="border-t border-slate-900 pt-0.5">
              <span className="font-bold text-slate-900 uppercase block text-[11px]">Principal / Head</span>
            </div>
          </div>
        </div>

        <p className="text-center text-[9px] text-slate-500 font-mono mt-2.5 pt-1 border-t border-slate-200">
          Official Institutional Statement of Marks · Star Public School Bettiah · Issued for Academic Records
        </p>
      </div>
    </div>
  )
}
