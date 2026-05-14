import api from "@/lib/api";

/**
 * Web Push helper.
 * - Registers /sw.js
 * - Subscribes the browser to push via PushManager with our VAPID public key
 * - Posts the subscription to /api/push/web/subscribe
 *
 * Returns:
 *   { ok: true, alreadySubscribed: bool } on success,
 *   { ok: false, reason } on failure (denied / unsupported / not-logged-in).
 */

function urlBase64ToUint8Array(base64) {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(b64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
}

function subToJSON(sub) {
    const j = sub.toJSON();
    return { endpoint: j.endpoint, keys: j.keys };
}

export function isWebPushSupported() {
    return (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
}

export async function getWebPushStatus() {
    if (!isWebPushSupported()) return "unsupported";
    if (Notification.permission === "denied") return "denied";
    try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        if (!reg) return Notification.permission === "granted" ? "granted-unsubscribed" : "default";
        const sub = await reg.pushManager.getSubscription();
        if (sub) return "subscribed";
        return Notification.permission === "granted" ? "granted-unsubscribed" : "default";
    } catch (_) {
        return "default";
    }
}

export async function subscribeWebPush() {
    if (!isWebPushSupported()) return { ok: false, reason: "unsupported" };
    try {
        // 1. Permission
        let perm = Notification.permission;
        if (perm === "default") perm = await Notification.requestPermission();
        if (perm !== "granted") return { ok: false, reason: "denied" };

        // 2. Service worker
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        // 3. Existing subscription?
        let sub = await reg.pushManager.getSubscription();
        if (sub) {
            await api.post("/push/web/subscribe", {
                ...subToJSON(sub),
                user_agent: navigator.userAgent,
            });
            return { ok: true, alreadySubscribed: true };
        }

        // 4. Fetch VAPID public key
        const { data } = await api.get("/push/web/vapid-public-key");
        const vapid = data?.public_key;
        if (!vapid) return { ok: false, reason: "no_vapid_key" };

        sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapid),
        });

        await api.post("/push/web/subscribe", {
            ...subToJSON(sub),
            user_agent: navigator.userAgent,
        });
        return { ok: true, alreadySubscribed: false };
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[webpush] subscribe failed", e);
        return { ok: false, reason: e.message || "error" };
    }
}

export async function unsubscribeWebPush() {
    if (!isWebPushSupported()) return { ok: false };
    try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        if (!reg) return { ok: true };
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
            try { await api.post("/push/web/unsubscribe", subToJSON(sub)); } catch (_) {}
            await sub.unsubscribe();
        }
        return { ok: true };
    } catch (e) {
        return { ok: false, reason: e.message };
    }
}

export async function sendTestPush() {
    try {
        await api.post("/push/test");
        return { ok: true };
    } catch (e) {
        return { ok: false, reason: e?.response?.data?.detail || e.message };
    }
}
