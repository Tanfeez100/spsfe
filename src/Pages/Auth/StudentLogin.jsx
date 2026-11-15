import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { emitToast, login, setSession } from '../../Api/auth'
import SEO from '../../Components/SEO/SEO'
import { sharedImages, campusPhotos } from '../../assets/websiteImages'
import { schoolProfile } from '../Website/siteContent'

function StudentLogin() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    rollNumber: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
      const response = await login(formData.rollNumber.trim(), formData.password)
      const userRole = response?.user?.role
      const loginType = userRole === 'student' ? 'student' : 'all'
      setSession(response, loginType)

      if (userRole && userRole !== 'student') {
        emitToast('warning', 'Staff account detected. Redirecting to standard dashboard.', 'Role Notice')
      } else {
        emitToast('success', 'Student session authenticated successfully', 'Welcome')
      }

      navigate('/dashboard')
    } catch (err) {
      const message = err?.message || 'Student login failed. Please verify roll number and password.'
      setError(message)
      emitToast('error', message, 'Login Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] text-slate-900 font-['Manrope'] selection:bg-slate-900 selection:text-white">
      <SEO
        title="Student Portal Login"
        description="Secure student login for Star Public School ERP."
        canonicalPath="/student-login"
      />

      <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
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

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
            <span>Staff / Teacher Login</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 lg:py-16">
        <div className="w-full max-w-5xl rounded-3xl bg-white border border-slate-200 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.07)] overflow-hidden grid lg:grid-cols-12">
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
                Student Terminal
              </div>
              <h2 className="text-2xl xl:text-3xl font-extrabold font-['Lexend'] tracking-tight text-white leading-tight">
                Academic progress, attendance & results.
              </h2>
              <p className="text-xs xl:text-sm text-slate-400 leading-relaxed font-normal">
                Log in with your assigned roll number or student username to view reports and notices.
              </p>
            </div>

            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                Verified Student Access
              </span>
              <span className="text-slate-500">Star Public School ERP</span>
            </div>
          </div>

          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            <div>
              <span className="text-[11px] font-bold tracking-widest text-slate-700 uppercase">
                Student Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Lexend'] mt-1">
                Student Sign In
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Enter your roll number and password to access your student records.
              </p>
            </div>

            {error ? (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0 mt-0.5">
                  error
                </span>
                <span className="leading-snug">{error}</span>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Roll Number or Username
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-blue-600 pointer-events-none">
                    badge
                  </span>
                  <input
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 101 or roll number"
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
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter student password"
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Student Dashboard</span>
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
