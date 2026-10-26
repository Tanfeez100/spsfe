import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import SEO from '../../Components/SEO/SEO'
import Sidebar from '../../Components/Sidebar'
import EditStudent from '../../Components/Student/EditStudent'
import { getAllStudents } from '../../Api/students'

export default function EditStudentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const outletContext = useOutletContext() || {}
  const [localSidebarOpen, setLocalSidebarOpen] = useState(false)
  const sidebarOpen = outletContext.sidebarOpen ?? localSidebarOpen
  const setSidebarOpen = outletContext.setSidebarOpen ?? setLocalSidebarOpen

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStudent() {
      setLoading(true)
      try {
        const res = await getAllStudents()
        const studentsList = Array.isArray(res?.students)
          ? res.students
          : Array.isArray(res)
          ? res
          : []
        const found = studentsList.find(
          (s) =>
            String(s.ID || s.id || s._id) === String(id) ||
            String(s.Roll || s.roll_no) === String(id) ||
            String(s.AdmissionNo || s.admission_number) === String(id)
        )
        if (found) {
          setStudent(found)
        } else {
          setStudent(null)
        }
      } catch (err) {
        console.error('Failed to load student for editing:', err)
      } finally {
        setLoading(false)
      }
    }
    loadStudent()
  }, [id])

  const handleClose = () => {
    navigate('/students')
  }

  const handleSuccess = () => {
    navigate('/students')
  }

  return (
    <>
      <SEO
        title="Edit Student Record | Star Public School"
        description="Student record maintenance and academic profile editor for Star Public School."
        canonicalPath={`/students/edit/${id || ''}`}
      />
      <div className="flex h-full w-full overflow-hidden bg-[#fbfcfb]">
        {/* Left Sidebar (Active on student) */}
        <Sidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          activeView="student"
          setActiveView={(view) => {
            if (view === 'dashboard') navigate('/dashboard')
            else if (view === 'student') navigate('/students')
            else navigate(`/${view}`)
          }}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-2xs">
                <span className="material-symbols-outlined animate-spin text-2xl text-blue-600">sync</span>
                <p className="mt-2 text-xs font-semibold">Loading student record...</p>
              </div>
            ) : !student ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-2xs">
                <span className="material-symbols-outlined text-4xl text-rose-500">person_off</span>
                <p className="mt-2 text-sm font-semibold text-slate-800">Student Record Not Found</p>
                <p className="mt-1 text-xs text-slate-500">The student record you are attempting to edit does not exist or has been removed.</p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back to Student Directory
                </button>
              </div>
            ) : (
              <EditStudent
                isOpen={true}
                onClose={handleClose}
                onSuccess={handleSuccess}
                studentData={student}
                fullPage={true}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
