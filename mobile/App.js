import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, I18nManager, Text } from "react-native";
import { AuthProvider, useAuth } from "./src/AuthContext";
import HomeScreen from "./src/screens/HomeScreen";
import { LoginScreen, RegisterScreen } from "./src/screens/AuthScreens";
import ListingDetailScreen from "./src/screens/ListingDetailScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import PostScreen from "./src/screens/PostScreen";
import ChatScreen from "./src/screens/ChatScreen";
import { FavoritesScreen, MyListingsScreen, DealsScreen } from "./src/screens/OtherScreens";
import { theme } from "./src/theme";

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
            <Tab.Screen name="PostTab" component={PostScreen}
                options={{ title: "نشر", tabBarIcon: ({ focused }) => <TabIcon icon="➕" focused={focused} /> }} />
            <Tab.Screen name="ChatTab" component={ChatScreen}
                options={{ title: "رسائل", tabBarIcon: ({ focused }) => <TabIcon icon="💬" focused={focused} /> }} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen}
                options={{ title: "حسابي", tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }} />
        </Tab.Navigator>
    );
}

function Navigation() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.bg }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
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
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "إنشاء حساب" }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Navigation />
            <StatusBar style="auto" />
        </AuthProvider>
    );
}
