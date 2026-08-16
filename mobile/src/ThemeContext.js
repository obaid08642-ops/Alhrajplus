// ThemeContext — device-aware dark/light theme with an explicit override.
import { Appearance } from "react-native";
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

const Ctx = createContext({ isDark: false, themeMode: "system", palette: lightColors, toggle: () => {}, setThemeMode: () => {} });

export function ThemeModeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState("system");
  const [systemScheme, setSystemScheme] = useState(() => Appearance.getColorScheme() || "light");

  useEffect(() => {
    AsyncStorage.getItem("hp_dark_mode").then(v => {
      // Existing 1/0 values are explicit user choices. New installs stay on
      // system so the first screen follows the device automatically.
      if (v === "1") setThemeModeState("dark");
      else if (v === "0") setThemeModeState("light");
      else setThemeModeState("system");
    }).catch(() => {});
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme || "light"));
    return () => sub?.remove?.();
  }, []);

  const isDark = themeMode === "dark" || (themeMode === "system" && systemScheme === "dark");
  const setThemeMode = useCallback(async (mode) => {
    if (!["system", "light", "dark"].includes(mode)) return;
    setThemeModeState(mode);
    try { await AsyncStorage.setItem("hp_dark_mode", mode === "dark" ? "1" : mode === "light" ? "0" : "system"); } catch (_) {}
  }, []);
  const toggle = useCallback(() => setThemeMode(isDark ? "light" : "dark"), [isDark, setThemeMode]);
  const palette = isDark ? darkColors : lightColors;
  const value = useMemo(() => ({ isDark, themeMode, palette, toggle, setThemeMode }), [isDark, themeMode, palette, toggle, setThemeMode]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useThemeMode = () => useContext(Ctx);
