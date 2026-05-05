import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
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

export async function registerForNotifications() {
    try {
        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.DEFAULT,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#4FB6E6",
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
