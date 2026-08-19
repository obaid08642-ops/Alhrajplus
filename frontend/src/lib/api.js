import axios from "axios";

// Backend URL resolution order:
//   1. Runtime override (window.__APP_CONFIG__.BACKEND_URL) — set by
//      /public/config.js so ops can change the host WITHOUT rebuilding.
//   2. Build-time REACT_APP_BACKEND_URL (default).
// Allows the same bundle to point at staging vs production by swapping one
// static file on the host (CDN cache-busted via ?v=timestamp).
const runtimeConfig = typeof window !== "undefined" && window.__APP_CONFIG__ && typeof window.__APP_CONFIG__ === "object" ? window.__APP_CONFIG__ : {};
const configuredBackend = runtimeConfig.BACKEND_URL || process.env.REACT_APP_BACKEND_URL || "";
const BACKEND_URL = String(configuredBackend).trim().replace(/\/+$/, "");
// Accept either https://host or https://host/api; empty means same-origin /api.
export const API_BASE = BACKEND_URL ? (BACKEND_URL.endsWith("/api") ? BACKEND_URL : `${BACKEND_URL}/api`) : "/api";

// Surface in console so misconfig is obvious during smoke-test.
if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.info("[api] API_BASE =", API_BASE);
}

const ACCESS_KEY = "hp_access";
const REFRESH_KEY = "hp_refresh";
export const CLIENT_CONTRACT_VERSION = "2026.08.19.1";
export const CLIENT_PLATFORM = "web";

const preferredLanguage = () => {
    try {
        const value = String(localStorage.getItem("hp_lang") || "").toLowerCase();
        return ["ar", "en", "ur", "hi", "bn", "fr"].includes(value) ? value : "ar";
    } catch (_) {
        return "ar";
    }
};

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
// ALSO attach the user's selected country as a query parameter so the backend
// can apply STRICT country isolation across all reads (listings, stories,
// auctions, search) without each component having to remember to send it.
api.interceptors.request.use((config) => {
    const t = tokenStore.getAccess();
    if (t) {
        config.headers = config.headers || {};
        if (!config.headers.Authorization) config.headers.Authorization = `Bearer ${t}`;
    }
    try {
        const cc = (typeof localStorage !== "undefined" && localStorage.getItem("hp_country")) || "";
        if (cc) {
            config.params = config.params || {};
            // Don't clobber explicit overrides from callers.
            if (config.params.country_code === undefined && config.params.country === undefined) {
                config.params.country_code = cc;
            }
        }
    } catch (_) { /* noop */ }
    config.headers = config.headers || {};
    if (!config.headers["X-Haraj-Language"]) config.headers["X-Haraj-Language"] = preferredLanguage();
    if (!config.headers["X-Haraj-Client"]) config.headers["X-Haraj-Client"] = CLIENT_PLATFORM;
    if (!config.headers["X-Haraj-Contract-Version"]) config.headers["X-Haraj-Contract-Version"] = CLIENT_CONTRACT_VERSION;
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

let clientContractPromise = null;

// Fetches a public compatibility descriptor shared with Mobile.  It is opt-in
// so existing startup paths stay fast; callers cache the promise per session.
export const getClientContract = ({ force = false } = {}) => {
    if (force) clientContractPromise = null;
    if (!clientContractPromise) {
        clientContractPromise = api.get("/meta/client-contract").then(({ data }) => data).catch((error) => {
            clientContractPromise = null;
            throw error;
        });
    }
    return clientContractPromise;
};

let featureFlagsPromise = null;

// Rollout controls are public bootstrap metadata and intentionally stay lazy.
// A caller keeps the last fulfilled promise for the page session; force is only
// for an explicit admin/support refresh, not normal navigation.
export const getFeatureFlags = ({ force = false } = {}) => {
    if (force) featureFlagsPromise = null;
    if (!featureFlagsPromise) {
        featureFlagsPromise = api.get("/meta/feature-flags").then(({ data }) => data).catch((error) => {
            featureFlagsPromise = null;
            throw error;
        });
    }
    return featureFlagsPromise;
};

export const formatApiError = (detail) => {
    if (detail == null) return "حدث خطأ. يرجى المحاولة مرة أخرى.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" • ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
};

export default api;
