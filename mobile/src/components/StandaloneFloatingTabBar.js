// StandaloneFloatingTabBar — same visual as FloatingTabBar but designed to
// be embedded inside non-tab screens (e.g. Map, which is a Stack screen).
// Uses the navigation ref directly instead of bottom-tab navigator state.
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, I18nManager, Dimensions } from "react-native";
import { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Home, Film, MessageCircle, User, Plus } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../I18nContext";
import { useThemeMode } from "../ThemeContext";

const BAR_HEIGHT = 48;
const NOTCH_RADIUS = 38;
const FAB_W = 60;
const FAB_H = 84;
const FAB_SUBMERGE = 22;

function buildBarPath(W, totalH) {
  const cx = W / 2;
  const nr = NOTCH_RADIUS;
  return [
    `M 0 0`,
    `L ${cx - nr} 0`,
    `A ${nr} ${nr} 0 0 1 ${cx + nr} 0`,
    `L ${W} 0`,
    `L ${W} ${totalH}`,
    `L 0 ${totalH}`,
    `Z`,
  ].join(" ");
}

// activeKey: which tab is logically active for this standalone screen (e.g.
//            pass "Home" when on Map so the home icon stays the highlight).
export default function StandaloneFloatingTabBar({ activeKey = null }) {
  const { t } = useI18n();
  const { isDark } = useThemeMode();
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
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
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0] });

  // Navigate to a tab via the Main stack screen (Tab navigator nested).
  const goToTab = (tabName) => {
    nav.navigate("Main", { screen: tabName });
  };

  const TABS_LTR = [
    { key: "HomeTab",    icon: Home,          label: t("الرئيسية") },
    { key: "ReelsTab",   icon: Film,          label: t("قصص") },
    { key: "_SPACER",    icon: null,          label: "" },
    { key: "ChatTab",    icon: MessageCircle, label: t("رسائلي") },
    { key: "ProfileTab", icon: User,          label: t("حسابي") },
  ];
  const TABS = I18nManager.isRTL ? [...TABS_LTR].reverse() : TABS_LTR;

  const goToPost = () => {
    Animated.sequence([
      Animated.spring(fabPress, { toValue: 0.88, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(fabPress, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();
    nav.navigate("Post");
  };

  const W = Dimensions.get("window").width;
  const barTotalH = BAR_HEIGHT + insets.bottom;
  const barPath = buildBarPath(W, barTotalH);
  const surface = isDark ? "#0F1B3A" : "#4FB6E6";
  const activeColor = "#FFFFFF";
  const inactiveColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.78)";
  const fabBottom = barTotalH - FAB_SUBMERGE;

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View pointerEvents="box-none" style={[styles.fabAnchor, { bottom: fabBottom }]}>
        <Animated.View pointerEvents="none" style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
        <Animated.View style={{ transform: [{ scale: fabPress }] }}>
          <TouchableOpacity
            onPress={goToPost}
            activeOpacity={0.85}
            style={styles.fab}
            testID="standalone-tab-fab"
            accessibilityLabel={t("أضف إعلان")}
          >
            <Plus size={24} color="#0F2A1B" strokeWidth={3.2} />
            <Text style={styles.fabLabel} numberOfLines={1}>{t("أضف إعلان")}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={[styles.barOuter, { width: W, height: barTotalH }]}>
        <Svg width={W} height={barTotalH} style={StyleSheet.absoluteFillObject}>
          <Path d={barPath} fill={surface} />
        </Svg>
        <View style={[styles.tabsRow, { height: BAR_HEIGHT }]}>
          {TABS.map((tab) => {
            if (tab.key === "_SPACER") return <View key="spacer" style={styles.spacer} />;
            const focused = activeKey === tab.key;
            const Icon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => goToTab(tab.key)}
                activeOpacity={0.7}
                style={styles.tabBtn}
                testID={`standalone-tab-${tab.key}`}
              >
                <Icon size={20} color={focused ? activeColor : inactiveColor} strokeWidth={focused ? 2.6 : 2} />
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
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center" },
  barOuter: { position: "relative" },
  tabsRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6 },
  tabBtn: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  spacer: { width: NOTCH_RADIUS * 2 + 8 },
  tabLabel: { fontSize: 10.5, textAlign: "center", includeFontPadding: false },
  fabAnchor: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 10, height: FAB_H, justifyContent: "flex-end" },
  fab: {
    width: FAB_W, height: FAB_H, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#B5E61D", borderWidth: 2, borderColor: "#FFFFFF",
    paddingHorizontal: 4, paddingVertical: 8, overflow: "hidden",
    shadowColor: "#B5E61D", shadowOpacity: 0.45, shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 }, elevation: 12,
  },
  fabLabel: { color: "#0F2A1B", fontSize: 9.5, fontWeight: "900", marginTop: 2, textAlign: "center" },
  pulseRing: {
    position: "absolute", bottom: 0,
    width: FAB_W + 14, height: FAB_H + 14, borderRadius: 999,
    backgroundColor: "rgba(181,230,29,0.30)",
  },
});
