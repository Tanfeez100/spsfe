import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUser } from '../../Api/auth';
import { getTeachers } from '../../Api/auth';
import { getAllSubjects } from '../../Api/subjects';
import {
  getTimetableSettings,
  getTimetablePeriods,
  getTimetableEntries,
  saveTimetableEntry,
  deleteTimetableEntry,
} from '../../Api/timetable';
import { CLASS_OPTIONS, SECTION_OPTIONS } from '../../constants/schoolOptions';
import SEO from '../../Components/SEO/SEO';
import SlotEditorModal from './Modals/SlotEditorModal';

// Existing sub-tabs for complete operational features
import CreateTimetableTab from './Tabs/CreateTimetableTab';
import TeacherWiseTimetableTab from './Tabs/TeacherWiseTimetableTab';
import ConflictReportsTab from './Tabs/ConflictReportsTab';
import SubstitutionAndHandoverTab from './Tabs/SubstitutionAndHandoverTab';
import PeriodTimingSetupTab from './Tabs/PeriodTimingSetupTab';

export default function TimetableManagement({ initialTab = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const isTeacher = user?.role === 'teacher';

  // Academic Session
  const [academicSession, setAcademicSession] = useState('2026-27');

  // Main Nav Tabs (exact match to user design)
  // Options: 'class_timetable', 'subject_allocation', 'bulk_edit', 'teacher_allocation', 'room_allocation', 'exam_timetable', 'print_export'
  const [activeTab, setActiveTab] = useState(initialTab || (isTeacher ? 'teacher_allocation' : 'class_timetable'));

  // Sub-controls state for Class Timetable
  const [viewType, setViewType] = useState('grid'); // 'grid' | 'list'
  const [selectedClass, setSelectedClass] = useState('10'); // Default Class 10 as shown in image
  const [selectedSection, setSelectedSection] = useState('A'); // Default Section A as shown in image
  const [scheduleMode, setScheduleMode] = useState('weekly'); // 'weekly' | 'daily'
  const [selectedDailyDay, setSelectedDailyDay] = useState('Monday');

  // Shared Data State
  const [settings, setSettings] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [entries, setEntries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Slot Editor Modal
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [savingSlot, setSavingSlot] = useState(false);
  const [toast, setToast] = useState(null);

  const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Load all master timetable data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, periodsRes, entriesRes, teachersRes, subjectsRes] =
        await Promise.allSettled([
          getTimetableSettings(),
          getTimetablePeriods(),
          getTimetableEntries({ academic_session: academicSession }),
          getTeachers(),
          getAllSubjects(),
        ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value?.settings) {
        setSettings(settingsRes.value.settings);
        if (settingsRes.value.settings.academic_session) {
          setAcademicSession(settingsRes.value.settings.academic_session);
        }
      }
      if (periodsRes.status === 'fulfilled' && periodsRes.value?.periods) {
        setPeriods(periodsRes.value.periods);
      }
      if (entriesRes.status === 'fulfilled' && entriesRes.value?.entries) {
        setEntries(entriesRes.value.entries);
      }
      if (teachersRes.status === 'fulfilled') {
        const tList = Array.isArray(teachersRes.value?.teachers)
          ? teachersRes.value.teachers
          : Array.isArray(teachersRes.value)
            ? teachersRes.value
            : [];
        setTeachers(tList);
      }
      if (subjectsRes.status === 'fulfilled') {
        const sList = Array.isArray(subjectsRes.value?.subjects)
          ? subjectsRes.value.subjects
          : Array.isArray(subjectsRes.value?.data)
            ? subjectsRes.value.data
            : Array.isArray(subjectsRes.value)
              ? subjectsRes.value
              : [];
        setSubjects(sList);
      }
    } catch (err) {
      console.error('Error bootstrapping timetable data:', err);
    } finally {
      setLoading(false);
    }
  }, [academicSession]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter slots for the currently selected Class and Section
  const currentClassSlots = useMemo(() => {
    const normClass = String(selectedClass).toLowerCase().replace(/^class\s*/i, '');
    const normSec = String(selectedSection).toUpperCase();
    return (entries || []).filter((e) => {
      if (e.academic_session !== academicSession) return false;
      const c = String(e.class_name).toLowerCase().replace(/^class\s*/i, '');
      const s = String(e.section).toUpperCase();
      return c === normClass && s === normSec;
    });
  }, [entries, academicSession, selectedClass, selectedSection]);

  // Lookup map: `${weekday}-${period_number}` -> entry
  const cellSlotMap = useMemo(() => {
    const map = new Map();
    for (const slot of currentClassSlots) {
      map.set(`${slot.weekday}-${slot.period_number}`, slot);
    }
    return map;
  }, [currentClassSlots]);

  // Handle clicking a slot to edit or create
  const handleSlotClick = (weekday, period) => {
    if (period.is_break || period.type === 'assembly' || period.type === 'lunch') {
      return;
    }
    const existing = cellSlotMap.get(`${weekday}-${period.period_number}`);
    if (existing) {
      setSelectedSlot(existing);
    } else {
      setSelectedSlot({
        academic_session: academicSession,
        weekday,
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
        status: 'published',
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
        await loadData();
      }
    } catch (err) {
      const msg = err.response?.data?.conflicts?.[0]?.message || err.message || 'Failed to save slot.';
      showToast('error', msg);
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
        await loadData();
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to delete slot.');
    }
  };

  // CSV Export for current class timetable
  const handleExport = () => {
    if (currentClassSlots.length === 0) {
      showToast('error', 'No schedule slots available to export.');
      return;
    }
    const headers = ['Day', 'Period', 'Timing', 'Class', 'Section', 'Subject', 'Teacher', 'Room'];
    const rows = currentClassSlots.map((s) => [
      s.weekday,
      s.period_number,
      `${s.start_time}-${s.end_time}`,
      `Class ${s.class_name}`,
      s.section,
      `"${s.subject_name}"`,
      `"${s.teacher_name || 'N/A'}"`,
      `"${s.room_no || 'N/A'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Timetable_Class_${selectedClass}_${selectedSection}_${academicSession}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Class timetable exported as CSV successfully.');
  };

  // Main Nav Tabs configuration exactly matching user image
  const mainTabs = [
    { id: 'class_timetable', label: 'Class Timetable', icon: 'calendar_month' },
    { id: 'subject_allocation', label: 'Subject Allocation', icon: 'auto_stories' },
    { id: 'bulk_edit', label: 'Bulk Edit / Update', icon: 'edit_calendar' },
    { id: 'teacher_allocation', label: 'Teacher Allocation', icon: 'groups' },
    { id: 'room_allocation', label: 'Room Allocation', icon: 'meeting_room' },
    { id: 'exam_timetable', label: 'Exam Timetable', icon: 'event_note' },
    { id: 'print_export', label: 'Print & Export', icon: 'print' },
  ];

  // Helper color tags for subjects
  const getSubjectBadgeStyle = (subjectName = '') => {
    const s = subjectName.toLowerCase();
    if (s.includes('lab') || s.includes('practical')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (s.includes('math')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (s.includes('science') || s.includes('evs')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s.includes('english')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (s.includes('hindi')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (s.includes('computer') || s.includes('tech') || s.includes('coding')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (s.includes('sst') || s.includes('social')) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    if (s.includes('sanskrit') || s.includes('urdu')) {
      return 'bg-teal-50 text-teal-700 border-teal-200';
    }
    if (s.includes('drawing') || s.includes('art')) {
      return 'bg-pink-50 text-pink-700 border-pink-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
      <div className="w-full space-y-4">
        <SEO
          title="Timetable Management | Star Public School"
          description="Class wise timetables, subjects and teacher allocation."
          canonicalPath="/timetable"
        />

                {/* Toast Notification */}
                {toast && (
                  <div
                    className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold shadow-xl animate-in fade-in slide-in-from-top-2 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {toast.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    <span>{toast.message}</span>
                  </div>
                )}

                {/* =========================================================================
          TOP BANNER HEADER (Exactly as uploaded reference image)
          - Left: Graduation Cap icon + "Timetable Management" + "Active" green badge
          - Left Subtitle: "Create, manage and view class wise timetables, subjects and teacher allocation."
          - Right: Academic Year Dropdown ("Academic Year: 2026 – 2027 v")
      ========================================================================= */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f2444] text-white shadow-xs">
                      <span className="material-symbols-outlined text-2xl">school</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                          Timetable Management
                        </h1>
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Create, manage and view class wise timetables, subjects and teacher allocation.
                      </p>
                    </div>
                  </div>

                      {/* Academic Year Dropdown (top right) */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <div className="relative inline-flex items-center">
                          <span className="material-symbols-outlined absolute left-3 text-slate-500 text-sm pointer-events-none">
                            calendar_today
                          </span>
            <select
                            value={academicSession}
                            onChange={(e) => setAcademicSession(e.target.value)}
                            className="h-9 pl-9 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs focus:outline-hidden appearance-none cursor-pointer"
                          >
                          <option value="2026-27">Academic Year: 2026 – 2027</option>
                          <option value="2025-26">Academic Year: 2025 – 2026</option>
                          <option value="2027-28">Academic Year: 2027 – 2028</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-2.5 text-slate-400 text-sm pointer-events-none">
                          expand_more
                        </span>
                      </div>
                  </div>
                </div>

                    {/* =========================================================================
          MAIN TABS BAR (White rounded container matching image)
          1. Class Timetable (Active: solid dark navy #0f2444)
          2. Subject Allocation
          3. Bulk Edit / Update
          4. Teacher Allocation
          5. Room Allocation
          6. Exam Timetable
          7. Print & Export
      ========================================================================= */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs">
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                        {mainTabs.map((tab) => {
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                if (tab.id === 'print_export') {
                                  window.print();
                                } else {
                                  setActiveTab(tab.id);
                                }
                              }}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${isActive
                              ? 'bg-[#0f2444] text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
              >
                        <span className="material-symbols-outlined text-base">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                      );
          })}
                    </div>
      </div>

      {/* =========================================================================
          SUB-CONTROLS BAR (Shown for Class Timetable)
          - Left: Grid View / List View toggle
          - Right: Class [Class 10 v]  Section [A v]  Mode [Weekly v]  [Export]
      ========================================================================= */}
                {activeTab === 'class_timetable' && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

                      {/* Left: View Switcher */}
                      <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 w-fit">
                        <button
                          onClick={() => setViewType('grid')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewType === 'grid'
                              ? 'bg-[#0f2444] text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                          <span className="material-symbols-outlined text-sm">calendar_view_week</span>
                          <span>Grid View</span>
                        </button>
                        <button
                          onClick={() => setViewType('list')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewType === 'list'
                              ? 'bg-[#0f2444] text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                          <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
                          <span>List View</span>
                        </button>
                      </div>

                      {/* Right: Filters & Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Class Dropdown */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-500">Class</span>
                          <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-hidden cursor-pointer"
                          >
                            {CLASS_OPTIONS.map((c) => (
                              <option key={c} value={c}>
                                {c.toLowerCase().includes('nursery') || c.toLowerCase().includes('lkg') || c.toLowerCase().includes('ukg')
                                  ? c
                                  : `Class ${c}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Section Dropdown */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-500">Section</span>
                          <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-hidden cursor-pointer"
                          >
                            {SECTION_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Mode Dropdown */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-500">Mode</span>
                          <select
                            value={scheduleMode}
                            onChange={(e) => setScheduleMode(e.target.value)}
                            className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-hidden cursor-pointer"
                          >
                            <option value="weekly">Weekly</option>
                            <option value="daily">Daily</option>
                          </select>
                        </div>

                        {/* Export Button */}
                        <button
                          onClick={handleExport}
                          className="inline-flex items-center gap-1.5 h-8 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                          title="Export Class Timetable as CSV"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          <span>Export</span>
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                  {/* =========================================================================
          CONTENT AREA: TAB 1 - CLASS TIMETABLE
      ========================================================================= */}
      {activeTab === 'class_timetable' && (
                  <div className="space-y-4">
                    {loading ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                        <span className="h-7 w-7 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin inline-block mb-3" />
                        <p className="text-xs font-semibold text-slate-500">Loading Timetable for Class {selectedClass}-{selectedSection}...</p>
                      </div>
                    ) : scheduleMode === 'daily' ? (
                      /* Daily View Mode */
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {ALL_DAYS.map((day) => (
                            <button
                              key={day}
                              onClick={() => setSelectedDailyDay(day)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedDailyDay === day
                                  ? 'bg-[#0f2444] text-white shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                            <span>Class {selectedClass}-{selectedSection} Schedule · {selectedDailyDay}</span>
                            <span className="text-xs font-normal text-slate-500">7 Periods Scheduled</span>
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                            {periods
                              .filter((p) => !p.is_break && p.type !== 'assembly' && p.type !== 'lunch')
                              .map((period) => {
                                const slot = cellSlotMap.get(`${selectedDailyDay}-${period.period_number}`);
                                return (
                                  <div
                                    key={period.id}
                                    onClick={() => handleSlotClick(selectedDailyDay, period)}
                                    className="group relative rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Period {period.period_number}
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                        {period.start_time} - {period.end_time}
                                      </span>
                                    </div>

                                    {slot ? (
                                      <div>
                                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border mb-2 ${getSubjectBadgeStyle(slot.subject_name)}`}>
                                          {slot.subject_name}
                                        </span>
                                        <p className="text-xs font-bold text-slate-800 truncate">
                                          {slot.teacher_name || 'Assigned Teacher'}
                                        </p>
                                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                                          <span className="material-symbols-outlined text-[13px]">location_on</span>
                                          <span>{slot.room_no || 'Room'}</span>
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="py-3 text-center text-slate-400 text-xs font-medium">
                                        + Click to Allocate Slot
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    ) : viewType === 'grid' ? (
                      /* Weekly Grid View */
                      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                                <th className="py-3.5 px-4 w-40 border-r border-slate-200">Period / Time</th>
                                {ALL_DAYS.map((day) => (
                                  <th key={day} className="py-3.5 px-4 text-center min-w-[150px] border-r border-slate-200 last:border-r-0">
                                    {day}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {/* Morning Assembly */}
                              <tr className="bg-blue-50/50">
                                <td className="py-2 px-4 font-bold text-slate-700 border-r border-slate-200 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm text-blue-600">notifications_active</span>
                                    <span>Assembly</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-normal">08:00 - 08:30</span>
                                </td>
                                <td colSpan={6} className="py-2 px-4 text-center text-xs font-semibold text-blue-800">
                                  Morning Prayer, National Anthem, Student Attendance & Daily Announcements
                                </td>
                              </tr>

                              {/* Periods 1 to 3 */}
                              {periods
                                .filter((p) => p.period_number >= 1 && p.period_number <= 3)
                                .map((period) => (
                                  <tr key={period.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 px-4 font-bold text-slate-800 border-r border-slate-200 bg-slate-50/30">
                                      <div>Period {period.period_number}</div>
                                      <span className="text-[11px] font-normal text-slate-500">
                                        {period.start_time} - {period.end_time}
                                      </span>
                                    </td>
                                    {ALL_DAYS.map((day) => {
                                      const slot = cellSlotMap.get(`${day}-${period.period_number}`);
                                      return (
                                        <td
                                          key={day}
                                          onClick={() => handleSlotClick(day, period)}
                                          className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 align-top cursor-pointer hover:bg-slate-100/60 transition-colors"
                                        >
                                          {slot ? (
                                            <div className="space-y-1">
                                              <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border truncate max-w-full ${getSubjectBadgeStyle(slot.subject_name)}`}>
                                                {slot.subject_name}
                                              </span>
                                              <div className="text-[11px] font-semibold text-slate-800 truncate">
                                                {slot.teacher_name || 'Teacher'}
                                              </div>
                                              <div className="text-[10px] text-slate-400 truncate">
                                                {slot.room_no || 'Room'}
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-[11px] text-slate-300 italic">+ Free</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}

                              {/* Lunch Break */}
                              <tr className="bg-amber-50/50">
                                <td className="py-2 px-4 font-bold text-slate-700 border-r border-slate-200 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm text-amber-600">restaurant</span>
                                    <span>Recess / Lunch</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-normal">10:45 - 11:20</span>
                                </td>
                                <td colSpan={6} className="py-2 px-4 text-center text-xs font-semibold text-amber-800">
                                  Mid-Day Meal & Student Recess Break (35 Minutes)
                                </td>
                              </tr>

                              {/* Periods 4 to 7 */}
                              {periods
                                .filter((p) => p.period_number >= 5 && p.period_number <= 8)
                                .map((period, idx) => (
                                  <tr key={period.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 px-4 font-bold text-slate-800 border-r border-slate-200 bg-slate-50/30">
                                      <div>Period {idx + 4}</div>
                                      <span className="text-[11px] font-normal text-slate-500">
                                        {period.start_time} - {period.end_time}
                                      </span>
                                    </td>
                                    {ALL_DAYS.map((day) => {
                                      const slot = cellSlotMap.get(`${day}-${period.period_number}`);
                                      return (
                                        <td
                                          key={day}
                                          onClick={() => handleSlotClick(day, period)}
                                          className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 align-top cursor-pointer hover:bg-slate-100/60 transition-colors"
                                        >
                                          {slot ? (
                                            <div className="space-y-1">
                                              <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border truncate max-w-full ${getSubjectBadgeStyle(slot.subject_name)}`}>
                                                {slot.subject_name}
                                              </span>
                                              <div className="text-[11px] font-semibold text-slate-800 truncate">
                                                {slot.teacher_name || 'Teacher'}
                                              </div>
                                              <div className="text-[10px] text-slate-400 truncate">
                                                {slot.room_no || 'Room'}
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-[11px] text-slate-300 italic">+ Free</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* Tabular List View */
                      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                                <th className="py-3.5 px-4">Day</th>
                                <th className="py-3.5 px-4">Period</th>
                                <th className="py-3.5 px-4">Timing</th>
                                <th className="py-3.5 px-4">Subject</th>
                                <th className="py-3.5 px-4">Allocated Teacher</th>
                                <th className="py-3.5 px-4">Room / Lab</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {currentClassSlots.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                                    No timetable entries found for Class {selectedClass}-{selectedSection}.
                                  </td>
                                </tr>
                              ) : (
                                currentClassSlots.map((slot) => (
                                  <tr key={slot.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 px-4 font-bold text-slate-800">{slot.weekday}</td>
                                    <td className="py-3 px-4 font-bold text-slate-600">Period {slot.period_number}</td>
                                    <td className="py-3 px-4 text-slate-500 font-medium">{slot.start_time} - {slot.end_time}</td>
                                    <td className="py-3 px-4">
                                      <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getSubjectBadgeStyle(slot.subject_name)}`}>
                                        {slot.subject_name}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 font-semibold text-slate-800">{slot.teacher_name || 'N/A'}</td>
                                    <td className="py-3 px-4 text-slate-600">{slot.room_no || 'Room'}</td>
                                    <td className="py-3 px-4">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Published
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <button
                                        onClick={() => {
                                          setSelectedSlot(slot);
                                          setEditorModalOpen(true);
                                        }}
                                        className="text-slate-600 hover:text-slate-900 font-bold text-xs"
                                      >
                                        Edit
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* =========================================================================
          CONTENT AREA: TAB 2 - SUBJECT ALLOCATION
      ========================================================================= */}
                {activeTab === 'subject_allocation' && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Academic Subject Allocation Matrix</h2>
                        <p className="text-xs text-slate-500">
                          Weekly subject allocation & assigned faculty across Class 1 to 10.
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                        20 Total Sections Configured
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((clsNum) => (
                        <div key={clsNum} className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                            <span className="text-sm font-bold text-slate-900">Class {clsNum}</span>
                            <span className="text-[11px] font-semibold text-slate-500">Sec A & B</span>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            {Number(clsNum) <= 5 ? (
                              <>
                                <div className="flex justify-between text-slate-700"><span>Mathematics</span><span className="font-semibold text-slate-900">PRT Math Specialist</span></div>
                                <div className="flex justify-between text-slate-700"><span>English Core</span><span className="font-semibold text-slate-900">PRT English</span></div>
                                <div className="flex justify-between text-slate-700"><span>EVS & Nature</span><span className="font-semibold text-slate-900">PRT Science</span></div>
                                <div className="flex justify-between text-slate-700"><span>Hindi</span><span className="font-semibold text-slate-900">PRT Hindi</span></div>
                                <div className="flex justify-between text-slate-700"><span>Computer & Coding</span><span className="font-semibold text-slate-900">Computer Lab</span></div>
                                <div className="flex justify-between text-slate-700"><span>Drawing & Arts</span><span className="font-semibold text-slate-900">Art Specialist</span></div>
                                <div className="flex justify-between text-slate-700"><span>Sports & Library</span><span className="font-semibold text-slate-900">Coach / Library</span></div>
                              </>
                            ) : Number(clsNum) <= 8 ? (
                              <>
                                <div className="flex justify-between text-slate-700"><span>Mathematics</span><span className="font-semibold text-slate-900">Tanfeez Ahmad</span></div>
                                <div className="flex justify-between text-slate-700"><span>General Science</span><span className="font-semibold text-slate-900">Priyanka Patel</span></div>
                                <div className="flex justify-between text-slate-700"><span>English Literature</span><span className="font-semibold text-slate-900">Vandana Saxena</span></div>
                                <div className="flex justify-between text-slate-700"><span>Social Science</span><span className="font-semibold text-slate-900">Swati Deshmukh</span></div>
                                <div className="flex justify-between text-slate-700"><span>Hindi</span><span className="font-semibold text-slate-900">Ananya Sen</span></div>
                                <div className="flex justify-between text-slate-700"><span>Sanskrit / Urdu</span><span className="font-semibold text-slate-900">Alok Dubey / Fatima</span></div>
                                <div className="flex justify-between text-slate-700"><span>Computer & AI</span><span className="font-semibold text-slate-900">Nitin Khurana</span></div>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between text-slate-700"><span>Advanced Math</span><span className="font-semibold text-slate-900">Rajesh Sharma</span></div>
                                <div className="flex justify-between text-slate-700"><span>Science + Lab</span><span className="font-semibold text-slate-900">M. Tariq Anwar</span></div>
                                <div className="flex justify-between text-slate-700"><span>English Core</span><span className="font-semibold text-slate-900">Pooja Verma</span></div>
                                <div className="flex justify-between text-slate-700"><span>Social Science</span><span className="font-semibold text-slate-900">Amit Kumar Singh</span></div>
                                <div className="flex justify-between text-slate-700"><span>Hindi Course A</span><span className="font-semibold text-slate-900">Dr. Meenakshi</span></div>
                                <div className="flex justify-between text-slate-700"><span>IT & Lab Practical</span><span className="font-semibold text-slate-900">Harish Pant</span></div>
                                <div className="flex justify-between text-slate-700"><span>Physical Education</span><span className="font-semibold text-slate-900">Sunita Mishra</span></div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* =========================================================================
          CONTENT AREA: TAB 3 - BULK EDIT / UPDATE (CreateTimetableTab)
      ========================================================================= */}
                {activeTab === 'bulk_edit' && (
                  <CreateTimetableTab
                    academicSession={academicSession}
                    periods={periods}
                    entries={entries}
                    teachers={teachers}
                    subjects={subjects}
                    onRefresh={loadData}
                  />
                )}

                  {/* =========================================================================
          CONTENT AREA: TAB 4 - TEACHER ALLOCATION (TeacherWiseTimetableTab)
      ========================================================================= */}
      {activeTab === 'teacher_allocation' && (
                  <TeacherWiseTimetableTab
                    teachers={teachers}
                    academicSession={academicSession}
                  />
                )}

                {/* =========================================================================
          CONTENT AREA: TAB 5 - ROOM ALLOCATION
      ========================================================================= */}
                {activeTab === 'room_allocation' && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Rooms & Specialized Laboratories Routine</h2>
                      <p className="text-xs text-slate-500">
                        Weekly allocation matrix for Science Labs, Computer Labs, Library, and General Classrooms.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-purple-700">science</span>
                          <h3 className="font-bold text-purple-900 text-sm">Science Laboratory</h3>
                        </div>
                        <p className="text-xs text-purple-700 mb-3">Room: Science Lab · Incharge: Mohammad Tariq Anwar</p>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <div className="bg-white p-2 rounded-lg border border-purple-100 flex justify-between">
                            <span>Wednesday Period 7</span>
                            <span className="font-bold text-purple-900">Class 9 Practical</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-purple-100 flex justify-between">
                            <span>Wednesday Period 8</span>
                            <span className="font-bold text-purple-900">Class 10 Practical</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-purple-100 flex justify-between">
                            <span>Saturday Period 7-8</span>
                            <span className="font-bold text-purple-900">Senior Physics & Chemistry Lab</span>
                          </div>
                        </div>
                      </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-indigo-700">computer</span>
                <h3 className="font-bold text-indigo-900 text-sm">Computer Lab 1 & 2</h3>
              </div>
              <p className="text-xs text-indigo-700 mb-3">Coding & IT Practicals · 40 Terminals</p>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="bg-white p-2 rounded-lg border border-indigo-100 flex justify-between">
                  <span>Tuesday & Friday</span>
                  <span className="font-bold text-indigo-900">Classes 9 & 10 AI Practicals</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-indigo-100 flex justify-between">
                  <span>Wed & Thu</span>
                  <span className="font-bold text-indigo-900">Middle School Coding</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-indigo-100 flex justify-between">
                  <span>Fri & Sat</span>
                  <span className="font-bold text-indigo-900">Primary Computer Labs</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-emerald-700">local_library</span>
                <h3 className="font-bold text-emerald-900 text-sm">Central School Library</h3>
              </div>
              <p className="text-xs text-emerald-700 mb-3">Quiet Study & Reading Hours</p>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="bg-white p-2 rounded-lg border border-emerald-100 flex justify-between">
                  <span>Friday Period 7</span>
                  <span className="font-bold text-emerald-900">Primary Section A Reading</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-100 flex justify-between">
                  <span>Friday Period 8</span>
                  <span className="font-bold text-emerald-900">Primary Section B Reading</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-100 flex justify-between">
                  <span>Saturday Afternoon</span>
                  <span className="font-bold text-emerald-900">Faculty & Book Borrowing</span>
                </div>
              </div>
            </div>
          </div>
                  </div>
                )}

      {/* =========================================================================
          CONTENT AREA: TAB 6 - EXAM TIMETABLE
      ========================================================================= */}
                {activeTab === 'exam_timetable' && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f2444] text-white">
                      <span className="material-symbols-outlined text-3xl">event_note</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Examination Timetable & Seating Suite</h2>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Configure term exam routines, admit card dates, and invigilator duties in the Examination module.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/examination')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f2444] text-white text-xs font-bold shadow-xs hover:bg-slate-800 transition-colors"
                    >
                      <span>Open Examination Timetable</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                )}

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
