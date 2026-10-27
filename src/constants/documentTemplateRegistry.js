/**
 * Master Registry of Document Templates for School Management System
 * Defines 4 Document Categories with 5 distinct, high-fidelity designs each (Total 20 templates)
 */

export const DOCUMENT_CATEGORIES = [
  {
    id: 'id_card',
    name: 'Student ID Card',
    shortName: 'ID Card',
    description: 'Official student identity cards for security, campus access, and verification.',
    icon: 'badge',
    paperSize: 'CR-80 (54mm × 85.6mm)',
    defaultTemplate: 'id_card_modern_blue',
  },
  {
    id: 'admit_card',
    name: 'Admit Card / Hall Ticket',
    shortName: 'Admit Card',
    description: 'Examination hall entry tickets with candidate details, timetables, and rules.',
    icon: 'assignment_turned_in',
    paperSize: 'A4 Portrait / Half-A4',
    defaultTemplate: 'admit_card_modern_blue',
  },
  {
    id: 'transfer_certificate',
    name: 'Transfer Certificate (TC)',
    shortName: 'Transfer Certificate',
    description: 'Official school leaving certificates verifying student academic tenure and conduct.',
    icon: 'verified',
    paperSize: 'A4 Portrait',
    defaultTemplate: 'tc_traditional_official',
  },
  {
    id: 'marksheet',
    name: 'Marksheet / Report Card',
    shortName: 'Marksheet',
    description: 'Comprehensive academic grade sheets, terminal results, and progress reports.',
    icon: 'analytics',
    paperSize: 'A4 Portrait',
    defaultTemplate: 'marksheet_bihar_board',
  },
]

