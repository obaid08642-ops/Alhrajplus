/**
 * Mobile WebSocket hook — production-ready real-time chat client.
 * Uses the native React Native WebSocket implementation (no extra deps).
 *
 * Token is read from secure storage (api.js → SecureStore). URL is derived from
 * BACKEND_URL by swapping the scheme: https → wss, http → ws.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { BACKEND_URL } from "./api";

const TOKEN_KEY = "hp_access_token";
const REPLAYABLE_SOCKET_EVENTS = new Set([
  "read", "call_invite", "call_offer", "call_answer", "call_ice", "call_reject", "call_hangup",
]);

function queuedEventKey(event) {
  if (event?.type === "call_ice") return null;
  if (event?.type === "read") return `read:${event.convo_id || ""}`;
  return `${event?.type || "event"}:${event?.call_id || ""}:${event?.to || ""}`;
}

async function readToken() {
    try {
        if (SecureStore.isAvailableAsync && (await SecureStore.isAvailableAsync())) {
            const t = await SecureStore.getItemAsync(TOKEN_KEY);
            if (t) return t;
        }
    } catch (_) {}
    return AsyncStorage.getItem(TOKEN_KEY);
}

export function useChatSocket() {
    const wsRef = useRef(null);
    const handlersRef = useRef(new Map());
    const reconnect = useRef(0);
    const pingTimer = useRef(null);
    const retryTimer = useRef(null);
    const outboundQueue = useRef([]);
    const [connected, setConnected] = useState(false);

    const dispatch = useCallback((event) => {
        const set = handlersRef.current.get(event.type);
        if (set) set.forEach((h) => { try { h(event); } catch (_) {} });
    }, []);

    const connect = useCallback(async () => {
        const token = await readToken();
        if (!token || !BACKEND_URL) return;
        const url = `${BACKEND_URL.replace(/^http/i, "ws")}/api/ws/chat?token=${encodeURIComponent(token)}`;
        let ws;
        try { ws = new WebSocket(url); } catch (_) { scheduleRetry(); return; }
        wsRef.current = ws;
        ws.onopen = () => {
            setConnected(true);
            reconnect.current = 0;
            // Flush only control events that are safe to replay after a
            // reconnect. Message bodies are persisted through REST with a
            // client_message_id and are not sent through this queue.
            const queued = outboundQueue.current.splice(0, outboundQueue.current.length);
            queued.forEach(item => {
                try { if (ws.readyState === 1) ws.send(JSON.stringify(item)); } catch (_) {}
            });
            if (pingTimer.current) clearInterval(pingTimer.current);
            pingTimer.current = setInterval(() => {
                if (ws.readyState === 1) { try { ws.send(JSON.stringify({ type: "ping" })); } catch (_) {} }
            }, 25000);
        };
        ws.onmessage = (e) => {
            try { dispatch(JSON.parse(e.data)); } catch (_) {}
        };
        ws.onclose = () => {
            setConnected(false);
            if (pingTimer.current) { clearInterval(pingTimer.current); pingTimer.current = null; }
            scheduleRetry();
        };
        ws.onerror = () => { try { ws.close(); } catch (_) {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const scheduleRetry = useCallback(() => {
        if (retryTimer.current) return;
        const a = Math.min(reconnect.current + 1, 6);
        reconnect.current = a;
        retryTimer.current = setTimeout(() => { retryTimer.current = null; connect(); }, Math.min(1000 * 2 ** a, 30000));
    }, [connect]);

    useEffect(() => {
        connect();
        return () => {
            if (pingTimer.current) clearInterval(pingTimer.current);
            if (retryTimer.current) clearTimeout(retryTimer.current);
            try { wsRef.current?.close(); } catch (_) {}
        };
    }, [connect]);

    const send = useCallback((obj) => {
        const ws = wsRef.current;
        if (ws && ws.readyState === 1) {
            try { ws.send(JSON.stringify(obj)); return true; } catch (_) {}
        }
        // Chat bodies use idempotent REST. Keep call/control signals while
        // reconnecting; every ICE candidate is retained in arrival order.
        if (REPLAYABLE_SOCKET_EVENTS.has(obj?.type)) {
            const key = queuedEventKey(obj);
            const retained = key ? outboundQueue.current.filter(item => queuedEventKey(item) !== key) : outboundQueue.current;
            outboundQueue.current = [...retained, obj].slice(-128);
        }
        return false;
    }, []);

    const subscribe = useCallback((type, handler) => {
        if (!handlersRef.current.has(type)) handlersRef.current.set(type, new Set());
        handlersRef.current.get(type).add(handler);
        return () => {
            const set = handlersRef.current.get(type);
            if (set) { set.delete(handler); if (!set.size) handlersRef.current.delete(type); }
        };
    }, []);

    return { send, connected, subscribe };
}
