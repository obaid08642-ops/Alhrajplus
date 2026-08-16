import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiError, tokenStore } from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // null = checking, false = anonymous, object = logged
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

    useEffect(() => {
        // OAuth callback page handles its own token capture; skip /me here.
        if (typeof window !== "undefined") {
            const p = window.location.pathname || "";
            const h = window.location.hash || "";
            if (p.startsWith("/auth/callback") || p.startsWith("/auth/google/callback") ||
                h.includes("access_token=") || h.includes("session_id=")) {
                setLoading(false);
                return;
            }
        }
        fetchMe();
    }, [fetchMe]);

    const login = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        if (data.access_token) tokenStore.save({ access_token: data.access_token, refresh_token: data.refresh_token });
        setUser(data.user);
        return data.user;
    };
    const register = async (payload) => {
        const { data } = await api.post("/auth/register", payload);
        if (data.access_token) tokenStore.save({ access_token: data.access_token, refresh_token: data.refresh_token });
        setUser(data.user);
        return data.user;
    };
    const updateUser = useCallback((patch) => {
        setUser((current) => current && current !== false ? { ...current, ...patch } : current);
    }, []);

    const logout = async () => {
        try { await api.post("/auth/logout"); } catch (_) {}
        tokenStore.clear();
        setUser(false);
    };

    return (
        <AuthCtx.Provider value={{ user, loading, login, register, logout, updateUser, refresh: fetchMe, formatApiError }}>
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);
