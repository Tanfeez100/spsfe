import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { emitToast, login, setSession } from '../../Api/auth'
import SEO from '../../Components/SEO/SEO'
import WebsiteFooter from '../../Components/WebsiteFooter'
import WebsiteHeader from '../../Components/WebsiteHeader'
import { aboutPhotos } from '../../assets/websiteImages'

function AllLogin() {
  const navigate = useNavigate()
  const loginRoles = [
    {
      id: 'admin',
      title: 'Admin',
      icon: 'admin_panel_settings',
      tag: 'Full control',
      description: 'Manage students, fees, subjects, teachers and reports.',
    },
    {
      id: 'teacher',
      title: 'Teacher',
      icon: 'co_present',
      tag: 'Class work',
      description: 'Open teacher tools for marks, attendance and records.',
    },
  ]
  const [selectedRole, setSelectedRole] = useState('admin')
  const [formData, setFormData] = useState({
    email: '',
    rollNumber: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      emitToast('success', `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} login successful`, 'Welcome')
      navigate('/dashboard')
    } catch (err) {
      const message = err?.message || `${selectedRole} login failed. Please check your credentials.`
      setError(message)
      emitToast('error', message, 'Login Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gps-auth-page min-h-screen text-slate-900">
      <SEO
        title="Login"
        description="Secure admin and teacher login for Star Public School."
        canonicalPath="/login"
      />
      <WebsiteHeader />
      <main className="pb-10 pt-[122px] sm:pt-[132px] lg:pt-[138px]">
        <div className="gps-shell">
          <div className="gps-grid lg:grid-cols-[1.02fr_0.98fr]">
            <article className="gps-auth-card p-6 sm:p-8">
              <span className="gps-auth-tag">School Portal Login</span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
                Choose your portal and continue securely
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                Admin and teacher access starts here. Students use the dedicated student portal.
              </p>

              <div className="mt-6 overflow-hidden rounded-2xl border border-sky-100">
                <img src={aboutPhotos.secondary} alt="Students in class" loading="eager" fetchPriority="high" decoding="async" className="h-64 w-full object-cover sm:h-72" />
              </div>

            </article>

            <article className="gps-auth-card p-6 sm:p-8">
              <div className="grid gap-3 sm:grid-cols-2">
                {loginRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role.id)
                      setError('')
                    }}
                    className={`gps-auth-card-soft min-h-28 p-4 text-left transition-all ${
                      selectedRole === role.id ? 'ring-2 ring-sky-500 bg-sky-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl text-sky-700">{role.icon}</span>
                    <p className="mt-3 text-base font-bold text-sky-700">{role.title}</p>
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{role.tag}</p>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <span className="material-symbols-outlined">{loginRoles.find((role) => role.id === selectedRole)?.icon}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                    {loginRoles.find((role) => role.id === selectedRole)?.title} Login
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {loginRoles.find((role) => role.id === selectedRole)?.description}
                  </p>
                </div>
              </div>

              {error ? (
                <div className="mt-4 rounded-xl border border-red-300/40 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    Email
                  </span>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      mail
                    </span>
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="gps-input gps-auth-input pl-11"
                      placeholder="Enter your email"
                      type="email"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Password</span>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      lock
                    </span>
                    <input
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="gps-input gps-auth-input pl-11"
                      placeholder="Enter your password"
                      type="password"
                      required
                    />
                  </div>
                </label>

                {/* <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" className="h-4 w-4 rounded border-cyan-300/50 bg-transparent" />
                    Remember me
                  </label>
                  <a href="#" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">
                    Forgot Password?
                  </a>
                </div> */}

                <button type="submit" disabled={loading} className="gps-auth-button mt-2 mx-auto inline-flex w-full sm:w-auto sm:min-w-[220px] disabled:opacity-60">
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-base">sync</span>
                      Logging in...
                    </>
                  ) : (
                    <>
                      {loginRoles.find((role) => role.id === selectedRole)?.title} Log In
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </>
                  )}
                </button>
                <p className="pt-2 text-center text-sm text-slate-600">
                  Student login ke liye{' '}
                  <Link to="/student-login" className="font-bold text-sky-700 hover:text-sky-600">
                    student portal open karein
                  </Link>
                  .
                </p>
              </form>

              {/* <p className="mt-4 text-center text-sm text-slate-300">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-cyan-200 hover:text-cyan-100">
                  Sign Up
                </Link>
              </p> */}
            </article>
          </div>
        </div>
      </main>
      <WebsiteFooter />
    </div>
  )
}

export default AllLogin
