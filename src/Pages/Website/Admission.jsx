import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import SEO from '../../Components/SEO/SEO'
import { buildSchoolJsonLd, SCHOOL_KEYWORDS } from '../../seo/siteSeo'
import ThemeSelect from '../../Components/Website/ThemeSelect'
import { admissionFaqs, schoolProfile, siteMedia } from './siteContent'

const CLASS_OPTIONS = [
  { value: 'Playgroup', label: 'Playgroup' },
  { value: 'Nursery', label: 'Nursery' },
  { value: 'LKG', label: 'LKG' },
  { value: 'UKG', label: 'UKG' },
  { value: 'Class 1', label: 'Class 1' },
  { value: 'Class 2', label: 'Class 2' },
  { value: 'Class 3', label: 'Class 3' },
  { value: 'Class 4', label: 'Class 4' },
  { value: 'Class 5', label: 'Class 5' },
  { value: 'Class 6', label: 'Class 6' },
  { value: 'Class 7', label: 'Class 7' },
  { value: 'Class 8', label: 'Class 8' },
  { value: 'Class 9', label: 'Class 9' },
  { value: 'Class 10', label: 'Class 10' },
]

const SIDEBAR_ITEMS = [
  { id: 'process', label: 'Admission Process' },
  { id: 'enquiry', label: 'Enquiry Form' },
  { id: 'eligibility', label: 'Eligibility Criteria' },
  { id: 'documents', label: 'Required Documents' },
  { id: 'faqs', label: "Admissions FAQ's" },
  { id: 'guidelines', label: 'Guidelines & Policies' },
  { id: 'fee', label: 'Fee Structure' },
]

