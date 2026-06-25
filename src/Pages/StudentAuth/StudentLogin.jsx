import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setSession } from '../../Api/auth'
import { studentLogin, studentSignup } from '../../Api/studentAuth'

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
        setMessage('Account created. Ab username aur password se login karein.')
        setMode('login')
        setForm((prev) => ({ ...prev, student_id: '', password: '' }))
        return
      }

      const response = await studentLogin(form.username.trim(), form.password)
      setSession(response, 'student')
      navigate('/attendance', { replace: true })
    } catch (err) {
      setError(err?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-cyan-300/20 bg-slate-900/90 p-6 shadow-2xl shadow-cyan-950/30">
        <div className="mb-6">
          <Link to="/login" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            Back to staff login
          </Link>
          <h1 className="mt-4 text-2xl font-black">Student Login</h1>
          <p className="mt-1 text-sm text-slate-300">
            Apni attendance dekhne ke liye student account se login karein.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-700 bg-slate-950 p-1">
          {[
            ['login', 'Login'],
            ['signup', 'Create account'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMode(key)
                setError('')
                setMessage('')
              }}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                mode === key ? 'bg-cyan-500 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mb-4 rounded-lg border border-emerald-400/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
            {message}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' ? (
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Student ID</span>
              <input
                name="student_id"
                value={form.student_id}
                onChange={updateForm}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-400"
                placeholder="Supabase student UUID"
                required
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Username</span>
            <input
              name="username"
              value={form.username}
              onChange={updateForm}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-400"
              placeholder="admission number / roll username"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateForm}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-400"
              placeholder="Password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create Student Account' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default StudentLogin
