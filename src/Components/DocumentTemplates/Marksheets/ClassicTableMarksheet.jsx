import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import stampcert from '../../../assets/stampcert.png'
import { SAMPLE_MARKS_DATA } from '../../../constants/documentTemplateRegistry'

export default function ClassicTableMarksheet({
  student = {},
  marksData = {},
  customization = {},
  id,
}) {
  const data = { ...SAMPLE_MARKS_DATA, ...marksData }
  const studentName = student.Name || student.name || '—'
  const fatherName = student.father_name || student.FatherName || student.fatherName || '—'
  const motherName = student.mother_name || student.MotherName || student.motherName || '—'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '—').toString()
  const rawClass = (student.Class || student.class || '—').toString()
  const studentSection = (student.Section || student.section || '—').toString()
  const admissionNo = student.admission_number || student.admissionNo || student.id || '—'
  const dob = student.date_of_birth || student.dob || '—'

  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const boardName = customization.boardName || 'CENTRAL BOARD / STATE ACADEMIC COUNCIL AFFILIATION'
  const session = customization.session || data.session || '2026-2027'
  const examName = customization.examName || data.examName || 'ANNUAL SECONDARY SCHOOL EXAMINATION'
  const affiliationNo = customization.affiliationNo || 'Affiliation No: 2130894 · School Code: 845438'

  const coScholastic = [
    { domain: 'Work Education', descriptor: 'Electrical Gadgets, IT Tools & Handcraft', grade: 'A' },
    { domain: 'Art Education', descriptor: 'Music, Drawing & Cultural Activities', grade: 'A' },
    { domain: 'Health & Physical Education', descriptor: 'Outdoor Games, Athletics, Yoga & Hygiene', grade: 'A' },
    { domain: 'Discipline & General Conduct', descriptor: 'Moral Values, Punctuality & Social Attitude', grade: 'A' },
  ]

  const marksInWords = {
    90: 'Ninety',
    85: 'Eighty-Five',
    95: 'Ninety-Five',
    88: 'Eighty-Eight',
    82: 'Eighty-Two',
    92: 'Ninety-Two',
  }

  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    let isCurrent = true
    const qrPayload = [
      schoolName,
      `Official Marksheet: ${examName}`,
      `Candidate: ${studentName}`,
      `Father: ${fatherName}`,
      `Roll No: ${rollNo} · Class: ${rawClass} (${studentSection})`,
      `Marks: ${data.totalObtained} / ${data.totalMaxMarks} (${data.percentage}%)`,
      `Division: ${data.division}`,
      `Cert ID: SPS/MRK/${session}/${rollNo}`,
    ].join('\n')

    QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 220,
      errorCorrectionLevel: 'M',
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => {})

    return () => { isCurrent = false }
  }, [studentName, rollNo, rawClass, data.totalObtained])

  return (
    <div
      id={id || `classic-table-marksheet-${rollNo}`}
      className="sps-document-sheet w-full max-w-[850px] min-h-[1140px] bg-[#fffefd] border-[3px] border-slate-900 p-7 text-slate-900 shadow-2xl mx-auto flex flex-col justify-between relative"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* Ornate Inner Double Hairline Border */}
      <div className="border border-slate-700 p-5 flex flex-col justify-between h-full bg-[#fcfbfa]/60 relative">
        {/* Decorative Corner Ornaments */}
        <div className="absolute top-1 left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-slate-900" />
        <div className="absolute top-1 right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-slate-900" />
        <div className="absolute bottom-1 left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-slate-900" />
        <div className="absolute bottom-1 right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-slate-900" />

        <div className="space-y-3.5">
          {/* ================= 1. TRADITIONAL ACADEMIC HEADER ================= */}
          <div className="text-center pb-3 border-b-2 border-slate-950">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-mono font-bold text-slate-700">Serial No: 2026/0894</span>
              <span className="text-[11px] font-mono font-bold text-slate-700">Center Code: 845438</span>
            </div>

            <div className="flex items-center justify-center gap-4 my-1">
              <img src={schoolLogo} alt="Logo" className="w-18 h-18 object-contain shrink-0" />
              <div>
                <p className="text-xs font-sans font-bold uppercase tracking-widest text-slate-700">
                  {boardName}
                </p>
                <h1 className="text-2xl sm:text-[27px] font-bold uppercase tracking-tight text-slate-950 leading-none">
                  {schoolName}
                </h1>
                <p className="text-xs font-sans text-slate-600 mt-1">
                  MEGHWAL MATHIA, BETTIAH, WEST CHAMPARAN, BIHAR · PIN: 845438
                </p>
                <p className="text-[11px] font-sans text-slate-500 font-medium">
                  {affiliationNo} · Recognised Senior Secondary Institution
                </p>
              </div>
            </div>

            <div className="mt-2.5 bg-slate-100 py-1 border-y border-slate-400">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">
                {examName} · SESSION {session}
              </h2>
              <p className="text-[11px] font-sans font-semibold text-slate-600 uppercase tracking-wide">
                Statement of Marks & Consolidated Academic Record
              </p>
            </div>
          </div>

          {/* ================= 2. CANDIDATE BIO MATRIX ================= */}
          <div className="border border-slate-400 p-2.5 bg-white font-sans text-xs">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <div className="flex items-baseline">
                <span className="text-slate-500 w-32 shrink-0 font-medium">Student's Name:</span>
                <strong className="text-slate-950 uppercase tracking-wide">{studentName}</strong>
              </div>
              <div className="flex items-baseline">
                <span className="text-slate-500 w-32 shrink-0 font-medium">Roll Number:</span>
                <strong className="text-slate-950 font-mono font-bold">#{rollNo}</strong>
              </div>
              <div className="flex items-baseline">
                <span className="text-slate-500 w-32 shrink-0 font-medium">Father's Name:</span>
                <span className="font-bold text-slate-900 uppercase">{fatherName}</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-slate-500 w-32 shrink-0 font-medium">Mother's Name:</span>
                <span className="font-bold text-slate-900 uppercase">{motherName}</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-slate-500 w-32 shrink-0 font-medium">Class & Section:</span>
                <span className="font-bold text-slate-900">Class {rawClass} (Section {studentSection})</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-slate-500 w-32 shrink-0 font-medium">Scholar / Adm No:</span>
                <span className="font-mono font-bold text-slate-900">{admissionNo}</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-slate-500 w-32 shrink-0 font-medium">Date of Birth:</span>
                <span className="font-mono text-slate-900">{dob}</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-slate-500 w-32 shrink-0 font-medium">Attendance:</span>
                <span className="font-semibold text-emerald-800">{data.attendance} (Satisfactory)</span>
              </div>
            </div>
          </div>

          {/* ================= 3. PART 1: SCHOLASTIC PERFORMANCE RECORD ================= */}
          <div>
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 font-sans">
                Part I: Scholastic Performance
              </span>
              <span className="text-[10px] font-mono text-slate-600">Standard Passing Marks: 33%</span>
            </div>

            <table className="w-full text-left text-xs font-sans border-collapse border border-slate-500">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-500 text-[10.5px]">
                  <th className="border-r border-slate-500 p-2 w-16 text-center">Sub Code</th>
                  <th className="border-r border-slate-500 p-2">Subject Description</th>
                  <th className="border-r border-slate-500 p-2 text-center w-16">Max</th>
                  <th className="border-r border-slate-500 p-2 text-center w-14">Pass</th>
                  <th className="border-r border-slate-500 p-2 text-center w-16">Theory</th>
                  <th className="border-r border-slate-500 p-2 text-center w-16">Practical</th>
                  <th className="border-r border-slate-500 p-2 text-center w-16">Total</th>
                  <th className="border-r border-slate-500 p-2 w-28 text-center">Marks in Words</th>
                  <th className="border-r border-slate-500 p-2 text-center w-12">Grade</th>
                  <th className="p-2 text-center w-16">Result</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((s, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border-r border-slate-300 p-1.5 text-center font-mono text-slate-600 font-bold">{s.code || `10${idx + 1}`}</td>
                    <td className="border-r border-slate-300 p-1.5 font-bold text-slate-900">{s.subject}</td>
                    <td className="border-r border-slate-300 p-1.5 text-center font-mono text-slate-600">{s.maxMarks}</td>
                    <td className="border-r border-slate-300 p-1.5 text-center font-mono text-slate-600">{s.passMarks}</td>
                    <td className="border-r border-slate-300 p-1.5 text-center font-mono font-semibold">{s.theory}</td>
                    <td className="border-r border-slate-300 p-1.5 text-center font-mono font-semibold">{s.practical}</td>
                    <td className="border-r border-slate-300 p-1.5 text-center font-mono font-black text-slate-950 text-[13px] bg-slate-100/50">
                      {s.total}
                    </td>
                    <td className="border-r border-slate-300 p-1.5 text-center font-serif text-[11px] text-slate-700 italic">
                      {marksInWords[s.total] || `${s.total} Only`}
                    </td>
                    <td className="border-r border-slate-300 p-1.5 text-center font-black text-blue-900">{s.grade}</td>
                    <td className="p-1.5 text-center font-bold text-emerald-800 text-[11px]">{s.result}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-500 font-bold">
                  <td colSpan={2} className="p-2 uppercase font-black">Grand Total Aggregate</td>
                  <td className="p-2 text-center font-mono">{data.totalMaxMarks}</td>
                  <td className="p-2 text-center font-mono text-slate-600">200</td>
                  <td colSpan={2} className="text-right p-2 text-slate-700">Total Scored:</td>
                  <td className="p-2 text-center font-mono font-black text-sm bg-slate-200">{data.totalObtained}</td>
                  <td colSpan={3} className="p-2 text-center font-serif text-slate-900 italic font-bold">
                    Five Hundred Thirty-Two Out of Six Hundred · {data.percentage}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ================= 4. PART 2: CO-SCHOLASTIC ACTIVITIES ================= */}
          <div>
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 font-sans block pb-1">
              Part II: Co-Scholastic & Personal Traits Assessment
            </span>

            <table className="w-full text-left text-xs font-sans border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400 text-[10px] uppercase font-bold text-slate-700">
                  <th className="p-1.5 border-r border-slate-400 w-1/4">Evaluation Domain</th>
                  <th className="p-1.5 border-r border-slate-400">Activity & Behavioral Trait</th>
                  <th className="p-1.5 text-center w-24">Grade Awarded</th>
                </tr>
              </thead>
              <tbody>
                {coScholastic.map((cs, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td className="p-1.5 border-r border-slate-200 font-bold text-slate-800">{cs.domain}</td>
                    <td className="p-1.5 border-r border-slate-200 text-slate-600">{cs.descriptor}</td>
                    <td className="p-1.5 text-center font-black text-slate-900 font-mono">{cs.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ================= 5. RESULT SUMMARY & ENDORSEMENT ================= */}
          <div className="border border-slate-400 p-2.5 bg-slate-50/80 font-sans text-xs flex justify-between items-center">
            <div className="space-y-0.5">
              <p><strong>Final Result:</strong> <span className="text-emerald-900 font-black uppercase text-sm ml-1">{data.resultStatus}</span></p>
              <p><strong>Division / Classification:</strong> <span className="font-bold text-slate-900 ml-1">{data.division}</span></p>
              <p><strong>Class Position:</strong> <span className="font-bold text-blue-900 ml-1">Rank #{data.rank} in Class</span></p>
            </div>
            <div className="text-right border-l border-slate-300 pl-6 max-w-sm">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Promotion Endorsement</span>
              <p className="font-serif italic font-bold text-slate-900 text-xs mt-0.5">
                Qualified and eligible for standard progression into Class {Number(rawClass) ? Number(rawClass) + 1 : 'XI'}.
              </p>
              <p className="text-[10.5px] text-slate-600 mt-0.5">Remarks: {data.remarks}</p>
            </div>
          </div>
        </div>

        {/* ================= 6. CLASSICAL SIGNATURE FOOTER ================= */}
        <div className="pt-4 border-t-2 border-slate-950 mt-2 font-sans">
          <div className="grid grid-cols-4 gap-4 items-end text-center text-xs">
            {/* QR Code */}
            <div className="flex items-center gap-2 text-left">
              <div className="w-14 h-14 border border-slate-900 p-0.5 bg-white shrink-0 flex items-center justify-center">
                <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
              </div>
              <div className="text-[9px] text-slate-600 leading-tight">
                <span className="font-bold text-slate-950 block">SECURE QR CODE</span>
                <span>Date: 28-03-2027</span>
                <span className="block">Place: Bettiah</span>
              </div>
            </div>

            {/* Incharge */}
            <div>
              <div className="h-8 flex items-end justify-center pb-0.5">
                <span className="font-serif italic font-bold text-slate-700">R. K. Verma</span>
              </div>
              <div className="border-t border-slate-700 pt-0.5">
                <span className="font-bold text-slate-900 uppercase block text-[11px]">Class Teacher</span>
              </div>
            </div>

            {/* Official Seal */}
            <div className="flex flex-col items-center">
              <div className="h-10 flex items-center justify-center">
                <img src={stampcert} alt="Seal" className="h-14 object-contain opacity-80" />
              </div>
              <div className="border-t border-slate-700 pt-0.5 w-full">
                <span className="font-bold text-slate-900 uppercase block text-[11px]">Exam Controller</span>
              </div>
            </div>

            {/* Headmaster */}
            <div>
              <div className="h-8 flex items-end justify-center pb-0.5">
                <span className="font-serif italic font-bold text-lg text-slate-950 leading-none">
                  Principal
                </span>
              </div>
              <div className="border-t border-slate-700 pt-0.5">
                <span className="font-bold text-slate-900 uppercase block text-[11px]">Principal / Head</span>
              </div>
            </div>
          </div>

          <p className="text-center text-[9px] text-slate-500 font-serif italic mt-2.5 pt-1.5 border-t border-slate-200">
            This official academic document is issued under the authority of Star Public School Management Committee.
          </p>
        </div>
      </div>
    </div>
  )
}
