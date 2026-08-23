import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { tr } from "./I18nContext";

const BACKEND_URL =
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    Constants.expoConfig?.extra?.backendUrl ||
    Constants.manifest?.extra?.backendUrl ||
    "https://alhrajplus.onrender.com";

const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    timeout: 20000,
});

const TOKEN_KEY = "hp_access_token";
const REFRESH_KEY = "hp_refresh_token";
const LANGUAGE_KEY = "hp_lang";
export const CLIENT_CONTRACT_VERSION = "2026.08.19.1";
export const CLIENT_PLATFORM = "mobile";
const SUPPORTED_LANGUAGES = new Set(["ar", "en", "ur", "hi", "bn", "fr"]);

// Secure-first storage: keychain on iOS, EncryptedSharedPreferences on Android.
// Fall back to AsyncStorage when SecureStore isn't available (web / older sims).
async function getStored(key) {
    try {
        if (SecureStore.isAvailableAsync && await SecureStore.isAvailableAsync()) {
            const v = await SecureStore.getItemAsync(key);
            if (v) return v;
        }
    } catch (_) {}
    return AsyncStorage.getItem(key);
}
async function setStored(key, value) {
    if (value == null) return;
    try {
        if (SecureStore.isAvailableAsync && await SecureStore.isAvailableAsync()) {
            await SecureStore.setItemAsync(key, value);
        }
    } catch (_) {}
    return AsyncStorage.setItem(key, value);
}
async function delStored(key) {
    try {
        if (SecureStore.isAvailableAsync && await SecureStore.isAvailableAsync()) {
            await SecureStore.deleteItemAsync(key);
        }
    } catch (_) {}
    return AsyncStorage.removeItem(key);
}

