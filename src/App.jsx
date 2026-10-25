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
const EditStudentPage = lazy(() => import('./Pages/AllDashboard/EditStudentPage'))
const IdCardGeneratorPage = lazy(() => import('./Pages/AllDashboard/IdCardGeneratorPage'))
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
      let rawType = detail.type || 'info'
      let rawTitle = detail.title || ''
      let rawMessage = detail.message || ''

      if (typeof rawType === 'object' && rawType !== null) {
        rawMessage = rawType.message || rawMessage
        rawTitle = rawType.title || rawTitle
        rawType = rawType.type || 'info'
      }

      const msg = String(rawMessage || '').trim()
      let title = String(rawTitle || '').replace(/\b\d{3}\s*(error|warning|info|notice)?\b/gi, '').trim()

      // Never show empty ghost toast boxes
      if (!msg && !title) return

      const safeType = ['success', 'error', 'warning', 'info'].includes(rawType) ? rawType : 'info'

      const toast = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: safeType,
        title,
        message: msg,
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
    success: {
      card: 'bg-white border border-emerald-200 border-l-4 border-l-emerald-500 shadow-[0_10px_25px_rgba(16,185,129,0.15)]',
      title: 'text-emerald-700',
      message: 'text-emerald-600',
    },
    error: {
      card: 'bg-white border border-rose-200 border-l-4 border-l-rose-500 shadow-[0_10px_25px_rgba(244,63,94,0.15)]',
      title: 'text-rose-700',
      message: 'text-rose-600',
    },
    warning: {
      card: 'bg-white border border-amber-200 border-l-4 border-l-amber-500 shadow-[0_10px_25px_rgba(245,158,11,0.15)]',
      title: 'text-amber-700',
      message: 'text-amber-600',
    },
    info: {
      card: 'bg-white border border-slate-200 border-l-4 border-l-slate-500 shadow-[0_10px_25px_rgba(15,23,42,0.12)]',
      title: 'text-slate-700',
      message: 'text-slate-600',
    },
  }

  return (
    <div className="fixed top-4 right-4 z-[200] space-y-2 w-[92vw] max-w-sm">
      {toasts.map((toast) => {
        const style = typeStyles[toast.type] || typeStyles.info
        return (
          <div
            key={toast.id}
            className={`rounded-xl px-4 py-3 ${style.card}`}
          >
            {toast.title ? (
              <p className={`text-xs font-black uppercase tracking-[0.12em] mb-0.5 ${style.title}`}>
                {toast.title}
              </p>
            ) : null}
            <p className={`text-sm font-semibold leading-5 ${style.message}`}>{toast.message}</p>
          </div>
        )
      })}
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
            <Route path="/students/edit/:id" element={<EditStudentPage />} />
            <Route path="/students/id-cards" element={<IdCardGeneratorPage />} />
            <Route path="/students/admit-cards" element={<IdCardGeneratorPage />} />
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
            <Route path="/id-cards" element={<Dashboard initialView="idCards" />} />
            <Route path="/leave-rejoin" element={<Navigate to="/dashboard" replace />} />
            <Route path="/subjects" element={<Dashboard />} />
            <Route path="/teachers" element={<Dashboard />} />
            <Route path="/teacher-attendance" element={<Dashboard />} />
            <Route path="/fees" element={<Dashboard />} />
            <Route path="/attendance" element={<Dashboard />} />
            <Route path="/marks-upload" element={<Dashboard />} />
            <Route path="/upload-photo" element={<Dashboard />} />
            <Route path="/result-view" element={<Dashboard />} />
            <Route path="/examinations" element={<Dashboard initialView="examinationManagement" />} />
            <Route path="/examinations/:tab" element={<Dashboard initialView="examinationManagement" />} />
          </Route>
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/class-promotion" element={<Dashboard initialView="classPromotion" />} />
            <Route path="/document-management" element={<Dashboard initialView="documentManagement" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
