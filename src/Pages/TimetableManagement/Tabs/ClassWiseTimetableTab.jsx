import React, { useState, useEffect } from 'react';
import { getClassTimetable } from '../../../Api/timetable';
import { CLASS_OPTIONS, SECTION_OPTIONS } from '../../../constants/schoolOptions';

export default function ClassWiseTimetableTab({
  academicSession = '2026-27',
}) {
  const [selectedClass, setSelectedClass] = useState('1');
  const [selectedSection, setSelectedSection] = useState('A');
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const res = await getClassTimetable(selectedClass, selectedSection, academicSession);
        if (res.success) {
          setClassData(res);
        }
      } catch (err) {
        setError(err.message || 'Failed to load class timetable.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedClass, selectedSection, academicSession]);

  const periods = classData?.periods || [];
  const entries = classData?.entries || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">

      {/* Control Bar (hidden during print) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Class Timetable & Print Layout</h2>
              <p className="text-xs text-slate-500">
                Official weekly curriculum routine for students and class display boards.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
            >
              <span className="material-symbols-outlined text-base">print</span>
              Print Timetable
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* Printable Sheet View */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-6 md:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* School Document Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-slate-900">
            STAR PUBLIC SCHOOL
          </h1>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            Recognized by Dept. of School Education · Academic Session {academicSession}
          </p>
          <div className="inline-block bg-slate-900 text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest mt-2">
            Class {selectedClass} - Section {selectedSection} Weekly Timetable
          </div>
        </div>

        {/* Timetable Table */}
        {loading ? (
          <div className="py-12 text-center">
            <span className="h-6 w-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin inline-block mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading class schedule...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                  <th className="border border-slate-300 py-3 px-3 text-center w-32">Period</th>
                  {ALL_DAYS.map((day) => (
                    <th key={day} className="border border-slate-300 py-3 px-3 text-center">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => {
                  const isBreak = period.type === 'lunch' || period.type === 'break' || period.type === 'assembly';

                  if (isBreak) {
                    return (
                      <tr key={period.id || period.period_number} className="bg-amber-50">
                        <td className="border border-slate-300 py-2.5 px-3 text-center font-bold text-amber-900">
                          {period.name}
                        </td>
                        <td
                          colSpan={ALL_DAYS.length}
                          className="border border-slate-300 py-2.5 px-3 text-center font-bold text-amber-900 uppercase tracking-wider text-[11px]"
                        >
                          {period.name} · {period.start_time} to {period.end_time}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={period.id || period.period_number} className="hover:bg-slate-50/50">
                      
                      <td className="border border-slate-300 py-3 px-3 bg-slate-50/80 text-center">
                        <div className="font-bold text-slate-900">{period.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {period.start_time} - {period.end_time}
                        </div>
                      </td>

                      {ALL_DAYS.map((day) => {
                        const slot = entries.find(
                          (e) => e.weekday === day && Number(e.period_number) === Number(period.period_number)
                        );

                        return (
                          <td key={day} className="border border-slate-300 py-2.5 px-2.5 text-center align-top">
                            {slot ? (
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-900 text-xs">
                                  {slot.subject_name}
                                </div>
                                <div className="text-[11px] font-semibold text-emerald-800">
                                  {slot.teacher_name || 'Staff'}
                                </div>
                                {slot.room_no && (
                                  <div className="text-[9px] text-slate-400">
                                    {slot.room_no}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-300 italic font-medium">
                                Free
                              </span>
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
        )}

        {/* Signature & Footer Block */}
        <div className="pt-8 flex items-end justify-between text-xs text-slate-700">
          <div>
            <p className="font-bold">Effective Date: {classData?.settings?.effective_date || '01-04-2026'}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Generated via Star Public School Academic Management System</p>
          </div>

          <div className="text-center space-y-1">
            <div className="w-40 border-b border-slate-400 pb-8" />
            <p className="text-xs font-black uppercase text-slate-800">Principal Signature</p>
            <p className="text-[10px] text-slate-500">Star Public School</p>
          </div>
        </div>

      </div>

    </div>
  );
}
