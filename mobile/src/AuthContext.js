import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as Linking from "expo-linking";
import api, { saveToken, clearToken } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
            if (token) {
                await saveToken(token);
                fetchMe();
            }
        };
        const sub = Linking.addEventListener("url", (e) => handle(e.url));
        Linking.getInitialURL().then(handle);
        return () => sub.remove();
    }, [fetchMe]);

    const login = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        if (data.access_token) await saveToken(data.access_token);
        setUser(data.user);
        return data.user;
    };
    const register = async (payload) => {
        const { data } = await api.post("/auth/register", payload);
        if (data.access_token) await saveToken(data.access_token);
        setUser(data.user);
        return data.user;
    };
    const logout = async () => {
        await clearToken();
        try { await api.post("/auth/logout"); } catch (_) {}
        setUser(false);
    };

    return (
        <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh: fetchMe }}>
            {children}
        </AuthCtx.Provider>
    );
}
export const useAuth = () => useContext(AuthCtx);
