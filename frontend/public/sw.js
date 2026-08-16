/* الحراج بلس — Service Worker (Web Push)
 * Handles incoming push events while the page is closed/backgrounded and
 * routes notification clicks to the appropriate deep link.
 */
self.addEventListener("install", (event) => { self.skipWaiting(); });
self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });

self.addEventListener("push", (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch (_) {
        payload = { title: "الحراج بلس", body: event.data ? event.data.text() : "" };
    }
    const title = payload.title || "الحراج بلس";
    const richImage = payload.image || payload.data?.image || null;
    const options = {
        body: payload.body || "",
        icon: "/favicon-192.png",
        badge: "/favicon-192.png",
        dir: "rtl",
        lang: "ar",
        data: { url: payload.url || "/", image: richImage, ...(payload.data || {}) },
        // Native vibration pattern — Android only (iOS Safari ignores).
        vibrate: payload.data?.type === "new_message" ? [80, 40, 80] : [40, 20, 40],
        tag: payload.data?.type || "haraj-plus",
        renotify: true,
        // sound: only honoured on a few Chromium platforms; native channels
        // (Android channel "default") drive sound on most installs.
        sound: "/notif.mp3",
        requireInteraction: false,
    };
    // Rich notification image (Chrome desktop + Android). iOS / Safari ignore.
    if (richImage) options.image = richImage;
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.url) || "/";
    event.waitUntil((async () => {
        const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        // If a tab is already open on our origin, focus it and navigate.
        for (const client of allClients) {
            try {
                const u = new URL(client.url);
                const target = new URL(url, self.location.origin);
                if (u.origin === target.origin) {
                    client.focus();
                    client.navigate(target.href);
                    return;
                }
            } catch (_) {}
        }
        // Otherwise open a new tab.
        await self.clients.openWindow(url);
    })());
});
