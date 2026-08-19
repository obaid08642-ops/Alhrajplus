import { useEffect, useState } from "react";
import { getFeatureFlags } from "./api";

export const DEFAULT_FEATURE_FLAGS = Object.freeze({
  image_search: true,
  voice_search: true,
  pwa_install: true,
  premium_navigation: true,
});

export function useFeatureFlags() {
  const [flags, setFlags] = useState(DEFAULT_FEATURE_FLAGS);

  useEffect(() => {
    let active = true;
    getFeatureFlags()
      .then((payload) => {
        if (active && payload?.flags && typeof payload.flags === "object") {
          setFlags({ ...DEFAULT_FEATURE_FLAGS, ...payload.flags });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return flags;
}
