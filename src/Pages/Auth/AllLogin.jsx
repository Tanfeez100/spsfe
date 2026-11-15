import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { emitToast, login, setSession } from '../../Api/auth'
import SEO from '../../Components/SEO/SEO'
import { sharedImages, campusPhotos } from '../../assets/websiteImages'
import { schoolProfile } from '../Website/siteContent'

function AllLogin() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('admin')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login(formData.email.trim(), formData.password)
      const userRole = response?.user?.role
      const loginType = userRole === 'student' ? 'student' : 'all'

      setSession(response, loginType)
      const roleName = selectedRole === 'admin' ? 'Administrator' : 'Faculty'
      emitToast('success', `${roleName} session authenticated successfully`, 'Welcome Back')
      navigate('/dashboard')
    } catch (err) {
      const message =
        err?.message ||
        `Authentication failed. Please verify your ${
          selectedRole === 'admin' ? 'admin email' : 'teacher credentials'
        } and password.`
      setError(message)
      emitToast('error', message, 'Login Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] text-slate-900 font-['Manrope'] selection:bg-slate-900 selection:text-white">
      <SEO
        title="Portal Login"
        description="Secure admin and faculty terminal for Star Public School ERP."
        canonicalPath="/login"
      />

      {/* Minimalist Top Navigation */}
      <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform duration-200">
              <img
                src={sharedImages.schoolLogo}
                alt="Star Public School Crest"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Lexend'] font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                  {schoolProfile.name}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-700 border border-slate-200">
                  ERP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block mt-0.5">
                Faculty & Administration Terminal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/student-login"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">school</span>
              Student Portal
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span className="hidden xs:inline">Website</span> Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 lg:py-16">
        <div className="w-full max-w-5xl rounded-3xl bg-white border border-slate-200 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.07)] overflow-hidden grid lg:grid-cols-12 transition-all">
          
          {/* Left Column: Premium Institutional Showcase (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 bg-[#0c1322] text-white p-10 flex-col justify-between relative overflow-hidden">
            {/* Ambient Lighting Gradients */}
            <div
              className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-25 blur-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(circle, #38bdf8 0%, transparent 70%)',
              }}
            />
            {/* Subtle background photo overlay */}
            <img
              src={campusPhotos[0]?.src}
              alt="School Campus"
              className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-luminosity pointer-events-none"
            />

            {/* Top Branding Section */}
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                Official School Terminal
              </div>
              <h2 className="text-2xl xl:text-3xl font-extrabold font-['Lexend'] tracking-tight text-white leading-tight">
                Academic discipline, precision & trust.
              </h2>
              <p className="text-xs xl:text-sm text-slate-400 leading-relaxed font-normal">
                Seamless campus operations for staff, teachers, admissions and student lifecycle management.
              </p>
            </div>

            {/* Middle Feature Highlights */}
            <div className="relative z-10 space-y-4 my-8">
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[19px]">admin_panel_settings</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Granular Access Control</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Role-based privileges tailored for administration & faculty.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[19px]">analytics</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Live Academic Records</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Real-time attendance logs, report cards, fees and schedules.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
                <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[19px]">lock</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">256-Bit SSL Protection</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">End-to-end encrypted session and secured institutional database.</p>
                </div>
              </div>
            </div>

            {/* Bottom Status & Security Note */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                System Operational
              </span>
              <span className="text-slate-500">v2.4 Enterprise</span>
            </div>
          </div>

          {/* Right Column: Clean Minimalist Auth Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            
            {/* Form Header */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-bold tracking-wider text-blue-700 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                Portal Authentication
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Lexend'] mt-2">
                Sign in to your account
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Select your assigned role to access your personalized workstation.
              </p>
            </div>

            {/* Role Switcher Pill Tabs */}
            <div className="mt-6 p-1.5 bg-blue-50/70 rounded-2xl flex items-center border border-blue-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin')
                  setError('')
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  selectedRole === 'admin'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 hover:text-blue-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                Administrator
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('teacher')
                  setError('')
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  selectedRole === 'teacher'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 hover:text-blue-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">co_present</span>
                Teacher / Faculty
              </button>
            </div>

            {/* Dynamic Role Sub-context */}
            <div className="mt-2.5 px-1 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="material-symbols-outlined text-[15px] text-blue-500">info</span>
              <span>
                {selectedRole === 'admin'
                  ? 'Admin access: Student admissions, fee vouchers, examinations & staff records.'
                  : 'Faculty access: Daily attendance marking, exam marks upload & syllabus tracking.'}
              </span>
            </div>

            {/* Error Message Notice */}
            {error ? (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0 mt-0.5">
                  error
                </span>
                <span className="leading-snug">{error}</span>
              </div>
            ) : null}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              
              {/* Email / Username Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {selectedRole === 'teacher' ? 'Email or Teacher Username' : 'Administrator Email'}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-blue-600 pointer-events-none">
                    {selectedRole === 'teacher' ? 'person' : 'mail'}
                  </span>
                  <input
                    name="email"
                    type={selectedRole === 'teacher' ? 'text' : 'email'}
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder={
                      selectedRole === 'teacher'
                        ? 'e.g. teacher@starpublicschool.com or username'
                        : 'e.g. admin@starpublicschool.com'
                    }
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-slate-900 text-sm rounded-xl py-3 pl-11 pr-4 transition-all duration-200 outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-blue-600 pointer-events-none">
                    lock
                  </span>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your security password"
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-slate-900 text-sm rounded-xl py-3 pl-11 pr-11 transition-all duration-200 outline-none placeholder:text-slate-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[19px] select-none">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Utility Row: Remember Me */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-slate-600">Keep me logged in for 30 days</span>
                </label>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3.5 px-5 rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[19px]">
                      progress_activity
                    </span>
                    <span>Authenticating credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in as {selectedRole === 'admin' ? 'Administrator' : 'Faculty'}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Student Portal Clean Gateway Banner */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/70 flex items-center justify-between gap-3 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                    <span className="material-symbols-outlined text-[20px]">school</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Student or Parent Access</p>
                    <p className="text-[11px] text-slate-500">View live attendance, reports & fees</p>
                  </div>
                </div>
                <Link
                  to="/student-login"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline shrink-0"
                >
                  Student Portal
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Minimalist Professional Footer */}
      <footer className="w-full py-5 text-center text-xs text-slate-500 font-medium border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} {schoolProfile.name}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <Link to="/privacy-policy" className="hover:text-slate-800 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-slate-800 transition-colors">
              Contact Desk
            </Link>
            <span>•</span>
            <Link to="/pay-fees" className="hover:text-slate-800 transition-colors">
              Pay Online Fees
            </Link>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal ? (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 font-['Lexend']">
                  Credential Assistance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              For security compliance and identity protection, administrator and faculty passwords can only be updated or reset directly via the Star Public School Administrative Desk.
            </p>

            <div className="space-y-2 pt-1">
              <a
                href={schoolProfile.phoneHref}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-slate-600">call</span>
                  <span className="text-xs font-bold text-slate-800">{schoolProfile.phone}</span>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 group-hover:underline">
                  Call Desk
                </span>
              </a>

              <a
                href={schoolProfile.emailHref}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-slate-600">mail</span>
                  <span className="text-xs font-bold text-slate-800">{schoolProfile.email}</span>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 group-hover:underline">
                  Send Email
                </span>
              </a>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                Got it, Return to Login
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  )
}

export default AllLogin
