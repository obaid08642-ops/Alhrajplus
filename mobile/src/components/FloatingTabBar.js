// Custom BottomTabBar — visually matches web /app/frontend/src/components/layout/BottomNav.js
// Floating glass-pill with a center holographic "+" FAB.
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from "react-native";
import { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Home, Film, MessageCircle, Menu, Plus } from "lucide-react-native";
import { colors, shadow } from "../theme";

export default function FloatingTabBar({ state, descriptors, navigation }) {
    const insets = useSafeAreaInsets();
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
            ]),
        ).start();
    }, [pulse]);

    const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
    const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

    // Map tab route names to icon/label  — order matters; we splice in a center spacer
    const TABS = [
        { name: "HomeTab", icon: Home, label: "الرئيسية" },
        { name: "ReelsTab", icon: Film, label: "ستوري" },
        { name: "_SPACER", icon: null, label: "" }, // for center FAB
        { name: "ChatTab", icon: MessageCircle, label: "محادثة" },
        { name: "ProfileTab", icon: Menu, label: "المزيد" },
    ];

    const goToPost = () => {
        navigation.getParent()?.navigate("Post");
    };

    return (
        <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            {/* Floating "+" FAB with pulse rings */}
            <View pointerEvents="box-none" style={styles.fabAnchor}>
                <Animated.View pointerEvents="none" style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
                <TouchableOpacity onPress={goToPost} activeOpacity={0.85} style={styles.fab}>
                    <LinearGradient
                        colors={["#4FB6E6", "#7CCAEC", "#3AA9DD"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.fabShine} />
                    <Plus size={26} color="#fff" strokeWidth={3.2} />
                </TouchableOpacity>
            </View>

            {/* Glass pill */}
            <View style={[styles.pill, shadow.nav]}>
                {TABS.map((tab, i) => {
                    if (tab.name === "_SPACER") return <View key="spacer" style={styles.spacer} />;
                    const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
                    if (routeIndex === -1) return <View key={tab.name} style={{ width: 56 }} />;
                    const focused = state.index === routeIndex;
                    const Icon = tab.icon;
                    const onPress = () => {
                        const ev = navigation.emit({ type: "tabPress", target: state.routes[routeIndex].key, canPreventDefault: true });
                        if (!focused && !ev.defaultPrevented) navigation.navigate(tab.name);
                    };
                    return (
                        <TouchableOpacity key={tab.name} onPress={onPress} activeOpacity={0.7} style={[styles.tabBtn, focused && styles.tabBtnActive]}>
                            <Icon
                                size={22}
                                color={focused ? colors.navActive : colors.navInactive}
                                strokeWidth={focused ? 2.6 : 2}
                                fill={focused ? colors.navActive : "transparent"}
                            />
                            <Text style={[styles.tabLabel, { color: focused ? colors.navActive : "#7A9CBA" }]} numberOfLines={1}>{tab.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: "absolute", left: 0, right: 0, bottom: 0,
        alignItems: "center",
    },
    pill: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-around",
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: 32, borderWidth: 1, borderColor: "rgba(255,255,255,0.7)",
        paddingHorizontal: 6, paddingVertical: 6,
        marginHorizontal: 8,
        minWidth: 320, maxWidth: 460,
    },
    tabBtn: {
        flex: 1, alignItems: "center", justifyContent: "center", gap: 2,
        paddingVertical: 6, paddingHorizontal: 8, borderRadius: 18,
    },
    tabBtnActive: { backgroundColor: "rgba(79,182,230,0.18)" },
    tabLabel: { fontSize: 10, fontWeight: "800" },
    spacer: { width: 56 },
    fabAnchor: {
        position: "absolute", bottom: 28, left: 0, right: 0,
        alignItems: "center", zIndex: 10,
    },
    fab: {
        width: 56, height: 56, borderRadius: 999,
        alignItems: "center", justifyContent: "center",
        borderWidth: 2, borderColor: "rgba(255,255,255,0.6)",
        overflow: "hidden",
        ...shadow.fab,
    },
    fabShine: {
        position: "absolute", top: -10, left: -10,
        width: 30, height: 30, borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.55)",
    },
    pulseRing: {
        position: "absolute", width: 56, height: 56, borderRadius: 999,
        backgroundColor: "rgba(79,182,230,0.5)",
    },
});
