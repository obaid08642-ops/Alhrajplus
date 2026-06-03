// FloatingTabBar — owner-mandated design (Feb 2026, revision 2):
//  • Flush to the screen bottom (no gap). Bar SVG extends through the
//    iOS home-indicator safe-area so the surface color reaches the edge.
//  • Slim bar (48 px content height + safe inset for the home bar).
//  • Deep half-circle notch in the top edge — 80% of bar height — leaves
//    just a thin solid bottom strip (≈20%).
//  • Vertical lime-green capsule FAB ("أضف إعلان") sits INSIDE the notch
//    with a small transparent gap so the screen content shows through
//    between the capsule and the curve.
//  • Dark-mode aware (default light).
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, I18nManager, Dimensions } from "react-native";
import { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Home, Film, MessageCircle, User, Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useI18n } from "../I18nContext";
import { useThemeMode } from "../ThemeContext";

// ---- Dimensions (revision 3 — owner spec Feb 2026) ----
// • Slimmer bar (was 48 → 42 px) per "نقلل ارتفاعه ملي او ملي ونص".
// • Notch is a FULL semicircle that completely "cuts" the top edge so the
//   FAB capsule sits inside with a visible transparent gap (~0.5–1 mm) all
//   around it.
const BAR_HEIGHT = 42;
const NOTCH_RADIUS = 38;
const CORNER_RADIUS = 0;

// FAB capsule (vertical pill) — sized so a visible transparent gap remains
// between its curved edge and the notch curve on ALL sides.
const FAB_W = 56;
const FAB_H = 80;
// How far the FAB's BOTTOM dips below the bar's TOP edge.
const FAB_SUBMERGE = 30;

// Build the rounded-rect-with-top-notch SVG path.
function buildBarPath(W, totalH) {
  const cx = W / 2;
  const nr = NOTCH_RADIUS;
  // No corner radius (flush bar).
  return [
    `M 0 0`,
    `L ${cx - nr} 0`,
    // Concave half-circle dip — sweep=1 (clockwise) so curve goes DOWN into bar.
    `A ${nr} ${nr} 0 0 1 ${cx + nr} 0`,
    `L ${W} 0`,
    `L ${W} ${totalH}`,
    `L 0 ${totalH}`,
    `Z`,
  ].join(" ");
}

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const { t } = useI18n();
  const { isDark } = useThemeMode();
  const insets = useSafeAreaInsets();

  // Honour `tabBarStyle: { display: 'none' }` from useFocusEffect — used by
  // Reels and the chat-thread mode to hide the bar.
  const currentRoute = state.routes[state.index];
  const currentOpts = descriptors?.[currentRoute.key]?.options || {};
  const hidden = currentOpts.tabBarStyle?.display === "none" || currentOpts.tabBarVisible === false;

  const pulse = useRef(new Animated.Value(0)).current;
  const fabPress = useRef(new Animated.Value(1)).current;
  // Burst animation — fires once on press; lime ring expands & fades.
  const burst = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0] });

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
    // Subtle haptic + spring scale + lime burst → premium feel mirrored
    // from native iOS apps.
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
    Animated.sequence([
      Animated.spring(fabPress, { toValue: 0.86, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(fabPress, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 10 }),
    ]).start();
    burst.setValue(0);
    Animated.timing(burst, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    navigation.getParent()?.navigate("Post");
  };
  const burstScale = burst.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.2] });
  const burstOpacity = burst.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.85, 0.4, 0] });

  const W = Dimensions.get("window").width;
  // Bar SVG extends ALL the way down through the safe inset so the surface
  // color reaches the true bottom of the screen (no white margin).
  const barTotalH = BAR_HEIGHT + insets.bottom;
  const barPath = buildBarPath(W, barTotalH);

  const surface = isDark ? "#0F1B3A" : "#4FB6E6";
  const activeColor = "#FFFFFF";
  const inactiveColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.78)";

  // FAB vertical position — measured from the bottom of the wrap (screen bottom).
  // Wrap bottom = screen bottom = bar's true bottom. Bar's TOP edge is at
  // `barTotalH` from screen bottom. We want FAB submerged FAB_SUBMERGE px
  // INTO the bar, so FAB's bottom is at (barTotalH - FAB_SUBMERGE) from
  // screen bottom.
  const fabBottom = barTotalH - FAB_SUBMERGE;

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      {/* Lime-green FAB capsule floating above (and dipping into) the notch */}
      <View pointerEvents="box-none" style={[styles.fabAnchor, { bottom: fabBottom }]}>
        <Animated.View pointerEvents="none" style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
        {/* Burst — lime ring that explodes outwards on tap. */}
        <Animated.View pointerEvents="none" style={[styles.burstRing, { transform: [{ scale: burstScale }], opacity: burstOpacity }]} />
        <Animated.View style={{ transform: [{ scale: fabPress }] }}>
          <TouchableOpacity
            onPress={goToPost}
            activeOpacity={0.85}
            style={styles.fab}
            testID="tab-fab-post"
            accessibilityLabel={t("أضف إعلان")}
          >
            <Plus size={24} color="#0F2A1B" strokeWidth={3.2} />
            <Text style={styles.fabLabel} numberOfLines={1}>{t("أضف إعلان")}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Bar (SVG path with U-notch) */}
      <View style={[styles.barOuter, { width: W, height: barTotalH }]}>
        <Svg width={W} height={barTotalH} style={StyleSheet.absoluteFillObject}>
          <Path d={barPath} fill={surface} />
        </Svg>

        {/* Tabs row — sits in the visible BAR_HEIGHT zone (above the safe
            inset). Labels never overlap the iOS home-indicator. */}
        <View style={[styles.tabsRow, { height: BAR_HEIGHT, paddingBottom: 0 }]}>
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
                <Icon size={18} color={focused ? activeColor : inactiveColor} strokeWidth={focused ? 2.6 : 2} />
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
    paddingHorizontal: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  spacer: {
    // Reserve horizontal space matching the notch + small horizontal padding.
    width: NOTCH_RADIUS * 2 + 8,
  },
  tabLabel: {
    fontSize: 9.5,
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
    height: FAB_H,
    justifyContent: "flex-end", // anchor by FAB's BOTTOM so `bottom` prop aligns its base.
  },
  fab: {
    width: FAB_W,
    height: FAB_H,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B5E61D",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    paddingHorizontal: 4,
    paddingVertical: 8,
    overflow: "hidden",
    shadowColor: "#B5E61D",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  fabLabel: {
    color: "#0F2A1B",
    fontSize: 9.5,
    fontWeight: "900",
    marginTop: 2,
    textAlign: "center",
  },
  pulseRing: {
    position: "absolute",
    bottom: 0,
    width: FAB_W + 14,
    height: FAB_H + 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(181,230,29,0.45)",
    backgroundColor: "transparent",
  },
  burstRing: {
    position: "absolute",
    bottom: 6,
    width: FAB_W + 10,
    height: FAB_H + 10,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "#B5E61D",
    backgroundColor: "transparent",
  },
});
