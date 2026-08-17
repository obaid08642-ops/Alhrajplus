import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
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
    const [relayConfigured, setRelayConfigured] = useState(null);
    const pcRef = useRef(null);
    const streamRef = useRef(null);
    const audioRef = useRef(null);
    const pendingOfferRef = useRef(null);
    const pendingIceRef = useRef([]);
    const iceServersRef = useRef(DEFAULT_ICE_SERVERS);

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
        onActiveChange?.(false);
    }, [call, onActiveChange, socket]);

    const buildPeer = useCallback(async (callInfo) => {
        if (pcRef.current) return pcRef.current;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;
        if (iceServersRef.current === DEFAULT_ICE_SERVERS) {
            try {
                const { data } = await api.get("/voice/ice-servers");
                if (Array.isArray(data?.ice_servers) && data.ice_servers.length) iceServersRef.current = data.ice_servers;
                setRelayConfigured(data?.relay_configured === true);
            } catch (_) { setRelayConfigured(false); /* STUN-only fallback remains usable */ }
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
            if (["connected"].includes(pc.connectionState)) setStatus("connected");
            if (["failed", "disconnected", "closed"].includes(pc.connectionState)) setStatus("ended");
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
    return (
        <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <audio ref={audioRef} autoPlay playsInline />
            <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 text-center font-arabic-body">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-[var(--primary)]/15 flex items-center justify-center text-[var(--primary)]"><Phone className="w-9 h-9" /></div>
                <h2 className="text-lg font-bold text-[var(--text)]">{other?.name || call?.peer_name || tr("مكالمة صوتية")}</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">{label}</p>
                {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
                {!error && relayConfigured === false && <p className="text-xs text-amber-600 dark:text-amber-300 mt-3">{tr("بعض الشبكات تحتاج TURN relay لإتمام المكالمة. جرّب شبكة أخرى إذا تعذر الاتصال.")}</p>}
                <div className="flex justify-center gap-3 mt-6">
                    {status === "incoming" && <button onClick={acceptIncoming} className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center" aria-label={tr("قبول") }><Phone className="w-5 h-5" /></button>}
                    {status !== "incoming" && status !== "failed" && <button onClick={toggleMute} className="w-12 h-12 rounded-full bg-[var(--surface-elevated)] text-[var(--text)] flex items-center justify-center" aria-label={muted ? tr("تشغيل الميكروفون") : tr("كتم الميكروفون")}>{muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>}
                    <button onClick={status === "incoming" ? rejectIncoming : () => cleanup(true)} className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center" aria-label={status === "incoming" ? tr("رفض") : tr("إنهاء المكالمة")}><PhoneOff className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
}

