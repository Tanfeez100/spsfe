import React, { useState, useEffect, useRef } from 'react'
import { getAllSubjects, updateSubjectSequence, removeSubjectFromClass } from '../../Api/subjects'
import { getAllClasses } from '../../Api/classes'
import AddSubject from './AddSubject'
import CreateSubject from './CreateSubject'
import DeleteSubject from './DeleteSubject'

const normalizeText = (value) => String(value ?? '').trim()

const getScopedClassSubjects = (classData) => {
  const classValue = normalizeText(classData?.class)
  const sectionSubjects = Array.isArray(classData?.sections)
    ? classData.sections.flatMap((sec) =>
        Array.isArray(sec?.subjects)
          ? sec.subjects.map((subject) => ({
              ...subject,
              classValue,
              section: normalizeText(sec?.section || subject?.section).toUpperCase(),
              scope: 'section',
            }))
          : []
      )
    : []

  const classSubjects = Array.isArray(classData?.subjects)
    ? classData.subjects.map((subject) => ({
        ...subject,
        classValue,
        section: '',
        scope: 'class',
      }))
    : []

  const merged = [...sectionSubjects, ...classSubjects]
  const uniqueByKey = new Map()

  merged.forEach((subject, index) => {
    const key =
      String(subject?.id || '').trim() ||
      `${normalizeText(subject?.subject_name).toLowerCase()}-${normalizeText(subject?.subject_code).toLowerCase()}-${normalizeText(subject?.section).toLowerCase()}-${subject?.scope}-${index}`
    if (!uniqueByKey.has(key)) uniqueByKey.set(key, subject)
  })

  return Array.from(uniqueByKey.values()).sort((a, b) => {
    const seqA = Number(a?.sequence)
    const seqB = Number(b?.sequence)
    const hasSeqA = Number.isFinite(seqA)
    const hasSeqB = Number.isFinite(seqB)
    if (hasSeqA && hasSeqB) return seqA - seqB
    if (hasSeqA) return -1
    if (hasSeqB) return 1
    return normalizeText(a?.subject_name).localeCompare(normalizeText(b?.subject_name))
  })
}

