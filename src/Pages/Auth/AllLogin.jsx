import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { emitToast, login, setSession } from '../../Api/auth'
import SEO from '../../Components/SEO/SEO'
import { schoolProfile, siteMedia } from '../Website/siteContent'
import { aboutPhotos, campusPhotos } from '../../assets/websiteImages'

function AllLogin() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('admin') // 'admin' | 'teacher'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login(formData.email, formData.password)
      const userRole = response?.user?.role
      const loginType = userRole === 'student' ? 'student' : 'all'

      setSession(response, loginType)
      emitToast(
        'success',
        `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} login successful`,
        'Welcome'
      )
      navigate('/dashboard')
    } catch (err) {
      const message =
        err?.message || `${selectedRole === 'admin' ? 'Admin' : 'Teacher'} login failed. Please check your credentials.`
      setError(message)
      emitToast('error', message, 'Login Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col lg:flex-row overflow-x-hidden">
      <SEO
        title="Admin & Faculty Login"
        description="Secure administrator and teacher portal login for Star Public School."
        canonicalPath="/login"
      />

      {/* LEFT HALF (Adha Part Left): Campus Photo & School Identity */}
      <section className="relative w-full lg:w-1/2 min-h-[480px] lg:min-h-screen bg-[#07172e] flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 text-white overflow-hidden text-center">
        {/* Background Campus Image */}
        <img
          src={aboutPhotos.hero || campusPhotos[22]?.src || siteMedia.homeCulture}
          alt="Star Public School Campus"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 scale-100 hover:scale-105"
          loading="eager"
          decoding="async"
        />

        {/* Themed Gradient Overlay for contrast and Star theme */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#061426] via-[#092244]/80 to-[#0b2752]/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(29,127,242,0.3),transparent_70%)] pointer-events-none" />

        {/* Content on Image - Centered */}
        <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center text-center">
          {/* School Logo & Name (Centered Directly Above Official Portal) */}
          <Link
            to="/"
            className="group mb-5 inline-flex flex-col sm:flex-row items-center gap-3.5 rounded-3xl border border-white/20 bg-white/10 px-5 sm:px-6 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/15 hover:border-white/35"
            title="Return to Website Home"
          >
            <div className="rounded-full bg-white p-1.5 shadow-md ring-2 ring-amber-400/70 shrink-0">
              <img
                src={siteMedia.logo}
                alt={schoolProfile.name}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
              />
            </div>
            <div className="text-center sm:text-left">
              <span className="block font-serif font-black text-white text-lg sm:text-xl leading-tight tracking-tight drop-shadow-sm">
                {schoolProfile.name}
              </span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#38bdf8] leading-tight mt-1">
                Harinagar, West Champaran
              </span>
            </div>
          </Link>

          {/* Official Portal Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-sky-200 backdrop-blur-sm shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Official Portal
          </div>

          {/* Heading */}
          <h1 className="mt-5 text-2xl sm:text-3xl lg:text-[2.2rem] font-serif font-black text-white leading-tight">
            Nurturing Tomorrow’s Leaders with Academic Excellence &amp; Discipline.
          </h1>

          {/* Subtitle / Paragraph */}
          <p className="mt-3.5 text-xs sm:text-sm text-sky-100/90 leading-relaxed font-normal max-w-md mx-auto">
            Star Public School provides a secure, future-ready environment for our educators and administrators to monitor student growth, coordinate classes, and lead with purpose.
          </p>

          {/* Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-sky-200/90">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-1.5 backdrop-blur-xs border border-white/15 shadow-xs">
              <span className="material-symbols-outlined text-sm text-[#38bdf8]">verified</span>
              CBSE Pattern Curriculum
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-1.5 backdrop-blur-xs border border-white/15 shadow-xs">
              <span className="material-symbols-outlined text-sm text-[#38bdf8]">shield</span>
              Disciplined Environment
            </span>
          </div>
        </div>
      </section>

      {/* RIGHT HALF (Adha Part Right): Toggle & Login Portal */}
      <section className="relative w-full lg:w-1/2 min-h-screen bg-white flex flex-col justify-center items-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-md mx-auto pt-10 sm:pt-14 lg:pt-0">
          {/* Back to Home Link */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1d7ff2] transition-colors"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to Website</span>
            </Link>

            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Secure SSL 256-Bit
            </span>
          </div>

          {/* Portal Title & Subtitle */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-[#eaf4ff] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#1d7ff2]">
              <span className="material-symbols-outlined text-sm">lock</span>
              Staff Access Only
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-serif font-black text-slate-950 leading-tight">
              Sign In to Your Account
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Select your role below to access administrative tools or teacher workspace.
            </p>
          </div>

          {/* Toggle Switch (Admin | Teacher) */}
          <div className="mt-6 rounded-2xl bg-[#f1f5f9] p-1.5 border border-slate-200/80 grid grid-cols-2 gap-1.5">
            {/* Admin Tab */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin')
                setError('')
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-gradient-to-r from-[#0b1d3a] via-[#0f3f99] to-[#164ea6] text-white shadow-md shadow-blue-900/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
              <span>Admin Portal</span>
            </button>

            {/* Teacher Tab */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('teacher')
                setError('')
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                selectedRole === 'teacher'
                  ? 'bg-gradient-to-r from-[#0b1d3a] via-[#0f3f99] to-[#164ea6] text-white shadow-md shadow-blue-900/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <span className="material-symbols-outlined text-lg">co_present</span>
              <span>Teacher Portal</span>
            </button>
          </div>

          {/* Dynamic Role Description Box */}
          <div className="mt-3.5 flex items-center gap-2.5 rounded-xl bg-sky-50/70 border border-sky-100 p-2.5 text-xs text-slate-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1d7ff2] text-white shadow-xs">
              <span className="material-symbols-outlined text-base">
                {selectedRole === 'admin' ? 'shield_person' : 'edit_note'}
              </span>
            </span>
            <span className="leading-snug">
              {selectedRole === 'admin'
                ? 'Full administrative control: fee manager, student data, teachers & reports.'
                : 'Teacher workspace: marks entry, attendance registers, and academic updates.'}
            </span>
          </div>

          {/* Error Message */}
          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs sm:text-sm text-rose-700 flex items-start gap-2.5 shadow-xs">
              <span className="material-symbols-outlined text-base text-rose-500 shrink-0 mt-0.5">
                error
              </span>
              <span className="leading-relaxed">{error}</span>
            </div>
          ) : null}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Email / Username Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {selectedRole === 'teacher' ? 'Email or Username' : 'Administrator Email'}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  {selectedRole === 'teacher' ? 'person' : 'mail'}
                </span>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type={selectedRole === 'teacher' ? 'text' : 'email'}
                  required
                  placeholder={
                    selectedRole === 'teacher'
                      ? 'Enter teacher email or username'
                      : 'admin@starpublicschool.edu'
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1d7ff2] focus:outline-none focus:ring-4 focus:ring-[#1d7ff2]/15 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  lock
                </span>
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your account password"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1d7ff2] focus:outline-none focus:ring-4 focus:ring-[#1d7ff2]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[20px] select-none">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0b1d3a] via-[#0f3f99] to-[#1d7ff2] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/25 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <span>Log In as {selectedRole === 'admin' ? 'Administrator' : 'Teacher'}</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </div>

            {/* Student Portal Link */}
            <div className="pt-4 text-center border-t border-slate-100">
              <p className="text-xs sm:text-sm text-slate-600">
                Are you a student?{' '}
                <Link
                  to="/student-login"
                  className="font-bold text-[#1d7ff2] hover:text-[#0f3f99] underline decoration-[#1d7ff2]/40 hover:decoration-[#0f3f99] transition-colors"
                >
                  Open Student Portal
                </Link>
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

export default AllLogin
