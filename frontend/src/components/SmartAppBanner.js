import { X, Smartphone, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { tr } from "@/contexts/I18nContext";

/**
 * Smart App Banner — Shows on mobile web users only.
 * - Sticky bar above TopBar suggesting to install the mobile app.
 * - Dismissable (stored in localStorage, reappears after 7 days).
 * - Detects iOS/Android via user-agent and shows relevant store link.
 */
const APP_STORE_URL = "https://apps.apple.com/app/haraj-plus";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.harajplus.app";
const STORAGE_KEY = "hp_app_banner_dismissed";
const SNOOZE_DAYS = 7;

function getPlatform() {
    if (typeof navigator === "undefined") return "unknown";
    const ua = navigator.userAgent || navigator.vendor || "";
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return "ios";
    if (/android/i.test(ua)) return "android";
    return "desktop";
}

export default function SmartAppBanner() {
    const [visible, setVisible] = useState(false);
    const [platform, setPlatform] = useState("unknown");

    useEffect(() => {
        const p = getPlatform();
        setPlatform(p);
        if (p === "desktop" || p === "unknown") return;
        const dismissedAt = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
        if (!dismissedAt || Date.now() - dismissedAt > SNOOZE_DAYS * 86400000) {
            setVisible(true);
        }
    }, []);

    const dismiss = (e) => {
        e?.stopPropagation();
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        setVisible(false);
    };

    if (!visible) return null;
    const storeUrl = platform === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
    const storeLabel = platform === "ios" ? tr("تحميل من App Store") : tr("تحميل من Google Play");

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
                <a href={storeUrl} target="_blank" rel="noopener noreferrer" data-testid="app-banner-download" className="shrink-0 bg-white text-[#1F7BBF] font-bold text-[11px] sm:text-xs rounded-full px-3 py-1.5 flex items-center gap-1.5 hover:scale-105 transition-transform shadow">
                    <Download className="w-3.5 h-3.5" /> {storeLabel}
                </a>
                <button data-testid="app-banner-dismiss" onClick={dismiss} aria-label={tr("إغلاق")} className="shrink-0 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