function ClassDropdown({ value, onChange, classes }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(e.target))
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const options = [
    { value: '', label: 'All Classes' },
    ...(classes || []).map((cls) => ({
      value: cls.class,
      label: `Class ${cls.class}`,
    })),
  ]
  const selected = options.find((o) => o.value === value) || options[0]

  return (
    <div className="relative w-full sm:w-64">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="material-symbols-outlined text-slate-400 text-base">filter_list</span>
          <span>{selected.label}</span>
        </div>
        <span className="material-symbols-outlined text-slate-400 text-sm">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm transition-colors ${
                opt.value === value
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AllSubjectDetails() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [expandedClasses, setExpandedClasses] = useState(new Set())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [editSequence, setEditSequence] = useState('')
  const [editError, setEditError] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [removingSubjectId, setRemovingSubjectId] = useState(null)

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    setLoading(true)
    setError('')
    try {
      const [subjectsResponse, classesResponse] = await Promise.all([
        getAllSubjects(),
        getAllClasses(),
      ])

      let finalData = { ...subjectsResponse }

      if (classesResponse && classesResponse.length > 0) {
        if (!finalData.classes || finalData.classes.length === 0) {
          finalData.classes = classesResponse.map((cls) => {
            if (typeof cls === 'string') return { class: cls, sections: [], subjects: [] }
            return { class: cls.class, sections: cls.sections || [], subjects: cls.subjects || [] }
          })
        }
      }

      setData(finalData)
      if (finalData.classes && finalData.classes.length > 0) {
        setExpandedClasses(new Set([finalData.classes[0].class]))
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch subjects')
    } finally {
      setLoading(false)
    }
  }

  const toggleClass = (classValue) => {
    const newExpanded = new Set(expandedClasses)
    if (newExpanded.has(classValue)) {
      newExpanded.delete(classValue)
    } else {
      newExpanded.add(classValue)
    }
    setExpandedClasses(newExpanded)
  }

  const expandAll = () => {
    if (data?.classes) {
      setExpandedClasses(new Set(data.classes.map((c) => c.class)))
    }
  }

  const collapseAll = () => {
    setExpandedClasses(new Set())
  }

  const closeEditModal = () => {
    setEditingSubject(null)
    setEditSequence('')
    setEditError('')
    setSavingEdit(false)
  }

  const handleOpenEdit = (subject) => {
    setEditingSubject(subject)
    setEditSequence(String(subject?.sequence || ''))
    setEditError('')
  }

  const handleSaveEdit = async () => {
    if (!editingSubject?.id) return

    const nextSequence = Number.parseInt(String(editSequence).trim(), 10)
    if (!Number.isInteger(nextSequence) || nextSequence < 1) {
      setEditError('Please enter a valid sequence number.')
      return
    }

    const classScope = normalizeText(editingSubject.classValue || editingSubject.class || '')
    const sectionScope = normalizeText(editingSubject.section || '')
    const duplicate = filteredClasses
      .flatMap((cls) => getScopedClassSubjects(cls))
      .find((subject) => {
        if (!subject?.id || subject.id === editingSubject.id) return false
        const sameClass = normalizeText(subject.classValue || subject.class || '') === classScope
        const sameSection = normalizeText(subject.section || '') === sectionScope
        return sameClass && sameSection && Number(subject.sequence) === nextSequence
      })

    if (duplicate) {
      setEditError(
        `Sequence ${nextSequence} is already used in this class${
          sectionScope ? ` / section ${sectionScope}` : ''
        }.`
      )
      return
    }

    setSavingEdit(true)
    setEditError('')

    try {
      const response = await updateSubjectSequence(editingSubject.id, nextSequence)
      if (response?.success !== false) {
        closeEditModal()
        fetchSubjects()
      } else {
        setEditError(response?.message || 'Failed to update subject sequence')
      }
    } catch (err) {
      setEditError(err?.message || err?.error || 'Failed to update subject sequence')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleRemoveFromClass = async (subject) => {
    if (!subject?.id) return
    const subjectLabel = `${subject.subject_name || 'Subject'}${
      subject.section ? ` (${subject.section})` : ''
    }`
    if (
      !window.confirm(
        `Remove "${subjectLabel}" from Class ${
          subject.classValue || ''
        }? This will unbind it from marksheets and assessments.`
      )
    )
      return

    setRemovingSubjectId(subject.id)
    try {
      const response = await removeSubjectFromClass(subject.id)
      if (response?.success !== false) {
        fetchSubjects()
      } else {
        setError(response?.message || 'Failed to remove subject from class')
      }
    } catch (err) {
      setError(err?.message || err?.error || 'Failed to remove subject from class')
    } finally {
      setRemovingSubjectId(null)
    }
  }

  const filteredClasses =
    data?.classes?.filter((cls) => !selectedClass || cls.class === selectedClass) || []

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            <span>SPS</span>
            <span>/</span>
            <span className="text-blue-600">ACADEMICS</span>
            <span>/</span>
            <span>SUBJECT MANAGEMENT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0f1e36]">
            Subject & Curriculum Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure subjects, syllabus order, and class-wise mappings for Academic Session 2026–27.
          </p>
        </div>

        {/* Action Buttons Matching Theme */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <span className="material-symbols-outlined text-base text-blue-600">add</span>
            <span>New Master Subject</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f1e36] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#152e50] transition-all"
          >
            <span className="material-symbols-outlined text-base">link</span>
            <span>Assign to Class</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 shadow-2xs hover:bg-rose-50 transition-all"
          >
            <span className="material-symbols-outlined text-base text-rose-500">delete</span>
            <span>Manage & Delete</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-lg">error</span>
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-rose-500 hover:text-rose-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. KPI Summary Cards */}
      {!loading && !error && data?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Classes
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[#0f1e36]">
                {data.summary.total_classes}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Classrooms enrolled</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Class Mappings
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[#0f1e36]">
                {data.summary.total_subject_mappings}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Curriculum allocations</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <span className="material-symbols-outlined text-2xl">menu_book</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Unique Subjects
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[#0f1e36]">
                {data.summary.total_unique_subjects}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">In master catalogue</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <span className="material-symbols-outlined text-2xl">library_books</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Filter Bar & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <ClassDropdown
            value={selectedClass}
            onChange={setSelectedClass}
            classes={data?.classes || []}
          />
          {selectedClass && (
            <button
              type="button"
              onClick={() => setSelectedClass('')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={expandAll}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-2xs">
          <span className="material-symbols-outlined animate-spin text-3xl text-blue-600">sync</span>
          <p className="mt-2 text-xs font-semibold text-slate-500">Loading curriculum data...</p>
        </div>
      )}

      {/* 4. Class-wise Subjects List */}
      {!loading && !error && filteredClasses.length > 0 && (
        <div className="space-y-4">
          {filteredClasses.map((classData) => {
            const classSubjects = getScopedClassSubjects(classData)
            const isExpanded = expandedClasses.has(classData.class)

            return (
              <div
                key={classData.class}
                className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleClass(classData.class)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e2ecf8] text-[#1d4ed8]">
                      <span className="material-symbols-outlined text-xl">auto_stories</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#0f1e36]">
                          Class {classData.class}
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200/60">
                          {classSubjects.length} {classSubjects.length === 1 ? 'Subject' : 'Subjects'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {classSubjects.length > 0
                          ? `Sequence: ${classSubjects.map((s) => s.subject_name).slice(0, 4).join(', ')}${classSubjects.length > 4 ? '...' : ''}`
                          : 'No subjects assigned yet'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400 text-lg transition-transform duration-200">
                      {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                    </span>
                  </div>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 bg-[#fbfcfb]/50">
                    {classSubjects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-4">
                        {classSubjects.map((subject, subjectIndex) => (
                          <div
                            key={subject.id || `${subject.subject_code}-${subjectIndex}`}
                            className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-md bg-blue-50 text-[11px] font-bold text-blue-700 border border-blue-200">
                                  #{subject.sequence}
                                </span>

                                {subject.section ? (
                                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                    Sec {subject.section}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
                                    All Sections
                                  </span>
                                )}
                              </div>

                              <h4 className="mt-2 text-sm font-bold text-slate-900 line-clamp-1">
                                {subject.subject_name}
                              </h4>
                              <p className="text-xs font-mono font-medium text-slate-400 mt-0.5">
                                {subject.subject_code}
                              </p>
                            </div>

                            {/* Card Footer Actions */}
                            {subject.id && (
                              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(subject)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-xs text-slate-400">
                                    swap_vert
                                  </span>
                                  <span>Order</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromClass(subject)}
                                  disabled={removingSubjectId === subject.id}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-xs">close</span>
                                  <span>{removingSubjectId === subject.id ? '...' : 'Remove'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400">
                        <span className="material-symbols-outlined text-3xl mb-1">menu_book</span>
                        <p className="text-xs">No subjects mapped to Class {classData.class} yet.</p>
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(true)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                          Assign subjects now
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredClasses.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
          <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">menu_book</span>
          <h3 className="text-base font-bold text-slate-800">No classes found</h3>
          <p className="text-xs text-slate-500 mt-1">
            No class curriculum matches the selected filter criteria.
          </p>
        </div>
      )}

      {/* Modals */}
      <CreateSubject
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchSubjects}
      />
      <AddSubject
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchSubjects}
      />
      <DeleteSubject
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={fetchSubjects}
      />

      {/* Edit Sequence Modal Matching Theme */}
      {editingSubject && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={closeEditModal} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-[#0f1e36]">Update Subject Position</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingSubject.subject_name}
                  {editingSubject.section ? ` (Sec ${editingSubject.section})` : ''} • Class{' '}
                  {editingSubject.classValue}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {editError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                  {editError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Display Sequence Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={editSequence}
                  onChange={(e) => setEditSequence(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="e.g. 1"
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Defines the appearance order in marksheets, report cards, and student view.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {savingEdit ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">check</span>
                    <span>Save Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AllSubjectDetails