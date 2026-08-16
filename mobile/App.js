import "react-native-gesture-handler";

// ---------- Runtime crash trap ----------
// Captures the FIRST uncaught error during bundle evaluation OR initial render
// so it shows up clearly on Expo Go instead of a generic "App entry not found".
// Stored in globalThis so ErrorBoundary can render it on screen.
if (typeof global !== "undefined" && global.ErrorUtils && !global.__APP_CRASH_TRAP_INSTALLED__) {
    global.__APP_CRASH_TRAP_INSTALLED__ = true;
    const prev = global.ErrorUtils.getGlobalHandler && global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((err, isFatal) => {
        try {
            global.__APP_RUNTIME_ERROR__ = {
                message: String(err && err.message) || String(err),
                stack: String(err && err.stack || "").split("\n").slice(0, 25).join("\n"),
                isFatal: !!isFatal,
                at: Date.now(),
            };
            // eslint-disable-next-line no-console
            console.error("[APP_RUNTIME_ERROR]", global.__APP_RUNTIME_ERROR__);
        } catch (_) {}
        if (prev) prev(err, isFatal);
    });
}

import { useEffect, useRef } from "react";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, I18nManager, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import FloatingTabBar from "./src/components/FloatingTabBar";
import AIAssistantFab from "./src/components/AIAssistantFab";
import { AuthProvider, useAuth } from "./src/AuthContext";
import ErrorBoundary from "./src/ErrorBoundary";
import { I18nProvider } from "./src/I18nContext";
import { CountryProvider } from "./src/CountryContext";
import { ThemeModeProvider, useThemeMode } from "./src/ThemeContext";
import HomeScreen from "./src/screens/HomeScreen";
import { LoginScreen, RegisterScreen } from "./src/screens/AuthScreens";
import { ForgotPasswordScreen, ResetPasswordScreen } from "./src/screens/PasswordReset";
import { CategoriesScreen, CategoryListingsScreen, NotificationsScreen, SettingsScreen, StaticPageScreen, NotifSettingsScreen, SavedSearchesScreen, FollowingScreen } from "./src/screens/MoreScreens";
import SearchScreen from "./src/screens/SearchScreen";
import SellerProfileScreen from "./src/screens/SellerProfile";
import OffersScreen from "./src/screens/OffersScreen";
import ListingDetailScreen from "./src/screens/ListingDetailScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import PostScreen from "./src/screens/PostScreen";
import ChatScreen from "./src/screens/ChatScreen";
import MapScreen from "./src/screens/MapScreen";
import ReelsScreen from "./src/screens/ReelsScreen";
import { FavoritesScreen, MyListingsScreen, DealsScreen } from "./src/screens/OtherScreens";
import AuctionsScreen from "./src/screens/AuctionsScreen";
import FlightsScreen from "./src/screens/FlightsScreen";
import WalletScreen from "./src/screens/WalletScreen";
import AIAssistantScreen from "./src/screens/AIAssistantScreen";
import { theme, colors } from "./src/theme";
import { registerForNotifications, setNotificationNavigationRef } from "./src/notifications";
import { useI18n } from "./src/I18nContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Apply RTL synchronously at module load based on the user's *saved* language —
// NOT the system locale. Arabic + Urdu = RTL; everything else = LTR.
// This guarantees the very first render uses the correct direction so we
// don't need a forced reload on language change.
try {
    // Best-effort sync read of AsyncStorage isn't possible; instead we use
    // the value persisted by getItemSync polyfill if available. As a fallback
    // we leave whatever I18nManager has and let setLang() correct it later.
    AsyncStorage.getItem("hp_lang").then((saved) => {
        const wantRTL = saved === "ar" || saved === "ur" || (!saved);
        if (I18nManager.isRTL !== wantRTL) {
            I18nManager.allowRTL(wantRTL);
            I18nManager.forceRTL(wantRTL);
        }
    }).catch(() => {});
} catch (_) {}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabsNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <FloatingTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} />
            <Tab.Screen
              name="ReelsTab"
              component={ReelsScreen}
              options={{ tabBarStyle: { display: "none" } }}
            />
            <Tab.Screen name="ChatTab" component={ChatScreen} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

