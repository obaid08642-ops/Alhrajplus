import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { tr } from "./I18nContext";

const CRED_KEY = "hp_biometric_creds";
const FLAG_KEY = "hp_biometric_enabled";

/**
 * Biometric Login helpers.
 * - isBiometricAvailable(): checks hardware + enrolled biometrics
 * - enableBiometric(email, password): prompts once, stores creds securely
 * - tryBiometricLogin(): prompts and returns stored creds or null
 * - disableBiometric(): clears stored creds
 */

export async function isBiometricAvailable() {
    try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) return { available: false, reason: "hardware" };
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!enrolled) return { available: false, reason: "not_enrolled" };
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        return { available: true, types };
    } catch (_) {
        return { available: false, reason: "error" };
    }
}

export async function isBiometricEnabled() {
    try {
        const v = await SecureStore.getItemAsync(FLAG_KEY);
        return v === "1";
    } catch (_) { return false; }
}

export async function enableBiometric(email, password) {
    const { available } = await isBiometricAvailable();
    if (!available) {
        Alert.alert("تعذّر التفعيل", "جهازك لا يدعم البصمة أو لم تُسجّل بصمة/FaceID في الإعدادات.");
        return false;
    }
    // Authenticate once to confirm user's identity BEFORE we store creds
    const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "أثبت هويتك لتفعيل الدخول بالبصمة",
        fallbackLabel: "استخدم كلمة المرور",
        disableDeviceFallback: false,
    });
    if (!result.success) return false;
    try {
        await SecureStore.setItemAsync(CRED_KEY, JSON.stringify({ email, password }), {
            requireAuthentication: false, // we already authenticated above; avoid double prompt on retrieve
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        await SecureStore.setItemAsync(FLAG_KEY, "1");
        return true;
    } catch (e) {
        Alert.alert("خطأ", "تعذّر حفظ بيانات الدخول بأمان");
        return false;
    }
}

export async function disableBiometric() {
    try {
        await SecureStore.deleteItemAsync(CRED_KEY);
        await SecureStore.deleteItemAsync(FLAG_KEY);
    } catch (_) {}
}

/**
 * Returns {email, password} after successful biometric prompt, or null if not available / user cancelled.
 */
export async function tryBiometricLogin() {
    const enabled = await isBiometricEnabled();
    if (!enabled) return null;
    const { available } = await isBiometricAvailable();
    if (!available) return null;
    const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "الدخول إلى الحراج بلس",
        fallbackLabel: "كلمة المرور",
        disableDeviceFallback: false,
    });
    if (!result.success) return null;
    try {
        const raw = await SecureStore.getItemAsync(CRED_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
}
