// Minimal ErrorBoundary — catches render errors so a single broken screen
// doesn't kill the whole app. Mounted at the root in App.js.
import { Component } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { tr } from "./I18nContext";
import { colors } from "./theme";

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, message: "" };
    }
    static getDerivedStateFromError(err) {
        return { hasError: true, message: err?.message || String(err) };
    }
    componentDidCatch(err, info) {
        // Log to console — Sentry/Bugsnag can be plugged in here later.
        if (typeof console !== "undefined") {
            console.warn("[ErrorBoundary]", err, info?.componentStack);
        }
    }
    reset = () => this.setState({ hasError: false, message: "" });
    render() {
        if (!this.state.hasError) return this.props.children;
        return (
            <View style={s.wrap} testID="error-boundary">
                <Text style={s.title}>{tr("حدث خطأ غير متوقع")}</Text>
                <Text style={s.body} numberOfLines={4}>{this.state.message}</Text>
                <TouchableOpacity onPress={this.reset} style={s.btn} testID="error-boundary-retry">
                    <Text style={s.btnText}>{tr("إعادة المحاولة")}</Text>
                </TouchableOpacity>
            </View>
        );
    }
}

const s = StyleSheet.create({
    wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: colors.bg },
    title: { fontSize: 18, fontWeight: "900", color: colors.text, textAlign: "center", marginBottom: 12 },
    body: { fontSize: 12, color: colors.textMuted, textAlign: "center", marginBottom: 24 },
    btn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
    btnText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});
