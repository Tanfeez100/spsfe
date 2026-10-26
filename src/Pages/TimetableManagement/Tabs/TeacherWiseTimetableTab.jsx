import React, { useState, useEffect } from 'react';
import { getTeacherTimetable, getMyTimetable } from '../../../Api/timetable';
import { getUser } from '../../../Api/auth';

export default function TeacherWiseTimetableTab({
  teachers = [],
  academicSession = '2026-27',
}) {
  const currentUser = getUser();
  const isTeacherRole = currentUser?.role === 'teacher';

  const [selectedTeacherId, setSelectedTeacherId] = useState(
    isTeacherRole ? currentUser?.id : (teachers[0]?.id || '')
  );

  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (isTeacherRole) {
      setSelectedTeacherId(currentUser?.id);
    } else if (!selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [isTeacherRole, currentUser, teachers, selectedTeacherId]);

  useEffect(() => {
    async function loadData() {
      if (!selectedTeacherId) return;
      setLoading(true);
      setError('');
      try {
        let res;
        if (isTeacherRole) {
          res = await getMyTimetable(academicSession);
        } else {
          res = await getTeacherTimetable(selectedTeacherId, academicSession);
        }
        if (res.success) {
          setTimetableData(res);
        }
      } catch (err) {
        setError(err.message || 'Failed to load teacher timetable.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedTeacherId, academicSession, isTeacherRole]);

  const teacherProfile = teachers.find((t) => t.id === selectedTeacherId) || {
    fullName: currentUser?.fullName || currentUser?.name || 'Faculty Member',
    designation: currentUser?.designation || 'Teacher',
  };

  const todaySlots = timetableData?.today?.slots || [];
  const weeklyMatrix = timetableData?.weeklyMatrix || [];
  const periods = timetableData?.periods || [];
  const stats = timetableData?.stats || {
    totalWeeklyPeriods: weeklyMatrix.length,
    freePeriods: 0,
    averagePeriodsPerDay: 0,
    maxWeeklyCapacity: 30,
  };

  return (
    <div className="space-y-6">

      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <span className="material-symbols-outlined text-2xl">badge</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isTeacherRole ? 'My Personal Timetable' : 'Teacher-wise Timetable'}
              </h2>
              <p className="text-xs text-slate-500">
                Weekly teaching commitments, daily period breakdown, and free period summary.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* If Admin, show teacher selector */}
            {!isTeacherRole && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Faculty:</span>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:outline-hidden max-w-xs"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName || t.name || t.employeeId} ({t.designation || 'Teacher'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-base">print</span>
              Print Schedule
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <span className="h-6 w-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin inline-block mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading teacher schedule...</p>
        </div>
      ) : (
        <>
          {/* KPI Workload Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Weekly Teaching Load
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{stats.totalWeeklyPeriods}</span>
                <span className="text-xs text-slate-500 font-semibold">/ 30 max</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((stats.totalWeeklyPeriods / 30) * 100))}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Today's Scheduled Periods
              </span>
              <div className="text-2xl font-black text-emerald-700">
                {todaySlots.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {timetableData?.today?.weekday || 'Today'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                First & Last Period Today
              </span>
              <div className="text-base font-black text-slate-800 mt-1">
                {todaySlots.length > 0 ? (
                  <>Period {timetableData?.today?.firstPeriod} → {timetableData?.today?.lastPeriod}</>
                ) : (
                  <span className="text-slate-400 font-medium text-xs">No classes scheduled</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {todaySlots.length > 0 ? 'Active instructional day' : 'Preparation day'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Free / Preparation Periods
              </span>
              <div className="text-2xl font-black text-blue-700">
                {stats.freePeriods}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Across 6 working days
              </p>
            </div>

          </div>

          {/* Today's Schedule Card */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-indigo-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">
                  Today's Classroom Engagements ({timetableData?.today?.weekday})
                </h3>
              </div>
              <span className="text-xs font-bold text-indigo-800">
                {teacherProfile.fullName}
              </span>
            </div>

            {todaySlots.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {todaySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`rounded-xl border p-3.5 shadow-2xs space-y-1.5 ${
                      slot.is_substitute_duty
                        ? 'border-amber-300 bg-amber-50/70'
                        : slot.is_substituted_out
                          ? 'border-slate-200 bg-slate-50 opacity-75'
                          : 'border-indigo-200/80 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                          Period {slot.period_number}
                        </span>
                        {slot.is_substitute_duty && (
                          <span className="inline-block px-1.5 py-0.2 rounded-sm bg-amber-200 text-amber-900 text-[9px] font-black uppercase">
                            Proxy Duty
                          </span>
                        )}
                        {slot.is_substituted_out && (
                          <span className="inline-block px-1.5 py-0.2 rounded-sm bg-slate-200 text-slate-700 text-[9px] font-bold">
                            Covered by proxy
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        {slot.start_time ? `${slot.start_time} - ${slot.end_time}` : ''}
                      </span>
                    </div>

                    <div className="text-sm font-black text-slate-900 leading-tight">
                      {slot.subject_name}
                    </div>

                    {slot.is_substitute_duty && (
                      <p className="text-[11px] font-bold text-amber-900">
                        Covering for {slot.original_teacher_name} ({slot.substitution_reason || 'Absent'})
                      </p>
                    )}
                    {slot.is_substituted_out && (
                      <p className="text-[11px] font-medium text-slate-500 italic">
                        Proxy assigned to {slot.substitute_teacher_name}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="font-bold text-emerald-700">
                        Class {slot.class_name}-{slot.section}
                      </span>
                      {slot.room_no && (
                        <span className="text-slate-400 text-[11px]">
                          {slot.room_no}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-indigo-800 font-semibold">
                No teaching periods scheduled for today. Use this time for syllabus planning and student assessment.
              </div>
            )}
          </div>

          {/* Weekly Timetable Matrix */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Full Weekly Routine Grid
              </h3>
              <span className="text-xs text-slate-500">
                Faculty: <strong className="text-slate-800">{teacherProfile.fullName}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[850px] text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 w-32 border-r border-slate-800 text-center">Period</th>
                    {ALL_DAYS.map((day) => (
                      <th key={day} className="py-3 px-3 text-center border-r border-slate-800 last:border-r-0">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {periods.map((period) => {
                    const isBreak = period.type === 'lunch' || period.type === 'break' || period.type === 'assembly';

                    if (isBreak) {
                      return (
                        <tr key={period.id || period.period_number} className="bg-amber-50/70">
                          <td className="py-2 px-3 font-bold text-amber-900 text-center border-r border-amber-200 bg-amber-100/50">
                            <span className="text-[10px] uppercase">{period.name}</span>
                          </td>
                          <td colSpan={ALL_DAYS.length} className="py-2 px-3 text-center text-xs font-bold text-amber-900 uppercase">
                            {period.name} ({period.start_time} - {period.end_time})
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={period.id || period.period_number} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3 border-r border-slate-200 bg-slate-50 text-center align-middle">
                          <div className="font-bold text-slate-800">{period.name}</div>
                          <div className="text-[10px] text-slate-400">{period.start_time}-{period.end_time}</div>
                        </td>

                        {ALL_DAYS.map((day) => {
                          const slot = weeklyMatrix.find(
                            (e) => e.weekday === day && Number(e.period_number) === Number(period.period_number)
                          );

                          return (
                            <td key={day} className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 align-top">
                              {slot ? (
                                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-2 text-center space-y-0.5">
                                  <div className="font-bold text-indigo-950 text-xs truncate">
                                    {slot.subject_name}
                                  </div>
                                  <div className="text-[11px] font-black text-emerald-700">
                                    Class {slot.class_name}-{slot.section}
                                  </div>
                                  {slot.room_no && (
                                    <div className="text-[9px] text-slate-500">
                                      {slot.room_no}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="h-14 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-300">
                                  Free
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
        </>
      )}

    </div>
  );
}
