import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, I18nManager } from "react-native";
import { AuthProvider, useAuth } from "./src/AuthContext";
import HomeScreen from "./src/screens/HomeScreen";
import { LoginScreen, RegisterScreen } from "./src/screens/AuthScreens";
import ListingDetailScreen from "./src/screens/ListingDetailScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import { theme } from "./src/theme";

// Force RTL for Arabic UI
try {
    if (!I18nManager.isRTL) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
    }
} catch (_) {}

const Stack = createNativeStackNavigator();

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
                        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: "تفاصيل الإعلان" }} />
                        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "حسابي" }} />
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
