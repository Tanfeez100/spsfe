import { aboutPhotos, campusPhotos, contactPhotos, sharedImages } from '../../assets/websiteImages'

export const schoolProfile = {
  name: import.meta.env.VITE_SCHOOL_NAME || 'Star Public School',
  motto: 'Learning with discipline, growth with confidence, and communication families can trust.',
  tagline:
    'A calm, future-ready learning campus in Harinagar, Ramnagar (Bettiah), West Champaran where academics, values, routines and parent communication move together.',
  phone: '+91 9006457330',
  phoneHref: 'tel:+919006457330',
  email: 'a9006457330@gmail.com',
  emailHref: 'mailto:a9006457330@gmail.com',
  address: 'Meghwal mathia Bazar, West Champaran, Bihar 845106',
  hours: 'Monday to Saturday, 8:00 AM to 2:00 PM',
  mapsHref: 'https://maps.google.com/?q=Meghwal+mathia+Bazar+West+Champaran+Bihar+845106',
  whatsappHref: 'https://wa.me/919006457330',
}

export const siteNavLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/admission', label: 'Admission' },
  { to: '/pay-fees', label: 'Pay Fees' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
]

export const siteMedia = {
  logo: sharedImages.schoolLogo,
  homeHero: campusPhotos[9].src,
  homeSupport: campusPhotos[14].src,
  homeCulture: campusPhotos[4].src,
  aboutHero: aboutPhotos.hero,
  aboutSupport: aboutPhotos.secondary,
  aboutLead: aboutPhotos.achievements,
  admissionHero: contactPhotos.hero,
  admissionSupport: campusPhotos[15].src,
  contactHero: contactPhotos.location,
  contactSupport: campusPhotos[8].src,
  galleryFeature: [campusPhotos[0].src, campusPhotos[10].src, campusPhotos[13].src],
}

export const homeHeroSlides = [
  {
    src: campusPhotos[9].src,
    label: 'Celebration and confidence',
    title: 'Students grow faster when school life feels active, visible and encouraging.',
  },
  {
    src: campusPhotos[14].src,
    label: 'Creative participation',
    title: 'Learning becomes stronger when children can build, present and explore with confidence.',
  },
  {
    src: campusPhotos[0].src,
    label: 'Daily discipline',
    title: 'The school day begins with routine, order and a shared sense of direction.',
  },
  {
    src: campusPhotos[4].src,
    label: 'Student voice',
    title: 'Presentation, communication and ownership matter alongside marks.',
  },
]

export const homeHeroSections = [
  {
    title: 'Admissions made clearer',
    text: 'Families should understand the process quickly, from first conversation to campus visit and next-step guidance.',
  },
  {
    title: 'Systems that feel easier',
    text: 'Result access, record flow and communication are presented in a way that reduces friction for parents.',
  },
  {
    title: 'Campus story in motion',
    text: 'The hero area now uses rotating real photos so the school atmosphere feels alive instead of boxed in.',
  },
]

export const homeHeroStats = [
  {
    value: 'Structured learning',
    label: 'Classroom teaching, practice support and assessment routines designed to reduce confusion for students.',
  },
  {
    value: 'Visible progress',
    label: 'Parents stay updated through clear result access, reporting flow and responsive school communication.',
  },
  {
    value: 'Balanced campus life',
    label: 'Academics, activities, discipline and values are handled as one continuous student journey.',
  },
]

export const homePromisePoints = [
  'Quiet, focused classrooms where children receive patient academic guidance.',
  'School systems that make admissions, records, fee follow-up and results easier to understand.',
  'A campus culture that values consistency, respect, punctuality and confident communication.',
  'Regular school moments that help children grow through assembly, activities, sports and stage exposure.',
]

export const homeProgramCards = [
  {
    title: 'Academic discipline',
    text:
      'Daily classroom rhythm, revision support and teacher attention help students build strong fundamentals instead of last-minute exam pressure.',
  },
  {
    title: 'Co-curricular confidence',
    text:
      'Events, presentations and student participation are treated as learning tools so children become expressive, collaborative and self-assured.',
  },
  {
    title: 'Parent communication',
    text:
      'Families need timely clarity, so the school keeps admissions, progress, result access and basic follow-up information easy to approach.',
  },
]

export const homeJourneySteps = [
  {
    title: 'Start with clarity',
    text: 'Families understand the school routine, expectations and support system before the session begins.',
  },
  {
    title: 'Learn with routine',
    text: 'Students move through classroom teaching, regular practice and monitored participation throughout the term.',
  },
  {
    title: 'Grow with exposure',
    text: 'Assemblies, events, sports and collaborative moments give children confidence beyond textbooks.',
  },
  {
    title: 'Track the outcome',
    text: 'Results, records and communication stay organized so every family can follow student progress with confidence.',
  },
]

