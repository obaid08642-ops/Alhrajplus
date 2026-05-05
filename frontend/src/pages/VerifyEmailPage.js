import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function VerifyEmailPage() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const [state, setState] = useState("loading"); // loading | ok | err
    const [msg, setMsg] = useState("");

    useEffect(() => {
        if (!token) { setState("err"); setMsg("رابط غير صالح"); return; }
        api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
            .then(({ data }) => { setState("ok"); setMsg(data.message || "تم التأكيد"); })
            .catch((e) => { setState("err"); setMsg(e.response?.data?.detail || "تعذر تأكيد البريد"); });
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 py-10">
            <div className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 sm:p-10 shadow-2xl text-center">
                {state === "loading" && (
                    <>
                        <Loader2 className="w-16 h-16 text-[var(--primary)] mx-auto mb-4 animate-spin" />
                        <p className="font-arabic font-bold text-[var(--text)]">جاري تأكيد بريدك الإلكتروني...</p>
                    </>
                )}
                {state === "ok" && (
                    <>
                        <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
                        <h1 className="font-arabic font-black text-2xl text-[var(--text)] mb-2">تم تأكيد البريد ✅</h1>
                        <p className="font-arabic-body text-sm text-[var(--text-muted)] mb-6">{msg}</p>
                        <Link to="/" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-2.5 rounded-full font-arabic font-bold text-sm">الذهاب للرئيسية</Link>
                    </>
                )}
                {state === "err" && (
                    <>
                        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                        <h1 className="font-arabic font-black text-2xl text-[var(--text)] mb-2">رابط غير صالح</h1>
                        <p className="font-arabic-body text-sm text-[var(--text-muted)] mb-6">{msg}</p>
                        <Link to="/login" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-2.5 rounded-full font-arabic font-bold text-sm">العودة لتسجيل الدخول</Link>
                    </>
                )}
            </div>
        </div>
    );
}
