import React, { useState, useEffect } from 'react'
import { getExamSubjectsApi, saveExamSubjectApi } from '../../../Api/examinations'
import { emitToast } from '../../../Api/auth'

const ALL_CLASSES = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Nursery', 'LKG', 'UKG']

export default function ExamSubjectsTab({ activeExam, exams = [] }) {
  const [selectedExamId, setSelectedExamId] = useState(activeExam?.id || exams[0]?.id || '')
  const [selectedClass, setSelectedClass] = useState('Class 1')
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    class_name: 'Class 1',
    subject_name: '',
    subject_code: '',
    max_marks: 100,
    pass_marks: 33,
    theory_marks: 80,
    practical_marks: 0,
    oral_marks: 0,
    internal_marks: 20,
    is_optional: false,
    evaluation_type: 'marks',
  })

  useEffect(() => {
    if (activeExam?.id && activeExam.id !== selectedExamId) {
      setSelectedExamId(activeExam.id)
    } else if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(exams[0].id)
    }
  }, [activeExam, exams])

  const loadSubjects = async () => {
    if (!selectedExamId) return
    setLoading(true)
    try {
      const res = await getExamSubjectsApi(selectedExamId, selectedClass)
      if (res?.success) {
        setSubjects(res.data || [])
      }
    } catch (err) {
      emitToast('error', err.message || 'Failed to load examination subjects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubjects()
  }, [selectedExamId, selectedClass])

  const openAddModal = () => {
    setEditingSubject(null)
    setFormData({
      class_name: selectedClass,
      subject_name: '',
      subject_code: '',
      max_marks: 100,
      pass_marks: 33,
      theory_marks: 80,
      practical_marks: 0,
      oral_marks: 0,
      internal_marks: 20,
      is_optional: false,
      evaluation_type: 'marks',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (sub) => {
    setEditingSubject(sub)
    setFormData({
      class_name: sub.class_name,
      subject_name: sub.subject_name,
      subject_code: sub.subject_code || '',
      max_marks: sub.max_marks || 100,
      pass_marks: sub.pass_marks || 33,
      theory_marks: sub.theory_marks || 0,
      practical_marks: sub.practical_marks || 0,
      oral_marks: sub.oral_marks || 0,
      internal_marks: sub.internal_marks || 0,
      is_optional: !!sub.is_optional,
      evaluation_type: sub.evaluation_type || 'marks',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.subject_name.trim()) {
      emitToast('warning', 'Please enter subject name')
      return
    }

    const max = Number(formData.max_marks) || 0
    const pass = Number(formData.pass_marks) || 0
    const theory = Number(formData.theory_marks) || 0
    const practical = Number(formData.practical_marks) || 0
    const oral = Number(formData.oral_marks) || 0
    const internal = Number(formData.internal_marks) || 0

    if (max <= 0) {
      emitToast('error', 'Maximum marks must be greater than zero')
      return
    }
    if (pass > max) {
      emitToast('error', 'Passing marks cannot exceed maximum marks')
      return
    }
    if (theory + practical + oral + internal > max) {
      emitToast('error', `Sum of assessment components (${theory + practical + oral + internal}) cannot exceed maximum marks (${max})`)
      return
    }

    setSubmitting(true)
    try {
      const res = await saveExamSubjectApi(selectedExamId, formData)
      emitToast('success', res.message || 'Subject rules saved successfully')
      setIsModalOpen(false)
      loadSubjects()
    } catch (err) {
      emitToast('error', err.message || 'Failed to save subject assessment rules')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Exam Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Exam:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 focus:outline-none max-w-xs"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.academic_session})
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              {ALL_CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Subject Config Button */}
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1 rounded-lg bg-[#132c4e] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1e3a8a] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Configure Subject
        </button>
      </div>

      {/* Subjects Configuration Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Subject Name</th>
                <th className="px-3 py-3">Code</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Max Marks</th>
                <th className="px-3 py-3">Pass Marks</th>
                <th className="px-3 py-3">Components Breakdown</th>
                <th className="px-3 py-3">Evaluation</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                    Loading subject assessment configurations...
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                    No subjects configured yet for {selectedClass}. Click "Configure Subject" or refresh.
                  </td>
                </tr>
              ) : (
                subjects.map((sub) => (
                  <tr key={sub.id || sub.subject_name} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#0f1e36] text-xs">{sub.subject_name}</p>
                      <p className="text-[10px] text-slate-400">{sub.class_name}</p>
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-600">
                      {sub.subject_code || '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          sub.is_optional ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {sub.is_optional ? 'Optional' : 'Compulsory'}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-extrabold text-slate-800">
                      {sub.max_marks}
                    </td>
                    <td className="px-3 py-3 font-semibold text-emerald-700">
                      {sub.pass_marks}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 border border-blue-200">
                          Th: {sub.theory_marks || 0}
                        </span>
                        {(sub.practical_marks || 0) > 0 && (
                          <span className="rounded bg-purple-50 px-1.5 py-0.5 text-purple-700 border border-purple-200">
                            Prac: {sub.practical_marks}
                          </span>
                        )}
                        {(sub.oral_marks || 0) > 0 && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 border border-amber-200">
                            Oral: {sub.oral_marks}
                          </span>
                        )}
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 border border-emerald-200">
                          Int: {sub.internal_marks || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="capitalize font-semibold text-slate-600">
                        {sub.evaluation_type || 'marks'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditModal(sub)}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                      >
                        Edit Rules
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Configure Subject */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingSubject ? `Configure ${editingSubject.subject_name}` : 'Configure Subject Assessment'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    value={formData.subject_name}
                    onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Subject Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MATH101"
                    value={formData.subject_code}
                    onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Maximum Marks</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.max_marks}
                    onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Passing Marks</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.pass_marks}
                    onChange={(e) => setFormData({ ...formData, pass_marks: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                {/* Breakdown Components */}
                <div className="col-span-2 pt-1 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-600 mb-2">Assessment Components Breakdown:</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600">Theory</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.theory_marks}
                        onChange={(e) => setFormData({ ...formData, theory_marks: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600">Practical</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.practical_marks}
                        onChange={(e) => setFormData({ ...formData, practical_marks: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600">Oral / Viva</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.oral_marks}
                        onChange={(e) => setFormData({ ...formData, oral_marks: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600">Internal</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.internal_marks}
                        onChange={(e) => setFormData({ ...formData, internal_marks: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Evaluation Type</label>
                  <select
                    value={formData.evaluation_type}
                    onChange={(e) => setFormData({ ...formData, evaluation_type: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="marks">Marks-based (Numeric)</option>
                    <option value="grade">Grade-based Only (A/B/C/D)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="opt-subject"
                    checked={formData.is_optional}
                    onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <label htmlFor="opt-subject" className="text-xs text-slate-700 select-none cursor-pointer">
                    Optional Subject (Excluded from mandatory pass rule)
                  </label>
                </div>
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
                  {submitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
