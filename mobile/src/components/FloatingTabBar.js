// FloatingTabBar — premium pill-shaped glass tab bar with a floating
// gradient FAB in the center. Pure RN (no expo-blur dependency) so it
// runs on every Expo + bare RN build.
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Platform } from "react-native";
import { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Home, Film, MessageCircle, User, Plus } from "lucide-react-native";
import { colors } from "../theme";

const ACTIVE = "#4FB6E6";
const INACTIVE = "#9AA8B5";

export default function FloatingTabBar({ state, descriptors, navigation }) {
    const insets = useSafeAreaInsets();
    const pulse = useRef(new Animated.Value(0)).current;
    const fabPress = useRef(new Animated.Value(1)).current;

    // Soft pulse around the center FAB — runs once mounted.
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
            ]),
        ).start();
    }, [pulse]);

    const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
    const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

    const TABS = [
        { name: "HomeTab", icon: Home, label: "الرئيسية" },
        { name: "ReelsTab", icon: Film, label: "ستوري" },
        { name: "_SPACER", icon: null, label: "" },
        { name: "ChatTab", icon: MessageCircle, label: "المحادثات" },
        { name: "ProfileTab", icon: User, label: "حسابي" },
    ];

    const goToPost = () => {
        Animated.sequence([
            Animated.spring(fabPress, { toValue: 0.88, useNativeDriver: true, speed: 50, bounciness: 0 }),
            Animated.spring(fabPress, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
        ]).start();
        navigation.getParent()?.navigate("Post");
    };

    return (
        <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            {/* Floating gradient FAB */}
            <View pointerEvents="box-none" style={styles.fabAnchor}>
                <Animated.View
                    pointerEvents="none"
                    style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]}
                />
                <Animated.View style={{ transform: [{ scale: fabPress }] }}>
                    <TouchableOpacity
                        onPress={goToPost}
                        activeOpacity={0.85}
                        style={styles.fab}
                        testID="tab-fab-post"
                        accessibilityLabel="نشر إعلان"
                    >
                        <LinearGradient
                            colors={["#5DC4F0", "#4FB6E6", "#2F95C9"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFillObject}
                        />
                        {/* glossy highlight */}
                        <View style={styles.fabShine} />
                        <Plus size={28} color="#fff" strokeWidth={3.2} />
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Glass pill */}
            <View style={styles.pillShadow}>
                <View style={styles.pill}>
                    {/* layered translucent overlays simulate frosted glass */}
                    <View pointerEvents="none" style={styles.glassFill} />
                    <View pointerEvents="none" style={styles.glassHighlight} />

                    {TABS.map((tab) => {
                        if (tab.name === "_SPACER") return <View key="spacer" style={styles.spacer} />;
                        const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
                        if (routeIndex === -1) return <View key={tab.name} style={styles.tabBtnGhost} />;
                        const focused = state.index === routeIndex;
                        const Icon = tab.icon;
                        const onPress = () => {
                            const ev = navigation.emit({ type: "tabPress", target: state.routes[routeIndex].key, canPreventDefault: true });
                            if (!focused && !ev.defaultPrevented) navigation.navigate(tab.name);
                        };
                        return (
                            <TouchableOpacity
                                key={tab.name}
                                onPress={onPress}
                                activeOpacity={0.7}
                                style={styles.tabBtn}
                                testID={`tab-${tab.name}`}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: focused }}
                            >
                                {focused && <View style={styles.activePill} />}
                                <Icon
                                    size={focused ? 23 : 21}
                                    color={focused ? ACTIVE : INACTIVE}
                                    strokeWidth={focused ? 2.6 : 2}
                                />
                                <Text style={[styles.tabLabel, { color: focused ? ACTIVE : INACTIVE, fontWeight: focused ? "900" : "700" }]} numberOfLines={1}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: "absolute", left: 0, right: 0, bottom: 0,
        alignItems: "center",
    },
    // Shadow wrapper so the pill itself can clip its translucent overlays.
    pillShadow: {
        marginHorizontal: 14,
        borderRadius: 36,
        shadowColor: "#0F1A35",
        shadowOpacity: 0.18,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 10 },
        elevation: 16,
    },
    pill: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-around",
        backgroundColor: "rgba(255,255,255,0.78)",
        borderRadius: 36,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.75)",
        paddingHorizontal: 6, paddingVertical: 8,
        minWidth: 320, maxWidth: 480,
        overflow: "hidden",
    },
    // Soft tint underlay → adds depth + frosted feel without a blur lib.
    glassFill: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(241,247,255,0.55)",
    },
    glassHighlight: {
        position: "absolute", left: 0, right: 0, top: 0, height: 14,
        backgroundColor: "rgba(255,255,255,0.55)",
    },
    tabBtn: {
        flex: 1, alignItems: "center", justifyContent: "center",
        paddingVertical: 8, paddingHorizontal: 6, borderRadius: 22,
        gap: 3,
    },
    tabBtnGhost: { width: 56 },
    // Subtle active background — kept inside the pill, no overlap with FAB
    activePill: {
        position: "absolute",
        top: 4, bottom: 4, left: 8, right: 8,
        backgroundColor: "rgba(79,182,230,0.14)",
        borderRadius: 18,
    },
    tabLabel: { fontSize: 10.5 },
    spacer: { width: 64 },

    // ===== FAB =====
    fabAnchor: {
        position: "absolute",
        bottom: 30, left: 0, right: 0,
        alignItems: "center", zIndex: 10,
    },
    fab: {
        width: 62, height: 62, borderRadius: 999,
        alignItems: "center", justifyContent: "center",
        borderWidth: 3, borderColor: "rgba(255,255,255,0.9)",
        overflow: "hidden",
        shadowColor: "#4FB6E6",
        shadowOpacity: 0.45,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 14,
    },
    fabShine: {
        position: "absolute", top: -12, left: -8,
        width: 36, height: 36, borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.55)",
        transform: [{ rotate: "-30deg" }],
    },
    pulseRing: {
        position: "absolute",
        width: 62, height: 62, borderRadius: 999,
        backgroundColor: "rgba(79,182,230,0.45)",
    },
});
