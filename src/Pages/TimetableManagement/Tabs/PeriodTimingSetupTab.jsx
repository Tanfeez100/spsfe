import React, { useState, useEffect } from 'react';
import { saveTimetableSettings } from '../../../Api/timetable';

export default function PeriodTimingSetupTab({
  settings,
  periods,
  onRefresh,
}) {
  const [formSettings, setFormSettings] = useState({
    academic_session: '2026-27',
    effective_date: '2026-04-01',
    school_start_time: '08:00',
    school_end_time: '14:20',
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    periods_per_day: 8,
    description: 'Star Public School Standard Academic Timetable Schedule',
  });

  const [periodList, setPeriodList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (settings) {
      setFormSettings({
        academic_session: settings.academic_session || '2026-27',
        effective_date: settings.effective_date || '2026-04-01',
        school_start_time: settings.school_start_time || '08:00',
        school_end_time: settings.school_end_time || '14:20',
        working_days: Array.isArray(settings.working_days) ? settings.working_days : ALL_DAYS,
        periods_per_day: settings.periods_per_day || 8,
        description: settings.description || '',
      });
    }
    if (Array.isArray(periods) && periods.length > 0) {
      setPeriodList([...periods].sort((a, b) => (a.sort_order ?? a.period_number) - (b.sort_order ?? b.period_number)));
    } else {
      // Default standard 8 period schedule
      setPeriodList([
        { id: 'def-0', period_number: 0, name: 'Morning Assembly', type: 'assembly', start_time: '08:00', end_time: '08:30', is_break: true, is_active: true },
        { id: 'def-1', period_number: 1, name: 'Period 1', type: 'regular', start_time: '08:30', end_time: '09:15', is_break: false, is_active: true },
        { id: 'def-2', period_number: 2, name: 'Period 2', type: 'regular', start_time: '09:15', end_time: '10:00', is_break: false, is_active: true },
        { id: 'def-3', period_number: 3, name: 'Period 3', type: 'regular', start_time: '10:00', end_time: '10:45', is_break: false, is_active: true },
        { id: 'def-4', period_number: 4, name: 'Recess / Lunch', type: 'lunch', start_time: '10:45', end_time: '11:20', is_break: true, is_active: true },
        { id: 'def-5', period_number: 5, name: 'Period 4', type: 'regular', start_time: '11:20', end_time: '12:05', is_break: false, is_active: true },
        { id: 'def-6', period_number: 6, name: 'Period 5', type: 'regular', start_time: '12:05', end_time: '12:50', is_break: false, is_active: true },
        { id: 'def-7', period_number: 7, name: 'Period 6', type: 'regular', start_time: '12:50', end_time: '13:35', is_break: false, is_active: true },
        { id: 'def-8', period_number: 8, name: 'Period 7', type: 'regular', start_time: '13:35', end_time: '14:20', is_break: false, is_active: true },
      ]);
    }
  }, [settings, periods]);

  const toggleWorkingDay = (day) => {
    setFormSettings((prev) => {
      const days = prev.working_days.includes(day)
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day];
      return { ...prev, working_days: days };
    });
  };

  const handlePeriodChange = (index, field, value) => {
    setPeriodList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'type') {
        updated[index].is_break = value === 'lunch' || value === 'break' || value === 'assembly';
      }
      return updated;
    });
  };

  const addPeriodRow = () => {
    const nextNum = periodList.length > 0 ? Math.max(...periodList.map((p) => Number(p.period_number) || 0)) + 1 : 1;
    const lastPeriod = periodList[periodList.length - 1];
    const defaultStart = lastPeriod?.end_time || '12:00';
    
    // Add 45 mins to start
    const [h, m] = defaultStart.split(':').map(Number);
    const endMinutes = (h * 60 + m + 45) % (24 * 60);
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endM = String(endMinutes % 60).padStart(2, '0');

    setPeriodList((prev) => [
      ...prev,
      {
        id: `p-new-${Date.now()}`,
        period_number: nextNum,
        name: `Period ${nextNum}`,
        type: 'regular',
        start_time: defaultStart,
        end_time: `${endH}:${endM}`,
        is_break: false,
        is_active: true,
      },
    ]);
  };

  const removePeriodRow = (index) => {
    setPeriodList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setValidationErrors([]);
    setSuccessMessage('');

    try {
      const payload = {
        ...formSettings,
        periods: periodList.map((p, idx) => ({
          ...p,
          period_number: idx,
          sort_order: idx,
        })),
      };

      const res = await saveTimetableSettings(payload);
      if (res.success) {
        setSuccessMessage('Timetable settings and period configuration updated successfully!');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      } else {
        setValidationErrors([err.message || 'Failed to save configuration.']);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <span className="material-symbols-outlined text-2xl">schedule</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Period & School Timing Setup</h2>
              <p className="text-xs text-slate-500">
                Configure school hours, working days, daily period slots, and break schedules.
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving Configuration...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">save</span>
                Save & Apply Configuration
              </>
            )}
          </button>
        </div>

        {/* Validation Errors Alert */}
        {validationErrors.length > 0 && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
            <div className="flex items-center gap-2 font-bold text-rose-900 mb-1">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>Please resolve timing validation conflicts:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 animate-in fade-in">
            <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* General School Timing Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* School Hours & Session */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-2">
            1. School Hours & Academic Session
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Session</label>
              <input
                type="text"
                value={formSettings.academic_session}
                onChange={(e) => setFormSettings((prev) => ({ ...prev, academic_session: e.target.value }))}
                placeholder="2026-27"
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Effective Date</label>
              <input
                type="date"
                value={formSettings.effective_date}
                onChange={(e) => setFormSettings((prev) => ({ ...prev, effective_date: e.target.value }))}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">School Opening Time</label>
              <input
                type="time"
                value={formSettings.school_start_time}
                onChange={(e) => setFormSettings((prev) => ({ ...prev, school_start_time: e.target.value }))}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">School Closing Time</label>
              <input
                type="time"
                value={formSettings.school_end_time}
                onChange={(e) => setFormSettings((prev) => ({ ...prev, school_end_time: e.target.value }))}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Schedule Description / Notes</label>
            <input
              type="text"
              value={formSettings.description}
              onChange={(e) => setFormSettings((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="e.g. Standard Summer Academic Routine"
              className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Working Days */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-2">
            2. Working Days
          </h3>

          <div className="space-y-2">
            {ALL_DAYS.map((day) => (
              <label
                key={day}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  formSettings.working_days.includes(day)
                    ? 'border-emerald-300 bg-emerald-50/60 text-emerald-900'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span>{day}</span>
                <input
                  type="checkbox"
                  checked={formSettings.working_days.includes(day)}
                  onChange={() => toggleWorkingDay(day)}
                  className="h-4 w-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* Visual Timeline Bar Preview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
            Day Schedule Timeline Visualizer
          </h3>
          <span className="text-xs text-slate-400">
            {formSettings.school_start_time} — {formSettings.school_end_time}
          </span>
        </div>

        <div className="flex h-11 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 p-1 gap-1">
          {periodList
            .filter((p) => p.is_active !== false)
            .map((p, idx) => {
              const isBreak = p.type === 'lunch' || p.type === 'break' || p.type === 'assembly';
              const colorClass =
                p.type === 'lunch'
                  ? 'bg-amber-500 text-white'
                  : p.type === 'break'
                    ? 'bg-orange-400 text-white'
                    : p.type === 'assembly'
                      ? 'bg-purple-600 text-white'
                      : 'bg-emerald-600 text-white';

              return (
                <div
                  key={p.id || idx}
                  className={`flex-1 flex flex-col items-center justify-center rounded-lg px-1 text-center transition-all ${colorClass}`}
                  title={`${p.name}: ${p.start_time} - ${p.end_time} (${p.type})`}
                >
                  <span className="text-[10px] font-black truncate w-full">{p.name}</span>
                  <span className="text-[8px] opacity-80 leading-none">{p.start_time}-{p.end_time}</span>
                </div>
              );
            })}
        </div>

        <div className="flex items-center gap-4 mt-3 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Regular Period
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Lunch Recess
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-600" /> Assembly
          </span>
        </div>
      </div>

      {/* Periods Configuration Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
              3. Period Slots & Breaks Setup
            </h3>
            <p className="text-xs text-slate-500">
              Set period titles, start & end times, and period types. Overlaps are automatically validated.
            </p>
          </div>

          <button
            type="button"
            onClick={addPeriodRow}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-base text-emerald-600">add</span>
            Add Period Slot
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3">Slot #</th>
                <th className="py-2.5 px-3">Period Label</th>
                <th className="py-2.5 px-3">Start Time</th>
                <th className="py-2.5 px-3">End Time</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periodList.map((period, index) => (
                <tr key={period.id || index} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-500">
                    #{index + 1}
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="text"
                      value={period.name}
                      onChange={(e) => handlePeriodChange(index, 'name', e.target.value)}
                      className="w-44 h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="time"
                      value={period.start_time}
                      onChange={(e) => handlePeriodChange(index, 'start_time', e.target.value)}
                      className="w-28 h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="time"
                      value={period.end_time}
                      onChange={(e) => handlePeriodChange(index, 'end_time', e.target.value)}
                      className="w-28 h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <select
                      value={period.type}
                      onChange={(e) => handlePeriodChange(index, 'type', e.target.value)}
                      className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
                    >
                      <option value="regular">Regular Teaching</option>
                      <option value="lunch">Lunch Recess</option>
                      <option value="break">Short Break</option>
                      <option value="assembly">Assembly</option>
                      <option value="zero_period">Zero Period</option>
                      <option value="activity">Sports / Activity</option>
                    </select>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handlePeriodChange(index, 'is_active', !period.is_active)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                        period.is_active !== false
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {period.is_active !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => removePeriodRow(index)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Delete Period"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
