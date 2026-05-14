import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
    const [connected, setConnected] = useState(false);

    const dispatch = useCallback((event) => {
        const set = handlersRef.current.get(event.type);
        if (set) set.forEach((h) => { try { h(event); } catch (_) {} });
        const wildcard = handlersRef.current.get("*");
        if (wildcard) wildcard.forEach((h) => { try { h(event); } catch (_) {} });
    }, []);

    const connect = useCallback(() => {
        if (!user || user === false) return;
        const token = (() => {
            try { return localStorage.getItem("hp_access_token") || ""; } catch (_) { return ""; }
        })();
        if (!token) return;

        // Build wss:// URL from REACT_APP_BACKEND_URL (https://...) → wss://
        const base = (process.env.REACT_APP_BACKEND_URL || "").replace(/^http/i, "ws");
        const url = `${base}/api/ws/chat?token=${encodeURIComponent(token)}`;
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
    }, [user, dispatch]);

    const scheduleReconnect = useCallback(() => {
        if (reconnectTimer.current) return;
        const attempt = Math.min(reconnectAttempt.current + 1, 6);
        reconnectAttempt.current = attempt;
        const delay = Math.min(1000 * 2 ** attempt, 30000); // 2s,4s,8s,16s,30s cap
        reconnectTimer.current = setTimeout(() => {
            reconnectTimer.current = null;
            connect();
        }, delay);
    }, [connect]);

    useEffect(() => {
        connect();
        return () => {
            if (pingTimer.current) clearInterval(pingTimer.current);
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            try { wsRef.current?.close(); } catch (_) {}
            wsRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const send = useCallback((obj) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return false;
        try { ws.send(JSON.stringify(obj)); return true; } catch (_) { return false; }
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
