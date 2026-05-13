import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { I18nProvider } from "@/contexts/I18nContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import SplashScreen from "@/components/SplashScreen";
import SmartAppBanner from "@/components/SmartAppBanner";
import AuthCallback from "@/components/AuthCallback";
import CountryPicker from "@/components/CountryPicker";
import HomePage from "@/pages/HomePage";
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from "@/pages/Auth";
import CategoryPage from "@/pages/CategoryPage";

// Heavy pages — lazy loaded for faster initial bundle (saves ~300KB from main chunk)
const ListingDetail = lazy(() => import("@/pages/ListingDetail"));
const PostListing = lazy(() => import("@/pages/PostListing"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const SearchAndMapModule = () => import("@/pages/SearchAndMap");
const SearchPage = lazy(() => SearchAndMapModule().then((m) => ({ default: m.SearchPage })));
const MapPage = lazy(() => SearchAndMapModule().then((m) => ({ default: m.MapPage })));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const ReelsPage = lazy(() => import("@/pages/ReelsPage"));
const AuctionsPage = lazy(() => import("@/pages/AuctionsPage"));
const FlightsPage = lazy(() => import("@/pages/FlightsPage"));
const DealsPage = lazy(() => import("@/pages/DealsPage"));
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmailPage"));
const XAuthCallback = lazy(() => import("@/pages/XAuthCallback"));
const SnapAuthCallback = lazy(() => import("@/pages/SnapAuthCallback"));
const StaticPagesModule = () => import("@/pages/StaticPages");
const SettingsPage = lazy(() => StaticPagesModule().then((m) => ({ default: m.SettingsPage })));
const TermsPage = lazy(() => StaticPagesModule().then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => StaticPagesModule().then((m) => ({ default: m.PrivacyPage })));
const AboutPage = lazy(() => StaticPagesModule().then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => StaticPagesModule().then((m) => ({ default: m.ContactPage })));

function PageFallback() {
    return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
}

function Layout({ children, hideNav = false }) {
    return (
        <div className="min-h-screen bg-[var(--bg)] pb-24" dir="rtl">
            {!hideNav && <SmartAppBanner />}
            {!hideNav && <TopBar />}
            {children}
            {!hideNav && <BottomNav />}
            <CountryPicker />
        </div>
    );
}

// AppRouter: handles OAuth callback fragment detection + main routes
function AppRouter() {
    const location = useLocation();
    // Detect any OAuth callback hash (legacy Emergent #session_id= AND new Google #access_token=)
    // This catch-all is critical: even if the URL is "/" or "/foo", if hash contains tokens,
    // we route to AuthCallback so they get captured before being lost.
    if (location.hash?.includes("access_token=") || location.hash?.includes("session_id=")) {
        return <AuthCallback />;
    }
    return (
        <Suspense fallback={<PageFallback />}>
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/google/callback" element={<AuthCallback />} />
            <Route path="/auth/x/callback" element={<XAuthCallback />} />
            <Route path="/auth/snapchat/callback" element={<SnapAuthCallback />} />
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/category/:categoryKey" element={<Layout><CategoryPage /></Layout>} />
            <Route path="/listing/:id" element={<Layout><ListingDetail /></Layout>} />
            <Route path="/post" element={<Layout><PostListing /></Layout>} />
            <Route path="/chat" element={<Layout><ChatPage /></Layout>} />
            <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
            <Route path="/search" element={<Layout><SearchPage /></Layout>} />
            <Route path="/map" element={<Layout><MapPage /></Layout>} />
            <Route path="/admin" element={<Layout><AdminPage /></Layout>} />
            <Route path="/reels" element={<Layout><ReelsPage /></Layout>} />
            <Route path="/auctions" element={<Layout><AuctionsPage /></Layout>} />
            <Route path="/flights" element={<Layout><FlightsPage /></Layout>} />
            <Route path="/deals" element={<Layout><DealsPage /></Layout>} />
            <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
            <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
            <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
            <Route path="/about" element={<Layout><AboutPage /></Layout>} />
            <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
        </Routes>
        </Suspense>
    );
}

function App() {
    // Skip splash for OAuth callbacks, error redirects from /login, and direct deep links
    const skipSplash = typeof window !== "undefined" && (
        window.location.pathname.startsWith("/auth/") ||
        window.location.hash?.includes("access_token=") ||
        window.location.hash?.includes("session_id=")
    );
    const [showSplash, setShowSplash] = useState(() => !skipSplash && !sessionStorage.getItem("hp_splash_shown"));
    useEffect(() => {
        if (showSplash) {
            const t = setTimeout(() => {
                setShowSplash(false);
                sessionStorage.setItem("hp_splash_shown", "1");
            }, 2200);
            return () => clearTimeout(t);
        }
    }, [showSplash]);

    return (
        <HelmetProvider>
            <I18nProvider>
                <ThemeProvider>
                    <AuthProvider>
                        {showSplash && <SplashScreen />}
                        <BrowserRouter>
                            <AppRouter />
                        </BrowserRouter>
                    </AuthProvider>
                </ThemeProvider>
            </I18nProvider>
        </HelmetProvider>
    );
}

export default App;
