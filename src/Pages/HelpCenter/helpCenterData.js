/**
 * SPS Help Center & Comprehensive Module User Guides
 * Complete documentation for every module in Star Public School ERP.
 */

export const HELP_CATEGORIES = [
  { id: 'all', label: 'All Modules' },
  { id: 'overview', label: 'Overview' },
  { id: 'academics', label: 'Academics & Routine' },
  { id: 'students', label: 'Students & Records' },
  { id: 'operations', label: 'Daily Operations' },
  { id: 'finance', label: 'Admin & Finance' },
]

export const MODULE_GUIDES = [
  {
    id: 'dashboard',
    title: 'School Dashboard & Live Overview',
    category: 'overview',
    roles: ['Admin', 'Teacher'],
    route: '/dashboard',
    badge: 'Core Analytics',
    description: 'Central nerve center displaying live enrollment counts, active classrooms, faculty strength, curriculum counts, daily attendance rate, and upcoming school calendar.',
    features: [
      'Real-time student, classroom, faculty, and subject metric cards',
      'Daily, weekly, and monthly student attendance percentage trend graph',
      'Class and Section-wise performance signals with quick student lookup',
      'Dynamic academic calendar highlighting holidays and scheduled exams',
      'Upcoming school events and gazetted holiday notifications',
      'Personal pinned notes widget to keep track of urgent administrative tasks',
      'Quick glance at today’s teaching schedule and instant timetable jump',
    ],
    guides: [
      {
        title: 'How to monitor school attendance from the dashboard',
        steps: [
          'Log in as Admin or Faculty. The Dashboard opens automatically.',
          'Under the "School health" section, locate the "Attendance trend" card.',
          'Toggle between "Daily", "Weekly", or "Monthly" to review attendance percentages.',
          'Hover over any day bar (Mon–Sat) to see exact class presence percentages.',
          'Click "View attendance details →" at the bottom to jump directly to the live attendance register.',
        ],
      },
      {
        title: 'How to filter students by class and section',
        steps: [
          'Locate the "Student performance" card on the dashboard.',
          'Select your target class from the "All classes" dropdown (e.g., Class 1, Class 5).',
          'Choose the desired section (Section A or B).',
          'The list instantly refreshes showing enrolled students, their roll numbers, and active status.',
        ],
      },
      {
        title: 'How to use Pinned Notes for daily tasks',
        steps: [
          'Locate the "Pinned notes" widget on the right sidebar.',
          'Click the "+" button at the top right of the card.',
          'Type your reminder or administrative note (e.g., "Verify bus transport fee reconciliation").',
          'Click "Save". Your note is saved locally and remains visible across sessions.',
          'When finished with a task, hover over the note and click the "×" icon to remove it.',
        ],
      },
    ],
    tips: [
      'The dashboard updates automatically whenever new students or attendance records are submitted.',
      'Teachers see a customized Teacher Dashboard with their GPS Punch-in widget and assigned class metrics.',
    ],
    faqs: [
      {
        q: 'Why does my attendance card show 0 present students?',
        a: 'If no teacher has marked student attendance for today yet, the counter shows 0. Once marked in the Attendance module, it updates instantly.',
      },
      {
        q: 'Can students see the Admin Dashboard?',
        a: 'No. Students have a dedicated student portal where they only see their own attendance, results, and fees.',
      },
    ],
  },

  {
    id: 'timetable',
    title: 'Timetable Management',
    category: 'academics',
    roles: ['Admin', 'Teacher'],
    route: '/timetable',
    badge: 'Class Scheduling',
    description: 'Build, maintain, and publish weekly class schedules (Monday to Saturday) with automated teacher conflict detection, period settings, and proxy substitution management.',
    features: [
      'Period timing configuration: Define custom period durations, zero periods, and lunch breaks',
      'Weekly interactive grid: Manage Monday through Saturday period slots class-wise',
      'Teacher Conflict Detection: Warns immediately if a faculty member is double-booked',
      'Teacher Substitution & Proxy: Assign substitute teachers for absent staff in 1 click',
      'Printable master schedule: Export and print classroom timetable charts',
      'Audit log tracking: Full historical record of schedule alterations',
    ],
    guides: [
      {
        title: 'How to configure period timings and breaks',
        steps: [
          'Navigate to Timetable > "Period Settings" tab.',
          'Set the number of periods per day (default: 8 periods).',
          'Specify start time, period duration (e.g., 40 mins), and lunch break timing.',
          'Click "Save Settings". All class grid slots will automatically adopt these time slots.',
        ],
      },
      {
        title: 'How to assign a subject and teacher to a timetable slot',
        steps: [
          'Navigate to Timetable > "Class Schedule" tab.',
          'Select your Class (e.g., Class 1) and Section (A or B).',
          'Click on any empty period box under the desired weekday (e.g., Tuesday Period 2).',
          'In the Slot Editor popup, select the Subject from the dropdown.',
          'Select the assigned Teacher. The system automatically verifies that the teacher has no other class at this time.',
          'Click "Save Slot". The cell will now display the subject name and teacher badge.',
        ],
      },
      {
        title: 'How to assign a substitute (proxy) teacher',
        steps: [
          'Go to the "Substitutions" tab in Timetable Management.',
          'Click "+ Create Substitution".',
          'Select the date, original absent teacher, class, and slot.',
          'Choose an available substitute teacher from the conflict-free list.',
          'Click "Assign Proxy". Both the teacher and class schedule reflect the change instantly.',
        ],
      },
    ],
    tips: [
      'Always configure your master subjects and teacher profiles before creating the timetable.',
      'Use the "Print Timetable" button at the top right to generate neat classroom door schedules.',
    ],
    faqs: [
      {
        q: 'What happens if two classes assign the same teacher at 10:00 AM?',
        a: 'The system will show a conflict warning badge preventing overlapping slots, ensuring teachers are never assigned to two rooms simultaneously.',
      },
    ],
  },

  {
    id: 'examinationManagement',
    title: 'Examination Management',
    category: 'academics',
    roles: ['Admin', 'Teacher'],
    route: '/examinations',
    badge: 'Exam Life Cycle',
    description: 'Comprehensive examination lifecycle management from creating exam terms (Unit Test, Half Yearly, Annual), scheduling date-sheets, to publishing results and audit logs.',
    features: [
      'Exam Setup: Define academic year, exam term names, grading schemes, and target classes',
      'Date-sheet & Timetable: Set exam dates, time slots, room numbers, and subject syllabus',
      'Marks Entry & Tabulation: Batch entry of theory, practical, and internal assessment marks',
      'Automated Grade & Status: Automatic percentage, grade (A1 to E), and pass/fail calculation',
      'Audit Logging: Secure log of every marks alteration with timestamp and user email',
      'Result Publishing: One-click publishing to student portals and printable report cards',
    ],
    guides: [
      {
        title: 'How to create a new examination cycle',
        steps: [
          'Go to "Examination Management" > "Exam Setup" tab.',
          'Click "+ Create Examination".',
          'Fill in the Exam Name (e.g., "Half-Yearly Examination 2026-27").',
          'Select the Academic Year, Starting Date, and Ending Date.',
          'Select the participating classes (e.g., Nursery to Class 10).',
          'Choose the grading system (CBSE 8-Point or Percentage based) and click "Create Exam".',
        ],
      },
      {
        title: 'How to build the Exam Timetable (Date Sheet)',
        steps: [
          'Switch to the "Exam Timetable" tab.',
          'Select your active examination and choose the class.',
          'Click "+ Add Subject Schedule".',
          'Select the Subject, Exam Date, Start Time, End Time, and Maximum Marks.',
          'Click "Add Schedule". Parents and students can view this date-sheet in their portal.',
        ],
      },
      {
        title: 'How to enter and submit student marks',
        steps: [
          'Navigate to the "Marks Entry" tab.',
          'Select the Examination, Class, and Subject.',
          'The enrolled student roster loads automatically with Roll No and Student Name.',
          'Enter Theory and Practical/Internal marks. Total, percentage, and grade calculate automatically in real time.',
          'Click "Save Marks". The audit log records the entry.',
        ],
      },
    ],
    tips: [
      'Ensure all subjects are properly registered in the Subject module before setting up the date-sheet.',
      'Check the Audit Log tab to see whenever marks were changed and by whom.',
    ],
    faqs: [
      {
        q: 'Can marks exceed the Maximum Marks limit?',
        a: 'No, the form validates inputs in real time and will flag marks higher than the configured maximum.',
      },
    ],
  },

  {
    id: 'uploadMarks',
    title: 'Marks Upload & Fast Grading',
    category: 'academics',
    roles: ['Admin', 'Teacher'],
    route: '/marks-upload',
    badge: 'Rapid Entry',
    description: 'Fast-track spreadsheet and grid entry for periodic class tests, weekly quizzes, and unit assessments without navigating multi-step examination wizards.',
    features: [
      'Quick Class & Subject selector for instant student table loading',
      'Direct in-line score input with keyboard tab navigation',
      'Bulk Excel/CSV upload support for marks sheets',
      'Instant validation against maximum passing marks',
      'Real-time class average and highest score calculation',
    ],
    guides: [
      {
        title: 'How to quickly enter weekly test marks',
        steps: [
          'Go to "Marks Upload" from the sidebar menu.',
          'Select Class (e.g., Class 8) and Subject (e.g., Science).',
          'Enter the Maximum Marks for the test (e.g., 50).',
          'Type the marks directly in the input box for each student. Use the Tab key to jump to the next student quickly.',
          'Click "Submit Marks". The records are stored directly into the academic database.',
        ],
      },
    ],
    tips: [
      'Pressing "Enter" or "Tab" on your keyboard quickly shifts focus to the next student row.',
    ],
    faqs: [
      {
        q: 'Where do these marks appear?',
        a: 'They appear in the student performance logs, result compilation tab, and student portal report views.',
      },
    ],
  },

  {
    id: 'subject',
    title: 'Subject & Syllabus Management',
    category: 'academics',
    roles: ['Admin'],
    route: '/subjects',
    badge: 'Curriculum',
    description: 'Create, organize, and allocate core subjects, languages, electives, and chapter-wise syllabi to classes across the school.',
    features: [
      'Master subject library with standardized codes (e.g., HIN01, MATH01)',
      'Class-wise curriculum allocation (Nursery to Class 10)',
      'Subject categorization: Theory, Practical, Co-scholastic',
      'Syllabus chapter breakdowns with term weightages',
    ],
    guides: [
      {
        title: 'How to add a new subject to the school curriculum',
        steps: [
          'Navigate to "Subject & Syllabus" from the sidebar.',
          'Click "+ Add New Subject".',
          'Enter the Subject Name (e.g., "Computer Science") and Code (e.g., "COMP101").',
          'Select applicable classes for this subject.',
          'Click "Save Subject". It will immediately be available in Timetable, Exam, and Marks modules.',
        ],
      },
    ],
    tips: [
      'Assign clear subject codes to avoid confusion between different language options like Urdu and Sanskrit.',
    ],
    faqs: [
      {
        q: 'Can I delete a subject if exam records already exist for it?',
        a: 'To protect past academic records, the system prevents deleting subjects linked to existing published results.',
      },
    ],
  },

  {
    id: 'student',
    title: 'Student Directory & Admissions',
    category: 'students',
    roles: ['Admin', 'Teacher'],
    route: '/students',
    badge: 'Student Master',
    description: 'Complete centralized registry of all enrolled students, new admission workflows, contact archives, parent details, and class filtering.',
    features: [
      'New Student Admission: Detailed admission form capturing demographic, medical, and parent information',
      'Advanced Search: Search instantly by Name, Roll Number, Admission Number, or Guardian Phone',
      'Class & Section Filters: View student rosters grouped by nursery, primary, or middle school',
      'Student Profile Editor: Update contact details, address, photo, or status (Active / Transferred)',
      'Bulk Data Export: Download filtered student rosters into Excel/CSV spreadsheets',
    ],
    guides: [
      {
        title: 'How to admit a new student',
        steps: [
          'Navigate to "Student Directory" and click "+ Add Student".',
          'Fill in Student Information: Full Name, Date of Birth, Gender, Class, Section, and Roll Number.',
          'Enter Parent / Guardian Details: Father’s Name, Mother’s Name, Primary Mobile Number, and Address.',
          'Upload Student Photograph (optional at admission, can be added later).',
          'Click "Submit Admission". An official admission number is generated automatically.',
        ],
      },
      {
        title: 'How to search and edit student records',
        steps: [
          'In the Student Directory, type the student’s name or roll number into the search box.',
          'Click the "Edit" (pencil) icon next to the student row.',
          'Modify the required fields (e.g., phone number or address change).',
          'Click "Save Changes". The student record updates across all ERP modules immediately.',
        ],
      },
    ],
    tips: [
      'Always ensure the primary mobile number is accurate as it is used for SMS alerts and parent fee receipts.',
    ],
    faqs: [
      {
        q: 'How do I mark a student who left the school?',
        a: 'Edit the student and change their Status from "Active" to "Alumni" or "Transferred". Their historical records remain safely archived.',
      },
    ],
  },

  {
    id: 'classPromotion',
    title: 'Class Promotion & Roll-Over',
    category: 'students',
    roles: ['Admin'],
    route: '/class-promotion',
    badge: 'Annual Transition',
    description: 'Safely promote batches of students to the next higher grade at the start of each new academic year with roll number reassignment.',
    features: [
      'Batch Class-to-Class promotion (e.g., all Class 4 students to Class 5)',
      'Automated or manual roll number allocation for the new session',
      'Retention handling: Retain individual students in the same class if needed',
      'Pre-promotion preview list to verify student status before committing changes',
    ],
    guides: [
      {
        title: 'How to promote a class to the next academic session',
        steps: [
          'Open "Class Promotion" from the sidebar.',
          'Select Current Class (e.g., Class 1) and Target Class (e.g., Class 2).',
          'Review the student checklist. Uncheck any students who are not being promoted.',
          'Select Section and choose Roll Number scheme (keep existing or renumber sequentially).',
          'Click "Preview Promotion", verify the mapping, and click "Confirm Promotion".',
        ],
      },
    ],
    tips: [
      'Always take a backup export from Student Directory before executing annual promotions.',
    ],
    faqs: [
      {
        q: 'Can promotion be undone?',
        a: 'Individual students can always be re-edited from the Student Directory if placed in the wrong section.',
      },
    ],
  },

  {
    id: 'uploadPhoto',
    title: 'Student Photo Management',
    category: 'students',
    roles: ['Admin'],
    route: '/upload-photo',
    badge: 'Media',
    description: 'Upload, crop, and link high-resolution portrait photographs to student profiles for ID cards, admit cards, and transfer certificates.',
    features: [
      'Single and bulk student photo uploader with drag-and-drop',
      'Automatic square/portrait aspect ratio cropping tool',
      'Instant link to Student Roll Number and Admission Number',
      'Image optimization for fast PDF ID card printing',
    ],
    guides: [
      {
        title: 'How to upload student photos',
        steps: [
          'Navigate to "Upload Photos" from the sidebar.',
          'Select the student’s class and section.',
          'Click on the student’s photo placeholder or drop an image file.',
          'Adjust the crop box to frame the student’s face clearly.',
          'Click "Save & Upload". The photo updates on ID Cards, Admit Cards, and Profile views.',
        ],
      },
    ],
    tips: [
      'Use plain white or blue background photos for best results on ID Cards.',
    ],
    faqs: [
      {
        q: 'What image formats are supported?',
        a: 'JPEG, PNG, and WebP images up to 5MB are supported.',
      },
    ],
  },

  {
    id: 'attendance',
    title: 'Student Attendance & GPS Geo-Punch',
    category: 'operations',
    roles: ['Admin', 'Teacher'],
    route: '/attendance',
    badge: 'Daily Register',
    description: 'Fast digital attendance roll-call for classrooms, attendance statistics, monthly attendance registers, and geofenced teacher GPS clock-in.',
    features: [
      'Class Attendance Register: One-click "Mark All Present" with quick toggling for Absent, Late, or Leave',
      'Monthly Register View: Complete 31-day visual attendance sheet with total presence counts',
      'Teacher GPS Punch: High-accuracy campus geofencing validating check-in radius',
      'Instant parent visibility: Attendance status reflects in student portal immediately',
      'School Holiday Calendar: Official holiday schedule marking non-working days',
    ],
    guides: [
      {
        title: 'How to mark daily classroom attendance',
        steps: [
          'Navigate to "Attendance & GPS" > "Daily Register".',
          'Select Date, Class, and Section.',
          'Click "Mark All Present" to quickly set default status for all students.',
          'Tap on any student who is absent to toggle status to "Absent" (Red) or "Leave" (Amber).',
          'Click "Save Attendance". A confirmation alert will verify the records are saved.',
        ],
      },
      {
        title: 'How to view monthly attendance records',
        steps: [
          'Click on the "Monthly Register" tab in Attendance.',
          'Choose the month and target class.',
          'The matrix displays daily presence (P), absence (A), and total percentage for each student.',
          'Click "Export PDF / Print" to download the official monthly sheet.',
        ],
      },
    ],
    tips: [
      'Marking attendance early in the morning ensures parents stay informed and dashboard analytics remain real-time.',
    ],
    faqs: [
      {
        q: 'Can attendance be corrected after saving?',
        a: 'Yes, teachers or admins can re-open any past date, update the status, and click "Save Attendance" again.',
      },
    ],
  },

  {
    id: 'teacherAttendance',
    title: 'Faculty GPS Clock-In & Shifts',
    category: 'operations',
    roles: ['Admin', 'Teacher'],
    route: '/teacher-attendance',
    badge: 'Staff Attendance',
    description: 'Geofenced GPS Punch-in and Punch-out for faculty and staff members, tracking arrival times, departures, and working hours.',
    features: [
      'GPS Location Verification: Validates that the device is physically within school campus boundaries',
      'One-tap Check-In / Check-Out buttons with live time-stamp recording',
      'Daily staff attendance summary report for administration',
      'Late arrival and early departure detection',
    ],
    guides: [
      {
        title: 'How teachers clock-in using GPS',
        steps: [
          'Open SPS on a mobile phone or tablet connected to location services.',
          'Go to "Attendance & GPS" or Teacher Dashboard view.',
          'Allow browser location permissions if prompted.',
          'Verify your distance from campus is within allowed radius (e.g. 150 meters).',
          'Click "Punch In (Check-in)". Your time-stamp and coordinates are logged securely.',
          'At the end of the school day, click "Punch Out (Check-out)".',
        ],
      },
    ],
    tips: [
      'Make sure GPS / High Accuracy location is enabled on your device before clocking in.',
    ],
    faqs: [
      {
        q: 'What if GPS location fails to detect?',
        a: 'Ensure browser location permission is set to "Allow". Refresh the page or connect to school Wi-Fi for improved accuracy.',
      },
    ],
  },

  {
    id: 'teachers',
    title: 'Faculty & Teachers Directory',
    category: 'operations',
    roles: ['Admin'],
    route: '/teachers',
    badge: 'Staff Master',
    description: 'Manage staff profiles, teaching designations, assigned class teachers, subject specializations, and contact records.',
    features: [
      'Faculty profiles with contact numbers, qualification, and joining date',
      'Class Teacher allocation: Assign designated in-charge teachers to classes',
      'Subject specialization tagging for smart timetable scheduling',
      'Staff active status management',
    ],
    guides: [
      {
        title: 'How to register a new teacher',
        steps: [
          'Navigate to "Faculty & Teachers" from the sidebar menu.',
          'Click "+ Add New Teacher".',
          'Enter Full Name, Email, Mobile Number, and Educational Qualifications.',
          'Assign designated Class and Section (if they will be a Class Teacher).',
          'Click "Save Teacher". A teacher login account is created automatically.',
        ],
      },
    ],
    tips: [
      'Assigning a teacher as "Class Teacher" gives them direct attendance and marks privileges for that specific class.',
    ],
    faqs: [
      {
        q: 'Can a teacher teach multiple subjects?',
        a: 'Yes, teachers can be assigned to multiple subjects and classes in the Timetable module.',
      },
    ],
  },

  {
    id: 'fees',
    title: 'Fee Management & Invoicing',
    category: 'finance',
    roles: ['Admin', 'Accountant'],
    route: '/fees',
    badge: 'Accounts',
    description: 'Configure class fee structures, record cash/online fee collections, issue printed receipts, track outstanding dues, and generate defaulter reports.',
    features: [
      'Class Fee Structure: Configure tuition, exam, development, admission, and transport fees',
      'Fee Collection Register: Record student payments via Cash, UPI, Net Banking, or Cheque',
      'Printed Payment Receipts: Instant official fee receipt with school seal and invoice number',
      'Dues & Defaulters Tracker: Real-time report of unpaid fees by class and student',
      'Fee concessions and partial payment installment support',
      'Public Online Fee Payment portal for parents (/pay-fees)',
    ],
    guides: [
      {
        title: 'How to set up annual/monthly class fee structures',
        steps: [
          'Go to "Fee Management" > "Fee Structure" tab.',
          'Select Class (e.g., Class 1) and Academic Session.',
          'Enter amounts for Tuition Fee, Admission Fee, Exam Fee, and Activity charges.',
          'Click "Save Structure". All students in this class will automatically be billed according to this schedule.',
        ],
      },
      {
        title: 'How to collect a fee payment and print a receipt',
        steps: [
          'In Fee Management, go to the "Collect Fees" tab.',
          'Search for the student by Roll Number or Name.',
          'The pending dues breakdown loads automatically.',
          'Enter the Amount Paid and select Payment Mode (Cash / UPI / Card / Cheque).',
          'Add a reference note (e.g. Transaction ID or Cheque No).',
          'Click "Submit Payment & Print Receipt". A professional receipt opens for instant printing or PDF saving.',
        ],
      },
      {
        title: 'How to check the Defaulter List',
        steps: [
          'Navigate to the "Dues & Reports" tab in Fee Management.',
          'Filter by Class or view all pending dues.',
          'The table lists student names, parent phone numbers, total fees, paid amount, and outstanding balance.',
          'Click "Export Defaulter List" to generate an Excel spreadsheet for follow-up reminders.',
        ],
      },
    ],
    tips: [
      'Parents can pay fees online directly via the public payment page (/pay-fees) without needing school login credentials.',
    ],
    faqs: [
      {
        q: 'Can a parent pay in multiple installments?',
        a: 'Yes, the system allows partial payments and tracks remaining balance continuously.',
      },
    ],
  },

  {
    id: 'idCards',
    title: 'ID Cards & Admit Cards Generator',
    category: 'finance',
    roles: ['Admin', 'Teacher'],
    route: '/id-cards',
    badge: 'Card Studio',
    description: 'Design and bulk-print high-quality Student ID Cards and Examination Admit Cards with student photos, QR codes, and school credentials.',
    features: [
      'Batch generation: Generate print-ready cards for an entire class in a single click',
      'Standardized CBSE-compliant layout with school header, logo, photo, and signature',
      'Admit Card mode with embedded examination date-sheet, roll numbers, and examination instructions',
      'High-resolution multi-card A4 print layouts (8 cards per page or single card view)',
      'Direct PDF download or one-touch printer output',
    ],
    guides: [
      {
        title: 'How to generate and print Student ID Cards for a class',
        steps: [
          'Navigate to "ID / Admit Cards" from the sidebar.',
          'Select "Student ID Card" from the card type selector.',
          'Select Class and Section (e.g., Class 1 Section A).',
          'The system renders preview cards for all enrolled students complete with photos and details.',
          'Click "Batch Print (A4)" to format them into an 8-card grid per page, or "Download PDF".',
        ],
      },
      {
        title: 'How to generate Exam Admit Cards (Hall Tickets)',
        steps: [
          'In the card generator, toggle mode to "Exam Admit Card".',
          'Select the Examination Term (e.g., Annual Exam 2026-27) and target Class.',
          'Verify student examination roll numbers and the scheduled subject timetable table.',
          'Click "Print Admit Cards" to produce official hall tickets with candidate signatures.',
        ],
      },
    ],
    tips: [
      'Ensure student photos are uploaded in the "Upload Photos" module before printing ID cards.',
      'Use high-grade cardstock paper (250-300 GSM) or PVC sheets for professional student ID cards.',
    ],
    faqs: [
      {
        q: 'What if a student’s photo is missing on the card?',
        a: 'The card will render a placeholder with the student’s initials until a photo is uploaded in the "Upload Photos" module.',
      },
    ],
  },

  {
    id: 'documentManagement',
    title: 'Document Management & Official Certificates',
    category: 'finance',
    roles: ['Admin'],
    route: '/document-management',
    badge: 'Certificates',
    description: 'Issue, customize, and print verified school certificates including Transfer Certificates (TC), Character Certificates, Bonafide Certificates, and Fee No-Dues receipts.',
    features: [
      'Ready-to-use official templates: Transfer Certificate (TC), Character Certificate, Bonafide / Study Certificate, No-Dues Certificate',
      'Dynamic field placeholders ({{student_name}}, {{father_name}}, {{admission_no}}, {{class}}, {{session}})',
      'Visual template customizer to modify certificate headers, declarations, and wording',
      'Official school emblem, digital signature, and verification stamp integration',
      'Certificate serial numbering and issuance history archive',
    ],
    guides: [
      {
        title: 'How to generate and print a Transfer Certificate (TC)',
        steps: [
          'Navigate to "Document Management" from the sidebar.',
          'Select the "Transfer Certificate" template.',
          'Search and select the student by name or admission number.',
          'The system auto-populates the student’s date of birth, parent details, date of admission, and leaving reason.',
          'Review the certificate preview on screen.',
          'Click "Generate & Print PDF". An official certificate with school registration code (845106) and seal is created.',
        ],
      },
      {
        title: 'How to customize certificate wording or template text',
        steps: [
          'In Document Management, select the template you wish to edit.',
          'Click "Customize Template".',
          'Adjust text paragraphs, placeholders, or font sizes.',
          'Click "Save Template". Future certificates will automatically use the revised layout.',
        ],
      },
    ],
    tips: [
      'Official school credentials (Meghwal mathia Bazar, West Champaran, Bihar 845106) are embedded automatically.',
    ],
    faqs: [
      {
        q: 'Can issued certificates be re-printed?',
        a: 'Yes, certificates can be regenerated at any time from the student records with the exact same issuance details.',
      },
    ],
  },

  {
    id: 'result',
    title: 'Result Portal & Report Cards',
    category: 'academics',
    roles: ['Admin', 'Teacher', 'Student'],
    route: '/result-view',
    badge: 'Report Cards',
    description: 'Publish formal student marks cards, CBSE style grade conversions, and maintain a public result lookup portal for parents.',
    features: [
      'Comprehensive Progress Report Cards with subject theory, practical, and aggregate grades',
      'CBSE 8-Point scale grade conversion (A1, A2, B1, B2, C1, C2, D, E)',
      'Public Results Portal (/results-portal) allowing parents to check results using Class & Roll Number',
      'Print-ready formal report card sheet with principal signature and grading legends',
    ],
    guides: [
      {
        title: 'How to generate and print a Student Report Card',
        steps: [
          'Go to "Result View" from the sidebar.',
          'Select the Examination, Class, and Student.',
          'The formal progress card renders with marks, grades, attendance percentage, and teacher remarks.',
          'Click "Print Report Card" to generate an official PDF.',
        ],
      },
    ],
    tips: [
      'Ensure all subject marks have been entered in Examination Management before generating report cards.',
    ],
    faqs: [
      {
        q: 'How do parents check results from home?',
        a: 'Parents visit the website and click "Results Portal" (/results-portal), select their child’s Class and enter their Roll Number.',
      },
    ],
  },
  {
    id: 'uploadMarks',
    title: 'Marks Upload & Rapid Grading',
    titleHi: 'मार्क्स अपलोड एवं त्वरित ग्रेडिंग (Marks Upload)',
    category: 'academics',
    roles: ['Admin', 'Teacher'],
    route: '/marks-upload',
    badge: 'Rapid Entry',
    description: 'Fast-track spreadsheet and grid entry for periodic class tests, weekly quizzes, and unit assessments without navigating multi-step examination wizards.',
    descriptionHi: 'वीकली टेस्ट और क्लास टेस्ट के नंबर तेजी से दर्ज करें: एक्सेल जैसी शीट में छात्र-वार अंक दर्ज करें और कीबोर्ड से Tab दबाकर अगले छात्र पर जाएं।',
    workflow: [
      'Select Class and Subject',
      'Set Maximum Marks (e.g. 25 or 50)',
      'Enter Scores Row by Row using Tab Key',
      'Verify Class Average & Highest Score',
      'Click "Submit Marks"',
    ],
    workflowHi: [
      'क्लास और विषय चुनें',
      'अधिकतम अंक (जैसे 25 या 50) दर्ज करें',
      'Tab की दबाकर हर छात्र के नंबर तेजी से भरें',
      'क्लास का औसत और सबसे ज्यादा नंबर चेक करें',
      '"Submit Marks" दबाकर सेव करें',
    ],
    features: [
      'Single-screen rapid entry designed specifically for busy teachers',
      'Full keyboard navigation: Tab to next student, Shift+Tab to previous',
      'Real-time class analytics: Class average score, total participants, and highest score',
      'Validation alerts preventing scores above maximum marks',
    ],
    featuresHi: [
      'शिक्षकों के लिए सिंगल-स्क्रीन तेज एंट्री सिस्टम',
      'कीबोर्ड नेविगेशन: Tab दबाकर अगले छात्र पर और Shift+Tab से पिछले छात्र पर जाएं',
      'लाइव क्लास विश्लेषण: औसत अंक, कुल उपस्थित छात्र और सबसे ज्यादा अंक',
      'अधिकतम अंक से ज्यादा नंबर डलने पर तुरंत अलर्ट',
    ],
    guides: [
      {
        title: 'How to enter periodic test marks quickly',
        titleHi: 'क्लास टेस्ट के नंबर तेजी से कैसे भरें',
        steps: [
          'Go to "Marks Upload" from the sidebar menu.',
          'Select your target Class and Subject.',
          'Enter the Maximum Marks for the test in the top box.',
          'Type the student score and press Tab on your keyboard to instantly focus the next student.',
          'Click "Submit Marks". All scores are stored into the database instantly.',
        ],
        stepsHi: [
          'साइडबार से "Marks Upload" पर जाएं।',
          'अपनी क्लास और विषय चुनें।',
          'ऊपर दिए गए बॉक्स में टेस्ट के कुल अंक (Max Marks) भरें।',
          'छात्र के नंबर टाइप करें और कीबोर्ड पर Tab दबाते ही अगला छात्र आ जाएगा।',
          '"Submit Marks" पर क्लिक करें। सभी नंबर सीधे डेटाबेस में सेव हो जाएंगे।',
        ],
      },
    ],
    fieldGuide: [
      {
        field: 'Max Marks',
        fieldHi: 'कुल अंक',
        meaning: 'The maximum score a student can achieve in this test.',
        meaningHi: 'इस टेस्ट के कुल अधिकतम अंक।',
      },
    ],
    troubleshooting: [
      {
        issue: 'Tab key is not jumping to the next row',
        issueHi: 'Tab दबाने पर अगला छात्र नहीं आ रहा है',
        fix: 'Click inside the first student input box to activate keyboard focus.',
        fixHi: 'पहले छात्र के नंबर वाले बॉक्स में माउस से क्लिक करें, फिर Tab दबाएं।',
      },
    ],
    tips: [
      'Use this module for weekly and monthly unit tests, and Examination Management for term exams.',
    ],
    tipsHi: [
      'वीकली और मंथली टेस्ट के लिए इसका उपयोग करें, जबकि अर्धवार्षिक और वार्षिक के लिए Examination Management का उपयोग करें।',
    ],
    faqs: [
      {
        q: 'Can marks entered here be edited later?',
        qHi: 'क्या बाद में इन नंबरों में बदलाव किया जा सकता है?',
        a: 'Yes, re-select the class and subject to reload saved marks and edit any row.',
        aHi: 'हाँ, वही क्लास और विषय दोबारा खोलकर किसी भी छात्र के नंबर बदले जा सकते हैं।',
      },
    ],
  },

  {
    id: 'subject',
    title: 'Subject & Syllabus Management',
    titleHi: 'विषय एवं पाठ्यक्रम प्रबंधन (Subject & Syllabus)',
    category: 'academics',
    roles: ['Admin'],
    route: '/subjects',
    badge: 'Curriculum',
    description: 'Create, organize, and allocate core subjects, languages, electives, and chapter-wise syllabi to classes across the school.',
    descriptionHi: 'स्कूल के सभी विषयों (हिंदी, गणित, विज्ञान, संस्कृत, उर्दू आदि) का प्रबंधन, विषय कोड आवंटन और क्लास-वाइज सिलेबस का निर्धारण।',
    workflow: [
      'Open Subject & Syllabus Directory',
      'Click "+ Add New Subject"',
      'Enter Subject Title and Unique Code',
      'Allocate Target Classes',
      'Save Subject for Timetable & Exam Usage',
    ],
    workflowHi: [
      'विषय व सिलेबस डायरेक्टरी खोलें',
      '"+ Add New Subject" पर क्लिक करें',
      'विषय का नाम और कोड दर्ज करें',
      'संबंधित क्लास चुनें',
      'टाइमटेबल और एग्जाम के लिए सुरक्षित करें',
    ],
    features: [
      'Master subject library with standardized codes (e.g. HIN01, MATH01, SCI01)',
      'Class-wise curriculum allocation for Nursery to Class 10th',
      'Subject categorization: Theory, Practical, Co-scholastic, and Moral Science',
      'Instant availability in Timetable slot editor and Exam setup dropdowns',
    ],
    featuresHi: [
      'मानक विषय कोड (जैसे HIN01, MATH01, SCI01) के साथ विषयों की लाइब्रेरी',
      'नर्सरी से 10वीं तक हर क्लास के लिए विषय आवंटन',
      'विषय श्रेणियां: थ्योरी, प्रैक्टिकल, संगीत/कला और नैतिक शिक्षा',
      'टाइमटेबल और परीक्षा मॉड्यूल में विषयों का अपने आप उपलब्ध होना',
    ],
    guides: [
      {
        title: 'How to add a new subject to the school curriculum',
        titleHi: 'स्कूल में नया विषय कैसे जोड़ें',
        steps: [
          'Navigate to "Subject & Syllabus" from the sidebar menu.',
          'Click "+ Add New Subject".',
          'Enter Subject Name (e.g., "Computer Science") and Code (e.g., "COMP101").',
          'Select the applicable classes (e.g., Class 1 to Class 10).',
          'Click "Save Subject". The subject will immediately appear across Timetable, Marks Upload, and Examination modules.',
        ],
        stepsHi: [
          'साइडबार से "Subject & Syllabus" पर जाएं।',
          '"+ Add New Subject" पर क्लिक करें।',
          'विषय का नाम (जैसे "Computer Science") और कोड (जैसे "COMP101") डालें।',
          'किन-किन क्लासों में यह विषय पढ़ाया जाएगा, उन्हें चुनें।',
          '"Save Subject" पर क्लिक करें। यह विषय टाइमटेबल और परीक्षा फॉर्म में अपने आप जुड़ जाएगा।',
        ],
      },
    ],
    fieldGuide: [
      {
        field: 'Subject Code',
        fieldHi: 'विषय कोड',
        meaning: 'Short 4-6 character alphanumeric code used on report cards and timetables.',
        meaningHi: 'टाइमटेबल और रिपोर्ट कार्ड पर छपने वाला छोटा कोड (जैसे MATH, HIN, SCI)।',
      },
    ],
    troubleshooting: [
      {
        issue: 'Subject already exists error',
        issueHi: 'Subject already exists (विषय पहले से मौजूद है) का एरर',
        fix: 'Check the subject table to verify if the subject or code has already been added.',
        fixHi: 'टेबल में चेक करें कि कहीं यह विषय या कोड पहले से तो नहीं बना हुआ है।',
      },
    ],
    tips: [
      'Use uppercase letters for subject codes (e.g., ENG, MATH, SANS) for neat timetable display.',
    ],
    tipsHi: [
      'विषय कोड को हमेशा बड़े अक्षरों (ENG, MATH, SCI) में लिखें ताकि टाइमटेबल साफ दिखे।',
    ],
    faqs: [
      {
        q: 'Can a subject be deleted if it was taught last year?',
        qHi: 'यदि कोई विषय पिछले साल पढ़ाया गया था तो क्या उसे हटाया जा सकता है?',
        a: 'To maintain academic result integrity, the system archives subjects instead of deleting historical records.',
        aHi: 'पुराने रिजल्ट सुरक्षित रखने के लिए सिस्टम विषयों को डिलीट करने के बजाय आर्काइव (Archive) करता है।',
      },
    ],
  },

  {
    id: 'classPromotion',
    title: 'Class Promotion & Roll-Over',
    titleHi: 'क्लास प्रमोशन एवं वार्षिक रोल-ओवर (Class Promotion)',
    category: 'students',
    roles: ['Admin'],
    route: '/class-promotion',
    badge: 'Annual Transition',
    description: 'Safely promote batches of students to the next higher grade at the start of each new academic year with roll number reassignment.',
    descriptionHi: 'नया शैक्षणिक सत्र शुरू होने पर पूरी क्लास के छात्रों को अगली कक्षा में प्रमोट करें (जैसे Class 4 के सभी बच्चों को Class 5 में) और नए रोल नंबर दें।',
    workflow: [
      'Select Current Class & Target Class',
      'Review Enrolled Student Roster',
      'Uncheck Any Retained Students',
      'Choose Roll Number Scheme (Retain / Sequential)',
      'Confirm Promotion to Transition Session',
    ],
    workflowHi: [
      'वर्तमान क्लास और अगली क्लास चुनें',
      'छात्रों की लिस्ट चेक करें',
      'जो छात्र प्रमोट नहीं हो रहे उन्हें अनचेक करें',
      'रोल नंबर का तरीका चुनें (पुराना रखें या 1, 2, 3 बनाएं)',
      'प्रमोशन कन्फर्म करें',
    ],
    features: [
      'Batch class-to-class promotion in under 30 seconds',
      'Individual retention checkboxes for students needing to repeat a grade',
      'Automated sequential re-roll numbering or original roll retention',
      'Pre-promotion preview list to prevent accidental moves',
    ],
    featuresHi: [
      '30 सेकंड में पूरी क्लास का अगली क्लास में प्रमोशन',
      'फेल या रुके हुए छात्रों को उसी क्लास में रखने के लिए चेकबॉक्स',
      'नए रोल नंबर (1, 2, 3...) अपने आप आवंटित करने की सुविधा',
      'प्रमोशन से पहले प्रिव्यू लिस्ट ताकि कोई गलती न हो सके',
    ],
    guides: [
      {
        title: 'How to promote a class to the next academic session',
        titleHi: 'पूरी क्लास को अगली कक्षा में प्रमोट कैसे करें',
        steps: [
          'Navigate to "Class Promotion" from the sidebar menu.',
          'Select Current Class (e.g. Class 1) and Target Class (e.g. Class 2).',
          'Review the student checklist. Uncheck any student who is not being promoted.',
          'Choose the Roll Number scheme (keep existing or renumber sequentially from 1).',
          'Click "Preview Promotion", review the changes, and click "Confirm Promotion".',
        ],
        stepsHi: [
          'साइडबार से "Class Promotion" पर जाएं।',
          'वर्तमान क्लास (जैसे Class 1) और अगली क्लास (जैसे Class 2) चुनें।',
          'छात्रों की लिस्ट देखें। जो छात्र प्रमोट नहीं हो रहा उसे अनचेक (टिक हटाएं) कर दें।',
          'रोल नंबर का नियम चुनें (पुराना रोल नंबर रखें या 1 से नए सिरे से बनाएं)।',
          '"Preview Promotion" दबाएं, जांचें और "Confirm Promotion" पर क्लिक कर दें।',
        ],
      },
    ],
    fieldGuide: [
      {
        field: 'Target Class',
        fieldHi: 'अगली कक्षा',
        meaning: 'The higher grade to which passing students are being advanced.',
        meaningHi: 'वह अगली क्लास जिसमें पास हुए बच्चे प्रमोट होकर जाएंगे।',
      },
    ],
    troubleshooting: [
      {
        issue: 'A student was promoted to the wrong class by mistake',
        issueHi: 'गलती से कोई बच्चा गलत क्लास में प्रमोट हो गया',
        fix: 'Go to Student Directory, search for the student, click Edit, change their Class and Section back, and save.',
        fixHi: '"Student Directory" में जाएं, छात्र को खोजें, Edit दबाएं और उसकी सही क्लास व सेक्शन चुनकर सेव कर दें।',
      },
    ],
    tips: [
      'Always export your Student Directory to Excel before performing annual batch promotions.',
    ],
    tipsHi: [
      'वार्षिक प्रमोशन करने से पहले छात्र डायरेक्टरी का एक्सेल बैकअप जरूर डाउनलोड कर लें।',
    ],
    faqs: [
      {
        q: 'What happens to Class 10 passing students?',
        qHi: '10वीं पास करने वाले छात्रों का क्या होता है?',
        a: 'Promote them to "Alumni" or issue a Transfer Certificate in Document Management.',
        aHi: 'उन्हें "Alumni" में ट्रांसफर करें या डॉक्यूमेंट मैनेजमेंट से उनका ट्रांसफर सर्टिफिकेट (TC) जारी करें।',
      },
    ],
  },

  {
    id: 'uploadPhoto',
    title: 'Student Photo Management',
    titleHi: 'छात्र फोटो प्रबंधन (Student Photo Upload)',
    category: 'students',
    roles: ['Admin'],
    route: '/upload-photo',
    badge: 'Media',
    description: 'Upload, crop, and link high-resolution portrait photographs to student profiles for ID cards, admit cards, and transfer certificates.',
    descriptionHi: 'छात्रों के पासपोर्ट साइज फोटो अपलोड करें और क्रॉप करें ताकि आईडी कार्ड, एडमिट कार्ड और ट्रांसफर सर्टिफिकेट पर साफ फोटो छप सके।',
    workflow: [
      'Select Class and Section',
      'Locate Student Card',
      'Drag & Drop Image or Browse File',
      'Crop Face into Square Aspect Frame',
      'Save & Link Directly to Student Profile',
    ],
    workflowHi: [
      'क्लास और सेक्शन चुनें',
      'छात्र का कार्ड देखें',
      'फोटो चुनें या ड्रैग करके डालें',
      'चेहरे को फ्रेम में सेट (Crop) करें',
      'सेव करें ताकि आईडी कार्ड पर फोटो आ जाए',
    ],
    features: [
      'Direct visual student card grid showing students with and without photos',
      'Interactive crop tool to zoom, center, and crop passport portraits',
      'Automatic image optimization: Compresses images for lightning-fast ID card printing',
      'Instant synchronization with ID Cards and Admit Cards',
    ],
    featuresHi: [
      'क्लास के सभी छात्रों की फोटो ग्रिड: किसकी फोटो है और किसकी बाकी है, साफ दिखता है',
      'फोटो क्रॉप टूल: चेहरे को बीच में सेट करने और ज़ूम करने की आसान सुविधा',
      'ऑटो-कंप्रेशन: फोटो की साइज को अपने आप हल्का करता है ताकि आईडी कार्ड तुरंत प्रिंट हो',
      'आईडी कार्ड और एडमिट कार्ड पर तुरंत लाइव फोटो का दिखना',
    ],
    guides: [
      {
        title: 'How to upload and crop a student photograph',
        titleHi: 'छात्र की फोटो अपलोड और क्रॉप कैसे करें',
        steps: [
          'Navigate to "Upload Photos" from the sidebar menu.',
          'Select Class (e.g. Class 1) and Section (A).',
          'Click on the photo placeholder next to the student name.',
          'Select a photo from your computer or phone.',
          'Use the crop tool to center the face, then click "Save & Upload".',
        ],
        stepsHi: [
          'साइडबार से "Upload Photos" पर जाएं।',
          'क्लास और सेक्शन चुनें।',
          'छात्र के नाम के पास दिए गए फोटो बॉक्स पर क्लिक करें।',
          'अपने कंप्यूटर या मोबाइल से छात्र की फोटो चुनें।',
          'फ्रेम में चेहरे को बीच में सेट करें और "Save & Upload" पर क्लिक करें।',
        ],
      },
    ],
    fieldGuide: [
      {
        field: 'Aspect Ratio',
        fieldHi: 'फोटो का आकार',
        meaning: 'Standard 1:1 square or 3:4 portrait ratio for ID cards.',
        meaningHi: 'आईडी कार्ड के लिए मानक पासपोर्ट साइज अनुपात।',
      },
    ],
    troubleshooting: [
      {
        issue: 'Photo appears blurry on ID card',
        issueHi: 'आईडी कार्ड पर फोटो धुंधली आ रही है',
        fix: 'Ensure the uploaded photo is at least 300x300 pixels and taken in good lighting.',
        fixHi: 'सुनिश्चित करें कि फोटो अच्छी रोशनी में खींची गई हो और कम से कम 300x300 पिक्सल की हो।',
      },
    ],
    tips: [
      'Take photos against a plain white or light blue background for best ID card appearance.',
    ],
    tipsHi: [
      'सफेद या हल्के नीले बैकग्राउंड में फोटो खींचने से आईडी कार्ड बहुत सुंदर दिखता है।',
    ],
    faqs: [
      {
        q: 'Can photos be replaced if an older picture was uploaded?',
        qHi: 'क्या पुरानी फोटो बदलकर नई फोटो लगाई जा सकती है?',
        a: 'Yes, simply click on the student photo again and select a new file to overwrite.',
        aHi: 'हाँ, उसी छात्र की फोटो पर दोबारा क्लिक करके नई फोटो चुन लें।',
      },
    ],
  },

  {
    id: 'teachers',
    title: 'Faculty & Teachers Directory',
    titleHi: 'शिक्षक एवं स्टाफ डायरेक्टरी (Faculty Directory)',
    category: 'operations',
    roles: ['Admin'],
    route: '/teachers',
    badge: 'Staff Master',
    description: 'Manage staff profiles, teaching designations, assigned class teachers, subject specializations, and contact records.',
    descriptionHi: 'स्कूल के सभी शिक्षकों का रिकॉर्ड: नया शिक्षक जोड़ना, क्लास टीचर नियुक्त करना, उनके विषय, मोबाइल नंबर और लॉगिन क्रेडेंशियल।',
    workflow: [
      'Open Faculty & Teachers Directory',
      'Click "+ Add New Teacher"',
      'Enter Name, Phone, Email & Qualifications',
      'Assign Class Teacher Role (if applicable)',
      'Save Profile for Timetable and Attendance',
    ],
    workflowHi: [
      'शिक्षक डायरेक्टरी खोलें',
      '"+ Add New Teacher" पर क्लिक करें',
      'नाम, मोबाइल नंबर, ईमेल और योग्यता भरें',
      'क्लास टीचर का प्रभार दें (यदि आवश्यक हो)',
      'टाइमटेबल और हाजिरी के लिए सुरक्षित करें',
    ],
    features: [
      'Complete faculty profile management with phone, email, and joining date',
      'Class Teacher designation: Assign in-charge responsibility for specific classes',
      'Subject specialization tags for smart timetable conflict prevention',
      'Teacher login account generation for GPS punch-in and marks entry',
    ],
    featuresHi: [
      'शिक्षकों की पूरी प्रोफाइल: फोन नंबर, ईमेल, पद और जॉइनिंग की तारीख',
      'क्लास टीचर का जिम्मा: किस क्लास के कौन से शिक्षक इंचार्ज हैं',
      'विषय विशेषज्ञता: टाइमटेबल में सही शिक्षक को सही विषय देने की सुविधा',
      'टीचर लॉगिन अकाउंट: जिससे शिक्षक खुद मोबाइल से हाजिरी लगा सकें और नंबर भर सकें',
    ],
    guides: [
      {
        title: 'How to register a new teacher in the school',
        titleHi: 'नए शिक्षक को सिस्टम में कैसे जोड़ें',
        steps: [
          'Navigate to "Faculty & Teachers" from the sidebar menu.',
          'Click "+ Add New Teacher".',
          'Enter Full Name, Mobile Number, Email, and Educational Qualifications.',
          'Assign designated Class and Section (if they will be a Class Teacher).',
          'Click "Save Teacher". The teacher can now log in and take attendance.',
        ],
        stepsHi: [
          'साइडबार से "Faculty & Teachers" पर जाएं।',
          '"+ Add New Teacher" पर क्लिक करें।',
          'शिक्षक का पूरा नाम, मोबाइल नंबर, ईमेल और शैक्षणिक योग्यता दर्ज करें।',
          'क्लास टीचर का प्रभार (जैसे Class 3-A) सौंपें।',
          '"Save Teacher" पर क्लिक करें। अब शिक्षक लॉगिन करके हाजिरी और टाइमटेबल देख सकते हैं।',
        ],
      },
    ],
    fieldGuide: [
      {
        field: 'Class Teacher Assignment',
        fieldHi: 'क्लास टीचर आवंटन',
        meaning: 'Links the teacher directly to their classroom for roll-call authority.',
        meaningHi: 'उस क्लास की हाजिरी भरने का मुख्य अधिकार इस शिक्षक को मिलता है।',
      },
    ],
    troubleshooting: [
      {
        issue: 'Teacher forgot their login password',
        issueHi: 'शिक्षक अपना पासवर्ड भूल गए हैं',
        fix: 'Go to Faculty & Teachers, find the teacher, and click "Reset Password" to assign a new temporary password.',
        fixHi: '"Faculty & Teachers" में जाकर शिक्षक की प्रोफाइल से नया पासवर्ड सेट कर दें।',
      },
    ],
    tips: [
      'Keep teacher mobile numbers up to date for emergency school communications.',
    ],
    tipsHi: [
      'शिक्षकों के सही मोबाइल नंबर हमेशा अपडेट रखें ताकि कोई जरूरी सूचना तुरंत दी जा सके।',
    ],
    faqs: [
      {
        q: 'Can a teacher be marked inactive when they leave?',
        qHi: 'यदि कोई शिक्षक स्कूल छोड़ दें तो क्या प्रोफाइल हटाई जा सकती है?',
        a: 'Yes, change their status from "Active" to "Inactive" so their past attendance logs remain preserved.',
        aHi: 'हाँ, उनका स्टेटस "Inactive" कर दें ताकि पुराना रिकॉर्ड सुरक्षित रहे और वे लॉगिन न कर सकें।',
      },
    ],
  },

  {
    id: 'result',
    title: 'Result Portal & Progress Report Cards',
    titleHi: 'रिजल्ट पोर्टल एवं प्रगति पत्र (Report Cards)',
    category: 'academics',
    roles: ['Admin', 'Teacher', 'Student'],
    route: '/result-view',
    badge: 'Report Cards',
    description: 'Publish formal student report cards, CBSE grade calculations, teacher remarks, and maintain a public result lookup portal for parents.',
    descriptionHi: 'छात्रों के औपचारिक रिपोर्ट कार्ड (प्रगति पत्र) प्रिंट करें, सीबीएसई ग्रेडिंग (A1 से E), क्लास में रैंक, हाजिरी प्रतिशत और अभिभावक रिजल्ट पोर्टल।',
    workflow: [
      'Select Examination & Class',
      'Select Student or View Full Class',
      'Verify Subject Marks, Total & Grade',
      'Add Class Teacher Remarks',
      'Click "Print Official Report Card" (A4)',
    ],
    workflowHi: [
      'परीक्षा और क्लास चुनें',
      'छात्र को चुनें या पूरी क्लास देखें',
      'विषय के नंबर, कुल अंक और ग्रेड चेक करें',
      'क्लास टीचर की टिप्पणी (Remarks) जोड़ें',
      '"Print Official Report Card" पर क्लिक करके मार्कशीट प्रिंट करें',
    ],
    features: [
      'CBSE-compliant Annual Progress Report Card design with official Star Public School emblem',
      'Automated aggregate percentage, class rank, and 8-point grading scale calculation',
      'Attendance summary embedding: Total school working days vs student days attended',
      'Public Parent Results Portal (/results-portal): Parents can look up results using Roll Number and Class',
    ],
    featuresHi: [
      'स्टार पब्लिक स्कूल के लोगो और मोहर के साथ सीबीएसई मानक रिपोर्ट कार्ड',
      'कुल प्रतिशत, क्लास में रैंक और ग्रेड की ऑटो-कैलकुलेशन',
      'हाजिरी का विवरण: कुल स्कूल के दिन और छात्र के उपस्थित दिन मार्कशीट पर छपते हैं',
      'अभिभावक रिजल्ट पोर्टल (/results-portal): अभिभावक घर बैठे रोल नंबर डालकर रिजल्ट देख सकते हैं',
    ],
    guides: [
      {
        title: 'How to generate and print a formal Student Report Card',
        titleHi: 'छात्र का रिपोर्ट कार्ड (मार्कशीट) कैसे प्रिंट करें',
        steps: [
          'Navigate to "Result View" from the sidebar menu.',
          'Select Examination (e.g. Annual Exam 2026-27), Class, and Student.',
          'The comprehensive progress card renders with marks, grades, attendance, and remarks.',
          'Click "Print Report Card". The A4 sheet formats cleanly with school header and signatures.',
        ],
        stepsHi: [
          'साइडबार से "Result View" पर जाएं।',
          'परीक्षा (जैसे Annual Exam), क्लास और छात्र का नाम चुनें।',
          'पूरी मार्कशीट सभी विषयों के नंबर, ग्रेड और हाजिरी के साथ सामने आ जाएगी।',
          '"Print Report Card" पर क्लिक करके आधिकारिक प्रिंट निकालें।',
        ],
      },
    ],
    fieldGuide: [
      {
        field: 'Teacher Remarks',
        fieldHi: 'शिक्षक की टिप्पणी',
        meaning: 'Qualitative assessment of student conduct, discipline, and participation (e.g. "Outstanding performance, keep it up!").',
        meaningHi: 'छात्र के आचरण और पढ़ाई पर शिक्षक की टिप्पणी (जैसे: "उत्कृष्ट प्रदर्शन, बधाई!")।',
      },
    ],
    troubleshooting: [
      {
        issue: 'Report card shows "Pending" for a subject',
        issueHi: 'मार्कशीट में किसी विषय के आगे "Pending" लिखा आ रहा है',
        fix: 'Go to Examination Management > Marks Entry and ensure marks have been submitted for that subject.',
        fixHi: '"Examination Management" के "Marks Entry" में जाकर उस विषय के नंबर दर्ज करके सेव करें।',
      },
    ],
    tips: [
      'Print report cards on thicker 120-150 GSM paper for parent-teacher distribution days.',
    ],
    tipsHi: [
      'अभिभावक मीटिंग (PTM) में बांटने के लिए रिपोर्ट कार्ड को 120 से 150 GSM वाले मोटे पेपर पर प्रिंट करें।',
    ],
    faqs: [
      {
        q: 'Can parents view results online on their mobile phone?',
        qHi: 'क्या अभिभावक अपने मोबाइल पर रिजल्ट देख सकते हैं?',
        a: 'Yes, direct parents to /results-portal where they enter the student’s Class and Roll Number.',
        aHi: 'हाँ, स्कूल की वेबसाइट पर जाकर "Results Portal" में क्लास और रोल नंबर डालकर रिजल्ट देखा जा सकता है।',
      },
    ],
  },

]

