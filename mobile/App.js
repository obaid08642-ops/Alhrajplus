import "react-native-gesture-handler";
import { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, I18nManager, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import FloatingTabBar from "./src/components/FloatingTabBar";
import { AuthProvider, useAuth } from "./src/AuthContext";
import { I18nProvider } from "./src/I18nContext";
import { CountryProvider } from "./src/CountryContext";
import HomeScreen from "./src/screens/HomeScreen";
import { LoginScreen, RegisterScreen } from "./src/screens/AuthScreens";
import { ForgotPasswordScreen, ResetPasswordScreen } from "./src/screens/PasswordReset";
import { CategoriesScreen, CategoryListingsScreen, NotificationsScreen, SettingsScreen, StaticPageScreen, NotifSettingsScreen, SavedSearchesScreen, FollowingScreen } from "./src/screens/MoreScreens";
import SearchScreen from "./src/screens/SearchScreen";
import SellerProfileScreen from "./src/screens/SellerProfile";
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

try {
    // Only force RTL for Arabic UI. Other locales (en/hi/fr) need LTR.
    const isArabic = (I18nManager.getConstants?.()?.localeIdentifier || "").startsWith("ar");
    if (isArabic && !I18nManager.isRTL) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
    } else if (!isArabic && I18nManager.isRTL) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(false);
    }
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
            <Tab.Screen name="ReelsTab" component={ReelsScreen} />
            <Tab.Screen name="ChatTab" component={ChatScreen} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

function Navigation() {
    const { user, loading } = useAuth();
    const { t } = useI18n();
    const navRef = useRef(null);

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
                    headerStyle: { backgroundColor: colors.surface },
                    headerTitleStyle: { fontWeight: "800", color: colors.text },
                    headerTintColor: colors.primary,
                    headerShadowVisible: false,
                }}
            >
                {/* Main tabs are accessible to guests too — auth-required actions push Login */}
                <Stack.Screen name="Main" component={TabsNavigator} options={{ headerShown: false }} />
                <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: t("تفاصيل الإعلان") }} />
                <Stack.Screen name="Post" component={PostScreen} options={{ title: t("إضافة إعلان") }} />
                <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: t("المفضلة") }} />
                <Stack.Screen name="MyListings" component={MyListingsScreen} options={{ title: t("إعلاناتي") }} />
                <Stack.Screen name="Chat" component={ChatScreen} options={{ title: t("الرسائل") }} />
                <Stack.Screen name="Search" component={SearchScreen} options={{ title: t("بحث") }} />
                <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: t("التصنيفات") }} />
                <Stack.Screen name="CategoryListings" component={CategoryListingsScreen} options={({ route }) => ({ title: route.params?.name || "" })} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: t("الإشعارات") }} />
                <Stack.Screen name="NotifSettings" component={NotifSettingsScreen} options={{ title: t("إعدادات الإشعارات") }} />
                <Stack.Screen name="SavedSearches" component={SavedSearchesScreen} options={{ title: t("الأبحاث المحفوظة") }} />
                <Stack.Screen name="Following" component={FollowingScreen} options={{ title: t("متابعاتي") }} />
                <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t("الإعدادات") }} />
                <Stack.Screen name="StaticPage" component={StaticPageScreen} options={{ title: "" }} />
                <Stack.Screen name="SellerProfile" component={SellerProfileScreen} options={{ title: t("الملف الشخصي للبائع") }} />
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
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <I18nProvider>
                <AuthProvider>
                    <CountryProvider>
                        <Navigation />
                        <StatusBar style="dark" />
                    </CountryProvider>
                </AuthProvider>
            </I18nProvider>
        </SafeAreaProvider>
    );
}
