import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { Send, ChevronRight, MessageCircle, Image as ImageIcon, Mic, X, Square } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";

export default function ChatPage() {
    const { user, loading: au } = useAuth();
    const { t } = useI18n();
    const [searchParams] = useSearchParams();
    const initialTo = searchParams.get("to");
    const initialListing = searchParams.get("listing");
    const [convos, setConvos] = useState([]);
    const [activeConvoId, setActiveConvoId] = useState(null);
    const [activeOther, setActiveOther] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const endRef = useRef();

    useEffect(() => {
        const load = async () => {
            const { data } = await api.get("/chat/conversations");
            setConvos(data);
            if (initialTo && user) {
                const cid = [user.id, initialTo].sort().join("_");
                setActiveConvoId(cid);
                const found = data.find((c) => c.id === cid);
                if (found) {
                    setActiveOther(found.other);
                } else {
                    const ru = await api.get(`/auth/me`).catch(() => null);
                    setActiveOther({ id: initialTo, name: "البائع" });
                }
            }
        };
        if (user) load();
    }, [user, initialTo]);

    useEffect(() => {
        if (!activeConvoId) return;
        const fetchMsgs = async () => {
            const { data } = await api.get(`/chat/messages/${activeConvoId}`);
            setMessages(data);
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        };
        fetchMsgs();
        const id = setInterval(fetchMsgs, 4000);
        return () => clearInterval(id);
    }, [activeConvoId]);

    const send = async (extra = {}) => {
        if (!activeOther) return;
        const text = (extra.text ?? input).trim();
        if (!text && !extra.image && !extra.voice) return;
        if (!extra.image && !extra.voice) setInput("");
        try {
            const { data: msg } = await api.post("/chat/send", {
                receiver_id: activeOther.id,
                listing_id: initialListing || null,
                text: extra.image || extra.voice ? null : text,
                image: extra.image || null,
                voice: extra.voice || null,
            });
            setMessages((m) => [...m, msg]);
            setActiveConvoId(msg.convo_id);
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } catch (_) {}
    };

    const uploadAndSend = async (file, type) => {
        try {
            const { data: sig } = await api.get("/cloudinary/signature", { params: { resource_type: type === "voice" ? "video" : "image", folder: "chat" } });
            const fd = new FormData();
            fd.append("file", file);
            fd.append("api_key", sig.api_key);
            fd.append("timestamp", sig.timestamp);
            fd.append("signature", sig.signature);
            fd.append("folder", sig.folder);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/${type === "voice" ? "video" : "image"}/upload`, { method: "POST", body: fd });
            const out = await res.json();
            if (out.secure_url) {
                if (type === "voice") send({ voice: out.secure_url });
                else send({ image: out.secure_url });
            }
        } catch (_) { alert("فشل الرفع"); }
    };

    const [recording, setRecording] = useState(false);
    const [recorder, setRecorder] = useState(null);

    const startRecord = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream);
            const chunks = [];
            mr.ondataavailable = (e) => chunks.push(e.data);
            mr.onstop = async () => {
                const blob = new Blob(chunks, { type: "audio/webm" });
                const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
                await uploadAndSend(file, "voice");
                stream.getTracks().forEach((t) => t.stop());
            };
            mr.start();
            setRecorder(mr);
            setRecording(true);
        } catch (_) { alert("تعذر الوصول للميكروفون"); }
    };
    const stopRecord = () => { recorder?.stop(); setRecording(false); setRecorder(null); };

    const openConvo = (c) => {
        setActiveConvoId(c.id);
        setActiveOther(c.other);
    };

    if (au) return <div className="p-10 text-center font-arabic">{t("loading")}</div>;
    if (!user) return (
        <div className="p-10 text-center font-arabic">
            <p className="mb-4">يجب تسجيل الدخول لاستخدام الرسائل</p>
            <Link to="/login" className="bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-bold">{t("login")}</Link>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 h-[calc(100vh-130px)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                {/* Conversations list */}
                <div className={`bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-y-auto ${activeConvoId ? "hidden md:block" : ""}`}>
                    <div className="p-4 border-b border-[var(--border)]">
                        <h2 className="font-arabic font-bold text-lg text-[var(--text)]">المحادثات</h2>
                    </div>
                    {convos.length === 0 ? (
                        <div className="p-8 text-center text-sm text-[var(--text-muted)] font-arabic-body">لا توجد محادثات بعد</div>
                    ) : (
                        convos.map((c) => (
                            <button key={c.id} data-testid={`convo-${c.id}`} onClick={() => openConvo(c)} className={`w-full p-3 flex items-center gap-3 hover:bg-[var(--surface-elevated)] border-b border-[var(--border)] text-start ${activeConvoId === c.id ? "bg-[var(--primary)]/10" : ""}`}>
                                <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] flex items-center justify-center font-bold font-arabic">{c.other?.name?.[0] || "U"}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-arabic font-bold text-sm text-[var(--text)] truncate">{c.other?.name || "محادثة"}</div>
                                    <div className="text-xs text-[var(--text-muted)] font-arabic-body truncate">{c.last_message}</div>
                                </div>
                                {c.unread > 0 && <span className="bg-[var(--danger)] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{c.unread}</span>}
                            </button>
                        ))
                    )}
                </div>

                {/* Active chat */}
                <div className={`md:col-span-2 bg-[var(--surface)] rounded-2xl border border-[var(--border)] flex flex-col ${!activeConvoId ? "hidden md:flex" : ""}`}>
                    {!activeOther ? (
                        <div className="flex-1 flex items-center justify-center text-center p-8">
                            <div>
                                <MessageCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                                <p className="text-[var(--text-muted)] font-arabic-body">اختر محادثة لبدء المراسلة</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="p-3 border-b border-[var(--border)] flex items-center gap-3">
                                <button onClick={() => { setActiveConvoId(null); setActiveOther(null); }} className="md:hidden text-[var(--text-muted)]"><ChevronRight className="w-5 h-5" /></button>
                                <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] flex items-center justify-center font-bold font-arabic text-sm">{activeOther.name?.[0]}</div>
                                <div className="flex-1">
                                    <div className="font-arabic font-bold text-sm text-[var(--text)]">{activeOther.name}</div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
                                {messages.map((m) => {
                                    const mine = m.sender_id === user.id;
                                    return (
                                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`} data-testid={`msg-${m.id}`}>
                                            <div className={`max-w-[75%] rounded-2xl ${m.image || m.voice ? "p-1" : "px-3 py-2"} text-sm font-arabic-body ${mine ? "bg-[var(--primary)] text-[var(--primary-fg)] rounded-br-md" : "bg-[var(--surface-elevated)] text-[var(--text)] rounded-bl-md border border-[var(--border)]"}`}>
                                                {m.image && <img src={m.image} alt="" className="rounded-xl max-w-full max-h-64 object-cover" />}
                                                {m.voice && <audio controls src={m.voice} className="max-w-full" />}
                                                {m.text}
                                                <div className={`text-[10px] mt-1 px-1 ${mine ? "text-[var(--primary-fg)]/60" : "text-[var(--text-muted)]"}`}>{new Date(m.ts).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={endRef}></div>
                            </div>
                            <div className="p-3 border-t border-[var(--border)] flex items-center gap-2">
                                <label data-testid="chat-image-btn" className="cursor-pointer w-9 h-9 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/15 text-[var(--text-muted)] flex items-center justify-center">
                                    <ImageIcon className="w-4 h-4" />
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadAndSend(e.target.files[0], "image")} />
                                </label>
                                {recording ? (
                                    <button data-testid="chat-stop-rec" onClick={stopRecord} className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse"><Square className="w-3 h-3 fill-current" /></button>
                                ) : (
                                    <button data-testid="chat-mic" onClick={startRecord} className="w-9 h-9 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/15 text-[var(--text-muted)] flex items-center justify-center"><Mic className="w-4 h-4" /></button>
                                )}
                                <input data-testid="chat-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="اكتب رسالتك..." className="flex-1 bg-[var(--surface-elevated)] rounded-full px-4 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
                                <button data-testid="chat-send" onClick={() => send()} className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] flex items-center justify-center hover:bg-[var(--primary-hover)]">
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