export const homeCommunityNotes = [
  {
    title: 'From the principal',
    text:
      'A good school should feel steady from the outside and supportive from within. We work to make every student feel guided, noticed and accountable.',
  },
  {
    title: 'From parents',
    text:
      'Families appreciate a school that explains things clearly. The combination of discipline, communication and approachable faculty builds that trust.',
  },
  {
    title: 'From students',
    text:
      'Children respond best when classrooms feel encouraging and structured. That balance helps them participate more and hesitate less.',
  },
]

export const aboutMilestones = [
  {
    year: 'Foundation',
    title: 'A locally trusted school identity',
    text: 'The school grew around the idea that quality education should remain disciplined, accessible and community rooted.',
  },
  {
    year: 'Growth',
    title: 'Stronger academic and activity culture',
    text: 'More emphasis was placed on classroom consistency, events, student participation and parent confidence.',
  },
  {
    year: 'Today',
    title: 'A clearer school system for modern families',
    text: 'Admissions, records, reporting and school communication are now designed to feel more transparent and organized.',
  },
]

export const aboutValues = [
  {
    title: 'Discipline that supports learning',
    text: 'Routine, punctuality and respectful conduct create a campus atmosphere where children can focus and feel secure.',
  },
  {
    title: 'Teaching with personal attention',
    text: 'Strong instruction matters, but so does the ability to notice where a learner needs patience, repetition and encouragement.',
  },
  {
    title: 'Confidence through participation',
    text: 'Students are encouraged to speak, present, perform and collaborate so they develop voice alongside marks.',
  },
  {
    title: 'Family trust through clarity',
    text: 'Parents should not struggle to understand the school process, which is why communication and transparency remain central.',
  },
]

export const aboutLearningBlocks = [
  {
    title: 'Classroom practice',
    text:
      'Daily lessons are expected to feel grounded and understandable, with enough repetition and teacher guidance for concepts to settle properly.',
  },
  {
    title: 'Whole-child growth',
    text:
      'Sports, assemblies, celebrations and collaborative activities are treated as meaningful spaces where discipline and confidence become visible.',
  },
  {
    title: 'School-home alignment',
    text:
      'Children improve faster when the school and the family share the same understanding of progress, behaviour and expectations.',
  },
]

export const admissionSteps = [
  {
    title: 'Initial conversation',
    text: 'Families speak with the school office to understand classes, seat availability, timing and the overall admission flow.',
  },
  {
    title: 'Campus visit',
    text: 'Parents can visit the campus, ask practical questions and understand the learning environment before making a decision.',
  },
  {
    title: 'Document submission',
    text: 'Basic student and guardian documents are reviewed carefully so the admission record stays complete and accurate from day one.',
  },
  {
    title: 'Confirmation and orientation',
    text: 'Once approved, the family receives the next-step guidance related to joining, routine expectations and session readiness.',
  },
]

export const admissionSupportBlocks = [
  {
    title: 'Who can apply',
    text:
      'Admissions are open for families looking for a disciplined, supportive school atmosphere where communication and academics are handled seriously.',
  },
  {
    title: 'Documents usually required',
    text:
      'Birth certificate, previous school record, transfer certificate when applicable, student photographs and guardian contact details.',
  },
  {
    title: 'How we support parents',
    text:
      'The admission desk helps families understand the process clearly so paperwork, timings and next actions do not feel overwhelming.',
  },
]

export const admissionFaqs = [
  {
    question: 'Do we need to visit the campus before admission?',
    answer:
      'A visit is strongly recommended because it helps families understand the environment, daily routine and expectations more confidently.',
  },
  {
    question: 'Can parents discuss admission support directly with the office?',
    answer:
      'Yes. The school office remains the best point of contact for class availability, required documents and admission scheduling.',
  },
  {
    question: 'Is the process suitable for first-time school admissions too?',
    answer:
      'Yes. The school team can guide families who are new to the admission process and help them complete the required steps comfortably.',
  },
]

export const contactCards = [
  {
    title: 'Call the office',
    detail: schoolProfile.phone,
    link: schoolProfile.phoneHref,
    icon: 'call',
  },
  {
    title: 'Email the team',
    detail: schoolProfile.email,
    link: schoolProfile.emailHref,
    icon: 'mail',
  },
  {
    title: 'Visit the campus',
    detail: schoolProfile.address,
    link: schoolProfile.mapsHref,
    icon: 'location_on',
  },
  {
    title: 'Office hours',
    detail: schoolProfile.hours,
    link: '#contact-form',
    icon: 'schedule',
  },
]

