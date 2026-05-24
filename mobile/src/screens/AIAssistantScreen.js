// AIAssistantScreen — mirrors web /app/frontend/src/components/AIAssistantWidget.js (as full screen)
import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Send, Bot, Sparkles, RotateCcw } from "lucide-react-native";
import api from "../api";
import { colors, radius } from "../theme";

const SESSION_KEY = "hp_ai_session_id";
const HIST_KEY = "hp_ai_history";

async function getSessionId() {
    let sid = await AsyncStorage.getItem(SESSION_KEY);
    if (!sid) {
        sid = `s-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
        await AsyncStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
}

const SUGGESTIONS = [
    "كيف أنشر إعلاناً جديداً؟",
    "ما متوسط سعر سيارة كامري 2020؟",
    "هل البيع آمن؟ نصائح للحماية من الاحتيال",
];

export default function AIAssistantScreen() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const listRef = useRef(null);

    useEffect(() => {
        AsyncStorage.getItem(HIST_KEY).then((raw) => {
            if (raw) {
                try { setMessages(JSON.parse(raw)); } catch (_) {}
            }
        });
    }, []);

    useEffect(() => {
        AsyncStorage.setItem(HIST_KEY, JSON.stringify(messages.slice(-30))).catch(() => {});
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages]);

    const send = async (textOverride) => {
        const text = (textOverride ?? input).trim();
        if (!text || busy) return;
        setInput("");
        const next = [...messages, { role: "user", text }];
        setMessages(next);
        setBusy(true);
        try {
            const sid = await getSessionId();
            const { data } = await api.post("/ai/assistant", { message: text, session_id: sid });
            setMessages([...next, { role: "assistant", text: data.reply || "" }]);
        } catch (e) {
            const err = e.response?.data?.detail || "تعذر الوصول للمساعد";
            setMessages([...next, { role: "assistant", text: `⚠️ ${typeof err === "string" ? err : "خطأ"}` }]);
        } finally { setBusy(false); }
    };

    const reset = async () => {
        await AsyncStorage.removeItem(SESSION_KEY);
        await AsyncStorage.removeItem(HIST_KEY);
        setMessages([]);
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
            {/* Header */}
            <View style={styles.header}>
                <LinearGradient colors={[colors.primary, colors.accent]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <View style={styles.headerInner}>
                    <View style={styles.botIcon}><Bot size={20} color={colors.primary} /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>المساعد الذكي</Text>
                        <Text style={styles.headerSub}>اسألني عن أي شيء في الحراج بلس</Text>
                    </View>
                    {messages.length > 0 && (
                        <TouchableOpacity onPress={reset} style={styles.resetBtn}>
                            <RotateCcw size={14} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Messages */}
            {messages.length === 0 ? (
                <View style={styles.empty}>
                    <Sparkles size={40} color={colors.primary} style={{ opacity: 0.5 }} />
                    <Text style={styles.emptyTitle}>اقتراحات سريعة:</Text>
                    {SUGGESTIONS.map((s, i) => (
                        <TouchableOpacity key={i} onPress={() => send(s)} style={styles.suggBtn}>
                            <Text style={styles.suggText}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(_, i) => String(i)}
                    contentContainerStyle={{ padding: 12 }}
                    renderItem={({ item }) => {
                        const isUser = item.role === "user";
                        return (
                            <View style={[styles.bubbleWrap, { alignItems: isUser ? "flex-end" : "flex-start" }]}>
                                <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                                    <Text style={[styles.bubbleText, isUser && { color: "#fff" }]}>{item.text}</Text>
                                </View>
                            </View>
                        );
                    }}
                    ListFooterComponent={busy ? (
                        <View style={[styles.bubbleWrap, { alignItems: "flex-start" }]}>
                            <View style={[styles.bubble, styles.botBubble, { flexDirection: "row", gap: 5, alignItems: "center" }]}>
                                <ActivityIndicator size="small" color={colors.textMuted} />
                                <Text style={{ color: colors.textMuted, fontSize: 12 }}>يكتب...</Text>
                            </View>
                        </View>
                    ) : null}
                />
            )}

            {/* Input bar */}
            <View style={styles.inputBar}>
                <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="اكتب رسالتك..."
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    editable={!busy}
                    multiline
                    maxLength={2000}
                />
                <TouchableOpacity onPress={() => send()} disabled={busy || !input.trim()} style={[styles.sendBtn, (busy || !input.trim()) && { opacity: 0.5 }]}>
                    {busy ? <ActivityIndicator color="#fff" size="small" /> : <Send size={16} color="#fff" />}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: { paddingTop: 4, paddingBottom: 14, paddingHorizontal: 14 },
    headerInner: { flexDirection: "row", alignItems: "center", gap: 10 },
    botIcon: { width: 38, height: 38, borderRadius: 999, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
    headerTitle: { color: "#fff", fontSize: 15, fontWeight: "900" },
    headerSub: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 1 },
    resetBtn: { width: 32, height: 32, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" },
    empty: { padding: 24, alignItems: "stretch", gap: 8 },
    emptyTitle: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: 6, marginBottom: 6 },
    suggBtn: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12 },
    suggText: { color: colors.text, fontSize: 13, fontWeight: "600" },
    bubbleWrap: { marginBottom: 8 },
    bubble: { maxWidth: "82%", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 },
    userBubble: { backgroundColor: colors.primary },
    botBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    bubbleText: { fontSize: 13.5, color: colors.text, lineHeight: 20 },
    inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 6, padding: 10, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    input: { flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: colors.text, maxHeight: 100 },
    sendBtn: { width: 42, height: 42, borderRadius: 999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
