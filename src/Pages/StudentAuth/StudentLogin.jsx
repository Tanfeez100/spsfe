import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setSession } from '../../Api/auth'
import { studentLogin, studentSignup } from '../../Api/studentAuth'
import SEO from '../../Components/SEO/SEO'
import { sharedImages, campusPhotos } from '../../assets/websiteImages'
import { schoolProfile } from '../Website/siteContent'

function StudentLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    student_id: '',
    username: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const updateForm = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'signup') {
        await studentSignup({
          student_id: form.student_id.trim(),
          username: form.username.trim(),
          password: form.password,
        })
        setMessage('Student account created successfully. Please sign in with your username & password.')
        setMode('login')
        setForm((prev) => ({ ...prev, student_id: '', password: '' }))
        return
      }

      const response = await studentLogin(form.username.trim(), form.password)
      setSession(response, 'student')
      navigate('/attendance', { replace: true })
    } catch (err) {
      setError(err?.message || 'Authentication request failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] text-slate-900 font-['Manrope'] selection:bg-slate-900 selection:text-white">
      <SEO
        title="Student Portal Login"
        description="Access student attendance, academic results, and notices at Star Public School."
        canonicalPath="/student-login"
      />

      {/* Minimal Top Navigation */}
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
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
                  Student Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block mt-0.5">
                Attendance & Performance Access
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              <span>Staff / Teacher Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 lg:py-16">
        <div className="w-full max-w-5xl rounded-3xl bg-white border border-slate-200 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.07)] overflow-hidden grid lg:grid-cols-12 transition-all">
          
          {/* Left Column: Institutional Brand Showcase */}
          <div className="hidden lg:flex lg:col-span-5 bg-[#0c1322] text-white p-10 flex-col justify-between relative overflow-hidden">
            <div
              className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-25 blur-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)',
              }}
            />
            <img
              src={campusPhotos[9]?.src}
              alt="School Campus"
              className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-luminosity pointer-events-none"
            />

            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                Student & Parent Terminal
              </div>
              <h2 className="text-2xl xl:text-3xl font-extrabold font-['Lexend'] tracking-tight text-white leading-tight">
                Track your academic progress in real time.
              </h2>
              <p className="text-xs xl:text-sm text-slate-400 leading-relaxed font-normal">
                Check daily attendance records, exam results, timetables and school announcements in one secure place.
              </p>
            </div>

            <div className="relative z-10 space-y-4 my-8">
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[19px]">fact_check</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Live Attendance Logs</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">View month-by-month attendance statistics and leaves.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[19px]">grade</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Examination Results</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Access verified term marks and progress reports anytime.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[19px]">calendar_month</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Class Timetable</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Stay updated with class schedules and holiday notices.</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                Student Portal
              </span>
              <span className="text-slate-500">Star Public School ERP</span>
            </div>
          </div>

          {/* Right Column: Clean Auth Card */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            <div>
              <span className="text-[11px] font-bold tracking-widest text-slate-700 uppercase">
                Student Access
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Lexend'] mt-1">
                {mode === 'signup' ? 'Create student account' : 'Sign in to Student Portal'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {mode === 'signup'
                  ? 'Register your student credentials using your official student ID.'
                  : 'Enter your admission username and password to continue.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="mt-6 p-1.5 bg-blue-50/70 rounded-2xl flex items-center border border-blue-100">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError('')
                  setMessage('')
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  mode === 'login'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 hover:text-blue-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setError('')
                  setMessage('')
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  mode === 'signup'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 hover:text-blue-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Create Account
              </button>
            </div>

            {/* Alerts */}
            {error ? (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0 mt-0.5">
                  error
                </span>
                <span className="leading-snug">{error}</span>
              </div>
            ) : null}

            {message ? (
              <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-blue-500 shrink-0 mt-0.5">
                  check_circle
                </span>
                <span className="leading-snug">{message}</span>
              </div>
            ) : null}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {mode === 'signup' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Student ID
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-blue-600 pointer-events-none">
                      badge
                    </span>
                    <input
                      name="student_id"
                      value={form.student_id}
                      onChange={updateForm}
                      required
                      placeholder="Enter student UUID from school card"
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-slate-900 text-sm rounded-xl py-3 pl-11 pr-4 transition-all duration-200 outline-none placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-blue-600 pointer-events-none">
                    person
                  </span>
                  <input
                    name="username"
                    value={form.username}
                    onChange={updateForm}
                    required
                    placeholder="e.g. admission or roll username"
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-slate-900 text-sm rounded-xl py-3 pl-11 pr-4 transition-all duration-200 outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-blue-600 pointer-events-none">
                    lock
                  </span>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={updateForm}
                    required
                    placeholder="Enter account password"
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
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signup' ? 'Create Student Account' : 'Sign in to Student Dashboard'}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Are you school staff or faculty?</span>
              <Link
                to="/login"
                className="font-bold text-slate-900 hover:text-blue-600 inline-flex items-center gap-1 transition-colors"
              >
                Staff Login
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-5 text-center text-xs text-slate-500 font-medium border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} {schoolProfile.name}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <Link to="/privacy-policy" className="hover:text-slate-800 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-slate-800 transition-colors">
              Need Help?
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default StudentLogin
