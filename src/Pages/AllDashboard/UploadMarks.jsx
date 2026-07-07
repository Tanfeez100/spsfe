import React, { useState } from 'react'
import SubmitMarks from '../../Components/MarksUpload/SubmitMarks'
import ViewMarks from '../../Components/MarksUpload/ViewMarks'

function UploadMarks() {
  const [activeTab, setActiveTab] = useState('submit')

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-700 inline-flex w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('submit')}
          className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
            activeTab === 'submit'
              ? 'bg-slate-600 text-white shadow-lg shadow-slate-400/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 sm:gap-2 justify-center">
            <span className="material-symbols-outlined text-base">upload</span>
            <span className="hidden sm:inline">Submit Marks</span>
            <span className="sm:hidden">Submit</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('view')}
          className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
            activeTab === 'view'
              ? 'bg-slate-600 text-white shadow-lg shadow-slate-400/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 sm:gap-2 justify-center">
            <span className="material-symbols-outlined text-base">visibility</span>
            <span className="hidden sm:inline">View Marks</span>
            <span className="sm:hidden">View</span>
          </span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'submit' && <SubmitMarks />}
      {activeTab === 'view' && <ViewMarks />}
    </div>
  )
}

export default UploadMarks
