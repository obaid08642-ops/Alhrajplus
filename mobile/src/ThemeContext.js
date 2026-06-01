// ThemeContext — lightweight dark/light theme switch persisted in AsyncStorage.
// Components opt-in via `const { isDark, palette, toggle } = useThemeMode();`.
// We expose a `palette` object so screens can subscribe to the resolved
// color values without re-importing from theme.js. Existing screens that
// import `colors` directly will continue using the LIGHT palette until they
// are migrated — this incremental approach keeps the Phase 17 design stable.
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors as lightColors } from "./theme";

const darkColors = {
  ...lightColors,
  bg: "#0A1128",
  surface: "#0F1B3A",
  surfaceCard: "#152244",
  surfaceElevated: "#1E2A4E",
  text: "#E7EEF8",
  textMuted: "#94A3B8",
  textSubtle: "#64748B",
  border: "#1E2A44",
  borderSubtle: "#152244",
};

const Ctx = createContext({ isDark: false, palette: lightColors, toggle: () => {} });

export function ThemeModeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem("hp_dark_mode").then(v => setIsDark(v === "1")).catch(() => {});
  }, []);
  const toggle = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    try { await AsyncStorage.setItem("hp_dark_mode", next ? "1" : "0"); } catch (_) {}
  }, [isDark]);
  const palette = isDark ? darkColors : lightColors;
  const value = useMemo(() => ({ isDark, palette, toggle }), [isDark, palette, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useThemeMode = () => useContext(Ctx);
