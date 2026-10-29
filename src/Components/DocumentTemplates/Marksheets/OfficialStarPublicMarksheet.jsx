import React from 'react'
import schoolLogo from '../../../assets/logo.png'
import stampcert from '../../../assets/stampcert.png'
import { SAMPLE_MARKS_DATA } from '../../../constants/documentTemplateRegistry'

export default function OfficialStarPublicMarksheet({
  student = {},
  marksData = {},
  customization = {},
  id,
}) {
  const data = { ...SAMPLE_MARKS_DATA, ...marksData }

  const studentName = student.Name || student.name || 'Parbej Alam'
  const fatherName =
    student.father_name || student.FatherName || student.fatherName || 'Jawed Ansari'
  const motherName =
    student.mother_name || student.MotherName || student.motherName || '--'
  const rollNo = (student.Roll || student.roll_no || student.rollNo || '1').toString()
  const rawClass = (student.Class || student.class || 'LKG').toString().replace(/^Class\s+/i, '')
  const section = student.Section || student.section || customization.section || 'A'
  const studentPhotoUrl = student.photo_url || student.PhotoUrl || student.photo || null

  const schoolName = customization.schoolName || 'STAR PUBLIC SCHOOL'
  const schoolAddress = customization.schoolAddress || 'Meghwal mathia Bazar, West Champaran, Bihar 845106'
  const examTitle =
    customization.examTitle || data.examName || 'SECOND TERMINAL EXAMINATION'
  const academicYear = customization.academicYear || data.academicYear || '2026'
  const publishedDate = data.publishedDate || customization.publishedDate || '29/10/2026'

  const subjects =
    data.subjects && data.subjects.length > 0
      ? data.subjects
      : [
          { subject: 'HINDI', maxMarks: 100, passMarks: 30, ext: 80, int: 0, total: 80, status: 'PASS' },
          { subject: 'ENGLISH', maxMarks: 100, passMarks: 30, ext: 84, int: 0, total: 84, status: 'PASS' },
          { subject: 'MATH', maxMarks: 100, passMarks: 30, ext: 85, int: 0, total: 85, status: 'PASS' },
          { subject: 'DRAWING', maxMarks: 50, passMarks: 15, ext: 34, int: '--', total: 34, status: 'PASS' },
          { subject: 'URDU', maxMarks: 100, passMarks: 30, ext: 56, int: 0, total: 56, status: 'PASS' },
          { subject: 'G.K', maxMarks: 100, passMarks: 30, ext: 66, int: 0, total: 66, status: 'PASS' },
          { subject: 'COMP / TAB', maxMarks: 100, passMarks: 30, ext: 48, int: 0, total: 48, status: 'PASS' },
        ]

  const totalFullMarks =
    data.totalMaxMarks || subjects.reduce((sum, s) => sum + (Number(s.maxMarks || s.full_marks) || 100), 0)
  const totalObtained =
    data.totalObtained ??
    subjects.reduce((sum, s) => sum + (Number(s.total ?? s.marks_obtained ?? s.marks) || 0), 0)
  const percentage =
    data.percentage ||
    (totalFullMarks > 0 ? ((totalObtained / totalFullMarks) * 100).toFixed(2) + '%' : '69.69%')
  const division = data.division || 'First'
  const rank = data.rank || '3rd'

  return (
    <div
      id={id || `marksheet-${rollNo}`}
      className="sps-document-sheet w-full max-w-[880px] bg-white p-2 sm:p-4 mx-auto font-sans print:p-0 print:max-w-none text-slate-800"
    >
      <div
        className="relative overflow-hidden bg-white text-[12px] leading-[1.3] text-[#06154b] sm:text-[13px] flex flex-col justify-between shadow-xl"
        style={{
          width: '100%',
          minHeight: '1301px',
          border: '2px solid #d97706',
          borderRadius: '16px',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Top Corner Sweeping Ribbon Waves */}
        <svg
          className="absolute top-0 left-0 w-full h-[85px] pointer-events-none select-none z-0"
          viewBox="0 0 920 85"
          fill="none"
          preserveAspectRatio="none"
        >
          <path d="M0,0 L340,0 C250,42 140,68 0,82 Z" fill="#881337" />
          <path d="M0,0 L290,0 C205,36 110,56 0,66 Z" fill="#d97706" />
          <path d="M0,0 L230,0 C155,26 70,38 0,46 Z" fill="#0c2340" />

          <path d="M920,0 L580,0 C670,42 780,68 920,82 Z" fill="#881337" />
          <path d="M920,0 L630,0 C715,36 810,56 920,66 Z" fill="#d97706" />
          <path d="M920,0 L690,0 C765,26 850,38 920,46 Z" fill="#0c2340" />
        </svg>

        {/* Bottom Corner Sweeping Ribbon Waves */}
        <svg
          className="absolute bottom-[44px] left-0 w-full h-[55px] pointer-events-none select-none z-0"
          viewBox="0 0 920 55"
          fill="none"
          preserveAspectRatio="none"
        >
          <path d="M0,55 L300,55 C210,28 115,12 0,0 Z" fill="#0c2340" />
          <path d="M0,55 L245,55 C165,30 85,16 0,6 Z" fill="#d97706" />
          <path d="M0,55 L180,55 C115,34 55,22 0,14 Z" fill="#881337" />

          <path d="M920,55 L620,55 C710,28 805,12 920,0 Z" fill="#0c2340" />
          <path d="M920,55 L675,55 C755,30 835,16 920,6 Z" fill="#d97706" />
          <path d="M920,55 L740,55 C805,34 865,22 920,14 Z" fill="#881337" />
        </svg>

        {/* Main Content */}
        <div className="relative z-10 px-4 pt-3.5 pb-2 sm:px-6 sm:pt-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Header Row */}
            <div className="grid grid-cols-[100px_minmax(0,1fr)_100px] sm:grid-cols-[135px_minmax(0,1fr)_135px] items-center gap-2 sm:gap-4">
              <div className="flex items-center justify-start">
                <div className="w-[88px] h-[88px] sm:w-[115px] sm:h-[115px] rounded-full p-1 flex items-center justify-center">
                  <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="text-center min-w-0">
                <h1
                  className="text-[22px] sm:text-[38px] font-black uppercase tracking-[0.02em] text-[#0a1d47] leading-tight"
                  style={{ fontFamily: "'Cinzel', 'Baskerville Old Face', 'Book Antiqua', 'Palatino Linotype', 'Georgia', serif" }}
                >
                  {schoolName}
                </h1>
                <p className="mt-0.5 text-[11px] sm:text-[13.5px] font-semibold text-[#0a1d47]">
                  {schoolAddress}
                </p>

                <div className="w-48 sm:w-64 h-[1.5px] bg-[#be123c] mx-auto my-1.5" />

                <p className="text-[14px] sm:text-[18px] font-black uppercase tracking-[0.04em] text-[#881337]">
                  {examTitle}
                </p>

                <div className="mt-1">
                  <span className="inline-block px-5 py-0.5 rounded-full bg-[#fef3c7] border border-[#f59e0b] text-[#78350f] font-black text-[11px] sm:text-[13px] tracking-wide">
                    Academic Year : {academicYear}
                  </span>
                </div>

                <div className="mt-1.5 flex items-center justify-center gap-2 sm:gap-3">
                  <span className="h-[1.5px] w-12 sm:w-20 bg-[#881337]" />
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#881337] px-4 py-0.5 text-[9.5px] sm:text-[11.5px] font-black uppercase tracking-[0.12em] text-white shadow-xs">
                    <span className="text-[#f59e0b] text-xs">◆</span>
                    REPORT CARD
                    <span className="text-[#f59e0b] text-xs">◆</span>
                  </span>
                  <span className="h-[1.5px] w-12 sm:w-20 bg-[#881337]" />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <div className="w-[88px] h-[112px] sm:w-[110px] sm:h-[135px] rounded-2xl border-2 border-[#f59e0b] bg-white flex flex-col items-center justify-center overflow-hidden shadow-2xs">
                  {studentPhotoUrl ? (
                    <img src={studentPhotoUrl} alt={studentName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#94a3b8]">
                      <svg className="w-10 h-10 sm:w-12 sm:h-12 fill-current mb-0.5" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                      <span className="text-[10px] font-black tracking-widest uppercase">PHOTO</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Student Info Box */}
            <div className="mt-3 rounded-xl border-2 border-[#f59e0b] bg-white p-2.5 sm:p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-slate-200 gap-y-1.5 md:gap-x-4 text-[12px] sm:text-[14px]">
                <div className="space-y-1.5 pr-2">
                  <div className="flex items-center">
                    <span className="w-[130px] sm:w-[150px] font-bold text-[#0a1d47] shrink-0">Name of Student</span>
                    <span className="font-bold text-[#0a1d47] mr-3">:</span>
                    <span className="font-extrabold uppercase text-black truncate">{studentName}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-[130px] sm:w-[150px] font-bold text-[#0a1d47] shrink-0">Mother's Name</span>
                    <span className="font-bold text-[#0a1d47] mr-3">:</span>
                    <span className="font-extrabold uppercase text-black truncate">{motherName}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-[130px] sm:w-[150px] font-bold text-[#0a1d47] shrink-0">Father's Name</span>
                    <span className="font-bold text-[#0a1d47] mr-3">:</span>
                    <span className="font-extrabold uppercase text-black truncate">{fatherName}</span>
                  </div>
                </div>

                <div className="space-y-1.5 md:pl-4">
                  <div className="flex items-center">
                    <span className="w-[110px] sm:w-[130px] font-bold text-[#0a1d47] shrink-0">Roll No.</span>
                    <span className="font-bold text-[#0a1d47] mr-3">:</span>
                    <span className="font-extrabold text-black">{rollNo}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-[110px] sm:w-[130px] font-bold text-[#0a1d47] shrink-0">Class</span>
                    <span className="font-bold text-[#0a1d47] mr-3">:</span>
                    <span className="font-extrabold uppercase text-black">{rawClass}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-[110px] sm:w-[130px] font-bold text-[#0a1d47] shrink-0">Section</span>
                    <span className="font-bold text-[#0a1d47] mr-3">:</span>
                    <span className="font-extrabold uppercase text-black">{section}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SCHOLASTIC PERFORMANCE Table */}
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-300 bg-white relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] z-0">
                <img src={schoolLogo} alt="" className="w-56 h-56 object-contain" />
              </div>

              <div className="relative z-10 flex items-center justify-between px-3.5 py-2 bg-[#881337] text-white text-[11px] sm:text-[13px] font-bold">
                <span className="font-black uppercase tracking-wider text-white">SCHOLASTIC PERFORMANCE</span>
                <div className="flex items-center gap-3 text-[10.5px] sm:text-[12px] font-bold text-white">
                  <span>Subjects : {subjects.length}</span>
                  <span>|</span>
                  <span>Pass : 30</span>
                  <span>|</span>
                  <span>Drawing Pass : 15</span>
                </div>
              </div>

              <div className="relative z-10 overflow-x-auto">
                <table className="w-full min-w-[650px] border-collapse text-[11px] sm:text-[14px]">
                  <thead>
                    <tr>
                      <th className="bg-[#e0f2fe] text-[#0369a1] text-center w-[55px] px-2 py-2 border border-slate-300 font-black uppercase">S. NO.</th>
                      <th className="bg-[#e0f2fe] text-[#0369a1] text-left px-3 py-2 border border-slate-300 font-black uppercase">SUBJECT</th>
                      <th className="bg-[#e0f2fe] text-[#0369a1] text-center px-2 py-2 border border-slate-300 font-black uppercase">FM</th>
                      <th className="bg-[#e0f2fe] text-[#0369a1] text-center px-2 py-2 border border-slate-300 font-black uppercase">PASS</th>
                      <th className="bg-[#e0f2fe] text-[#0369a1] text-center px-2 py-2 border border-slate-300 font-black uppercase">EXT</th>
                      <th className="bg-[#e0f2fe] text-[#0369a1] text-center px-2 py-2 border border-slate-300 font-black uppercase">INT</th>
                      <th className="bg-[#e0f2fe] text-[#0369a1] text-center px-2 py-2 border border-slate-300 font-black uppercase">TOTAL</th>
                      <th className="bg-[#dcfce7] text-[#15803d] text-center px-2 py-2 border border-slate-300 font-black uppercase">RESULT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((sub, idx) => {
                      const subName = sub.subject || sub.name || `Subject ${idx + 1}`
                      const full = sub.maxMarks || sub.full_marks || 100
                      const pass = sub.passMarks || sub.pass_marks || (subName.toLowerCase().includes('drawing') ? 15 : 30)
                      const ext = sub.ext ?? sub.external ?? 80
                      const internal = sub.int ?? sub.internal ?? 0
                      const obtained = sub.total ?? sub.marks_obtained ?? sub.marks ?? 0
                      const isPass = Number(obtained) >= Number(pass)

                      return (
                        <tr key={idx} className="bg-white/90 hover:bg-slate-50/50">
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-800">{idx + 1}</td>
                          <td className="border border-slate-300 px-3 py-1.5 font-bold uppercase text-black">{subName}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-black">{full}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-black">{pass}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-black">{ext}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-black">{internal}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-black text-[#1d4ed8] text-[13px] sm:text-[15px]">{obtained}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-black text-[#15803d]">{isPass ? 'PASS' : 'FAIL'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6 Metric Cards */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <div className="rounded-xl border border-[#93c5fd] bg-[#f0f9ff] p-2 flex items-center gap-2 shadow-2xs">
                <span className="text-xl sm:text-2xl text-[#0c2340]">🏆</span>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 truncate">TOTAL MARKS</p>
                  <p className="text-[15px] sm:text-[20px] font-black text-[#0c2340] leading-tight">{totalFullMarks}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#fbcfe8] bg-[#fff1f2] p-2 flex items-center gap-2 shadow-2xs">
                <span className="text-xl sm:text-2xl text-[#be123c]">📊</span>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 truncate">MARKS OBTAINED</p>
                  <p className="text-[15px] sm:text-[20px] font-black text-[#be123c] leading-tight">{totalObtained}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#a7f3d0] bg-[#f0fdf4] p-2 flex items-center gap-2 shadow-2xs">
                <span className="text-xl sm:text-2xl text-[#15803d]">📈</span>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 truncate">PERCENTAGE</p>
                  <p className="text-[15px] sm:text-[20px] font-black text-[#15803d] leading-tight">{percentage}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-2 flex items-center gap-2 shadow-2xs">
                <span className="text-xl sm:text-2xl text-[#d97706]">🎖️</span>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 truncate">DIVISION</p>
                  <p className="text-[15px] sm:text-[20px] font-black text-[#0c2340] leading-tight">{division}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#d8b4fe] bg-[#faf5ff] p-2 flex items-center gap-2 shadow-2xs">
                <span className="text-xl sm:text-2xl text-[#7e22ce]">🏅</span>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 truncate">RANK</p>
                  <p className="text-[15px] sm:text-[20px] font-black text-[#0c2340] leading-tight">{rank}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#fecdd3] bg-[#fff1f2] p-2 flex items-center gap-2 shadow-2xs">
                <span className="text-xl sm:text-2xl text-[#9f1239]">📅</span>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 truncate">PUBLISHED DATE</p>
                  <p className="text-[12px] sm:text-[14px] font-black text-[#0c2340] leading-tight">{publishedDate}</p>
                </div>
              </div>
            </div>

            {/* Middle Section: TERM WISE COMPARISON & REMARKS */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-300 overflow-hidden bg-white shadow-2xs flex flex-col justify-between">
                <div className="flex items-center gap-2 px-3.5 py-2 bg-[#0c2340] text-white text-[11px] sm:text-[13px] font-bold">
                  <span className="font-black uppercase tracking-wider">TERM WISE COMPARISON</span>
                </div>
                <table className="w-full text-[11px] sm:text-[13.5px] border-collapse flex-1">
                  <thead>
                    <tr>
                      <th className="bg-[#e0f2fe] text-[#0369a1] text-left px-3 py-1.5 border border-slate-300 font-black uppercase">METRIC</th>
                      <th className="bg-[#e0f2fe] text-[#0369a1] text-center px-3 py-1.5 border border-slate-300 font-black uppercase">FIRST TERM</th>
                      <th className="bg-[#e0f2fe] text-[#0369a1] text-center px-3 py-1.5 border border-slate-300 font-black uppercase">SECOND TERM</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-300">
                      <td className="px-3 py-1 font-bold text-slate-700">TOTAL MARKS</td>
                      <td className="px-3 py-1 text-center font-bold text-black">{totalFullMarks}</td>
                      <td className="px-3 py-1 text-center font-bold text-black">{totalFullMarks}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="px-3 py-1 font-bold text-slate-700">MARKS OBTAINED</td>
                      <td className="px-3 py-1 text-center font-bold text-black">0</td>
                      <td className="px-3 py-1 text-center font-bold text-black">{totalObtained}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="px-3 py-1 font-bold text-slate-700">PERCENTAGE</td>
                      <td className="px-3 py-1 text-center font-bold text-black">0%</td>
                      <td className="px-3 py-1 text-center font-black text-[#15803d]">{percentage}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="px-3 py-1 font-bold text-slate-700">DIVISION</td>
                      <td className="px-3 py-1 text-center font-bold text-slate-600">Fail</td>
                      <td className="px-3 py-1 text-center font-black text-[#15803d]">{division}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="px-3 py-1 font-bold text-slate-700">CLASS & SECTION RANK</td>
                      <td className="px-3 py-1 text-center font-bold text-black">--</td>
                      <td className="px-3 py-1 text-center font-bold text-black">{rank}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1 font-bold text-slate-700">PUBLISHED DATE</td>
                      <td className="px-3 py-1 text-center font-bold text-black">--</td>
                      <td className="px-3 py-1 text-center font-bold text-black">{publishedDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-slate-300 bg-[#fffdfa] overflow-hidden shadow-2xs flex flex-col justify-between">
                <div className="flex items-center gap-2 px-3.5 py-2 bg-[#881337] text-white text-[11px] sm:text-[13px] font-bold">
                  <span>📖</span>
                  <span className="font-black uppercase tracking-wider">REMARKS</span>
                </div>
                <div className="p-4 relative flex-1 flex flex-col items-center justify-center text-center">
                  <p className="font-serif italic text-base sm:text-[19px] text-[#0a1d47] font-bold leading-relaxed">
                    Good performance !
                  </p>
                  <p className="font-serif italic text-base sm:text-[19px] text-[#0a1d47] font-bold leading-relaxed mt-1">
                    Keep it up and continue
                  </p>
                  <p className="font-serif italic text-base sm:text-[19px] text-[#0a1d47] font-bold leading-relaxed">
                    your hard work.
                  </p>
                  <div className="mt-3 text-[#d97706] text-xs opacity-80">
                    <span>⚜️ ─── ❖ ─── ⚜️</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Instructions & Principal Sign & Stamp */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-3">
              <div className="rounded-xl border border-[#fde68a] bg-[#fffdfa] overflow-hidden flex flex-col justify-between shadow-2xs">
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#fef3c7] border-b border-[#fde68a]">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#881337] text-white text-[10px] font-bold">
                    i
                  </span>
                  <span className="font-black uppercase tracking-wider text-[#881337] text-[12px] sm:text-[13.5px]">INSTRUCTIONS</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[10px] sm:text-[11.5px] font-semibold text-[#1e293b] p-3 leading-snug">
                  <li>This is a computer-generated result marksheet for official school use.</li>
                  <li>The details shown here are based on official school records.</li>
                  <li>Any discrepancy should be reported within 7 days of result declaration.</li>
                  <li>AB denotes absent and NA denotes not applicable.</li>
                  <li>Pass Marks: 30 for regular subjects and 15 for Drawing.</li>
                  <li>Rank displayed above is calculated class and section wise.</li>
                </ol>
              </div>

              <div className="rounded-xl border border-[#bae6fd] bg-white overflow-hidden flex flex-col justify-between shadow-2xs">
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#e0f2fe] border-b border-[#bae6fd]">
                  <span className="text-[#0284c7] text-sm">✏️</span>
                  <span className="font-black uppercase tracking-wider text-[#0c2340] text-[12px] sm:text-[13.5px]">PRINCIPAL SIGN & STAMP</span>
                </div>
                <div className="py-1.5 flex items-center justify-center">
                  <img src={stampcert} alt="Principal Stamp" className="h-18 sm:h-22 w-auto object-contain" />
                </div>
                <div className="pb-2 text-center">
                  <div className="h-[2px] bg-[#0c2340] w-3/4 mx-auto mb-1" />
                  <span className="text-[11px] sm:text-[12px] font-black uppercase tracking-wider text-[#0c2340]">
                    PRINCIPAL SIGNATURE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar with Gold Dividers */}
          <div className="relative z-10 mt-3 bg-[#0c2340] text-white text-center py-2 px-4 rounded-b-xl border-t-2 border-[#d97706] shadow-md">
            <p className="text-[12px] sm:text-[14px] text-white font-black tracking-wider uppercase">{schoolName}</p>
            <div className="flex items-center justify-center gap-2 text-[9.5px] sm:text-[11px] text-[#fcd34d] font-bold">
              <span>❖</span>
              <span>{schoolAddress}</span>
              <span>❖</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
