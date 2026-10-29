import React, { useState, useEffect } from 'react'
import {
  getExaminationsApi,
  createExaminationApi,
  updateExaminationApi,
  deleteExaminationApi,
  archiveExaminationApi,
} from '../../../Api/examinations'
import { emitToast } from '../../../Api/auth'

const ALL_SCHOOL_CLASSES = [
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
]

const STANDARD_TERMS = [
  { value: 'First Terminal Examination', label: 'First Terminal Examination (Term 1)', short: '1st Terminal' },
  { value: 'Second Terminal Examination', label: 'Second Terminal Examination (Term 2)', short: '2nd Terminal' },
  { value: 'Third Terminal Examination', label: 'Third Terminal Examination (Term 3)', short: '3rd Terminal' },
  { value: 'Annual Examination', label: 'Annual Examination (Final / Term 4)', short: 'Annual Exam' },
]

const OTHER_EXAM_TYPES = [
  'Unit Test',
  'Monthly Test',
  'Periodic Assessment',
  'Pre-Board Examination',
  'Half-Yearly Examination',
  'Custom / Other',
]

export default function ExamSetupTab({ onNavigateTab, onSelectExam }) {
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [filterSession, setFilterSession] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [customTypeInput, setCustomTypeInput] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    academic_session: '2026-27',
    exam_type: 'First Terminal Examination',
    start_date: '',
    end_date: '',
    applicable_classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
    description: '',
    status: 'draft',
  })

  const loadExams = async () => {
    setLoading(true)
    try {
      const res = await getExaminationsApi({
        session: filterSession,
        type: filterType,
        status: filterStatus,
        search: searchQuery,
      })
      if (res?.success) {
        setExams(res.data || [])
      }
    } catch (err) {
      emitToast('error', err.message || 'Failed to load examinations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExams()
  }, [filterSession, filterType, filterStatus, searchQuery])

  const openCreateModal = () => {
    setEditingExam(null)
    setCustomTypeInput('')
    setFormData({
      name: '',
      academic_session: '2026-27',
      exam_type: 'First Terminal Examination',
      start_date: '',
      end_date: '',
      applicable_classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
      description: '',
      status: 'draft',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (exam) => {
    setEditingExam(exam)
    const isStandard = STANDARD_TERMS.some((t) => t.value === exam.exam_type)
    const isOther = OTHER_EXAM_TYPES.includes(exam.exam_type)

    if (!isStandard && !isOther && exam.exam_type) {
      setCustomTypeInput(exam.exam_type)
    } else {
      setCustomTypeInput('')
    }

    setFormData({
      name: exam.name || '',
      academic_session: exam.academic_session || '2026-27',
      exam_type: !isStandard && !isOther && exam.exam_type ? 'Custom / Other' : exam.exam_type || 'First Terminal Examination',
      start_date: exam.start_date || '',
      end_date: exam.end_date || '',
      applicable_classes: Array.isArray(exam.applicable_classes) ? exam.applicable_classes : [],
      description: exam.description || '',
      status: exam.status || 'draft',
    })
    setIsModalOpen(true)
  }

  const handleToggleClass = (cls) => {
    setFormData((prev) => {
      const exists = prev.applicable_classes.includes(cls)
      return {
        ...prev,
        applicable_classes: exists
          ? prev.applicable_classes.filter((c) => c !== cls)
          : [...prev.applicable_classes, cls],
      }
    })
  }

  const handleSelectAllClasses = () => {
    setFormData((prev) => ({
      ...prev,
      applicable_classes: prev.applicable_classes.length === ALL_SCHOOL_CLASSES.length ? [] : [...ALL_SCHOOL_CLASSES],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      emitToast('warning', 'Please enter examination name')
      return
    }
    if (!formData.start_date || !formData.end_date) {
      emitToast('warning', 'Please select start and end dates')
      return
    }
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      emitToast('error', 'End date cannot be earlier than start date')
      return
    }
    if (formData.applicable_classes.length === 0) {
      emitToast('warning', 'Please select at least one applicable class')
      return
    }

    let finalExamType = formData.exam_type
    if (finalExamType === 'Custom / Other') {
      if (!customTypeInput.trim()) {
        emitToast('warning', 'Please enter a custom examination type name')
        return
      }
      finalExamType = customTypeInput.trim()
    }

    const payload = {
      ...formData,
      exam_type: finalExamType,
    }

    setFormSubmitting(true)
    try {
      if (editingExam) {
        const res = await updateExaminationApi(editingExam.id, payload)
        emitToast('success', res.message || 'Examination updated successfully')
      } else {
        const res = await createExaminationApi(payload)
        emitToast('success', res.message || 'Examination created successfully')
      }
      setIsModalOpen(false)
      loadExams()
    } catch (err) {
      emitToast('error', err.message || 'Failed to save examination')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleArchive = async (exam) => {
    if (!window.confirm(`Are you sure you want to archive "${exam.name}"? Past records will be safely retained.`)) return
    try {
      const res = await archiveExaminationApi(exam.id)
      emitToast('success', res.message || 'Examination archived')
      loadExams()
    } catch (err) {
      emitToast('error', err.message || 'Failed to archive examination')
    }
  }

  const handleDelete = async (exam) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${exam.name}"?`)) return
    try {
      const res = await deleteExaminationApi(exam.id)
      emitToast('success', res.message || 'Examination deleted')
      loadExams()
    } catch (err) {
      emitToast('error', err.message || 'Cannot delete examination')
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none w-44 sm:w-56"
            />
          </div>

          {/* Session filter */}
          <select
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Sessions</option>
            <option value="2026-27">2026–27</option>
            <option value="2025-26">2025–26</option>
          </select>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Exam Types</option>
            <optgroup label="🌟 Core 4 Terms">
              {STANDARD_TERMS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="📋 Other Assessments">
              {OTHER_EXAM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Create Examination Button */}
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#132c4e] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1e3a8a] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          Create Examination
        </button>
      </div>

      {/* Examinations Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Examination Name</th>
                <th className="px-3 py-3">Session & Type</th>
                <th className="px-3 py-3">Exam Window</th>
                <th className="px-3 py-3">Classes</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Results</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    Loading examination master list...
                  </td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    No examinations found matching your filters.
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#0f1e36] text-xs">{exam.name}</p>
                      {exam.description && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{exam.description}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-800">{exam.exam_type}</p>
                      <p className="text-[10px] text-slate-500">Session {exam.academic_session}</p>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <p className="font-medium text-slate-700">{exam.start_date}</p>
                      <p className="text-[10px] text-slate-400">to {exam.end_date}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(exam.applicable_classes || []).map((cls) => (
                          <span
                            key={cls}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600"
                          >
                            {cls}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                          exam.status === 'ongoing'
                            ? 'bg-emerald-100 text-emerald-800'
                            : exam.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : exam.status === 'completed'
                            ? 'bg-slate-100 text-slate-700'
                            : exam.status === 'archived'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          exam.result_published
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {exam.result_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (onSelectExam) onSelectExam(exam)
                            onNavigateTab('timetable')
                          }}
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                          title="Open Timetable"
                        >
                          Timetable
                        </button>
                        <button
                          onClick={() => openEditModal(exam)}
                          className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 shadow-2xs"
                          title="Edit Examination"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        {exam.status !== 'archived' && (
                          <button
                            onClick={() => handleArchive(exam)}
                            className="rounded border border-slate-200 bg-white p-1 text-amber-600 hover:bg-amber-50 shadow-2xs"
                            title="Archive"
                          >
                            <span className="material-symbols-outlined text-sm">archive</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(exam)}
                          className="rounded border border-slate-200 bg-white p-1 text-rose-600 hover:bg-rose-50 shadow-2xs"
                          title="Delete Examination"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Examination */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingExam ? 'Edit Examination' : 'Create New Examination'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Examination Name & Quick Presets */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Examination Name <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      (Type freely or click a 4-term preset below)
                    </span>
                  </div>

                  {/* 1-Click Quick Term Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50/50 p-2">
                    <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mr-1">
                      Quick 4 Terms:
                    </span>
                    {STANDARD_TERMS.map((term) => {
                      const isSelected = formData.exam_type === term.value
                      return (
                        <button
                          key={term.value}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              exam_type: term.value,
                              name: `${term.value} ${prev.academic_session}`,
                            }))
                            setCustomTypeInput('')
                          }}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#132c4e] text-white shadow-2xs'
                              : 'border border-blue-200 bg-white text-blue-900 hover:bg-blue-100/60'
                          }`}
                        >
                          {term.short}
                        </button>
                      )
                    })}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="e.g. First Terminal Examination 2026-27"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Academic Session */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Academic Session</label>
                  <select
                    value={formData.academic_session}
                    onChange={(e) => setFormData({ ...formData, academic_session: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="2026-27">2026–27</option>
                    <option value="2025-26">2025–26</option>
                  </select>
                </div>

                {/* Exam Type */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Examination Type</label>
                  <select
                    value={formData.exam_type}
                    onChange={(e) => {
                      const val = e.target.value
                      setFormData((prev) => ({
                        ...prev,
                        exam_type: val,
                        name:
                          STANDARD_TERMS.some((t) => t.value === val) &&
                          (!prev.name || STANDARD_TERMS.some((t) => prev.name.startsWith(t.value)))
                            ? `${val} ${prev.academic_session}`
                            : prev.name,
                      }))
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  >
                    <optgroup label="🌟 Core 4 School Terms">
                      {STANDARD_TERMS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="📋 Other Assessments & Custom">
                      {OTHER_EXAM_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Custom Type Free-Text Input if Custom / Other is chosen */}
                {formData.exam_type === 'Custom / Other' && (
                  <div className="sm:col-span-2 space-y-1 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5">
                    <label className="text-xs font-semibold text-amber-900">
                      Custom Examination Type Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Weekly Assessment, Olympiad, Surprise Quiz"
                      value={customTypeInput}
                      onChange={(e) => setCustomTypeInput(e.target.value)}
                      className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-amber-700">
                      Flexible mode: You can enter any custom exam type name needed by your institution.
                    </p>
                  </div>
                )}

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Status */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Operating Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="draft">Draft (Planning)</option>
                    <option value="scheduled">Scheduled (Date Sheet Announced)</option>
                    <option value="ongoing">Ongoing (Active Examination)</option>
                    <option value="completed">Completed (Evaluation Concluded)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Applicable Classes */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Applicable Classes ({formData.applicable_classes.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllClasses}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      {formData.applicable_classes.length === ALL_SCHOOL_CLASSES.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
                    {ALL_SCHOOL_CLASSES.map((cls) => {
                      const checked = formData.applicable_classes.includes(cls)
                      return (
                        <label
                          key={cls}
                          className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleClass(cls)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>{cls}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Description / Instructions */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Guidelines & Instructions</label>
                  <textarea
                    rows="2"
                    placeholder="Enter instructions for teachers, parents, or examination centers..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-lg bg-[#132c4e] px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1e3a8a] disabled:opacity-50 transition-colors"
                >
                  {formSubmitting ? 'Saving...' : editingExam ? 'Update Examination' : 'Save Examination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
