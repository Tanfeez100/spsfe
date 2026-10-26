import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUser } from '../../Api/auth';
import { getTeachers } from '../../Api/auth';
import { getAllSubjects } from '../../Api/subjects';
import {
  getTimetableSettings,
  getTimetablePeriods,
  getTimetableEntries,
} from '../../Api/timetable';
import SEO from '../../Components/SEO/SEO';

// Tabs
import PeriodTimingSetupTab from './Tabs/PeriodTimingSetupTab';
import CreateTimetableTab from './Tabs/CreateTimetableTab';
import WeeklyTimetableTab from './Tabs/WeeklyTimetableTab';
import TeacherWiseTimetableTab from './Tabs/TeacherWiseTimetableTab';
import ClassWiseTimetableTab from './Tabs/ClassWiseTimetableTab';
import ConflictReportsTab from './Tabs/ConflictReportsTab';
import SubstitutionAndHandoverTab from './Tabs/SubstitutionAndHandoverTab';

export default function TimetableManagement({ initialTab = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const isTeacher = user?.role === 'teacher';

  // Determine active tab
  const [activeTab, setActiveTab] = useState(
    initialTab || (isTeacher ? 'teacher' : 'weekly')
  );

  // Global shared state
  const [academicSession, setAcademicSession] = useState('2026-27');
  const [settings, setSettings] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [entries, setEntries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab definitions
  const adminTabs = [
    { id: 'weekly', label: 'Weekly Timetable', icon: 'grid_view' },
    { id: 'substitution', label: 'Substitution & Handover', icon: 'published_with_changes' },
    { id: 'create', label: 'Create Timetable', icon: 'edit_calendar' },
    { id: 'teacher', label: 'Teacher-wise Timetable', icon: 'person' },
    { id: 'class', label: 'Class-wise Timetable', icon: 'school' },
    { id: 'conflicts', label: 'Conflict Reports', icon: 'report_problem' },
    { id: 'setup', label: 'Period & School Timing Setup', icon: 'schedule' },
  ];

  const teacherTabs = [
    { id: 'teacher', label: 'My Timetable', icon: 'person' },
    { id: 'weekly', label: 'Weekly Schedule', icon: 'grid_view' },
    { id: 'class', label: 'Class Schedule', icon: 'school' },
  ];

  const tabs = isTeacher ? teacherTabs : adminTabs;

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

  return (
    <div className="w-full space-y-6">
      <SEO
        title="Timetable Management | Star Public School"
        description="Comprehensive Teacher Timetable & Period Scheduling Management for Star Public School."
        canonicalPath="/timetable"
      />

      {/* Main Suite Top Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xs">
              <span className="material-symbols-outlined text-2xl">calendar_month</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 leading-tight">
                  Timetable Management
                </h1>
                <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-800">
                  {academicSession}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isTeacher
                  ? 'Access your weekly assigned periods, daily classroom routines, and free periods.'
                  : 'Configure periods, build master class routines, prevent conflicts, and publish schedules.'}
              </p>
            </div>
          </div>

          {/* Quick Info & Refresh */}
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {entries.length} active schedule slots
            </span>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Refresh Timetable Data"
            >
              <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
          </div>

        </div>

        {/* Tab Switcher Pills */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'weekly' && (
        <WeeklyTimetableTab
          academicSession={academicSession}
          periods={periods}
          entries={entries}
          teachers={teachers}
          subjects={subjects}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'create' && !isTeacher && (
        <CreateTimetableTab
          academicSession={academicSession}
          periods={periods}
          entries={entries}
          teachers={teachers}
          subjects={subjects}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'teacher' && (
        <TeacherWiseTimetableTab
          teachers={teachers}
          academicSession={academicSession}
        />
      )}

      {activeTab === 'class' && (
        <ClassWiseTimetableTab
          academicSession={academicSession}
        />
      )}

      {activeTab === 'conflicts' && !isTeacher && (
        <ConflictReportsTab
          academicSession={academicSession}
        />
      )}

      {activeTab === 'substitution' && !isTeacher && (
        <SubstitutionAndHandoverTab
          teachers={teachers}
          periods={periods}
          entries={entries}
          academicSession={academicSession}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'setup' && !isTeacher && (
        <PeriodTimingSetupTab
          settings={settings}
          periods={periods}
          onRefresh={loadData}
        />
      )}

    </div>
  );
}
