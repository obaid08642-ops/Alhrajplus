import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    timeout: 30000,
});

// Auto refresh token on 401 once
let isRefreshing = false;
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry && !original.url.includes("/auth/")) {
            if (isRefreshing) return Promise.reject(err);
            original._retry = true;
            isRefreshing = true;
            try {
                await api.post("/auth/refresh");
                isRefreshing = false;
                return api(original);
            } catch (_) {
                isRefreshing = false;
                return Promise.reject(err);
            }
        }
        return Promise.reject(err);
    }
);

export const formatApiError = (detail) => {
    if (detail == null) return "حدث خطأ. يرجى المحاولة مرة أخرى.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" • ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
};

export default api;
