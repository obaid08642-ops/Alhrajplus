import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import Constants from "expo-constants";
import api from "./api";

// SDK 53+ exposes new banner/list iOS keys. Set them ALL so the OS shows
// the alert and plays sound both in the foreground AND when the app is
// fully closed (cold start).
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        // iOS 14+ — present as banner + list entry.
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Route a tapped notification → navigate to the listing/chat/etc.
 * Backend always includes `url` in the payload (e.g. "/listing/abc",
 * "/chat?to=xyz"). We open it via the harajplus:// scheme so deep-link
 * handlers inside the app pick it up.
 */
let _navigationRef = null;
let _pendingNotificationUrl = null;
export function setNotificationNavigationRef(ref) {
    _navigationRef = ref;
    // Cold-start responses can arrive before NavigationContainer.onReady.
    // Replay the last pending route once the navigator is able to navigate.
    if (_navigationRef?.navigate && _pendingNotificationUrl) {
        const pending = _pendingNotificationUrl;
        _pendingNotificationUrl = null;
        routeFromUrl(pending);
    }
}

// Lightweight pub/sub so UI badges can refresh on every incoming push without
// each consumer setting up its own Notifications.addNotificationReceivedListener.
const _notifyListeners = new Set();
export function onNotificationReceived(cb) {
    _notifyListeners.add(cb);
    return () => _notifyListeners.delete(cb);
}
function _emitReceived(notif) {
    for (const cb of _notifyListeners) {
        try { cb(notif); } catch (_) { /* noop */ }
    }
}

function notificationUrlFromData(raw) {
    const data = raw && typeof raw === "object" ? raw : {};
    const payload = data.payload && typeof data.payload === "object" ? { ...data.payload, ...data } : data;
    return payload.route || payload.url || payload.deep_link || payload.link || "";
}

