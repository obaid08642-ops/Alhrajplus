import api from "@/lib/api";

const VISITOR_KEY = "hp_visitor_id";
const SESSION_KEY = "hp_session_id";
const SESSION_STARTED_KEY = "hp_session_started_at";

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

function getSessionStartedAt() {
    try {
        let value = Number(localStorage.getItem(SESSION_STARTED_KEY));
        if (!value) {
            value = Date.now();
            localStorage.setItem(SESSION_STARTED_KEY, String(value));
        }
        return value;
    } catch (_) {
        return Date.now();
    }
}

function classifyDevice(width) {
    if (width <= 600) return "mobile";
    if (width <= 1024) return "tablet";
    return "desktop";
}

function classifyBrowser(ua) {
    if (/Edg\//i.test(ua)) return "Edge";
    if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return "Chrome";
    if (/Firefox\//i.test(ua)) return "Firefox";
    if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
    return "Other";
}

function classifyOs(ua) {
    if (/Android/i.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
    if (/Windows/i.test(ua)) return "Windows";
    if (/Mac OS X/i.test(ua)) return "macOS";
    if (/Linux/i.test(ua)) return "Linux";
    return "Other";
}

function getCampaignDetails() {
    try {
        const params = new URLSearchParams(window.location.search);
        return {
            source: params.get("utm_source") || params.get("ref") || document.referrer || undefined,
            campaign: params.get("utm_campaign") || params.get("campaign") || undefined,
        };
    } catch (_) {
        return {};
    }
}

export function trackEvent(event, details = {}) {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    const width = Number(window.innerWidth || 0);
    const height = Number(window.innerHeight || 0);
    const campaign = getCampaignDetails();
    const payload = {
        event,
        visitor_id: getOrCreate(VISITOR_KEY, "v"),
        session_id: getOrCreate(SESSION_KEY, "s"),
        path: window.location.pathname,
        category: details.category,
        listing_id: details.listing_id,
        country_code: details.country_code,
        device_type: classifyDevice(width),
        os: classifyOs(ua),
        browser: classifyBrowser(ua),
        source: details.source || campaign.source,
        campaign: details.campaign || campaign.campaign,
        referrer: document.referrer || undefined,
        duration_ms: details.duration_ms ?? Math.max(0, Date.now() - getSessionStartedAt()),
        screen_width: width,
        screen_height: height,
    };
    // Analytics must never block navigation or surface errors to the user.
    api.post("/analytics/events", payload).catch(() => {});
}

export function trackSessionHeartbeat() {
    trackEvent("session_heartbeat");
}

export function resetAnalyticsSession() {
    try {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_STARTED_KEY);
    } catch (_) {}
}
