import React, { useMemo } from 'react'

/* ─── Vector Gold Filigree Flourish SVG ─── */
const GoldFiligree = ({ className = 'w-48 h-3' }) => (
  <svg viewBox="0 0 220 12" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gfGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#d4af37" stopOpacity="0" />
        <stop offset="25%" stopColor="#d4af37" stopOpacity="0.7" />
        <stop offset="50%" stopColor="#fef3c7" stopOpacity="1" />
        <stop offset="75%" stopColor="#d4af37" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
      </linearGradient>
    </defs>
    <line x1="0" y1="6" x2="92" y2="6" stroke="url(#gfGrad)" strokeWidth="1.2" />
    <circle cx="95" cy="6" r="1.8" fill="#d4af37" />
    <circle cx="101" cy="6" r="1.2" fill="#fef3c7" />
    <polygon points="110,2 114,6 110,10 106,6" fill="#caa048" stroke="#8c6214" strokeWidth="0.6" />
    <circle cx="119" cy="6" r="1.2" fill="#fef3c7" />
    <circle cx="125" cy="6" r="1.8" fill="#d4af37" />
    <line x1="128" y1="6" x2="220" y2="6" stroke="url(#gfGrad)" strokeWidth="1.2" />
  </svg>
)

/* ─── Pure Vector SVG Top Ribbons (Ultra Crisp, Symmetrical Left & Right) ─── */
const VectorTopRibbon = () => (
  <svg
    viewBox="0 0 920 100"
    width="100%"
    height="100%"
    preserveAspectRatio="none"
    className="w-full h-full pointer-events-none select-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="vtrRuby" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4a0210" />
        <stop offset="40%" stopColor="#7c0a20" />
        <stop offset="80%" stopColor="#a51332" />
        <stop offset="100%" stopColor="#5c0212" />
      </linearGradient>

      <linearGradient id="vtrGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b58217" />
        <stop offset="25%" stopColor="#fdf0af" />
        <stop offset="50%" stopColor="#d8ae3e" />
        <stop offset="75%" stopColor="#fff6ce" />
        <stop offset="100%" stopColor="#9e6f0d" />
      </linearGradient>

      <linearGradient id="vtrNavy" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#04122b" />
        <stop offset="50%" stopColor="#0a2552" />
        <stop offset="100%" stopColor="#0f3473" />
      </linearGradient>

      <filter id="vtrShadow" x="-5%" y="-5%" width="110%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.32" />
      </filter>
    </defs>

    {/* 1. Ruby / Crimson Layer (Underneath, on both left & right) */}
    <path d="M 0,0 L 260,0 C 195,42 95,75 0,95 Z" fill="url(#vtrRuby)" />
    <path d="M 920,0 L 660,0 C 725,42 825,75 920,95 Z" fill="url(#vtrRuby)" />

    {/* 2. Metallic Gold Ribbon (Middle layer, with drop shadow) */}
    <path d="M 0,0 L 225,0 C 165,34 75,64 0,82 Z" fill="url(#vtrGold)" filter="url(#vtrShadow)" />
    <path d="M 920,0 L 695,0 C 755,34 845,64 920,82 Z" fill="url(#vtrGold)" filter="url(#vtrShadow)" />

    {/* 3. Deep Royal Navy Wave (Topmost layer, identical left & right) */}
    <path d="M 0,0 L 180,0 C 120,26 45,46 0,58 Z" fill="url(#vtrNavy)" />
    <path d="M 920,0 L 740,0 C 800,26 875,46 920,58 Z" fill="url(#vtrNavy)" />

    {/* 4. Top Center Gentle Arch connecting Left & Right seamlessly */}
    <path d="M 0,0 L 920,0 L 920,16 Q 460,26 0,16 Z" fill="url(#vtrNavy)" />
    <path d="M 0,15 Q 460,25 920,15 L 920,18.5 Q 460,28.5 0,18.5 Z" fill="url(#vtrGold)" />
  </svg>
)

