import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { Send, ChevronRight, MessageCircle, Image as ImageIcon, Mic, X, Square, MapPin, Video as VideoIcon, Languages } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import ImageViewer from "@/components/ImageViewer";

export default function ChatPage() {
    const { user, loading: au } = useAuth();
    const { t, lang, tr } = useI18n();
    const [searchParams] = useSearchParams();
    const initialTo = searchParams.get("to");
    const initialListing = searchParams.get("listing");
    const [convos, setConvos] = useState([]);
    const [activeConvoId, setActiveConvoId] = useState(null);
    const [activeOther, setActiveOther] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [translations, setTranslations] = useState({}); // {msgId: translatedText}
    const [translating, setTranslating] = useState(null); // msgId being translated
    const [imgPreview, setImgPreview] = useState(null);
    const endRef = useRef();

    // Hide BottomNav while a conversation is active (per user request — bottom-nav was overlapping input area)
    useEffect(() => {
        if (activeConvoId) {
            document.body.classList.add("chat-active");
        } else {
            document.body.classList.remove("chat-active");
        }
        return () => document.body.classList.remove("chat-active");
    }, [activeConvoId]);

    // Notification sound on incoming messages (subtle ping)
    const audioCtxRef = useRef(null);
    const playPing = () => {
        try {
            if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = audioCtxRef.current;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "sine";
            o.frequency.setValueAtTime(880, ctx.currentTime);
            o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18);
            g.gain.setValueAtTime(0.18, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
            o.connect(g); g.connect(ctx.destination);
            o.start(); o.stop(ctx.currentTime + 0.25);
        } catch (_) { /* silent */ }
    };

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
        let prevCount = 0;
        let firstLoad = true;
        const fetchMsgs = async () => {
            const { data } = await api.get(`/chat/messages/${activeConvoId}`);
            // Detect new incoming message → play subtle ping
            if (!firstLoad && data.length > prevCount) {
                const last = data[data.length - 1];
                if (last && last.sender_id !== user?.id) {
                    playPing();
                }
            }
            firstLoad = false;
            prevCount = data.length;
            setMessages(data);
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        };
        fetchMsgs();
        const id = setInterval(fetchMsgs, 4000);
        return () => clearInterval(id);
    }, [activeConvoId, user?.id]);

    const sendLocation = () => {
        if (!navigator.geolocation) { alert(tr("المتصفح لا يدعم تحديد الموقع")); return; }
        // Prompt: confirm deal status — location should only be shared when deal is finalized
        const confirmed = window.confirm(tr("📍 مشاركة الموقع\\n\\n") +
            "يفضّل مشاركة موقعك فقط بعد الاتفاق على الصفقة لحماية خصوصيتك.\n\n" +
            "هل تم الاتفاق على الصفقة وتريد مشاركة موقعك مع البائع/المشتري؟\n\n" +
            "اضغط OK للمتابعة، أو Cancel للإلغاء."
        );
        if (!confirmed) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                send({ text: `📍 موقعي - تمت الصفقة`, location: loc });
            },
            () => alert(tr("تعذر الوصول للموقع"))
        );
    };

    const startLiveShare = () => {}; // removed: live location share
    const stopLiveShare = () => {}; // removed

    const translateMsg = async (m) => {
        if (translations[m.id] || !m.text) return;
        setTranslating(m.id);
        try {
            const { data } = await api.post("/ai/translate", { text: m.text, target_lang: lang });
            setTranslations((tr) => ({ ...tr, [m.id]: data.text }));
        } catch (_) {
            alert(tr("تعذرت الترجمة"));
        } finally { setTranslating(null); }
    };

    const send = async (extra = {}) => {
        if (!activeOther) return;
        const text = (extra.text ?? input).trim();
        if (!text && !extra.image && !extra.voice && !extra.location) return;
        if (!extra.image && !extra.voice && !extra.location) setInput("");
        try {
            const { data: msg } = await api.post("/chat/send", {
                receiver_id: activeOther.id,
                listing_id: initialListing || null,
                text: text || null,
                image: extra.image || null,
                voice: extra.voice || null,
                location: extra.location || null,
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
        } catch (_) { alert(tr("فشل الرفع")); }
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
        } catch (_) { alert(tr("تعذر الوصول للميكروفون")); }
    };
    const stopRecord = () => { recorder?.stop(); setRecording(false); setRecorder(null); };

    const openConvo = (c) => {
        setActiveConvoId(c.id);
        setActiveOther(c.other);
    };

    if (au) return <div className="p-10 text-center font-arabic">{t("loading")}</div>;
    if (!user) return (
        <div className="p-10 text-center font-arabic">
            <p className="mb-4">{tr("يجب تسجيل الدخول لاستخدام الرسائل")}</p>
            <Link to="/login" className="bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-bold">{t("login")}</Link>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 h-[calc(100dvh-150px)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                {/* Conversations list */}
                <div className={`bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-y-auto ${activeConvoId ? "hidden md:block" : ""}`}>
                    <div className="p-4 border-b border-[var(--border)]">
                        <h2 className="font-arabic font-bold text-lg text-[var(--text)]">{tr("المحادثات")}</h2>
                    </div>
                    {convos.length === 0 ? (
                        <div className="p-8 text-center text-sm text-[var(--text-muted)] font-arabic-body">{tr("لا توجد محادثات بعد")}</div>
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
                                <p className="text-[var(--text-muted)] font-arabic-body">{tr("اختر محادثة لبدء المراسلة")}</p>
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
                                    const liveShare = m.location?.live_share_id;
                                    return (
                                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`} data-testid={`msg-${m.id}`}>
                                            <div className={`max-w-[75%] rounded-2xl ${m.image || m.voice ? "p-1" : "px-3 py-2"} text-sm font-arabic-body ${mine ? "bg-[var(--primary)] text-[var(--primary-fg)] rounded-br-md" : "bg-[var(--surface-elevated)] text-[var(--text)] rounded-bl-md border border-[var(--border)]"}`}>
                                                {m.image && <img src={m.image} alt="" onClick={() => setImgPreview(m.image)} className="rounded-xl max-w-full max-h-64 object-cover cursor-zoom-in" />}
                                                {m.voice && <audio controls src={m.voice} className="max-w-full" />}
                                                {m.location && !liveShare && (
                                                    <a href={`https://www.google.com/maps/search/?api=1&query=${m.location.lat},${m.location.lng}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 ${m.image || m.voice ? "p-2" : ""}`}>
                                                        <MapPin className="w-4 h-4" /> <span className="underline">{tr("عرض الموقع")}</span>
                                                    </a>
                                                )}
                                                {liveShare && (
                                                    <a href={`https://www.google.com/maps/search/?api=1&query=${m.location.lat},${m.location.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-red-500/15 rounded-lg border border-red-500/30">
                                                        <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                                                        <div>
                                                            <div className="font-bold text-red-500">{tr("موقع حي مباشر")}</div>
                                                            <div className="text-[10px] underline">{tr("عرض على الخريطة")}</div>
                                                        </div>
                                                    </a>
                                                )}
                                                {m.text && <div>{m.text}</div>}
                                                {translations[m.id] && (
                                                    <div className={`mt-1.5 pt-1.5 border-t ${mine ? "border-white/20" : "border-[var(--border)]"} text-[12px] italic flex items-start gap-1`}>
                                                        <Languages className="w-3 h-3 mt-0.5 shrink-0" /> {translations[m.id]}
                                                    </div>
                                                )}
                                                <div className={`text-[10px] mt-1 px-1 flex items-center gap-2 ${mine ? "text-[var(--primary-fg)]/60" : "text-[var(--text-muted)]"}`}>
                                                    <span>{new Date(m.ts).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}</span>
                                                    {m.text && !mine && !translations[m.id] && (
                                                        <button data-testid={`translate-btn-${m.id}`} onClick={() => translateMsg(m)} disabled={translating === m.id} className="hover:underline flex items-center gap-0.5 text-[10px] font-bold">
                                                            <Languages className="w-3 h-3" /> {translating === m.id ? "..." : "ترجم"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={endRef}></div>
                            </div>
                            <div className="p-3 border-t border-[var(--border)] flex items-center gap-1.5">
                                <label data-testid="chat-image-btn" className="cursor-pointer w-9 h-9 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/15 text-[var(--text-muted)] flex items-center justify-center shrink-0" title={tr("صورة")}>
                                    <ImageIcon className="w-4 h-4" />
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadAndSend(e.target.files[0], "image")} />
                                </label>
                                <button data-testid="chat-location-btn" onClick={sendLocation} className="w-9 h-9 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/15 text-[var(--text-muted)] flex items-center justify-center shrink-0" title={tr("مشاركة الموقع (بعد إتمام الصفقة)")}><MapPin className="w-4 h-4" /></button>
                                {recording ? (
                                    <button data-testid="chat-stop-rec" onClick={stopRecord} className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse shrink-0"><Square className="w-3 h-3 fill-current" /></button>
                                ) : (
                                    <button data-testid="chat-mic" onClick={startRecord} className="w-9 h-9 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/15 text-[var(--text-muted)] flex items-center justify-center shrink-0" title={tr("رسالة صوتية")}><Mic className="w-4 h-4" /></button>
                                )}
                                <input data-testid="chat-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={tr("اكتب رسالتك...")} className="flex-1 min-w-0 bg-[var(--surface-elevated)] rounded-full px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
                                <button data-testid="chat-send" onClick={() => send()} className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] flex items-center justify-center hover:bg-[var(--primary-hover)] shrink-0">
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {imgPreview && <ImageViewer images={[imgPreview]} initialIndex={0} onClose={() => setImgPreview(null)} />}
        </div>
    );
}
