// FloatingTabBar — owner-mandated design (Feb 2026):
//  • Solid sky-blue (or dark) bar pinned to the screen bottom.
//  • A U-shaped concave notch in the center where a lime-green vertical
//    capsule FAB ("أضف إعلان") sits with a soft white glow halo.
//  • Tab labels (RTL): الرئيسية | قصص | [+] | رسائلي | حسابي.
//  • Default theme = light (sky blue surface). When the user enables Dark
//    Mode via the home toggle, the bar switches to a deep navy surface.
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, I18nManager, Dimensions } from "react-native";
import { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Home, Film, MessageCircle, User, Plus } from "lucide-react-native";
import { useI18n } from "../I18nContext";
import { useThemeMode } from "../ThemeContext";

const BAR_HEIGHT = 72;
const NOTCH_RADIUS = 40;      // half the notch width
const CORNER_RADIUS = 26;
const SIDE_MARGIN = 0;        // full-bleed bar (touches left/right edges)

// FAB dimensions — vertical capsule (taller than wide).
const FAB_W = 72;
const FAB_H = 96;
const FAB_TOP_OFFSET = 26;    // how far above the bar the FAB sits

// Build the SVG path for a rounded rect with a concave top-center notch.
function buildBarPath(W, H) {
  const cx = W / 2;
  const cr = CORNER_RADIUS;
  const nr = NOTCH_RADIUS;
  return [
    `M ${cr} 0`,
    `L ${cx - nr} 0`,
    // concave dip — sweep flag 1 = clockwise (curve dips DOWN into the bar).
    `A ${nr} ${nr} 0 0 1 ${cx + nr} 0`,
    `L ${W - cr} 0`,
    `A ${cr} ${cr} 0 0 1 ${W} ${cr}`,
    `L ${W} ${H - cr}`,
    `A ${cr} ${cr} 0 0 1 ${W - cr} ${H}`,
    `L ${cr} ${H}`,
    `A ${cr} ${cr} 0 0 1 0 ${H - cr}`,
    `L 0 ${cr}`,
    `A ${cr} ${cr} 0 0 1 ${cr} 0`,
    "Z",
  ].join(" ");
}

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const { t } = useI18n();
  const { isDark } = useThemeMode();

  // Respect a screen's `tabBarStyle: { display: 'none' }` request so screens
  // like Reels can hide the bar via useFocusEffect.
  const currentRoute = state.routes[state.index];
  const currentOpts = descriptors?.[currentRoute.key]?.options || {};
  const hidden = currentOpts.tabBarStyle?.display === "none" || currentOpts.tabBarVisible === false;

  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(0)).current;
  const fabPress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  // Tab ordering — LTR base; reversed for RTL languages (Arabic/Urdu).
  const TABS_LTR = [
    { name: "HomeTab",    icon: Home,          label: t("الرئيسية") },
    { name: "ReelsTab",   icon: Film,          label: t("قصص") },
    { name: "_SPACER",    icon: null,          label: "" },
    { name: "ChatTab",    icon: MessageCircle, label: t("رسائلي") },
    { name: "ProfileTab", icon: User,          label: t("حسابي") },
  ];
  const TABS = I18nManager.isRTL ? [...TABS_LTR].reverse() : TABS_LTR;

  if (hidden) return null;

  const goToPost = () => {
    Animated.sequence([
      Animated.spring(fabPress, { toValue: 0.88, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(fabPress, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();
    navigation.getParent()?.navigate("Post");
  };

  const W = Dimensions.get("window").width - SIDE_MARGIN * 2;
  const barPath = buildBarPath(W, BAR_HEIGHT);

  // Surface colors — light = sky blue (mockup); dark = deep navy.
  const surface = isDark ? "#0F1B3A" : "#4FB6E6";
  const surfaceDeep = isDark ? "#152244" : "#3AA9DD";
  const activeColor = "#FFFFFF";
  const inactiveColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.78)";

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: insets.bottom }]}>
      {/* Lime-green FAB floating above the notch */}
      <View pointerEvents="box-none" style={[styles.fabAnchor, { bottom: BAR_HEIGHT + insets.bottom - FAB_TOP_OFFSET }]}>
        <Animated.View pointerEvents="none" style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
        <Animated.View style={{ transform: [{ scale: fabPress }] }}>
          <View style={styles.fabHalo}>
            <TouchableOpacity
              onPress={goToPost}
              activeOpacity={0.85}
              style={styles.fab}
              testID="tab-fab-post"
              accessibilityLabel={t("أضف إعلان")}
            >
              <Plus size={26} color="#0F2A1B" strokeWidth={3.2} />
              <Text style={styles.fabLabel} numberOfLines={1}>{t("أضف إعلان")}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* SVG bar shape with U-notch */}
      <View style={[styles.barOuter, { width: W, height: BAR_HEIGHT }]}>
        <Svg width={W} height={BAR_HEIGHT} style={StyleSheet.absoluteFillObject}>
          <Path d={barPath} fill={surface} />
        </Svg>
        {/* Soft deeper-tint overlay for visual depth (under tabs) */}
        <Svg width={W} height={BAR_HEIGHT} style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Path d={barPath} fill={surfaceDeep} opacity={0.18} />
        </Svg>

        {/* Tabs row */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            if (tab.name === "_SPACER") return <View key="spacer" style={styles.spacer} />;
            const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
            if (routeIndex === -1) return <View key={tab.name} style={styles.spacer} />;
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
                <Icon size={22} color={focused ? activeColor : inactiveColor} strokeWidth={focused ? 2.6 : 2} />
                <Text style={[styles.tabLabel, { color: focused ? activeColor : inactiveColor, fontWeight: focused ? "900" : "700" }]} numberOfLines={1}>
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
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  barOuter: {
    position: "relative",
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    height: BAR_HEIGHT,
    paddingHorizontal: 8,
    // Push tab labels slightly down (below the notch curve at top center).
    paddingTop: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  spacer: {
    // Reserve space for the FAB notch in the center.
    width: NOTCH_RADIUS * 2 + 12,
  },
  tabLabel: {
    fontSize: 11,
    textAlign: "center",
    includeFontPadding: false,
  },
  // ===== FAB =====
  fabAnchor: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  fabHalo: {
    // Soft white-yellow glow ring around the lime capsule.
    padding: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
    shadowColor: "#B5E61D",
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  fab: {
    width: FAB_W,
    height: FAB_H,
    borderRadius: 999, // very large → renders as a vertical capsule because height > width.
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B5E61D",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    paddingHorizontal: 4,
    paddingVertical: 8,
    overflow: "hidden",
  },
  fabLabel: {
    color: "#0F2A1B",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2,
    textAlign: "center",
  },
  pulseRing: {
    position: "absolute",
    width: FAB_W + 16,
    height: FAB_H + 16,
    borderRadius: 999,
    backgroundColor: "rgba(181,230,29,0.35)",
  },
});
