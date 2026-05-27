import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "@/lib/api";
import {
    Send, ChevronRight, MessageCircle, Image as ImageIcon, Mic, X, Square,
    MapPin, Languages, Check, CheckCheck, ChevronDown, Radio, Reply,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import ImageViewer from "@/components/ImageViewer";
import { useChatSocket } from "@/lib/useChatSocket";
import { playNotificationSound } from "@/lib/notificationSound";
import "@/styles/chat.css";

/** Format a timestamp into "اليوم"، "أمس"، or "DD/MM/YYYY". */
function dateLabel(iso) {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "اليوم";
    if (d.toDateString() === yesterday.toDateString()) return "أمس";
    return d.toLocaleDateString("ar", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function formatLastSeen(iso) {
    if (!iso) return "";
    const t = new Date(iso);
    const diff = (Date.now() - t.getTime()) / 60000;
    if (diff < 1) return "قبل لحظات";
    if (diff < 60) return `قبل ${Math.floor(diff)} د`;
    if (diff < 1440) return `قبل ${Math.floor(diff / 60)} س`;
    return t.toLocaleDateString("ar");
}

/** Single message bubble — memoised so list updates don't rerender history. */
const Bubble = ({ m, mine, firstOfRun, onReply, onImageClick, onTranslate, translation, isTranslating }) => {
    const liveShare = m.location?.live_share_id;
    // Swipe-to-reply touch handler — simple horizontal drag detection
    const startX = useRef(null);
    const onTouchStart = (e) => { startX.current = e.touches[0]?.clientX ?? null; };
    const onTouchMove = (e) => {
        if (startX.current == null) return;
        const dx = e.touches[0].clientX - startX.current;
        // Only react to the "natural reply direction" (RTL: swipe left ≈ -dx, LTR: swipe right ≈ dx).
        const isRTL = document.dir === "rtl";
        const triggered = isRTL ? dx < -60 : dx > 60;
        if (triggered) {
            onReply?.(m);
            startX.current = null;
        }
    };
    const onTouchEnd = () => { startX.current = null; };

    return (
        <div
            data-testid={`msg-${m.id}`}
            className={`hp-bubble ${mine ? "mine" : "theirs"} ${firstOfRun ? "first-of-run" : ""} ${m.pending ? "pending" : ""} ${m.failed ? "failed" : ""}`}
            onDoubleClick={() => onReply?.(m)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {m.reply_to && (
                <div className="reply-quote">
                    <div className="font-bold text-[11px]">{m.reply_to.sender_name || (mine ? tr("أنت") : tr("الطرف الآخر"))}</div>
                    <div className="line-clamp-2">{m.reply_to.text || (m.reply_to.image ? "📷 صورة" : "🎙️ صوت")}</div>
                </div>
            )}
            {m.image && <img src={m.image} alt="" onClick={() => onImageClick(m.image)} className="rounded-lg max-w-full max-h-64 object-cover cursor-zoom-in" />}
            {m.voice && <audio controls src={m.voice} className="max-w-full mt-1" />}
            {m.location && !liveShare && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${m.location.lat},${m.location.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
                    <MapPin className="w-4 h-4" /> {tr("عرض الموقع")}
                </a>
            )}
            {liveShare && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${m.location.lat},${m.location.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-1 bg-red-500/15 rounded-md border border-red-500/30">
                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                    <div>
                        <div className="font-bold text-red-500 text-xs">{tr("موقع حي مباشر")}</div>
                    </div>
                </a>
            )}
            {m.text && <span className="whitespace-pre-wrap">{m.text}</span>}
            {translation && (
                <div className="mt-1 pt-1 border-t border-black/10 text-[12px] italic flex gap-1">
                    <Languages className="w-3 h-3 mt-0.5" /> {translation}
                </div>
            )}
            <span className="meta">
                {m.text && !mine && !translation && (
                    <button onClick={() => onTranslate(m)} disabled={isTranslating} className="hover:underline">
                        <Languages className="inline w-3 h-3" /> {isTranslating ? "..." : tr("ترجم")}
                    </button>
                )}
                <span>{new Date(m.ts).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}</span>
                {mine && (
                    m.failed ? <span className="text-red-500 font-bold" title={tr("فشل الإرسال")}>!</span>
                    : m.pending ? <Check className="w-3 h-3 opacity-60" />
                    : m.read_at ? <CheckCheck className="w-3 h-3" style={{ color: "#3b82f6" }} />
                    : m.delivered ? <CheckCheck className="w-3 h-3 opacity-80" />
                    : <Check className="w-3 h-3 opacity-80" />
                )}
            </span>
        </div>
    );
};

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
    const [translations, setTranslations] = useState({});
    const [translating, setTranslating] = useState(null);
    const [imgPreview, setImgPreview] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [peerTyping, setPeerTyping] = useState(false);
    const [presence, setPresence] = useState({}); // {user_id: {online, last_seen}}
    const [recording, setRecording] = useState(false);
    const recorderRef = useRef(null);
    // Listing context card — fetched once when the chat opens with ?listing=<id>.
    // Acts as a persistent reference at the top of the thread so buyer + seller
    // both know which ad they're discussing (sellers often have many ads).
    const [listingCtx, setListingCtx] = useState(null);
    useEffect(() => {
        if (!initialListing) { setListingCtx(null); return; }
        api.get(`/listings/${initialListing}`).then(({ data }) => setListingCtx(data)).catch(() => setListingCtx(null));
    }, [initialListing]);

    // Whenever the active conversation changes, look for a listing reference
    // inside its messages and pin that listing as the sticky context card —
    // so the link stays visible across reloads and after switching chats.
    useEffect(() => {
        if (!activeConvoId) return;
        if (initialListing) return; // explicit deep-link wins
        const withListing = (messages || []).find((m) => m.listing_id || m.listing?.id);
        const lid = withListing?.listing_id || withListing?.listing?.id;
        if (!lid) return;
        // Avoid refetch if we already have the right listing pinned
        if (listingCtx && (listingCtx.id === lid || listingCtx.slug === lid)) return;
        api.get(`/listings/${lid}`).then(({ data }) => setListingCtx(data)).catch(() => {});
    }, [activeConvoId, messages, initialListing, listingCtx]);

    // ----------- Auto-send "listing card" first message -----------
    // When the user opens the chat from a listing detail page (?to=<seller>&listing=<id>)
    // and the conversation has NO prior message referencing this listing,
    // send a templated intro message so both buyer and seller have a clear
    // anchor of which ad is being discussed. Runs exactly once per (convo,listing).
    const autoSentRef = useRef(new Set());
    useEffect(() => {
        if (!user || !activeConvoId || !activeOther?.id) return;
        if (!initialListing || !listingCtx) return;
        const key = `${activeConvoId}::${initialListing}`;
        if (autoSentRef.current.has(key)) return;
        // If any existing message already references this listing, skip — we
        // don't want to spam on every page reload.
        const alreadyRefs = (messages || []).some((m) => m.listing_id === initialListing);
        if (alreadyRefs) { autoSentRef.current.add(key); return; }
        // Only auto-send for buyers (current user is NOT the listing owner).
        if (listingCtx.user_id && listingCtx.user_id === user.id) { autoSentRef.current.add(key); return; }
        autoSentRef.current.add(key);
        const origin = (typeof window !== "undefined" && window.location?.origin) || "";
        const text = `📌 ${tr("استفسار عن")}: ${listingCtx.title}\n${origin}/listing/${listingCtx.id}`;
        api.post("/chat/send", {
            receiver_id: activeOther.id,
            listing_id: initialListing,
            text,
        }).catch(() => { /* WS broadcast or next reload will reconcile */ });
    }, [user, activeConvoId, activeOther?.id, initialListing, listingCtx, messages, tr]);

    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const isAtBottomRef = useRef(true);
    // True only for the very first render after opening a thread — used to do
    // a one-time scroll-to-bottom and then NEVER force a scroll again unless
    // the user is the sender of the new message.
    const initialLoadRef = useRef(true);
    const [showScrollDown, setShowScrollDown] = useState(false);
    const typingDebounce = useRef(null);

    // Single WS connection
    const { send: wsSend, connected, subscribe } = useChatSocket();

    // ----------- Scrolling helpers -----------
    const handleScroll = () => {
        const el = scrollRef.current; if (!el) return;
        const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
        const near = dist < 80;
        isAtBottomRef.current = near;
        setShowScrollDown(!near && el.scrollHeight > el.clientHeight + 200);
        // Load older when scrolled near the top.
        if (el.scrollTop < 80) {
            const prevHeight = el.scrollHeight;
            loadOlderMessages?.()?.then?.(() => {
                // Preserve visual position after older messages prepend.
                requestAnimationFrame(() => {
                    const next = scrollRef.current;
                    if (next) next.scrollTop = next.scrollHeight - prevHeight;
                });
            });
        }
    };
    const scrollToBottom = useCallback((smooth = true) => {
        const el = scrollRef.current; if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
        isAtBottomRef.current = true;
        setShowScrollDown(false);
    }, []);

    // ----------- Hide BottomNav on active convo (mobile) -----------
    useEffect(() => {
        if (activeConvoId) document.body.classList.add("chat-active");
        else document.body.classList.remove("chat-active");
        return () => document.body.classList.remove("chat-active");
    }, [activeConvoId]);

    // ----------- iOS keyboard-safe height -----------
    // Reads window.visualViewport.height (shrinks when the on-screen keyboard
    // opens) and writes it to --hp-vh so the fixed chat shell stays clamped
    // to the visible area — no input hidden behind the keyboard or Safari
    // bottom toolbar.
    useEffect(() => {
        if (!activeConvoId) return;
        const setVh = () => {
            const h = window.visualViewport?.height || window.innerHeight;
            document.documentElement.style.setProperty("--hp-vh", `${h}px`);
        };
        setVh();
        const vv = window.visualViewport;
        if (vv) {
            vv.addEventListener("resize", setVh);
            vv.addEventListener("scroll", setVh);
        }
        window.addEventListener("resize", setVh);
        return () => {
            if (vv) {
                vv.removeEventListener("resize", setVh);
                vv.removeEventListener("scroll", setVh);
            }
            window.removeEventListener("resize", setVh);
            document.documentElement.style.removeProperty("--hp-vh");
        };
    }, [activeConvoId]);

    // ----------- Notification ping + vibration -----------
    // Signature Harajplus sound — see /lib/notificationSound.js
    const playPing = () => { playNotificationSound(); };

    // ----------- Load conversations -----------
    useEffect(() => {
        if (!user) return;
        api.get("/chat/conversations").then(({ data }) => {
            setConvos(data);
            if (initialTo) {
                const cid = [user.id, initialTo].sort().join("_");
                setActiveConvoId(cid);
                const found = data.find((c) => c.id === cid);
                if (found) setActiveOther(found.other);
                else setActiveOther({ id: initialTo, name: tr("البائع") });
            }
        }).catch(() => {});
    }, [user, initialTo, tr]);

    // ----------- Load messages once when convo opens -----------
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    useEffect(() => {
        if (!activeConvoId) return;
        let cancelled = false;
        setHasMoreMessages(true);
        // `initial` flag tells the auto-scroll guard "we just opened this thread,
        // it's OK to jump to the latest message ONCE". Subsequent loads must
        // preserve whatever position the user has scrolled to.
        initialLoadRef.current = true;
        api.get(`/chat/messages/${activeConvoId}`).then(({ data }) => {
            if (cancelled) return;
            setMessages(data);
            // One-time jump to latest message when the thread first opens.
            // After this, the user controls the scroll completely — no more
            // forced scrolls from incoming messages, image loads, or keyboard.
            requestAnimationFrame(() => {
                const el = scrollRef.current;
                if (el) { el.scrollTop = el.scrollHeight; }
                initialLoadRef.current = false;
            });
            setTimeout(() => inputRef.current?.focus(), 80);
            wsSend({ type: "read", convo_id: activeConvoId });
        }).catch(() => {});
        return () => { cancelled = true; };
    }, [activeConvoId, wsSend]);

    // Load older messages (cursor pagination) when user scrolls to the top
    const loadOlderMessages = useCallback(async () => {
        if (!activeConvoId || loadingOlder || !hasMoreMessages || messages.length === 0) return;
        const oldest = messages[0]?.ts;
        if (!oldest) return;
        setLoadingOlder(true);
        try {
            const { data } = await api.get(`/chat/messages/${activeConvoId}`, { params: { before: oldest, limit: 50 } });
            const older = data?.messages || [];
            if (older.length === 0) setHasMoreMessages(false);
            else setMessages((prev) => [...older, ...prev]);
            if (!data?.has_more) setHasMoreMessages(false);
        } catch (_) { setHasMoreMessages(false); }
        finally { setLoadingOlder(false); }
    }, [activeConvoId, loadingOlder, hasMoreMessages, messages]);

    // ----------- Fetch presence of active peer -----------
    useEffect(() => {
        if (!activeOther?.id) return;
        api.get(`/chat/presence/${activeOther.id}`).then(({ data }) => {
            setPresence((p) => ({ ...p, [activeOther.id]: data }));
        }).catch(() => {});
    }, [activeOther?.id]);

    // ----------- WS event subscriptions -----------
    useEffect(() => {
        if (!user) return;
        const offs = [];

        offs.push(subscribe("message", (ev) => {
            const m = ev.data;
            if (!m) return;
            // Belongs to current convo?
            if (m.convo_id === activeConvoId) {
                setMessages((prev) => {
                    // Replace any optimistic tmp with the same text+ts within 5s
                    const idx = prev.findIndex((x) => String(x.id).startsWith("tmp_") && x.sender_id === m.sender_id && x.text === m.text);
                    if (idx >= 0) {
                        const next = prev.slice();
                        next[idx] = m;
                        return next;
                    }
                    // Avoid duplicates
                    if (prev.some((x) => x.id === m.id)) return prev;
                    return [...prev, m];
                });
                if (m.sender_id !== user.id) {
                    playPing();
                    // Immediately mark conversation as read since we're viewing it
                    wsSend({ type: "read", convo_id: activeConvoId });
                }
                // Only auto-scroll when the USER sent the message. Never force-
                // scroll for incoming messages — let the user read in peace.
                if (m.sender_id === user.id) {
                    setTimeout(() => scrollToBottom(true), 20);
                }
            } else {
                // Update conversations list with new last message
                setConvos((cs) => {
                    const idx = cs.findIndex((c) => c.id === m.convo_id);
                    const others = idx >= 0 ? cs.filter((_, i) => i !== idx) : cs;
                    const base = idx >= 0 ? cs[idx] : { id: m.convo_id, other: { id: m.sender_id, name: m.sender?.name || tr("مستخدم") }, unread: 0 };
                    return [{ ...base, last_message: m.text || "[وسائط]", last_ts: m.ts, unread: (base.unread || 0) + (m.sender_id !== user.id ? 1 : 0) }, ...others];
                });
            }
        }));

        offs.push(subscribe("typing", (ev) => {
            if (activeOther && ev.from === activeOther.id) setPeerTyping(!!ev.is_typing);
        }));

        offs.push(subscribe("presence", (ev) => {
            setPresence((p) => ({ ...p, [ev.user_id]: { online: ev.online, last_seen: ev.last_seen } }));
        }));

        offs.push(subscribe("delivered", (ev) => {
            setMessages((prev) => prev.map((m) => m.id === ev.message_id ? { ...m, delivered: true } : m));
        }));

        offs.push(subscribe("read", (ev) => {
            if (ev.convo_id === activeConvoId) {
                setMessages((prev) => prev.map((m) => m.sender_id === user.id ? { ...m, read_at: ev.ts || new Date().toISOString() } : m));
            }
        }));

        return () => offs.forEach((off) => off());
    }, [user, subscribe, activeConvoId, activeOther, scrollToBottom, wsSend, tr]);

    // ----------- Send message -----------
    const send = async (extra = {}) => {
        if (!activeOther) return;
        const text = (extra.text ?? input).trim();
        if (!text && !extra.image && !extra.voice && !extra.location) return;
        if (!extra.image && !extra.voice && !extra.location) setInput("");
        if (inputRef.current) inputRef.current.style.height = "auto";

        const replySnapshot = replyTo ? {
            id: replyTo.id, text: replyTo.text, image: replyTo.image,
            sender_name: replyTo.sender_id === user.id ? tr("أنت") : (activeOther?.name || tr("الطرف الآخر")),
        } : null;
        setReplyTo(null);

        const tmpId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const optimistic = {
            id: tmpId, sender_id: user.id, receiver_id: activeOther.id,
            text: text || null, image: extra.image || null, voice: extra.voice || null,
            location: extra.location || null, reply_to: replySnapshot,
            ts: new Date().toISOString(), pending: true,
        };
        setMessages((m) => [...m, optimistic]);
        isAtBottomRef.current = true;
        setTimeout(() => scrollToBottom(true), 20);
        setTimeout(() => inputRef.current?.focus(), 30);

        try {
            const { data: msg } = await api.post("/chat/send", {
                receiver_id: activeOther.id,
                listing_id: initialListing || null,
                text: text || null,
                image: extra.image || null,
                voice: extra.voice || null,
                location: extra.location || null,
                reply_to: replySnapshot,
            });
            setMessages((m) => m.map((x) => x.id === tmpId ? msg : x));
            setActiveConvoId(msg.convo_id);
        } catch (_) {
            setMessages((m) => m.map((x) => x.id === tmpId ? { ...x, pending: false, failed: true } : x));
        }
    };

    // ----------- Typing notify (debounced) -----------
    const notifyTyping = useCallback((isTyping) => {
        if (!activeOther?.id) return;
        wsSend({ type: "typing", to: activeOther.id, is_typing: isTyping });
    }, [activeOther?.id, wsSend]);

    const onInputChange = (e) => {
        setInput(e.target.value);
        // Auto-grow
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
        // Throttle typing event — fire "typing=true" once, schedule "false" after 2s idle
        notifyTyping(true);
        if (typingDebounce.current) clearTimeout(typingDebounce.current);
        typingDebounce.current = setTimeout(() => notifyTyping(false), 2000);
    };

    // ----------- Media (image/voice/location) -----------
    const uploadAndSend = async (file, type) => {
        try {
            const { data: sig } = await api.get("/cloudinary/signature", { params: { resource_type: type === "voice" ? "video" : "image", folder: "chat" } });
            const fd = new FormData();
            fd.append("file", file); fd.append("api_key", sig.api_key);
            fd.append("timestamp", sig.timestamp); fd.append("signature", sig.signature);
            fd.append("folder", sig.folder);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/${type === "voice" ? "video" : "image"}/upload`, { method: "POST", body: fd });
            const out = await res.json();
            if (out.secure_url) {
                if (type === "voice") send({ voice: out.secure_url });
                else send({ image: out.secure_url });
            }
        } catch (_) { alert(tr("فشل الرفع")); }
    };
    const sendLocation = () => {
        if (!navigator.geolocation) { alert(tr("المتصفح لا يدعم تحديد الموقع")); return; }
        if (!window.confirm(tr("شارك موقعك فقط بعد الاتفاق على الصفقة. هل تريد المتابعة؟"))) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => send({ text: "📍 موقعي", location: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
            () => alert(tr("تعذر الوصول للموقع"))
        );
    };
    const startRecord = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream); const chunks = [];
            mr.ondataavailable = (e) => chunks.push(e.data);
            mr.onstop = async () => {
                const blob = new Blob(chunks, { type: "audio/webm" });
                const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
                await uploadAndSend(file, "voice");
                stream.getTracks().forEach((t) => t.stop());
            };
            mr.start(); recorderRef.current = mr; setRecording(true);
        } catch (_) { alert(tr("تعذر الوصول للميكروفون")); }
    };
    const stopRecord = () => { recorderRef.current?.stop(); recorderRef.current = null; setRecording(false); };

    const translateMsg = async (m) => {
        if (translations[m.id] || !m.text) return;
        setTranslating(m.id);
        try {
            const { data } = await api.post("/ai/translate", { text: m.text, target_lang: lang });
            setTranslations((tr2) => ({ ...tr2, [m.id]: data.text }));
        } catch (_) { alert(tr("تعذرت الترجمة")); }
        finally { setTranslating(null); }
    };

    // ----------- Memoised render list with date separators + grouping -----------
    const rendered = useMemo(() => {
        const out = [];
        let lastDate = "";
        let lastSender = null;
        let lastTs = 0;
        for (const m of messages) {
            const dlabel = dateLabel(m.ts);
            if (dlabel !== lastDate) {
                out.push({ kind: "date", id: `d_${dlabel}_${m.id}`, label: dlabel });
                lastDate = dlabel; lastSender = null;
            }
            const ts = new Date(m.ts).getTime();
            const firstOfRun = !lastSender || lastSender !== m.sender_id || (ts - lastTs) > 60_000;
            out.push({ kind: "msg", id: m.id, m, firstOfRun });
            lastSender = m.sender_id; lastTs = ts;
        }
        return out;
    }, [messages]);

    const peerPresence = activeOther ? presence[activeOther.id] : null;

    if (au) return <div className="p-10 text-center font-arabic">{t("loading")}</div>;
    if (!user) return (
        <div className="p-10 text-center font-arabic">
            <p className="mb-4">{tr("يجب تسجيل الدخول لاستخدام الرسائل")}</p>
            <Link to="/login" className="bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-bold">{t("login")}</Link>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto md:px-4 md:py-4 md:pb-24">
            <div className="md:grid md:grid-cols-3 md:gap-4 md:h-[calc(100dvh-150px)]">
                {/* Conversations list */}
                <div className={`bg-[var(--surface)] md:rounded-2xl md:border md:border-[var(--border)] md:overflow-y-auto ${activeConvoId ? "hidden md:block" : ""}`}>
                    <div className="p-4 border-b border-[var(--border)] sticky top-0 bg-[var(--surface)] z-10">
                        <div className="flex items-center gap-2">
                            <h2 className="font-arabic font-bold text-lg text-[var(--text)] flex-1">{tr("المحادثات")}</h2>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${connected ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"}`}>
                                {connected ? "● live" : "○ متصل عبر..."}
                            </span>
                        </div>
                    </div>
                    {convos.length === 0 ? (
                        <div className="p-8 text-center text-sm text-[var(--text-muted)] font-arabic-body">{tr("لا توجد محادثات بعد")}</div>
                    ) : (
                        convos.map((c) => (
                            <button key={c.id} data-testid={`convo-${c.id}`} onClick={() => { setActiveConvoId(c.id); setActiveOther(c.other); }} className={`w-full p-3 flex items-center gap-3 hover:bg-[var(--surface-elevated)] border-b border-[var(--border)] text-start ${activeConvoId === c.id ? "bg-[var(--primary)]/10" : ""}`}>
                                <div className="relative w-11 h-11 shrink-0">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-[var(--primary-fg)] flex items-center justify-center font-bold font-arabic">{c.other?.name?.[0] || "U"}</div>
                                    {presence[c.other?.id]?.online && <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--surface)]"></span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-arabic font-bold text-sm text-[var(--text)] truncate">{c.other?.name || "محادثة"}</div>
                                    <div className="text-xs text-[var(--text-muted)] font-arabic-body truncate">{c.last_message}</div>
                                </div>
                                {c.unread > 0 && <span className="bg-[var(--danger)] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{c.unread}</span>}
                            </button>
                        ))
                    )}
                </div>

                {/* Active chat — full-height shell so input bar stays fixed */}
                <div className={`md:col-span-2 ${activeConvoId ? "" : "hidden md:flex"} md:flex md:flex-col md:bg-[var(--surface)] md:rounded-2xl md:border md:border-[var(--border)] md:overflow-hidden`}>
                    {!activeOther ? (
                        <div className="flex-1 flex items-center justify-center text-center p-8">
                            <div>
                                <MessageCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                                <p className="text-[var(--text-muted)] font-arabic-body">{tr("اختر محادثة لبدء المراسلة")}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="hp-chat-shell">
                            {/* Header */}
                            <div className="flex items-center gap-3 p-3 border-b border-[var(--border)] bg-[var(--surface)]" data-testid="chat-header">
                                <button onClick={() => { setActiveConvoId(null); setActiveOther(null); }} className="text-[var(--text-muted)] hover:text-[var(--primary)] md:hidden" aria-label="رجوع"><ChevronRight className="w-5 h-5 rtl:rotate-180" /></button>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-[var(--primary-fg)] flex items-center justify-center font-bold font-arabic text-sm shadow">{activeOther.name?.[0]}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-arabic font-bold text-sm text-[var(--text)] truncate">{activeOther.name}</div>
                                    <div className="text-[11px] text-[var(--text-muted)] font-arabic-body" data-testid="presence-status">
                                        {peerTyping ? <span className="text-emerald-500">{tr("يكتب الآن...")}</span>
                                          : peerPresence?.online ? <span className="text-emerald-500">● {tr("متصل الآن")}</span>
                                          : peerPresence?.last_seen ? `${tr("آخر ظهور")} ${formatLastSeen(peerPresence.last_seen)}`
                                          : ""}
                                    </div>
                                </div>
                            </div>

                            {/* Listing context card — shown when chat was opened from a listing */}
                            {listingCtx && (
                                <Link to={`/listing/${listingCtx.slug || listingCtx.id}`} className="hp-chat-listing-card" data-testid="chat-listing-context" onClick={(e) => e.stopPropagation()}>
                                    {listingCtx.images?.[0] && (
                                        <img src={listingCtx.images[0]} alt="" loading="lazy" />
                                    )}
                                    <div className="hp-chat-listing-card-body">
                                        <div className="hp-chat-listing-card-label">{tr("بخصوص الإعلان")}</div>
                                        <div className="hp-chat-listing-card-title">{listingCtx.title}</div>
                                        {listingCtx.price != null && (
                                            <div className="hp-chat-listing-card-price">
                                                {Number(listingCtx.price).toLocaleString()} {listingCtx.currency_code || listingCtx.currency || ""}
                                            </div>
                                        )}
                                    </div>
                                    <ChevronRight className="w-4 h-4 hp-chat-listing-card-arrow" />
                                </Link>
                            )}

                            {/* Messages */}
                            <div ref={scrollRef} onScroll={handleScroll} className="hp-chat-messages flex flex-col p-2 sm:p-3 relative" data-testid="chat-messages">
                                {rendered.map((row) => row.kind === "date" ? (
                                    <div key={row.id} className="hp-chat-date">{row.label}</div>
                                ) : (
                                    <Bubble
                                        key={row.id} m={row.m} mine={row.m.sender_id === user.id} firstOfRun={row.firstOfRun}
                                        onReply={setReplyTo} onImageClick={setImgPreview}
                                        onTranslate={translateMsg} translation={translations[row.m.id]} isTranslating={translating === row.m.id}
                                    />
                                ))}
                                {peerTyping && (
                                    <div className="hp-bubble theirs first-of-run">
                                        <div className="hp-typing"><span></span><span></span><span></span></div>
                                    </div>
                                )}
                                {showScrollDown && (
                                    <button data-testid="chat-scroll-down" onClick={() => scrollToBottom(true)} className="hp-scroll-down" aria-label={tr("النزول")}>
                                        <ChevronDown className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Reply preview */}
                            {replyTo && (
                                <div className="hp-reply-banner" data-testid="reply-banner">
                                    <Reply className="w-4 h-4 text-[var(--primary)] shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-[var(--text)] truncate">{replyTo.sender_id === user.id ? tr("أنت") : activeOther.name}</div>
                                        <div className="text-[var(--text-muted)] truncate">{replyTo.text || (replyTo.image ? "📷 صورة" : "🎙️ صوت")}</div>
                                    </div>
                                    <button onClick={() => setReplyTo(null)} className="w-6 h-6 rounded-full hover:bg-[var(--surface)] flex items-center justify-center" aria-label="إلغاء"><X className="w-3.5 h-3.5" /></button>
                                </div>
                            )}

                            {/* Input bar — flex-0 inside shell so it ALWAYS sits at the bottom */}
                            <div className="hp-chat-input-bar">
                                <label data-testid="chat-image-btn" className="cursor-pointer w-9 h-9 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/15 text-[var(--text-muted)] flex items-center justify-center shrink-0">
                                    <ImageIcon className="w-4 h-4" />
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadAndSend(e.target.files[0], "image")} />
                                </label>
                                <button data-testid="chat-location-btn" onClick={sendLocation} className="w-9 h-9 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/15 text-[var(--text-muted)] flex items-center justify-center shrink-0"><MapPin className="w-4 h-4" /></button>
                                {recording ? (
                                    <button data-testid="chat-stop-rec" onClick={stopRecord} className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse shrink-0"><Square className="w-3 h-3 fill-current" /></button>
                                ) : (
                                    <button data-testid="chat-mic" onClick={startRecord} className="w-9 h-9 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/15 text-[var(--text-muted)] flex items-center justify-center shrink-0"><Mic className="w-4 h-4" /></button>
                                )}
                                <textarea
                                    ref={inputRef} data-testid="chat-input"
                                    value={input}
                                    onChange={onInputChange}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault(); send();
                                            notifyTyping(false);
                                        }
                                    }}
                                    rows={1} placeholder={tr("اكتب رسالتك...")}
                                />
                                <button data-testid="chat-send" onClick={() => { send(); notifyTyping(false); }} className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] flex items-center justify-center hover:bg-[var(--primary-hover)] shrink-0 active:scale-95 transition-transform">
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {imgPreview && <ImageViewer images={[imgPreview]} initialIndex={0} onClose={() => setImgPreview(null)} />}
        </div>
    );
}
