import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import schoolLogo from '../../../assets/logo.png'
import stampcert from '../../../assets/stampcert.png'
import { SAMPLE_MARKS_DATA } from '../../../constants/documentTemplateRegistry'

export default function ModernAcademicReportCard({
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
  const bloodGroup = student.blood_group || '—'
  const photo = student.PhotoUrl || student.photoUrl || student.photo_url || student.photo || student.image || null

  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const tagline = customization.tagline || 'Affiliated to State Board & CBSE Curriculum · School Code: 845438'
  const session = customization.session || data.session || '2026-2027'
  const examName = customization.examName || data.examName || 'Annual Assessment & Comprehensive Evaluation'
  const affiliationNo = customization.affiliationNo || 'Affiliation No: 2130894'

  const coScholastic = [
    { area: 'Work Education / IT', activity: 'Computer Applications, Coding & Digital Literacy', grade: 'A1', remarks: 'Exceptional technical proficiency' },
    { area: 'Art Education', activity: 'Visual Arts, Craft & Creative Expression', grade: 'A', remarks: 'Creative & detail-oriented' },
    { area: 'Health & Physical Education', activity: 'Athletics, Yoga & Team Sports', grade: 'A1', remarks: 'High stamina & leadership' },
    { area: 'Discipline & Values', activity: 'Punctuality, Behavior, Teamwork & Responsibility', grade: 'A1', remarks: 'Exemplary conduct' },
  ]

  const gradingScale = [
    { range: '91% – 100%', grade: 'A1', gp: '10.0', desc: 'Outstanding' },
    { range: '81% – 90%', grade: 'A2', gp: '9.0', desc: 'Excellent' },
    { range: '71% – 80%', grade: 'B1', gp: '8.0', desc: 'Very Good' },
    { range: '61% – 70%', grade: 'B2', gp: '7.0', desc: 'Good' },
    { range: '51% – 60%', grade: 'C1', gp: '6.0', desc: 'Average' },
    { range: '41% – 50%', grade: 'C2', gp: '5.0', desc: 'Fair' },
    { range: '33% – 40%', grade: 'D', gp: '4.0', desc: 'Passing' },
    { range: 'Below 33%', grade: 'E', gp: '0.0', desc: 'Needs Improvement' },
  ]

  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    let isCurrent = true
    const qrPayload = [
      schoolName,
      `Report Card: ${examName} (${session})`,
      `Student: ${studentName}`,
      `Class: ${rawClass} (${studentSection}) · Roll: ${rollNo}`,
      `Adm No: ${admissionNo}`,
      `Total Marks: ${data.totalObtained}/${data.totalMaxMarks} (${data.percentage}%)`,
      `Result: ${data.resultStatus} · ${data.division}`,
      `Auth Ref: SPS-MRK-${rollNo}-${session.replace(/\s+/g, '')}`,
    ].join('\n')

    QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 220,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f2952', light: '#ffffff' },
    })
      .then((url) => { if (isCurrent) setQrDataUrl(url) })
      .catch(() => {})

    return () => { isCurrent = false }
  }, [studentName, rollNo, rawClass, data.totalObtained])

  return (
    <div
      id={id || `modern-academic-report-${rollNo}`}
      className="sps-document-sheet w-full max-w-[850px] min-h-[1140px] bg-white border border-slate-300 p-8 text-slate-900 shadow-2xl rounded-2xl mx-auto flex flex-col justify-between relative overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background Watermark Crest */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none">
        <img src={schoolLogo} alt="" className="w-[500px] h-[500px] object-contain" />
      </div>

      <div className="relative z-10 space-y-4">
        {/* ================= 1. MODERN SAPPHIRE & GOLD HEADER ================= */}
        <div className="rounded-2xl overflow-hidden border border-blue-900/40 shadow-sm bg-gradient-to-r from-[#0b2149] via-[#12326b] to-[#0b2149] text-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 border-2 border-amber-400">
                <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/40">
                    {affiliationNo}
                  </span>
                  <span className="text-[10px] font-mono text-blue-200">School Code: 845438</span>
                </div>
                <h1 className="text-2xl sm:text-[26px] font-black uppercase tracking-tight text-white mt-1 leading-none drop-shadow">
                  {schoolName}
                </h1>
                <p className="text-xs text-blue-100 mt-1 font-medium">
                  {tagline}
                </p>
                <p className="text-[11px] text-blue-200">
                  Main Road, Bettiah, West Champaran, Bihar - 845438 · Email: info@starpublicschool.com
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 flex flex-col items-end">
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs uppercase px-3.5 py-1.5 rounded-xl shadow-md tracking-wider">
                ANNUAL REPORT CARD
              </span>
              <p className="text-xs text-amber-200 font-bold mt-1.5">Academic Session {session}</p>
              <span className="text-[10px] font-mono text-blue-200 mt-0.5">S.R. No: {admissionNo}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs text-blue-100">
            <span className="font-bold tracking-wide text-white uppercase text-[11px]">{examName}</span>
            <span className="font-mono text-[11px] text-amber-300 font-bold">Continuous & Comprehensive Evaluation (CCE)</span>
          </div>
        </div>

        {/* ================= 2. CANDIDATE PROFILE & PERFORMANCE BADGE ================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
          {/* Bio Details Box */}
          <div className="md:col-span-8 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Student Name:</span>
                <span className="text-sm font-black text-slate-950 uppercase">{studentName}</span>
              </div>
              <span className="bg-blue-900 text-white font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                Roll #{rollNo}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11.5px] text-slate-700">
              <div><span className="text-slate-400 font-medium">Father's Name:</span> <strong className="text-slate-900 uppercase ml-1">{fatherName}</strong></div>
              <div><span className="text-slate-400 font-medium">Mother's Name:</span> <strong className="text-slate-900 uppercase ml-1">{motherName}</strong></div>
              <div><span className="text-slate-400 font-medium">Class & Section:</span> <strong className="text-blue-900 ml-1">Class {rawClass} - Sec {studentSection}</strong></div>
              <div><span className="text-slate-400 font-medium">Admission No:</span> <span className="font-mono font-bold text-slate-900 ml-1">{admissionNo}</span></div>
              <div><span className="text-slate-400 font-medium">Date of Birth:</span> <span className="font-mono font-semibold text-slate-900 ml-1">{dob}</span></div>
              <div><span className="text-slate-400 font-medium">Blood Group:</span> <span className="font-bold text-rose-700 ml-1">{bloodGroup}</span></div>
            </div>

            {/* Attendance Meter */}
            <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-200/70">
              <span className="text-slate-500 font-medium">Attendance Record: <strong>{data.attendance}</strong> (212 / 225 working days)</span>
              <span className="text-emerald-700 font-bold">Regular & Punctual</span>
            </div>
          </div>

          {/* Performance Summary Widget */}
          <div className="md:col-span-4 p-3.5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/40 flex flex-col justify-between items-center text-center">
            <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase pb-1 border-b border-blue-200/70">
              <span>Overall Score</span>
              <span className="text-blue-700">Class Rank #{data.rank}</span>
            </div>

            <div className="my-1.5 flex items-center gap-3">
              <div className="w-16 h-16 rounded-full border-4 border-blue-700 flex flex-col items-center justify-center bg-white shadow-sm p-1">
                <span className="text-base font-black text-blue-950 leading-none">{data.percentage}%</span>
                <span className="text-[7.5px] font-bold text-slate-400 uppercase mt-0.5">Aggregate</span>
              </div>
              <div className="text-left space-y-0.5">
                <span className="inline-block bg-emerald-600 text-white text-[9.5px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide">
                  {data.resultStatus}
                </span>
                <p className="text-xs font-black text-slate-900 leading-tight">{data.division}</p>
                <p className="text-[10px] text-slate-500 font-mono">Total: {data.totalObtained} / {data.totalMaxMarks}</p>
              </div>
            </div>

            <div className="w-full bg-emerald-100 border border-emerald-300 rounded-lg py-1 px-2 text-[10.5px] font-bold text-emerald-900">
              Promoted to Class {Number(rawClass) ? Number(rawClass) + 1 : 'Next Grade'}
            </div>
          </div>
        </div>

        {/* ================= 3. PART 1: SCHOLASTIC ACADEMIC PERFORMANCE TABLE ================= */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-700" />
              <span>Part 1: Scholastic Academic Evaluation</span>
            </h3>
            <span className="text-[10.5px] text-slate-500 font-medium font-mono">Maximum Marks: 100 per Subject</span>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0b2149] text-white text-[10.5px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 border-r border-blue-900/40">Code</th>
                  <th className="py-2.5 px-3 border-r border-blue-900/40">Subject Name</th>
                  <th className="py-2.5 px-2 text-center border-r border-blue-900/40">Max Marks</th>
                  <th className="py-2.5 px-2 text-center border-r border-blue-900/40">Pass Marks</th>
                  <th className="py-2.5 px-2 text-center border-r border-blue-900/40">Theory (80)</th>
                  <th className="py-2.5 px-2 text-center border-r border-blue-900/40">Practical / IA (20)</th>
                  <th className="py-2.5 px-3 text-center border-r border-blue-900/40">Total Scored</th>
                  <th className="py-2.5 px-2 text-center border-r border-blue-900/40">Grade</th>
                  <th className="py-2.5 px-3 text-center">Progress Scale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.subjects.map((s, idx) => {
                  const pct = Math.round((s.total / s.maxMarks) * 100)
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-500 border-r border-slate-200 text-[11px]">{s.code || `10${idx + 1}`}</td>
                      <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">{s.subject}</td>
                      <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-200">{s.maxMarks}</td>
                      <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-200">{s.passMarks}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 border-r border-slate-200">{s.theory}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 border-r border-slate-200">{s.practical}</td>
                      <td className="py-2 px-3 text-center font-mono font-black text-blue-950 border-r border-slate-200 text-[13px] bg-blue-50/30">
                        {s.total}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        <span className={`inline-block font-black px-2 py-0.5 rounded text-[10px] ${
                          s.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-blue-100 text-blue-900'
                        }`}>
                          {s.grade}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${pct >= 90 ? 'bg-emerald-600' : pct >= 75 ? 'bg-blue-600' : 'bg-amber-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-600 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs">
                  <td colSpan={2} className="py-2.5 px-3 uppercase font-black text-slate-900">
                    Grand Total (All Subjects)
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono">{data.totalMaxMarks}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-500">200</td>
                  <td colSpan={2} className="text-right px-3 text-slate-600 font-semibold">
                    Aggregate Obtained:
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-black text-sm text-blue-950 bg-blue-100/60">
                    {data.totalObtained}
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 text-center text-emerald-800 font-black">
                    {data.percentage}% · Grade A1 · {data.division}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ================= 4. PART 2: CO-SCHOLASTIC & LIFE SKILLS EVALUATION ================= */}
        <div className="space-y-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5 px-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Part 2: Co-Scholastic & Life Skills Assessment (3-Point Scale A–C)</span>
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-1.5 px-3 w-1/4">Evaluation Domain</th>
                  <th className="py-1.5 px-3">Specific Activity / Skill Descriptor</th>
                  <th className="py-1.5 px-2 text-center w-20">Grade</th>
                  <th className="py-1.5 px-3 w-1/3">Teacher Evaluation Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {coScholastic.map((cs, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                    <td className="py-1.5 px-3 font-bold text-slate-800">{cs.area}</td>
                    <td className="py-1.5 px-3 text-slate-600">{cs.activity}</td>
                    <td className="py-1.5 px-2 text-center">
                      <span className="bg-emerald-50 text-emerald-800 font-black px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                        {cs.grade}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-700 font-medium italic">{cs.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= 5. PART 3: GRADING SCALE KEY & REMARKS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
          {/* Grading Scale Guide */}
          <div className="md:col-span-7 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-[10px]">
            <span className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Scholastic Grading Scale Reference (9-Point Scale)
            </span>
            <div className="grid grid-cols-4 gap-1">
              {gradingScale.map((g, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded p-1 text-center">
                  <span className="font-bold text-blue-900 block">{g.grade} ({g.gp})</span>
                  <span className="text-[9px] text-slate-500">{g.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Remarks & Result Endorsement */}
          <div className="md:col-span-5 p-3 rounded-xl border border-blue-200 bg-blue-50/40 text-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-900 uppercase block tracking-wider">
                Class Teacher Remarks & Promotion
              </span>
              <p className="text-[11.5px] font-semibold text-slate-800 mt-1 italic">
                "{data.remarks}"
              </p>
            </div>
            <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700">Result: <strong className="text-emerald-700 uppercase">PASSED</strong></span>
              <span className="font-bold text-blue-900">Rank: #{data.rank} of {rawClass}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 6. OFFICIAL VERIFICATION & SIGNATURES ================= */}
      <div className="relative z-10 pt-4 border-t-2 border-slate-200 mt-3">
        <div className="grid grid-cols-4 gap-4 items-end text-center text-xs">
          {/* QR Verification */}
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-14 h-14 rounded-lg border border-slate-300 p-0.5 bg-white shadow-xs shrink-0 flex items-center justify-center">
              <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
            </div>
            <div className="text-[9.5px] text-slate-500 leading-tight">
              <span className="font-black text-slate-800 block uppercase">Official CCE QR</span>
              <span>Scan with phone camera to verify authenticity</span>
              <span className="block font-mono text-[9px] text-slate-400 mt-0.5">Date: 28/03/2027</span>
            </div>
          </div>

          {/* Class Teacher */}
          <div>
            <div className="h-9 flex items-end justify-center pb-1">
              <span className="font-serif italic text-base text-slate-700 font-bold select-none">
                P. Kumari
              </span>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span className="font-bold text-slate-800 uppercase block text-[11px]">Class Teacher</span>
              <span className="text-[9.5px] text-slate-400">Signature</span>
            </div>
          </div>

          {/* Official Stamp */}
          <div className="flex flex-col items-center">
            <div className="h-10 flex items-center justify-center">
              <img src={stampcert} alt="Official Seal" className="h-14 object-contain opacity-85 select-none" />
            </div>
            <div className="border-t border-slate-400 pt-1 w-full">
              <span className="font-bold text-slate-800 uppercase block text-[11px]">School Seal</span>
              <span className="text-[9.5px] text-slate-400">Bettiah Campus</span>
            </div>
          </div>

          {/* Principal Signature */}
          <div>
            <div className="h-9 flex items-end justify-center pb-1">
              <span
                className="text-[22px] text-[#071d3f] font-bold leading-none select-none tracking-normal"
                style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
              >
                S. Thompson
              </span>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span className="font-bold text-slate-800 uppercase block text-[11px]">Principal</span>
              <span className="text-[9.5px] text-slate-400">Star Public School</span>
            </div>
          </div>
        </div>

        <p className="text-center text-[9.5px] text-slate-400 mt-3 pt-2 border-t border-slate-100 font-mono">
          Star Public School Bettiah · Computer-generated comprehensive annual statement of marks · Valid without physical corrections
        </p>
      </div>
    </div>
  )
}
