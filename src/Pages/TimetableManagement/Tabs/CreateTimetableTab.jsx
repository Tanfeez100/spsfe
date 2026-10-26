import React, { useState, useMemo } from 'react';
import { CLASS_OPTIONS, SECTION_OPTIONS } from '../../../constants/schoolOptions';
import SlotEditorModal from '../Modals/SlotEditorModal';
import CopyScheduleModal from '../Modals/CopyScheduleModal';
import {
  saveTimetableEntry,
  deleteTimetableEntry,
  copyDaySchedule,
  copyWeekSchedule,
  publishTimetable,
} from '../../../Api/timetable';

export default function CreateTimetableTab({
  academicSession,
  periods = [],
  entries = [],
  teachers = [],
  subjects = [],
  onRefresh,
}) {
  const [selectedClass, setSelectedClass] = useState('1');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDay, setSelectedDay] = useState('Monday');

  // Modals state
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [savingSlot, setSavingSlot] = useState(false);

  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyMode, setCopyMode] = useState('copy-day');
  const [copying, setCopying] = useState(false);

  const [toast, setToast] = useState(null);

  const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Filter entries for current Class, Section, Day
  const currentSlots = useMemo(() => {
    return (entries || []).filter(
      (e) =>
        e.academic_session === academicSession &&
        String(e.class_name).toLowerCase() === String(selectedClass).toLowerCase() &&
        String(e.section).toUpperCase() === String(selectedSection).toUpperCase() &&
        e.weekday === selectedDay
    );
  }, [entries, academicSession, selectedClass, selectedSection, selectedDay]);

  // Map of slots by period number
  const slotByPeriod = useMemo(() => {
    const map = new Map();
    for (const slot of currentSlots) {
      map.set(Number(slot.period_number), slot);
    }
    return map;
  }, [currentSlots]);

  const handleOpenAdd = (period) => {
    setSelectedSlot({
      academic_session: academicSession,
      weekday: selectedDay,
      period_number: period.period_number,
      period_id: period.id,
      start_time: period.start_time,
      end_time: period.end_time,
      class_name: selectedClass,
      section: selectedSection,
      subject_name: '',
      teacher_id: '',
      teacher_name: '',
      room_no: `Room ${selectedClass}01`,
      status: 'draft',
    });
    setEditorModalOpen(true);
  };

  const handleOpenEdit = (slot) => {
    setSelectedSlot(slot);
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

  const handleExecuteCopy = async (payload) => {
    setCopying(true);
    try {
      let res;
      if (payload.mode === 'day') {
        res = await copyDaySchedule(payload);
      } else {
        res = await copyWeekSchedule(payload);
      }
      if (res.success) {
        showToast('success', res.message);
        setCopyModalOpen(false);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      const conflictMsg = err.response?.data?.conflicts?.[0]?.message || err.message || 'Copy operation failed.';
      showToast('error', conflictMsg);
    } finally {
      setCopying(false);
    }
  };

  const handleTogglePublish = async (publish) => {
    try {
      const res = await publishTimetable({
        academic_session: academicSession,
        class_name: selectedClass,
        section: selectedSection,
        publish,
      });
      if (res.success) {
        showToast('success', res.message);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      const msg = err.response?.data?.conflicts?.[0]?.message || err.message || 'Failed to update publication status.';
      showToast('error', msg);
    }
  };

  // Check if all slots in this class & section are published
  const isClassPublished = currentSlots.length > 0 && currentSlots.every((s) => s.status === 'published');

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
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

      {/* Controls Bar: Class, Section, Weekday & Action Buttons */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Class
              </label>
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

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Section
              </label>
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

            <div className="h-8 w-px bg-slate-200 hidden sm:block mx-1" />

            <div className="flex items-center gap-1.5 pt-4 sm:pt-0">
              <span className="text-xs font-bold text-slate-600 mr-1">Session:</span>
              <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-800 border border-emerald-200">
                {academicSession}
              </span>
            </div>
          </div>

          {/* Action Buttons: Copy Day, Copy Week, Publish */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setCopyMode('copy-day');
                setCopyModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-base text-blue-600">content_copy</span>
              Copy Day
            </button>

            <button
              onClick={() => {
                setCopyMode('copy-week');
                setCopyModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-base text-indigo-600">calendar_month</span>
              Copy Week
            </button>

            {isClassPublished ? (
              <button
                onClick={() => handleTogglePublish(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
              >
                <span className="material-symbols-outlined text-base">lock_open</span>
                Unpublish
              </button>
            ) : (
              <button
                onClick={() => handleTogglePublish(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <span className="material-symbols-outlined text-base">publish</span>
                Publish Schedule
              </button>
            )}
          </div>
        </div>

        {/* Weekday Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-100 pt-3">
          {ALL_DAYS.map((day) => {
            const countForDay = (entries || []).filter(
              (e) =>
                e.academic_session === academicSession &&
                String(e.class_name).toLowerCase() === String(selectedClass).toLowerCase() &&
                String(e.section).toUpperCase() === String(selectedSection).toUpperCase() &&
                e.weekday === day
            ).length;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedDay === day
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{day}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedDay === day
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {countForDay}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Timetable Period Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>
            Displaying schedule for <strong className="text-slate-800">Class {selectedClass}-{selectedSection}</strong> on <strong className="text-slate-800">{selectedDay}</strong>
          </span>
          <span>{currentSlots.length} active subject slot(s)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {periods.map((period) => {
            const isBreak = period.type === 'lunch' || period.type === 'break' || period.type === 'assembly';
            const slot = slotByPeriod.get(Number(period.period_number));

            if (isBreak) {
              return (
                <div
                  key={period.id || period.period_number}
                  className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-200/70 px-2 py-0.5 text-[11px] font-black text-amber-900 uppercase">
                      {period.type === 'lunch' ? 'Lunch Recess' : 'Break'}
                    </span>
                    <span className="text-xs font-bold text-amber-800">
                      {period.start_time} - {period.end_time}
                    </span>
                  </div>
                  <div className="py-4 text-center">
                    <p className="text-sm font-bold text-amber-900">{period.name}</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">Common school-wide break</p>
                  </div>
                  <div className="text-[10px] text-amber-600 text-center">Slot #{period.period_number}</div>
                </div>
              );
            }

            if (slot) {
              return (
                <div
                  key={period.id || period.period_number}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      {period.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {period.start_time} - {period.end_time}
                    </span>
                  </div>

                  {/* Subject Title */}
                  <div className="my-2">
                    <h4 className="text-base font-black text-slate-900 leading-tight">
                      {slot.subject_name}
                    </h4>
                    <p className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">person</span>
                      {slot.teacher_name || 'No teacher assigned'}
                    </p>
                    {slot.room_no && (
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">meeting_room</span>
                        {slot.room_no}
                      </p>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        slot.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${slot.status === 'published' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                      {slot.status === 'published' ? 'Published' : 'Draft'}
                    </span>

                    <button
                      onClick={() => handleOpenEdit(slot)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Edit
                    </button>
                  </div>
                </div>
              );
            }

            // Empty Slot (Free period)
            return (
              <div
                key={period.id || period.period_number}
                className="group rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all flex flex-col justify-between min-h-[160px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    {period.name}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {period.start_time} - {period.end_time}
                  </span>
                </div>

                <div className="text-center py-2">
                  <p className="text-xs font-bold text-slate-400">Unassigned / Free</p>
                  <p className="text-[11px] text-slate-400">No subject scheduled</p>
                </div>

                <button
                  onClick={() => handleOpenAdd(period)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-1.5 text-xs font-bold text-slate-600 group-hover:border-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Assign Subject
                </button>
              </div>
            );
          })}
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

      {/* Copy Schedule Modal */}
      <CopyScheduleModal
        isOpen={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        mode={copyMode}
        currentClass={selectedClass}
        currentSection={selectedSection}
        currentDay={selectedDay}
        academicSession={academicSession}
        onExecuteCopy={handleExecuteCopy}
        copying={copying}
      />

    </div>
  );
}
