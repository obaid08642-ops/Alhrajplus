import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { tr } from "@/contexts/I18nContext";

/**
 * Direct Google OAuth callback handler.
 *
 * The new flow is fully server-side: Google → /api/auth/google/callback → cookies set →
 * 302 redirect to FRONTEND_URL/?login=google. This page only runs if a browser hits
 * /auth/callback for any reason (legacy bookmark, manual URL, etc.) and simply refreshes
 * the auth context then routes home.
 */
export default function AuthCallback() {
    const nav = useNavigate();
    const { refresh } = useAuth();
    const [searchParams] = useSearchParams();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const error = searchParams.get("error");
        if (error) {
            nav(`/login?error=${encodeURIComponent(error)}`, { replace: true });
            return;
        }

        (async () => {
            try {
                await refresh();
                nav("/", { replace: true });
            } catch (_) {
                nav("/login?error=session", { replace: true });
            }
        })();
    }, [nav, refresh, searchParams]);

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
