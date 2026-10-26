import React, { useState, useEffect } from 'react';
import {
  getConflictReport,
  getTeacherWorkloadReport,
  getUnassignedPeriodsReport,
} from '../../../Api/timetable';

export default function ConflictReportsTab({
  academicSession = '2026-27',
  onFixSlot,
}) {
  const [activeSubTab, setActiveSubTab] = useState('conflicts'); // 'conflicts' | 'workload' | 'unassigned'
  const [conflictData, setConflictData] = useState(null);
  const [workloadData, setWorkloadData] = useState([]);
  const [unassignedData, setUnassignedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAllReports = async () => {
    setLoading(true);
    setError('');
    try {
      const [conflictsRes, workloadRes, unassignedRes] = await Promise.allSettled([
        getConflictReport(academicSession),
        getTeacherWorkloadReport(academicSession),
        getUnassignedPeriodsReport(academicSession),
      ]);

      if (conflictsRes.status === 'fulfilled') {
        setConflictData(conflictsRes.value);
      }
      if (workloadRes.status === 'fulfilled') {
        setWorkloadData(workloadRes.value?.teachers || []);
      }
      if (unassignedRes.status === 'fulfilled') {
        setUnassignedData(unassignedRes.value?.unassigned || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate audit reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReports();
  }, [academicSession]);

  const conflicts = conflictData?.conflicts || [];
  const teacherConflictsCount = conflictData?.teacherConflictsCount || 0;
  const classConflictsCount = conflictData?.classConflictsCount || 0;
  const roomConflictsCount = conflictData?.roomConflictsCount || 0;

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              conflicts.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <span className="material-symbols-outlined text-2xl">
                {conflicts.length > 0 ? 'warning' : 'verified_user'}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Timetable Conflict & Workload Audits</h2>
              <p className="text-xs text-slate-500">
                Automated detection of teacher collisions, class double-bookings, room overlaps, and faculty workload balances.
              </p>
            </div>
          </div>

          <button
            onClick={loadAllReports}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-base text-emerald-600 ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Re-scan Matrix
          </button>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setActiveSubTab('conflicts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'conflicts'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-sm">report_problem</span>
            <span>Conflicts</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                conflicts.length > 0
                  ? 'bg-rose-500 text-white'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {conflicts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('workload')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'workload'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-sm">equalizer</span>
            <span>Teacher Workload</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {workloadData.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('unassigned')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'unassigned'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-sm">person_off</span>
            <span>Unassigned Slots</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {unassignedData.length}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* TAB 1: CONFLICTS REPORT */}
      {activeSubTab === 'conflicts' && (
        <div className="space-y-4">
          
          {/* Summary Metric Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Teacher Double-Bookings
              </span>
              <div className="text-2xl font-black text-rose-600">
                {teacherConflictsCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Simultaneous classroom collisions</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Class Double-Bookings
              </span>
              <div className="text-2xl font-black text-rose-600">
                {classConflictsCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Two subjects in same period</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Room Allocation Collisions
              </span>
              <div className="text-2xl font-black text-amber-600">
                {roomConflictsCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Overbooked physical classrooms</p>
            </div>

          </div>

          {/* Conflict List */}
          {conflicts.length > 0 ? (
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 shadow-2xs space-y-2 transition-all hover:bg-rose-50/70"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 text-white px-2 py-0.5 text-[10px] font-black uppercase">
                        {conflict.category}
                      </span>
                      <h4 className="text-xs font-black text-slate-900">
                        {conflict.title}
                      </h4>
                    </div>

                    <span className="text-xs font-bold text-slate-500">
                      {conflict.weekday} · Period {conflict.period_number}
                    </span>
                  </div>

                  <p className="text-xs text-rose-900 leading-relaxed font-medium">
                    {conflict.description}
                  </p>

                  {/* Conflicting Slots Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-rose-100">
                    {conflict.entries?.map((entry, idx) => (
                      <div
                        key={entry.id || idx}
                        className="rounded-xl border border-rose-200/80 bg-white p-2.5 text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{entry.subject_name}</p>
                          <p className="text-[11px] text-slate-500">
                            Class {entry.class_name}-{entry.section} · {entry.teacher_name || 'Staff'} {entry.room_no ? `(${entry.room_no})` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-12 text-center shadow-xs space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </div>
              <h3 className="text-sm font-bold text-emerald-950">Zero Scheduling Conflicts Detected!</h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                All teacher allocations, classroom rooms, and class period schedules are 100% harmonized without overlaps.
              </p>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: TEACHER WORKLOAD REPORT */}
      {activeSubTab === 'workload' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Faculty Teaching Workload Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Weekly period loads mapped against standard 30 period/week maximum capacity.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Print Report
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Faculty Name</th>
                  <th className="py-3 px-4">Weekly Load</th>
                  <th className="py-3 px-4">Capacity Utilization</th>
                  <th className="py-3 px-4">Classes Taught</th>
                  <th className="py-3 px-4">Subjects</th>
                  <th className="py-3 px-4 text-center">Workload Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workloadData.map((w) => (
                  <tr key={w.teacher_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {w.teacher_name}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-800">
                      {w.total_periods} Periods / week
                    </td>
                    <td className="py-3 px-4 w-44">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              w.load_percentage > 90
                                ? 'bg-rose-500'
                                : w.load_percentage < 50
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${w.load_percentage}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600">{w.load_percentage}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {w.classes.join(', ') || '--'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {w.subjects.join(', ') || '--'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          w.status === 'Optimal'
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.status === 'High'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: UNASSIGNED SLOTS REPORT */}
      {activeSubTab === 'unassigned' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Unassigned Classroom Slots
              </h3>
              <p className="text-xs text-slate-500">
                Periods where a class is scheduled but lacks an assigned subject or designated teacher.
              </p>
            </div>
          </div>

          {unassignedData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Class & Section</th>
                    <th className="py-3 px-4">Weekday</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Missing Field</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unassignedData.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        Class {slot.class_name}-{slot.section}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{slot.weekday}</td>
                      <td className="py-3 px-4 text-slate-700">Period {slot.period_number}</td>
                      <td className="py-3 px-4 font-bold text-amber-600">
                        {!slot.teacher_id ? 'No Teacher Assigned' : 'No Subject Assigned'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {slot.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              No unassigned periods found. All classroom slots have assigned instructors.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
