import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { tr } from "@/contexts/I18nContext";
import { tokenStore } from "@/lib/api";

/**
 * OAuth callback handler.
 *
 * Backend (Google/X/Snapchat) redirects here with tokens in the URL fragment:
 *   /auth/callback#access_token=...&refresh_token=...&login=google
 *
 * Steps:
 *   1. Capture tokens from window.location.hash IMMEDIATELY (before React Router rewrites)
 *   2. Save them to localStorage via tokenStore
 *   3. Trigger auth refresh
 *   4. Redirect to home OR show visible error
 */

// Eager capture: run as soon as this module loads (BEFORE React renders).
// React Router preserves the hash, but we want zero latency between page arrival
// and token persistence — especially since browser-back can reload the route.
(function captureTokensEarly() {
    try {
        if (typeof window === "undefined") return;
        const raw = (window.location.hash || "").replace(/^#/, "");
        if (!raw) return;
        const p = new URLSearchParams(raw);
        const at = p.get("access_token");
        const rt = p.get("refresh_token");
        if (at) {
            try {
                localStorage.setItem("hp_access", at);
                if (rt) localStorage.setItem("hp_refresh", rt);
            } catch (_) {}
        }
    } catch (_) {}
})();

export default function AuthCallback() {
    const nav = useNavigate();
    const { refresh } = useAuth();
    const [searchParams] = useSearchParams();
    const processed = useRef(false);
    const [status, setStatus] = useState("loading"); // loading | error
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        // 1. Check for explicit error from backend
        const queryError = searchParams.get("error");
        const hashRaw = (window.location.hash || "").replace(/^#/, "");
        const hashParams = new URLSearchParams(hashRaw);
        const hashError = hashParams.get("error");

        if (queryError || hashError) {
            setErrorMsg(queryError || hashError || "unknown");
            setStatus("error");
            return;
        }

        // 2. Re-capture tokens (in case the early IIFE missed due to timing)
        const at = hashParams.get("access_token");
        const rt = hashParams.get("refresh_token");
        if (at) {
            tokenStore.save({ access_token: at, refresh_token: rt || undefined });
        } else if (!localStorage.getItem("hp_access")) {
            // No tokens anywhere — backend redirected without them
            setErrorMsg("no_tokens");
            setStatus("error");
            return;
        }

        // 3. Clean URL — strip hash and query so refresh button doesn't re-trigger
        try {
            window.history.replaceState({}, "", "/");
        } catch (_) {}

        // 4. Fetch user profile to confirm token works, then redirect
        (async () => {
            try {
                await refresh();
                // Small delay so the user sees the success state briefly
                setTimeout(() => nav("/", { replace: true }), 250);
            } catch (e) {
                // Tokens saved but /me failed — could be cold start.
                // Still navigate home; AuthContext will retry there.
                console.warn("[AuthCallback] /auth/me failed, navigating home anyway:", e?.message || e);
                nav("/", { replace: true });
            }
        })();
    }, [nav, refresh, searchParams]);

    if (status === "error") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4" dir="rtl" data-testid="auth-callback-error">
                <div className="max-w-md w-full text-center bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6">
                    <div className="text-5xl mb-3">⚠️</div>
                    <h1 className="font-arabic font-bold text-xl text-[var(--text)] mb-2">
                        {tr("تعذر إتمام تسجيل الدخول")}
                    </h1>
                    <p className="font-arabic-body text-sm text-[var(--text-muted)] mb-4">
                        {errorMsg === "no_tokens"
                            ? tr("لم نستلم رمز الدخول من الخادم")
                            : errorMsg === "invalid_state"
                            ? tr("انتهت صلاحية جلسة الدخول. حاول مرة أخرى.")
                            : errorMsg === "banned"
                            ? tr("هذا الحساب محظور")
                            : `${tr("سبب الخطأ")}: ${errorMsg}`}
                    </p>
                    <button
                        onClick={() => nav("/login", { replace: true })}
                        data-testid="auth-callback-retry"
                        className="w-full py-3 rounded-2xl bg-[var(--primary)] text-white font-bold font-arabic"
                    >
                        {tr("العودة لتسجيل الدخول")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]" dir="rtl" data-testid="auth-callback-loading">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin"></div>
                <p className="font-arabic font-bold text-[var(--text)]">{tr("جاري إتمام تسجيل الدخول...")}</p>
                <p className="font-arabic-body text-xs text-[var(--text-muted)] mt-1">{tr("لحظة واحدة من فضلك")}</p>
            </div>
        </div>
    );
}
