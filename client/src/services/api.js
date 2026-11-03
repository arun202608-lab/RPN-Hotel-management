import axios from "axios";

// Resolves proper backend API URL across development and cloud environments
const getBaseURL = () => {
  const envUrl =
    import.meta.env.hotel_API_URL ||
    import.meta.env.HOTEL_API_URL ||
    import.meta.env.VITE_HOTEL_API_URL ||
    import.meta.env.VITE_API_URL;

  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    let clean = envUrl.trim().replace(/\/$/, "");
    // If relative path like /api, return directly so Vercel SPA reverse proxy works seamlessly without CORS
    if (clean.startsWith("/")) {
      return clean;
    }
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = `https://${clean}`;
    }
    if (!clean.endsWith("/api")) {
      clean = `${clean}/api`;
    }
    return clean;
  }
  return "http://localhost:5000/api";
};

// frontend to backend connection
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

if (typeof window !== "undefined") {
  console.log("[Hotel App] Connected API Base URL:", api.defaults.baseURL);
}

// Request interceptor to attach Bearer token (prioritizes isolated tab sessionStorage)
api.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem("admin_token") ||
      localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry / 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on a protected route, remove stale token from this tab
      const isAuthRoute =
        error.config?.url?.includes("/auth/login") || 
        error.config?.url?.includes("/auth/forgot-password");
      if (!isAuthRoute && (sessionStorage.getItem("admin_token") || localStorage.getItem("admin_token"))) {
        sessionStorage.removeItem("admin_token");
        sessionStorage.removeItem("admin_profile");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