export const galleryRows = [
  {
    title: 'Academic rhythm',
    description:
      'These frames reflect the quieter side of school life where assembly, classroom attention and student focus create the base for strong academics.',
    photos: [
      {
        src: campusPhotos[0].src,
        title: 'Morning assembly',
        note: 'The shared start of the day brings routine and collective focus.',
        cardClass: 'w-[290px] sm:w-[360px]',
        imageClass: 'h-[250px] sm:h-[320px]',
      },
      {
        src: campusPhotos[1].src,
        title: 'Focused classroom',
        note: 'Teacher-led sessions where explanations stay close to student pace.',
        cardClass: 'mt-10 w-[230px] sm:w-[270px]',
        imageClass: 'h-[320px] sm:h-[390px]',
      },
      {
        src: campusPhotos[4].src,
        title: 'Student presentation',
        note: 'Children learn to speak clearly and take ownership of their work.',
        cardClass: 'w-[270px] sm:w-[320px]',
        imageClass: 'h-[220px] sm:h-[280px]',
      },
      {
        src: campusPhotos[5].src,
        title: 'Reading support',
        note: 'Quiet learning corners reinforce habit, curiosity and comprehension.',
        cardClass: 'mt-14 w-[220px] sm:w-[260px]',
        imageClass: 'h-[300px] sm:h-[360px]',
      },
      {
        src: campusPhotos[8].src,
        title: 'Team learning',
        note: 'Peers learn better when collaboration is encouraged inside the routine.',
        cardClass: 'w-[310px] sm:w-[370px]',
        imageClass: 'h-[240px] sm:h-[300px]',
      },
      {
        src: campusPhotos[12].src,
        title: 'Engaged minds',
        note: 'A closer view of student concentration during active learning.',
        cardClass: 'mt-8 w-[240px] sm:w-[280px]',
        imageClass: 'h-[290px] sm:h-[340px]',
      },
    ],
  },
  {
    title: 'Stage, culture and expression',
    description:
      'Growth in school is not only academic. These moments show how students develop confidence, joy and belonging through shared participation.',
    photos: [
      {
        src: campusPhotos[2].src,
        title: 'Cultural performance',
        note: 'Students become more expressive when the stage feels welcoming.',
        cardClass: 'w-[250px] sm:w-[300px]',
        imageClass: 'h-[320px] sm:h-[380px]',
      },
      {
        src: campusPhotos[9].src,
        title: 'School event',
        note: 'Events turn ordinary days into collective memory and school pride.',
        cardClass: 'mt-10 w-[320px] sm:w-[390px]',
        imageClass: 'h-[230px] sm:h-[290px]',
      },
      {
        src: campusPhotos[10].src,
        title: 'Annual celebration',
        note: 'Large moments where discipline and student energy come together.',
        cardClass: 'w-[290px] sm:w-[350px]',
        imageClass: 'h-[250px] sm:h-[310px]',
      },
      {
        src: campusPhotos[11].src,
        title: 'Campus showcase',
        note: 'The school identity becomes visible through shared public moments.',
        cardClass: 'mt-14 w-[220px] sm:w-[260px]',
        imageClass: 'h-[300px] sm:h-[360px]',
      },
      {
        src: campusPhotos[13].src,
        title: 'Beyond books',
        note: 'Practical and creative exposure helps students speak with more ease.',
        cardClass: 'w-[280px] sm:w-[330px]',
        imageClass: 'h-[240px] sm:h-[300px]',
      },
      {
        src: campusPhotos[16].src,
        title: 'Achievement day',
        note: 'Recognition strengthens motivation across the school community.',
        cardClass: 'mt-8 w-[240px] sm:w-[280px]',
        imageClass: 'h-[290px] sm:h-[340px]',
      },
    ],
  },
  {
    title: 'Campus spaces and activity',
    description:
      'The visual story is completed by the places where students move, play and interact. Good spaces quietly shape the daily learning experience.',
    photos: [
      {
        src: campusPhotos[3].src,
        title: 'Campus corridor',
        note: 'Organized movement matters as much as organized teaching.',
        cardClass: 'w-[310px] sm:w-[380px]',
        imageClass: 'h-[220px] sm:h-[280px]',
      },
      {
        src: campusPhotos[6].src,
        title: 'Sports practice',
        note: 'Play and physical activity build stamina, teamwork and joy.',
        cardClass: 'mt-12 w-[230px] sm:w-[270px]',
        imageClass: 'h-[320px] sm:h-[390px]',
      },
      {
        src: campusPhotos[7].src,
        title: 'Lab activity',
        note: 'Practical spaces help students connect ideas with experience.',
        cardClass: 'w-[260px] sm:w-[310px]',
        imageClass: 'h-[250px] sm:h-[310px]',
      },
      {
        src: campusPhotos[14].src,
        title: 'Creative workshop',
        note: 'Students respond well when school gives them room to build and explore.',
        cardClass: 'mt-8 w-[300px] sm:w-[360px]',
        imageClass: 'h-[235px] sm:h-[295px]',
      },
      {
        src: campusPhotos[15].src,
        title: 'Value-first campus',
        note: 'Daily spaces also reinforce the school culture of order and respect.',
        cardClass: 'w-[250px] sm:w-[300px]',
        imageClass: 'h-[300px] sm:h-[360px]',
      },
      {
        src: campusPhotos[17].src,
        title: 'Campus pride',
        note: 'A final frame that holds the spirit, identity and memory of the school.',
        cardClass: 'mt-14 w-[230px] sm:w-[270px]',
        imageClass: 'h-[320px] sm:h-[390px]',
      },
    ],
  },
]
