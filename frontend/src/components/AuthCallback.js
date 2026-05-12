import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { tr } from "@/contexts/I18nContext";
import { tokenStore } from "@/lib/api";

/**
 * OAuth callback handler.
 *
 * Backend's Google callback redirects here with tokens in the URL fragment:
 *   /auth/callback#access_token=...&refresh_token=...&login=google
 *
 * We:
 *   1. Read the fragment (never sent to server)
 *   2. Save tokens to localStorage (works in browsers that block 3rd-party cookies)
 *   3. Replace URL with clean /  (so refresh button doesn't re-trigger)
 *   4. Trigger AuthContext refresh to load the user
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

        // Extract tokens from URL fragment
        let saved = false;
        try {
            const hash = (window.location.hash || "").replace(/^#/, "");
            if (hash) {
                const params = new URLSearchParams(hash);
                const at = params.get("access_token");
                const rt = params.get("refresh_token");
                if (at) {
                    tokenStore.save({ access_token: at, refresh_token: rt || undefined });
                    saved = true;
                }
            }
            // Clean the URL — remove fragment and query
            window.history.replaceState({}, "", "/");
        } catch (_) {}

        (async () => {
            try {
                await refresh();
                nav("/", { replace: true });
            } catch (_) {
                if (saved) {
                    // Tokens saved but /me failed — likely cold-start. Stay home; UI will retry.
                    nav("/", { replace: true });
                } else {
                    nav("/login?error=session", { replace: true });
                }
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