export function routeFromUrl(url) {
    if (!url) return;
    // Backend normally sends a relative path; tolerate absolute frontend URLs too.
    try {
        if (/^https?:\/\//i.test(url)) url = new URL(url).pathname + new URL(url).search;
    } catch (_) {}
    if (!url.startsWith("/")) url = `/${url}`;
    // A terminated-app notification may be processed before onReady. Keep the
    // route instead of falling back to Linking.openURL and losing navigation.
    if (!_navigationRef?.navigate) {
        _pendingNotificationUrl = url;
        return;
    }
    // Listing detail, including comment deep-links.
    let m = url.match(/^\/listing\/([^/?#]+)/);
    if (m && _navigationRef?.navigate) {
        const params = new URLSearchParams(url.split("?")[1]?.split("#")[0] || "");
        const isComments = /(?:#comments|[?&](?:focus|section)=comments)/i.test(url);
        _navigationRef.navigate("ListingDetail", { id: m[1], focus: isComments ? "comments" : undefined, commentId: params.get("comment") || undefined, fromNotification: true });
        return;
    }
    // Seller profile
    m = url.match(/^\/seller\/([^/?#]+)/);
    if (m && _navigationRef?.navigate) { _navigationRef.navigate("SellerProfile", { sellerId: m[1] }); return; }
    // Chat
    m = url.match(/^\/chat(?:\?([^#]+))?/);
    if (m && _navigationRef?.navigate) {
        const params = new URLSearchParams(m[1] || "");
        const to = params.get("to");
        const convo = params.get("convo") || params.get("conversation_id");
        const listing = params.get("listing");
        _navigationRef.navigate("Chat", { ...(to ? { to } : {}), ...(convo ? { convo } : {}), ...(listing ? { listing_id: listing } : {}), fromNotification: true });
        return;
    }
    if (url === "/notifications" || url.startsWith("/notifications?")) {
        _navigationRef.navigate("Notifications");
        return;
    }
    if (url === "/saved-searches" || url.startsWith("/saved-searches?")) {
        _navigationRef.navigate("SavedSearches");
        return;
    }
    // Reels / stories — Reels is a tab nested inside Main.
    if (url === "/reels" || url.startsWith("/reels?") || url === "/stories" || url.startsWith("/stories?")) {
        _navigationRef.navigate("Main", { screen: "ReelsTab" });
        return;
    }
    // Auctions, map, offers, and today's deals.
    const topLevelRoutes = [
        ["/auctions", "Auctions"],
        ["/map", "Map"],
        ["/offers", "Offers"],
        ["/deals", "Deals"],
    ];
    const topRoute = topLevelRoutes.find(([prefix]) => url === prefix || url.startsWith(`${prefix}?`));
    if (topRoute) {
        if (topRoute[0] === "/auctions") {
            try {
                const params = new URLSearchParams(url.split("?")[1] || "");
                const listingId = params.get("openBidFor");
                _navigationRef.navigate(topRoute[1], listingId ? { openBidFor: listingId } : undefined);
            } catch (_) { _navigationRef.navigate(topRoute[1]); }
        } else _navigationRef.navigate(topRoute[1]);
        return;
    }
    // Post listing (abandoned-draft reminder)
    if (url === "/post" || url.startsWith("/post?")) {
        if (_navigationRef?.navigate) { _navigationRef.navigate("Post"); return; }
    }
    // Comment notifications without a listing id still land in the comments inbox.
    if (url === "/comments" || url.startsWith("/comments?")) {
        _navigationRef.navigate("Notifications");
        return;
    }
    // Search (abandoned-search reminder) — supports /search?q=... or /c/{category}
    m = url.match(/^\/search(?:\?q=([^&]+))?/);
    if (m && _navigationRef?.navigate) {
        const q = m[1] ? decodeURIComponent(m[1]) : "";
        _navigationRef.navigate("Search", q ? { q } : {});
        return;
    }
    m = url.match(/^\/c\/([^/?#]+)/);
    if (m && _navigationRef?.navigate) {
        _navigationRef.navigate("Search", { category: decodeURIComponent(m[1]) });
        return;
    }
    // Fallback — try built-in deep linking
    try { Linking.openURL(`harajplus://${url.startsWith("/") ? url.slice(1) : url}`); } catch (_) {}
}

let _listenersAttached = false;
function attachListenersOnce() {
    if (_listenersAttached) return;
    _listenersAttached = true;
    // Tap on a foreground/background notification
    Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data || {};
        routeFromUrl(notificationUrlFromData(data));
    });
    // Fired the moment a notification arrives — let UI badges refresh live.
    Notifications.addNotificationReceivedListener((notif) => {
        _emitReceived(notif);
    });
    // Cold start — app opened from a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
        const data = response?.notification?.request?.content?.data || {};
        const url = notificationUrlFromData(data);
        if (url) routeFromUrl(url);
    });
}

export async function registerForNotifications() {
    try {
        attachListenersOnce();
        if (Platform.OS === "android") {
            // Owner mandate: notifications must play sound + arrive when
            // the app is fully closed. Importance MAX + bypassDnd ensures
            // delivery even in Do Not Disturb mode; sound: "default"
            // explicitly enables audio.
            await Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#4FB6E6",
                sound: "default",
                bypassDnd: false,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                enableLights: true,
                enableVibrate: true,
            });
        }

        if (!Device.isDevice) return null; // Push not supported on simulators

        const { status: existing } = await Notifications.getPermissionsAsync();
        let status = existing;
        if (status !== "granted") {
            const req = await Notifications.requestPermissionsAsync();
            status = req.status;
        }
        if (status !== "granted") return null;

        // Get Expo push token
        const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ||
            Constants.easConfig?.projectId;
        const tokenResp = projectId
            ? await Notifications.getExpoPushTokenAsync({ projectId })
            : await Notifications.getExpoPushTokenAsync();

        const expoToken = tokenResp.data;
        if (!expoToken) return null;

        // Send to backend (auth required)
        try {
            await api.post("/push/register", {
                expo_token: expoToken,
                platform: Platform.OS,
            });
        } catch (e) {
            // ignore — token will be retried next launch
        }
        return expoToken;
    } catch (e) {
        return null;
    }
}

export async function fireLocalNotification(title, body, data = {}) {
    try {
        await Notifications.scheduleNotificationAsync({
            content: { title, body, data, sound: true },
            trigger: null,
        });
    } catch (_) {}
}
