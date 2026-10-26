import React, { useState, useMemo } from 'react';
import { CLASS_OPTIONS, SECTION_OPTIONS } from '../../../constants/schoolOptions';
import SlotEditorModal from '../Modals/SlotEditorModal';
import { saveTimetableEntry, deleteTimetableEntry } from '../../../Api/timetable';

export default function WeeklyTimetableTab({
  academicSession,
  periods = [],
  entries = [],
  teachers = [],
  subjects = [],
  onRefresh,
}) {
  // Mode: 'class' view or 'teacher' view
  const [viewMode, setViewMode] = useState('class');

  // Filters
  const [selectedClass, setSelectedClass] = useState('1');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // Editor Modal
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [savingSlot, setSavingSlot] = useState(false);
  const [toast, setToast] = useState(null);

  const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Set default teacher if not set
  React.useEffect(() => {
    if (!selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, selectedTeacherId]);

  // Filter entries based on viewMode
  const filteredEntries = useMemo(() => {
    return (entries || []).filter((e) => {
      if (e.academic_session !== academicSession) return false;
      if (viewMode === 'class') {
        return (
          String(e.class_name).toLowerCase() === String(selectedClass).toLowerCase() &&
          String(e.section).toUpperCase() === String(selectedSection).toUpperCase()
        );
      } else {
        return String(e.teacher_id) === String(selectedTeacherId);
      }
    });
  }, [entries, academicSession, viewMode, selectedClass, selectedSection, selectedTeacherId]);

  // Cell index map: `${weekday}-${period_number}` -> entry
  const cellMap = useMemo(() => {
    const map = new Map();
    for (const e of filteredEntries) {
      map.set(`${e.weekday}-${e.period_number}`, e);
    }
    return map;
  }, [filteredEntries]);

  // Click on cell
  const handleCellClick = (weekday, period) => {
    const isBreak = period.type === 'lunch' || period.type === 'break' || period.type === 'assembly';
    if (isBreak) return; // Breaks are common fixed rows

    const existingSlot = cellMap.get(`${weekday}-${period.period_number}`);
    if (existingSlot) {
      setSelectedSlot(existingSlot);
    } else {
      setSelectedSlot({
        academic_session: academicSession,
        weekday,
        period_number: period.period_number,
        period_id: period.id,
        start_time: period.start_time,
        end_time: period.end_time,
        class_name: viewMode === 'class' ? selectedClass : '1',
        section: viewMode === 'class' ? selectedSection : 'A',
        subject_name: '',
        teacher_id: viewMode === 'teacher' ? selectedTeacherId : '',
        teacher_name: viewMode === 'teacher' ? (teachers.find((t) => t.id === selectedTeacherId)?.fullName || '') : '',
        room_no: `Room ${selectedClass}01`,
        status: 'draft',
      });
    }
    setEditorModalOpen(true);
  };

  const handleSaveSlot = async (slotData) => {
    setSavingSlot(true);
    try {
      const res = await saveTimetableEntry(slotData);
      if (res.success) {
        showToast('success', res.message || 'Timetable slot saved successfully.');
        setEditorModalOpen(false);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      const conflictMsg = err.response?.data?.conflicts?.[0]?.message || err.message || 'Failed to save slot.';
      showToast('error', conflictMsg);
    } finally {
      setSavingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      const res = await deleteTimetableEntry(slotId);
      if (res.success) {
        showToast('success', 'Timetable slot deleted.');
        setEditorModalOpen(false);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to delete slot.');
    }
  };

  const selectedTeacherObj = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <div className="space-y-6">

      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold shadow-xl animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Grid Filter Bar with View Mode Toggle */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* View Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('class')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'class'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base text-emerald-600">school</span>
              Class View
            </button>
            <button
              onClick={() => setViewMode('teacher')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'teacher'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base text-blue-600">person</span>
              Teacher View
            </button>
          </div>

          {/* Conditional Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {viewMode === 'class' ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Class:</span>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
                  >
                    {CLASS_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Section:</span>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
                  >
                    {SECTION_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Select Teacher:</span>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-blue-600 focus:outline-hidden max-w-xs"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName || t.name || t.employeeId} ({t.designation || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => {
                window.print();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              title="Print Current Grid"
            >
              <span className="material-symbols-outlined text-base">print</span>
              Print
            </button>
          </div>

        </div>

        {/* View Summary Subtitle */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {viewMode === 'class' ? (
              <>
                Weekly Schedule Grid for <strong className="text-slate-800">Class {selectedClass}-{selectedSection}</strong> · Session {academicSession}
              </>
            ) : (
              <>
                Weekly Teaching Routine for <strong className="text-slate-800">{selectedTeacherObj?.fullName || 'Teacher'}</strong> ({selectedTeacherObj?.designation || 'Faculty'})
              </>
            )}
          </span>
          <span className="text-[11px] text-slate-400">
            Click any cell to edit or allocate schedule
          </span>
        </div>
      </div>

      {/* Weekly Grid Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[900px]">
            <thead>
              <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4 w-36 border-r border-slate-800 text-center">
                  Period / Time
                </th>
                {ALL_DAYS.map((day) => (
                  <th key={day} className="py-3.5 px-4 text-center border-r border-slate-800 last:border-r-0">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {periods.map((period) => {
                const isBreak = period.type === 'lunch' || period.type === 'break' || period.type === 'assembly';

                if (isBreak) {
                  return (
                    <tr key={period.id || period.period_number} className="bg-amber-50/70 border-y border-amber-200">
                      <td className="py-2.5 px-4 font-bold text-amber-900 text-center border-r border-amber-200 bg-amber-100/50">
                        <div className="text-[11px] uppercase tracking-wider">{period.name}</div>
                        <div className="text-[10px] text-amber-700 font-normal">{period.start_time} - {period.end_time}</div>
                      </td>
                      <td colSpan={ALL_DAYS.length} className="py-2.5 px-4 text-center text-xs font-bold text-amber-900 uppercase tracking-widest">
                        {period.name} · All Classes & Teachers ({period.start_time} — {period.end_time})
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={period.id || period.period_number} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Row Header: Period & Time */}
                    <td className="py-3 px-3 border-r border-slate-200 bg-slate-50 text-center align-middle">
                      <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        {period.name}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                        {period.start_time} - {period.end_time}
                      </div>
                    </td>

                    {/* Day Cells */}
                    {ALL_DAYS.map((day) => {
                      const slot = cellMap.get(`${day}-${period.period_number}`);

                      return (
                        <td
                          key={day}
                          onClick={() => handleCellClick(day, period)}
                          className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 align-top cursor-pointer group hover:bg-emerald-50/30 transition-colors"
                        >
                          {slot ? (
                            <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs group-hover:border-emerald-300 group-hover:shadow-xs transition-all space-y-1">
                              <div className="flex items-start justify-between gap-1">
                                <span className="text-xs font-black text-slate-900 leading-tight">
                                  {slot.subject_name}
                                </span>
                                {slot.status === 'published' ? (
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" title="Published" />
                                ) : (
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1" title="Draft" />
                                )}
                              </div>

                              {viewMode === 'class' ? (
                                <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 truncate">
                                  <span className="material-symbols-outlined text-xs">person</span>
                                  {slot.teacher_name || 'Unassigned'}
                                </p>
                              ) : (
                                <p className="text-[11px] font-bold text-blue-700 flex items-center gap-1 truncate">
                                  <span className="material-symbols-outlined text-xs">school</span>
                                  Class {slot.class_name}-{slot.section}
                                </p>
                              )}

                              {slot.room_no && (
                                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[10px]">meeting_room</span>
                                  {slot.room_no}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="h-16 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 group-hover:border-emerald-300 group-hover:text-emerald-600 transition-colors">
                              <span className="material-symbols-outlined text-base">add</span>
                              <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                Assign
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slot Editor Modal */}
      <SlotEditorModal
        isOpen={editorModalOpen}
        onClose={() => setEditorModalOpen(false)}
        slotData={selectedSlot}
        onSave={handleSaveSlot}
        onDelete={handleDeleteSlot}
        teachers={teachers}
        subjects={subjects}
        periods={periods}
        academicSession={academicSession}
        saving={savingSlot}
      />

    </div>
  );
}
