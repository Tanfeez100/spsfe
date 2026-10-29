import React from 'react'

export default function JuniorPlayfulDesign({
  data = {},
  student = {},
  studentRollLabel = '1',
  params = {},
  sessionDisplay = { label: 'Academic Year', text: '2026' },
  schoolLogo,
  stampcert,
  studentPhotoUrl,
  processedMarks = [],
  currentTotalMarksLabel = '650',
  currentObtainedLabel = '453',
  currentPercentageLabel = '69.69%',
  currentDivisionLabel = 'First',
  currentRankLabel = '3rd',
  currentPublishedDate = '29/10/2026',
  termSummaries = {},
  summaryReportTerminals = ['Second'],
  toDisplayValue = (v) => v ?? '--',
  getDisplayRank = () => '3rd',
  getPublishedDateFromSummary = () => '29/10/2026',
  formatDateLabel = (d) => d || '29/10/2026',
  formatTerminalExamTitle = () => 'SECOND TERMINAL EXAMINATION',
  SCHOOL_NAME = 'STAR PUBLIC SCHOOL',
  SCHOOL_ADDRESS = 'Meghwal mathia Bazar, West Champaran, Bihar 845106',
}) {
  // Predefined icons and color schemes for the 8 subject cards
  const subjectCardStyles = [
    { bg: '#fdf2f8', border: '#f472b6', headerBg: '#fce7f3', text: '#be185d', icon: '📖' },
    { bg: '#eff6ff', border: '#60a5fa', headerBg: '#dbeafe', text: '#1d4ed8', icon: '🔤' },
    { bg: '#fefce8', border: '#facc15', headerBg: '#fef08a', text: '#a16207', icon: '🧮' },
    { bg: '#faf5ff', border: '#c084fc', headerBg: '#f3e8ff', text: '#7e22ce', icon: '🎨' },
    { bg: '#ecfdf5', border: '#34d399', headerBg: '#d1fae5', text: '#047857', icon: '🕌' },
    { bg: '#fff7ed', border: '#fb923c', headerBg: '#ffedd5', text: '#c2410c', icon: '💡' },
    { bg: '#ecfeff', border: '#22d3ee', headerBg: '#cffafe', text: '#0e7490', icon: '💻' },
    { bg: '#fef2f2', border: '#f87171', headerBg: '#fee2e2', text: '#b91c1c', icon: '⭐' },
  ]

  return (
    <div
      className="result-print result-card-exact print-card relative overflow-hidden bg-white text-[12px] leading-[1.3] text-[#06154b] sm:text-[13px] flex flex-col justify-between"
      style={{
        width: '100%',
        maxWidth: '920px',
        minHeight: '1301px',
        margin: '0 auto',
        border: '3px solid #38bdf8',
        borderRadius: '24px',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
      }}
    >
      {/* Whimsical Header Bunting Flags Background */}
      <svg
        className="absolute top-0 left-0 w-full h-[55px] pointer-events-none select-none z-0 opacity-80"
        viewBox="0 0 920 55"
        fill="none"
        preserveAspectRatio="none"
      >
        <path d="M0,0 L0,25 L40,0 L80,25 L120,0 L160,25 L200,0 L240,25 L280,0 L320,25 L360,0 L400,25 L440,0 L480,25 L520,0 L560,25 L600,0 L640,25 L680,0 L720,25 L760,0 L800,25 L840,0 L880,25 L920,0 L920,0 Z" fill="#bae6fd" opacity="0.3" />
        <circle cx="120" cy="15" r="4" fill="#f43f5e" />
        <circle cx="280" cy="18" r="5" fill="#eab308" />
        <circle cx="450" cy="12" r="4" fill="#10b981" />
        <circle cx="620" cy="16" r="5" fill="#8b5cf6" />
        <circle cx="780" cy="14" r="4" fill="#06b6d4" />
      </svg>

      {/* Main Content */}
      <div className="relative z-10 px-3.5 pt-3.5 pb-2 sm:px-6 sm:pt-4 flex-1 flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="grid grid-cols-[100px_minmax(0,1fr)_100px] sm:grid-cols-[135px_minmax(0,1fr)_135px] items-center gap-2 sm:gap-4">
            {/* Left: Crest */}
            <div className="flex items-center justify-start">
              <div className="w-[88px] h-[88px] sm:w-[115px] sm:h-[115px] rounded-full p-1 flex items-center justify-center">
                <img
                  src={schoolLogo}
                  alt="Star Public School Crest Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Center: School Info */}
            <div className="text-center min-w-0">
              <h1
                className="text-[20px] sm:text-[36px] font-black uppercase tracking-[0.02em] text-[#082b66] leading-tight"
                style={{ fontFamily: "'Baskerville Old Face', 'Book Antiqua', 'Georgia', serif" }}
              >
                {SCHOOL_NAME}
              </h1>
              <p className="mt-0.5 text-[10px] sm:text-[13px] font-bold text-[#082b66]">
                {SCHOOL_ADDRESS}
              </p>

              {/* Exam Title in Magenta Pill */}
              <div className="mt-2 sm:mt-2.5">
                <span
                  className="inline-block px-6 py-1 rounded-full text-white bg-[#db2777] font-black text-[11px] sm:text-[14px] tracking-wide uppercase shadow-sm"
                >
                  {formatTerminalExamTitle(data.terminal)}
                </span>
              </div>

              {/* Academic Year */}
              <p className="mt-1 text-[10.5px] sm:text-[12.5px] font-bold text-[#082b66]">
                {sessionDisplay.label} : {sessionDisplay.text}
              </p>

              {/* Celebratory Ribbon: REPORT CARD */}
              <div className="mt-1 flex items-center justify-center">
                <div className="relative inline-block bg-[#fde047] border-2 border-[#eab308] text-[#854d0e] font-black px-8 py-0.5 rounded-md text-[11px] sm:text-[13px] tracking-wider uppercase shadow-xs">
                  REPORT CARD
                </div>
              </div>
            </div>

            {/* Right: Student Photo */}
            <div className="flex items-center justify-end">
              <div className="w-[88px] h-[112px] sm:w-[110px] sm:h-[135px] rounded-2xl border-2 border-[#38bdf8] bg-[#f0f9ff] flex flex-col items-center justify-center overflow-hidden shadow-2xs">
                {studentPhotoUrl ? (
                  <img
                    src={studentPhotoUrl}
                    alt={student?.name || 'Student Photo'}
                    className="w-full h-full object-cover"
                  />
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

          {/* Student Information Box with Cute Student Character */}
          <div className="mt-3 rounded-2xl border-2 border-[#38bdf8] bg-white p-2.5 sm:p-3 flex items-center gap-3">
            {/* Cute Cartoon Student Avatar */}
            <div className="hidden sm:flex flex-col items-center justify-center w-[75px] shrink-0">
              <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl shadow-xs">
                🎓
              </div>
            </div>

            {/* Details Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-1.5 md:gap-x-6 text-[12px] sm:text-[14px]">
              {/* Left Column */}
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <div className="flex items-center gap-2 w-[140px] sm:w-[160px] shrink-0 font-bold text-[#082b66]">
                    <span className="w-5 h-5 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-[10px] shrink-0">
                      👤
                    </span>
                    <span>Name of Student</span>
                    <span className="ml-auto mr-1 font-bold">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black truncate">{student?.name || '--'}</span>
                </div>

                <div className="flex items-center">
                  <div className="flex items-center gap-2 w-[140px] sm:w-[160px] shrink-0 font-bold text-[#082b66]">
                    <span className="w-5 h-5 rounded-full bg-[#ec4899] text-white flex items-center justify-center text-[10px] shrink-0">
                      👩
                    </span>
                    <span>Mother's Name</span>
                    <span className="ml-auto mr-1 font-bold">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black truncate">{student?.mother_name || '--'}</span>
                </div>

                <div className="flex items-center">
                  <div className="flex items-center gap-2 w-[140px] sm:w-[160px] shrink-0 font-bold text-[#082b66]">
                    <span className="w-5 h-5 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-[10px] shrink-0">
                      👨
                    </span>
                    <span>Father's Name</span>
                    <span className="ml-auto mr-1 font-bold">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black truncate">{student?.father_name || '--'}</span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <div className="flex items-center gap-2 w-[115px] sm:w-[135px] shrink-0 font-bold text-[#082b66]">
                    <span className="w-5 h-5 rounded-full bg-[#f97316] text-white flex items-center justify-center text-[10px] shrink-0">
                      🪪
                    </span>
                    <span>Roll No.</span>
                    <span className="ml-auto mr-1 font-bold">:</span>
                  </div>
                  <span className="font-extrabold text-black">{studentRollLabel}</span>
                </div>

                <div className="flex items-center">
                  <div className="flex items-center gap-2 w-[115px] sm:w-[135px] shrink-0 font-bold text-[#082b66]">
                    <span className="w-5 h-5 rounded-full bg-[#10b981] text-white flex items-center justify-center text-[10px] shrink-0">
                      🏫
                    </span>
                    <span>Class</span>
                    <span className="ml-auto mr-1 font-bold">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black">{student?.class ?? params.classValue ?? '--'}</span>
                </div>

                <div className="flex items-center">
                  <div className="flex items-center gap-2 w-[115px] sm:w-[135px] shrink-0 font-bold text-[#082b66]">
                    <span className="w-5 h-5 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center text-[10px] shrink-0">
                      👥
                    </span>
                    <span>Section</span>
                    <span className="ml-auto mr-1 font-bold">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black">{student?.section ?? params.section ?? '--'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ACADEMIC PERFORMANCE (Subject Cards Grid) */}
          <div className="mt-3">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#4338ca] text-white text-[11px] sm:text-[13px] font-bold rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">📖</span>
                <span className="font-black uppercase tracking-wider text-white">ACADEMIC PERFORMANCE</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-5 text-[10px] sm:text-[12px] font-bold">
                <span className="bg-white/20 px-2 py-0.5 rounded">Subjects : <strong className="text-amber-300 font-black">{processedMarks.length}</strong></span>
                <span className="bg-white/20 px-2 py-0.5 rounded">Pass : <strong className="text-amber-300 font-black">30</strong></span>
                <span className="bg-white/20 px-2 py-0.5 rounded">Drawing Pass : <strong className="text-amber-300 font-black">15</strong></span>
              </div>
            </div>

            {/* 8 Cards Grid */}
            <div className="border border-t-0 border-[#c7d2fe] p-2.5 bg-slate-50/60 rounded-b-xl grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {processedMarks.slice(0, 7).map((m, idx) => {
                const style = subjectCardStyles[idx % subjectCardStyles.length]
                return (
                  <div
                    key={m.key}
                    className="rounded-xl border p-2 flex flex-col justify-between shadow-2xs transition-all bg-white"
                    style={{ borderColor: style.border }}
                  >
                    {/* Card Header */}
                    <div
                      className="rounded-lg px-2 py-1 flex items-center justify-center gap-1.5 font-black text-[11px] sm:text-[12px] uppercase tracking-wide truncate"
                      style={{ backgroundColor: style.headerBg, color: style.text }}
                    >
                      <span>{style.icon}</span>
                      <span className="truncate">{m.subjectName}</span>
                    </div>

                    {/* Marks Info */}
                    <div className="my-2 grid grid-cols-3 text-center gap-1 text-[10px] sm:text-[11px]">
                      <div>
                        <p className="text-[#64748b] text-[8.5px] font-bold uppercase">Full</p>
                        <p className="font-black text-[#0f172a]">{m.fullMarks}</p>
                      </div>
                      <div>
                        <p className="text-[#64748b] text-[8.5px] font-bold uppercase">Pass</p>
                        <p className="font-black text-[#0f172a]">{m.passMarks}</p>
                      </div>
                      <div>
                        <p className="text-[#64748b] text-[8.5px] font-bold uppercase">Obtained</p>
                        <p className="font-black text-[#1e40af] text-[12px] sm:text-[13px]">{m.obtainedDisplay}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="text-center pt-1 border-t border-slate-100">
                      {m.status === 'PASS' ? (
                        <span className="inline-block w-full bg-[#86efac] text-[#15803d] font-black py-0.5 rounded-full text-[10.5px]">PASS</span>
                      ) : (
                        <span className="inline-block w-full bg-[#fecaca] text-[#b91c1c] font-black py-0.5 rounded-full text-[10.5px]">{m.status}</span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* 8th Card: "Well Done!" Celebration Card */}
              <div className="rounded-xl border-2 border-dashed border-[#ec4899] bg-gradient-to-br from-[#fdf2f8] to-[#fff1f2] p-2 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-3xl mb-1">🎉</span>
                <p className="font-black text-[#be185d] text-[13px] sm:text-[15px] leading-tight">Well Done!</p>
                <p className="text-[9.5px] text-[#9d174d] font-semibold mt-0.5">Keep shining bright!</p>
              </div>
            </div>
          </div>

          {/* Overall Result & Performance Metric Pills Row */}
          <div className="mt-3 flex flex-wrap md:flex-nowrap items-center gap-2 p-2 rounded-xl border border-[#38bdf8] bg-sky-50/40">
            {/* Overall Result Box */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#38bdf8] rounded-xl shadow-2xs shrink-0">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-[9px] font-black uppercase text-[#64748b]">Overall Result</p>
                <span className="inline-block bg-[#86efac] text-[#15803d] font-black px-3 py-0.5 rounded-full text-[11px]">
                  PASS
                </span>
              </div>
            </div>

            {/* 6 Metrics Grid */}
            <div className="flex-1 grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              <div className="bg-white border border-[#93c5fd] rounded-lg p-1.5 text-center">
                <p className="text-[8px] font-black text-[#0369a1] uppercase truncate">Total</p>
                <p className="text-[13px] sm:text-[15px] font-black text-[#1e40af]">{currentTotalMarksLabel}</p>
              </div>
              <div className="bg-white border border-[#f472b6] rounded-lg p-1.5 text-center">
                <p className="text-[8px] font-black text-[#be185d] uppercase truncate">Obtained</p>
                <p className="text-[13px] sm:text-[15px] font-black text-[#be185d]">{currentObtainedLabel}</p>
              </div>
              <div className="bg-white border border-[#34d399] rounded-lg p-1.5 text-center">
                <p className="text-[8px] font-black text-[#047857] uppercase truncate">Percentage</p>
                <p className="text-[13px] sm:text-[15px] font-black text-[#047857]">{currentPercentageLabel}</p>
              </div>
              <div className="bg-white border border-[#fbbf24] rounded-lg p-1.5 text-center">
                <p className="text-[8px] font-black text-[#b45309] uppercase truncate">Division</p>
                <p className="text-[13px] sm:text-[15px] font-black text-[#1e3a8a]">{currentDivisionLabel}</p>
              </div>
              <div className="bg-white border border-[#818cf8] rounded-lg p-1.5 text-center">
                <p className="text-[8px] font-black text-[#4338ca] uppercase truncate">Rank</p>
                <p className="text-[13px] sm:text-[15px] font-black text-[#4338ca]">{currentRankLabel}</p>
              </div>
              <div className="bg-white border border-[#c084fc] rounded-lg p-1.5 text-center">
                <p className="text-[8px] font-black text-[#7e22ce] uppercase truncate">Date</p>
                <p className="text-[11px] sm:text-[12px] font-black text-[#7e22ce] truncate">{currentPublishedDate}</p>
              </div>
            </div>
          </div>

          {/* Lower 2 Columns */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left Column: Summary Report & Principal Stamp */}
            <div className="space-y-3">
              {/* Summary Report */}
              <div className="overflow-hidden rounded-xl border border-[#93c5fd] bg-white">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#0284c7] text-white text-[11px] font-bold">
                  <span className="font-black uppercase tracking-wider">📊 SUMMARY REPORT</span>
                  <span className="text-[9.5px]">RANK: CLASS + SEC</span>
                </div>
                <table className="w-full border-collapse text-[11px]">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="px-2.5 py-1 font-bold text-slate-700">Total Marks</td>
                      <td className="px-2.5 py-1 text-right font-black text-slate-900">{currentTotalMarksLabel}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-2.5 py-1 font-bold text-slate-700">Marks Obtained</td>
                      <td className="px-2.5 py-1 text-right font-black text-slate-900">{currentObtainedLabel}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-2.5 py-1 font-bold text-slate-700">Percentage</td>
                      <td className="px-2.5 py-1 text-right font-black text-[#15803d]">{currentPercentageLabel}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-2.5 py-1 font-bold text-slate-700">Division</td>
                      <td className="px-2.5 py-1 text-right font-black text-[#15803d]">{currentDivisionLabel}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-2.5 py-1 font-bold text-slate-700">Class & Section Rank</td>
                      <td className="px-2.5 py-1 text-right font-black text-slate-900">{currentRankLabel}</td>
                    </tr>
                    <tr>
                      <td className="px-2.5 py-1 font-bold text-slate-700">Published Date</td>
                      <td className="px-2.5 py-1 text-right font-black text-slate-900">{currentPublishedDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Principal Stamp */}
              <div className="rounded-xl border-2 border-[#38bdf8] bg-white p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={stampcert} alt="Stamp" className="h-16 w-auto object-contain" />
                  <span className="text-[10.5px] font-bold text-[#0369a1]">Official Stamp & Seal</span>
                </div>
                <div className="text-center pr-2">
                  <div className="h-[1.5px] bg-[#0284c7] w-28 mb-1" />
                  <span className="text-[10px] font-black uppercase text-[#0369a1]">Principal Signature</span>
                </div>
              </div>
            </div>

            {/* Right Column: Remarks Card & Instructions */}
            <div className="space-y-3">
              {/* Remarks Card */}
              <div className="rounded-xl border-2 border-[#f472b6] bg-[#fdf2f8] p-3 relative overflow-hidden">
                <div className="flex items-center gap-1.5 text-[#db2777] font-black text-[12px] uppercase">
                  <span>💬</span>
                  <span>Remarks</span>
                </div>
                <div className="mt-2 text-center py-2">
                  <p className="font-serif italic text-[15px] text-[#9d174d] font-bold leading-relaxed">
                    "Good performance! Keep it up and continue your hard work."
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-2 text-lg">
                    <span>⭐</span>
                    <span>🌟</span>
                    <span>⭐</span>
                  </div>
                </div>
              </div>

              {/* Instructions Card */}
              <div className="rounded-xl border-2 border-[#c084fc] bg-[#faf5ff] p-2.5">
                <div className="flex items-center gap-1.5 text-[#7e22ce] font-black text-[11px] uppercase mb-1">
                  <span>📋</span>
                  <span>Instructions</span>
                </div>
                <ol className="list-decimal list-inside space-y-0.5 text-[9.5px] sm:text-[10.5px] text-slate-700">
                  <li>Computer-generated result marksheet for school use.</li>
                  <li>Details based on official school records.</li>
                  <li>Report discrepancy within 7 days of declaration.</li>
                  <li>AB denotes absent, NA denotes not applicable.</li>
                  <li>Pass marks: 30 for regular, 15 for Drawing.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Illustrated Junior Footer Bar */}
      <div className="relative z-10 mt-auto bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#4338ca] text-white text-center py-2.5 px-4 rounded-b-2xl font-black text-[11px] sm:text-[13px] tracking-wider uppercase border-t-2 border-[#38bdf8]">
        {SCHOOL_NAME} | {SCHOOL_ADDRESS}
      </div>
    </div>
  )
}

