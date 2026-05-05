import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function XAuthCallback() {
    const nav = useNavigate();
    const [params] = useSearchParams();
    const { refresh } = useAuth();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;
        const code = params.get("code");
        const state = params.get("state");
        const err = params.get("error");
        if (err || !code || !state) {
            nav("/login?error=x", { replace: true });
            return;
        }
        (async () => {
            try {
                await api.post("/auth/x/callback", { code, state });
                await refresh();
                nav("/", { replace: true });
            } catch {
                nav("/login?error=x", { replace: true });
            }
        })();
    }, [params, nav, refresh]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]" dir="rtl">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin"></div>
                <p className="font-arabic font-bold text-[var(--text)]">جاري إتمام تسجيل الدخول بـ X...</p>
            </div>
        </div>
    );
}
