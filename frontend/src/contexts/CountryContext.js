import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Global country filter.
 * - Persisted to localStorage under `hp_country` so it survives reloads.
 * - Anyone (logged-in or anonymous) can choose a country to filter listings.
 * - When a logged-in user changes it, we also PATCH /api/users/me so the
 *   server-side preference matches (recommendations, push targeting, etc.).
 * - When user logs in for the first time and has no localStorage value,
 *   we seed from user.country_code; otherwise localStorage wins.
 */

const COUNTRIES = [
    { code: "SA", flag: "🇸🇦", name_ar: "السعودية", dial: "+966" },
    { code: "AE", flag: "🇦🇪", name_ar: "الإمارات", dial: "+971" },
    { code: "KW", flag: "🇰🇼", name_ar: "الكويت", dial: "+965" },
    { code: "QA", flag: "🇶🇦", name_ar: "قطر", dial: "+974" },
    { code: "BH", flag: "🇧🇭", name_ar: "البحرين", dial: "+973" },
    { code: "OM", flag: "🇴🇲", name_ar: "عُمان", dial: "+968" },
    { code: "EG", flag: "🇪🇬", name_ar: "مصر", dial: "+20" },
];

const STORAGE_KEY = "hp_country";
const SEEN_PICKER_KEY = "hp_country_picker_seen";
function deviceRegion() {
    try {
        const locale = navigator?.language || "";
        const region = typeof Intl?.Locale === "function" ? new Intl.Locale(locale).region : locale.match(/[-_]([A-Za-z]{2})$/)?.[1];
        return (region || "").toUpperCase();
    } catch (_) { return ""; }
}

const Ctx = createContext(null);

export function CountryProvider({ children }) {
    const { user } = useAuth();
    const [country, setCountryState] = useState(() => {
        try { return localStorage.getItem(STORAGE_KEY) || ""; } catch { return ""; }
    });
    const [showPicker, setShowPicker] = useState(false);

    // Seed from user profile ONLY on initial login (when localStorage is empty).
    // After the user has explicitly chosen a country (or we auto-detected one),
    // `localStorage[STORAGE_KEY]` becomes the single source of truth — we never
    // overwrite it from `user.country_code` again, otherwise hitting Refresh
    // would silently snap the UI back to whatever is in the DB.
    useEffect(() => {
        if (!user || user === false) return;
        const fromUser = (user.country_code || "").toUpperCase();
        if (!fromUser || fromUser.length !== 2) return;
        let stored = "";
        try { stored = localStorage.getItem(STORAGE_KEY) || ""; } catch (_) {}
        // Only seed when storage is empty. Never overwrite an existing choice.
        if (!stored) {
            try { localStorage.setItem(STORAGE_KEY, fromUser); } catch (_) {}
            setCountryState(fromUser);
        }
    }, [user]);

    // Show first-visit picker once, if no country chosen and not previously dismissed.
    // BUT: before showing the picker, try to auto-detect the country from the
    // user's IP via /api/geo/detect-country. If detection succeeds and the
    // country is supported, silently use it (still overridable by the topbar).
    useEffect(() => {
        if (country) return;
        let seen = "0";
        try { seen = localStorage.getItem(SEEN_PICKER_KEY) || "0"; } catch (_) {}
        let cancelled = false;
        (async () => {
            // Try Geonames-backed multi-provider detector first (ip-api → ipapi → ipinfo),
            // then fall back to the legacy /geo/detect-country.
            let detected = "";
            try {
                const { data } = await api.get("/locations/detect-country");
                detected = (data?.country || "").toUpperCase();
            } catch (_) { /* try legacy */ }
            if (!detected) {
                try {
                    const { data } = await api.get("/geo/detect-country");
                    detected = (data?.country || "").toUpperCase();
                } catch (_) { /* use device locale below */ }
            }
            if (!detected) {
                const region = deviceRegion();
                if (COUNTRIES.some((item) => item.code === region)) detected = region;
            }
            if (cancelled) return;
            if (detected) {
                try { localStorage.setItem(STORAGE_KEY, detected); } catch (_) {}
                try { localStorage.setItem(SEEN_PICKER_KEY, "1"); } catch (_) {}
                setCountryState(detected);
                return;
            }
            if (!cancelled) {
                // Product rule: Saudi Arabia is the deterministic default when
                // location cannot be resolved. The user can still change it
                // manually from profile/settings at any time.
                try { localStorage.setItem(STORAGE_KEY, "SA"); } catch (_) {}
                try { localStorage.setItem(SEEN_PICKER_KEY, "1"); } catch (_) {}
                setCountryState("SA");
                setShowPicker(false);
            }
        })();
        return () => { cancelled = true; };
    }, [country]);

    const setCountry = useCallback(async (code, opts = {}) => {
        const c = (code || "").toUpperCase();
        try { localStorage.setItem(STORAGE_KEY, c); } catch (_) {}
        setCountryState(c);
        try { localStorage.setItem(SEEN_PICKER_KEY, "1"); } catch (_) {}
        // Sync to backend if logged in (best-effort)
        if (user && user !== false && !opts.skipServer) {
            try { await api.put("/users/me", { country_code: c }); } catch (_) {}
        }
    }, [user]);

    const dismissPicker = useCallback(() => {
        try { localStorage.setItem(SEEN_PICKER_KEY, "1"); } catch (_) {}
        setShowPicker(false);
    }, []);

    const openPicker = useCallback(() => setShowPicker(true), []);

    const current = COUNTRIES.find(c => c.code === country) || null;

    return (
        <Ctx.Provider value={{ country, setCountry, current, COUNTRIES, showPicker, dismissPicker, openPicker }}>
            {children}
        </Ctx.Provider>
    );
}

export const useCountry = () => useContext(Ctx) || { country: "", COUNTRIES, current: null, setCountry: () => {}, showPicker: false, dismissPicker: () => {}, openPicker: () => {} };
