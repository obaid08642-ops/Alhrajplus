import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { I18nProvider, useI18n } from "@/contexts/I18nContext";
import { trackEvent, trackSessionHeartbeat } from "@/lib/analytics";
import { adminMfaEnrollmentRequired, canAccessAdmin } from "@/lib/accessControl";
import { CountryProvider } from "@/contexts/CountryContext";
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
const SellerStorefrontPage = lazy(() => import("@/pages/SellerStorefrontPage"));
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
const WalletPage = lazy(() => import("@/pages/WalletPage"));
const AIAssistantWidget = lazy(() => import("@/components/AIAssistantWidget"));
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmailPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const XAuthCallback = lazy(() => import("@/pages/XAuthCallback"));
const SnapAuthCallback = lazy(() => import("@/pages/SnapAuthCallback"));
const StaticPagesModule = () => import("@/pages/StaticPages");
const SettingsPage = lazy(() => StaticPagesModule().then((m) => ({ default: m.SettingsPage })));
const TermsPage = lazy(() => StaticPagesModule().then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => StaticPagesModule().then((m) => ({ default: m.PrivacyPage })));
const AboutPage = lazy(() => StaticPagesModule().then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => StaticPagesModule().then((m) => ({ default: m.ContactPage })));
const DownloadPage = lazy(() => import("@/pages/DownloadPage"));
const AccountCollectionPage = lazy(() => import("@/pages/AccountCollectionPage"));
const WorkflowPage = lazy(() => import("@/pages/WorkflowPage"));

function PageFallback() {
    return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
}

function AnalyticsRouteTracker() {
    const location = useLocation();
    useEffect(() => {
        trackEvent("page_view");
    }, [location.pathname, location.search]);
    useEffect(() => {
        trackSessionHeartbeat();
        const timer = window.setInterval(trackSessionHeartbeat, 30000);
        return () => window.clearInterval(timer);
    }, []);
    return null;
}

function AdminRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <PageFallback />;
    if (!canAccessAdmin(user)) {
        const destination = adminMfaEnrollmentRequired(user) ? "/settings?security=mfa" : (user ? "/profile" : "/login");
        return <Navigate to={destination} replace />;
    }
    return children;
}

function Layout({ children, hideNav = false }) {
    const { isRTL } = useI18n();
    return (
        <div className="min-h-screen bg-[var(--bg)] pb-24" dir={isRTL ? "rtl" : "ltr"}>
            {!hideNav && <SmartAppBanner />}
            {!hideNav && <TopBar />}
            {children}
            {!hideNav && <BottomNav />}
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
        <CountryPicker />
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/google/callback" element={<AuthCallback />} />
            <Route path="/auth/x/callback" element={<XAuthCallback />} />
            <Route path="/auth/snapchat/callback" element={<SnapAuthCallback />} />
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/category/:categoryKey" element={<Layout><CategoryPage /></Layout>} />
            <Route path="/listing/:id" element={<Layout><ListingDetail /></Layout>} />
            <Route path="/seller/:sellerId" element={<Layout><SellerStorefrontPage /></Layout>} />
            <Route path="/post" element={<Layout><PostListing /></Layout>} />
            <Route path="/chat" element={<Layout><ChatPage /></Layout>} />
            <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
            <Route path="/favorites" element={<Layout><AccountCollectionPage /></Layout>} />
            <Route path="/watchlist" element={<Layout><AccountCollectionPage /></Layout>} />
            <Route path="/my-listings" element={<Layout><AccountCollectionPage /></Layout>} />
            <Route path="/offers" element={<Layout><AccountCollectionPage /></Layout>} />
            <Route path="/following" element={<Layout><AccountCollectionPage /></Layout>} />
            <Route path="/saved-searches" element={<Layout><AccountCollectionPage /></Layout>} />
            <Route path="/buy-requests" element={<Layout><WorkflowPage kind="buy" /></Layout>} />
            <Route path="/support" element={<Layout><WorkflowPage kind="support" /></Layout>} />
            <Route path="/notifications" element={<Layout><NotificationsPage /></Layout>} />
            <Route path="/search" element={<Layout><SearchPage /></Layout>} />
            <Route path="/map" element={<Layout><MapPage /></Layout>} />
            <Route path="/admin" element={<AdminRoute><Layout><AdminPage /></Layout></AdminRoute>} />
            <Route path="/reels" element={<Layout hideNav><ReelsPage /></Layout>} />
            <Route path="/auctions" element={<Layout><AuctionsPage /></Layout>} />
            <Route path="/flights" element={<Layout><FlightsPage /></Layout>} />
            <Route path="/deals" element={<Layout><DealsPage /></Layout>} />
            <Route path="/wallet" element={<Layout><WalletPage /></Layout>} />
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
                        <CountryProvider>
                            {showSplash && <SplashScreen />}
                            <BrowserRouter>
                                <AnalyticsRouteTracker />
                                <AppRouter />
                                <Suspense fallback={null}>
                                    <AIAssistantWidget />
                                </Suspense>
                            </BrowserRouter>
                        </CountryProvider>
                    </AuthProvider>
                </ThemeProvider>
            </I18nProvider>
        </HelmetProvider>
    );
}

export default App;
