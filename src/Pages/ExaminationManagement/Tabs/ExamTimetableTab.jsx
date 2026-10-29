import React, { useState, useEffect, useRef } from 'react'
import {
  getTimetablesApi,
  createTimetableEntryApi,
  updateTimetableEntryApi,
  deleteTimetableEntryApi,
  copyTimetableApi,
  togglePublishTimetableApi,
  getExamSubjectsApi,
} from '../../../Api/examinations'
import { emitToast } from '../../../Api/auth'

const ALL_CLASSES = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8']

export default function ExamTimetableTab({ activeExam, exams = [] }) {
  const [selectedExamId, setSelectedExamId] = useState(activeExam?.id || exams[0]?.id || '')
  const [selectedClass, setSelectedClass] = useState('Class 1')
  const [selectedSection, setSelectedSection] = useState('All')
  const [viewMode, setViewMode] = useState('class') // 'class' or 'date'
  const [loading, setLoading] = useState(false)
  const [timetables, setTimetables] = useState([])
  const [conflicts, setConflicts] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])

  // Modal State for Slot
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [slotData, setSlotData] = useState({
    class_name: 'Class 1',
    section: 'All',
    subject_name: '',
    exam_date: '',
    start_time: '09:00 AM',
    end_time: '11:30 AM',
    max_marks: 50,
    room_no: '',
    instructions: '',
    status: 'draft',
  })

  // Copy Modal State
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const [copyToClass, setCopyToClass] = useState('Class 2')

  // Print Mode State
  const [isPrintPreview, setIsPrintPreview] = useState(false)
  const printAreaRef = useRef(null)

  // Sync selected exam from prop
  useEffect(() => {
    if (activeExam?.id && activeExam.id !== selectedExamId) {
      setSelectedExamId(activeExam.id)
    } else if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(exams[0].id)
    }
  }, [activeExam, exams])

  const loadTimetables = async () => {
    if (!selectedExamId) return
    setLoading(true)
    try {
      const res = await getTimetablesApi(selectedExamId, {
        className: viewMode === 'class' ? selectedClass : 'All',
        section: selectedSection,
      })
      if (res?.success) {
        setTimetables(res.data || [])
        setConflicts(res.conflicts || [])
      }
    } catch (err) {
      emitToast('error', err.message || 'Failed to load timetable')
    } finally {
      setLoading(false)
    }
  }

  const loadSubjects = async () => {
    if (!selectedExamId) return
    try {
      const res = await getExamSubjectsApi(selectedExamId, selectedClass)
      if (res?.success && Array.isArray(res.data)) {
        setAvailableSubjects(res.data)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadTimetables()
    loadSubjects()
  }, [selectedExamId, selectedClass, selectedSection, viewMode])

  const openAddSlotModal = () => {
    setEditingEntry(null)
    setSlotData({
      class_name: selectedClass,
      section: selectedSection,
      subject_name: availableSubjects[0]?.subject_name || '',
      exam_date: '',
      start_time: '09:00 AM',
      end_time: '11:30 AM',
      max_marks: availableSubjects[0]?.max_marks || 50,
      room_no: '',
      instructions: '',
      status: 'draft',
    })
    setIsModalOpen(true)
  }

  const openEditSlotModal = (entry) => {
    setEditingEntry(entry)
    setSlotData({
      class_name: entry.class_name,
      section: entry.section,
      subject_name: entry.subject_name,
      exam_date: entry.exam_date,
      start_time: entry.start_time,
      end_time: entry.end_time,
      max_marks: entry.max_marks || 50,
      room_no: entry.room_no || '',
      instructions: entry.instructions || '',
      status: entry.status || 'draft',
    })
    setIsModalOpen(true)
  }

  const handleSaveSlot = async (e) => {
    e.preventDefault()
    if (!slotData.exam_date || !slotData.subject_name) {
      emitToast('warning', 'Please fill in date and subject')
      return
    }

    setSubmitting(true)
    try {
      if (editingEntry) {
        const res = await updateTimetableEntryApi(selectedExamId, editingEntry.id, slotData)
        emitToast('success', res.message || 'Slot updated successfully')
      } else {
        const res = await createTimetableEntryApi(selectedExamId, slotData)
        emitToast('success', res.message || 'Slot added successfully')
      }
      setIsModalOpen(false)
      loadTimetables()
    } catch (err) {
      emitToast('error', err.message || 'Failed to save slot')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Delete this timetable routine slot?')) return
    try {
      const res = await deleteTimetableEntryApi(selectedExamId, slotId)
      emitToast('success', res.message || 'Slot removed')
      loadTimetables()
    } catch (err) {
      emitToast('error', err.message || 'Failed to remove slot')
    }
  }

  const handleCopyTimetable = async () => {
    if (selectedClass === copyToClass) {
      emitToast('warning', 'Source and target class cannot be the same')
      return
    }
    try {
      const res = await copyTimetableApi(selectedExamId, selectedClass, copyToClass)
      emitToast('success', res.message || 'Timetable copied')
      setIsCopyModalOpen(false)
      loadTimetables()
    } catch (err) {
      emitToast('error', err.message || 'Failed to copy timetable')
    }
  }

  const handleTogglePublish = async (publish) => {
    try {
      const res = await togglePublishTimetableApi(selectedExamId, selectedClass, publish)
      emitToast('success', res.message || 'Publication status updated')
      loadTimetables()
    } catch (err) {
      emitToast('error', err.message || 'Failed to change publish status')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const currentExamObj = exams.find((e) => e.id === selectedExamId) || activeExam

  // Helper: compute Day of Week
  const getDayOfWeek = (dateString) => {
    if (!dateString) return ''
    try {
      const d = new Date(dateString)
      return d.toLocaleDateString('en-US', { weekday: 'long' })
    } catch {
      return ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Printable Routine Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-routine, #printable-routine * {
            visibility: visible !important;
          }
          #printable-routine {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 24px !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Control Strip */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
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

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('class')}
              className={`rounded-md px-2.5 py-1 font-bold transition-colors ${
                viewMode === 'class' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Class-wise View
            </button>
            <button
              onClick={() => setViewMode('date')}
              className={`rounded-md px-2.5 py-1 font-bold transition-colors ${
                viewMode === 'date' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Consolidated Date-wise
            </button>
          </div>

          {/* Class Filter (active in class view) */}
          {viewMode === 'class' && (
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
          )}

          {/* Section Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Section:</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'class' && (
            <button
              onClick={() => setIsCopyModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
              title="Copy Timetable to another class"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              Copy Routine
            </button>
          )}

          <button
            onClick={() => setIsPrintPreview(!isPrintPreview)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors ${
              isPrintPreview
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-sm">print</span>
            {isPrintPreview ? 'Exit Print View' : 'Printable A4 Routine'}
          </button>

          <button
            onClick={openAddSlotModal}
            className="inline-flex items-center gap-1 rounded-lg bg-[#132c4e] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1e3a8a] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Exam Slot
          </button>
        </div>
      </div>

      {/* Conflict Warning Alerts if detected */}
      {conflicts.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 shadow-2xs text-xs text-rose-800 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-rose-900">
            <span className="material-symbols-outlined text-sm text-rose-600">warning</span>
            Schedule Conflict Alert ({conflicts.length} overlap detected)
          </div>
          {conflicts.map((c, i) => (
            <p key={i} className="text-[11px] leading-relaxed pl-5">
              • {c.message}
            </p>
          ))}
        </div>
      )}

      {/* Publication Banner */}
      <div className="no-print flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Status for {selectedClass}:</span>
          {timetables.length > 0 && timetables.every((t) => t.status === 'published') ? (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Published (Visible to Students & Parents)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
              Draft (Staff Only)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {timetables.length > 0 && (
            <button
              onClick={() => handleTogglePublish(!timetables.every((t) => t.status === 'published'))}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-2xs transition-colors ${
                timetables.every((t) => t.status === 'published')
                  ? 'border border-amber-300 bg-white text-amber-700 hover:bg-amber-50'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {timetables.every((t) => t.status === 'published') ? 'Unpublish Routine' : 'Publish Timetable'}
            </button>
          )}
        </div>
      </div>

      {/* Routine Table View (Screen) */}
      {!isPrintPreview ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Date & Day</th>
                  {viewMode === 'date' && <th className="px-3 py-3">Class</th>}
                  <th className="px-3 py-3">Subject</th>
                  <th className="px-3 py-3">Timing</th>
                  <th className="px-3 py-3">Max Marks</th>
                  <th className="px-3 py-3">Room / Venue</th>
                  <th className="px-3 py-3">Instructions</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={viewMode === 'date' ? 9 : 8} className="px-4 py-8 text-center text-slate-400">
                      Loading routine timetable entries...
                    </td>
                  </tr>
                ) : timetables.length === 0 ? (
                  <tr>
                    <td colSpan={viewMode === 'date' ? 9 : 8} className="px-4 py-8 text-center text-slate-400">
                      No timetable slots scheduled yet for this selection. Click "Add Exam Slot" to build the date sheet.
                    </td>
                  </tr>
                ) : (
                  timetables.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-bold text-slate-800 text-xs">{item.exam_date}</p>
                        <p className="text-[10px] text-slate-400">{getDayOfWeek(item.exam_date)}</p>
                      </td>
                      {viewMode === 'date' && (
                        <td className="px-3 py-3">
                          <span className="font-bold text-blue-700">{item.class_name}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({item.section})</span>
                        </td>
                      )}
                      <td className="px-3 py-3">
                        <p className="font-bold text-[#0f1e36] text-xs">{item.subject_name}</p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="font-semibold text-slate-700">{item.start_time} - {item.end_time}</p>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-700">
                        {item.max_marks || 50}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {item.room_no || 'Examination Hall'}
                      </td>
                      <td className="px-3 py-3 text-slate-500 text-[11px] max-w-xs truncate">
                        {item.instructions || 'Standard examination rules apply.'}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                            item.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditSlotModal(item)}
                            className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 shadow-2xs"
                            title="Edit Slot"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(item.id)}
                            className="rounded border border-slate-200 bg-white p-1 text-rose-600 hover:bg-rose-50 shadow-2xs"
                            title="Delete Slot"
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
      ) : (
        /* Printable A4 Routine Document */
        <div className="space-y-3">
          <div className="no-print flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
            <span>
              <strong>Print Preview:</strong> This formatted A4 date sheet is ready for distribution or notice boards.
            </span>
            <button
              onClick={handlePrint}
              className="rounded-lg bg-blue-600 px-3 py-1 font-bold text-white shadow-xs hover:bg-blue-700 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Print Now (A4)
            </button>
          </div>

          <div
            id="printable-routine"
            ref={printAreaRef}
            className="w-full max-w-4xl mx-auto rounded-xl border border-slate-300 bg-white p-8 shadow-sm text-slate-800"
          >
            {/* School Header */}
            <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
              <h1 className="text-2xl font-black tracking-tight text-[#071d3f] uppercase">
                STAR PUBLIC SCHOOL
              </h1>
              <p className="text-xs text-slate-600 font-medium tracking-wide">
                Affiliated to State Board | Bettiah, West Champaran, Bihar - 845438
              </p>
              <div className="mt-2 inline-block bg-slate-100 border border-slate-300 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider text-slate-800">
                {currentExamObj?.name || 'EXAMINATION ROUTINE'} · SESSION {currentExamObj?.academic_session || '2026-27'}
              </div>
              <p className="text-xs font-bold text-slate-700 mt-1">
                Class: {selectedClass} {selectedSection !== 'All' ? `(${selectedSection})` : ''} · DATE SHEET / TIMETABLE
              </p>
            </div>

            {/* Routine Table */}
            <table className="w-full border-collapse border border-slate-400 text-xs text-left mb-6">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px] border-b border-slate-400">
                  <th className="border border-slate-400 px-3 py-2 text-center w-12">S.No</th>
                  <th className="border border-slate-400 px-3 py-2">Date & Day</th>
                  <th className="border border-slate-400 px-3 py-2">Subject</th>
                  <th className="border border-slate-400 px-3 py-2">Examination Timing</th>
                  <th className="border border-slate-400 px-3 py-2 text-center w-20">Max Marks</th>
                  <th className="border border-slate-400 px-3 py-2">Room / Hall</th>
                </tr>
              </thead>
              <tbody>
                {timetables.map((t, idx) => (
                  <tr key={t.id} className="border-b border-slate-300">
                    <td className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 font-bold">
                      {t.exam_date} <span className="font-normal text-slate-500">({getDayOfWeek(t.exam_date)})</span>
                    </td>
                    <td className="border border-slate-300 px-3 py-2 font-bold text-slate-900">
                      {t.subject_name}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 font-semibold">
                      {t.start_time} to {t.end_time}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-center font-bold">
                      {t.max_marks || 50}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-slate-600">
                      {t.room_no || 'Main Hall'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* General Instructions */}
            <div className="border border-slate-300 rounded-lg p-3.5 mb-8 text-[11px] text-slate-700 space-y-1 bg-slate-50/50">
              <p className="font-bold text-slate-900 text-xs">Important Instructions for Candidates & Parents:</p>
              <p>1. Students must arrive at the school campus 20 minutes prior to exam commencement.</p>
              <p>2. Mandatory items: Authentic School ID Card, Examination Admit Card, stationery, and water bottle.</p>
              <p>3. Electronic devices, mobile phones, and non-permitted study material are strictly prohibited.</p>
              <p>4. In case of illness or unforeseen absence, medical certificate must be submitted on the same day.</p>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-3 pt-6 text-center text-xs text-slate-800">
              <div className="space-y-12">
                <div />
                <p className="border-t border-slate-400 pt-1 font-semibold">Class Teacher</p>
              </div>
              <div className="space-y-12">
                <div />
                <p className="border-t border-slate-400 pt-1 font-semibold">Exam Controller</p>
              </div>
              <div className="space-y-12">
                <div />
                <p className="border-t border-slate-400 pt-1 font-bold">Principal Signature & Seal</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Timetable Slot */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingEntry ? 'Edit Routine Slot' : 'Add Timetable Routine Slot'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Class</label>
                  <select
                    value={slotData.class_name}
                    onChange={(e) => setSlotData({ ...slotData, class_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  >
                    {ALL_CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Section</label>
                  <select
                    value={slotData.section}
                    onChange={(e) => setSlotData({ ...slotData, section: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="All">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    value={slotData.subject_name}
                    onChange={(e) => setSlotData({ ...slotData, subject_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Exam Date</label>
                  <input
                    type="date"
                    required
                    value={slotData.exam_date}
                    onChange={(e) => setSlotData({ ...slotData, exam_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Start Time</label>
                  <input
                    type="text"
                    required
                    placeholder="09:00 AM"
                    value={slotData.start_time}
                    onChange={(e) => setSlotData({ ...slotData, start_time: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">End Time</label>
                  <input
                    type="text"
                    required
                    placeholder="11:30 AM"
                    value={slotData.end_time}
                    onChange={(e) => setSlotData({ ...slotData, end_time: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Max Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={slotData.max_marks}
                    onChange={(e) => setSlotData({ ...slotData, max_marks: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Room / Hall</label>
                  <input
                    type="text"
                    placeholder="Room 101"
                    value={slotData.room_no}
                    onChange={(e) => setSlotData({ ...slotData, room_no: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Special Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Geometry box allowed, oral questions included"
                    value={slotData.instructions}
                    onChange={(e) => setSlotData({ ...slotData, instructions: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
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
                  {submitting ? 'Saving...' : editingEntry ? 'Update Slot' : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Copy Timetable */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Copy Timetable</h3>
            <p className="text-xs text-slate-600">
              Copy complete date sheet routine from <strong>{selectedClass}</strong> to another class.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Target Class</label>
              <select
                value={copyToClass}
                onChange={(e) => setCopyToClass(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                {ALL_CLASSES.filter((c) => c !== selectedClass).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCopyTimetable}
                className="rounded-lg bg-[#132c4e] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#1e3a8a]"
              >
                Copy Routine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
