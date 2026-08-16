import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import api from "@/lib/api";

const ThemeCtx = createContext(null);

function systemPrefersDark() {
    return typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : false;
}

export function ThemeProvider({ children }) {
    // `system` is the first-visit default. A later explicit light/dark choice
    // is persisted and takes precedence until the user changes it again.
    const [themeMode, setThemeModeState] = useState(() => {
        if (typeof window === "undefined") return "system";
        return localStorage.getItem("hp_theme") || "system";
    });
    const [systemDark, setSystemDark] = useState(systemPrefersDark);
    const [theme, setTheme] = useState(null);
    const isDark = themeMode === "dark" || (themeMode === "system" && systemDark);

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = (event) => setSystemDark(event.matches);
        media.addEventListener?.("change", onChange);
        media.addListener?.(onChange);
        return () => {
            media.removeEventListener?.("change", onChange);
            media.removeListener?.(onChange);
        };
    }, []);

    useEffect(() => {
        const html = document.documentElement;
        if (isDark) html.classList.add("dark"); else html.classList.remove("dark");
        html.dataset.themeMode = themeMode;
        // Preserve the explicit `system` value instead of freezing the first
        // device result, so OS theme changes continue to be reflected.
        localStorage.setItem("hp_theme", themeMode);
    }, [isDark, themeMode]);

    useEffect(() => {
        api.get("/meta/theme").then(({ data }) => {
            setTheme(data);
            if (data?.primary_color) document.documentElement.style.setProperty("--primary", data.primary_color);
            if (data?.primary_hover) document.documentElement.style.setProperty("--primary-hover", data.primary_hover);
            if (data?.secondary_color) document.documentElement.style.setProperty("--secondary", data.secondary_color);
            if (data?.accent_color) document.documentElement.style.setProperty("--accent", data.accent_color);
        }).catch(() => {});
    }, []);

    const setThemeMode = useCallback((mode) => {
        if (!["system", "light", "dark"].includes(mode)) return;
        setThemeModeState(mode);
    }, []);
    const toggle = useCallback(() => setThemeModeState(isDark ? "light" : "dark"), [isDark]);
    const value = useMemo(() => ({ isDark, themeMode, setThemeMode, toggle, theme, setTheme }), [isDark, themeMode, setThemeMode, toggle, theme]);
    return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
