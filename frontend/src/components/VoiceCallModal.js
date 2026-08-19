import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, UserRound } from "lucide-react";
import { tr } from "@/contexts/I18nContext";
import api from "@/lib/api";

const DEFAULT_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

function makeCallId() {
    return `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function VoiceCallModal({ socket, convoId, other, user, start = false, onStarted, onActiveChange }) {
    const [call, setCall] = useState(null);
    const [status, setStatus] = useState("idle");
    const [muted, setMuted] = useState(false);
    const [error, setError] = useState("");
    const [elapsed, setElapsed] = useState(0);
    const pcRef = useRef(null);
    const streamRef = useRef(null);
    const audioRef = useRef(null);
    const pendingOfferRef = useRef(null);
    const pendingIceRef = useRef([]);
    const iceServersRef = useRef(DEFAULT_ICE_SERVERS);
    const ringContextRef = useRef(null);
    const ringTimerRef = useRef(null);

    const stopRing = useCallback(() => {
        if (ringTimerRef.current) clearInterval(ringTimerRef.current);
        ringTimerRef.current = null;
        try { ringContextRef.current?.close?.(); } catch (_) {}
        ringContextRef.current = null;
    }, []);

    const startRing = useCallback(() => {
        if (ringTimerRef.current || typeof window === "undefined") return;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        try {
            const context = new Ctx();
            ringContextRef.current = context;
            const tone = () => {
                if (context.state === "closed") return;
                [0, 0.32].forEach((offset) => {
                    const oscillator = context.createOscillator();
                    const gain = context.createGain();
                    oscillator.frequency.value = 440;
                    gain.gain.setValueAtTime(0.0001, context.currentTime + offset);
                    gain.gain.exponentialRampToValueAtTime(0.07, context.currentTime + offset + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + offset + 0.24);
                    oscillator.connect(gain).connect(context.destination);
                    oscillator.start(context.currentTime + offset);
                    oscillator.stop(context.currentTime + offset + 0.27);
                });
            };
            tone();
            ringTimerRef.current = setInterval(tone, 2200);
        } catch (_) { stopRing(); }
    }, [stopRing]);

    const cleanup = useCallback((notify = false) => {
        if (notify && call?.call_id && call?.peer_id) {
            socket?.send({ type: "call_hangup", to: call.peer_id, convo_id: call.convo_id, call_id: call.call_id });
        }
        try { pcRef.current?.close(); } catch (_) {}
        pcRef.current = null;
        streamRef.current?.getTracks?.().forEach((track) => track.stop());
        streamRef.current = null;
        pendingOfferRef.current = null;
        pendingIceRef.current = [];
        setCall(null);
        setStatus("idle");
        setMuted(false);
        setError("");
        setElapsed(0);
        stopRing();
        onActiveChange?.(false);
    }, [call, onActiveChange, socket, stopRing]);

    useEffect(() => {
        if (status === "calling" || status === "incoming") startRing(); else stopRing();
        return stopRing;
    }, [startRing, status, stopRing]);

    useEffect(() => {
        if (status !== "connected") { setElapsed(0); return undefined; }
        const startedAt = Date.now();
        const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [status]);

    const buildPeer = useCallback(async (callInfo) => {
        if (pcRef.current) return pcRef.current;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;
        if (iceServersRef.current === DEFAULT_ICE_SERVERS) {
            try {
                const { data } = await api.get("/voice/ice-servers");
                if (Array.isArray(data?.ice_servers) && data.ice_servers.length) iceServersRef.current = data.ice_servers;
            } catch (_) { /* The endpoint has a safe STUN fallback for direct calls. */ }
        }
        const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        pc.ontrack = (event) => {
            const [remote] = event.streams || [];
            if (audioRef.current && remote) {
                audioRef.current.srcObject = remote;
                audioRef.current.play?.().catch(() => {});
            }
        };
        pc.onicecandidate = (event) => {
            if (event.candidate) socket?.send({
                type: "call_ice", to: callInfo.peer_id, convo_id: callInfo.convo_id,
                call_id: callInfo.call_id, data: event.candidate,
            });
        };
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") { setStatus("connected"); setError(""); }
            if (pc.connectionState === "failed") { setStatus("failed"); setError(tr("تعذر إكمال المكالمة. تحقق من اتصال الإنترنت وحاول مرة أخرى.")); }
            if (["disconnected", "closed"].includes(pc.connectionState)) setStatus("ended");
        };
        pcRef.current = pc;
        for (const candidate of pendingIceRef.current.splice(0)) {
            try { await pc.addIceCandidate(candidate); } catch (_) {}
        }
        return pc;
    }, [socket]);

    const startOutgoing = useCallback(async () => {
        if (!other?.id || !convoId || !user?.id) return;
        const callInfo = { call_id: makeCallId(), convo_id: convoId, peer_id: other.id, peer_name: other.name };
        setCall(callInfo);
        setStatus("calling");
        setError("");
        onActiveChange?.(true);
        try {
            const pc = await buildPeer(callInfo);
            socket?.send({ type: "call_invite", to: other.id, convo_id: convoId, call_id: callInfo.call_id, data: { caller_name: user.name } });
            const offer = await pc.createOffer({ offerToReceiveAudio: true });
            await pc.setLocalDescription(offer);
            socket?.send({ type: "call_offer", to: other.id, convo_id: convoId, call_id: callInfo.call_id, data: offer });
        } catch (_) {
            setError(tr("تعذر الوصول إلى الميكروفون أو بدء المكالمة"));
            setStatus("failed");
        }
    }, [buildPeer, convoId, onActiveChange, other, socket, user]);

    useEffect(() => {
        if (start && !call && status === "idle") {
            startOutgoing();
            onStarted?.();
        }
    }, [call, onStarted, start, startOutgoing, status]);

    useEffect(() => {
        if (!socket?.subscribe || !user?.id) return undefined;
        const acceptEvent = (event) => {
            if (!event || event.from === user.id || (convoId && event.convo_id !== convoId)) return;
            const info = { call_id: event.call_id, convo_id: event.convo_id, peer_id: event.from, peer_name: other?.name || tr("مكالمة واردة") };
            if (event.type === "call_invite") {
                setCall(info);
                setStatus("incoming");
                onActiveChange?.(true);
            } else if (event.type === "call_offer") {
                pendingOfferRef.current = event;
            } else if (event.type === "call_ice") {
                const candidate = event.data;
                if (pcRef.current) pcRef.current.addIceCandidate(candidate).catch(() => {});
                else pendingIceRef.current.push(candidate);
            } else if (event.type === "call_answer" && pcRef.current && event.call_id === call?.call_id) {
                pcRef.current.setRemoteDescription(event.data).then(() => setStatus("connected")).catch(() => {});
            } else if (event.type === "call_reject" && event.call_id === call?.call_id) {
                setError(tr("تم رفض المكالمة"));
                setStatus("failed");
                try { pcRef.current?.close(); } catch (_) {}
                streamRef.current?.getTracks?.().forEach((track) => track.stop());
            } else if (event.type === "call_hangup" && event.call_id === call?.call_id) {
                cleanup(false);
            }
        };
        const offs = ["call_invite", "call_offer", "call_answer", "call_ice", "call_reject", "call_hangup"].map((type) => socket.subscribe(type, acceptEvent));
        return () => offs.forEach((off) => off?.());
    }, [call?.call_id, cleanup, convoId, onActiveChange, other?.name, socket, user?.id]);

    const acceptIncoming = async () => {
        if (!call) return;
        setStatus("connecting");
        try {
            const pc = await buildPeer(call);
            const offer = pendingOfferRef.current;
            if (!offer) {
                setError(tr("انتظر عرض المكالمة ثم حاول مرة أخرى"));
                return;
            }
            await pc.setRemoteDescription(offer.data);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket?.send({ type: "call_answer", to: call.peer_id, convo_id: call.convo_id, call_id: call.call_id, data: answer });
            setStatus("connected");
        } catch (_) {
            setError(tr("تعذر قبول المكالمة"));
            setStatus("failed");
        }
    };

    const rejectIncoming = () => {
        if (!call) return;
        socket?.send({ type: "call_reject", to: call.peer_id, convo_id: call.convo_id, call_id: call.call_id, data: {} });
        cleanup(false);
    };

    const toggleMute = () => {
        const next = !muted;
        streamRef.current?.getAudioTracks?.().forEach((track) => { track.enabled = !next; });
        setMuted(next);
    };

    if (!call && status === "idle") return null;
    const label = status === "incoming" ? tr("مكالمة واردة") : status === "connected" ? tr("المكالمة متصلة") : status === "failed" ? tr("فشلت المكالمة") : tr("جاري الاتصال");
    const duration = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
    return (
        <div className="fixed inset-0 z-[100] overflow-hidden bg-[#07152f] text-white flex items-center justify-center p-4 font-arabic-body" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(79,182,230,.32),transparent_35%),linear-gradient(160deg,#0a1c3c,#07152f_70%)]" />
            <audio ref={audioRef} autoPlay playsInline />
            <div className="relative w-full max-w-sm text-center py-8 px-5">
                <div className={`w-28 h-28 rounded-full mx-auto mb-6 grid place-items-center bg-white/10 ring-1 ring-white/25 shadow-[0_0_0_18px_rgba(79,182,230,.09)] ${status === "calling" || status === "incoming" ? "animate-pulse" : ""}`}><UserRound className="w-12 h-12 text-[#8bd9f4]" /></div>
                <h2 className="text-2xl font-bold tracking-tight">{other?.name || call?.peer_name || tr("مكالمة صوتية")}</h2>
                <p className="text-sm text-slate-300 mt-2">{label}{status === "connected" ? ` · ${duration}` : ""}</p>
                {error && <p className="text-xs text-red-200 mt-4">{error}</p>}
                <div className="grid grid-cols-2 gap-4 mt-10 max-w-[280px] mx-auto">
                    {status === "incoming" ? <button onClick={acceptIncoming} className="h-16 rounded-2xl bg-emerald-500 text-white flex flex-col items-center justify-center gap-1 shadow-lg" aria-label={tr("قبول")}><Phone className="w-5 h-5" /><span className="text-[11px]">{tr("قبول")}</span></button> : <button onClick={toggleMute} disabled={status === "failed"} className={`h-16 rounded-2xl ${muted ? "bg-[#8bd9f4] text-[#07152f]" : "bg-white/10 text-white"} disabled:opacity-40 flex flex-col items-center justify-center gap-1`} aria-label={muted ? tr("تشغيل الميكروفون") : tr("كتم الميكروفون")}>{muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}<span className="text-[11px]">{muted ? tr("تشغيل") : tr("كتم")}</span></button>}
                    <button onClick={status === "incoming" ? rejectIncoming : () => cleanup(true)} className="h-16 rounded-2xl bg-red-500 text-white flex flex-col items-center justify-center gap-1 shadow-lg" aria-label={status === "incoming" ? tr("رفض") : tr("إنهاء المكالمة")}><PhoneOff className="w-5 h-5" /><span className="text-[11px]">{status === "incoming" ? tr("رفض") : tr("إنهاء")}</span></button>
                </div>
            </div>
        </div>
    );
}

