// CountryContext (mobile) — matches web /app/frontend/src/contexts/CountryContext.js.
// STRICT country isolation: the country chosen at signup ALWAYS wins over IP detect.
// The selected country is also injected into every API call by the axios interceptor.
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

const STORAGE_KEY = "hp_country";
const Ctx = createContext(null);

export function CountryProvider({ children }) {
    const [country, setCountryState] = useState("");
    const [countries, setCountries] = useState([]);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        (async () => {
            // 1) Restore from storage if any (highest priority).
            const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
            // 2) Load country list.
            let list = [];
            try { const r = await api.get("/meta/countries"); list = r?.data || []; } catch (_) {}
            setCountries(list);
            // 3) If we have a stored value, use it. The user's signup choice
            //    (saved by AuthContext on login) is already here, so we DO NOT
            //    fall back to IP detect in that case.
            if (stored) {
                setCountryState(stored);
                setHydrated(true);
                return;
            }
            // 4) First install: try the user's profile country (after login),
            //    then IP detect, finally default to SA.
            let cc = "";
            try {
                const me = await api.get("/users/me");
                cc = (me?.data?.country_code || "").toUpperCase();
            } catch (_) {}
            if (!cc) {
                try {
                    const det = await api.get("/geo/detect-country");
                    cc = (det?.data?.country || "").toUpperCase();
                } catch (_) {}
            }
            if (!cc) cc = list?.[0]?.code || "SA";
            setCountryState(cc);
            await AsyncStorage.setItem(STORAGE_KEY, cc).catch(() => {});
            setHydrated(true);
        })();
    }, []);

    // When the auth profile loads and the user has a country_code that differs
    // from the locally stored one, prefer the user's CHOICE at signup. This
    // fixes the issue where someone registers as EG but the app shows SA.
    useEffect(() => {
        if (!hydrated) return;
        let cancelled = false;
        (async () => {
            try {
                const { data: me } = await api.get("/users/me");
                if (cancelled) return;
                const fromUser = (me?.country_code || "").toUpperCase();
                if (!fromUser || fromUser.length !== 2) return;
                if (fromUser !== country) {
                    setCountryState(fromUser);
                    await AsyncStorage.setItem(STORAGE_KEY, fromUser).catch(() => {});
                }
            } catch (_) {}
        })();
        return () => { cancelled = true; };
    }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

    const setCountry = useCallback(async (code) => {
        const c = (code || "").toUpperCase();
        setCountryState(c);
        await AsyncStorage.setItem(STORAGE_KEY, c).catch(() => {});
        try { await api.put("/users/me", { country_code: c }); } catch (_) {}
    }, []);

    const current = countries.find((c) => c.code === country) || null;

    return (
        <Ctx.Provider value={{ country, setCountry, current, countries }}>
            {children}
        </Ctx.Provider>
    );
}

export const useCountry = () => useContext(Ctx) || { country: "", current: null, countries: [], setCountry: () => {} };
