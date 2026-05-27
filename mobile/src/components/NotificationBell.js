// NotificationBell — bell icon + red unread-count badge.
// Polls GET /api/notifications/unread-count when the host screen comes into
// focus so the badge stays fresh without a websocket.
import { useState, useCallback, useEffect } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Bell } from "lucide-react-native";
import api from "../api";
import { useAuth } from "../AuthContext";
import { onNotificationReceived } from "../notifications";
import { colors } from "../theme";
import { useI18n } from "../I18nContext";

export default function NotificationBell({ tintLight = false }) {
    const nav = useNavigation();
    const { user } = useAuth();
    const [count, setCount] = useState(0);

    const refresh = useCallback(() => {
    const { t } = useI18n();
        if (!user) { setCount(0); return; }
        api.get("/notifications/unread-count")
            .then(({ data }) => setCount(Number(data?.count || 0)))
            .catch(() => {});
    }, [user]);

    useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

    // Live refresh whenever a push notification arrives — no reload needed.
    useEffect(() => {
        const unsub = onNotificationReceived(() => refresh());
        return () => unsub();
    }, [refresh]);

    return (
        <TouchableOpacity
            onPress={() => nav.navigate(user ? "Notifications" : "Login")}
            style={[styles.btn, tintLight && styles.btnLight]}
            testID="notification-bell-btn"
            hitSlop={6}
            activeOpacity={0.8}
        >
            <Bell size={20} color={tintLight ? "#fff" : colors.text} />
            {count > 0 && (
                <View style={styles.badge} testID="notification-bell-badge">
                    <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    btn: {
        width: 42, height: 42, borderRadius: 999,
        backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border,
        alignItems: "center", justifyContent: "center",
        position: "relative",
    },
    btnLight: { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)" },
    badge: {
        position: "absolute", top: -3, right: -3,
        minWidth: 18, height: 18, borderRadius: 999,
        backgroundColor: "#EF4444",
        paddingHorizontal: 5,
        alignItems: "center", justifyContent: "center",
        borderWidth: 2, borderColor: colors.bg,
    },
    badgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },
});
