import React, { useState } from 'react';
import { CLASS_OPTIONS, SECTION_OPTIONS } from '../../../constants/schoolOptions';

export default function CopyScheduleModal({
  isOpen,
  onClose,
  mode = 'copy-day', // 'copy-day' | 'copy-week'
  currentClass = '1',
  currentSection = 'A',
  currentDay = 'Monday',
  academicSession = '2026-27',
  onExecuteCopy,
  copying = false,
}) {
  const [sourceDay, setSourceDay] = useState(currentDay);
  const [targetDays, setTargetDays] = useState(['Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [sourceClass, setSourceClass] = useState(currentClass);
  const [sourceSection, setSourceSection] = useState(currentSection);
  const [targetClass, setTargetClass] = useState(currentClass);
  const [targetSection, setTargetSection] = useState('B');
  const [overwrite, setOverwrite] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const toggleTargetDay = (day) => {
    setTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCopy = (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'copy-day') {
      if (targetDays.length === 0) {
        setError('Please select at least one target day to copy to.');
        return;
      }
      onExecuteCopy({
        mode: 'day',
        academic_session: academicSession,
        class_name: sourceClass,
        section: sourceSection,
        source_day: sourceDay,
        target_days: targetDays,
        overwrite,
      });
    } else {
      if (sourceClass === targetClass && sourceSection === targetSection) {
        setError('Source and target class/section cannot be identical.');
        return;
      }
      onExecuteCopy({
        mode: 'week',
        academic_session: academicSession,
        source_class: sourceClass,
        source_section: sourceSection,
        target_class: targetClass,
        target_section: targetSection,
        overwrite,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <span className="material-symbols-outlined text-lg">content_copy</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {mode === 'copy-day' ? 'Copy Daily Schedule' : 'Copy Weekly Timetable'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {mode === 'copy-day'
                  ? `Replicate ${sourceDay}'s schedule across other weekdays`
                  : `Copy full weekly routine between sections`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCopy} className="p-6 space-y-4">
          {mode === 'copy-day' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Class & Section
                  </label>
                  <div className="h-10 flex items-center px-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                    Class {sourceClass}-{sourceSection}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Source Day
                  </label>
                  <select
                    value={sourceDay}
                    onChange={(e) => {
                      setSourceDay(e.target.value);
                      setTargetDays((prev) => prev.filter((d) => d !== e.target.value));
                    }}
                    className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
                  >
                    {ALL_DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Target Days to Populate
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_DAYS.filter((d) => d !== sourceDay).map((day) => (
                    <label
                      key={day}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                        targetDays.includes(day)
                          ? 'border-emerald-300 bg-emerald-50/60 text-emerald-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={targetDays.includes(day)}
                        onChange={() => toggleTargetDay(day)}
                        className="h-4 w-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Copy Week Mode */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Source Classroom</p>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Class</label>
                    <select
                      value={sourceClass}
                      onChange={(e) => setSourceClass(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium"
                    >
                      {CLASS_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          Class {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Section</label>
                    <select
                      value={sourceSection}
                      onChange={(e) => setSourceSection(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium"
                    >
                      {SECTION_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          Section {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Target Classroom</p>
                  <div>
                    <label className="text-[11px] font-semibold text-emerald-700">Class</label>
                    <select
                      value={targetClass}
                      onChange={(e) => setTargetClass(e.target.value)}
                      className="w-full h-9 rounded-lg border border-emerald-300 bg-white px-2.5 text-xs font-medium"
                    >
                      {CLASS_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          Class {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-emerald-700">Section</label>
                    <select
                      value={targetSection}
                      onChange={(e) => setTargetSection(e.target.value)}
                      className="w-full h-9 rounded-lg border border-emerald-300 bg-white px-2.5 text-xs font-medium"
                    >
                      {SECTION_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          Section {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Overwrite Checkbox */}
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-sm border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-xs font-bold text-amber-900 block">
                  Overwrite existing schedules on target slots
                </span>
                <span className="text-[11px] text-amber-700 leading-tight block mt-0.5">
                  If unchecked, existing slots on target days will be preserved and conflicts reported.
                </span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={copying}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {copying ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Copying...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  Execute Copy
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
