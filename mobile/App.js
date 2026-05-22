import "react-native-gesture-handler";
import { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, I18nManager, Text } from "react-native";
import * as Linking from "expo-linking";
import { AuthProvider, useAuth } from "./src/AuthContext";
import { I18nProvider } from "./src/I18nContext";
import HomeScreen from "./src/screens/HomeScreen";
import { LoginScreen, RegisterScreen } from "./src/screens/AuthScreens";
import { ForgotPasswordScreen, ResetPasswordScreen } from "./src/screens/PasswordReset";
import { SearchScreen, CategoriesScreen, CategoryListingsScreen, NotificationsScreen, SettingsScreen, StaticPageScreen } from "./src/screens/MoreScreens";
import SellerProfileScreen from "./src/screens/SellerProfile";
import ListingDetailScreen from "./src/screens/ListingDetailScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import PostScreen from "./src/screens/PostScreen";
import ChatScreen from "./src/screens/ChatScreen";
import MapScreen from "./src/screens/MapScreen";
import ReelsScreen from "./src/screens/ReelsScreen";
import { FavoritesScreen, MyListingsScreen, DealsScreen } from "./src/screens/OtherScreens";
import { theme } from "./src/theme";
import { registerForNotifications, setNotificationNavigationRef } from "./src/notifications";
import { useI18n } from "./src/I18nContext";

try {
    if (!I18nManager.isRTL) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
    }
} catch (_) {}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ icon, focused }) {
    return (
        <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
    );
}

function TabsNavigator() {
    const { t } = useI18n();
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textMuted,
                tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, height: 64, paddingBottom: 10, paddingTop: 8 },
                tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
            }}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen}
                options={{ title: t("الرئيسية"), tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }} />
            <Tab.Screen name="DealsTab" component={DealsScreen}
                options={{ title: t("صفقات"), tabBarIcon: ({ focused }) => <TabIcon icon="🔥" focused={focused} /> }} />
            <Tab.Screen name="ReelsTab" component={ReelsScreen}
                options={{ title: t("قصص"), tabBarIcon: ({ focused }) => <TabIcon icon="🎬" focused={focused} /> }} />
            <Tab.Screen name="MapTab" component={MapScreen}
                options={{ title: t("خريطة"), tabBarIcon: ({ focused }) => <TabIcon icon="🗺️" focused={focused} /> }} />
            <Tab.Screen name="ChatTab" component={ChatScreen}
                options={{ title: t("رسائل"), tabBarIcon: ({ focused }) => <TabIcon icon="💬" focused={focused} /> }} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen}
                options={{ title: t("حسابي"), tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }} />
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
                        ChatTab: "chat",
                        ProfileTab: "profile",
                    },
                },
                ListingDetail: "listing/:id",
                Chat: "chat-thread",
                Login: "login",
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
                    headerStyle: { backgroundColor: theme.colors.surface },
                    headerTitleStyle: { fontWeight: "800", color: theme.colors.text },
                    headerTintColor: theme.colors.primary,
                    headerShadowVisible: false,
                }}
            >
                {user ? (
                    <>
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
                        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t("الإعدادات") }} />
                        <Stack.Screen name="StaticPage" component={StaticPageScreen} options={{ title: "" }} />
                        <Stack.Screen name="SellerProfile" component={SellerProfileScreen} options={{ title: t("الملف الشخصي للبائع") }} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: t("إنشاء حساب") }} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: t("نسيت كلمة المرور؟") }} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: t("إعادة تعيين كلمة المرور") }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <I18nProvider>
            <AuthProvider>
                <Navigation />
                <StatusBar style="auto" />
            </AuthProvider>
        </I18nProvider>
    );
}
