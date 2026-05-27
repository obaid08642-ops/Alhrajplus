// Shared platform detection used by SmartAppBanner + DownloadPage.
// Returns one of: "ios" | "android" | "huawei" | "desktop" | "unknown".
//
// Huawei detection notes:
// - HMS / EMUI devices report "HMSCore" or "HuaweiBrowser" in UA.
// - Older Huawei devices still run Android UA — we treat them as Huawei ONLY
//   when an HMS marker is present, otherwise they remain "android".
export function detectPlatform() {
    if (typeof navigator === "undefined") return "unknown";
    const ua = (navigator.userAgent || navigator.vendor || "").toString();
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return "ios";
    if (/HMSCore|HuaweiBrowser|; HUAWEI|; HONOR/i.test(ua)) return "huawei";
    if (/android/i.test(ua)) return "android";
    return "desktop";
}

// Resolve the right store URL for the detected platform.
// Returns "" if the matching ENV variable is empty so callers can hide the
// CTA gracefully (no broken links).
export function storeUrlFor(platform) {
    const map = {
        ios: process.env.REACT_APP_APPSTORE_URL || "",
        android: process.env.REACT_APP_PLAYSTORE_URL || "",
        huawei: process.env.REACT_APP_APPGALLERY_URL || "",
        desktop: process.env.REACT_APP_LANDING_URL || "",
    };
    return map[platform] || "";
}

export const STORE_URLS = {
    appstore: process.env.REACT_APP_APPSTORE_URL || "",
    playstore: process.env.REACT_APP_PLAYSTORE_URL || "",
    appgallery: process.env.REACT_APP_APPGALLERY_URL || "",
    landing: process.env.REACT_APP_LANDING_URL || "",
};
