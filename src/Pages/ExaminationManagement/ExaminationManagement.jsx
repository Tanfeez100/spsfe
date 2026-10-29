import React, { useState, useEffect } from 'react'
import SEO from '../../Components/SEO/SEO'
import ExamOverviewTab from './Tabs/ExamOverviewTab'
import ExamSetupTab from './Tabs/ExamSetupTab'
import ExamTimetableTab from './Tabs/ExamTimetableTab'
import ExamSubjectsTab from './Tabs/ExamSubjectsTab'
import ExamResultsTab from './Tabs/ExamResultsTab'
import ExamNoticesTab from './Tabs/ExamNoticesTab'
import ExamReportsTab from './Tabs/ExamReportsTab'
import { getExaminationsApi } from '../../Api/examinations'

const EXAMINATION_TABS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'exam-setup', label: 'Exam Setup', icon: 'settings_suggest' },
  { id: 'timetable', label: 'Timetable', icon: 'calendar_month' },
  { id: 'subjects', label: 'Subjects', icon: 'menu_book' },
  { id: 'results', label: 'Results', icon: 'workspace_premium' },
  { id: 'notices', label: 'Notices', icon: 'campaign' },
  { id: 'reports', label: 'Reports', icon: 'assessment' },
]

export default function ExaminationManagement({ initialTab = 'overview' }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [exams, setExams] = useState([])
  const [activeExam, setActiveExam] = useState(null)

  // Load all examinations for the selector
  const loadExams = async () => {
    try {
      const res = await getExaminationsApi()
      if (res?.success && Array.isArray(res.data)) {
        setExams(res.data)
        if (res.data.length > 0) {
          // Default to ongoing or first exam if not selected
          setActiveExam((prev) => {
            if (prev && res.data.some((e) => e.id === prev.id)) return prev
            return res.data.find((e) => e.status === 'ongoing') || res.data[0]
          })
        } else {
          setActiveExam(null)
        }
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadExams()
  }, [])

  return (
    <div className="w-full space-y-4">
      <SEO
        title="Examination Management | Star Public School"
        description="Comprehensive examination scheduling, routines, marks entry, and report card generation."
        canonicalPath="/examinations"
      />

      {/* ================= COMPACT HORIZONTAL HEADER ================= */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* Module Title Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[#132c4e] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">assignment</span>
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-[#0f1e36] tracking-tight leading-none">
                Examination Management
              </h1>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Centralized evaluation, timetable schedules, subjects & report cards
              </p>
            </div>
          </div>

          {activeExam && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-[11px] text-slate-500 font-semibold">Active Exam:</span>
              <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 font-bold text-blue-900 text-[11px]">
                {activeExam.name}
              </span>
            </div>
          )}
        </div>

        {/* Compact Horizontal Tabs Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto px-3 py-1.5 scrollbar-none">
          {EXAMINATION_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#132c4e] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className={`material-symbols-outlined text-sm ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ================= TAB CONTENT RENDERER ================= */}
      <div className="w-full">
        {activeTab === 'overview' && (
          <ExamOverviewTab
            onNavigateTab={(tabId) => setActiveTab(tabId)}
            onSelectExam={(exam) => setActiveExam(exam)}
          />
        )}

        {activeTab === 'exam-setup' && (
          <ExamSetupTab
            onNavigateTab={(tabId) => setActiveTab(tabId)}
            onSelectExam={(exam) => setActiveExam(exam)}
          />
        )}

        {activeTab === 'timetable' && (
          <ExamTimetableTab
            activeExam={activeExam}
            exams={exams}
          />
        )}

        {activeTab === 'subjects' && (
          <ExamSubjectsTab
            activeExam={activeExam}
            exams={exams}
          />
        )}

        {activeTab === 'results' && (
          <ExamResultsTab
            activeExam={activeExam}
            exams={exams}
          />
        )}

        {activeTab === 'notices' && (
          <ExamNoticesTab
            activeExam={activeExam}
            exams={exams}
          />
        )}

        {activeTab === 'reports' && (
          <ExamReportsTab
            activeExam={activeExam}
            exams={exams}
          />
        )}
      </div>
    </div>
  )
}
