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

// Attach bearer token on every request (mobile has no cookies)
api.interceptors.request.use(async (config) => {
    const token = await getStored(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export async function saveToken(token) {
    return setStored(TOKEN_KEY, token);
}
export async function clearToken() {
    return delStored(TOKEN_KEY);
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
