import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, X, Loader2, Bot } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { tr } from "@/contexts/I18nContext";

const SESSION_KEY = "hp_ai_session_id";
const HIST_KEY = "hp_ai_history";

function getSessionId() {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
        sid = `s-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
        localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
}

export default function AIAssistantWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        try { return JSON.parse(localStorage.getItem(HIST_KEY) || "[]"); } catch { return []; }
    });
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const listRef = useRef(null);

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
            const { data } = await api.post("/ai/assistant", { message: text, session_id: getSessionId() });
            setMessages([...nextMsgs, { role: "assistant", text: data.reply || "" }]);
        } catch (e) {
            const errText = formatApiError(e.response?.data?.detail) || tr("تعذر الوصول للمساعد");
            setMessages([...nextMsgs, { role: "assistant", text: `⚠️ ${errText}` }]);
        } finally {
            setBusy(false);
        }
    };

    const reset = () => {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(HIST_KEY);
        setMessages([]);
    };

    return (
        <>
            {/* Floating button */}
            <button
                data-testid="ai-assistant-fab"
                onClick={() => setOpen(true)}
                aria-label={tr("المساعد الذكي")}
                className="fixed bottom-20 sm:bottom-6 start-4 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
                style={{ width: 52, height: 52 }}
            >
                <Sparkles className="w-6 h-6" />
                <span className="absolute -top-1 -end-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full font-arabic">AI</span>
            </button>

            {/* Panel */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4" onClick={() => setOpen(false)}>
                    <div data-testid="ai-assistant-panel" onClick={(e) => e.stopPropagation()} className="bg-[var(--surface)] rounded-t-3xl sm:rounded-3xl w-full max-w-md border border-[var(--border)] shadow-2xl flex flex-col max-h-[85vh]">
                        {/* Header */}
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

                        {/* Messages */}
                        <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[280px]">
                            {messages.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                    <Sparkles className="w-10 h-10 mx-auto text-[var(--primary)] mb-3 opacity-50" />
                                    <p className="font-arabic-body text-xs text-[var(--text-muted)] mb-4">{tr("اقتراحات سريعة:")}</p>
                                    <div className="flex flex-col gap-2">
                                        {[
                                            tr("كيف أنشر إعلاناً جديداً؟"),
                                            tr("ما متوسط سعر سيارة كامري 2020؟"),
                                            tr("هل البيع آمن؟ ما النصائح للحماية من الاحتيال؟"),
                                        ].map((s, i) => (
                                            <button key={i} data-testid={`ai-suggest-${i}`} onClick={() => setInput(s)} className="text-start bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 rounded-xl px-3 py-2 font-arabic-body text-xs text-[var(--text)] border border-[var(--border)]">
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`ai-msg-${m.role}-${i}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 font-arabic-body text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]"}`}>
                                            {m.text}
                                        </div>
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

                        {/* Input */}
                        <form onSubmit={send} className="p-3 border-t border-[var(--border)] flex items-center gap-2">
                            <input
                                data-testid="ai-input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={tr("اكتب رسالتك...")}
                                className="flex-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm font-arabic-body text-[var(--text)] outline-none focus:border-[var(--primary)]"
                                disabled={busy}
                            />
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
