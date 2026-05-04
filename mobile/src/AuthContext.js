import { createContext, useContext, useEffect, useState, useCallback } from "react";
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
