// FloatingTabBar — premium pill-shaped glass tab bar with a floating
// gradient FAB in the center. Pure RN (no expo-blur dependency) so it
// runs on every Expo + bare RN build.
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Platform, I18nManager } from "react-native";
import { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, MoreHorizontal, MessageCircle, User, Plus } from "lucide-react-native";
import { colors } from "../theme";
import { useI18n } from "../I18nContext";
const ACTIVE = "#89CFF0";
const INACTIVE = "#9AA8B5";
export default function FloatingTabBar({
  state,
  descriptors,
  navigation
}) {
  const { t } = useI18n();

  // CRITICAL: respect the active route's `tabBarStyle: { display: "none" }`
  // option so screens like Reels can hide the tab bar via useFocusEffect.
  // Our custom tab bar doesn't get this for free — must opt in here.
  const currentRoute = state.routes[state.index];
  const currentOpts = descriptors?.[currentRoute.key]?.options || {};
  const hidden = currentOpts.tabBarStyle?.display === "none" || currentOpts.tabBarVisible === false;
  
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(0)).current;
  const fabPress = useRef(new Animated.Value(1)).current;

  // Soft pulse around the center FAB — runs once mounted.
  useEffect(() => {
    Animated.loop(Animated.sequence([Animated.timing(pulse, {
      toValue: 1,
      duration: 1600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true
    }), Animated.timing(pulse, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true
    })])).start();
  }, [pulse]);
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.55]
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0]
  });
  const TABS_LTR = [{
    name: "HomeTab",
    icon: Home,
    label: t("الرئيسية")
  }, {
    name: "ReelsTab",
    icon: MoreHorizontal,
    label: t("المزيد")
  }, {
    name: "_SPACER",
    icon: null,
    label: ""
  }, {
    name: "ChatTab",
    icon: MessageCircle,
    label: t("المحادثات")
  }, {
    name: "ProfileTab",
    icon: User,
    label: t("حسابي")
  }];
  // RTL (Arabic/Urdu): Home must appear on the RIGHT to match reading direction.
  // We reverse the array so visually: Profile | Chat | [FAB] | Reels | Home.
  const TABS = I18nManager.isRTL ? [...TABS_LTR].reverse() : TABS_LTR;

  // After all hooks have been called — bail out if the active route asked us
  // to hide. Returning null here keeps Reels truly full-screen.
  if (hidden) return null;

  const goToPost = () => {
    Animated.sequence([Animated.spring(fabPress, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0
    }), Animated.spring(fabPress, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8
    })]).start();
    navigation.getParent()?.navigate("Post");
  };
  return <View pointerEvents="box-none" style={[styles.wrap, {
    paddingBottom: Math.max(insets.bottom, 10)
  }]}>
            {/* Floating gradient FAB — freestanding circular button with an
                 outer translucent halo (rgba(255,140,0,0.10)) so it visually
                 detaches from the glass pill underneath. */}
            <View pointerEvents="box-none" style={styles.fabAnchor}>
                <Animated.View pointerEvents="none" style={[styles.pulseRing, {
        transform: [{
          scale: pulseScale
        }],
        opacity: pulseOpacity
      }]} />
                <Animated.View style={{
        transform: [{
          scale: fabPress
        }]
      }}>
                    <View style={styles.fabHalo}>
                        <TouchableOpacity onPress={goToPost} activeOpacity={0.85} style={styles.fab} testID="tab-fab-post" accessibilityLabel={t("نشر إعلان")}>
                            <LinearGradient colors={["#FFB04A", "#FF8C00"]} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={StyleSheet.absoluteFillObject} />
                            {/* glossy highlight */}
                            <View style={styles.fabShine} />
                            <Plus size={28} color="#fff" strokeWidth={3.2} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>

            {/* Glass pill */}
            <View style={styles.pillShadow}>
                <View style={styles.pill}>
                    {/* layered translucent overlays simulate frosted glass */}
                    <View pointerEvents="none" style={styles.glassFill} />
                    <View pointerEvents="none" style={styles.glassHighlight} />

                    {TABS.map(tab => {
          if (tab.name === "_SPACER") return <View key="spacer" style={styles.spacer} />;
          const routeIndex = state.routes.findIndex(r => r.name === tab.name);
          if (routeIndex === -1) return <View key={tab.name} style={styles.tabBtnGhost} />;
          const focused = state.index === routeIndex;
          const Icon = tab.icon;
          const onPress = () => {
            const ev = navigation.emit({
              type: "tabPress",
              target: state.routes[routeIndex].key,
              canPreventDefault: true
            });
            if (!focused && !ev.defaultPrevented) navigation.navigate(tab.name);
          };
          return <TouchableOpacity key={tab.name} onPress={onPress} activeOpacity={0.7} style={styles.tabBtn} testID={`tab-${tab.name}`} accessibilityRole="tab" accessibilityState={{
            selected: focused
          }}>
                                {focused && <View style={styles.activePill} />}
                                <Icon size={22} color={focused ? ACTIVE : INACTIVE} strokeWidth={focused ? 2.6 : 2} />
                                <Text style={[styles.tabLabel, {
              color: focused ? ACTIVE : INACTIVE,
              fontWeight: focused ? "900" : "700"
            }]} numberOfLines={1}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>;
        })}
                </View>
            </View>
        </View>;
}
const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center"
  },
  // Shadow wrapper so the pill itself can clip its translucent overlays.
  pillShadow: {
    marginHorizontal: 14,
    borderRadius: 36,
    shadowColor: "#0F1A35",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 10
    },
    elevation: 16
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.78)",
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    paddingHorizontal: 6,
    paddingVertical: 8,
    minWidth: 320,
    maxWidth: 480,
    overflow: "hidden"
  },
  // Soft tint underlay → adds depth + frosted feel without a blur lib.
  glassFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(241,247,255,0.55)"
  },
  glassHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.55)"
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 22,
    gap: 4
  },
  tabBtnGhost: {
    width: 56
  },
  // Subtle active background — kept inside the pill, no overlap with FAB
  activePill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 8,
    right: 8,
    backgroundColor: "rgba(137,207,240,0.18)",
    borderRadius: 18
  },
  tabLabel: {
    fontSize: 10.5,
    textAlign: "center",
    includeFontPadding: false
  },
  spacer: {
    width: 64
  },
  // ===== FAB =====
  fabAnchor: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10
  },
  fabHalo: {
    // Outer transparent halo — soft baby-blue glow (mirrors owner reference).
    padding: 6,
    borderRadius: 999,
    backgroundColor: "rgba(137,207,240,0.14)"
  },
  fab: {
    width: 68,
    height: 68,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#89CFF0",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#89CFF0",
    shadowOpacity: 0.50,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10
    },
    elevation: 16
  },
  fabLabel: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 1
  },
  fabShine: {
    position: "absolute",
    top: -12,
    left: -8,
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
    transform: [{
      rotate: "-30deg"
    }]
  },
  pulseRing: {
    position: "absolute",
    width: 68,
    height: 68,
    borderRadius: 999,
    backgroundColor: "rgba(137,207,240,0.45)"
  }
});;