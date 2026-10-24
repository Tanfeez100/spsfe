import api, { normalizeApiError } from "./auth";

/**
 * 1. Overview
 */
export const getExamOverviewApi = async (session = "2026-27") => {
  try {
    const res = await api.get(`/api/examinations/overview?session=${encodeURIComponent(session)}`);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to load examination overview"));
  }
};

/**
 * 2. Exam Setup CRUD
 */
export const getExaminationsApi = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/api/examinations?${query}`);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to load examinations"));
  }
};

export const createExaminationApi = async (data) => {
  try {
    const res = await api.post("/api/examinations", data);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to create examination"));
  }
};

export const updateExaminationApi = async (id, data) => {
  try {
    const res = await api.put(`/api/examinations/${id}`, data);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to update examination"));
  }
};

export const deleteExaminationApi = async (id) => {
  try {
    const res = await api.delete(`/api/examinations/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to delete examination"));
  }
};

export const archiveExaminationApi = async (id) => {
  try {
    const res = await api.post(`/api/examinations/${id}/archive`);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to archive examination"));
  }
};

/**
 * 3. Timetable API
 */
export const getTimetablesApi = async (examId, params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/api/examinations/${examId}/timetables?${query}`);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to load examination timetable"));
  }
};

export const createTimetableEntryApi = async (examId, data) => {
  try {
    const res = await api.post(`/api/examinations/${examId}/timetables`, data);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to add timetable slot"));
  }
};

export const updateTimetableEntryApi = async (examId, timetableId, data) => {
  try {
    const res = await api.put(`/api/examinations/${examId}/timetables/${timetableId}`, data);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to update timetable slot"));
  }
};

export const deleteTimetableEntryApi = async (examId, timetableId) => {
  try {
    const res = await api.delete(`/api/examinations/${examId}/timetables/${timetableId}`);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to delete timetable slot"));
  }
};

export const copyTimetableApi = async (examId, fromClass, toClass) => {
  try {
    const res = await api.post(`/api/examinations/${examId}/timetables/copy`, { fromClass, toClass });
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to copy timetable"));
  }
};

export const togglePublishTimetableApi = async (examId, className, publish) => {
  try {
    const res = await api.post(`/api/examinations/${examId}/timetables/publish`, { className, publish });
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to toggle timetable publication"));
  }
};

/**
 * 4. Subjects & Assessment Rules
 */
export const getExamSubjectsApi = async (examId, className) => {
  try {
    const res = await api.get(`/api/examinations/${examId}/subjects?className=${encodeURIComponent(className || "")}`);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to load examination subjects"));
  }
};

export const saveExamSubjectApi = async (examId, data) => {
  try {
    const res = await api.post(`/api/examinations/${examId}/subjects`, data);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to save subject assessment rules"));
  }
};

/**
 * 5. Marks Entry & Approval
 */
export const getMarksSheetApi = async (examId, params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/api/examinations/${examId}/marks?${query}`);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to load marks sheet"));
  }
};

export const batchSaveMarksApi = async (examId, data) => {
  try {
    const res = await api.post(`/api/examinations/${examId}/marks/batch`, data);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to save marks"));
  }
};

export const approveMarksApi = async (examId, data) => {
  try {
    const res = await api.post(`/api/examinations/${examId}/marks/approve`, data);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to approve marks"));
  }
};

/**
 * 6. Results & Reports
 */
export const calculateAndGetResultsApi = async (examId, params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/api/examinations/${examId}/results?${query}`);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to calculate results"));
  }
};

export const togglePublishResultsApi = async (examId, data) => {
  try {
    const res = await api.post(`/api/examinations/${examId}/results/publish`, data);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to toggle result publication"));
  }
};

/**
 * 7. Notices
 */
export const getNoticesApi = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/api/examinations/notices/list?${query}`);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to load notices"));
  }
};

export const createNoticeApi = async (data) => {
  try {
    const res = await api.post("/api/examinations/notices", data);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to create notice"));
  }
};

export const updateNoticeApi = async (noticeId, data) => {
  try {
    const res = await api.put(`/api/examinations/notices/${noticeId}`, data);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to update notice"));
  }
};

export const deleteNoticeApi = async (noticeId) => {
  try {
    const res = await api.delete(`/api/examinations/notices/${noticeId}`);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to delete notice"));
  }
};

/**
 * 8. Reports
 */
export const getReportsApi = async (examId, params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/api/examinations/${examId}/reports?${query}`);
    return res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err, "Failed to generate report"));
  }
};
