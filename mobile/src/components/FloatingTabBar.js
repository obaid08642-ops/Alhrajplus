// FloatingTabBar — floating publication action with a transparent notch.
// The bar color follows the administrator-controlled navigation theme.
// The lime-green capsule is intentionally independent and hangs over a real
// SVG cut-out so page content remains visible around it.
import { View, Text, TouchableOpacity, StyleSheet, Animated, I18nManager, Dimensions } from "react-native";
import { useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Home, Film, MessageCircle, User, Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useI18n } from "../I18nContext";
import { useThemeMode } from "../ThemeContext";

const BAR_HEIGHT = 36;
const HOLE_RADIUS = 46;
const FAB_W = 52;
const FAB_H = 74;
const FAB_SUBMERGE = 30;
const FLOATING_FAB_COLOR = "#B7F20A";
const FLOATING_FAB_FOREGROUND = "#062C1F";

// The inner circle is a true hole through the SVG bar. No white or blurred
// backing view is rendered behind the capsule, so page content shows through.
function buildBarPath(W, totalH) {
  const cx = W / 2;
  const r = HOLE_RADIUS;
  return [
    `M 0 0`,
    `L ${W} 0`,
    `L ${W} ${totalH}`,
    `L 0 ${totalH}`,
    `Z`,
    `M ${cx - r} 0`,
    `a ${r} ${r} 0 1 0 ${r * 2} 0`,
    `a ${r} ${r} 0 1 0 ${-r * 2} 0`,
    `Z`,
  ].join(" ");
}

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const { t } = useI18n();
  const { isDark, palette } = useThemeMode();
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index];
  const currentOpts = descriptors?.[currentRoute.key]?.options || {};
  const hidden = currentOpts.tabBarStyle?.display === "none" || currentOpts.tabBarVisible === false;
  const fabPress = useRef(new Animated.Value(1)).current;

  const TABS_LTR = [
    { name: "HomeTab", icon: Home, label: t("الرئيسية") },
    { name: "ReelsTab", icon: Film, label: t("قصص") },
    { name: "_SPACER", icon: null, label: "" },
    { name: "ChatTab", icon: MessageCircle, label: t("رسائلي") },
    { name: "ProfileTab", icon: User, label: t("حسابي") },
  ];
  const TABS = I18nManager.isRTL ? [...TABS_LTR].reverse() : TABS_LTR;

  if (hidden) return null;

  const goToPost = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
    Animated.sequence([
      Animated.spring(fabPress, { toValue: 0.86, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(fabPress, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 10 }),
    ]).start();
    navigation.getParent()?.navigate("Post");
  };

  const W = Dimensions.get("window").width;
  const barTotalH = BAR_HEIGHT + insets.bottom;
  const barPath = buildBarPath(W, barTotalH);
  const surface = palette.navBg || palette.primary;
  const activeColor = palette.navActive || (isDark ? palette.text : palette.primaryFg);
  const inactiveColor = palette.navInactive || (isDark ? "rgba(231,238,248,0.78)" : "rgba(255,255,255,0.78)");
  const fabBottom = barTotalH - FAB_SUBMERGE;

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View pointerEvents="box-none" style={[styles.fabAnchor, { bottom: fabBottom }]}>
        <Animated.View style={{ transform: [{ scale: fabPress }] }}>
          <TouchableOpacity
            onPress={goToPost}
            activeOpacity={0.85}
            style={styles.fab}
            testID="tab-fab-post"
            accessibilityLabel={t("أضف إعلان")}
          >
            <Plus size={24} color={FLOATING_FAB_FOREGROUND} strokeWidth={3.2} />
            <Text style={styles.fabLabel} numberOfLines={1}>{t("أضف إعلان")}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={[styles.barOuter, { width: W, height: barTotalH }]}>
        <Svg width={W} height={barTotalH} style={StyleSheet.absoluteFillObject}>
          <Path d={barPath} fill={surface} fillRule="evenodd" />
        </Svg>

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
                accessibilityLabel={tab.label}
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
    width: HOLE_RADIUS * 2 + 8,
  },
  tabLabel: {
    fontSize: 9.5,
    textAlign: "center",
    includeFontPadding: false,
  },
  fabAnchor: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
    height: FAB_H,
    justifyContent: "flex-end",
  },
  fab: {
    width: FAB_W,
    height: FAB_H,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: FLOATING_FAB_COLOR,
    paddingHorizontal: 4,
    paddingVertical: 8,
    shadowColor: "#02201A",
    shadowOpacity: 0.30,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  fabLabel: {
    color: FLOATING_FAB_FOREGROUND,
    fontSize: 9.5,
    fontWeight: "900",
    marginTop: 2,
    textAlign: "center",
  },
});
