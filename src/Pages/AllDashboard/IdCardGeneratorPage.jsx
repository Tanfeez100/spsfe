import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import SEO from '../../Components/SEO/SEO'
import Sidebar from '../../Components/Sidebar'
import BatchIdCardGenerator from '../../Components/Student/BatchIdCardGenerator'
import { getAllStudents } from '../../Api/students'

export default function IdCardGeneratorPage() {
  const navigate = useNavigate()
  const outletContext = useOutletContext() || {}
  const [localSidebarOpen, setLocalSidebarOpen] = useState(false)
  const sidebarOpen = outletContext.sidebarOpen ?? localSidebarOpen
  const setSidebarOpen = outletContext.setSidebarOpen ?? setLocalSidebarOpen

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true)
      try {
        const res = await getAllStudents()
        const studentsList = Array.isArray(res?.students)
          ? res.students
          : Array.isArray(res)
          ? res
          : []
        setStudents(studentsList)
      } catch (err) {
        console.error('Failed to load students for ID cards:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [])

  return (
    <>
      <SEO
        title="Student ID & Admit Card Studio | Star Public School"
        description="Generate official Star Public School student identity and admit cards by class."
        canonicalPath="/students/id-cards"
      />
      <div className="flex h-full w-full overflow-hidden bg-[#fbfcfb]">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          activeView="idCards"
          setActiveView={(view) => {
            if (view === 'dashboard') navigate('/dashboard')
            else if (view === 'student') navigate('/students')
            else if (view === 'idCards') navigate('/id-cards')
            else navigate(`/${view}`)
          }}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <BatchIdCardGenerator
            isOpen={true}
            isPage={true}
            students={students}
            initialClass="Nursery"
          />
        </div>
      </div>
    </>
  )
}
