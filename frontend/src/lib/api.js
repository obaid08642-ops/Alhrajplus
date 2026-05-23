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

// ============================================================
// Global GET dedup + short-lived client cache.
// - Concurrent identical GETs share a single in-flight promise (saves N-1
//   network requests when many components mount at once).
// - Successful GET responses are cached for 15s to absorb tab switches and
//   rapid back/forward navigation. Mutations bust the whole cache.
// - Cache key includes URL + serialized params; auth-bearing endpoints
//   ("/auth/me", "/chat/...") skip the cache so user-specific data stays fresh.
// ============================================================
const _CLIENT_CACHE_TTL = 15_000; // ms
const _clientCache = new Map(); // key -> { ts, data, headers }
const _inflight = new Map();    // key -> Promise

const _SKIP_CACHE = ["/auth/", "/chat/", "/cloudinary/signature", "/notifications", "/favorites"];

function _cacheKey(config) {
    const p = config.params ? JSON.stringify(config.params, Object.keys(config.params).sort()) : "";
    return `${config.method || "get"}:${config.url}?${p}`;
}
function _skipCache(url = "") {
    return _SKIP_CACHE.some((p) => url.includes(p));
}

api.interceptors.request.use(async (config) => {
    const t = tokenStore.getAccess();
    if (t) {
        config.headers = config.headers || {};
        if (!config.headers.Authorization) config.headers.Authorization = `Bearer ${t}`;
    }
    // Only GETs are dedupable/cacheable.
    if ((config.method || "get").toLowerCase() !== "get" || _skipCache(config.url)) return config;
    const key = _cacheKey(config);
    // Serve from client cache when fresh.
    const hit = _clientCache.get(key);
    if (hit && Date.now() - hit.ts < _CLIENT_CACHE_TTL) {
        config.adapter = async () => ({
            data: hit.data, status: 200, statusText: "OK (client-cache)",
            headers: hit.headers || {}, config, request: null,
        });
        return config;
    }
    // Share in-flight promise across duplicate callers.
    if (_inflight.has(key)) {
        const p = _inflight.get(key);
        config.adapter = async () => {
            try {
                const res = await p;
                return { data: res.data, status: res.status, statusText: "OK (dedup)", headers: res.headers || {}, config, request: null };
            } catch (e) {
                throw e;
            }
        };
        return config;
    }
    // First caller — wrap default adapter so we can stash the promise.
    const originalAdapter = config.adapter || axios.defaults.adapter;
    const promise = (async () => originalAdapter(config))();
    _inflight.set(key, promise);
    promise.finally(() => { _inflight.delete(key); });
    config.adapter = () => promise;
    return config;
});

// Bust the entire client cache whenever a mutation succeeds.
function _bustClientCache() {
    _clientCache.clear();
}

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
        // Save GETs to client cache + clear inflight slot.
        const cfg = res.config || {};
        const method = (cfg.method || "get").toLowerCase();
        const url = cfg.url || "";
        if (method === "get" && !_skipCache(url)) {
            const key = _cacheKey(cfg);
            if (res.statusText && !String(res.statusText).startsWith("OK (")) {
                _clientCache.set(key, { ts: Date.now(), data: res.data, headers: res.headers });
            }
            _inflight.delete(key);
        } else if (method !== "get") {
            // Any successful mutation invalidates the client cache.
            _bustClientCache();
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
