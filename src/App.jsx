import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { getAccessToken, getLoginType, getUser } from './Api/auth'
import SEO from './Components/SEO/SEO'
import { scrollToPageTop } from './utils/scrollToPageTop'

const Layout = lazy(() => import('./Components/Layout'))
const AllLogin = lazy(() => import('./Pages/Auth/AllLogin'))
const StudentLogin = lazy(() => import('./Pages/StudentAuth/StudentLogin'))
const Dashboard = lazy(() => import('./Pages/AllDashboard/AllDashboard'))
const AddStudentPage = lazy(() => import('./Pages/AllDashboard/AddStudentPage'))
const Results = lazy(() => import('./Pages/Results/Results'))
const ResultsPortal = lazy(() => import('./Pages/Results/ResultsPortal'))
const Home = lazy(() => import('./Pages/Website/Home'))
const About = lazy(() => import('./Pages/Website/About'))
const Contact = lazy(() => import('./Pages/Website/Contact'))
const Galary = lazy(() => import('./Pages/Website/Galary'))
const Admission = lazy(() => import('./Pages/Website/Admission'))
const PublicFeePayment = lazy(() => import('./Pages/Website/PublicFeePayment'))

function Unauthorized() {
  return (
    <div className="app-shell min-h-screen flex items-center justify-center px-4">
      <SEO
        title="Access denied"
        description="This page is restricted to school staff and authorized users."
        canonicalPath="/unauthorized"
      />
      <div className="gps-card w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-white">Access denied</h2>
        <p className="mt-2 text-sm text-slate-300">Your account does not have permission to view this page.</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = getAccessToken()
  const user = getUser()
  const loginType = getLoginType()
  const role = loginType === 'student' ? 'student' : user?.role

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const onToast = (event) => {
      const detail = event?.detail || {}
      const toast = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: detail.type || 'info',
        title: detail.title || '',
        message: detail.message || '',
      }

      setToasts((prev) => [...prev, toast])
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id))
      }, 4500)
    }

    window.addEventListener('app:toast', onToast)
    return () => window.removeEventListener('app:toast', onToast)
  }, [])

  const typeStyles = {
    success: 'bg-emerald-950/92 border-emerald-300/50 text-emerald-50 shadow-[0_20px_45px_rgba(6,95,70,0.28)]',
    error: 'bg-rose-950/92 border-rose-300/55 text-rose-50 shadow-[0_20px_45px_rgba(136,19,55,0.28)]',
    warning: 'bg-amber-950/92 border-amber-300/55 text-amber-50 shadow-[0_20px_45px_rgba(146,64,14,0.24)]',
    info: 'bg-slate-950/92 border-cyan-300/45 text-slate-50 shadow-[0_20px_45px_rgba(8,47,73,0.26)]',
  }

  return (
    <div className="fixed top-4 right-4 z-[200] space-y-2 w-[92vw] max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`border rounded-xl px-4 py-3 backdrop-blur-md ${typeStyles[toast.type] || typeStyles.info}`}
        >
          {toast.title ? <p className="text-xs font-extrabold uppercase tracking-[0.12em] mb-0.5 opacity-90">{toast.title}</p> : null}
          <p className="text-sm leading-5 text-white/95">{toast.message}</p>
        </div>
      ))}
    </div>
  )
}

function RouteScrollManager() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    scrollToPageTop()
  }, [pathname, search])

  return null
}

function App() {
  useEffect(() => {
    const isCalendarInput = (element) => {
      if (!(element instanceof HTMLInputElement)) return false
      return ['date', 'month', 'week', 'time', 'datetime-local'].includes(element.type)
    }

    const openPicker = (input) => {
      if (typeof input.showPicker !== 'function') return
      try {
        input.showPicker()
      } catch {
        // Browser may block showPicker for unsupported scenarios.
      }
    }

    const handleCalendarClick = (event) => {
      const target = event.target
      if (!isCalendarInput(target)) return
      openPicker(target)
    }

    document.addEventListener('click', handleCalendarClick, true)
    return () => {
      document.removeEventListener('click', handleCalendarClick, true)
    }
  }, [])

  return (
    <Router>
      <RouteScrollManager />
      <ToastContainer />
      <Suspense
        fallback={
          <div className="app-shell min-h-screen flex items-center justify-center px-4">
            <div className="gps-card w-full max-w-sm p-6 text-center">
              <p className="text-sm text-slate-300">Loading...</p>
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/admission" element={<Admission />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/gallery" element={<Galary />} />
          <Route path="/pay-fees" element={<PublicFeePayment />} />
          <Route path="/login" element={<AllLogin />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/results-portal" element={<ResultsPortal />} />
          <Route path="/result" element={<Results />} />
          <Route path="/results/:classSlug/roll-:rollNumber" element={<Results />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/students/add" element={<AddStudentPage />} />
          </Route>
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'student', 'accountant']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Dashboard />} />
            <Route path="/leave-rejoin" element={<Navigate to="/dashboard" replace />} />
            <Route path="/subjects" element={<Dashboard />} />
            <Route path="/teachers" element={<Dashboard />} />
            <Route path="/teacher-attendance" element={<Dashboard />} />
            <Route path="/fees" element={<Dashboard />} />
            <Route path="/attendance" element={<Dashboard />} />
            <Route path="/marks-upload" element={<Dashboard />} />
            <Route path="/upload-photo" element={<Dashboard />} />
            <Route path="/result-view" element={<Dashboard />} />
          </Route>
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/class-promotion" element={<Dashboard initialView="classPromotion" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