export const DOCUMENT_TEMPLATES = {
  // ==========================================
  // CATEGORY 1: STUDENT ID CARDS (5 DESIGNS)
  // ==========================================
  id_card: [
    {
      id: 'id_card_modern_blue',
      name: 'Modern Blue',
      badge: 'Official School Arch',
      layout: 'Portrait (CR-80)',
      description: 'Clean professional school identity card with curved navy arch header, golden crest, and crisp QR verification.',
      accent: '#071d3f',
      previewBg: 'from-blue-900 to-indigo-950',
    },
    {
      id: 'id_card_rose_gold',
      name: 'Rose Gold Blossom',
      badge: 'Pink & Olive Curve',
      layout: 'Portrait (CR-80)',
      description: 'Elegant design featuring circular photo cutout with rose pink arc ribbon, olive crest header, and pink bookmark metadata tags.',
      accent: '#f43f5e',
      previewBg: 'from-[#a88a55] via-[#f43f5e] to-[#fff1f2]',
    },
    {
      id: 'id_card_navy_wave',
      name: 'Navy Wave Tech',
      badge: 'Dual Wave & QR',
      layout: 'Portrait (CR-80)',
      description: 'Executive navy header card with golden/sky-blue waves, dedicated side QR box, session badge, and ID number pill.',
      accent: '#0a2540',
      previewBg: 'from-[#0a2540] via-[#1e3a8a] to-[#60a5fa]',
    },
    {
      id: 'id_card_crimson_arch',
      name: 'Crimson Arch Classic',
      badge: 'Govt High Sec Heritage',
      layout: 'Portrait (CR-80)',
      description: 'Distinguished academic card featuring a classic beige arch, crimson class pill, session flag, and golden call button pill.',
      accent: '#7f1d1d',
      previewBg: 'from-[#7f1d1d] via-[#991b1b] to-[#f5ede6]',
    },
  ],

  // ==========================================
  // CATEGORY 2: ADMIT CARDS (5 DESIGNS)
  // ==========================================
  admit_card: [
    {
      id: 'admit_card_modern_blue',
      name: 'Modern Blue Hall Ticket',
      badge: 'Recommended',
      layout: 'A4 Portrait',
      description: 'Contemporary blue-accented hall ticket with candidate photo, full timetable grid, reporting time, and rules.',
      accent: '#0f2b5c',
      previewBg: 'from-blue-950 to-slate-900',
    },
    {
      id: 'admit_card_classic',
      name: 'Classic Examination Card',
      badge: 'Formal Board',
      layout: 'A4 Portrait',
      description: 'Traditional formal examination card with dual borders, center code, subject timetable, and candidate signature.',
      accent: '#1e293b',
      previewBg: 'from-slate-200 to-slate-400',
    },
    {
      id: 'admit_card_formal_govt',
      name: 'Formal Government-Style Layout',
      badge: 'Council Standard',
      layout: 'A4 Portrait',
      description: 'Strict state council layout with registration numbers, official invigilator counter-sign, and verification stamp.',
      accent: '#334155',
      previewBg: 'from-slate-700 to-slate-900',
    },
    {
      id: 'admit_card_minimal_white',
      name: 'Minimal White Examination Card',
      badge: 'Fast Print',
      layout: 'A4 Portrait',
      description: 'Ink-saving crisp white layout with bold subject timetable and high-contrast verification code.',
      accent: '#0f172a',
      previewBg: 'from-slate-50 to-slate-200',
    },
    {
      id: 'admit_card_premium_box',
      name: 'Premium Box-Layout Admit Card',
      badge: 'Modular',
      layout: 'A4 Portrait',
      description: 'Modular card structure segregating candidate profile, center details, exam schedule, and rules cleanly.',
      accent: '#1e3a8a',
      previewBg: 'from-blue-900 to-slate-900',
    },
  ],

  // ==========================================
  // CATEGORY 3: TRANSFER CERTIFICATES (5 DESIGNS)
  // ==========================================
  transfer_certificate: [
    {
      id: 'tc_traditional_official',
      name: 'Traditional Official Certificate',
      badge: 'Official Legal',
      layout: 'A4 Portrait',
      description: 'State education department compliant certificate with 16 standardized clauses, book number, and school seal.',
      accent: '#1e293b',
      previewBg: 'from-amber-100 to-amber-200',
    },
    {
      id: 'tc_modern_formal',
      name: 'Modern Formal Certificate',
      badge: 'Contemporary',
      layout: 'A4 Portrait',
      description: 'Corporate academic leaving certificate with bold navy title bar, golden ribbon divider, and clear tabular record.',
      accent: '#0f2b5c',
      previewBg: 'from-blue-900 to-slate-900',
    },
    {
      id: 'tc_elegant_border',
      name: 'Elegant Border Certificate',
      badge: 'Prestigious',
      layout: 'A4 Portrait',
      description: 'Ornate decorative borders with corner filigree, watermark background, and elegant serif typography.',
      accent: '#b45309',
      previewBg: 'from-amber-200 to-amber-400',
    },
    {
      id: 'tc_minimal_professional',
      name: 'Minimal Professional Certificate',
      badge: 'Clean Modern',
      layout: 'A4 Portrait',
      description: 'Minimalist clean institutional layout with sharp lines, high contrast, and structured verification details.',
      accent: '#0f172a',
      previewBg: 'from-slate-100 to-slate-300',
    },
    {
      id: 'tc_premium_institutional',
      name: 'Premium Institutional Certificate',
      badge: 'Executive Crest',
      layout: 'A4 Portrait',
      description: 'Executive institutional certificate with golden crest header, serial numbering, and dual verification stamps.',
      accent: '#78350f',
      previewBg: 'from-amber-50 to-amber-200',
    },
  ],

  // ==========================================
  // CATEGORY 4: MARKSHEETS (5 DESIGNS)
  // ==========================================
  marksheet: [
    {
      id: 'marksheet_bihar_board',
      name: 'Bihar Board-Inspired Layout',
      badge: 'State Council',
      layout: 'A4 Portrait',
      description: 'State council inspired bilingual mark sheet with theory, practical, total marks, division, and official grade scale.',
      accent: '#0f172a',
      previewBg: 'from-slate-100 to-amber-100',
    },
    {
      id: 'marksheet_modern_academic',
      name: 'Modern Academic Report Card',
      badge: 'Comprehensive',
      layout: 'A4 Portrait',
      description: 'Contemporary report card with visual percentage circle, color-coded grade badges, and behavioral evaluation.',
      accent: '#1e40af',
      previewBg: 'from-blue-900 to-indigo-950',
    },
    {
      id: 'marksheet_classic_table',
      name: 'Classic Table-Based Marksheet',
      badge: 'Academic Standard',
      layout: 'A4 Portrait',
      description: 'Clear tabular layout showing maximum marks, pass marks, obtained theory, practical, total, and remarks.',
      accent: '#1e293b',
      previewBg: 'from-slate-200 to-slate-400',
    },
    {
      id: 'marksheet_premium_blue_white',
      name: 'Premium Blue & White Marksheet',
      badge: 'Executive',
      layout: 'A4 Portrait',
      description: 'Royal blue and crisp white themed report card with student rank badge, attendance percentage, and school seal.',
      accent: '#1e3a8a',
      previewBg: 'from-blue-700 to-blue-900',
    },
    {
      id: 'marksheet_minimal_print',
      name: 'Minimal Print-Friendly Marksheet',
      badge: 'Eco-Print',
      layout: 'A4 Portrait',
      description: 'Zero toner waste monochrome print-optimized report card with crisp borders and clean filing alignment.',
      accent: '#0f172a',
      previewBg: 'from-slate-50 to-slate-200',
    },
  ],
}

