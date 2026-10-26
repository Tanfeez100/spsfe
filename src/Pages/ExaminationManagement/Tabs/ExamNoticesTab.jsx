import React, { useState, useEffect } from 'react'
import {
  getNoticesApi,
  createNoticeApi,
  updateNoticeApi,
  deleteNoticeApi,
} from '../../../Api/examinations'
import { emitToast, getUser } from '../../../Api/auth'

const ALL_CLASSES = ['All', 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8']
const NOTICE_TYPES = [
  { value: 'announcement', label: 'General Announcement' },
  { value: 'timetable', label: 'Date Sheet / Timetable Release' },
  { value: 'routine_change', label: 'Timetable Change Alert' },
  { value: 'instructions', label: 'Examination Hall Instructions' },
  { value: 'result', label: 'Result Declaration' },
]

export default function ExamNoticesTab({ activeExam, exams = [] }) {
  const currentUser = getUser()
  const isAdmin = currentUser?.role === 'admin'

  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterExam, setFilterExam] = useState(activeExam?.id || 'all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    examination_id: activeExam?.id || '',
    target_class: 'All',
    target_section: 'All',
    notice_type: 'announcement',
    status: 'draft',
  })

  const loadNotices = async () => {
    setLoading(true)
    try {
      const res = await getNoticesApi({
        examId: filterExam,
        status: filterStatus,
      })
      if (res?.success) {
        setNotices(res.data || [])
      }
    } catch (err) {
      emitToast('error', err.message || 'Failed to load notices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotices()
  }, [filterExam, filterStatus])

  const openCreateModal = () => {
    setEditingNotice(null)
    setFormData({
      title: '',
      message: '',
      examination_id: activeExam?.id || exams[0]?.id || '',
      target_class: 'All',
      target_section: 'All',
      notice_type: 'announcement',
      status: 'published',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (notice) => {
    setEditingNotice(notice)
    setFormData({
      title: notice.title || '',
      message: notice.message || '',
      examination_id: notice.examination_id || '',
      target_class: notice.target_class || 'All',
      target_section: notice.target_section || 'All',
      notice_type: notice.notice_type || 'announcement',
      status: notice.status || 'draft',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.message.trim()) {
      emitToast('warning', 'Please provide both title and notice message')
      return
    }

    setSubmitting(true)
    try {
      if (editingNotice) {
        const res = await updateNoticeApi(editingNotice.id, formData)
        emitToast('success', res.message || 'Notice updated')
      } else {
        const res = await createNoticeApi(formData)
        emitToast('success', res.message || 'Notice created')
      }
      setIsModalOpen(false)
      loadNotices()
    } catch (err) {
      emitToast('error', err.message || 'Failed to save notice')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (noticeId) => {
    if (!window.confirm('Delete this examination notice?')) return
    try {
      const res = await deleteNoticeApi(noticeId)
      emitToast('success', res.message || 'Notice deleted')
      loadNotices()
    } catch (err) {
      emitToast('error', err.message || 'Failed to delete notice')
    }
  }

  return (
    <div className="space-y-4">
      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Exam Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Exam:</span>
            <select
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Examinations</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Create Notice Button */}
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#132c4e] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1e3a8a] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add_alert</span>
            Issue Circular / Notice
          </button>
        )}
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
            Loading examination notices...
          </div>
        ) : notices.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
            No notices found for this filter.
          </div>
        ) : (
          notices.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                        n.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {n.status}
                    </span>
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                      {n.notice_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Target Class: <strong className="text-slate-600">{n.target_class}</strong> · Issued by: {n.created_by} · {n.created_at?.slice(0, 10)}
                  </p>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(n)}
                      className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 shadow-2xs"
                      title="Edit Notice"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="rounded border border-slate-200 bg-white p-1 text-rose-600 hover:bg-rose-50 shadow-2xs"
                      title="Delete Notice"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-700 leading-relaxed pt-2.5 whitespace-pre-line">
                {n.message}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create / Edit Notice */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingNotice ? 'Edit Circular Notice' : 'Issue Examination Notice'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Revised Examination Timetable for Class 5"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Notice Type</label>
                  <select
                    value={formData.notice_type}
                    onChange={(e) => setFormData({ ...formData, notice_type: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  >
                    {NOTICE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Target Class</label>
                  <select
                    value={formData.target_class}
                    onChange={(e) => setFormData({ ...formData, target_class: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  >
                    {ALL_CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Detailed Message</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Provide complete details, dates, or guidelines for students and staff..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="published">Published (Broadcast Immediately)</option>
                  <option value="draft">Draft (Saved for review)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#132c4e] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Broadcast Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
