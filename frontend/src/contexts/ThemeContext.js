import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem("hp_theme") === "dark";
    });
    const [theme, setTheme] = useState(null); // backend-driven theme

    useEffect(() => {
        const html = document.documentElement;
        if (isDark) html.classList.add("dark"); else html.classList.remove("dark");
        localStorage.setItem("hp_theme", isDark ? "dark" : "light");
    }, [isDark]);

    useEffect(() => {
        api.get("/meta/theme").then(({ data }) => {
            setTheme(data);
            // Apply CSS vars
            if (data?.primary_color) {
                document.documentElement.style.setProperty("--primary", data.primary_color);
            }
            if (data?.primary_hover) {
                document.documentElement.style.setProperty("--primary-hover", data.primary_hover);
            }
            if (data?.secondary_color) {
                document.documentElement.style.setProperty("--secondary", data.secondary_color);
            }
            if (data?.accent_color) {
                document.documentElement.style.setProperty("--accent", data.accent_color);
            }
        }).catch(() => {});
    }, []);

    return (
        <ThemeCtx.Provider value={{ isDark, toggle: () => setIsDark((p) => !p), theme, setTheme }}>
            {children}
        </ThemeCtx.Provider>
    );
}

export const useTheme = () => useContext(ThemeCtx);
