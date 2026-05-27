import { useEffect, useState, useRef } from "react";

/**
 * Live auction subscription via the backend's WebSocket bridge.
 *
 *   const { topBid, bidCount, status, connected, lastEventAt, refresh } =
 *     useAuctionLive(listingId);
 *
 * Notes:
 * - Replaces 2-3s polling with a sub-second push channel.
 * - Auto-reconnects with exponential backoff (1s → 16s cap).
 * - Sends a ping every 25s so corporate proxies don't kill the socket.
 * - Falls back gracefully: if the WS handshake never opens, callers can
 *   still poll on a slow interval using `connected === false` as a signal.
 */
export function useAuctionLive(listingId) {
    const [topBid, setTopBid] = useState(null);
    const [bidCount, setBidCount] = useState(0);
    const [status, setStatus] = useState(null);
    const [startingPrice, setStartingPrice] = useState(null);
    const [auctionEndAt, setAuctionEndAt] = useState(null);
    const [connected, setConnected] = useState(false);
    const [lastEventAt, setLastEventAt] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimer = useRef(null);
    const pingTimer = useRef(null);
    const backoffMs = useRef(1000);
    const stopRef = useRef(false);

    useEffect(() => {
        if (!listingId) return;
        stopRef.current = false;
        const base = (process.env.REACT_APP_BACKEND_URL || "").replace(/^http/, "ws");
        if (!base) return;
        const url = `${base}/api/ws/auctions/${listingId}`;

        const connect = () => {
            if (stopRef.current) return;
            try {
                const ws = new WebSocket(url);
                wsRef.current = ws;
                ws.onopen = () => {
                    backoffMs.current = 1000; // reset backoff on success
                    setConnected(true);
                    // Heartbeat — keeps proxies + load balancers from idling us out.
                    if (pingTimer.current) clearInterval(pingTimer.current);
                    pingTimer.current = setInterval(() => {
                        try { ws.readyState === 1 && ws.send("ping"); } catch (_) { /* ignore */ }
                    }, 25000);
                };
                ws.onmessage = (e) => {
                    if (e.data === "pong") return;
                    let msg;
                    try { msg = JSON.parse(e.data); } catch (_) { return; }
                    if (msg.type === "snapshot") {
                        setTopBid(msg.top_bid || null);
                        setBidCount(msg.bid_count || 0);
                        setStatus(msg.status || null);
                        setStartingPrice(msg.starting_price ?? null);
                        setAuctionEndAt(msg.auction_end_at || null);
                        setLastEventAt(Date.now());
                    } else if (msg.type === "bid") {
                        setTopBid(msg.bid || null);
                        setBidCount(msg.bid_count || 0);
                        setLastEventAt(Date.now());
                    } else if (msg.type === "heartbeat") {
                        // server-side keep-alive, ignore
                    }
                };
                ws.onclose = () => {
                    setConnected(false);
                    if (pingTimer.current) clearInterval(pingTimer.current);
                    if (stopRef.current) return;
                    // Exponential backoff capped at 16s.
                    reconnectTimer.current = setTimeout(connect, backoffMs.current);
                    backoffMs.current = Math.min(backoffMs.current * 2, 16000);
                };
                ws.onerror = () => { try { ws.close(); } catch (_) { /* ignore */ } };
            } catch (_) {
                reconnectTimer.current = setTimeout(connect, backoffMs.current);
                backoffMs.current = Math.min(backoffMs.current * 2, 16000);
            }
        };
        connect();
        return () => {
            stopRef.current = true;
            if (pingTimer.current) clearInterval(pingTimer.current);
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            try { wsRef.current && wsRef.current.close(); } catch (_) { /* ignore */ }
        };
    }, [listingId]);

    return {
        topBid,
        bidCount,
        status,
        startingPrice,
        auctionEndAt,
        connected,
        lastEventAt,
        // No-op manual refresh placeholder so callers used to polling can switch
        // their UI button to this without rewriting handlers.
        refresh: () => { },
    };
}
