import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { tr } from "@/contexts/I18nContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
    const nav = useNavigate();
    const { refresh } = useAuth();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const hash = window.location.hash || "";
        const m = hash.match(/session_id=([^&]+)/);
        const sid = m ? decodeURIComponent(m[1]) : null;
        if (!sid) {
            nav("/login", { replace: true });
            return;
        }

        (async () => {
            try {
                await api.post("/auth/google", { session_id: sid });
                await refresh();
                // Clean hash and route to home
                window.history.replaceState({}, "", window.location.pathname);
                nav("/", { replace: true });
            } catch (_) {
                nav("/login?error=google", { replace: true });
            }
        })();
    }, [nav, refresh]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]" dir="rtl">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin"></div>
                <p className="font-arabic font-bold text-[var(--text)]">{tr("جاري إتمام تسجيل الدخول...")}</p>
                <p className="font-arabic-body text-xs text-[var(--text-muted)] mt-1">{tr("لحظة واحدة من فضلك")}</p>
            </div>
        </div>
    );
}
