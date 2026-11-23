import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import SEO from '../../Components/SEO/SEO'
import Sidebar from '../../Components/Sidebar'
import BatchIdCardGenerator from '../../Components/Student/BatchIdCardGenerator'
import StaffBatchIdCardGenerator from '../../Components/Teacher/StaffBatchIdCardGenerator'
import { getAllStudents } from '../../Api/students'
import { getTeachers } from '../../Api/auth'

export default function IdCardGeneratorPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const outletContext = useOutletContext() || {}
  const [localSidebarOpen, setLocalSidebarOpen] = useState(false)
  const sidebarOpen = outletContext.sidebarOpen ?? localSidebarOpen
  const setSidebarOpen = outletContext.setSidebarOpen ?? setLocalSidebarOpen

  const typeParam = searchParams.get('type') // 'staff' | 'students'
  const [activeTab, setActiveTab] = useState(typeParam === 'staff' ? 'staff' : 'students')

  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeParam === 'staff' || typeParam === 'students') {
      setActiveTab(typeParam)
    }
  }, [typeParam])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [resStudents, resTeachers] = await Promise.allSettled([
          getAllStudents(),
          getTeachers(),
        ])

        if (resStudents.status === 'fulfilled') {
          const list = Array.isArray(resStudents.value?.students)
            ? resStudents.value.students
            : Array.isArray(resStudents.value)
            ? resStudents.value
            : []
          setStudents(list)
        }

        if (resTeachers.status === 'fulfilled') {
          const list = Array.isArray(resTeachers.value?.teachers)
            ? resTeachers.value.teachers
            : Array.isArray(resTeachers.value?.data)
            ? resTeachers.value.data
            : Array.isArray(resTeachers.value)
            ? resTeachers.value
            : []
          setTeachers(list)
        }
      } catch (err) {
        console.error('Failed to load data for ID cards:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams({ type: tab })
  }

  return (
    <>
      <SEO
        title={
          activeTab === 'staff'
            ? 'Faculty & Staff ID Cards | Star Public School'
            : 'Student ID & Admit Card Studio | Star Public School'
        }
        description="Generate official Star Public School identity cards for students, teachers, and staff."
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-4">
          <BatchIdCardGenerator
            isOpen={true}
            isPage={true}
            students={students}
            initialClass="1"
          />
        </div>
      </div>
    </>
  )
}
