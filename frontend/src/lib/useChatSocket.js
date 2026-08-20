import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE, tokenStore } from "@/lib/api";

const REPLAYABLE_SOCKET_EVENTS = new Set([
    "read", "typing", "call_invite", "call_offer", "call_answer", "call_ice", "call_reject", "call_hangup",
]);

function websocketOriginFromApiBase() {
    const pageOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const absoluteApiBase = /^https?:\/\//i.test(API_BASE) ? API_BASE : `${pageOrigin}${API_BASE}`;
    return absoluteApiBase.replace(/\/api\/?$/, "").replace(/^http/i, "ws");
}

function queuedEventKey(event) {
    if (event?.type === "call_ice") return null;
    if (event?.type === "typing") return `typing:${event.to || ""}`;
    if (event?.type === "read") return `read:${event.convo_id || ""}`;
    return `${event?.type || "event"}:${event?.call_id || ""}:${event?.to || ""}`;
}

/**
 * Single shared WebSocket connection for chat real-time events.
 *
 * Reconnects automatically with exponential backoff (max 30s). Pings every
 * 25s to keep the connection alive through Render/Vercel idle timeouts.
 *
 * Returns:
 *   {
 *     send(eventObj),               // queue or send
 *     connected,                    // bool
 *     subscribe(type, handler),     // returns unsubscribe()
 *   }
 */
export function useChatSocket() {
    const { user } = useAuth();
    const wsRef = useRef(null);
    const handlersRef = useRef(new Map()); // type → Set<handler>
    const reconnectAttempt = useRef(0);
    const pingTimer = useRef(null);
    const reconnectTimer = useRef(null);
    const outboundQueue = useRef([]);
    const [connected, setConnected] = useState(false);
    const userId = user?.id;
    const connectRef = useRef(null);

    const dispatch = useCallback((event) => {
        const set = handlersRef.current.get(event.type);
        if (set) set.forEach((h) => { try { h(event); } catch (_) {} });
        const wildcard = handlersRef.current.get("*");
        if (wildcard) wildcard.forEach((h) => { try { h(event); } catch (_) {} });
    }, []);

    const scheduleReconnect = useCallback(() => {
        if (reconnectTimer.current) return;
        const attempt = Math.min(reconnectAttempt.current + 1, 6);
        reconnectAttempt.current = attempt;
        const delay = Math.min(1000 * 2 ** attempt, 30000); // 2s,4s,8s,16s,30s cap
        reconnectTimer.current = setTimeout(() => {
            reconnectTimer.current = null;
            connectRef.current?.();
        }, delay);
    }, []);

    const connect = useCallback(() => {
        if (!userId) return;
        const token = tokenStore.getAccess();
        if (!token) return;

        // Derive the WebSocket origin from API_BASE. This keeps runtime
        // config.js overrides from splitting HTTP and real-time traffic.
        const url = `${websocketOriginFromApiBase()}/api/ws/chat?token=${encodeURIComponent(token)}`;
        let ws;
        try {
            ws = new WebSocket(url);
        } catch (_) {
            scheduleReconnect();
            return;
        }
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            reconnectAttempt.current = 0;
            const queued = outboundQueue.current.splice(0, outboundQueue.current.length);
            queued.forEach((event) => {
                try { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(event)); } catch (_) {}
            });
            // Keep-alive ping every 25s (avoids idle proxies dropping us)
            if (pingTimer.current) clearInterval(pingTimer.current);
            pingTimer.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    try { ws.send(JSON.stringify({ type: "ping" })); } catch (_) {}
                }
            }, 25000);
        };
        ws.onmessage = (e) => {
            try {
                const ev = JSON.parse(e.data);
                dispatch(ev);
            } catch (_) {}
        };
        ws.onclose = () => {
            setConnected(false);
            if (pingTimer.current) { clearInterval(pingTimer.current); pingTimer.current = null; }
            scheduleReconnect();
        };
        ws.onerror = () => {
            try { ws.close(); } catch (_) {}
        };
    }, [userId, dispatch, scheduleReconnect]);

    connectRef.current = connect;

    useEffect(() => {
        connect();
        return () => {
            if (pingTimer.current) clearInterval(pingTimer.current);
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            try { wsRef.current?.close(); } catch (_) {}
            wsRef.current = null;
        };
    }, [userId, connect]);

    const send = useCallback((obj) => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            try { ws.send(JSON.stringify(obj)); return true; } catch (_) {}
        }
        // Text/media chat messages use the idempotent REST endpoint. Retain
        // only control and call signals; ICE candidates must all remain ordered.
        if (REPLAYABLE_SOCKET_EVENTS.has(obj?.type)) {
            const key = queuedEventKey(obj);
            const retained = key ? outboundQueue.current.filter((event) => queuedEventKey(event) !== key) : outboundQueue.current;
            outboundQueue.current = [...retained, obj].slice(-128);
        }
        return false;
    }, []);

    const subscribe = useCallback((type, handler) => {
        if (!handlersRef.current.has(type)) handlersRef.current.set(type, new Set());
        handlersRef.current.get(type).add(handler);
        return () => {
            const set = handlersRef.current.get(type);
            if (set) {
                set.delete(handler);
                if (set.size === 0) handlersRef.current.delete(type);
            }
        };
    }, []);

    return { send, connected, subscribe };
}
