import React, { useState, useEffect, useMemo } from 'react'
import { getAllSubjects, deleteSubjectById } from '../../Api/subjects'

function DeleteSubject({ isOpen, onClose, onSuccess }) {
  const [allSubjects, setAllSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchAllSubjects()
      setSearchQuery('')
      setError('')
      setSuccess('')
    }
  }, [isOpen])

  const fetchAllSubjects = async () => {
    setLoadingSubjects(true)
    setError('')
    try {
      const response = await getAllSubjects()
      if (response.success && response.all_subjects) {
        setAllSubjects(response.all_subjects || [])
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch subjects')
    } finally {
      setLoadingSubjects(false)
    }
  }

  const handleDelete = async (subjectId, subjectName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${subjectName}" from the master catalogue? This cannot be undone.`
      )
    ) {
      return
    }

    setDeletingId(subjectId)
    setError('')
    setSuccess('')

    try {
      const response = await deleteSubjectById(subjectId)
      if (response && response.success !== false) {
        setSuccess(`Subject "${subjectName}" deleted successfully!`)
        fetchAllSubjects()
        setTimeout(() => {
          onSuccess?.()
        }, 1000)
      } else {
        throw new Error(response?.message || 'Failed to delete subject')
      }
    } catch (err) {
      if (err?.error?.includes('duplicate key') || err?.error?.includes('unique constraint') || err?.message?.includes('foreign key') || err?.message?.includes('assigned')) {
        setError(
          'Cannot delete subject. It is currently assigned to one or more classes. Remove it from classes first.'
        )
      } else {
        setError(err?.response?.data?.message || err?.message || 'Failed to delete subject.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return allSubjects
    const q = searchQuery.toLowerCase()
    return allSubjects.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q)
    )
  }, [allSubjects, searchQuery])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <span className="material-symbols-outlined text-xl">delete_sweep</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0f1e36]">
                Manage Master Subjects
              </h2>
              <p className="text-xs text-slate-500">
                View catalogued subjects or delete unassigned ones
              </p>
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
              <span className="font-semibold">{success}</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 text-base">error</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
              search
            </span>
            <input
              type="text"
              placeholder="Search subjects by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          {/* Loading */}
          {loadingSubjects && (
            <div className="py-12 text-center text-slate-500">
              <span className="material-symbols-outlined animate-spin text-3xl text-blue-600">sync</span>
              <p className="mt-2 text-xs font-semibold">Loading subjects...</p>
            </div>
          )}

          {/* Subjects List */}
          {!loadingSubjects && filteredSubjects.length > 0 && (
            <div className="space-y-2">
              {filteredSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold text-xs">
                      <span className="material-symbols-outlined text-base">menu_book</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {subject.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Code: <span className="font-semibold text-slate-700">{subject.code}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(subject.id, subject.name)}
                    disabled={deletingId === subject.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors shadow-2xs"
                    title="Delete Subject from Master Catalogue"
                  >
                    {deletingId === subject.id ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">delete</span>
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty Search Result */}
          {!loadingSubjects && filteredSubjects.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-slate-500">
              <span className="material-symbols-outlined text-3xl mb-1 text-slate-400">search_off</span>
              <p className="text-xs font-medium">No matching subjects found.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-500">
            Total:{' '}
            <span className="font-bold text-slate-800">{allSubjects.length}</span> master subjects
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteSubject
