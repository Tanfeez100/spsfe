import axios from "axios";

export const PROD_API_BASE_URL = "https://starpublicschool-2kzu.onrender.com";

const getDefaultApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:5000";
    }
  }
  return PROD_API_BASE_URL;
};

export const normalizeApiBaseUrl = (url) => {
  const value = String(url || "").replace(/\/+$/, "");
  if (value === "http://localhost:8000" || value === "http://127.0.0.1:8000") {
    return "http://localhost:5000";
  }

  const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (isLocalHost) {
    return value && value.startsWith("http://localhost") ? value : "http://localhost:5000";
  }

  // In production (non-localhost hostname or production build):
  // Never point to localhost even if .env has it
  if (!value || value.includes("localhost") || value.includes("127.0.0.1")) {
    return PROD_API_BASE_URL;
  }

  return value || PROD_API_BASE_URL;
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

let isRefreshing = false;
let failedQueue = [];

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
const SEVEN_DAYS_MS = SEVEN_DAYS_SECONDS * 1000;

export const setAuthCookie = (name, value, maxAgeSeconds = SEVEN_DAYS_SECONDS) => {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
};

export const getAuthCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const removeAuthCookie = (name) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`;
};

const AUTH_KEYS = [
  "access_token",
  "refresh_token",
  "user",
  "session",
  "loginType",
  "sps_session_expires_at",
  "sps_session_created_at",
];

const getAuthStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return window.sessionStorage;
  }
};

export const isSessionExpired = () => {
  try {
    const storage = getAuthStorage();
    const expiresAt =
      storage?.getItem("sps_session_expires_at") ||
      getAuthCookie("sps_session_expires_at");
    if (!expiresAt) return false;
    const expiryTime = Number(expiresAt);
    if (Number.isNaN(expiryTime) || expiryTime <= 0) return false;
    return Date.now() > expiryTime;
  } catch {
    return false;
  }
};

const processQueue = (error, token = null) => {
  failedQueue.forEach((request) => {
    if (error) {
      request.reject(error);
      return;
    }
    request.resolve(token);
  });
  failedQueue = [];
};

export const emitToast = (type = "info", message = "", title = "") => {
  let toastType = "info";
  let toastMessage = "";
  let toastTitle = "";

  if (typeof type === "object" && type !== null) {
    toastType = type.type || "info";
    toastMessage = type.message || "";
    toastTitle = type.title || "";
  } else {
    toastType = type;
    toastMessage = message;
    toastTitle = title;
  }

  // Prevent empty ghost toasts
  if (!String(toastMessage || "").trim() && !String(toastTitle || "").trim()) {
    return;
  }

  // Never show raw status codes like "400 Error" in toast titles
  if (toastTitle) {
    toastTitle = toastTitle.replace(/\b\d{3}\s*(error|warning|info|notice)?\b/gi, "").trim();
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("app:toast", {
        detail: { type: toastType, message: toastMessage, title: toastTitle },
      }),
    );
  }
};

export const normalizeApiError = (
  error,
  fallbackMessage = "Request failed",
) => {
  const humanizeMessage = (message, status = 0) => {
    const raw = String(message || "").trim();
    const text = raw.toLowerCase();

    if (!raw) return "";

    if (
      text.includes("row-level security") ||
      text.includes("violates row-level security")
    ) {
      return "Permission issue hai. Is action ke liye database policy allow nahi kar rahi. Admin se RLS/service key setup check karwayein.";
    }

    if (
      text.includes("schema cache") ||
      text.includes("could not find the table") ||
      text.includes("pgrst205")
    ) {
      return "Database table app ko abhi visible nahi hai. Supabase SQL setup run karke schema reload karein.";
    }

    if (
      text.includes("duplicate key") ||
      text.includes("23505") ||
      text.includes("already exists")
    ) {
      return "Ye record pehle se exist karta hai. Duplicate entry save nahi ho sakti.";
    }

    if (
      text.includes("invalid input syntax") ||
      text.includes("invalid uuid")
    ) {
      return "Submitted data format valid nahi hai. Please selected value check karein.";
    }

    if (text.includes("foreign key") || text.includes("23503")) {
      return "Selected record kisi existing data se linked nahi hai. Please correct student/teacher/class select karein.";
    }

    if (text.includes("jwt") || text.includes("token") || status === 401) {
      return "Session expire ho gaya hai. Please dobara login karein.";
    }

    if (text.includes("network error") || text.includes("failed to fetch")) {
      return "Server se connection nahi ho pa raha. Backend/server status check karein.";
    }

    if (
      status >= 500 &&
      /table|policy|column|constraint|supabase|postgres|database|relation/.test(
        text,
      )
    ) {
      return "Database setup me issue hai. Admin se schema/policy setup check karwayein.";
    }

    return raw;
  };

  if (error?.status && error?.message && !error?.response) {
    return {
      ...error,
      message: humanizeMessage(error.message, error.status),
      rawMessage: error.message,
    };
  }

  const status = error?.response?.status || error?.status || 0;
  const data = error?.response?.data || error?.data || null;
  const serverMessage =
    data?.message || data?.error || (typeof data === "string" ? data : null);

  const statusMessages = {
    400: "Validation error. Please check submitted data.",
    401: "Unauthorized request. Please login again.",
    405: "Method not allowed for this endpoint.",
    409: "Conflict detected. This may be a roll number conflict.",
    500: "Server error. Please try again in a moment.",
  };

  return {
    status,
    message:
      humanizeMessage(serverMessage, status) ||
      statusMessages[status] ||
      fallbackMessage,
    rawMessage: serverMessage || "",
    data,
  };
};

export const buildQueryParams = (filters = {}) => {
  return Object.entries(filters).reduce((params, [key, value]) => {
    if (value === undefined || value === null) {
      return params;
    }

    if (typeof value === "string" && value.trim() === "") {
      return params;
    }

    if (Array.isArray(value) && value.length === 0) {
      return params;
    }

    params[key] = Array.isArray(value) ? value.join(",") : value;
    return params;
  }, {});
};

export const getLoginType = () => {
  const storage = getAuthStorage();
  return storage?.getItem("loginType") || getAuthCookie("sps_login_type") || "all";
};

export const getUser = () => {
  if (isSessionExpired()) {
    clearSession();
    return null;
  }

  const storage = getAuthStorage();
  let userStr = storage?.getItem("user");
  if (!userStr) {
    userStr = getAuthCookie("sps_user");
    if (userStr && storage) {
      try {
        storage.setItem("user", userStr);
      } catch {}
    }
  }

  if (!userStr) {
    return null;
  }

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const getAccessToken = () => {
  if (isSessionExpired()) {
    clearSession();
    return null;
  }

  const storage = getAuthStorage();
  let token = storage?.getItem("access_token");
  if (!token) {
    token = getAuthCookie("sps_access_token");
    if (token && storage) {
      try {
        storage.setItem("access_token", token);
      } catch {}
    }
  }
  return token || null;
};

export const getRefreshToken = () => {
  return getAuthStorage()?.getItem("refresh_token") || null;
};

export const setSession = (sessionData, loginType = "all") => {
  const accessToken =
    sessionData?.access_token || sessionData?.session?.access_token;
  const refreshToken =
    sessionData?.session?.refresh_token || sessionData?.refresh_token;
  const user = sessionData?.user || null;

  if (!accessToken || !user) {
    return;
  }

  const storage = getAuthStorage();
  const expiresAt = Date.now() + SEVEN_DAYS_MS;
  const createdAt = Date.now();

  if (storage) {
    try {
      storage.setItem("access_token", accessToken);
      if (refreshToken) {
        storage.setItem("refresh_token", refreshToken);
      }
      storage.setItem(
        "session",
        JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        }),
      );
      storage.setItem("user", JSON.stringify(user));
      storage.setItem("loginType", loginType);
      storage.setItem("sps_session_expires_at", String(expiresAt));
      storage.setItem("sps_session_created_at", String(createdAt));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }

  // Dual persistence in cookies: 7 days
  setAuthCookie("sps_access_token", accessToken, SEVEN_DAYS_SECONDS);
  setAuthCookie("sps_login_type", loginType, SEVEN_DAYS_SECONDS);
  setAuthCookie("sps_session_expires_at", String(expiresAt), SEVEN_DAYS_SECONDS);
  try {
    setAuthCookie("sps_user", JSON.stringify(user), SEVEN_DAYS_SECONDS);
  } catch {}
};

export const clearSession = () => {
  try {
    const localStorageRef = window.localStorage;
    AUTH_KEYS.forEach((key) => localStorageRef?.removeItem(key));
  } catch {}

  try {
    const sessionStorageRef = window.sessionStorage;
    AUTH_KEYS.forEach((key) => sessionStorageRef?.removeItem(key));
  } catch {}

  removeAuthCookie("sps_access_token");
  removeAuthCookie("sps_user");
  removeAuthCookie("sps_login_type");
  removeAuthCookie("sps_session_expires_at");
};

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw normalizeApiError(
      { status: 401, message: "No refresh token found" },
      "No refresh token found",
    );
  }

  try {
    const response = await publicApi.post("/api/auth/refresh", {
      refresh_token: refreshToken,
    });
    const newAccessToken =
      response.data?.access_token || response.data?.session?.access_token;
    const newRefreshToken =
      response.data?.session?.refresh_token || response.data?.refresh_token;

    if (!newAccessToken) {
      throw new Error("Refresh response does not include access token");
    }

    const storage = getAuthStorage();
    storage?.setItem("access_token", newAccessToken);
    setAuthCookie("sps_access_token", newAccessToken, SEVEN_DAYS_SECONDS);
    if (newRefreshToken) {
      storage?.setItem("refresh_token", newRefreshToken);
    }

    return newAccessToken;
  } catch (error) {
    throw normalizeApiError(error, "Session refresh failed");
  }
};

export const login = async (email, password) => {
  try {
    const response = await publicApi.post("/api/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Login failed");
  }
};

export const createUser = async (payload) => {
  try {
    const response = await api.post("/api/auth/create-user", payload);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Create user failed");
  }
};

export const createTeacher = async (payload) => {
  try {
    const response = await api.post("/api/auth/teachers", payload);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Create teacher failed");
  }
};

export const getTeachers = async () => {
  try {
    const response = await api.get("/api/auth/teachers");
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Fetch teachers failed");
  }
};

export const removeTeacher = async (teacherId) => {
  try {
    const response = await api.delete(`/api/auth/teachers/${teacherId}`);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Remove teacher failed");
  }
};

export const assignTeacherToClass = async (teacherId, payload) => {
  try {
    const response = await api.post(
      `/api/auth/teachers/${teacherId}/assignment`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Assign teacher failed");
  }
};

export const removeTeacherAssignment = async (teacherId, filters = {}) => {
  try {
    const response = await api.delete(
      `/api/auth/teachers/${teacherId}/assignment`,
      { params: buildQueryParams(filters) },
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Remove teacher assignment failed");
  }
};

export const resetPassword = async (userId, payload) => {
  try {
    const response = await api.patch(
      `/api/auth/reset-password/${userId}`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Reset password failed");
  }
};

export const logout = async () => {
  try {
    const token = getAccessToken();
    if (!token) {
      clearSession();
      return { success: true };
    }

    const response = await api.post("/api/auth/logout", {});
    clearSession();
    return response.data;
  } catch (error) {
    clearSession();
    throw normalizeApiError(error, "Logout failed");
  }
};

export const saveCredentials = (email, password) => {
  const savedCredentials = getSavedCredentials();
  const existingIndex = savedCredentials.findIndex(
    (credential) => credential.email === email,
  );

  if (existingIndex >= 0) {
    savedCredentials[existingIndex] = { email, password };
  } else {
    savedCredentials.push({ email, password });
  }

  localStorage.setItem("savedCredentials", JSON.stringify(savedCredentials));
};

export const getSavedCredentials = () => {
  const raw = localStorage.getItem("savedCredentials");
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const removeSavedCredentials = (email) => {
  const savedCredentials = getSavedCredentials();
  const filtered = savedCredentials.filter(
    (credential) => credential.email !== email,
  );
  localStorage.setItem("savedCredentials", JSON.stringify(filtered));
};

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(normalizeApiError(error)),
);

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/admission',
  '/contact',
  '/gallery',
  '/pay-fees',
  '/privacy-policy',
  '/privacy',
  '/results-portal',
  '/result',
  '/login',
  '/student-login',
  '/unauthorized',
];

const isPublicRoute = () => {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname || '/';
  return PUBLIC_ROUTES.some((route) => p === route || p.startsWith(route + '/'));
};

let isRedirectingToLogin = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;
    const isAuthRequest =
      originalRequest?.url?.includes("/api/auth/login") ||
      originalRequest?.url?.includes("/api/student-auth/login") ||
      originalRequest?.url?.includes("/api/auth/refresh") ||
      originalRequest?.url?.includes("/api/auth/logout");

    // Only attempt refresh if refreshToken exists and this wasn't an auth endpoint
    const refreshToken = getRefreshToken();
    if (status === 401 && !originalRequest._retry && !isAuthRequest && refreshToken) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((refreshError) =>
            Promise.reject(normalizeApiError(refreshError)),
          );
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const token = await refreshAccessToken();
        processQueue(null, token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (isSessionExpired()) {
          clearSession();
          if (
            !isRedirectingToLogin &&
            !isPublicRoute() &&
            window.location.pathname !== "/login" &&
            window.location.pathname !== "/student-login"
          ) {
            isRedirectingToLogin = true;
            emitToast("error", "Session expired (7 days). Please login again.", "Session Expired");
            setTimeout(() => {
              window.location.href = "/login";
            }, 600);
          }
        }
        return Promise.reject(normalizeApiError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    const normalizedError = normalizeApiError(error);
    if ([400, 401, 403, 405, 409, 500].includes(normalizedError.status)) {
      const msg = String(normalizedError.message || "").toLowerCase();
      let statusTitle = "Notice";
      if (msg.includes("closed")) {
        statusTitle = "Month Closed";
      } else if (normalizedError.status === 401) {
        statusTitle = isAuthRequest ? "Login Failed" : "Session Expired";
      } else if (normalizedError.status === 403) {
        statusTitle = "Permission Denied";
      } else if (normalizedError.status === 409) {
        statusTitle = "Conflict";
      } else if (normalizedError.status >= 500) {
        statusTitle = "Server Error";
      }
      
      // Don't spam repeated session expired toasts if it was an internal non-auth call
      if (!isAuthRequest && normalizedError.status === 401) {
        if (isSessionExpired()) {
          emitToast("error", "Session expired (7 days). Please login again.", "Session Expired");
        }
      } else {
        emitToast("error", normalizedError.message, statusTitle);
      }
    }

    // Only redirect to login if the 7-day session is genuinely expired or token is missing
    if (normalizedError.status === 401 && !isAuthRequest) {
      if (isSessionExpired() || !getAccessToken()) {
        clearSession();
        if (
          !isRedirectingToLogin &&
          !isPublicRoute() &&
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/student-login"
        ) {
          isRedirectingToLogin = true;
          setTimeout(() => {
            window.location.href = "/login";
          }, 600);
        }
      }
    }

    return Promise.reject(normalizedError);
  },
);

export default api;