function Navigation() {
    const { user, loading } = useAuth();
    const { t } = useI18n();
    // Container-level ref — works OUTSIDE any navigator (unlike useNavigation).
    // Passed down to the global floating FAB so it can navigate without hooks.
    const navRef = useNavigationContainerRef();

    useEffect(() => {
        if (user) registerForNotifications();
    }, [user]);

    // Deep-link config so notifications/URLs route to the right screen.
    const linking = {
        prefixes: [Linking.createURL("/"), "harajplus://", "https://alhraj.online", "https://alhrajplus.com"],
        config: {
            screens: {
                Main: {
                    screens: {
                        HomeTab: "",
                        ReelsTab: "reels",
                        ChatTab: "chat",
                        ProfileTab: "profile",
                    },
                },
                ListingDetail: "listing/:id",
                SellerProfile: "seller/:sellerId",
                Chat: "chat-thread/:to?",
                CategoryListings: "category/:categoryKey",
                Categories: "categories",
                Search: "search",
                Map: "map",
                Wallet: "wallet",
                Notifications: "notifications",
                Auctions: "auctions",
                Flights: "flights",
                Deals: "deals",
                MyListings: "my-listings",
                Favorites: "favorites",
                Post: "post",
                AIAssistant: "ai",
                Settings: "settings",
                NotifSettings: "settings/notifications",
                SavedSearches: "saved-searches",
                Following: "following",
                StaticPage: "page/:slug",
                Login: "login",
                Register: "register",
                ForgotPassword: "forgot-password",
                ResetPassword: "reset-password",
            },
        },
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.bg }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer
            ref={navRef}
            linking={linking}
            onReady={() => setNotificationNavigationRef(navRef.current)}
        >
            <Stack.Navigator
                screenOptions={{
                    headerStyle: { backgroundColor: colors.surface, height: 52 },
                    headerTitleStyle: { fontWeight: "800", color: colors.text, fontSize: 15 },
                    headerTintColor: colors.primary,
                    headerShadowVisible: false,
                    headerTitleAlign: "center",
                }}
            >
                {/* Main tabs are accessible to guests too — auth-required actions push Login */}
                <Stack.Screen name="Main" component={TabsNavigator} options={{ headerShown: false }} />
                <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: t("تفاصيل الإعلان") }} />
                <Stack.Screen name="Post" component={PostScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: t("المفضلة") }} />
                <Stack.Screen name="MyListings" component={MyListingsScreen} options={{ title: t("إعلاناتي") }} />
                <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: t("التصنيفات") }} />
                <Stack.Screen name="CategoryListings" component={CategoryListingsScreen} options={({ route }) => ({ title: route.params?.name || "" })} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: t("الإشعارات") }} />
                <Stack.Screen name="NotifSettings" component={NotifSettingsScreen} options={{ title: t("إعدادات الإشعارات") }} />
                <Stack.Screen name="SavedSearches" component={SavedSearchesScreen} options={{ title: t("الأبحاث المحفوظة") }} />
                <Stack.Screen name="Following" component={FollowingScreen} options={{ title: t("متابعاتي") }} />
                <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t("الإعدادات") }} />
                <Stack.Screen name="StaticPage" component={StaticPageScreen} options={{ title: "" }} />
                <Stack.Screen name="SellerProfile" component={SellerProfileScreen} options={{ title: t("الملف الشخصي للبائع") }} />
                <Stack.Screen name="Offers" component={OffersScreen} options={{ title: t("العروض والمفاوضات") }} />
                <Stack.Screen name="Map" component={MapScreen} options={{ title: t("الخريطة") }} />
                <Stack.Screen name="Deals" component={DealsScreen} options={{ title: t("صفقات اليوم") }} />
                <Stack.Screen name="Auctions" component={AuctionsScreen} options={{ title: t("المزادات") }} />
                <Stack.Screen name="Flights" component={FlightsScreen} options={{ title: t("حجز الطيران") }} />
                <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: t("محفظتي") }} />
                <Stack.Screen name="AIAssistant" component={AIAssistantScreen} options={{ title: t("المساعد الذكي") }} />
                {/* Auth screens — always available so guests can sign up */}
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Register" component={RegisterScreen} options={{ title: t("إنشاء حساب") }} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: t("نسيت كلمة المرور؟") }} />
                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: t("إعادة تعيين كلمة المرور") }} />
            </Stack.Navigator>
            {/* Global floating AI assistant — draggable, closable, persists position.
                Receives the container ref so it can navigate without using
                useNavigation (which would crash since it's outside any navigator). */}
            <AIAssistantFab navRef={navRef} />
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <I18nProvider>
                    <ThemeModeProvider>
                        <AuthProvider>
                            <CountryProvider>
                                <Navigation />
                                <ThemedStatusBar />
                            </CountryProvider>
                        </AuthProvider>
                    </ThemeModeProvider>
                </I18nProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}

function ThemedStatusBar() {
    const { isDark } = useThemeMode();
    return <StatusBar style={isDark ? "light" : "dark"} />;
}
