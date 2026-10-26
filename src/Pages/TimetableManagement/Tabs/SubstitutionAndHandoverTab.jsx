import React, { useState, useEffect, useMemo } from 'react';
import {
  getSubstitutions,
  getAvailableSubstitutes,
  assignSubstitution,
  deleteSubstitution,
  replaceFacultyInRoutine,
} from '../../../Api/timetable';
import { CLASS_OPTIONS } from '../../../constants/schoolOptions';

export default function SubstitutionAndHandoverTab({
  teachers = [],
  periods = [],
  entries = [],
  academicSession = '2026-27',
  onRefresh,
}) {
  const [activeMode, setActiveMode] = useState('daily_proxy'); // 'daily_proxy' | 'permanent_handover'

  // Daily Proxy State
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedAbsentTeacherId, setSelectedAbsentTeacherId] = useState('');
  const [substitutions, setSubstitutions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Proxy Assignment Modal State
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [activeSlotToSubstitute, setActiveSlotToSubstitute] = useState(null);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState('');
  const [substitutionReason, setSubstitutionReason] = useState('Faculty on leave');
  const [submittingProxy, setSubmittingProxy] = useState(false);

  // Permanent Handover State
  const [outgoingTeacherId, setOutgoingTeacherId] = useState('');
  const [incomingTeacherId, setIncomingTeacherId] = useState('');
  const [handoverClassFilter, setHandoverClassFilter] = useState('All');
  const [handoverPreview, setHandoverPreview] = useState(null);
  const [submittingHandover, setSubmittingHandover] = useState(false);

  // Feedback Toast
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Determine weekday from selectedDate
  const selectedWeekday = useMemo(() => {
    if (!selectedDate) return 'Monday';
    const dayIndex = new Date(selectedDate).getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Monday';
  }, [selectedDate]);

  // Load substitutions for selected date
  const loadSubstitutions = async () => {
    setLoadingSubs(true);
    try {
      const res = await getSubstitutions({
        date: selectedDate,
        academic_session: academicSession,
      });
      if (res.success) {
        setSubstitutions(res.substitutions || []);
      }
    } catch (err) {
      console.error('Failed to load substitutions:', err);
    } finally {
      setLoadingSubs(false);
    }
  };

  useEffect(() => {
    loadSubstitutions();
  }, [selectedDate, academicSession]);

  // Default absent teacher selection
  useEffect(() => {
    if (!selectedAbsentTeacherId && teachers.length > 0) {
      setSelectedAbsentTeacherId(teachers[0].id);
    }
  }, [teachers, selectedAbsentTeacherId]);

  // Find all master periods scheduled for the selected absent teacher on this weekday
  const absentTeacherSlots = useMemo(() => {
    if (!selectedAbsentTeacherId) return [];
    return (entries || [])
      .filter(
        (e) =>
          e.academic_session === academicSession &&
          e.weekday === selectedWeekday &&
          String(e.teacher_id) === String(selectedAbsentTeacherId)
      )
      .sort((a, b) => Number(a.period_number) - Number(b.period_number));
  }, [entries, academicSession, selectedWeekday, selectedAbsentTeacherId]);

  // Open modal to assign proxy for a slot
  const handleOpenAssignProxy = async (slot) => {
    setActiveSlotToSubstitute(slot);
    setSelectedSubstituteId('');
    setSubstitutionReason('Faculty on leave / absent');
    setProxyModalOpen(true);
    setLoadingAvailable(true);

    try {
      const res = await getAvailableSubstitutes({
        date: selectedDate,
        weekday: selectedWeekday,
        period_number: slot.period_number,
        academic_session: academicSession,
        exclude_teacher_id: slot.teacher_id,
      });
      if (res.success) {
        setAvailableTeachers(res.available_teachers || []);
        if (res.available_teachers?.length > 0) {
          setSelectedSubstituteId(res.available_teachers[0].id);
        }
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to fetch free teachers.');
    } finally {
      setLoadingAvailable(false);
    }
  };

  // Submit Proxy Assignment
  const handleSaveProxy = async (e) => {
    e.preventDefault();
    if (!selectedSubstituteId) {
      showToast('error', 'Please select an available substitute teacher.');
      return;
    }
    const subObj = availableTeachers.find((t) => t.id === selectedSubstituteId) || teachers.find((t) => t.id === selectedSubstituteId);
    const subName = subObj?.fullName || subObj?.name || 'Substitute Teacher';

    setSubmittingProxy(true);
    try {
      const res = await assignSubstitution({
        academic_session: academicSession,
        substitution_date: selectedDate,
        weekday: selectedWeekday,
        period_number: activeSlotToSubstitute.period_number,
        period_id: activeSlotToSubstitute.period_id,
        class_name: activeSlotToSubstitute.class_name,
        section: activeSlotToSubstitute.section,
        subject_name: activeSlotToSubstitute.subject_name,
        original_teacher_id: activeSlotToSubstitute.teacher_id,
        original_teacher_name: activeSlotToSubstitute.teacher_name,
        substitute_teacher_id: selectedSubstituteId,
        substitute_teacher_name: subName,
        reason: substitutionReason,
      });

      if (res.success) {
        showToast('success', res.message);
        setProxyModalOpen(false);
        loadSubstitutions();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to assign proxy.');
    } finally {
      setSubmittingProxy(false);
    }
  };

  // Cancel Proxy
  const handleCancelProxy = async (subId) => {
    try {
      const res = await deleteSubstitution(subId);
      if (res.success) {
        showToast('success', res.message);
        loadSubstitutions();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to cancel proxy.');
    }
  };

  // Compute Permanent Handover Preview
  useEffect(() => {
    if (!outgoingTeacherId) {
      setHandoverPreview(null);
      return;
    }

    const targetSlots = (entries || []).filter((e) => {
      if (e.academic_session !== academicSession) return false;
      if (String(e.teacher_id) !== String(outgoingTeacherId)) return false;
      if (handoverClassFilter !== 'All' && String(e.class_name).toLowerCase() !== String(handoverClassFilter).toLowerCase()) {
        return false;
      }
      return true;
    });

    const outTeacherObj = teachers.find((t) => t.id === outgoingTeacherId);
    const inTeacherObj = teachers.find((t) => t.id === incomingTeacherId);

    // Collision check if incoming teacher selected
    let collisions = [];
    if (incomingTeacherId && incomingTeacherId !== outgoingTeacherId) {
      for (const slot of targetSlots) {
        const busy = (entries || []).find(
          (e) =>
            e.academic_session === academicSession &&
            e.weekday === slot.weekday &&
            Number(e.period_number) === Number(slot.period_number) &&
            String(e.teacher_id) === String(incomingTeacherId) &&
            e.id !== slot.id
        );
        if (busy) {
          collisions.push({
            weekday: slot.weekday,
            period_number: slot.period_number,
            conflictingClass: `${busy.class_name}-${busy.section}`,
            subject: busy.subject_name,
            targetClass: `${slot.class_name}-${slot.section}`,
          });
        }
      }
    }

    setHandoverPreview({
      totalSlots: targetSlots.length,
      targetSlots,
      outTeacherName: outTeacherObj?.fullName || outTeacherObj?.name || 'Outgoing Faculty',
      inTeacherName: inTeacherObj?.fullName || inTeacherObj?.name || '',
      collisions,
    });
  }, [entries, academicSession, outgoingTeacherId, incomingTeacherId, handoverClassFilter, teachers]);

  // Execute Permanent Handover
  const handleExecuteHandover = async () => {
    if (!outgoingTeacherId || !incomingTeacherId) {
      showToast('error', 'Please select both outgoing and incoming teachers.');
      return;
    }
    if (outgoingTeacherId === incomingTeacherId) {
      showToast('error', 'Outgoing and incoming teachers cannot be the same.');
      return;
    }
    if (handoverPreview?.collisions?.length > 0) {
      showToast('error', `Cannot handover: Incoming teacher already has ${handoverPreview.collisions.length} conflicting period(s).`);
      return;
    }

    setSubmittingHandover(true);
    try {
      const res = await replaceFacultyInRoutine({
        academic_session: academicSession,
        outgoing_teacher_id: outgoingTeacherId,
        outgoing_teacher_name: handoverPreview.outTeacherName,
        incoming_teacher_id: incomingTeacherId,
        incoming_teacher_name: handoverPreview.inTeacherName,
        class_filter: handoverClassFilter,
      });

      if (res.success) {
        showToast('success', res.message);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showToast('error', err.message || 'Handover failed.');
    } finally {
      setSubmittingHandover(false);
    }
  };

  const absentTeacherObj = teachers.find((t) => t.id === selectedAbsentTeacherId);

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

      {/* Header & Mode Switcher */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <span className="material-symbols-outlined text-2xl">published_with_changes</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Substitution & Faculty Reassignment
              </h2>
              <p className="text-xs text-slate-500">
                Master routine remains fixed. Assign temporary substitutes for absent teachers or transfer routines when faculty changes.
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveMode('daily_proxy')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'daily_proxy'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base text-amber-600">event_busy</span>
              Daily Proxy (Absent Teacher)
            </button>
            <button
              onClick={() => setActiveMode('permanent_handover')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'permanent_handover'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base text-blue-600">swap_horiz</span>
              Permanent Handover (Teacher Left / New)
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: DAILY PROXY MANAGEMENT */}
      {activeMode === 'daily_proxy' && (
        <div className="space-y-6">

          {/* Date & Absent Teacher Selector Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Date of Absence
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-amber-600 focus:outline-hidden"
                  />
                </div>

                <div className="h-9 w-px bg-slate-200 hidden sm:block mx-1" />

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Select Absent Faculty
                  </label>
                  <select
                    value={selectedAbsentTeacherId}
                    onChange={(e) => setSelectedAbsentTeacherId(e.target.value)}
                    className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-amber-600 focus:outline-hidden min-w-[240px]"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName || t.name || t.employeeId} ({t.designation || 'Teacher'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 border border-amber-200">
                  <span className="material-symbols-outlined text-sm mr-1">today</span>
                  {selectedWeekday} · {selectedDate}
                </span>
                <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                  {substitutions.length} proxy(s) assigned today
                </span>
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-3">
              Master timetable remains untouched. Temporary substitutes are assigned for this specific date only and automatically reflected on teacher & class portals.
            </p>
          </div>

          {/* Periods Affected for the Absent Teacher */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Scheduled Periods for {absentTeacherObj?.fullName || 'Faculty'} on {selectedWeekday}
                </h3>
                <p className="text-xs text-slate-500">
                  Assign available free teachers to ensure no class period goes unattended.
                </p>
              </div>

              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                {absentTeacherSlots.length} period(s) on master routine
              </span>
            </div>

            {absentTeacherSlots.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {absentTeacherSlots.map((slot) => {
                  // Check if this slot already has a substitute today
                  const activeSub = substitutions.find(
                    (s) =>
                      s.substitution_date === selectedDate &&
                      Number(s.period_number) === Number(slot.period_number) &&
                      String(s.class_name).toLowerCase() === String(slot.class_name).toLowerCase() &&
                      String(s.section).toUpperCase() === String(slot.section).toUpperCase()
                  );

                  return (
                    <div
                      key={slot.id}
                      className="p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Period & Class details */}
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-sm">
                          P{slot.period_number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">
                              Class {slot.class_name}-{slot.section} · {slot.subject_name}
                            </span>
                            {slot.room_no && (
                              <span className="text-[11px] font-semibold text-slate-400">
                                ({slot.room_no})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Regular Teacher: <strong className="text-slate-700">{slot.teacher_name}</strong> · Timing: {slot.start_time} - {slot.end_time}
                          </p>
                        </div>
                      </div>

                      {/* Substitution Status & Action */}
                      <div className="flex items-center gap-3">
                        {activeSub ? (
                          <div className="flex items-center gap-2">
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-right">
                              <span className="text-[10px] font-black uppercase text-emerald-800 block">
                                Proxy Assigned
                              </span>
                              <span className="font-bold text-emerald-950">
                                {activeSub.substitute_teacher_name}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCancelProxy(activeSub.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                              title="Cancel Proxy"
                            >
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAssignProxy(slot)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">person_add</span>
                            Assign Substitute
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 font-medium">
                No teaching periods scheduled on {selectedWeekday} for {absentTeacherObj?.fullName}. No substitute required.
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODE 2: PERMANENT FACULTY REPLACEMENT (HANDOVER) */}
      {activeMode === 'permanent_handover' && (
        <div className="space-y-6">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                Permanent Routine Handover / Faculty Transfer
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Use this when a teacher leaves the school (resigns) or a new faculty member joins and inherits all or part of an existing routine.
              </p>
            </div>

            {/* Handover Mapping Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Outgoing Teacher */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider">
                  1. Outgoing Faculty (Leaving / Relieved)
                </label>
                <select
                  value={outgoingTeacherId}
                  onChange={(e) => setOutgoingTeacherId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-rose-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-rose-600 focus:outline-hidden"
                >
                  <option value="">-- Select Outgoing Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName || t.name || t.employeeId} ({t.designation || 'Teacher'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-rose-700">
                  Their existing scheduled periods in master routine will be reassigned.
                </p>
              </div>

              {/* Incoming Teacher */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  2. Incoming Faculty (New Joiner / Successor)
                </label>
                <select
                  value={incomingTeacherId}
                  onChange={(e) => setIncomingTeacherId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="">-- Select Incoming Teacher --</option>
                  {teachers
                    .filter((t) => t.id !== outgoingTeacherId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName || t.name || t.employeeId} ({t.designation || 'Teacher'})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-emerald-700">
                  Will inherit the teaching periods and classrooms in the master routine.
                </p>
              </div>

              {/* Class Scope Filter */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. Scope / Class Filter
                </label>
                <select
                  value={handoverClassFilter}
                  onChange={(e) => setHandoverClassFilter(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-slate-600 focus:outline-hidden"
                >
                  <option value="All">All Assigned Classes & Periods</option>
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      Class {c} Only
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Select "All" to completely transfer the faculty's master routine.
                </p>
              </div>

            </div>

            {/* Collision Warning if any */}
            {handoverPreview?.collisions?.length > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-900">
                  <span className="material-symbols-outlined text-base">warning</span>
                  <span>
                    Cannot Handover: {handoverPreview.inTeacherName} already has {handoverPreview.collisions.length} conflicting period(s) in the master routine:
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  {handoverPreview.collisions.map((c, i) => (
                    <li key={i}>
                      {c.weekday} Period {c.period_number}: Already scheduled for Class {c.conflictingClass} ({c.subject})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview Summary & Execute Button */}
            {handoverPreview && outgoingTeacherId && (
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Handover Summary: Transferring {handoverPreview.totalSlots} period(s)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    From <strong>{handoverPreview.outTeacherName}</strong> to{' '}
                    <strong>{handoverPreview.inTeacherName || 'Select Incoming Teacher'}</strong>
                  </p>
                </div>

                <button
                  onClick={handleExecuteHandover}
                  disabled={
                    submittingHandover ||
                    !incomingTeacherId ||
                    handoverPreview.collisions?.length > 0 ||
                    handoverPreview.totalSlots === 0
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submittingHandover ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Executing Handover...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">check</span>
                      Execute Permanent Handover ({handoverPreview.totalSlots} Slots)
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ASSIGN PROXY MODAL DIALOG */}
      {proxyModalOpen && activeSlotToSubstitute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Assign Substitute Teacher</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Class {activeSlotToSubstitute.class_name}-{activeSlotToSubstitute.section} · Period {activeSlotToSubstitute.period_number}
                </p>
              </div>
              <button
                onClick={() => setProxyModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProxy} className="p-6 space-y-4">
              
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Day:</span>
                  <strong className="text-slate-800">{selectedDate} ({selectedWeekday})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subject:</span>
                  <strong className="text-slate-800">{activeSlotToSubstitute.subject_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Absent Teacher:</span>
                  <strong className="text-rose-700">{activeSlotToSubstitute.teacher_name}</strong>
                </div>
              </div>

              {/* Available Teachers Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Select Free Faculty Member <span className="text-rose-500">*</span>
                </label>
                {loadingAvailable ? (
                  <div className="h-10 rounded-xl border border-slate-200 bg-slate-100 flex items-center px-3 text-xs text-slate-500">
                    Checking teacher schedules...
                  </div>
                ) : availableTeachers.length > 0 ? (
                  <select
                    value={selectedSubstituteId}
                    onChange={(e) => setSelectedSubstituteId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-amber-600 focus:outline-hidden"
                  >
                    {availableTeachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} · {t.designation || 'Faculty'} (Free Period {activeSlotToSubstitute.period_number})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800 font-semibold">
                    No faculty members are completely free during Period {activeSlotToSubstitute.period_number}. You can still choose from staff:
                    <select
                      value={selectedSubstituteId}
                      onChange={(e) => setSelectedSubstituteId(e.target.value)}
                      className="w-full h-9 rounded-lg border border-amber-300 bg-white px-2.5 text-xs font-bold mt-2"
                    >
                      <option value="">-- Choose Staff --</option>
                      {teachers
                        .filter((t) => t.id !== activeSlotToSubstitute.teacher_id)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName || t.name} ({t.designation || 'Staff'})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  value={substitutionReason}
                  onChange={(e) => setSubstitutionReason(e.target.value)}
                  placeholder="e.g. Sick Leave, Personal, School Duty"
                  className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProxyModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProxy || !selectedSubstituteId}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {submittingProxy ? 'Assigning...' : 'Confirm Proxy'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
