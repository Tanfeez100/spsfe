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

// Graduation cap SVG icon component
const GraduationCapIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
    <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.71 47.87 47.87 0 0 1-8.105 2.374.75.75 0 0 1-.832-.498 48.597 48.597 0 0 1-1.467-4.23l2.943.804ZM12 15.848l-2.663-.727a49.14 49.14 0 0 1-.938-3.868 49.136 49.136 0 0 1 7.015 2.502l-3.414.093Z" />
  </svg>
)

// Chevron down SVG
const ChevronDown = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
)

// Custom dropdown — uses fixed positioning to always render above other elements
function ClassDropdown({ value, onChange, classes }) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(e.target))
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      })
    }
    setOpen(o => !o)
  }

  const options = [{ value: '', label: 'All Classes' }, ...(classes || []).map(cls => ({ value: cls.class, label: `Class ${cls.class}` }))]
  const selected = options.find(o => o.value === value) || options[0]

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center gap-2 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-cyan-400 flex-shrink-0">
          <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.707V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
        </svg>
        <span className="flex-1 text-left">{selected.label}</span>
        <ChevronDown className={`w-4 h-4 text-cyan-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Rendered via fixed position — never clipped by parent overflow or stacking context */}
      {open && (
        <div ref={dropdownRef} style={dropdownStyle} className="rounded-lg border border-slate-200 bg-white shadow-2xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-colors ${
                opt.value === value
                  ? 'bg-cyan-100 text-cyan-800 font-semibold'
                  : 'text-slate-800 hover:bg-slate-100'
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
        getAllClasses()
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
      setEditError(`Sequence ${nextSequence} is already used in this class${sectionScope ? ` / section ${sectionScope}` : ''}.`)
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
    const subjectLabel = `${subject.subject_name || 'Subject'}${subject.section ? ` (${subject.section})` : ''}`
    if (!window.confirm(`Remove "${subjectLabel}" from Class ${subject.classValue || ''}? This will delete related marks and invalidate published results.`)) return

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
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-black text-black">All Subject Details</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-cyan-500 hover:bg-cyan-500/90 text-white font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-lg shadow-cyan-500/20 transition-all text-xs sm:text-sm"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span className="hidden sm:inline">Add Subject</span>
            <span className="sm:hidden">Add</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-cyan-500 hover:bg-cyan-500/90 text-white font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-lg shadow-cyan-500/20 transition-all text-xs sm:text-sm"
          >
            <span className="material-symbols-outlined text-base">book</span>
            <span className="hidden md:inline">Add to Class</span>
            <span className="md:hidden">Add</span>
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-lg shadow-red-600/20 transition-all text-xs sm:text-sm"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-3xl sm:text-4xl text-cyan-200">sync</span>
        </div>
      )}

      {!loading && !error && data?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="gps-kpi-card rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-medium text-slate-600">Total Classes</span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-300/15 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-cyan-200 text-base sm:text-lg">class</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-black">{data.summary.total_classes}</p>
          </div>

          <div className="gps-kpi-card rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-medium text-slate-300">Mappings</span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-300/15 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-cyan-200 text-base sm:text-lg">link</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-black">{data.summary.total_subject_mappings}</p>
          </div>

          <div className="gps-kpi-card rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-medium text-slate-300">Unique Subjects</span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-300/15 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-cyan-200 text-base sm:text-lg">book</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-black">{data.summary.total_unique_subjects}</p>
          </div>
        </div>
      )}

      {!loading && !error && data?.classes && (
        <div className="gps-card rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-2">Filter by Class</label>
              {/* Custom dropdown — fully controlled width and styling */}
              <ClassDropdown
                value={selectedClass}
                onChange={setSelectedClass}
                classes={data?.classes || []}
              />
            </div>
          </div>
        </div>
      )}

      {!loading && !error && filteredClasses.length > 0 && (
        <div className="space-y-2.5 sm:space-y-3">
          {filteredClasses.map((classData) => {
            const classSubjects = getScopedClassSubjects(classData)

            return (
              <div
                key={classData.class}
                className="gps-card rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => toggleClass(classData.class)}
                  className="w-full flex items-center justify-between p-3 sm:p-5 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-all"
                >
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    {/* FIX 2: Graduation cap SVG — no material-symbols, no black box */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 text-slate-600">
                      <GraduationCapIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">Class {classData.class}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">{classSubjects.length} Subjects</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Subjects</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{classSubjects.length}</p>
                    </div>
                  </div>
                </button>

                {expandedClasses.has(classData.class) && (
                  <div className="p-3 sm:p-5 bg-slate-50/50">
                    <div className="gps-card-soft rounded-lg p-3 sm:p-4 border border-slate-200">
                      {classSubjects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                          {classSubjects.map((subject, subjectIndex) => (
                            <div
                              key={subject.id || `${subject.subject_code}-${subjectIndex}`}
                              className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-2.5 sm:p-3 border border-slate-200 hover:border-cyan-400 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-2">
                                    {subject.subject_name}
                                  </h5>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{subject.subject_code}</span>
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {subject.section ? (
                                      <span className="inline-flex items-center rounded-full bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700">
                                        Section {subject.section}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                        Class Scope
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="flex-shrink-0 text-xs bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                    #{subject.sequence}
                                  </span>
                                  {subject.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEdit(subject)}
                                        className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-semibold text-cyan-700 hover:bg-cyan-100"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveFromClass(subject)}
                                        disabled={removingSubjectId === subject.id}
                                        className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                      >
                                        {removingSubjectId === subject.id ? 'Removing...' : 'Remove'}
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">No subjects found for this class</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && !error && filteredClasses.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 sm:p-8 shadow-md border border-cyan-200/30 dark:border-cyan-800/50 text-center">
          <span className="material-symbols-outlined text-3xl sm:text-4xl text-cyan-200 mb-2 block">book</span>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">No subjects found</p>
        </div>
      )}

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

      {editingSubject && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl dark:bg-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit Subject Position</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {editingSubject.subject_name}
                  {editingSubject.section ? `, Section ${editingSubject.section}` : ''} in Class {editingSubject.classValue}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {editError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/30 dark:text-rose-100">
                  {editError}
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-300">
                  New Sequence
                </label>
                <input
                  type="number"
                  min="1"
                  value={editSequence}
                  onChange={(e) => setEditSequence(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  placeholder="Enter sequence number"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Sequence must be unique within the same class and section scope.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-60"
              >
                {savingEdit ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">sync</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">save</span>
                    Save
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