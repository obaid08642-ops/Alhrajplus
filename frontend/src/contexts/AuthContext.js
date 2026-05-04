import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiError } from "@/lib/api";

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
        // CRITICAL: If returning from OAuth callback, skip the /me check.
        if (typeof window !== "undefined" && window.location.hash?.includes("session_id=")) {
            setLoading(false);
            return;
        }
        fetchMe();
    }, [fetchMe]);

    const login = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        setUser(data.user);
        return data.user;
    };
    const register = async (payload) => {
        const { data } = await api.post("/auth/register", payload);
        setUser(data.user);
        return data.user;
    };
    const logout = async () => {
        try { await api.post("/auth/logout"); } catch (_) {}
        setUser(false);
    };

    return (
        <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh: fetchMe, formatApiError }}>
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);
