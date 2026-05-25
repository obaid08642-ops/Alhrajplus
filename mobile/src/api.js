import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const BACKEND_URL =
    Constants.expoConfig?.extra?.backendUrl ||
    Constants.manifest?.extra?.backendUrl ||
    "https://alhrajplus.onrender.com";

const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    timeout: 20000,
});

const TOKEN_KEY = "hp_access_token";
const REFRESH_KEY = "hp_refresh_token";

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
    } catch (_) { /* noop */ }
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

export function formatApiError(err) {
    if (!err) return "خطأ غير متوقع";
    if (typeof err === "string") return err;
    if (Array.isArray(err)) return err.map(formatApiError).join(", ");
    if (err.msg) return err.msg;
    return JSON.stringify(err);
}

export { BACKEND_URL };
export default api;
