import React, { useState, useEffect } from 'react'
import {
  addSubjectToClass,
  addMultipleSubjectsToClass,
  getAllSubjects,
  getSubjectsForClass,
} from '../../Api/subjects'
import { CLASS_OPTIONS } from '../../constants/schoolOptions'

function AddSubject({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('single') // 'single' or 'multiple'
  const [formData, setFormData] = useState({
    class: '',
    section: '',
    subject_id: '',
    subject_name: '',
    subject_code: '',
    sequence: '',
    subject_ids: [''],
  })
  const [allSubjects, setAllSubjects] = useState([])
  const [classSubjects, setClassSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingClassSubjects, setLoadingClassSubjects] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Fetch all master subjects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllSubjects()
    }
  }, [isOpen])

  // Fetch class subjects when class/section change to suggest sequence
  useEffect(() => {
    const fetchClassSubjects = async () => {
      if (!isOpen || !formData.class.trim()) {
        setClassSubjects([])
        return
      }

      setLoadingClassSubjects(true)
      try {
        const response = await getSubjectsForClass(formData.class.trim(), formData.section.trim())
        const subjects = Array.isArray(response?.subjects) ? response.subjects : []
        setClassSubjects(subjects)

        // Auto calculate next sequence if in single mode
        if (mode === 'single' && !formData.sequence) {
          const maxSeq = subjects.reduce((max, s) => {
            const num = parseInt(s?.sequence, 10)
            return Number.isFinite(num) && num > max ? num : max
          }, 0)
          setFormData((prev) => ({
            ...prev,
            sequence: String(maxSeq + 1),
          }))
        }
      } catch (err) {
        console.error('Failed to fetch class subjects:', err)
        setClassSubjects([])
      } finally {
        setLoadingClassSubjects(false)
      }
    }

    fetchClassSubjects()
  }, [isOpen, formData.class, formData.section, mode])

  const fetchAllSubjects = async () => {
    setLoadingSubjects(true)
    try {
      const response = await getAllSubjects()
      if (response.success && response.all_subjects) {
        setAllSubjects(response.all_subjects || [])
      }
    } catch (err) {
      console.error('Failed to fetch subjects:', err)
    } finally {
      setLoadingSubjects(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  const handleSubjectSelect = (e) => {
    const subjectId = e.target.value
    const selectedSubject = allSubjects.find((sub) => sub.id === subjectId)

    if (selectedSubject) {
      setFormData((prev) => ({
        ...prev,
        subject_id: selectedSubject.id,
        subject_name: selectedSubject.name,
        subject_code: selectedSubject.code,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        subject_id: '',
        subject_name: '',
        subject_code: '',
      }))
    }
    setError('')
  }

  const handleMultipleSubjectSelect = (index, subjectId) => {
    const newSubjectIds = [...formData.subject_ids]
    newSubjectIds[index] = subjectId
    setFormData((prev) => ({
      ...prev,
      subject_ids: newSubjectIds,
    }))
    setError('')
  }

  const addSubjectField = () => {
    setFormData((prev) => ({
      ...prev,
      subject_ids: [...prev.subject_ids, ''],
    }))
  }

  const removeSubjectField = (index) => {
    if (formData.subject_ids.length > 1) {
      const newSubjectIds = formData.subject_ids.filter((_, i) => i !== index)
      setFormData((prev) => ({
        ...prev,
        subject_ids: newSubjectIds,
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      class: '',
      section: '',
      subject_id: '',
      subject_name: '',
      subject_code: '',
      sequence: '',
      subject_ids: [''],
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'single') {
        if (!formData.class || !formData.subject_name || !formData.subject_code || !formData.sequence) {
          setError('Please fill all required fields.')
          setLoading(false)
          return
        }

        const nextSequence = parseInt(formData.sequence, 10)
        const duplicateSequence = classSubjects.some(
          (subject) => Number(subject?.sequence) === nextSequence
        )
        if (duplicateSequence) {
          setError(
            `Sequence ${nextSequence} is already used in Class ${formData.class}${
              formData.section ? ` (Sec ${formData.section})` : ''
            }.`
          )
          setLoading(false)
          return
        }

        const submitData = {
          class: formData.class,
          section: formData.section.trim(),
          subject_name: formData.subject_name,
          subject_code: formData.subject_code,
          sequence: nextSequence || 1,
        }

        const response = await addSubjectToClass(submitData)

        if (response && response.success !== false) {
          setSuccess(true)
          setError('')
          resetForm()
          setTimeout(() => {
            setSuccess(false)
            onSuccess?.()
            onClose?.()
          }, 1200)
        } else {
          throw new Error(response?.message || 'Failed to add subject')
        }
      } else {
        // Multiple subjects batch
        const validSubjectIds = formData.subject_ids.filter((id) => id && id.trim())
        if (!formData.class || validSubjectIds.length === 0) {
          setError('Please select a class and choose at least one subject.')
          setLoading(false)
          return
        }

        const submitData = {
          class: formData.class,
          section: formData.section.trim(),
          subjects: validSubjectIds.map((subjectId) => ({
            subject_id: subjectId,
          })),
        }

        const response = await addMultipleSubjectsToClass(submitData)

        if (response && response.success !== false) {
          setSuccess(true)
          setError('')
          resetForm()
          setTimeout(() => {
            setSuccess(false)
            onSuccess?.()
            onClose?.()
          }, 1200)
        } else {
          throw new Error(response?.message || 'Failed to add subjects')
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to assign subject(s)'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5'
  const requiredMark = <span className="text-rose-500">*</span>
  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <span className="material-symbols-outlined text-xl">link</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0f1e36]">
                Assign Subject to Class
              </h2>
              <p className="text-xs text-slate-500">Attach master curriculum subjects to classrooms</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
              <span className="font-semibold">Subject(s) successfully assigned to class!</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 text-base">error</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('single')
                setError('')
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'single'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Subject
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('multiple')
                setError('')
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'multiple'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Batch Allocation (Multiple)
            </button>
          </div>

          <form id="add-subject-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Class & Section Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Class {requiredMark}</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Select Target Class</option>
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Section Scope</label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">All Sections (Default)</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>
            </div>

            {/* Single Subject Mode */}
            {mode === 'single' ? (
              <div className="space-y-4 pt-2">
                <div>
                  <label className={labelClass}>Select Master Subject {requiredMark}</label>
                  <select
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleSubjectSelect}
                    className={inputClass}
                    required
                  >
                    <option value="">Choose from master catalogue...</option>
                    {allSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                  {allSubjects.length === 0 && !loadingSubjects && (
                    <p className="mt-1 text-xs text-amber-600">
                      No master subjects found. Please create a master subject first.
                    </p>
                  )}
                </div>

                {formData.subject_id && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className={labelClass}>Subject Code</label>
                      <input
                        type="text"
                        value={formData.subject_code}
                        readOnly
                        className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-mono font-medium text-slate-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Curriculum Sequence {requiredMark}</label>
                      <input
                        type="number"
                        name="sequence"
                        min="1"
                        placeholder="e.g. 1"
                        value={formData.sequence}
                        onChange={handleChange}
                        className={inputClass}
                        required
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        Order in report cards (e.g. 1 for 1st subject).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Multiple Subjects Mode */
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Select Subjects for Batch Mapping {requiredMark}</label>
                  <span className="text-[11px] text-slate-400">
                    {formData.subject_ids.length} selected
                  </span>
                </div>

                <div className="space-y-2.5">
                  {formData.subject_ids.map((subjectId, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        value={subjectId}
                        onChange={(e) => handleMultipleSubjectSelect(index, e.target.value)}
                        className={inputClass}
                        required
                      >
                        <option value="">Select subject #{index + 1}...</option>
                        {allSubjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({sub.code})
                          </option>
                        ))}
                      </select>

                      {formData.subject_ids.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubjectField(index)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addSubjectField}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <span className="material-symbols-outlined text-sm text-blue-600">add</span>
                  <span>Add Another Subject</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-subject-form"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">check</span>
                <span>Assign to Class</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddSubject
