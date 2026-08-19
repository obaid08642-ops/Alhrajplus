import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getFeatureFlags } from "@/lib/api";

export const DEFAULT_FEATURE_FLAGS = Object.freeze({
    image_search: true,
    voice_search: true,
    pwa_install: true,
    premium_navigation: true,
});

const FeatureFlagsContext = createContext({ flags: DEFAULT_FEATURE_FLAGS, ready: false });

export function FeatureFlagsProvider({ children }) {
    const [flags, setFlags] = useState(DEFAULT_FEATURE_FLAGS);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let active = true;
        getFeatureFlags()
            .then((payload) => {
                if (active && payload?.flags && typeof payload.flags === "object") {
                    setFlags({ ...DEFAULT_FEATURE_FLAGS, ...payload.flags });
                }
            })
            .catch(() => {})
            .finally(() => { if (active) setReady(true); });
        return () => { active = false; };
    }, []);

    const value = useMemo(() => ({ flags, ready }), [flags, ready]);
    return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlag(name) {
    const { flags } = useContext(FeatureFlagsContext);
    return flags[name] !== false;
}

export function useFeatureFlags() {
    return useContext(FeatureFlagsContext);
}