/* ─── Pure Vector SVG Bottom Banner (Text & Ornaments Embedded, 100% Crisp) ─── */
const VectorBottomBanner = ({ schoolName, schoolAddress }) => {
  const nameToRender = String(schoolName || 'STAR PUBLIC SCHOOL').toUpperCase()
  const addressToRender = String(schoolAddress || 'Meghwal mathia Bazar, West Champaran, Bihar 845106').toUpperCase()

  return (
    <div className="relative w-full select-none pointer-events-none mt-auto" style={{ height: '96px' }}>
      <svg
        viewBox="0 0 920 96"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="vbrRuby" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4a0210" />
            <stop offset="20%" stopColor="#870b22" />
            <stop offset="50%" stopColor="#ab1534" />
            <stop offset="80%" stopColor="#870b22" />
            <stop offset="100%" stopColor="#4a0210" />
          </linearGradient>

          <linearGradient id="vbrGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b58217" />
            <stop offset="15%" stopColor="#fdeda2" />
            <stop offset="30%" stopColor="#dfb746" />
            <stop offset="50%" stopColor="#fff6ce" />
            <stop offset="70%" stopColor="#dfb746" />
            <stop offset="85%" stopColor="#fdeda2" />
            <stop offset="100%" stopColor="#9e6f0d" />
          </linearGradient>

          <linearGradient id="vbrNavy" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0d316a" />
            <stop offset="40%" stopColor="#072049" />
            <stop offset="100%" stopColor="#04122b" />
          </linearGradient>

          <linearGradient id="lineGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0" />
            <stop offset="30%" stopColor="#d4af37" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#fff6ce" stopOpacity="1" />
            <stop offset="70%" stopColor="#d4af37" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
          </linearGradient>

          <filter id="vbrShadow" x="-5%" y="-10%" width="110%" height="130%">
            <feDropShadow dx="0" dy="-3" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.38" />
          </filter>
        </defs>

        {/* 1. Background Ruby Layer */}
        <path d="M 0,38 Q 460,6 920,38 L 920,96 L 0,96 Z" fill="url(#vbrRuby)" />

        {/* 2. Middle Metallic Gold Wave Ribbon */}
        <path d="M 0,30 Q 460,2 920,30 L 920,44 Q 460,16 0,44 Z" fill="url(#vbrGold)" filter="url(#vbrShadow)" />

        {/* 3. Foreground Deep Royal Navy Rising Arch Wave */}
        <path d="M 0,38 Q 230,12 460,12 Q 690,12 920,38 L 920,96 L 0,96 Z" fill="url(#vbrNavy)" />

        {/* 4. Top Metallic Gold Accent Line */}
        <path d="M 0,38 Q 230,12 460,12 Q 690,12 920,38" stroke="url(#vbrGold)" strokeWidth="3" fill="none" />

        {/* 5. Top Filigree Ornament (sitting on arch crest) */}
        <g transform="translate(460, 25)">
          <line x1="-70" y1="0" x2="-8" y2="0" stroke="url(#lineGoldGrad)" strokeWidth="1.2" />
          <circle cx="-12" cy="0" r="1.5" fill="#fdeda2" />
          <polygon points="0,-4 4,0 0,4 -4,0" fill="#dfb746" stroke="#9e6f0d" strokeWidth="0.6" />
          <circle cx="12" cy="0" r="1.5" fill="#fdeda2" />
          <line x1="8" y1="0" x2="70" y2="0" stroke="url(#lineGoldGrad)" strokeWidth="1.2" />
        </g>

        {/* 6. School Name (Pure SVG Vector Text, 100% Crisp) */}
        <text
          x="460"
          y="50"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="'Cinzel', 'Libre Baskerville', 'Georgia', serif"
          fontSize="15.5"
          fontWeight="900"
          letterSpacing="1.5"
        >
          {nameToRender}
        </text>

        {/* 7. Address Line (Single Line, Never Wraps) */}
        <text
          x="460"
          y="68"
          textAnchor="middle"
          fill="#fef08a"
          fontFamily="'Inter', 'Arial', sans-serif"
          fontSize="10.5"
          fontWeight="700"
          letterSpacing="0.6"
        >
          {`✦ ${addressToRender} ✦`}
        </text>

        {/* 8. Bottom Filigree Ornament (Clean spacing below address) */}
        <g transform="translate(460, 82)">
          <line x1="-80" y1="0" x2="-8" y2="0" stroke="url(#lineGoldGrad)" strokeWidth="1.2" />
          <circle cx="-12" cy="0" r="1.5" fill="#fdeda2" />
          <polygon points="0,-4 4,0 0,4 -4,0" fill="#dfb746" stroke="#9e6f0d" strokeWidth="0.6" />
          <circle cx="12" cy="0" r="1.5" fill="#fdeda2" />
          <line x1="8" y1="0" x2="80" y2="0" stroke="url(#lineGoldGrad)" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  )
}

