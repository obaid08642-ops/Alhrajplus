import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import api, { saveToken } from "./api";

/**
 * Opens Emergent Google Auth in an in-app browser and exchanges the returned
 * session_id for our JWT. Returns the authenticated user.
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
export async function signInWithGoogleEmergent() {
    const redirectUrl = Linking.createURL("/auth-callback");
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
    if (result.type !== "success" || !result.url) {
        throw new Error("تم إلغاء تسجيل الدخول");
    }

    // Extract session_id from URL hash (#session_id=...)
    const hashIdx = result.url.indexOf("#");
    const hash = hashIdx >= 0 ? result.url.slice(hashIdx + 1) : "";
    const params = new URLSearchParams(hash);
    const sessionId = params.get("session_id");
    if (!sessionId) throw new Error("لم يتم استلام معرف الجلسة");

    const { data } = await api.post("/auth/google", { session_id: sessionId });
    if (data.access_token) await saveToken(data.access_token);
    return data.user;
}