// Realistic sample student for full-scale live previews
export const SAMPLE_STUDENT_DATA = {
  id: 'sample-student-001',
  name: 'Aarav Kumar Sharma',
  father_name: 'Rajesh Sharma',
  mother_name: 'Sunita Sharma',
  roll_no: '12',
  class: '10',
  section: 'A',
  academic_year: '2026-2027',
  admission_number: 'SPS-2024-0012',
  admission_date: '10/04/2024',
  date_of_birth: '15/08/2011',
  mobile: '9876543210',
  address: 'Gandhi Chowk, Bettiah, West Champaran, Bihar - 845438',
  pen_number: 'PEN98765432',
  aadhaar_card: 'XXXXXXXX1234',
  blood_group: 'B+',
  photo_url: null,
  status: 'active',
  uses_transport: true,
}

// Realistic sample exam timetable
export const SAMPLE_EXAM_TIMETABLE = [
  { date: '10/03/2027', day: 'Wednesday', time: '09:00 AM – 12:00 PM', code: '101', subject: 'Hindi (First Language)', room: 'Room 102' },
  { date: '12/03/2027', day: 'Friday', time: '09:00 AM – 12:00 PM', code: '102', subject: 'English (Language & Literature)', room: 'Room 102' },
  { date: '15/03/2027', day: 'Monday', time: '09:00 AM – 12:00 PM', code: '103', subject: 'Mathematics (Standard)', room: 'Room 102' },
  { date: '18/03/2027', day: 'Thursday', time: '09:00 AM – 12:00 PM', code: '104', subject: 'Science (Theory & Lab)', room: 'Science Block B' },
  { date: '22/03/2027', day: 'Monday', time: '09:00 AM – 12:00 PM', code: '105', subject: 'Social Science (History/Civics/Geo)', room: 'Room 102' },
  { date: '24/03/2027', day: 'Wednesday', time: '09:00 AM – 11:30 AM', code: '106', subject: 'Computer Applications / IT', room: 'Computer Lab 1' },
]

// Realistic sample marksheet evaluation data
export const SAMPLE_MARKS_DATA = {
  examName: 'Annual Examination 2026-27',
  terminal: 'Annual',
  session: '2026-2027',
  subjects: [
    { subject: 'Hindi', code: 'HIN', maxMarks: 100, passMarks: 33, theory: 72, practical: 18, total: 90, grade: 'A+', result: 'PASS' },
    { subject: 'English', code: 'ENG', maxMarks: 100, passMarks: 33, theory: 68, practical: 17, total: 85, grade: 'A', result: 'PASS' },
    { subject: 'Mathematics', code: 'MATH', maxMarks: 100, passMarks: 33, theory: 76, practical: 19, total: 95, grade: 'A+', result: 'PASS' },
    { subject: 'Science', code: 'SCI', maxMarks: 100, passMarks: 33, theory: 70, practical: 18, total: 88, grade: 'A', result: 'PASS' },
    { subject: 'Social Science', code: 'SST', maxMarks: 100, passMarks: 33, theory: 65, practical: 17, total: 82, grade: 'A', result: 'PASS' },
    { subject: 'Sanskrit / Urdu', code: 'SKT', maxMarks: 100, passMarks: 33, theory: 74, practical: 18, total: 92, grade: 'A+', result: 'PASS' },
  ],
  totalMaxMarks: 600,
  totalObtained: 532,
  percentage: '88.7',
  division: '1st Division',
  rank: 3,
  resultStatus: 'PASSED',
  attendance: '94.2%',
  remarks: 'Outstanding academic performance and exemplary discipline.',
}

// Realistic sample Transfer Certificate data
export const SAMPLE_TC_DATA = {
  tcNo: 'TC/2026/0142',
  bookNo: '04',
  admissionNo: 'SPS-2024-0012',
  pupilName: 'Aarav Kumar Sharma',
  fatherName: 'Rajesh Sharma',
  motherName: 'Sunita Sharma',
  nationality: 'Indian',
  casteCategory: 'General',
  dateOfFirstAdmission: '10/04/2021',
  firstAdmissionClass: 'Class 5',
  dobFigure: '15/08/2013',
  dobWords: 'Fifteenth August Two Thousand Thirteen',
  lastClassAttended: 'Class 8 (Eighth)',
  schoolBoardResult: 'Passed Middle School Assessment',
  whetherFailed: 'No',
  subjectsStudied: 'Hindi, English, Mathematics, Science, Social Science, Sanskrit',
  whetherQualifiedPromotion: 'Yes, Qualified for Higher Class Admission (High School)',
  feesPaidUpto: 'March 2027 (All dues cleared)',
  feeConcession: 'None',
  totalWorkingDays: 228,
  totalPresentDays: 215,
  nccScoutGuide: 'Active Scout Cadet',
  gamesPlayed: 'Inter-School Cricket Team Captain',
  generalConduct: 'Good and Exemplary',
  applicationDate: '26/03/2027',
  issueDate: '28/03/2027',
  leavingReason: 'Completed Secondary Schooling / Higher Studies',
}
