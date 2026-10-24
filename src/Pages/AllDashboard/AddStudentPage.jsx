import React, { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import SEO from '../../Components/SEO/SEO'
import Sidebar from '../../Components/Sidebar'
import AddStudent from '../../Components/Student/AddStudent'

export default function AddStudentPage() {
  const navigate = useNavigate()
  const outletContext = useOutletContext() || {}
  const [localSidebarOpen, setLocalSidebarOpen] = useState(false)
  const sidebarOpen = outletContext.sidebarOpen ?? localSidebarOpen
  const setSidebarOpen = outletContext.setSidebarOpen ?? setLocalSidebarOpen

  const handleClose = () => {
    navigate('/students')
  }

  const handleSuccess = () => {
    navigate('/students')
  }

  return (
    <>
      <SEO
        title="Add New Student | Star Public School"
        description="Fresh student admission and registration studio for Star Public School."
        canonicalPath="/students/add"
      />
      <div className="flex h-full w-full overflow-hidden bg-[#fbfcfb]">
        {/* Left Sidebar matching Canva Blueprint (Active: student) */}
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
            <AddStudent
              isOpen={true}
              onClose={handleClose}
              onSuccess={handleSuccess}
              fullPage={true}
            />
          </div>
        </div>
      </div>
    </>
  )
}
