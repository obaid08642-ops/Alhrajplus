import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as Linking from "expo-linking";
import api, { saveToken, clearToken } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mfaChallenge, setMfaChallenge] = useState(null);

    const fetchMe = useCallback(async () => {
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
        } catch {
            setUser(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMe(); }, [fetchMe]);

    // Capture tokens from a deep-link if the user returns to the app via
    // harajplus://auth/callback#access_token=... while the app was already open
    // (cold-launch case). Hot-launch is handled inline by socialAuth.js, but
    // some Android variants resume the existing activity instead.
    useEffect(() => {
        const handle = async (url) => {
            if (!url || !url.includes("auth/callback")) return;
            const hashIdx = url.indexOf("#");
            if (hashIdx < 0) return;
            const frag = new URLSearchParams(url.slice(hashIdx + 1));
            const token = frag.get("access_token");
            const refresh = frag.get("refresh_token");
            if (token) {
                await saveToken(token, refresh);
                fetchMe();
            }
        };
        const sub = Linking.addEventListener("url", (e) => handle(e.url));
        Linking.getInitialURL().then(handle);
        return () => sub.remove();
    }, [fetchMe]);

    const login = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        if (data.mfa_required) {
            const challenge = { id: data.challenge_id, expiresIn: data.expires_in || 300 };
            setMfaChallenge(challenge);
            return { mfaRequired: true, challenge };
        }
        if (data.access_token) await saveToken(data.access_token, data.refresh_token);
        setUser(data.user);
        setMfaChallenge(null);
        return data.user;
    };
    const verifyMfa = async (code) => {
        if (!mfaChallenge?.id) throw new Error("لا يوجد طلب تحقق ثنائي نشط");
        const { data } = await api.post("/auth/mfa/login/verify", { challenge_id: mfaChallenge.id, code });
        if (data.access_token) await saveToken(data.access_token, data.refresh_token);
        setUser(data.user);
        setMfaChallenge(null);
        return data.user;
    };
    const register = async (payload) => {
        const { data } = await api.post("/auth/register", payload);
        if (data.access_token) await saveToken(data.access_token, data.refresh_token);
        setUser(data.user);
        return data.user;
    };
    const logout = async () => {
        await clearToken();
        try { await api.post("/auth/logout"); } catch (_) {}
        setUser(false);
        setMfaChallenge(null);
    };

    return (
        <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh: fetchMe, mfaChallenge, verifyMfa, clearMfaChallenge: () => setMfaChallenge(null) }}>
            {children}
        </AuthCtx.Provider>
    );
}
export const useAuth = () => useContext(AuthCtx);
