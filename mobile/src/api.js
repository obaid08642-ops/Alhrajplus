import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKEND_URL =
    Constants.expoConfig?.extra?.backendUrl ||
    Constants.manifest?.extra?.backendUrl ||
    "https://alhrajplus.onrender.com";

const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    timeout: 20000,
});

// Attach bearer token from AsyncStorage on every request (mobile has no cookies)
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem("hp_access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export async function saveToken(token) {
    await AsyncStorage.setItem("hp_access_token", token);
}
export async function clearToken() {
    await AsyncStorage.removeItem("hp_access_token");
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
