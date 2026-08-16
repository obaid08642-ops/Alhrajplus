// CountryContext (mobile) — matches web /app/frontend/src/contexts/CountryContext.js.
// STRICT country isolation: the country chosen at signup ALWAYS wins over IP detect.
// The selected country is also injected into every API call by the axios interceptor.
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import api from "./api";

const STORAGE_KEY = "hp_country";
const FALLBACK_COUNTRY_CODES = ["SA", "AE", "KW", "QA", "BH", "OM", "EG"];
const Ctx = createContext(null);

// Try to resolve country from device GPS (no permission prompt forced — we use
// LOW accuracy + getLastKnownPositionAsync first to avoid asking on first run).
async function detectCountryByGPS() {
    try {
        // Use existing permission if granted; do NOT prompt — we don't want a
        // permission popup just for country detection. If denied/unknown, skip.
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") return "";
        const last = await Location.getLastKnownPositionAsync({}).catch(() => null);
        const pos = last || await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest }).catch(() => null);
        if (!pos?.coords) return "";
        const places = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
        }).catch(() => []);
        const iso = (places?.[0]?.isoCountryCode || "").toUpperCase();
        return iso || "";
    } catch (_) { return ""; }
}

export function CountryProvider({ children }) {
    const [country, setCountryState] = useState("");
    const [countries, setCountries] = useState([]);
    const [hydrated, setHydrated] = useState(false);
    // Monotonic counter — bumped on every country change so consumer screens
    // can use it as a useEffect dependency to force a fresh fetch.
    const [dataVersion, setDataVersion] = useState(0);

    useEffect(() => {
        (async () => {
            // 1) Restore from storage if any (highest priority).
            const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
            // 2) Load country list.
            let list = [];
            try { const r = await api.get("/meta/countries"); list = Array.isArray(r?.data) ? r.data : (Array.isArray(r?.data?.items) ? r.data.items : []); } catch (_) {}
            setCountries(list);
            // 3) If we have a stored value, use it only when it is a supported
            //    marketplace country. Stale/unsupported ISO codes must never
            //    reach discovery endpoints and produce a misleading empty feed.
            const normalizedStored = (stored || "").toUpperCase();
            const supportedCodes = list.length ? list.map((item) => String(item.code || "").toUpperCase()) : FALLBACK_COUNTRY_CODES;
            if (normalizedStored && supportedCodes.includes(normalizedStored)) {
                setCountryState(normalizedStored);
                setHydrated(true);
                return;
            }
            // 4) First install: try GPS → profile country → IP detect → default SA.
            let cc = "";
            // 4a) GPS (only if permission already granted — never prompts here)
            cc = await detectCountryByGPS();
            // 4b) Profile country (after login)
            if (!cc) {
                try {
                    const me = await api.get("/users/me");
                    cc = (me?.data?.country_code || "").toUpperCase();
                } catch (_) {}
            }
            // 4c) IP-based fallback — try our new Geonames detector first
            //     (multi-provider with internal fallback chain), then the
            //     legacy /geo endpoint.
            if (!cc) {
                try {
                    const det = await api.get("/locations/detect-country");
                    cc = (det?.data?.country || "").toUpperCase();
                } catch (_) {}
            }
            if (!cc) {
                try {
                    const det = await api.get("/geo/detect-country");
                    cc = (det?.data?.country || "").toUpperCase();
                } catch (_) {}
            }
            // Offline/device fallback: use the region embedded in the OS locale
            // before falling back to the first configured marketplace country.
            if (!cc) {
                try {
                    const locale = Intl?.DateTimeFormat?.().resolvedOptions?.().locale || "";
                    const region = typeof Intl?.Locale === "function" ? new Intl.Locale(locale).region : locale.match(/[-_]([A-Za-z]{2})$/)?.[1];
                    if (region && list.some((item) => item.code === region.toUpperCase())) cc = region.toUpperCase();
                } catch (_) {}
            }
            cc = (cc || "").toUpperCase();
            if (!supportedCodes.includes(cc)) cc = supportedCodes.includes("SA") ? "SA" : (supportedCodes[0] || "SA");
            setCountryState(cc);
            await AsyncStorage.setItem(STORAGE_KEY, cc).catch(() => {});
            setHydrated(true);
        })();
    }, []);

    // STRICT: localStorage is the source of truth. We DO NOT auto-sync the
    // profile country into storage on every load — that caused refresh to
    // silently snap users back to SA when their stored choice differed from
    // the (stale) value in the DB. The user changes country only via
    // setCountry(), which itself persists to both storage AND profile.

    const setCountry = useCallback(async (code) => {
        const requested = (code || "").toUpperCase();
        const supportedCodes = countries.length ? countries.map((item) => String(item.code || "").toUpperCase()) : FALLBACK_COUNTRY_CODES;
        const c = supportedCodes.includes(requested) ? requested : "SA";
        setCountryState(c);
        setDataVersion((v) => v + 1);
        await AsyncStorage.setItem(STORAGE_KEY, c).catch(() => {});
        try { await api.put("/users/me", { country_code: c }); } catch (_) {}
    }, [countries]);

    const current = countries.find((c) => c.code === country) || null;

    return (
        <Ctx.Provider value={{ country, setCountry, current, countries, dataVersion }}>
            {children}
        </Ctx.Provider>
    );
}

export const useCountry = () => useContext(Ctx) || { country: "", current: null, countries: [], setCountry: () => {}, dataVersion: 0 };