function Admission() {
  const [activeTab, setActiveTab] = useState('process')
  const [openFaqIndex, setOpenFaqIndex] = useState(0)

  // Enquiry form state (handles form inline without navigating away)
  const [enquiryForm, setEnquiryForm] = useState({
    studentName: '',
    classSeeking: '',
    dob: '',
    gender: '',
    guardianName: '',
    phone: '',
    email: '',
    address: '',
    message: '',
  })
  const [enquirySubmitted, setEnquirySubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEnquiryChange = (e) => {
    const { name, value } = e.target
    setEnquiryForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEnquirySubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setEnquirySubmitted(true)
    }, 500)
  }

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index))
  }

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    const contentEl = document.getElementById('admission-content-area')
    if (contentEl) {
      contentEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <WebsiteLayout>
      <SEO
        title="Admission Process 2026-27 | Star Public School Meghwal Mathia"
        description="Explore the admission process, eligibility criteria, required documents, and online enquiry at Star Public School, Meghwal Mathia, Ramnagar, West Champaran."
        keywords={SCHOOL_KEYWORDS}
        canonicalPath="/admission"
        jsonLd={buildSchoolJsonLd({ path: '/admission' })}
      />

      <section className="relative overflow-hidden bg-slate-950 min-h-[380px] sm:min-h-[440px] lg:min-h-[480px] flex items-center py-20 sm:py-28 lg:py-36 text-white">
        <div className="absolute inset-0">
          <img
            src={siteMedia.admissionHero}
            alt="Admission at Star Public School"
            className="h-full w-full object-cover object-center filter brightness-[0.90] contrast-[1.05]"
            loading="eager"
            fetchPriority="high"
          />
          {/* Light, subtle blue overlay: soft on left for text clarity, clear across the rest so photo is vividly visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07172e]/80 via-[#0b2447]/45 to-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}

          <div className="max-w-3xl">
           

            <h1 className="text-4xl font-serif font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15]">
              Admission Process
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed">
              Step-by-step guidance for enrolling your child at {schoolProfile.name}.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 lg:py-16 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr] gap-8 lg:gap-14 items-start">
            <aside className="lg:sticky lg:top-24">
              {/* Header Box: Exact Scottish High Header Box in Theme Color */}
              <div className="bg-[#1d7ff2] rounded-t-lg py-4 px-6 text-center text-white shadow-xs">
                <h2 className="text-xl font-serif font-bold tracking-wide">
                  Admission
                </h2>
              </div>

              {/* Sidebar Menu Items: Clean white with chevron indicators */}
              <div className="bg-white rounded-b-lg border border-t-0 border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
                {SIDEBAR_ITEMS.map((item) => {
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm transition-all cursor-pointer ${
                        isActive
                          ? 'bg-sky-50/70 font-bold text-[#1d7ff2]'
                          : 'font-medium text-slate-600 hover:text-[#1d7ff2] hover:bg-slate-50'
                      }`}
                    >
                      {/* Triangle / Chevron indicator */}
                      <span
                        className={`text-xs font-black transition-transform ${
                          isActive ? 'text-[#1d7ff2] scale-110' : 'text-slate-400'
                        }`}
                      >
                        ▶
                      </span>
                      <span className="flex-1">{item.label}</span>
                    </button>
                  )
                })}
              </div>

            
            
            </aside>

            
            <div id="admission-content-area" className="scroll-mt-24 min-w-0">

          
              {activeTab === 'process' && (
                <div className="space-y-8 animate-fade-in">
                  {/* Heading with Cap Icon */}
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="material-symbols-outlined text-4xl text-[#1d7ff2]">school</span>
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-950 tracking-tight">
                      Process Of Admission
                    </h2>
                  </div>

                  {/* Intro paragraph */}
                  <p className="text-base leading-relaxed text-slate-600">
                    {schoolProfile.name}, Meghwal Mathia, Ramnagar, West Champaran is currently accepting admissions for the academic session 2026-27. Families seeking Nursery admission or admission to higher grades in West Champaran can follow the simple steps below to complete the admission process.
                  </p>

                  {/* Subtitle */}
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-950 pt-2">
                    School Admission with a Trusted Online Form Process
                  </h3>

                  {/* Step 1: Registration */}
                  <div className="space-y-3">
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-[#1d7ff2] font-black">Step 1:</span> Registration & Enquiry
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed text-slate-600 pl-1">
                      <li>Fill out the online school admission enquiry form available on our website.</li>
                      <li>Submit accurate student and guardian details for record creation.</li>
                      <li>After successful submission, our admissions counselor will connect with you via phone or SMS with guidance for the campus visit.</li>
                    </ol>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleTabClick('enquiry')}
                        className="gps-site-button text-xs py-2.5 px-4 cursor-pointer inline-flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">edit_note</span>
                        <span>Fill Online Enquiry Form Here</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Document Upload */}
                  <div className="space-y-3 pt-3">
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-[#1d7ff2] font-black">Step 2:</span> Document Upload & Verification
                    </h4>
                    <p className="text-sm text-slate-600">
                      Please upload or submit clear and valid copies of the following documents:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed text-slate-600 pl-1">
                      <li>Birth Certificate of the student (issued by Municipal authority or Panchayat)</li>
                      <li>Aadhaar Card of the student</li>
                      <li>Passport-size photographs of parents and student (4 copies)</li>
                      <li>Aadhaar Cards of parents / guardians</li>
                      <li>Previous school report card / marksheet (for Class 1 onwards)</li>
                      <li>Original Transfer Certificate (TC) from the previous recognised school</li>
                    </ol>
                  </div>

                  {/* File Requirements Box */}
                  <div className="rounded-xl border border-sky-100 bg-[#f8fbff] p-5 space-y-2">
                    <h4 className="text-sm font-serif font-bold text-slate-950">
                      File Requirements:
                    </h4>
                    <p className="text-xs text-slate-600">
                      <strong>Photographs:</strong> PNG / JPG, maximum 100 KB
                    </p>
                    <p className="text-xs text-slate-600">
                      <strong>Birth Certificate:</strong> PNG / JPG / PDF, maximum 300 KB
                    </p>
                    <p className="text-xs text-slate-600">
                      <strong>Academic Marksheet / TC:</strong> PDF / JPG, maximum 500 KB
                    </p>
                  </div>

                  {/* Step 3: Document Verification */}
                  <div className="space-y-3 pt-3">
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-[#1d7ff2] font-black">Step 3:</span> Campus Visit & Verification
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Once preliminary registration details are submitted, parents and applicants are invited for a friendly campus visit and original document verification session with our admissions team.
                    </p>
                  </div>

                  {/* Step 4: Student Interaction */}
                  <div className="space-y-3 pt-3">
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-[#1d7ff2] font-black">Step 4:</span> Student Interaction & Readiness Assessment
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-600">
                      An informal, friendly conversation is conducted with the student to evaluate foundational learning, reading readiness, and social development to ensure appropriate class placement.
                    </p>
                  </div>

                  {/* Step 5: Admission Confirmation */}
                  <div className="space-y-3 pt-3">
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-[#1d7ff2] font-black">Step 5:</span> Admission Confirmation & Session Commencement
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Upon successful verification and interaction, an official admission offer is confirmed upon fee completion. Parents receive the student welcome kit, routine, booklist, and session commencement schedule.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: ONLINE ENQUIRY FORM (Clean, Embedded, No Foreign Page Redirect) */}
              {activeTab === 'enquiry' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="material-symbols-outlined text-4xl text-[#1d7ff2]">edit_document</span>
                    <div>
                      <h2 className="text-3xl font-serif font-bold text-slate-950 tracking-tight">
                        Online Admission Enquiry
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Academic Session 2026 – 2027 • Fill details below to register interest
                      </p>
                    </div>
                  </div>

                  {enquirySubmitted ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-8 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        Enquiry Received Successfully!
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                        Thank you for your enquiry for <strong>{enquiryForm.studentName}</strong>. Our admissions office will contact you at <strong>{enquiryForm.phone}</strong> with next steps.
                      </p>
                      <div className="mt-6 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEnquirySubmitted(false)
                            setEnquiryForm({
                              studentName: '',
                              classSeeking: '',
                              dob: '',
                              gender: '',
                              guardianName: '',
                              phone: '',
                              email: '',
                              address: '',
                              message: '',
                            })
                          }}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Submit Another Enquiry
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('process')}
                          className="gps-site-button text-xs py-2 px-4"
                        >
                          View Admission Process
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleEnquirySubmit} className="rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5 bg-white shadow-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Student Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            name="studentName"
                            value={enquiryForm.studentName}
                            onChange={handleEnquiryChange}
                            className="gps-site-input"
                            placeholder="Enter student full name"
                            required
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Class Seeking Admission <span className="text-rose-500">*</span>
                          </label>
                          <ThemeSelect
                            value={enquiryForm.classSeeking}
                            onChange={(val) => setEnquiryForm((prev) => ({ ...prev, classSeeking: val }))}
                            options={CLASS_OPTIONS}
                            placeholder="Select Class..."
                            name="classSeeking"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            name="dob"
                            value={enquiryForm.dob}
                            onChange={handleEnquiryChange}
                            className="gps-site-input"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Gender
                          </label>
                          <select
                            name="gender"
                            value={enquiryForm.gender}
                            onChange={handleEnquiryChange}
                            className="gps-site-input"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Father / Guardian Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            name="guardianName"
                            value={enquiryForm.guardianName}
                            onChange={handleEnquiryChange}
                            className="gps-site-input"
                            placeholder="Enter guardian name"
                            required
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Phone / WhatsApp Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={enquiryForm.phone}
                            onChange={handleEnquiryChange}
                            className="gps-site-input"
                            placeholder="10-digit phone number"
                            required
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Email (optional)
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={enquiryForm.email}
                            onChange={handleEnquiryChange}
                            className="gps-site-input"
                            placeholder="example@gmail.com"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Residential Address / Village <span className="text-rose-500">*</span>
                          </label>
                          <input
                            name="address"
                            value={enquiryForm.address}
                            onChange={handleEnquiryChange}
                            className="gps-site-input"
                            placeholder="Enter village, town, or area"
                            required
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Any Question or Note
                          </label>
                          <textarea
                            name="message"
                            value={enquiryForm.message}
                            onChange={handleEnquiryChange}
                            className="gps-site-input min-h-24 resize-none"
                            placeholder="Optional: Any specific questions regarding bus route, timing, or documents"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">
                          <span className="text-rose-500">*</span> Marked fields are required.
                        </p>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="gps-site-button w-full sm:w-auto px-6 py-3 cursor-pointer"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Admission Enquiry'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 3: ELIGIBILITY CRITERIA */}
              {activeTab === 'eligibility' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="material-symbols-outlined text-4xl text-[#1d7ff2]">fact_check</span>
                    <h2 className="text-3xl font-serif font-bold text-slate-950 tracking-tight">
                      Eligibility Criteria (2026-27)
                    </h2>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-600">
                    Age criteria is calculated as of <strong>31st March 2026</strong> in compliance with the National Education Policy (NEP) and board guidelines:
                  </p>

                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-[#f8fbff] text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                        <tr>
                          <th className="px-5 py-3">Class Level</th>
                          <th className="px-5 py-3">Minimum Age Criteria</th>
                          <th className="px-5 py-3">Remarks / Requirements</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                        <tr>
                          <td className="px-5 py-3.5 font-bold text-slate-900">Playgroup</td>
                          <td className="px-5 py-3.5">2.5 to 3 Years</td>
                          <td className="px-5 py-3.5 text-xs text-slate-500">As of 31st March 2026</td>
                        </tr>
                        <tr>
                          <td className="px-5 py-3.5 font-bold text-slate-900">Nursery</td>
                          <td className="px-5 py-3.5">3+ Years</td>
                          <td className="px-5 py-3.5 text-xs text-slate-500">As of 31st March 2026</td>
                        </tr>
                        <tr>
                          <td className="px-5 py-3.5 font-bold text-slate-900">LKG</td>
                          <td className="px-5 py-3.5">4+ Years</td>
                          <td className="px-5 py-3.5 text-xs text-slate-500">As of 31st March 2026</td>
                        </tr>
                        <tr>
                          <td className="px-5 py-3.5 font-bold text-slate-900">UKG</td>
                          <td className="px-5 py-3.5">5+ Years</td>
                          <td className="px-5 py-3.5 text-xs text-slate-500">As of 31st March 2026</td>
                        </tr>
                        <tr>
                          <td className="px-5 py-3.5 font-bold text-slate-900">Class 1</td>
                          <td className="px-5 py-3.5">6+ Years</td>
                          <td className="px-5 py-3.5 text-xs text-slate-500">As of 31st March 2026</td>
                        </tr>
                        <tr>
                          <td className="px-5 py-3.5 font-bold text-slate-900">Class 2 to 10</td>
                          <td className="px-5 py-3.5">Passed Previous Grade</td>
                          <td className="px-5 py-3.5 text-xs text-slate-500">Valid TC & Marksheet mandatory</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: REQUIRED DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="material-symbols-outlined text-4xl text-[#1d7ff2]">description</span>
                    <h2 className="text-3xl font-serif font-bold text-slate-950 tracking-tight">
                      Required Documents Checklist
                    </h2>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-600">
                    Parents are requested to submit the following documents at the time of admission verification:
                  </p>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 p-5 bg-white">
                      <h4 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#1d7ff2] text-base">badge</span>
                        1. Student Identification Documents
                      </h4>
                      <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600 pl-1">
                        <li>Original and self-attested photocopy of Municipal/Panchayat Birth Certificate.</li>
                        <li>Student Aadhaar Card copy.</li>
                        <li>4 recent coloured passport-size photographs of the student.</li>
                      </ul>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-5 bg-white">
                      <h4 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#1d7ff2] text-base">school</span>
                        2. Academic Records (For Class 1 onwards)
                      </h4>
                      <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600 pl-1">
                        <li>Previous school report card / marksheet.</li>
                        <li>Original Transfer Certificate (TC) counter-signed by education authority.</li>
                        <li>Character Certificate (for Class 9 & 10 admissions).</li>
                      </ul>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-5 bg-white">
                      <h4 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#1d7ff2] text-base">home</span>
                        3. Parent & Guardian Credentials
                      </h4>
                      <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600 pl-1">
                        <li>Photocopy of Father and Mother Aadhaar Cards.</li>
                        <li>Residential address verification (Voter card / Electricity bill).</li>
                        <li>Active mobile numbers for official SMS and WhatsApp communication.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ADMISSIONS FAQ'S */}
              {activeTab === 'faqs' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="material-symbols-outlined text-4xl text-[#1d7ff2]">quiz</span>
                    <h2 className="text-3xl font-serif font-bold text-slate-950 tracking-tight">
                      Admissions FAQ's
                    </h2>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-600">
                    Frequently asked questions about campus visits, office support, and admission readiness:
                  </p>

                  <div className="space-y-3 pt-2">
                    {admissionFaqs.map((item, index) => {
                      const isOpen = openFaqIndex === index
                      return (
                        <div
                          key={item.question}
                          className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                            isOpen
                              ? 'border-[#1d7ff2]/50 bg-white shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleFaq(index)}
                            className="flex w-full items-center justify-between gap-4 p-4 text-left cursor-pointer"
                            aria-expanded={isOpen}
                          >
                            <span className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                              {item.question}
                            </span>
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                                isOpen
                                  ? 'bg-[#1d7ff2] text-white rotate-45'
                                  : 'bg-slate-100 text-[#1d7ff2]'
                              }`}
                            >
                              <span className="material-symbols-outlined text-base leading-none">add</span>
                            </div>
                          </button>

                          <div
                            className={`overflow-hidden transition-all duration-200 ease-in-out ${
                              isOpen ? 'max-h-60 opacity-100 px-4 pb-4' : 'max-h-0 opacity-0 px-4 pb-0'
                            }`}
                          >
                            <p className="text-sm leading-relaxed text-slate-600 pt-2 border-t border-slate-100">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: GUIDELINES & POLICIES */}
              {activeTab === 'guidelines' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="material-symbols-outlined text-4xl text-[#1d7ff2]">policy</span>
                    <h2 className="text-3xl font-serif font-bold text-slate-950 tracking-tight">
                      Guidelines & Policies
                    </h2>
                  </div>

                  <div className="space-y-4 text-sm leading-relaxed text-slate-600">
                    <p>
                      <strong>1. Seat Allocation:</strong> Admission is strictly subject to vacancy in the applied grade. Priority is extended to siblings of currently enrolled students.
                    </p>
                    <p>
                      <strong>2. Information Accuracy:</strong> Submission of incorrect or falsified documents/information will lead to immediate cancellation of admission.
                    </p>
                    <p>
                      <strong>3. Fee Completion:</strong> Admission is considered confirmed only upon timely payment of the prescribed registration and session fees within the communicated date.
                    </p>
                    <p>
                      <strong>4. Office Consultations:</strong> Campus visits and document verification are held during school working hours ({schoolProfile.hoursShort}).
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 7: FEE STRUCTURE */}
              {activeTab === 'fee' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="material-symbols-outlined text-4xl text-[#1d7ff2]">payments</span>
                    <h2 className="text-3xl font-serif font-bold text-slate-950 tracking-tight">
                      Fee Structure & Payment
                    </h2>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-600">
                    {schoolProfile.name} maintains a transparent, moderate fee structure with convenient installment and online payment facilities for parents.
                  </p>

                  <div className="rounded-xl border border-sky-100 bg-[#f8fbff] p-6 space-y-3">
                    <h4 className="text-base font-bold text-slate-900">
                      Online Public Fee Payment Portal
                    </h4>
                    <p className="text-xs text-slate-600">
                      Parents can pay monthly school fees, view receipts, and clear dues directly through our secure school fee portal.
                    </p>
                    <div className="pt-2">
                      <Link
                        to="/pay-fees"
                        className="gps-site-button text-xs py-2.5 px-4 inline-flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">credit_card</span>
                        <span>Go to Fee Payment Portal</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  )
}

export default Admission
