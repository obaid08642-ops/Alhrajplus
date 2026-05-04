import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export async function registerForNotifications() {
    try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let status = existing;
        if (status !== "granted") {
            const req = await Notifications.requestPermissionsAsync();
            status = req.status;
        }
        if (status !== "granted") return null;

        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.DEFAULT,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#4FB6E6",
            });
        }
        // Local push token (full push requires eas build + FCM setup)
        return status;
    } catch (e) {
        return null;
    }
}

// Local notification — fires on device even without server
export async function fireLocalNotification(title, body, data = {}) {
    try {
        await Notifications.scheduleNotificationAsync({
            content: { title, body, data, sound: true },
            trigger: null, // immediate
        });
    } catch (_) {}
}