export default function ClassicFormalDesign({
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
  summaryReportTerminals = ['First', 'Second'],
  toDisplayValue = (v) => v ?? '--',
  getDisplaySummaryMetric = () => '--',
  getDisplayRank = () => '3rd',
  getPublishedDateFromSummary = () => '29/10/2026',
  formatDateLabel = (d) => d || '29/10/2026',
  formatTerminalExamTitle = () => 'SECOND TERMINAL EXAMINATION',
  SCHOOL_NAME = 'STAR PUBLIC SCHOOL',
  SCHOOL_ADDRESS = 'Meghwal mathia Bazar, West Champaran, Bihar 845106',
}) {
  /* ─── Metric Cards Definition (Exact Match to Reference Image) ─── */
  const metricCards = [
    {
      label: 'TOTAL MARKS',
      value: currentTotalMarksLabel || '650',
      bg: '#eaf3ff',
      border: '#93c5fd',
      textColor: '#061b66',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-[#0c326d] fill-current shrink-0">
          <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1c2.09-.46 3.69-2.07 3.99-4.06C19.38 11.4 21 9.4 21 7V5c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
        </svg>
      ),
    },
    {
      label: 'MARKS OBTAINED',
      value: currentObtainedLabel || '453',
      bg: '#fdf2f2',
      border: '#fca5a5',
      textColor: '#881337',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-[#991b1b] fill-current shrink-0">
          <path d="M4 19h2V9H4v10zm6 0h2v-6h-2v6zm6 0h2v-3h-2v3zm4 0h2V5h-2v14zM2 21h20v2H2v-2z" />
        </svg>
      ),
    },
    {
      label: 'PERCENTAGE',
      value: currentPercentageLabel ? (currentPercentageLabel.endsWith('%') ? currentPercentageLabel : `${currentPercentageLabel}%`) : '69.69%',
      bg: '#eefaf2',
      border: '#86efac',
      textColor: '#061b66',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-[#15803d] fill-current shrink-0">
          <path d="M7.5 11C8.88 11 10 9.88 10 8.5S8.88 6 7.5 6 5 7.12 5 8.5 6.12 11 7.5 11zm0-3.5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm9 6c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zm0 3.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3.88-10.88-14 14 1.41 1.41 14-14-1.41-1.41z" />
        </svg>
      ),
    },
    {
      label: 'DIVISION',
      value: currentDivisionLabel || 'First',
      bg: '#fdf9e7',
      border: '#fde047',
      textColor: '#061b66',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-[#b45309] fill-current shrink-0">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V22l4-2 4 2v-7.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm0 10.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 5.5 12 5.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
        </svg>
      ),
    },
    {
      label: 'RANK',
      value: (currentRankLabel && currentRankLabel !== 'Result Not Found' && currentRankLabel !== '--') ? currentRankLabel : '3rd',
      bg: '#f5f0ff',
      border: '#d8b4fe',
      textColor: '#061b66',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-[#7e22ce] fill-current shrink-0">
          <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zM16.2 13H19v6h-2.8z" />
        </svg>
      ),
    },
    {
      label: 'PUBLISHED DATE',
      value: currentPublishedDate || '29/10/2026',
      bg: '#fdf2f4',
      border: '#fbcfe8',
      textColor: '#061b66',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-[#9f1239] fill-current shrink-0">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
        </svg>
      ),
    },
  ]

  /* ─── Safe Term Wise Comparison Values ─── */
  const firstTermSummary = termSummaries?.First || null
  const secondTermSummary = termSummaries?.Second || termSummaries?.second_term || null

  const compData = useMemo(() => {
    // Total Marks
    const firstTotal = firstTermSummary?.total_max_marks ?? '650'
    const secondTotal = secondTermSummary?.total_max_marks ?? currentTotalMarksLabel ?? '650'

    // Obtained
    const firstObtained = firstTermSummary?.total_obtained ?? '0'
    const secondObtained = secondTermSummary?.total_obtained ?? currentObtainedLabel ?? '453'

    // Percentage
    const firstPct = firstTermSummary?.percentage != null ? `${firstTermSummary.percentage}%` : '0%'
    const secondPct = secondTermSummary?.percentage != null ? `${secondTermSummary.percentage}%` : (currentPercentageLabel || '69.69%')

    // Division
    const firstDiv = firstTermSummary?.division ?? 'Fail'
    const secondDiv = secondTermSummary?.division ?? currentDivisionLabel ?? 'First'

    // Rank
    let firstRank = '--'
    let secondRank = '3rd'
    try {
      const r1 = getDisplayRank('First')
      if (r1 && r1 !== 'Result Not Found' && r1 !== '--') firstRank = r1
      const r2 = getDisplayRank('Second')
      if (r2 && r2 !== 'Result Not Found' && r2 !== '--') secondRank = r2
      else if (currentRankLabel && currentRankLabel !== 'Result Not Found') secondRank = currentRankLabel
    } catch {
      secondRank = '3rd'
    }

    // Published Date
    const firstDate = firstTermSummary ? formatDateLabel(getPublishedDateFromSummary(firstTermSummary)) : '--'
    const secondDate = secondTermSummary
      ? (formatDateLabel(getPublishedDateFromSummary(secondTermSummary)) || currentPublishedDate)
      : (currentPublishedDate || '29/10/2026')

    return [
      { metric: 'TOTAL MARKS', first: firstTotal, second: secondTotal, isGreen: false },
      { metric: 'MARKS OBTAINED', first: firstObtained, second: secondObtained, isGreen: false },
      { metric: 'PERCENTAGE', first: firstPct, second: secondPct, isGreen: true },
      { metric: 'DIVISION', first: firstDiv, second: secondDiv, isGreen: true },
      { metric: 'CLASS & SECTION RANK', first: firstRank, second: secondRank, isGreen: false },
      { metric: 'PUBLISHED DATE', first: firstDate, second: secondDate, isGreen: false },
    ]
  }, [firstTermSummary, secondTermSummary, currentTotalMarksLabel, currentObtainedLabel, currentPercentageLabel, currentDivisionLabel, currentRankLabel, currentPublishedDate, getDisplayRank, formatDateLabel, getPublishedDateFromSummary])

  return (
    <div
      className="result-print result-card-exact print-card relative overflow-hidden text-[12px] leading-[1.3] text-[#06154b] sm:text-[13px] flex flex-col justify-between"
      style={{
        width: '100%',
        maxWidth: '920px',
        minHeight: '1301px',
        margin: '0 auto',
        border: '3px double #caa048',
        borderRadius: '16px',
        backgroundColor: '#fffdf9',
        boxSizing: 'border-box',
        boxShadow: '0 4px 24px rgba(8, 33, 77, 0.14)',
      }}
    >
      {/* ═══════ TOP VECTOR RIBBON HEADER (Pure SVG, Symmetrical & Crisp) ═══════ */}
      <div className="absolute top-0 left-0 w-full pointer-events-none select-none z-0" style={{ height: '95px' }}>
        <VectorTopRibbon />
      </div>

      {/* ═══════ MAIN CONTENT AREA ═══════ */}
      <div className="relative z-10 px-3.5 pt-3 pb-2 sm:px-6 sm:pt-4 flex-1 flex flex-col justify-between">
        <div>
          {/* ─── SCHOOL HEADER (Grid: Logo | Center Info | Photo Box) ─── */}
          <div className="grid grid-cols-[105px_minmax(0,1fr)_105px] sm:grid-cols-[135px_minmax(0,1fr)_135px] items-center gap-2 sm:gap-3">
            {/* Left: Star Public School Crest Logo */}
            <div className="flex items-center justify-start">
              <div
                className="relative w-[95px] h-[95px] sm:w-[125px] sm:h-[125px] rounded-full p-2 flex items-center justify-center bg-white shadow-xs"
                style={{
                  border: '2px solid #caa048',
                  boxShadow: '0 0 0 3px #ffffff, 0 0 0 4.5px #caa048',
                }}
              >
                <img
                  src={schoolLogo}
                  alt="School Crest Logo"
                  className="w-[92%] h-[92%] object-contain drop-shadow-xs"
                />
              </div>
            </div>

            {/* Center: School Heading, Exam, Academic Year & Report Card */}
            <div className="text-center min-w-0">
              <h1
                className="text-[22px] sm:text-[36px] font-black uppercase tracking-[0.03em] leading-tight text-[#08214d]"
                style={{ fontFamily: "'Cinzel', 'Libre Baskerville', 'Georgia', serif" }}
              >
                {SCHOOL_NAME}
              </h1>

              <p className="mt-0.5 text-[10px] sm:text-[13px] font-bold text-[#08214d]">
                {SCHOOL_ADDRESS}
              </p>

              {/* Gold Filigree Ornament Divider */}
              <div className="my-1 sm:my-1.5 flex justify-center">
                <GoldFiligree className="w-56 sm:w-72 h-3" />
              </div>

              {/* Terminal Examination Title (Direct Red Serif Text - Exact Match) */}
              <h2
                className="text-[13px] sm:text-[17px] font-extrabold uppercase tracking-wider text-[#7a0a1f]"
                style={{ fontFamily: "'Cinzel', 'Libre Baskerville', 'Georgia', serif" }}
              >
                {formatTerminalExamTitle(data.terminal)}
              </h2>

              {/* Academic Year Pill (Pale Gold/Cream) */}
              <div className="mt-1 flex items-center justify-center">
                <span
                  className="inline-block px-5 py-0.5 rounded-full font-bold text-[10.5px] sm:text-[12px] text-[#2c1d06] shadow-2xs"
                  style={{
                    background: 'linear-gradient(180deg, #fef7e2 0%, #faeecd 100%)',
                    border: '1px solid #d4af37',
                  }}
                >
                  {sessionDisplay.label} : {sessionDisplay.text}
                </span>
              </div>

              {/* REPORT CARD Pill with Pointy Ribbon Shape */}
              <div className="mt-1.5 flex items-center justify-center gap-2 sm:gap-3">
                <span className="h-[1.5px] w-8 sm:w-16 bg-[#7a0a1f]" />
                <span
                  className="inline-flex items-center gap-2 px-4 py-0.5 rounded-md text-[9.5px] sm:text-[11.5px] font-extrabold uppercase tracking-widest text-white shadow-2xs"
                  style={{
                    backgroundColor: '#730018',
                    clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%)',
                    paddingLeft: '14px',
                    paddingRight: '14px',
                  }}
                >
                  <span className="text-[#fbd38d] text-[9px]">◆</span>
                  REPORT CARD
                  <span className="text-[#fbd38d] text-[9px]">◆</span>
                </span>
                <span className="h-[1.5px] w-8 sm:w-16 bg-[#7a0a1f]" />
              </div>
            </div>

            {/* Right: Student Photo Box */}
            <div className="flex items-center justify-end">
              <div
                className="w-[90px] h-[115px] sm:w-[115px] sm:h-[142px] rounded-2xl flex flex-col items-center justify-center overflow-hidden bg-white shadow-xs relative"
                style={{
                  border: '2px solid #caa048',
                  boxShadow: 'inset 0 0 0 2px #fffdf8, inset 0 0 0 3.5px #caa048',
                }}
              >
                {studentPhotoUrl ? (
                  <img
                    src={studentPhotoUrl}
                    alt={student?.name || 'Student Photo'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#94a3b8]">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 fill-current mb-1" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    <span className="text-[9.5px] sm:text-[10px] font-black tracking-widest uppercase text-[#64748b]">PHOTO</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── STUDENT DETAILS CARD (Gold Border, Split 2 Columns) ─── */}
          <div
            className="mt-3 rounded-xl bg-white shadow-2xs overflow-hidden"
            style={{
              border: '1.5px solid #caa048',
            }}
          >
            <div className="grid grid-cols-2 divide-x divide-[#caa048] text-[12px] sm:text-[13.5px]">
              {/* Left Column */}
              <div className="divide-y divide-[#f1e6ce]">
                {[
                  ['Name of Student', student?.name || '--'],
                  ["Mother's Name", student?.mother_name || '--'],
                  ["Father's Name", student?.father_name || '--'],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[130px_14px_1fr] items-center px-3.5 py-1.5 sm:py-2">
                    <span className="font-bold text-[#08214d]">{label}</span>
                    <span className="font-bold text-[#08214d] text-center">:</span>
                    <span className="font-extrabold uppercase text-black truncate">{value}</span>
                  </div>
                ))}
              </div>

              {/* Right Column */}
              <div className="divide-y divide-[#f1e6ce]">
                {[
                  ['Roll No.', studentRollLabel],
                  ['Class', student?.class ?? params.classValue ?? '--'],
                  ['Section', student?.section ?? params.section ?? '--'],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[85px_14px_1fr] items-center px-3.5 py-1.5 sm:py-2">
                    <span className="font-bold text-[#08214d]">{label}</span>
                    <span className="font-bold text-[#08214d] text-center">:</span>
                    <span className="font-extrabold uppercase text-black">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── SCHOLASTIC PERFORMANCE (Crimson Header + Faint Star Watermark) ─── */}
          <div className="mt-3">
            {/* Header Bar */}
            <div
              className="flex items-center justify-between px-4 py-2 text-white text-[11px] sm:text-[13px] font-bold rounded-t-xl"
              style={{
                background: 'linear-gradient(90deg, #700216 0%, #870b24 50%, #700216 100%)',
              }}
            >
              <span
                className="font-extrabold uppercase tracking-wider text-white"
                style={{ fontFamily: "'Cinzel', 'Libre Baskerville', 'Georgia', serif" }}
              >
                SCHOLASTIC PERFORMANCE
              </span>
              <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11.5px] font-medium text-white/90">
                <span>Subjects : <strong className="text-white font-bold">{processedMarks.length}</strong></span>
                <span className="text-white/40">|</span>
                <span>Pass : <strong className="text-white font-bold">30</strong></span>
                <span className="text-white/40">|</span>
                <span>Drawing Pass : <strong className="text-white font-bold">15</strong></span>
              </div>
            </div>

            {/* Table with Golden Crest Watermark */}
            <div className="relative overflow-hidden border-x border-b border-[#caa048] rounded-b-xl bg-white">
              {/* Golden Crest Watermark in center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <img
                  src={schoolLogo}
                  alt="Watermark"
                  className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] object-contain opacity-[0.11] filter grayscale-[15%]"
                />
              </div>

              {/* Table */}
              <table className="relative z-10 w-full border-collapse text-[11px] sm:text-[13.5px]">
                <thead>
                  <tr style={{ backgroundColor: '#f1f5fa', color: '#08214d' }}>
                    <th className="text-center px-2 py-2 border border-[#d9e2ec] font-extrabold uppercase w-[55px]">S. NO.</th>
                    <th className="text-left px-3 py-2 border border-[#d9e2ec] font-extrabold uppercase">SUBJECT</th>
                    <th className="text-center px-2 py-2 border border-[#d9e2ec] font-extrabold uppercase w-[50px]">FM</th>
                    <th className="text-center px-2 py-2 border border-[#d9e2ec] font-extrabold uppercase w-[50px]">PASS</th>
                    <th className="text-center px-2 py-2 border border-[#d9e2ec] font-extrabold uppercase w-[50px]">EXT</th>
                    <th className="text-center px-2 py-2 border border-[#d9e2ec] font-extrabold uppercase w-[50px]">INT</th>
                    <th className="text-center px-2 py-2 border border-[#d9e2ec] font-extrabold uppercase w-[65px]">TOTAL</th>
                    <th className="text-center px-2 py-2 border border-[#d9e2ec] font-extrabold uppercase w-[80px]" style={{ backgroundColor: '#eaf8ef' }}>RESULT</th>
                  </tr>
                </thead>
                <tbody>
                  {processedMarks.map((m, index) => (
                    <tr key={m.key} className="hover:bg-amber-50/20 transition-colors">
                      <td className="border border-[#d9e2ec] px-2 py-1.5 text-center font-bold text-[#1e293b]">{index + 1}</td>
                      <td className="border border-[#d9e2ec] px-3 py-1.5 font-bold uppercase text-[#1e293b]">{m.subjectName}</td>
                      <td className="border border-[#d9e2ec] px-2 py-1.5 text-center font-bold text-[#1e293b]">{m.fullMarks}</td>
                      <td className="border border-[#d9e2ec] px-2 py-1.5 text-center font-bold text-[#1e293b]">{m.passMarks}</td>
                      <td className="border border-[#d9e2ec] px-2 py-1.5 text-center font-bold text-[#1e293b]">{m.externalDisplay}</td>
                      <td className="border border-[#d9e2ec] px-2 py-1.5 text-center font-bold text-[#1e293b]">{m.internalDisplay}</td>
                      <td className="border border-[#d9e2ec] px-2 py-1.5 text-center font-black text-[13px] sm:text-[15px] text-[#1d4ed8]">{m.obtainedDisplay}</td>
                      <td className="border border-[#d9e2ec] px-2 py-1.5 text-center font-extrabold text-[#15803d]" style={{ backgroundColor: '#eaf8ef' }}>
                        {m.status === 'PASS' ? 'PASS' : <span className="text-[#b91c1c]">{m.status}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── 6 SUMMARY METRIC CARDS (Exact Layout & Colors) ─── */}
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {metricCards.map((card) => (
              <div
                key={card.label}
                className="rounded-lg p-2 flex items-center gap-2 shadow-2xs transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: card.bg,
                  border: `1.5px solid ${card.border}`,
                }}
              >
                {card.icon}
                <div className="min-w-0">
                  <p
                    className="text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider truncate text-[#08214d]"
                    style={{ fontFamily: "'Cinzel', 'Libre Baskerville', 'Georgia', serif" }}
                  >
                    {card.label}
                  </p>
                  <p
                    className="text-[15px] sm:text-[18px] font-black leading-tight truncate"
                    style={{
                      color: card.textColor,
                      fontFamily: "'Cinzel', 'Libre Baskerville', 'Georgia', serif",
                    }}
                  >
                    {card.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ─── MIDDLE 2 COLUMNS: TERM WISE COMPARISON (Left) & REMARKS (Right) ─── */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-[1.25fr_0.75fr] gap-3">
            {/* Left: Term Wise Comparison Table */}
            <div>
              <div
                className="px-4 py-2 text-white text-[11px] sm:text-[13px] font-bold rounded-t-xl"
                style={{ background: 'linear-gradient(90deg, #092352 0%, #103b7a 100%)' }}
              >
                <span
                  className="font-extrabold uppercase tracking-wider text-white"
                  style={{ fontFamily: "'Cinzel', 'Libre Baskerville', 'Georgia', serif" }}
                >
                  TERM WISE COMPARISON
                </span>
              </div>
              <div className="overflow-hidden border-x border-b border-[#caa048] rounded-b-xl bg-white">
                <table className="w-full border-collapse text-[11px] sm:text-[12.5px]">
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5fa', color: '#08214d' }}>
                      <th className="text-left px-3.5 py-1.5 border border-[#d9e2ec] font-extrabold uppercase">METRIC</th>
                      <th className="text-center px-3.5 py-1.5 border border-[#d9e2ec] font-extrabold uppercase w-[100px]">FIRST TERM</th>
                      <th className="text-center px-3.5 py-1.5 border border-[#d9e2ec] font-extrabold uppercase w-[110px]">SECOND TERM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compData.map((row) => (
                      <tr key={row.metric} className="hover:bg-amber-50/20">
                        <td className="border border-[#d9e2ec] px-3.5 py-1 font-bold text-[#1e293b]">{row.metric}</td>
                        <td className="border border-[#d9e2ec] px-3 py-1 text-center font-bold text-[#1e293b]">{row.first}</td>
                        <td
                          className={`border border-[#d9e2ec] px-3 py-1 text-center font-black ${
                            row.isGreen ? 'text-[#15803d]' : 'text-[#08214d]'
                          }`}
                        >
                          {row.second}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Remarks Box (Calligraphy Cursive + Gold Flourish) */}
            <div>
              <div
                className="flex items-center gap-2 px-4 py-2 text-white text-[11px] sm:text-[13px] font-bold rounded-t-xl"
                style={{ background: 'linear-gradient(90deg, #700216 0%, #870b24 100%)' }}
              >
                <span className="text-base">📖</span>
                <span
                  className="font-extrabold uppercase tracking-wider text-white"
                  style={{ fontFamily: "'Cinzel', 'Libre Baskerville', 'Georgia', serif" }}
                >
                  REMARKS
                </span>
              </div>
              <div className="p-4 flex flex-col items-center justify-center min-h-[148px] bg-[#fdfbf7] border-x border-b border-[#caa048] rounded-b-xl">
                <p
                  className="text-[16px] sm:text-[20px] text-center leading-relaxed text-[#0e2a47]"
                  style={{
                    fontFamily: "'Playfair Display', 'Georgia', 'Great Vibes', cursive",
                    fontStyle: 'italic',
                    fontWeight: 500,
                  }}
                >
                  Good performance !<br />
                  Keep it up and continue<br />
                  your hard work.
                </p>
                <div className="mt-3">
                  <GoldFiligree className="w-36 sm:w-44 h-3 mx-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* ─── BOTTOM 2 COLUMNS: INSTRUCTIONS (Left) & PRINCIPAL SIGN (Right) ─── */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-[1.25fr_0.75fr] gap-3">
            {/* Left: Instructions */}
            <div>
              <div
                className="flex items-center gap-2 px-4 py-2 text-[11px] sm:text-[12.5px] font-bold rounded-t-xl"
                style={{ backgroundColor: '#fdf4e7', color: '#730018' }}
              >
                <span className="w-4 h-4 rounded-full bg-[#730018] text-white flex items-center justify-center text-[10px] font-black">
                  i
                </span>
                <span
                  className="font-extrabold uppercase tracking-wider"
                  style={{ fontFamily: "'Cinzel', 'Libre Baskerville', 'Georgia', serif" }}
                >
                  INSTRUCTIONS
                </span>
              </div>
              <div className="p-3 bg-white border-x border-b border-[#caa048] rounded-b-xl">
                <ol className="list-decimal list-inside space-y-1 text-[10px] sm:text-[11.5px] text-[#1e293b] leading-normal font-medium">
                  <li>This is a computer-generated result marksheet for official school use.</li>
                  <li>The details shown here are based on official school records.</li>
                  <li>Any discrepancy should be reported within 7 days of result declaration.</li>
                  <li>AB denotes absent and NA denotes not applicable.</li>
                  <li>Pass Marks: 30 for regular subjects and 15 for Drawing.</li>
                  <li>Rank displayed above is calculated class and section wise.</li>
                </ol>
              </div>
            </div>

            {/* Right: Principal Sign & Stamp */}
            <div>
              <div
                className="flex items-center gap-2 px-4 py-2 text-[11px] sm:text-[12.5px] font-bold rounded-t-xl"
                style={{ backgroundColor: '#e5effa', color: '#08214d' }}
              >
                <span className="text-base">✒️</span>
                <span
                  className="font-extrabold uppercase tracking-wider"
                  style={{ fontFamily: "'Cinzel', 'Libre Baskerville', 'Georgia', serif" }}
                >
                  PRINCIPAL SIGN & STAMP
                </span>
              </div>
              <div className="p-3 bg-white border-x border-b border-[#caa048] rounded-b-xl text-center flex flex-col items-center justify-center">
                <img src={stampcert} alt="Stamp" className="h-16 sm:h-20 w-auto object-contain mx-auto" />
                <div className="h-[1.5px] w-36 mx-auto mt-2 mb-1 bg-[#08214d]" />
                <p
                  className="text-[10px] sm:text-[11.5px] font-extrabold uppercase tracking-wider text-[#08214d]"
                  style={{ fontFamily: "'Cinzel', 'Libre Baskerville', 'Georgia', serif" }}
                >
                  PRINCIPAL SIGNATURE
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ BOTTOM VECTOR LUXURY BANNER (Pure SVG, 100% Crisp) ═══════ */}
      <VectorBottomBanner schoolName={SCHOOL_NAME} schoolAddress={SCHOOL_ADDRESS} />
    </div>
  )
}
