import React from 'react'

export default function ModernRibbonDesign({
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
  return (
    <div
      className="result-print result-card-exact print-card relative overflow-hidden bg-white text-[12px] leading-[1.3] text-[#06154b] sm:text-[13px] flex flex-col justify-between"
      style={{
        width: '100%',
        maxWidth: '920px',
        minHeight: '1301px',
        margin: '0 auto',
        border: '2.5px solid #0284c7',
        borderRadius: '20px',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Corner Waves/Swooshes */}
      <svg
        className="absolute top-0 left-0 w-full h-[76px] sm:h-[90px] pointer-events-none select-none z-0"
        viewBox="0 0 920 90"
        fill="none"
        preserveAspectRatio="none"
      >
        <path d="M0,0 L290,0 C210,45 110,72 0,84 Z" fill="#0284c7" />
        <path d="M0,0 L250,0 C175,38 90,60 0,68 Z" fill="#38bdf8" />
        <path d="M0,0 L195,0 C130,28 65,42 0,48 Z" fill="#fbbf24" />

        <path d="M920,0 L630,0 C710,45 810,72 920,84 Z" fill="#0284c7" />
        <path d="M920,0 L670,0 C745,38 830,60 920,68 Z" fill="#38bdf8" />
        <path d="M920,0 L725,0 C790,28 855,42 920,48 Z" fill="#fbbf24" />
      </svg>

      {/* Bottom Corner Waves/Swooshes */}
      <svg
        className="absolute bottom-[36px] sm:bottom-[40px] left-0 w-full h-[45px] sm:h-[55px] pointer-events-none select-none z-0"
        viewBox="0 0 920 55"
        fill="none"
        preserveAspectRatio="none"
      >
        <path d="M0,55 L280,55 C190,26 100,10 0,0 Z" fill="#0284c7" />
        <path d="M0,55 L230,55 C155,30 80,16 0,8 Z" fill="#38bdf8" />
        <path d="M0,55 L170,55 C110,36 55,24 0,16 Z" fill="#fbbf24" />

        <path d="M920,55 L640,55 C730,26 820,10 920,0 Z" fill="#0284c7" />
        <path d="M920,55 L690,55 C765,30 840,16 920,8 Z" fill="#38bdf8" />
        <path d="M920,55 L750,55 C810,36 865,24 920,16 Z" fill="#fbbf24" />
      </svg>

      {/* Main Content */}
      <div className="relative z-10 px-3.5 pt-3.5 pb-2 sm:px-6 sm:pt-4 flex-1 flex flex-col justify-between">
        {/* Header Row */}
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

            {/* Center: School Titles */}
            <div className="text-center min-w-0">
              <h1
                className="text-[20px] sm:text-[36px] font-black uppercase tracking-[0.02em] text-[#0d2d5e] leading-tight"
                style={{ fontFamily: "'Baskerville Old Face', 'Book Antiqua', 'Palatino Linotype', 'Georgia', serif" }}
              >
                {SCHOOL_NAME}
              </h1>
              <p className="mt-0.5 text-[10px] sm:text-[13px] font-bold text-[#0d2d5e]">
                {SCHOOL_ADDRESS}
              </p>

              {/* Exam Title in Gradient Pill */}
              <div className="mt-2 sm:mt-2.5">
                <span
                  className="inline-block px-5 py-0.5 sm:px-8 sm:py-1 rounded-full text-white font-black text-[11px] sm:text-[14px] tracking-wide uppercase shadow-sm"
                  style={{
                    background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                  }}
                >
                  {formatTerminalExamTitle(data.terminal)}
                </span>
              </div>

              {/* Academic Year */}
              <p className="mt-1 text-[10.5px] sm:text-[12.5px] font-bold text-[#0d2d5e]">
                {sessionDisplay.label} : {sessionDisplay.text}
              </p>

              {/* REPORT CARD Pill */}
              <div className="mt-1.5 flex items-center justify-center gap-2 sm:gap-3">
                <span className="h-[1.5px] w-10 sm:w-16 bg-[#2563eb]" />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f97316] bg-[#fff7ed] px-3.5 py-0.5 text-[9.5px] sm:text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-[#ea580c] shadow-2xs">
                  <span className="text-[#f59e0b] text-xs">★</span>
                  REPORT CARD
                  <span className="text-[#f59e0b] text-xs">★</span>
                </span>
                <span className="h-[1.5px] w-10 sm:w-16 bg-[#2563eb]" />
              </div>
            </div>

            {/* Right: Student Photo */}
            <div className="flex items-center justify-end">
              <div className="w-[88px] h-[112px] sm:w-[110px] sm:h-[135px] rounded-2xl border-2 border-[#bae6fd] bg-[#f8fafc] flex flex-col items-center justify-center overflow-hidden shadow-2xs">
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

          {/* Student Information Box */}
          <div className="mt-3 rounded-xl border-2 border-[#38bdf8] bg-white p-2.5 sm:p-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 md:gap-x-6 text-[12px] sm:text-[14px]">
              {/* Left Column */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center">
                  <div className="flex items-center gap-2 w-[140px] sm:w-[165px] shrink-0 font-bold text-[#0d2d5e]">
                    <span className="w-5 h-5 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-[10px] shrink-0">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    </span>
                    <span>Name of Student</span>
                    <span className="ml-auto mr-1 font-bold">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black truncate">{student?.name || '--'}</span>
                </div>

                <div className="flex items-center">
                  <div className="flex items-center gap-2 w-[140px] sm:w-[165px] shrink-0 font-bold text-[#0d2d5e]">
                    <span className="w-5 h-5 rounded-full bg-[#ec4899] text-white flex items-center justify-center text-[10px] shrink-0">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    </span>
                    <span>Mother's Name</span>
                    <span className="ml-auto mr-1 font-bold">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black truncate">{student?.mother_name || '--'}</span>
                </div>

                <div className="flex items-center">
                  <div className="flex items-center gap-2 w-[140px] sm:w-[165px] shrink-0 font-bold text-[#0d2d5e]">
                    <span className="w-5 h-5 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-[10px] shrink-0">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    </span>
                    <span>Father's Name</span>
                    <span className="ml-auto mr-1 font-bold">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black truncate">{student?.father_name || '--'}</span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center">
                  <div className="flex items-center gap-2 w-[120px] sm:w-[140px] shrink-0 font-bold text-[#0d2d5e]">
                    <span className="w-5 h-5 rounded bg-[#f97316] text-white flex items-center justify-center text-[10px] shrink-0">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-6 2h5v2h-5V6zm0 3h5v2h-5V9zm-8 7h3v-2H6v2zm0-4h3v-2H6v2zm0-4h3V6H6v2zm8 8h5v-2h-5v2z"/></svg>
                    </span>
                    <span>Roll No.</span>
                    <span className="ml-auto mr-1 font-bold">:</span>
                  </div>
                  <span className="font-extrabold text-black">{studentRollLabel}</span>
                </div>

                <div className="flex items-center">
                  <div className="flex items-center gap-2 w-[120px] sm:w-[140px] shrink-0 font-bold text-[#0d2d5e]">
                    <span className="w-5 h-5 rounded-full bg-[#10b981] text-white flex items-center justify-center text-[10px] shrink-0">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
                    </span>
                    <span>Class</span>
                    <span className="ml-auto mr-1 font-bold">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black">{student?.class ?? params.classValue ?? '--'}</span>
                </div>

                <div className="flex items-center">
                  <div className="flex items-center gap-2 w-[120px] sm:w-[140px] shrink-0 font-bold text-[#0d2d5e]">
                    <span className="w-5 h-5 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center text-[10px] shrink-0">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 3s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                    </span>
                    <span>Section</span>
                    <span className="ml-auto mr-1 font-bold">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black">{student?.section ?? params.section ?? '--'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SCHOLASTIC AREAS Section */}
          <div className="mt-3 overflow-hidden rounded-xl border border-[#93c5fd] bg-white">
            <div className="flex items-center justify-between px-3 py-2 bg-[#003780] text-white text-[11px] sm:text-[13px] font-bold">
              <div className="flex items-center gap-2">
                <span className="text-[#fbbf24] text-base">📖</span>
                <span className="font-black uppercase tracking-wider text-white">SCHOLASTIC AREAS</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-5 text-[10px] sm:text-[12px] font-bold">
                <span>SUBJECTS : <strong className="text-[#38bdf8] font-black">{processedMarks.length}</strong></span>
                <span>PASS : <strong className="text-[#facc15] font-black">30</strong></span>
                <span>DRAWING PASS : <strong className="text-[#facc15] font-black">15</strong></span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-[11px] sm:text-[14px]">
                <thead>
                  <tr>
                    <th className="bg-[#e0f2fe] text-[#0369a1] text-left px-3 py-2 border border-[#93c5fd] font-black uppercase">SUBJECT</th>
                    <th className="bg-[#fce7f3] text-[#be185d] text-center px-2 py-2 border border-[#93c5fd] font-black uppercase">FM</th>
                    <th className="bg-[#dcfce7] text-[#15803d] text-center px-2 py-2 border border-[#93c5fd] font-black uppercase">PASS</th>
                    <th className="bg-[#fef3c7] text-[#b45309] text-center px-2 py-2 border border-[#93c5fd] font-black uppercase">EXT</th>
                    <th className="bg-[#f3e8ff] text-[#7e22ce] text-center px-2 py-2 border border-[#93c5fd] font-black uppercase">INT</th>
                    <th className="bg-[#e0f2fe] text-[#1d4ed8] text-center px-2 py-2 border border-[#93c5fd] font-black uppercase">TOTAL</th>
                    <th className="bg-[#ffe4e6] text-[#be123c] text-center px-2 py-2 border border-[#93c5fd] font-black uppercase">RESULT</th>
                  </tr>
                </thead>
                <tbody>
                  {processedMarks.length === 0 ? (
                    <tr><td colSpan={7} className="py-6 text-center text-[#64748b] font-medium">No marks available</td></tr>
                  ) : (
                    processedMarks.map((m) => (
                      <tr key={m.key} className="bg-white hover:bg-slate-50/50">
                        <td className="border border-[#93c5fd] px-3 py-1.5 font-bold uppercase text-black">{m.subjectName}</td>
                        <td className="border border-[#93c5fd] px-2 py-1.5 text-center font-bold text-black">{m.fullMarks}</td>
                        <td className="border border-[#93c5fd] px-2 py-1.5 text-center font-bold text-black">{m.passMarks}</td>
                        <td className="border border-[#93c5fd] px-2 py-1.5 text-center font-bold text-black">{m.externalDisplay}</td>
                        <td className="border border-[#93c5fd] px-2 py-1.5 text-center font-bold text-black">{m.internalDisplay}</td>
                        <td className="border border-[#93c5fd] px-2 py-1.5 text-center font-black text-[#1d4ed8] text-[13px] sm:text-[15px]">{m.obtainedDisplay}</td>
                        <td className="border border-[#93c5fd] px-2 py-1.5 text-center">
                          {m.status === 'PASS' ? (
                            <span className="inline-block bg-[#86efac] text-[#15803d] font-black px-4 py-0.5 rounded-full text-[11px] sm:text-[12px] tracking-wide">PASS</span>
                          ) : m.status === 'FAIL' ? (
                            <span className="inline-block bg-[#fecaca] text-[#b91c1c] font-black px-4 py-0.5 rounded-full text-[11px] sm:text-[12px] tracking-wide">FAIL</span>
                          ) : (
                            <span className="inline-block bg-slate-100 text-slate-700 font-bold px-3 py-0.5 rounded-full text-[11px]">{m.status}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6 Performance Metric Cards */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <div className="rounded-xl border border-[#d8b4fe] bg-[#f5f3ff] p-2 flex items-center gap-2 shadow-2xs">
              <span className="text-xl sm:text-2xl">🏆</span>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#7e22ce] truncate">TOTAL MARKS</p>
                <p className="text-[15px] sm:text-[20px] font-black text-[#581c87] leading-tight">{currentTotalMarksLabel}</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#fbcfe8] bg-[#fdf2f8] p-2 flex items-center gap-2 shadow-2xs">
              <span className="text-xl sm:text-2xl">📊</span>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#be185d] truncate">MARKS OBTAINED</p>
                <p className="text-[15px] sm:text-[20px] font-black text-[#9d174d] leading-tight">{currentObtainedLabel}</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] p-2 flex items-center gap-2 shadow-2xs">
              <span className="text-xl sm:text-2xl">📈</span>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#047857] truncate">PERCENTAGE</p>
                <p className="text-[15px] sm:text-[20px] font-black text-[#047857] leading-tight">{currentPercentageLabel}</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-2 flex items-center gap-2 shadow-2xs">
              <span className="text-xl sm:text-2xl">🎖️</span>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#b45309] truncate">DIVISION</p>
                <p className="text-[15px] sm:text-[20px] font-black text-[#1e3a8a] leading-tight">{currentDivisionLabel}</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#bae6fd] bg-[#f0f9ff] p-2 flex items-center gap-2 shadow-2xs">
              <span className="text-xl sm:text-2xl">🏅</span>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#0369a1] truncate">RANK</p>
                <p className="text-[15px] sm:text-[20px] font-black text-[#075985] leading-tight">{currentRankLabel}</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#e9d5ff] bg-[#faf5ff] p-2 flex items-center gap-2 shadow-2xs">
              <span className="text-xl sm:text-2xl">📅</span>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#6d28d9] truncate">PUBLISHED DATE</p>
                <p className="text-[12px] sm:text-[14px] font-black text-[#4c1d95] leading-tight">{currentPublishedDate}</p>
              </div>
            </div>
          </div>

          {/* SUMMARY REPORT Table */}
          {summaryReportTerminals.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-xl border border-[#93c5fd] bg-white">
              <div
                className="flex items-center justify-between px-3 py-2 text-white text-[11px] sm:text-[13px] font-bold"
                style={{ background: 'linear-gradient(90deg, #f97316 0%, #ec4899 100%)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-white text-base">📄</span>
                  <span className="font-black uppercase tracking-wider text-white">SUMMARY REPORT</span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-black tracking-wider text-white uppercase">
                  RANK SCOPE : CLASS + SECTION
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[550px] border-collapse text-[11px] sm:text-[14px]">
                  <thead>
                    <tr>
                      <th className="bg-[#fed7aa] text-[#9a3412] text-left px-3 py-2 border border-[#93c5fd] font-black uppercase">METRIC</th>
                      {summaryReportTerminals.map((term, idx) => (
                        <th
                          key={term}
                          className={`text-center px-3 py-2 border border-[#93c5fd] font-black uppercase ${
                            idx === 0 ? 'bg-[#bae6fd] text-[#0369a1]' : 'bg-[#fbcfe8] text-[#9d174d]'
                          }`}
                        >
                          {term.toUpperCase()} TERM
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="border border-[#93c5fd] px-3 py-1.5 font-bold uppercase text-black">TOTAL MARKS</td>
                      {summaryReportTerminals.map((term) => (
                        <td key={term} className="border border-[#93c5fd] px-3 py-1.5 text-center font-bold text-black">
                          {toDisplayValue(termSummaries[term]?.total_max_marks)}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-[#93c5fd] px-3 py-1.5 font-bold uppercase text-black">MARKS OBTAINED</td>
                      {summaryReportTerminals.map((term) => (
                        <td key={term} className="border border-[#93c5fd] px-3 py-1.5 text-center font-bold text-black">
                          {toDisplayValue(termSummaries[term]?.total_obtained)}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-[#93c5fd] px-3 py-1.5 font-bold uppercase text-black">PERCENTAGE</td>
                      {summaryReportTerminals.map((term) => {
                        const pct = termSummaries[term]?.percentage
                        const pctLabel = pct !== undefined && pct !== null && pct !== '' ? `${pct}%` : '--'
                        const isPositive = Number(pct) > 0
                        return (
                          <td key={term} className={`border border-[#93c5fd] px-3 py-1.5 text-center font-black ${isPositive ? 'text-[#15803d]' : 'text-black'}`}>
                            {pctLabel}
                          </td>
                        )
                      })}
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-[#93c5fd] px-3 py-1.5 font-bold uppercase text-black">DIVISION</td>
                      {summaryReportTerminals.map((term) => {
                        const div = toDisplayValue(termSummaries[term]?.division)
                        const isPass = div.toLowerCase().includes('first') || div.toLowerCase().includes('second') || div.toLowerCase().includes('third')
                        return (
                          <td key={term} className={`border border-[#93c5fd] px-3 py-1.5 text-center font-black ${isPass ? 'text-[#15803d]' : 'text-slate-600'}`}>
                            {div}
                          </td>
                        )
                      })}
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-[#93c5fd] px-3 py-1.5 font-bold uppercase text-black">CLASS & SECTION RANK</td>
                      {summaryReportTerminals.map((term) => (
                        <td key={term} className="border border-[#93c5fd] px-3 py-1.5 text-center font-bold text-black">
                          {getDisplayRank(term)}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-[#93c5fd] px-3 py-1.5 font-bold uppercase text-black">PUBLISHED DATE</td>
                      {summaryReportTerminals.map((term) => (
                        <td key={term} className="border border-[#93c5fd] px-3 py-1.5 text-center font-bold text-black">
                          {formatDateLabel(getPublishedDateFromSummary(termSummaries[term]))}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bottom 2 Boxes: Instructions & Principal Sign & Stamp */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-3">
            <div className="rounded-xl border-2 border-[#fde047] bg-[#fffef0] overflow-hidden flex flex-col justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#fef08a] border-b border-[#fde047]">
                <span className="text-[#ea580c] text-sm">📄</span>
                <span className="font-black uppercase tracking-wider text-[#0f172a] text-[12px] sm:text-[14px]">INSTRUCTIONS</span>
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

            <div className="rounded-xl border-2 border-[#86efac] bg-white overflow-hidden flex flex-col justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#dcfce7] border-b border-[#86efac]">
                <span className="text-[#15803d] text-sm">✏️</span>
                <span className="font-black uppercase tracking-wider text-[#15803d] text-[12px] sm:text-[14px]">PRINCIPAL SIGN & STAMP</span>
              </div>
              <div className="py-2 flex items-center justify-center">
                <img src={stampcert} alt="Principal Stamp" className="h-20 sm:h-24 w-auto object-contain" />
              </div>
              <div className="pb-2 text-center">
                <div className="h-[2px] bg-[#1e40af] w-3/4 mx-auto mb-1" />
                <span className="text-[11px] sm:text-[12px] font-black uppercase tracking-wider text-[#1e3a8a]">
                  PRINCIPAL SIGNATURE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="relative z-10 mt-auto bg-[#003780] text-white text-center py-2.5 px-4 rounded-b-2xl font-black text-[11px] sm:text-[13px] tracking-wider uppercase">
        {SCHOOL_NAME} | {SCHOOL_ADDRESS}
      </div>
    </div>
  )
}

