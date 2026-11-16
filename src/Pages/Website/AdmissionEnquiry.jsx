import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../../Components/SEO/SEO'
import ThemeSelect from '../../Components/Website/ThemeSelect'
import { schoolProfile, siteMedia } from './siteContent'

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

function AdmissionEnquiry() {
  const [form, setForm] = useState({
    studentName: '',
    dob: '',
    gender: '',
    classSeeking: '',
    previousSchool: '',
    guardianName: '',
    motherName: '',
    phone: '',
    email: '',
    address: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 600)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eaf4ff] via-[#f4f9ff] to-[#f8fbff] text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Online Admission Enquiry Form 2026-27 | Star Public School"
        description="Submit an online admission enquiry for Star Public School, Meghwal Mathia, West Champaran. Open for Playgroup to Class 10."
        canonicalPath="/admission-enquiry"
      />

      <div className="mx-auto max-w-3xl">
        {/* Top School Header Bar */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3">
            <img
              src={siteMedia.logo}
              alt={schoolProfile.name}
              className="h-14 w-14 sm:h-16 sm:w-16 object-contain drop-shadow-sm"
            />
            <div className="text-left">
              <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-[#1d5fb8]">
                English Medium Co-Educational School
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
                {schoolProfile.name}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {schoolProfile.address}
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="rounded-3xl border border-sky-100 bg-white p-6 sm:p-10 shadow-2xl shadow-sky-900/10">
          {/* Card Header Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-[#1d7ff2]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Session 2026 – 2027
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-950">
                Online Admission Enquiry
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Fill out the form below. Our admissions desk will review your details and contact you promptly.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2 rounded-2xl bg-[#f0f7ff] border border-sky-100 p-3 text-xs text-slate-600">
              <span className="material-symbols-outlined text-[#1d7ff2]">support_agent</span>
              <div>
                <p className="font-bold text-slate-900 leading-tight">Helpline Desk</p>
                <a href={schoolProfile.phoneHref} className="text-[#1d7ff2] font-semibold hover:underline">
                  {schoolProfile.phone}
                </a>
              </div>
            </div>
          </div>

          {submitted ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              <h3 className="mt-6 text-2xl font-black text-slate-950">
                Enquiry Submitted Successfully!
              </h3>
              <p className="mt-3 max-w-md mx-auto text-sm leading-relaxed text-slate-600">
                Thank you for your interest in <strong>{schoolProfile.name}</strong>. Our admissions counselor will contact you at <strong>{form.phone}</strong> regarding campus visit timing and next steps.
              </p>

              <div className="mt-8 p-5 rounded-2xl border border-sky-100 bg-[#f8fbff] max-w-md mx-auto text-left text-xs text-slate-600 space-y-2">
                <p className="font-bold text-slate-900 text-sm border-b border-sky-100 pb-2">
                  Enquiry Summary:
                </p>
                <p><strong className="text-slate-800">Student Name:</strong> {form.studentName}</p>
                <p><strong className="text-slate-800">Class Seeking:</strong> {form.classSeeking || 'Not specified'}</p>
                <p><strong className="text-slate-800">Guardian Name:</strong> {form.guardianName}</p>
                <p><strong className="text-slate-800">Contact Number:</strong> {form.phone}</p>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false)
                    setForm({
                      studentName: '',
                      dob: '',
                      gender: '',
                      classSeeking: '',
                      previousSchool: '',
                      guardianName: '',
                      motherName: '',
                      phone: '',
                      email: '',
                      address: '',
                      message: '',
                    })
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
                >
                  Submit Another Enquiry
                </button>
                <a
                  href="/"
                  className="gps-site-button"
                >
                  Return to Website
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: Student Information */}
              <div>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                  <span className="material-symbols-outlined text-[#1d7ff2] text-xl">person</span>
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-900">
                    1. Student Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Student Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="studentName"
                      value={form.studentName}
                      onChange={handleChange}
                      className="gps-site-input"
                      placeholder="Enter student's full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Class Seeking Admission <span className="text-rose-500">*</span>
                    </label>
                    <ThemeSelect
                      value={form.classSeeking}
                      onChange={(val) => setForm((prev) => ({ ...prev, classSeeking: val }))}
                      options={CLASS_OPTIONS}
                      placeholder="Select Class..."
                      name="classSeeking"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                      className="gps-site-input"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="gps-site-input"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Previous School (if any)
                    </label>
                    <input
                      name="previousSchool"
                      value={form.previousSchool}
                      onChange={handleChange}
                      className="gps-site-input"
                      placeholder="e.g. Previous school name / class"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Parent / Guardian Information */}
              <div className="pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                  <span className="material-symbols-outlined text-[#1d7ff2] text-xl">family_restroom</span>
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-900">
                    2. Parent / Guardian Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Father / Guardian Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="guardianName"
                      value={form.guardianName}
                      onChange={handleChange}
                      className="gps-site-input"
                      placeholder="Enter father or guardian name"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Mother Name
                    </label>
                    <input
                      name="motherName"
                      value={form.motherName}
                      onChange={handleChange}
                      className="gps-site-input"
                      placeholder="Enter mother name"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Mobile / WhatsApp Phone <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      className="gps-site-input"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Email Address (optional)
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="gps-site-input"
                      placeholder="example@gmail.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Residential Address / Village <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="gps-site-input"
                      placeholder="Enter village, town, or street address"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Additional Message or Query
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      className="gps-site-input min-h-24 resize-none"
                      placeholder="Any specific questions regarding timing, transport, or admission documents?"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  <span className="text-rose-500">*</span> Fields marked with asterisk are mandatory.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="gps-site-button w-full sm:w-auto px-8 py-3.5 justify-center text-base font-black shadow-lg shadow-blue-600/20"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl">send</span>
                      Submit Admission Enquiry
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Support Info */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {schoolProfile.name}. All Rights Reserved.</p>
          <p className="mt-1">
            Need urgent assistance? Call our desk directly at{' '}
            <a href={schoolProfile.phoneHref} className="text-[#1d7ff2] font-bold hover:underline">
              {schoolProfile.phone}
            </a>{' '}
            or email{' '}
            <a href={schoolProfile.emailHref} className="text-[#1d7ff2] font-bold hover:underline">
              {schoolProfile.email}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdmissionEnquiry

