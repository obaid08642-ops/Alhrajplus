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
import ListingDetailScreen from "./src/screens/ListingDetailScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import PostScreen from "./src/screens/PostScreen";
import ChatScreen from "./src/screens/ChatScreen";
import MapScreen from "./src/screens/MapScreen";
import ReelsScreen from "./src/screens/ReelsScreen";
import { FavoritesScreen, MyListingsScreen, DealsScreen } from "./src/screens/OtherScreens";
import { theme } from "./src/theme";
import { registerForNotifications, setNotificationNavigationRef } from "./src/notifications";

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
                options={{ title: "الرئيسية", tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }} />
            <Tab.Screen name="DealsTab" component={DealsScreen}
                options={{ title: "صفقات", tabBarIcon: ({ focused }) => <TabIcon icon="🔥" focused={focused} /> }} />
            <Tab.Screen name="ReelsTab" component={ReelsScreen}
                options={{ title: "قصص", tabBarIcon: ({ focused }) => <TabIcon icon="🎬" focused={focused} /> }} />
            <Tab.Screen name="MapTab" component={MapScreen}
                options={{ title: "خريطة", tabBarIcon: ({ focused }) => <TabIcon icon="🗺️" focused={focused} /> }} />
            <Tab.Screen name="ChatTab" component={ChatScreen}
                options={{ title: "رسائل", tabBarIcon: ({ focused }) => <TabIcon icon="💬" focused={focused} /> }} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen}
                options={{ title: "حسابي", tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }} />
        </Tab.Navigator>
    );
}

function Navigation() {
    const { user, loading } = useAuth();
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
                        <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: "تفاصيل الإعلان" }} />
                        <Stack.Screen name="Post" component={PostScreen} options={{ title: "إضافة إعلان" }} />
                        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: "المفضلة" }} />
                        <Stack.Screen name="MyListings" component={MyListingsScreen} options={{ title: "إعلاناتي" }} />
                        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "الرسائل" }} />
                        <Stack.Screen name="Search" component={SearchScreen} options={{ title: "بحث" }} />
                        <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: "التصنيفات" }} />
                        <Stack.Screen name="CategoryListings" component={CategoryListingsScreen} options={{ title: "" }} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "الإشعارات" }} />
                        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "الإعدادات" }} />
                        <Stack.Screen name="StaticPage" component={StaticPageScreen} options={{ title: "" }} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "إنشاء حساب" }} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "نسيت كلمة المرور" }} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: "إعادة تعيين كلمة المرور" }} />
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
