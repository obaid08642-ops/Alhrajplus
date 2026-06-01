import { X, Smartphone, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { tr } from "@/contexts/I18nContext";
import { detectPlatform, storeUrlFor } from "@/lib/platform";

/**
 * Smart App Banner — shown above the TopBar.
 * Platform → URL mapping:
 *   • iOS      → REACT_APP_APPSTORE_URL
 *   • Android  → REACT_APP_PLAYSTORE_URL
 *   • Huawei   → REACT_APP_APPGALLERY_URL
 *   • Desktop  → REACT_APP_LANDING_URL
 * If the env var for the detected platform is empty, the banner hides itself.
 * Dismiss persists in localStorage for 7 days.
 */
const STORAGE_KEY = "hp_app_banner_dismissed";
const SNOOZE_DAYS = 7;

export default function SmartAppBanner() {
    const [visible, setVisible] = useState(false);
    const [platform, setPlatform] = useState("unknown");

    useEffect(() => {
        const ua = navigator.userAgent || "";
        // Hide inside the actual native app (Expo ships a UA token).
        if (/HarajPlusApp|Expo/i.test(ua)) return;
        setPlatform(detectPlatform());
        const dismissedAt = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
        const stillSnoozed = dismissedAt && Date.now() - dismissedAt < SNOOZE_DAYS * 86400000;
        if (stillSnoozed) return;
        setVisible(true);
    }, []);

    const dismiss = (e) => {
        e?.stopPropagation();
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        setVisible(false);
    };

    // Try the universal deep-link first; if the app isn't installed we fall
    // back to the configured store URL after 1.2s. This mirrors the "Open
    // in App" buttons Twitter/Reddit show on shared links.
    const openApp = (e) => {
        e?.stopPropagation();
        const storeUrl = storeUrlFor(platform);
        const path = window.location.pathname + window.location.search;
        const deepLink = `harajplus:/${path}`;
        const start = Date.now();
        // eslint-disable-next-line no-undef
        window.location.href = deepLink;
        setTimeout(() => {
            // If the page is still visible (i.e. the app didn't take focus),
            // bounce the user to the store.
            if (document.visibilityState === "visible" && storeUrl) {
                window.location.href = storeUrl;
            }
            localStorage.setItem(STORAGE_KEY, String(start));
        }, 1200);
    };

    const storeUrl = storeUrlFor(platform);
    // Show banner even without a store URL — primary action is still "Open in App"
    // (deep-link try). Hide only on dismiss or non-mobile platforms.
    if (!visible || platform === "desktop" || platform === "unknown") return null;

    const ctaLabel =
        platform === "ios" ? tr("افتح في التطبيق")
            : platform === "android" ? tr("افتح في التطبيق")
                : platform === "huawei" ? tr("افتح في التطبيق")
                    : tr("اعرف المزيد");

    return (
        <div data-testid="smart-app-banner" className="relative bg-gradient-to-r from-[#4FB6E6] via-[#3AA9DD] to-[#2196D9] text-white shadow-md">
            <div className="max-w-7xl mx-auto flex items-center gap-2 px-3 py-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-arabic font-bold text-[12px] sm:text-sm truncate">{tr("تطبيق الحراج بلس — أسرع وأفضل 🚀")}</div>
                    <div className="font-arabic-body text-[10px] sm:text-xs text-white/85 truncate">{tr("إشعارات فورية، بحث أسرع، وتجربة متكاملة على جوالك")}</div>
                </div>
                <button onClick={openApp} data-testid="app-banner-open" className="shrink-0 bg-white text-[#1F7BBF] font-bold text-[11px] sm:text-xs rounded-full px-3 py-1.5 flex items-center gap-1.5 hover:scale-105 transition-transform shadow">
                    <Download className="w-3.5 h-3.5" /> {ctaLabel}
                </button>
                {storeUrl && (
                    <a href={storeUrl} target="_blank" rel="noopener noreferrer" data-testid="app-banner-store" onClick={dismiss} className="hidden sm:inline shrink-0 underline text-white/90 text-[11px]">
                        {tr("تثبيت")}
                    </a>
                )}
                <button data-testid="app-banner-dismiss" onClick={dismiss} aria-label={tr("إغلاق")} className="shrink-0 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
