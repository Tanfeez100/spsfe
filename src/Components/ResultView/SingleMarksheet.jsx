import React from 'react'
import schoolLogo from '../../assets/logo.png'
import stampcert from '../../assets/stampcert.png'

export default function SingleMarksheet({
  student = {},
  examTitle = 'FIRST TERMINAL EXAMINATION RESULT - 2026',
  termName = 'First Term',
  schoolName = 'STAR PUBLIC SCHOOL',
  schoolAddress = 'MAIN ROAD MATHIA BAZAR, MEGHWAL',
}) {
  const subjects = student.subjects || []

  const totalFullMarks =
    student.total_marks ??
    subjects.reduce((sum, s) => {
      const isDrawing = /drawing|art/i.test(s.subject || s.subject_name || s.name || '')
      return sum + (Number(s.full_marks || s.fullMarks) || (isDrawing ? 50 : 100))
    }, 0)

  const totalPassMarks =
    subjects.reduce((sum, s) => {
      const isDrawing = /drawing|art/i.test(s.subject || s.subject_name || s.name || '')
      return sum + (Number(s.pass_marks || s.passMarks) || (isDrawing ? 15 : 30))
    }, 0)

  const totalObtained =
    student.total_obtained ??
    subjects.reduce((sum, s) => {
      const val = s.marks_obtained ?? s.marks
      if (val === 'AB' || val === 'Absent' || val === 'A') return sum
      return sum + (Number(val) || 0)
    }, 0)

  const percentage =
    student.percentage ??
    (totalFullMarks > 0 ? ((totalObtained / totalFullMarks) * 100).toFixed(2) : '0.00')

  const division =
    student.division ??
    (Number(percentage) >= 60
      ? 'First'
      : Number(percentage) >= 45
        ? 'Second'
        : Number(percentage) >= 33
          ? 'Third'
          : 'Failed')

  const studentName = student.name || 'SAIMA KHATOON'
  const fatherName = student.father_name || student.fatherName || 'SHAMAD ANSARI'
  const rawClass = String(student.class || '1').replace(/^Class\s+/i, '')
  const rollNo = String(student.roll_no || student.roll || '1')

  return (
    <div className="single-marksheet-page w-full max-w-[820px] mx-auto bg-white p-4 sm:p-6 font-sans print:p-2 print:max-w-none text-slate-800">
      {/* Outer Enclosing Border matching the exact sheet frame */}
      <div className="relative border border-[#cfdbe8] rounded-2xl p-6 sm:p-8 bg-white shadow-sm flex flex-col justify-between min-h-[1080px] print:border-[#cfdbe8] print:shadow-none print:p-6">

        {/* Full-Page Faint Watermark "STAR PUBLIC SCHOOL" */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
          style={{ opacity: 0.055 }}
        >
          <span
            className="text-6xl sm:text-7xl lg:text-8xl font-black text-[#0f2e59] uppercase tracking-widest whitespace-nowrap"
            style={{
              transform: 'rotate(-28deg)',
              letterSpacing: '0.18em',
              userSelect: 'none',
            }}
          >
            STAR PUBLIC SCHOOL
          </span>
        </div>

        {/* Content Container (Layered above watermark) */}
        <div className="relative z-10 space-y-5">

          {/* 1. Header: Logo at left, Centered School Titles (NO horizontal divider line) */}
          <div className="relative flex items-center justify-center min-h-[96px] pt-1 pb-2">
            {/* Top Left Crest Logo */}
            <div className="absolute left-0 top-0 flex items-center justify-center">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl p-1 flex items-center justify-center">
                <img
                  src={schoolLogo}
                  alt="Star Public School Logo"
                  className="w-full h-full object-contain drop-shadow-xs"
                />
              </div>
            </div>

            {/* Centered School Heading */}
            <div className="text-center px-16 sm:px-20">
              <h1
                className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-wide uppercase text-[#0d2d5e] leading-tight"
                style={{
                  fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
                  letterSpacing: '0.04em',
                }}
              >
                {schoolName}
              </h1>
              <p
                className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-slate-600 mt-1"
                style={{
                  fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
                  letterSpacing: '0.08em',
                }}
              >
                {schoolAddress}
              </p>
              <h2 className="text-xs sm:text-sm font-bold tracking-wider text-slate-900 uppercase mt-2">
                {examTitle}
              </h2>
            </div>
          </div>

          {/* 2. Student Information Box */}
          <div className="border border-[#cfdbe8] rounded-xl overflow-hidden bg-white text-xs sm:text-sm">
            <div className="flex border-b border-[#cfdbe8]">
              <div className="w-[28%] sm:w-[25%] py-2 px-3.5 font-bold text-slate-800 border-r border-[#cfdbe8]">
                Name of Student:
              </div>
              <div className="w-[72%] sm:w-[75%] py-2 px-3.5 font-bold text-slate-900 uppercase">
                {studentName}
              </div>
            </div>
            <div className="flex border-b border-[#cfdbe8]">
              <div className="w-[28%] sm:w-[25%] py-2 px-3.5 font-bold text-slate-800 border-r border-[#cfdbe8]">
                Father's Name:
              </div>
              <div className="w-[72%] sm:w-[75%] py-2 px-3.5 font-bold text-slate-900 uppercase">
                {fatherName}
              </div>
            </div>
            <div className="flex border-b border-[#cfdbe8]">
              <div className="w-[28%] sm:w-[25%] py-2 px-3.5 font-bold text-slate-800 border-r border-[#cfdbe8]">
                Class:
              </div>
              <div className="w-[72%] sm:w-[75%] py-2 px-3.5 font-bold text-slate-900">
                {rawClass}
              </div>
            </div>
            <div className="flex">
              <div className="w-[28%] sm:w-[25%] py-2 px-3.5 font-bold text-slate-800 border-r border-[#cfdbe8]">
                Roll Number:
              </div>
              <div className="w-[72%] sm:w-[75%] py-2 px-3.5 font-bold text-slate-900">
                {rollNo}
              </div>
            </div>
          </div>

          {/* 3. Subject Details Table */}
          <div className="border border-[#cfdbe8] rounded-xl overflow-hidden bg-white text-xs sm:text-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#ebf1fa] text-xs font-bold border-b border-[#cfdbe8]">
                  <th className="py-2.5 px-4 text-center font-bold text-slate-800 w-[35%]">
                    Subject Details
                  </th>
                  <th className="py-2.5 px-3 text-center font-bold text-slate-800 border-l border-[#cfdbe8] w-[21%]">
                    Full Marks
                  </th>
                  <th className="py-2.5 px-3 text-center font-bold text-slate-800 border-l border-[#cfdbe8] w-[21%]">
                    Pass Marks
                  </th>
                  <th className="py-2 px-3 text-center font-bold text-slate-800 border-l border-[#cfdbe8] w-[23%] leading-tight">
                    <div>{termName}</div>
                    <div>Marks</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cfdbe8]">
                {subjects.map((sub, idx) => {
                  const subName = sub.subject || sub.subject_name || sub.name || `Subject ${idx + 1}`
                  const isDrawing = /drawing|art/i.test(subName)
                  const full = Number(sub.full_marks || sub.fullMarks) || (isDrawing ? 50 : 100)
                  const pass = Number(sub.pass_marks || sub.passMarks) || (isDrawing ? 15 : 30)
                  const obtained = sub.marks_obtained ?? sub.marks ?? '-'

                  return (
                    <tr key={idx} className="bg-white">
                      <td className="py-2 px-6 text-left font-bold text-slate-900 uppercase">
                        {subName}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-800 border-l border-[#cfdbe8]">
                        {full}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-800 border-l border-[#cfdbe8]">
                        {pass}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900 border-l border-[#cfdbe8]">
                        {obtained}
                      </td>
                    </tr>
                  )
                })}

                {/* Total Row */}
                <tr className="bg-white font-extrabold border-t border-[#cfdbe8]">
                  <td className="py-2.5 px-4 text-center font-black text-slate-900">
                    Total
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-slate-900 border-l border-[#cfdbe8]">
                    {totalFullMarks}
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-slate-900 border-l border-[#cfdbe8]">
                    {totalPassMarks}
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-slate-900 border-l border-[#cfdbe8]">
                    {totalObtained}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Summary Table */}
          <div className="border border-[#cfdbe8] rounded-xl overflow-hidden bg-white text-xs sm:text-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#ebf1fa] border-b border-[#cfdbe8]">
                  <th className="py-2.5 px-4 w-1/2"></th>
                  <th className="py-2.5 px-4 w-1/2 text-center font-bold text-slate-800 border-l border-[#cfdbe8]">
                    {termName}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cfdbe8]">
                <tr>
                  <td className="py-2 px-4 text-center font-bold text-slate-800">
                    Total Marks
                  </td>
                  <td className="py-2 px-4 text-center font-bold text-slate-900 border-l border-[#cfdbe8]">
                    {totalFullMarks}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-center font-bold text-slate-800">
                    Marks Obtained
                  </td>
                  <td className="py-2 px-4 text-center font-bold text-slate-900 border-l border-[#cfdbe8]">
                    {totalObtained}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-center font-bold text-slate-800">
                    Percentage
                  </td>
                  <td className="py-2 px-4 text-center font-bold text-slate-900 border-l border-[#cfdbe8]">
                    {percentage}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-center font-bold text-slate-800">
                    Division
                  </td>
                  <td className="py-2 px-4 text-center font-bold text-slate-900 border-l border-[#cfdbe8]">
                    {division}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. Important Information Box */}
          <div className="border border-[#cfdbe8] rounded-xl p-4 sm:p-5 text-[11px] sm:text-xs leading-relaxed text-slate-700 bg-white relative">
            <h3 className="font-bold text-center text-slate-900 uppercase tracking-wider mb-2.5">
              IMPORTANT INFORMATION
            </h3>
            <div className="space-y-1.5 pl-1 max-w-[72%]">
              <p className="flex items-start gap-1">
                <span>*</span>
                <span>This is a computer-generated marksheet and does not require any signature.</span>
              </p>
              <p className="flex items-start gap-1">
                <span>*</span>
                <span>The details shown here are based on official school records.</span>
              </p>
              <p className="flex items-start gap-1">
                <span>*</span>
                <span>Any discrepancy should be reported to the class teacher within 7 days of result declaration.</span>
              </p>
              <p className="flex items-start gap-1">
                <span>*</span>
                <span>
                  Issued by <strong>STAR PUBLIC SCHOOL</strong>, Main Road Mathia Bazar, Meghwal.
                </span>
              </p>
              <p className="flex items-start gap-1">
                <span>*</span>
                <span>
                  <strong>AB:</strong> AB denotes absent in particular subject
                </span>
              </p>
              <p className="flex items-start gap-1">
                <span>*</span>
                <span>
                  <strong>NA:</strong> NA denotes Not Applicable for particular subject for particular class
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 6. Bottom Right Stamp and Principal's Signature & Seal */}
        <div className="relative z-10 flex justify-end mt-4 pr-4">
          <div className="flex flex-col items-center text-center">
            <div className="-mb-3">
              <img
                src={stampcert}
                alt="Star Public School Seal"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-xs"
              />
            </div>
            <p className="text-xs sm:text-[13px] font-medium text-slate-800 pt-1">
              Principal's Signature & Seal
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
