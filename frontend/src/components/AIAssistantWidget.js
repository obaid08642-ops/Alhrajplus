import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles, Send, X, Loader2, Bot } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useI18n, tr } from "@/contexts/I18nContext";

const SESSION_KEY = "hp_ai_session_id";
const HIST_KEY = "hp_ai_history";
const POS_KEY = "hp_ai_fab_pos";          // {x, y}
const HIDDEN_KEY = "hp_ai_fab_hidden";    // "1" => user dismissed FAB

function getSessionId() {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
        sid = `s-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
        localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
}

// Read initial FAB position. Defaults to bottom-end corner.
function loadInitialPos() {
    try {
        const saved = JSON.parse(localStorage.getItem(POS_KEY) || "null");
        if (saved && typeof saved.x === "number" && typeof saved.y === "number") return saved;
    } catch { /* noop */ }
    const w = typeof window !== "undefined" ? window.innerWidth : 360;
    const h = typeof window !== "undefined" ? window.innerHeight : 640;
    return { x: w - 70, y: h - 160 };
}

export default function AIAssistantWidget() {
    useI18n();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        try { return JSON.parse(localStorage.getItem(HIST_KEY) || "[]"); } catch { return []; }
    });
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const listRef = useRef(null);

    // Sync open state -> body class so global UI (BottomNav, floating "+") can
    // hide themselves while the AI panel is on top.
    useEffect(() => {
        if (typeof document === "undefined") return;
        if (open) document.body.classList.add("ai-panel-open");
        else document.body.classList.remove("ai-panel-open");
        return () => document.body.classList.remove("ai-panel-open");
    }, [open]);

    // Hidden flag: user clicked ×. Restored on next visit unless they unhide it
    // from the profile page (only place the FAB can re-appear after dismiss).
    const [hidden, setHidden] = useState(() => localStorage.getItem(HIDDEN_KEY) === "1");
    useEffect(() => {
        try { localStorage.setItem(HIDDEN_KEY, hidden ? "1" : "0"); } catch { /* noop */ }
    }, [hidden]);

    // After dismiss, the FAB ONLY renders on profile/settings pages so the user
    // can bring it back. Listen to location changes (the AuthContext etc.).
    const isProfilePage = (() => {
        const p = location.pathname || "";
        return p.startsWith("/profile") || p.startsWith("/settings") || p.startsWith("/account");
    })();

    // ----- Smooth dragging via refs + transform (no React state during drag) -----
    const wrapRef = useRef(null);
    const posRef = useRef(loadInitialPos());
    const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0, moved: false });

    const clampPos = (x, y) => {
        const w = window.innerWidth, h = window.innerHeight;
        const SIZE = 56;
        return {
            x: Math.max(6, Math.min(x, w - SIZE - 6)),
            y: Math.max(70, Math.min(y, h - SIZE - 90)),
        };
    };

    // Apply position directly to DOM via transform for 60fps performance.
    const applyTransform = useCallback(() => {
        const el = wrapRef.current;
        if (!el) return;
        const { x, y } = posRef.current;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }, []);

    useEffect(() => { applyTransform(); }, [applyTransform, hidden, isProfilePage]);

    // Re-clamp on viewport resize so the FAB never gets stuck off-screen.
    useEffect(() => {
        const onResize = () => {
            posRef.current = clampPos(posRef.current.x, posRef.current.y);
            applyTransform();
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [applyTransform]);

    const onPointerDown = (e) => {
        if (e.target.closest("[data-fab-close]")) return; // ignore close button presses
        e.preventDefault();
        const t = e.touches ? e.touches[0] : e;
        dragRef.current = {
            active: true, moved: false,
            startX: t.clientX, startY: t.clientY,
            originX: posRef.current.x, originY: posRef.current.y,
        };
        if (e.currentTarget.setPointerCapture && e.pointerId !== undefined) {
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
        }
    };

    const onPointerMove = (e) => {
        if (!dragRef.current.active) return;
        const t = e.touches ? e.touches[0] : e;
        const dx = t.clientX - dragRef.current.startX;
        const dy = t.clientY - dragRef.current.startY;
        if (!dragRef.current.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
            dragRef.current.moved = true;
        }
        posRef.current = clampPos(dragRef.current.originX + dx, dragRef.current.originY + dy);
        applyTransform();
    };

    const onPointerUp = () => {
        if (!dragRef.current.active) return;
        const moved = dragRef.current.moved;
        dragRef.current.active = false;
        if (moved) {
            try { localStorage.setItem(POS_KEY, JSON.stringify(posRef.current)); } catch { /* noop */ }
            // Snap to nearest side (UX nicety).
            const w = window.innerWidth;
            const snapped = clampPos(posRef.current.x < w / 2 ? 12 : w - 56 - 12, posRef.current.y);
            posRef.current = snapped;
            applyTransform();
            try { localStorage.setItem(POS_KEY, JSON.stringify(snapped)); } catch { /* noop */ }
        } else {
            setOpen(true);
        }
    };

    useEffect(() => {
        try { localStorage.setItem(HIST_KEY, JSON.stringify(messages.slice(-30))); } catch { /* noop */ }
        if (open && listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages, open]);

    const send = async (e) => {
        e?.preventDefault?.();
        const text = input.trim();
        if (!text || busy) return;
        setInput("");
        const nextMsgs = [...messages, { role: "user", text }];
        setMessages(nextMsgs);
        setBusy(true);
        try {
            const lang = (typeof localStorage !== "undefined" && localStorage.getItem("hp_lang")) || "ar";
            const { data } = await api.post("/ai/assistant", { message: text, session_id: getSessionId(), lang });
            setMessages([...nextMsgs, { role: "assistant", text: data.reply || "" }]);
        } catch (e) {
            const errText = formatApiError(e.response?.data?.detail) || tr("تعذر الوصول للمساعد");
            setMessages([...nextMsgs, { role: "assistant", text: `⚠️ ${errText}` }]);
        } finally { setBusy(false); }
    };

    const reset = () => {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(HIST_KEY);
        setMessages([]);
    };

    // When hidden everywhere: render a small "إعادة إظهار المساعد" button
    // ONLY on the profile/settings page so the user has a way back.
    if (hidden) {
        if (!isProfilePage) return null;
        return (
            <button
                data-testid="ai-fab-restore"
                onClick={() => setHidden(false)}
                className="fixed bottom-24 end-4 z-40 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 font-arabic font-bold text-sm hover:scale-105 transition-transform"
            >
                <Sparkles className="w-4 h-4" /> {tr("إظهار المساعد الذكي")}
            </button>
        );
    }

    return (
        <>
            {/* Draggable FAB — smooth (transform-based, no React state per frame) */}
            <div
                ref={wrapRef}
                data-testid="ai-assistant-fab-wrap"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                style={{
                    position: "fixed", top: 0, left: 0,
                    width: 56, height: 56, zIndex: 40,
                    touchAction: "none", willChange: "transform",
                    transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`,
                }}
            >
                <button
                    data-testid="ai-assistant-fab"
                    aria-label={tr("المساعد الذكي")}
                    className="w-full h-full rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing relative"
                >
                    <Sparkles className="w-6 h-6 pointer-events-none" />
                    <span className="absolute -bottom-1 -end-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none">AI</span>
                </button>

                {/* CLOSE × button — large hitbox, stops drag, hides FAB everywhere */}
                <button
                    data-fab-close
                    data-testid="ai-assistant-close-fab"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); setHidden(true); }}
                    aria-label={tr("إخفاء المساعد")}
                    title={tr("إخفاء — يمكن إعادته من البروفايل")}
                    className="absolute -top-2 -start-2 w-6 h-6 rounded-full bg-white dark:bg-[var(--surface)] border border-[var(--border)] text-red-500 flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10"
                >
                    <X className="w-3.5 h-3.5" strokeWidth={3} />
                </button>
            </div>

            {/* Panel */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4" onClick={() => setOpen(false)}>
                    <div data-testid="ai-assistant-panel" onClick={(e) => e.stopPropagation()} className="bg-[var(--surface)] rounded-t-3xl sm:rounded-3xl w-full max-w-md border border-[var(--border)] shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-arabic font-bold text-sm text-[var(--text)]">{tr("المساعد الذكي")}</div>
                                <div className="font-arabic-body text-[10px] text-[var(--text-muted)]">{tr("اسألني عن أي شيء في الحراج بلس")}</div>
                            </div>
                            {messages.length > 0 && (
                                <button data-testid="ai-reset-btn" onClick={reset} className="text-[10px] font-arabic-body text-[var(--text-muted)] hover:text-[var(--text)] px-2 py-1 rounded-md">{tr("جلسة جديدة")}</button>
                            )}
                            <button data-testid="ai-close-btn" onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--text-muted)]"><X className="w-4 h-4" /></button>
                        </div>

                        <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[280px]">
                            {messages.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                    <Sparkles className="w-10 h-10 mx-auto text-[var(--primary)] mb-3 opacity-50" />
                                    <p className="font-arabic-body text-xs text-[var(--text-muted)] mb-4">{tr("اقتراحات سريعة:")}</p>
                                    <div className="flex flex-col gap-2">
                                        {[tr("كيف أنشر إعلاناً جديداً؟"), tr("ما متوسط سعر سيارة كامري 2020؟"), tr("هل البيع آمن؟ ما النصائح للحماية من الاحتيال؟")].map((s, i) => (
                                            <button key={i} data-testid={`ai-suggest-${i}`} onClick={() => setInput(s)} className="text-start bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 rounded-xl px-3 py-2 font-arabic-body text-xs text-[var(--text)] border border-[var(--border)]">{s}</button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`ai-msg-${m.role}-${i}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 font-arabic-body text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]"}`}>{m.text}</div>
                                    </div>
                                ))
                            )}
                            {busy && (
                                <div className="flex justify-start" data-testid="ai-typing">
                                    <div className="bg-[var(--surface-elevated)] rounded-2xl px-4 py-2.5 border border-[var(--border)] flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={send} className="p-3 border-t border-[var(--border)] flex items-center gap-2">
                            <input data-testid="ai-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={tr("اكتب رسالتك...")} className="flex-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm font-arabic-body text-[var(--text)] outline-none focus:border-[var(--primary)]" disabled={busy} />
                            <button data-testid="ai-send" type="submit" disabled={busy || !input.trim()} className="w-10 h-10 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] flex items-center justify-center disabled:opacity-50">
                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