// Attach bearer token + selected country on every request. The country query
// param enforces STRICT country isolation across all reads (listings, stories,
// auctions, search) without each screen having to remember to send it.
api.interceptors.request.use(async (config) => {
    const token = await getStored(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    try {
        const cc = await AsyncStorage.getItem("hp_country");
        if (cc) {
            config.params = config.params || {};
            if (config.params.country_code === undefined && config.params.country === undefined) {
                config.params.country_code = cc;
            }
        }
        const language = String(await AsyncStorage.getItem(LANGUAGE_KEY) || "ar").toLowerCase();
        config.headers = config.headers || {};
        if (!config.headers["X-Haraj-Language"]) config.headers["X-Haraj-Language"] = SUPPORTED_LANGUAGES.has(language) ? language : "ar";
    } catch (_) { /* noop */ }
    config.headers = config.headers || {};
    if (!config.headers["X-Haraj-Client"]) config.headers["X-Haraj-Client"] = CLIENT_PLATFORM;
    if (!config.headers["X-Haraj-Contract-Version"]) config.headers["X-Haraj-Contract-Version"] = CLIENT_CONTRACT_VERSION;
    return config;
});

// Auto-refresh on 401 (once). Mobile mirrors web logic so the user stays
// logged in indefinitely as long as the 30-day refresh token is valid.
let refreshPromise = null;
api.interceptors.response.use(
    (res) => {
        // Opportunistically save tokens from any successful response (login/register/oauth/refresh).
        const d = res?.data;
        if (d && typeof d === "object") {
            if (d.access_token) setStored(TOKEN_KEY, d.access_token);
            if (d.refresh_token) setStored(REFRESH_KEY, d.refresh_token);
        }
        return res;
    },
    async (err) => {
        const original = err.config || {};
        const status = err.response?.status;
        const url = original.url || "";
        if (status === 401 && !original._retry && !url.includes("/auth/login") && !url.includes("/auth/register") && !url.includes("/auth/refresh")) {
            original._retry = true;
            if (!refreshPromise) {
                refreshPromise = (async () => {
                    try {
                        const rt = await getStored(REFRESH_KEY);
                        const body = rt ? { refresh_token: rt } : {};
                        const r = await api.post("/auth/refresh", body);
                        const at = r?.data?.access_token;
                        if (at) await setStored(TOKEN_KEY, at);
                        return !!at;
                    } catch (_) {
                        await delStored(TOKEN_KEY);
                        await delStored(REFRESH_KEY);
                        return false;
                    } finally {
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

export async function saveToken(token, refreshToken) {
    await setStored(TOKEN_KEY, token);
    if (refreshToken) await setStored(REFRESH_KEY, refreshToken);
}
export async function clearToken() {
    await delStored(TOKEN_KEY);
    await delStored(REFRESH_KEY);
}

let clientContractPromise = null;

// Uses the same public compatibility descriptor as Web.  The request is lazy
// and cached so it does not add work to cold app startup.
export function getClientContract({ force = false } = {}) {
    if (force) clientContractPromise = null;
    if (!clientContractPromise) {
        clientContractPromise = api.get("/meta/client-contract").then(({ data }) => data).catch((error) => {
            clientContractPromise = null;
            throw error;
        });
    }
    return clientContractPromise;
}

let featureFlagsPromise = null;

export function getFeatureFlags({ force = false } = {}) {
    if (force) featureFlagsPromise = null;
    if (!featureFlagsPromise) {
        featureFlagsPromise = api.get("/meta/feature-flags").then(({ data }) => data).catch((error) => {
            featureFlagsPromise = null;
            throw error;
        });
    }
    return featureFlagsPromise;
}

function normalizeApiDetail(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map(normalizeApiDetail).filter(Boolean).join(" • ");
    if (typeof value?.msg === "string") return value.msg;
    return "";
}

function safeRetryAfter(headers) {
    const raw = headers?.["retry-after"] ?? headers?.["Retry-After"];
    const seconds = Number(raw);
    return Number.isFinite(seconds) && seconds >= 0 && seconds <= 86400 ? seconds : null;
}

/**
 * Normalizes transport failures for native screens without interpreting payment
 * offers or OAuth challenges. A real provider flow can be added later only
 * after its backend contract is deployed and verified end-to-end.
 */
export function getApiErrorContract(err) {
    const response = err?.response;
    const status = Number(response?.status || 0) || null;
    const headers = response?.headers || {};
    const body = response?.data;
    const detail = normalizeApiDetail(body?.detail ?? body?.message ?? err?.message ?? err);
    const challenge = String(headers?.["www-authenticate"] ?? headers?.["WWW-Authenticate"] ?? "").toLowerCase();

    let kind = "request_failed";
    if (!response) kind = "network_unavailable";
    else if (status === 401 || challenge.includes("bearer")) kind = "authentication_required";
    else if (status === 402) kind = "payment_required";
    else if (status === 403) kind = "authorization_denied";
    else if (status === 422) kind = "validation_failed";
    else if (status === 429) kind = "rate_limited";
    else if (status >= 500) kind = "service_unavailable";

    return {
        kind,
        status,
        detail,
        retryAfterSeconds: safeRetryAfter(headers),
        retryable: kind === "network_unavailable" || kind === "rate_limited" || kind === "service_unavailable",
        requiresSignIn: kind === "authentication_required",
        // This is a state marker only. It deliberately exposes no payment URL,
        // amount, token, or provider until a real MPP contract exists.
        paymentRequired: kind === "payment_required",
    };
}

export function formatApiError(err) {
    const contract = getApiErrorContract(err);
    if (contract.paymentRequired) return tr("هذه العملية تتطلب تفويض دفع من الخدمة.");
    if (contract.detail) return contract.detail;
    if (contract.kind === "authentication_required") return tr("انتهت جلسة الدخول. سجل الدخول ثم أعد المحاولة.");
    if (contract.kind === "authorization_denied") return tr("ليس لديك صلاحية لإتمام هذه العملية.");
    if (contract.kind === "rate_limited") return tr("تمت محاولات كثيرة. أعد المحاولة بعد قليل.");
    if (contract.kind === "service_unavailable") return tr("الخدمة غير متاحة مؤقتًا. أعد المحاولة لاحقًا.");
    if (contract.kind === "network_unavailable") return tr("تعذر الاتصال بالخدمة. تحقق من الإنترنت ثم أعد المحاولة.");
    return tr("خطأ غير متوقع");
}

export { BACKEND_URL };
export default api;
