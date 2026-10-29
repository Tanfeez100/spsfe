import React, { useState, useEffect } from 'react';
import { CLASS_OPTIONS, SECTION_OPTIONS } from '../../../constants/schoolOptions';

export default function SlotEditorModal({
  isOpen,
  onClose,
  slotData,
  onSave,
  onDelete,
  teachers = [],
  subjects = [],
  periods = [],
  academicSession = '2026-27',
  saving = false,
}) {
  const [formData, setFormData] = useState({
    id: null,
    academic_session: academicSession,
    weekday: 'Monday',
    period_number: 1,
    period_id: '',
    start_time: '',
    end_time: '',
    class_name: '1',
    section: 'A',
    subject_id: '',
    subject_name: '',
    teacher_id: '',
    teacher_name: '',
    room_no: '',
    status: 'draft',
  });

  const [formError, setFormError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (slotData) {
      setFormData({
        id: slotData.id || null,
        academic_session: slotData.academic_session || academicSession,
        weekday: slotData.weekday || 'Monday',
        period_number: slotData.period_number ?? 1,
        period_id: slotData.period_id || '',
        start_time: slotData.start_time || '',
        end_time: slotData.end_time || '',
        class_name: slotData.class_name || '1',
        section: slotData.section || 'A',
        subject_id: slotData.subject_id || '',
        subject_name: slotData.subject_name || '',
        teacher_id: slotData.teacher_id || '',
        teacher_name: slotData.teacher_name || '',
        room_no: slotData.room_no || '',
        status: slotData.status || 'draft',
      });
    }
    setFormError('');
    setShowDeleteConfirm(false);
  }, [slotData, academicSession]);

  if (!isOpen) return null;

  const handlePeriodChange = (pNum) => {
    const num = Number(pNum);
    const matched = periods.find((p) => Number(p.period_number) === num);
    setFormData((prev) => ({
      ...prev,
      period_number: num,
      period_id: matched?.id || prev.period_id,
      start_time: matched?.start_time || prev.start_time,
      end_time: matched?.end_time || prev.end_time,
    }));
  };

  const handleSubjectChange = (subjName) => {
    const matched = subjects.find((s) => s.name === subjName);
    setFormData((prev) => ({
      ...prev,
      subject_name: subjName,
      subject_id: matched?.id || '',
    }));
  };

  const handleTeacherChange = (teacherId) => {
    const matched = teachers.find((t) => t.id === teacherId);
    setFormData((prev) => ({
      ...prev,
      teacher_id: teacherId,
      teacher_name: matched ? (matched.fullName || matched.name) : '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject_name) {
      setFormError('Please select or specify a subject.');
      return;
    }
    setFormError('');
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {formData.id ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Class {formData.class_name}-{formData.section} · {formData.weekday}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            <span className="material-symbols-outlined text-base">warning</span>
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Day & Period Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Day of Week
              </label>
              <select
                value={formData.weekday}
                onChange={(e) => setFormData((prev) => ({ ...prev, weekday: e.target.value }))}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Period
              </label>
              <select
                value={formData.period_number}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              >
                {periods.map((p) => (
                  <option key={p.id || p.period_number} value={p.period_number}>
                    {p.name} ({p.start_time} - {p.end_time})
                  </option>
                ))}
                {periods.length === 0 && (
                  [1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      Period {n}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Class & Section Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Class
              </label>
              <select
                value={formData.class_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, class_name: e.target.value }))}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Section
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData((prev) => ({ ...prev, section: e.target.value }))}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              >
                {SECTION_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Subject <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={formData.subject_name}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="flex-1 h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((s) => (
                  <option key={s.id || s.name} value={s.name}>
                    {s.name} {s.code ? `(${s.code})` : ''}
                  </option>
                ))}
                {subjects.length === 0 && (
                  <option value="" disabled>No subjects found in database</option>
                )}
              </select>
            </div>
          </div>

          {/* Teacher Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Assign Teacher
            </label>
            <select
              value={formData.teacher_id}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
            >
              <option value="">-- No Teacher Assigned (Unassigned) --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName || t.name || t.employeeId} {t.designation ? `(${t.designation})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Classroom / Room No & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Room / Lab
              </label>
              <input
                type="text"
                value={formData.room_no}
                onChange={(e) => setFormData((prev) => ({ ...prev, room_no: e.target.value }))}
                placeholder="e.g. Room 101, Lab 2"
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Active)</option>
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <div>
              {formData.id && (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in">
                    <span className="text-xs text-rose-600 font-semibold">Delete?</span>
                    <button
                      type="button"
                      onClick={() => onDelete(formData.id)}
                      className="px-2 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2 py-1 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Delete Slot
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">check</span>
                    Save Slot
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
