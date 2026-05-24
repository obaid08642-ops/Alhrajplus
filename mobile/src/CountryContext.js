// CountryContext (mobile) — matches web /app/frontend/src/contexts/CountryContext.js.
// Stores chosen country (SA/AE/KW/etc.) + auto-loads /meta/countries from backend.
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

const STORAGE_KEY = "hp_country";

const Ctx = createContext(null);

export function CountryProvider({ children }) {
    const [country, setCountryState] = useState("");
    const [countries, setCountries] = useState([]);

    useEffect(() => {
        (async () => {
            const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
            if (stored) setCountryState(stored);
            try {
                const { data } = await api.get("/meta/countries");
                setCountries(data || []);
                // First-time default = first country (SA)
                if (!stored && data?.[0]?.code) {
                    setCountryState(data[0].code);
                    AsyncStorage.setItem(STORAGE_KEY, data[0].code).catch(() => {});
                }
            } catch (_) {}
        })();
    }, []);

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
