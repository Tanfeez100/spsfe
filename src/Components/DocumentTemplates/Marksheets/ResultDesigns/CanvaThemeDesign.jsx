import React from 'react'

export default function CanvaThemeDesign({
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
  currentTheme = {
    primary: '#9a3412',
    title: '#c2410c',
    border: '#ea580c',
    grid: '#fdba74',
    bgTint: '#fff7ed',
    barGrad: 'linear-gradient(90deg, #ea580c 0%, #f97316 48%, #ea580c 100%)',
    pillBg: '#fff7ed',
    pillBorder: '#ea580c',
    pillText: '#c2410c',
  },
}) {
  return (
    <div
      className="result-print result-card-exact print-card relative overflow-hidden bg-white text-[12px] leading-[1.3] text-[#06154b] sm:text-[13px] flex flex-col justify-between"
      style={{
        width: '100%',
        maxWidth: '920px',
        minHeight: '1301px',
        margin: '0 auto',
        border: `3px double ${currentTheme.border}`,
        borderRadius: '20px',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
      }}
    >
      {/* Decorative Outer Border Box */}
      <div className="relative z-10 px-3.5 pt-3.5 pb-2 sm:px-6 sm:pt-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="grid grid-cols-[100px_minmax(0,1fr)_100px] sm:grid-cols-[135px_minmax(0,1fr)_135px] items-center gap-2 sm:gap-4">
            <div className="flex items-center justify-start">
              <div className="w-[88px] h-[88px] sm:w-[115px] sm:h-[115px] rounded-full p-1 flex items-center justify-center">
                <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="text-center min-w-0">
              <h1
                className="text-[20px] sm:text-[36px] font-black uppercase tracking-[0.02em] leading-tight"
                style={{ fontFamily: "'Baskerville Old Face', 'Georgia', serif", color: currentTheme.title }}
              >
                {SCHOOL_NAME}
              </h1>
              <p className="mt-0.5 text-[10px] sm:text-[13px] font-bold" style={{ color: currentTheme.primary }}>
                {SCHOOL_ADDRESS}
              </p>

              <div className="mt-2 sm:mt-2.5">
                <span
                  className="inline-block px-6 py-1 rounded-full text-white font-black text-[11px] sm:text-[14px] tracking-wide uppercase shadow-sm"
                  style={{ background: currentTheme.barGrad }}
                >
                  {formatTerminalExamTitle(data.terminal)}
                </span>
              </div>

              <p className="mt-1 text-[10.5px] sm:text-[12.5px] font-bold" style={{ color: currentTheme.primary }}>
                {sessionDisplay.label} : {sessionDisplay.text}
              </p>

              <div className="mt-1.5 flex items-center justify-center gap-2 sm:gap-3">
                <span className="h-[1.5px] w-10 sm:w-16" style={{ backgroundColor: currentTheme.border }} />
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-0.5 text-[9.5px] sm:text-[11.5px] font-extrabold uppercase tracking-[0.08em] shadow-2xs"
                  style={{ borderColor: currentTheme.pillBorder, backgroundColor: currentTheme.pillBg, color: currentTheme.pillText }}
                >
                  <span>◆</span>
                  REPORT CARD
                  <span>◆</span>
                </span>
                <span className="h-[1.5px] w-10 sm:w-16" style={{ backgroundColor: currentTheme.border }} />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div
                className="w-[88px] h-[112px] sm:w-[110px] sm:h-[135px] rounded-2xl border-2 flex flex-col items-center justify-center overflow-hidden shadow-2xs"
                style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.bgTint }}
              >
                {studentPhotoUrl ? (
                  <img src={studentPhotoUrl} alt={student?.name || 'Student Photo'} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center" style={{ color: currentTheme.primary }}>
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 fill-current mb-0.5" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    <span className="text-[10px] font-black tracking-widest uppercase">PHOTO</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student Details */}
          <div className="mt-3 rounded-xl border-2 bg-white p-2.5 sm:p-3.5" style={{ borderColor: currentTheme.border }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 md:gap-x-6 text-[12px] sm:text-[14px]">
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <div className="flex items-center gap-1.5 w-[140px] sm:w-[160px] shrink-0 font-black" style={{ color: currentTheme.primary }}>
                    <span>Name of Student</span>
                    <span className="ml-auto mr-1">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black truncate">{student?.name || '--'}</span>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center gap-1.5 w-[140px] sm:w-[160px] shrink-0 font-black" style={{ color: currentTheme.primary }}>
                    <span>Mother's Name</span>
                    <span className="ml-auto mr-1">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black truncate">{student?.mother_name || '--'}</span>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center gap-1.5 w-[140px] sm:w-[160px] shrink-0 font-black" style={{ color: currentTheme.primary }}>
                    <span>Father's Name</span>
                    <span className="ml-auto mr-1">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black truncate">{student?.father_name || '--'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center">
                  <div className="flex items-center gap-1.5 w-[115px] sm:w-[135px] shrink-0 font-black" style={{ color: currentTheme.primary }}>
                    <span>Roll No.</span>
                    <span className="ml-auto mr-1">:</span>
                  </div>
                  <span className="font-extrabold text-black">{studentRollLabel}</span>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center gap-1.5 w-[115px] sm:w-[135px] shrink-0 font-black" style={{ color: currentTheme.primary }}>
                    <span>Class</span>
                    <span className="ml-auto mr-1">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black">{student?.class ?? params.classValue ?? '--'}</span>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center gap-1.5 w-[115px] sm:w-[135px] shrink-0 font-black" style={{ color: currentTheme.primary }}>
                    <span>Section</span>
                    <span className="ml-auto mr-1">:</span>
                  </div>
                  <span className="font-extrabold uppercase text-black">{student?.section ?? params.section ?? '--'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scholastic Areas */}
          <div className="mt-3 overflow-hidden rounded-xl border bg-white" style={{ borderColor: currentTheme.border }}>
            <div
              className="flex items-center justify-between px-3 py-2 text-white text-[11px] sm:text-[13px] font-bold"
              style={{ background: currentTheme.barGrad }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">📖</span>
                <span className="font-black uppercase tracking-wider text-white">SCHOLASTIC AREAS</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-5 text-[10px] sm:text-[12px] font-bold">
                <span>SUBJECTS : <strong className="text-amber-200 font-black">{processedMarks.length}</strong></span>
                <span>PASS : <strong className="text-amber-200 font-black">30</strong></span>
                <span>DRAWING PASS : <strong className="text-amber-200 font-black">15</strong></span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-[11px] sm:text-[14px]">
                <thead>
                  <tr style={{ backgroundColor: currentTheme.bgTint, color: currentTheme.primary }}>
                    <th className="text-left px-3 py-2 border font-black uppercase" style={{ borderColor: currentTheme.grid }}>SUBJECT</th>
                    <th className="text-center px-2 py-2 border font-black uppercase" style={{ borderColor: currentTheme.grid }}>FM</th>
                    <th className="text-center px-2 py-2 border font-black uppercase" style={{ borderColor: currentTheme.grid }}>PASS</th>
                    <th className="text-center px-2 py-2 border font-black uppercase" style={{ borderColor: currentTheme.grid }}>EXT</th>
                    <th className="text-center px-2 py-2 border font-black uppercase" style={{ borderColor: currentTheme.grid }}>INT</th>
                    <th className="text-center px-2 py-2 border font-black uppercase" style={{ borderColor: currentTheme.grid }}>TOTAL</th>
                    <th className="text-center px-2 py-2 border font-black uppercase" style={{ borderColor: currentTheme.grid }}>RESULT</th>
                  </tr>
                </thead>
                <tbody>
                  {processedMarks.map((m) => (
                    <tr key={m.key} className="bg-white">
                      <td className="border px-3 py-1.5 font-bold uppercase text-black" style={{ borderColor: currentTheme.grid }}>{m.subjectName}</td>
                      <td className="border px-2 py-1.5 text-center font-bold text-black" style={{ borderColor: currentTheme.grid }}>{m.fullMarks}</td>
                      <td className="border px-2 py-1.5 text-center font-bold text-black" style={{ borderColor: currentTheme.grid }}>{m.passMarks}</td>
                      <td className="border px-2 py-1.5 text-center font-bold text-black" style={{ borderColor: currentTheme.grid }}>{m.externalDisplay}</td>
                      <td className="border px-2 py-1.5 text-center font-bold text-black" style={{ borderColor: currentTheme.grid }}>{m.internalDisplay}</td>
                      <td className="border px-2 py-1.5 text-center font-black text-[13px] sm:text-[15px]" style={{ borderColor: currentTheme.grid, color: currentTheme.primary }}>{m.obtainedDisplay}</td>
                      <td className="border px-2 py-1.5 text-center" style={{ borderColor: currentTheme.grid }}>
                        {m.status === 'PASS' ? (
                          <span className="inline-block bg-[#86efac] text-[#15803d] font-black px-4 py-0.5 rounded-full text-[11px]">PASS</span>
                        ) : (
                          <span className="inline-block bg-[#fecaca] text-[#b91c1c] font-black px-4 py-0.5 rounded-full text-[11px]">{m.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6 Metric Cards */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {[
              ['TOTAL MARKS', currentTotalMarksLabel, '🏆'],
              ['MARKS OBTAINED', currentObtainedLabel, '📊'],
              ['PERCENTAGE', currentPercentageLabel, '📈'],
              ['DIVISION', currentDivisionLabel, '🎖️'],
              ['RANK', currentRankLabel, '🏅'],
              ['PUBLISHED DATE', currentPublishedDate, '📅'],
            ].map(([lbl, val, ico]) => (
              <div
                key={lbl}
                className="rounded-xl border p-2 flex items-center gap-2 shadow-2xs"
                style={{ borderColor: currentTheme.grid, backgroundColor: currentTheme.bgTint }}
              >
                <span className="text-xl">{ico}</span>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-wider truncate" style={{ color: currentTheme.primary }}>{lbl}</p>
                  <p className="text-[14px] sm:text-[18px] font-black leading-tight" style={{ color: currentTheme.title }}>{val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Report */}
          {summaryReportTerminals.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-xl border bg-white" style={{ borderColor: currentTheme.border }}>
              <div className="flex items-center justify-between px-3 py-2 text-white text-[11px] font-bold" style={{ background: currentTheme.barGrad }}>
                <span className="font-black uppercase tracking-wider text-white">SUMMARY REPORT</span>
                <span className="text-[10px] text-white">RANK SCOPE : CLASS + SECTION</span>
              </div>
              <table className="w-full min-w-[550px] border-collapse text-[11px]">
                <thead>
                  <tr style={{ backgroundColor: currentTheme.bgTint, color: currentTheme.primary }}>
                    <th className="text-left px-3 py-1.5 border font-black uppercase" style={{ borderColor: currentTheme.grid }}>METRIC</th>
                    {summaryReportTerminals.map((term) => (
                      <th key={term} className="text-center px-3 py-1.5 border font-black uppercase" style={{ borderColor: currentTheme.grid }}>
                        {term.toUpperCase()} TERM
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="border px-3 py-1 font-bold text-black" style={{ borderColor: currentTheme.grid }}>TOTAL MARKS</td>
                    {summaryReportTerminals.map((t) => (
                      <td key={t} className="border px-3 py-1 text-center font-bold text-black" style={{ borderColor: currentTheme.grid }}>{toDisplayValue(termSummaries[t]?.total_max_marks)}</td>
                    ))}
                  </tr>
                  <tr className="bg-white">
                    <td className="border px-3 py-1 font-bold text-black" style={{ borderColor: currentTheme.grid }}>MARKS OBTAINED</td>
                    {summaryReportTerminals.map((t) => (
                      <td key={t} className="border px-3 py-1 text-center font-bold text-black" style={{ borderColor: currentTheme.grid }}>{toDisplayValue(termSummaries[t]?.total_obtained)}</td>
                    ))}
                  </tr>
                  <tr className="bg-white">
                    <td className="border px-3 py-1 font-bold text-black" style={{ borderColor: currentTheme.grid }}>PERCENTAGE</td>
                    {summaryReportTerminals.map((t) => (
                      <td key={t} className="border px-3 py-1 text-center font-black text-[#15803d]" style={{ borderColor: currentTheme.grid }}>{toDisplayValue(termSummaries[t]?.percentage)}%</td>
                    ))}
                  </tr>
                  <tr className="bg-white">
                    <td className="border px-3 py-1 font-bold text-black" style={{ borderColor: currentTheme.grid }}>DIVISION</td>
                    {summaryReportTerminals.map((t) => (
                      <td key={t} className="border px-3 py-1 text-center font-black text-[#15803d]" style={{ borderColor: currentTheme.grid }}>{toDisplayValue(termSummaries[t]?.division)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom 2 Boxes */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-3">
            <div className="rounded-xl border bg-white p-3" style={{ borderColor: currentTheme.border }}>
              <p className="font-black text-[12px] uppercase tracking-wider mb-1" style={{ color: currentTheme.primary }}>INSTRUCTIONS</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[10px] text-slate-700">
                <li>Computer-generated result marksheet for official school use.</li>
                <li>Details shown here are based on official school records.</li>
                <li>Report discrepancy within 7 days of declaration.</li>
                <li>AB denotes absent, NA denotes not applicable.</li>
                <li>Pass Marks: 30 for regular subjects, 15 for Drawing.</li>
              </ol>
            </div>

            <div className="rounded-xl border bg-white p-2 text-center" style={{ borderColor: currentTheme.border }}>
              <p className="font-black text-[11px] uppercase tracking-wider mb-1" style={{ color: currentTheme.primary }}>PRINCIPAL SIGN & STAMP</p>
              <img src={stampcert} alt="Stamp" className="h-16 w-auto object-contain mx-auto" />
              <div className="h-[1.5px] w-28 mx-auto mt-1 mb-0.5" style={{ backgroundColor: currentTheme.border }} />
              <p className="text-[10px] font-bold" style={{ color: currentTheme.primary }}>Principal Signature</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div
        className="relative z-10 mt-auto text-white text-center py-2.5 px-4 rounded-b-2xl font-black text-[11px] sm:text-[13px] tracking-wider uppercase"
        style={{ background: currentTheme.barGrad }}
      >
        {SCHOOL_NAME} | {SCHOOL_ADDRESS}
      </div>
    </div>
  )
}

