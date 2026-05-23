import axios from "axios";

// Backend URL resolution order:
//   1. Runtime override (window.__APP_CONFIG__.BACKEND_URL) — set by
//      /public/config.js so ops can change the host WITHOUT rebuilding.
//   2. Build-time REACT_APP_BACKEND_URL (default).
// Allows the same bundle to point at staging vs production by swapping one
// static file on the host (CDN cache-busted via ?v=timestamp).
const RUNTIME_BACKEND = (typeof window !== "undefined" && window.__APP_CONFIG__ && window.__APP_CONFIG__.BACKEND_URL) || "";
const BACKEND_URL = RUNTIME_BACKEND || process.env.REACT_APP_BACKEND_URL || "";
export const API_BASE = `${BACKEND_URL}/api`;

// Surface in console so misconfig is obvious during smoke-test.
if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.info("[api] BACKEND_URL =", BACKEND_URL || "(empty!)");
}

const ACCESS_KEY = "hp_access";
const REFRESH_KEY = "hp_refresh";

export const tokenStore = {
    getAccess: () => {
        try { return localStorage.getItem(ACCESS_KEY) || ""; } catch (_) { return ""; }
    },
    getRefresh: () => {
        try { return localStorage.getItem(REFRESH_KEY) || ""; } catch (_) { return ""; }
    },
    save: ({ access_token, refresh_token } = {}) => {
        try {
            if (access_token) localStorage.setItem(ACCESS_KEY, access_token);
            if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
        } catch (_) {}
    },
    clear: () => {
        try {
            localStorage.removeItem(ACCESS_KEY);
            localStorage.removeItem(REFRESH_KEY);
        } catch (_) {}
    },
};

const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,   // sends cookies when browser allows (first-party / same-site contexts)
    timeout: 30000,
});

// Attach Bearer token to every request as a fallback for browsers that block
// third-party cookies (Safari ITP, iOS, Brave, strict tracking protection).
api.interceptors.request.use((config) => {
    const t = tokenStore.getAccess();
    if (t) {
        config.headers = config.headers || {};
        if (!config.headers.Authorization) config.headers.Authorization = `Bearer ${t}`;
    }
    return config;
});

// Auto refresh on 401 once. Try refresh via cookie + Bearer; persist new tokens.
let isRefreshing = false;
let refreshPromise = null;
api.interceptors.response.use(
    (res) => {
        // Opportunistically capture tokens from any response body (login, register, refresh, google callback redirect, etc.)
        const data = res?.data;
        if (data && typeof data === "object" && (data.access_token || data.refresh_token)) {
            tokenStore.save({ access_token: data.access_token, refresh_token: data.refresh_token });
        }
        return res;
    },
    async (err) => {
        const original = err.config;
        const status = err.response?.status;
        const url = original?.url || "";

        if (status === 401 && !original._retry && !url.includes("/auth/login") && !url.includes("/auth/register") && !url.includes("/auth/refresh")) {
            original._retry = true;
            if (!refreshPromise) {
                isRefreshing = true;
                refreshPromise = (async () => {
                    try {
                        const rt = tokenStore.getRefresh();
                        const body = rt ? { refresh_token: rt } : {};
                        const r = await api.post("/auth/refresh", body);
                        const at = r?.data?.access_token;
                        if (at) tokenStore.save({ access_token: at });
                        return true;
                    } catch (e) {
                        tokenStore.clear();
                        return false;
                    } finally {
                        isRefreshing = false;
                        refreshPromise = null;
                    }
                })();
            }
            const ok = await refreshPromise;
            if (ok) return api(original);
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
