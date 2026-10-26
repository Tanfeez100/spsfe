import api, { normalizeApiError } from './auth';

/* 1. Timetable Settings & Periods */
export const getTimetableSettings = async () => {
  try {
    const response = await api.get('/api/timetable/settings');
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch timetable settings');
  }
};

export const saveTimetableSettings = async (settingsData) => {
  try {
    const response = await api.post('/api/timetable/settings', settingsData);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to save timetable settings');
  }
};

export const getTimetablePeriods = async (weekday) => {
  try {
    const params = weekday ? { weekday } : {};
    const response = await api.get('/api/timetable/periods', { params });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch periods');
  }
};

export const saveTimetablePeriod = async (periodData) => {
  try {
    const url = periodData.id ? `/api/timetable/periods/${periodData.id}` : '/api/timetable/periods';
    const method = periodData.id ? 'put' : 'post';
    const response = await api[method](url, periodData);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to save period');
  }
};

export const deleteTimetablePeriod = async (id) => {
  try {
    const response = await api.delete(`/api/timetable/periods/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to delete period');
  }
};

/* 2. Timetable Entries CRUD & Batch */
export const getTimetableEntries = async (filters = {}) => {
  try {
    const response = await api.get('/api/timetable/entries', { params: filters });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch timetable entries');
  }
};

export const saveTimetableEntry = async (entryData) => {
  try {
    const url = entryData.id ? `/api/timetable/entries/${entryData.id}` : '/api/timetable/entries';
    const method = entryData.id ? 'put' : 'post';
    const response = await api[method](url, entryData);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to save timetable slot');
  }
};

export const deleteTimetableEntry = async (id) => {
  try {
    const response = await api.delete(`/api/timetable/entries/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to delete timetable slot');
  }
};

export const copyDaySchedule = async (data) => {
  try {
    const response = await api.post('/api/timetable/copy-day', data);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to copy day schedule');
  }
};

export const copyWeekSchedule = async (data) => {
  try {
    const response = await api.post('/api/timetable/copy-week', data);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to copy week schedule');
  }
};

export const publishTimetable = async (data) => {
  try {
    const response = await api.post('/api/timetable/publish', data);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to publish timetable');
  }
};

/* 3. Conflict Reports */
export const getConflictReport = async (academicSession) => {
  try {
    const params = academicSession ? { academic_session: academicSession } : {};
    const response = await api.get('/api/timetable/conflicts', { params });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch conflict report');
  }
};

/* 4. Teacher & Class Timetable Views */
export const getTeacherTimetable = async (teacherId, academicSession) => {
  try {
    const params = academicSession ? { academic_session: academicSession } : {};
    const response = await api.get(`/api/timetable/teacher/${teacherId}`, { params });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch teacher timetable');
  }
};

export const getMyTimetable = async (academicSession) => {
  try {
    const params = academicSession ? { academic_session: academicSession } : {};
    const response = await api.get('/api/timetable/my-timetable', { params });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch my timetable');
  }
};

export const getClassTimetable = async (className, section = 'A', academicSession) => {
  try {
    const params = { section, ...(academicSession ? { academic_session: academicSession } : {}) };
    const response = await api.get(`/api/timetable/class/${className}`, { params });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch class timetable');
  }
};

export const getTeacherWorkloadReport = async (academicSession) => {
  try {
    const params = academicSession ? { academic_session: academicSession } : {};
    const response = await api.get('/api/timetable/reports/workload', { params });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch teacher workload report');
  }
};

export const getUnassignedPeriodsReport = async (academicSession) => {
  try {
    const params = academicSession ? { academic_session: academicSession } : {};
    const response = await api.get('/api/timetable/reports/unassigned', { params });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch unassigned periods report');
  }
};

/* 5. Daily Substitution & Proxy Management */
export const getSubstitutions = async (filters = {}) => {
  try {
    const response = await api.get('/api/timetable/substitutions', { params: filters });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch daily substitutions');
  }
};

export const getAvailableSubstitutes = async (params = {}) => {
  try {
    const response = await api.get('/api/timetable/available-substitutes', { params });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch available substitute teachers');
  }
};

export const assignSubstitution = async (data) => {
  try {
    const response = await api.post('/api/timetable/substitutions', data);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to assign substitute teacher');
  }
};

export const deleteSubstitution = async (id) => {
  try {
    const response = await api.delete(`/api/timetable/substitutions/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to remove substitution');
  }
};

/* 6. Permanent Faculty Replacement (Handover routine) */
export const replaceFacultyInRoutine = async (data) => {
  try {
    const response = await api.post('/api/timetable/replace-faculty', data);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to transfer faculty periods');
  }
};
