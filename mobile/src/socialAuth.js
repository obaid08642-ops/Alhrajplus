import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import api, { saveToken, BACKEND_URL } from "./api";
import { tr } from "./I18nContext";

WebBrowser.maybeCompleteAuthSession();

/**
 * Universal OAuth helper for the mobile app.
 *
 * Flow:
 *   1. Build a deep-link return URL using the app scheme ("harajplus://auth/callback").
 *   2. Hit /api/auth/<provider>/start?mobile_redirect=... to get the provider URL.
 *   3. openAuthSessionAsync opens an in-app browser. After the user authorizes,
 *      the backend exchanges the code, issues our JWT, then 302-redirects to
 *      the scheme URL with #access_token=...&refresh_token=...
 *   4. WebBrowser closes automatically as soon as it sees the scheme URL,
 *      returning it to us so we can parse the tokens.
 *
 * Returns: { access_token, refresh_token } on success; throws on cancel/error.
 */
async function runOAuth(provider) {
    const returnUrl = Linking.createURL("/auth/callback"); // harajplus://auth/callback
    // Ask backend for the provider consent URL with mobile_redirect set so the
    // backend's final redirect uses our custom scheme.
    const { data } = await api.get(`/auth/${provider}/start`, { params: { mobile_redirect: returnUrl } });
    const authUrl = data?.auth_url;
    if (!authUrl) throw new Error(tr(tr(tr(tr(tr("لم يستطع الخادم بدء جلسة OAuth"))))));

    const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl, {
        showInRecents: false,
        preferEphemeralSession: true,
    });
    if (result.type !== "success" || !result.url) {
        throw new Error(tr(tr(tr(tr(tr("تم إلغاء تسجيل الدخول"))))));
    }

    // Parse URL fragment or query for tokens / error
    const hashIdx = result.url.indexOf("#");
    const queryIdx = result.url.indexOf("?");
    const fragStr = hashIdx >= 0 ? result.url.slice(hashIdx + 1) : "";
    const queryStr = queryIdx >= 0 && (hashIdx < 0 || queryIdx < hashIdx) ? result.url.slice(queryIdx + 1, hashIdx >= 0 ? hashIdx : undefined) : "";

    const frag = new URLSearchParams(fragStr);
    const query = new URLSearchParams(queryStr);

    const errCode = query.get("error") || frag.get("error");
    if (errCode) throw new Error(`خطأ: ${errCode}`);

    const accessToken = frag.get("access_token");
    const refreshToken = frag.get("refresh_token");
    if (!accessToken) throw new Error(tr(tr(tr(tr(tr("لم نتلق رمز الوصول"))))));

    await saveToken(accessToken, refreshToken);
    return { access_token: accessToken, refresh_token: refreshToken };
}

export const signInWithGoogle   = () => runOAuth("google");
export const signInWithX        = () => runOAuth("x");
export const signInWithSnapchat = () => runOAuth("snapchat");

// Apple Sign-In:
//   * iOS  → use the native button (REQUIRED by App Store guidelines whenever
//     other third-party logins are present).
//   * Android / Web → fall back to the OAuth web flow.
export async function signInWithApple() {
    if (Platform.OS === "ios") {
        const available = await AppleAuthentication.isAvailableAsync();
        if (!available) throw new Error(tr(tr(tr(tr(tr("Apple Sign-In غير متوفر على هذا الجهاز"))))));
        const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
        });
        // identityToken is the JWT signed by Apple — backend verifies it.
        const { data } = await api.post("/auth/apple/native", {
            identity_token: credential.identityToken,
            authorization_code: credential.authorizationCode,
            user_id: credential.user,
            email: credential.email,
            full_name: credential.fullName
                ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(" ")
                : null,
        });
        const access = data?.access_token || data?.token;
        const refresh = data?.refresh_token || null;
        if (!access) throw new Error(tr(tr(tr(tr(tr("لم نتلق رمز الوصول"))))));
        await saveToken(access, refresh);
        return { access_token: access, refresh_token: refresh };
    }
    return runOAuth("apple");
}

// Convenience: fetch /auth/me after OAuth so callers can update their context.
export async function fetchMe() {
    const { data } = await api.get("/auth/me");
    return data;
}
