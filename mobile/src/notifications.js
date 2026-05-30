import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import Constants from "expo-constants";
import api from "./api";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Route a tapped notification → navigate to the listing/chat/etc.
 * Backend always includes `url` in the payload (e.g. "/listing/abc",
 * "/chat?to=xyz"). We open it via the harajplus:// scheme so deep-link
 * handlers inside the app pick it up.
 */
let _navigationRef = null;
export function setNotificationNavigationRef(ref) { _navigationRef = ref; }

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

function routeFromUrl(url) {
    if (!url) return;
    // Listing detail
    let m = url.match(/^\/listing\/([^/?#]+)/);
    if (m && _navigationRef?.navigate) { _navigationRef.navigate("ListingDetail", { id: m[1] }); return; }
    // Seller profile
    m = url.match(/^\/seller\/([^/?#]+)/);
    if (m && _navigationRef?.navigate) { _navigationRef.navigate("SellerProfile", { sellerId: m[1] }); return; }
    // Chat
    m = url.match(/^\/chat(\?to=([^&]+))?/);
    if (m && _navigationRef?.navigate) {
        const to = m[2];
        _navigationRef.navigate("Chat", to ? { to } : {});
        return;
    }
    // Post listing (abandoned-draft reminder)
    if (url === "/post" || url.startsWith("/post?")) {
        if (_navigationRef?.navigate) { _navigationRef.navigate("Post"); return; }
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
        routeFromUrl(data.url);
    });
    // Fired the moment a notification arrives — let UI badges refresh live.
    Notifications.addNotificationReceivedListener((notif) => {
        _emitReceived(notif);
    });
    // Cold start — app opened from a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
        const data = response?.notification?.request?.content?.data || {};
        if (data?.url) routeFromUrl(data.url);
    });
}

export async function registerForNotifications() {
    try {
        attachListenersOnce();
        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#89CFF0",
                sound: "default",
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
