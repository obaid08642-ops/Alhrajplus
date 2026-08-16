import api from "@/lib/api";

const VISITOR_KEY = "hp_visitor_id";
const SESSION_KEY = "hp_session_id";

function randomId(prefix) {
    try {
        if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
    } catch (_) {}
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function getOrCreate(key, prefix) {
    try {
        let value = localStorage.getItem(key);
        if (!value) {
            value = randomId(prefix);
            localStorage.setItem(key, value);
        }
        return value;
    } catch (_) {
        return randomId(prefix);
    }
}

export function trackEvent(event, details = {}) {
    if (typeof window === "undefined") return;
    const payload = {
        event,
        visitor_id: getOrCreate(VISITOR_KEY, "v"),
        session_id: getOrCreate(SESSION_KEY, "s"),
        path: window.location.pathname,
        category: details.category,
        listing_id: details.listing_id,
        country_code: details.country_code,
    };
    // Analytics must never block navigation or surface errors to the user.
    api.post("/analytics/events", payload).catch(() => {});
}
