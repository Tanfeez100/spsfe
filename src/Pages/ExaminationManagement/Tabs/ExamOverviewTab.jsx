import React, { useState, useEffect } from 'react'
import { getExamOverviewApi } from '../../../Api/examinations'
import { emitToast } from '../../../Api/auth'

export default function ExamOverviewTab({ onNavigateTab, onSelectExam }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState('2026-27')
  const [overviewData, setOverviewData] = useState(null)

  const fetchOverview = async (selectedSession) => {
    setLoading(true)
    try {
      const res = await getExamOverviewApi(selectedSession || session)
      if (res?.success) {
        setOverviewData(res.data)
      }
    } catch (err) {
      emitToast('error', err.message || 'Failed to load examination dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverview(session)
  }, [session])

  const summary = overviewData?.summary || {
    totalExams: 0,
    upcomingExams: 0,
    ongoingExams: 0,
    completedExams: 0,
    pendingMarksCount: 0,
    awaitingApprovalCount: 0,
  }

  return (
    <div className="space-y-5">
      {/* Top Filter and Quick Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Academic Session:</label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none"
          >
            <option value="2026-27">2026–27</option>
            <option value="2025-26">2025–26</option>
          </select>
          <button
            onClick={() => fetchOverview(session)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('exam-setup')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#132c4e] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1e3a8a] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create Exam
          </button>
          <button
            onClick={() => onNavigateTab('timetable')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            Timetable
          </button>
          <button
            onClick={() => onNavigateTab('results')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">workspace_premium</span>
            View Results
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Exams */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Total Exams</span>
            <span className="material-symbols-outlined text-base text-blue-600">assignment</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-[#0f1e36]">{summary.totalExams}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Session {session}</p>
        </div>

        {/* Card 2: Ongoing */}
        <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-semibold">Ongoing</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-emerald-800">{summary.ongoingExams}</p>
          <p className="mt-0.5 text-[10px] text-emerald-600 font-medium">Currently active</p>
        </div>

        {/* Card 3: Upcoming */}
        <div className="rounded-xl border border-amber-200/90 bg-amber-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-semibold">Upcoming</span>
            <span className="material-symbols-outlined text-base text-amber-600">schedule</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-amber-800">{summary.upcomingExams}</p>
          <p className="mt-0.5 text-[10px] text-amber-600 font-medium">Scheduled soon</p>
        </div>

        {/* Card 4: Completed */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Completed</span>
            <span className="material-symbols-outlined text-base text-slate-600">task_alt</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-[#0f1e36]">{summary.completedExams}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Past terms</p>
        </div>

        {/* Card 5: Pending Marks */}
        <div className="rounded-xl border border-rose-200/90 bg-rose-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-semibold">Pending Marks</span>
            <span className="material-symbols-outlined text-base text-rose-600">rate_review</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-rose-800">{summary.pendingMarksCount}</p>
          <p className="mt-0.5 text-[10px] text-rose-600 font-medium">Draft / review entries</p>
        </div>

        {/* Card 6: Awaiting Approval */}
        <div className="rounded-xl border border-indigo-200/90 bg-indigo-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-[11px] font-semibold">Awaiting Approval</span>
            <span className="material-symbols-outlined text-base text-indigo-600">verified</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-indigo-800">{summary.awaitingApprovalCount}</p>
          <p className="mt-0.5 text-[10px] text-indigo-600 font-medium">Results pending release</p>
        </div>
      </div>

      {/* Main Grid: Active/Upcoming List & Class-wise Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols): Upcoming & Ongoing Examination List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-blue-600">event_upcoming</span>
                Upcoming & Ongoing Examinations
              </h3>
              <button
                onClick={() => onNavigateTab('exam-setup')}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                View all ({summary.totalExams}) →
              </button>
            </div>

            <div className="divide-y divide-slate-100 pt-1">
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading examinations...</div>
              ) : (overviewData?.upcomingList || []).length > 0 ? (
                overviewData.upcomingList.map((exam) => (
                  <div key={exam.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs truncate">{exam.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                            exam.status === 'ongoing'
                              ? 'bg-emerald-100 text-emerald-800'
                              : exam.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {exam.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {exam.start_date} to {exam.end_date} · {exam.exam_type}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(exam.applicable_classes || []).map((cls) => (
                          <span key={cls} className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-medium text-slate-600">
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (onSelectExam) onSelectExam(exam)
                          onNavigateTab('timetable')
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                      >
                        Timetable
                      </button>
                      <button
                        onClick={() => {
                          if (onSelectExam) onSelectExam(exam)
                          onNavigateTab('results')
                        }}
                        className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        Results
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No upcoming examinations found for session {session}.
                </div>
              )}
            </div>
          </div>

          {/* Recently Published Results */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-emerald-600">history_edu</span>
                Recently Completed Examinations
              </h3>
              <button
                onClick={() => onNavigateTab('results')}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Go to Results →
              </button>
            </div>

            <div className="divide-y divide-slate-100 pt-1">
              {(overviewData?.completedList || []).length > 0 ? (
                overviewData.completedList.map((exam) => (
                  <div key={exam.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{exam.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Ended on {exam.end_date} · {exam.result_published ? 'Results Published' : 'Results Draft'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (onSelectExam) onSelectExam(exam)
                        onNavigateTab('results')
                      }}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                    >
                      Report Cards
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  No recently completed examinations recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Class-wise Progress & Active Notices */}
        <div className="space-y-4">
          {/* Class-wise Marks Completion */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <span className="material-symbols-outlined text-base text-indigo-600">donut_large</span>
              Marks Completion Status
            </h3>

            <div className="space-y-2.5 pt-3">
              {(overviewData?.classProgress || []).map((cp) => (
                <div key={cp.className} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{cp.className}</span>
                    <span className="text-[11px] font-bold text-slate-600">{cp.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        cp.percentage === 100
                          ? 'bg-emerald-500'
                          : cp.percentage > 0
                          ? 'bg-blue-600'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${cp.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Examination Notices */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-amber-600">campaign</span>
                Examination Circulars
              </h3>
              <button
                onClick={() => onNavigateTab('notices')}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Manage →
              </button>
            </div>

            <div className="space-y-2 pt-2.5">
              {(overviewData?.notices || []).length > 0 ? (
                overviewData.notices.map((n) => (
                  <div key={n.id} className="rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-100">
                    <p className="font-bold text-slate-800">{n.title}</p>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Class: {n.target_class} · {n.created_by}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No active circulars published.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
