/**
 * Draggable AI Assistant FAB (mobile).
 * - Smooth dragging via PanResponder + Animated.ValueXY (no per-frame re-render).
 * - Closable via a small × button (top-end of FAB).
 * - Tap opens the AIAssistant screen.
 * - Hidden-flag + last position persisted to AsyncStorage.
 * - When hidden, a tiny "إظهار المساعد" pill appears on Profile screen
 *   (handled by the profile screen itself — out of scope here).
 */
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, PanResponder, StyleSheet, TouchableOpacity, View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Sparkles, X } from "lucide-react-native";
import { theme } from "../theme";
import { useI18n } from "../I18nContext";

const POS_KEY = "hp_ai_fab_pos_mobile";
const HIDDEN_KEY = "hp_ai_fab_hidden_mobile";
const FAB_SIZE = 58;

/**
 * Helper — read the leaf route name from the container ref. Drills into
 * nested navigators so we get e.g. "HomeTab" when the user is on the home
 * screen inside the Main tab navigator. Returns "" if the ref isn't ready
 * yet (mount-phase race) — caller treats that as "show the FAB".
 */
function _getRouteName(navRef) {
    try {
        const state = navRef?.current?.getRootState?.();
        if (!state) return "";
        let r = state.routes?.[state.index || 0];
        while (r?.state) r = r.state.routes?.[r.state.index || 0];
        return r?.name || "";
    } catch (_) {
        return "";
    }
}

export default function AIAssistantFab({ navRef }) {
    const { t } = useI18n();
    const { width: W, height: H } = Dimensions.get("window");

    // We can't subscribe to the navigation ref via hooks, so we poll it
    // using a "listener" pattern: subscribe to navRef.addListener('state').
    const [routeName, setRouteName] = useState("");
    useEffect(() => {
        if (!navRef) return undefined;
        const update = () => setRouteName(_getRouteName(navRef));
        // Initial read after first paint when the ref is hooked up.
        const initial = setTimeout(update, 50);
        // navigation container refs expose addListener for state changes.
        const off = navRef.addListener?.("state", update);
        return () => {
            clearTimeout(initial);
            if (typeof off === "function") off();
        };
    }, [navRef]);
    const hideOnRoute = routeName === "AIAssistant" || routeName === "ReelsTab" || routeName === "Login" || routeName === "Register" || routeName === "Chat";

    const [hidden, setHidden] = useState(false);
    const [restorePillVisible] = useState(false); // Reserved for future profile-page restore
    const pan = useRef(new Animated.ValueXY({ x: W - FAB_SIZE - 16, y: H - 200 })).current;

    // Restore persisted state on mount.
    useEffect(() => {
        (async () => {
            try {
                const h = await AsyncStorage.getItem(HIDDEN_KEY);
                if (h === "1") setHidden(true);
                const p = await AsyncStorage.getItem(POS_KEY);
                if (p) {
                    const obj = JSON.parse(p);
                    if (typeof obj?.x === "number" && typeof obj?.y === "number") {
                        pan.setValue({ x: obj.x, y: obj.y });
                    }
                }
            } catch (_) {}
        })();
    }, [pan]);

    // PanResponder for smooth dragging.
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
            onPanResponderGrant: () => {
                pan.extractOffset();
            },
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
            onPanResponderRelease: async (_, g) => {
                pan.flattenOffset();
                // Snap to nearest edge horizontally.
                const finalX = (g.moveX < W / 2) ? 16 : W - FAB_SIZE - 16;
                const finalY = Math.max(80, Math.min(H - FAB_SIZE - 160, g.moveY - FAB_SIZE / 2));
                Animated.spring(pan, { toValue: { x: finalX, y: finalY }, useNativeDriver: false, friction: 7 }).start();
                try {
                    await AsyncStorage.setItem(POS_KEY, JSON.stringify({ x: finalX, y: finalY }));
                } catch (_) {}
                // Detect a "tap" (negligible movement): open the assistant.
                if (Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6) {
                    try { navRef?.current?.navigate?.("AIAssistant"); } catch (_) {}
                }
            },
        })
    ).current;

    if (hidden || hideOnRoute) {
        if (restorePillVisible) {
            return (
                <TouchableOpacity onPress={async () => { setHidden(false); try { await AsyncStorage.removeItem(HIDDEN_KEY); } catch (_) {} }} style={styles.restorePill} testID="ai-fab-restore">
                    <Sparkles size={14} color="#fff" />
                    <Text style={styles.restorePillText}>{t("إظهار المساعد الذكي")}</Text>
                </TouchableOpacity>
            );
        }
        return null;
    }

    return (
        <Animated.View
            style={[styles.fabWrap, { transform: pan.getTranslateTransform() }]}
            {...panResponder.panHandlers}
            testID="ai-fab-mobile-wrap"
        >
            <View style={styles.fab}>
                <Sparkles size={22} color="#fff" strokeWidth={2.4} />
                <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI</Text></View>
            </View>
            <TouchableOpacity
                onPress={async () => { setHidden(true); try { await AsyncStorage.setItem(HIDDEN_KEY, "1"); } catch (_) {} }}
                style={styles.closeBtn}
                testID="ai-fab-mobile-close"
                hitSlop={8}
            >
                <X size={11} color="#EF4444" strokeWidth={3} />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    fabWrap: {
        position: "absolute",
        top: 0,
        left: 0,
        width: FAB_SIZE,
        height: FAB_SIZE,
        zIndex: 1000,
        elevation: 12
    },
    fab: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#89CFF0",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 12,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.9)"
    },
    aiBadge: {
        position: "absolute",
        bottom: -4,
        right: -6,
        backgroundColor: "#EF4444",
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 999,
        minWidth: 22,
        alignItems: "center"
    },
    aiBadgeText: {
        color: "#fff",
        fontSize: 9,
        fontWeight: "900"
    },
    closeBtn: {
        position: "absolute",
        top: -6,
        left: -6,
        width: 22,
        height: 22,
        borderRadius: 999,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5
    },
    restorePill: {
        position: "absolute",
        bottom: 110,
        right: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        zIndex: 1000
    },
    restorePillText: {
        color: "#fff",
        fontWeight: "900",
        fontSize: 12
    }
});
