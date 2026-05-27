import React from 'react'
import { useNavigate } from 'react-router-dom'
import AddStudent from '../../Components/Student/AddStudent'

export default function AddStudentPage() {
  const navigate = useNavigate()

  const handleClose = () => {
    navigate('/students')
  }

  const handleSuccess = () => {
    navigate('/students')
  }

  return (
    <div className="w-full h-full min-h-0 overflow-y-auto table-scrollbar" style={{ fontFamily: "'Lexend', sans-serif" }}>
      <div className="w-full min-h-full">
        {/* Header with Back Button */}
        <div className="mb-2 flex items-center gap-4 px-5 py-3 sm:px-8 sm:py-4">
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-900 dark:text-white"
            title="Back to Students"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">Add New Student</h1>
        </div>

        {/* AddStudent Component - Full Page */}
        <div className="px-4 sm:px-7 pb-5">
          <AddStudent
            isOpen={true}
            onClose={handleClose}
            onSuccess={handleSuccess}
            fullPage={true}
          />
        </div>
      </div>
    </div>
  )
}
