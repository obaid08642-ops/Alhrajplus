import { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import api from "../api";
import { theme } from "../theme";
import { useAuth } from "../AuthContext";

export default function ChatScreen({ navigation, route }) {
    const { user } = useAuth();
    const toId = route.params?.to;
    const listingId = route.params?.listing;
    const [convos, setConvos] = useState([]);
    const [activeConvoId, setActiveConvoId] = useState(null);
    const [activeOther, setActiveOther] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [translations, setTranslations] = useState({});
    const [translating, setTranslating] = useState(null);
    const listRef = useRef();

    useEffect(() => {
        if (!user) return;
        (async () => {
            const { data } = await api.get("/chat/conversations");
            setConvos(data);
            if (toId) {
                const cid = [user.id, toId].sort().join("_");
                setActiveConvoId(cid);
                const found = data.find((c) => c.id === cid);
                setActiveOther(found?.other || { id: toId, name: "البائع" });
            }
        })();
    }, [user, toId]);

    useEffect(() => {
        if (!activeConvoId) return;
        const fetchMsgs = async () => {
            try {
                const { data } = await api.get(`/chat/messages/${activeConvoId}`);
                setMessages(data);
            } catch (_) {}
        };
        fetchMsgs();
        const id = setInterval(fetchMsgs, 4000);
        return () => clearInterval(id);
    }, [activeConvoId]);

    const send = async () => {
        if (!input.trim() || !activeOther) return;
        const text = input.trim();
        setInput("");
        try {
            const { data } = await api.post("/chat/send", {
                receiver_id: activeOther.id,
                listing_id: listingId || null,
                text,
            });
            setMessages((m) => [...m, data]);
            setActiveConvoId(data.convo_id);
        } catch (_) {}
    };

    const translate = async (m) => {
        if (translations[m.id] || !m.text) return;
        setTranslating(m.id);
        try {
            const { data } = await api.post("/ai/translate", { text: m.text, target_lang: "ar" });
            setTranslations((tr) => ({ ...tr, [m.id]: data.text }));
        } catch (_) {} finally { setTranslating(null); }
    };

    if (!user) {
        return (
            <SafeAreaView style={styles.wrap}>
                <View style={styles.center}><Text style={styles.muted}>يجب تسجيل الدخول لاستخدام الرسائل</Text></View>
            </SafeAreaView>
        );
    }

    if (!activeConvoId) {
        return (
            <SafeAreaView style={styles.wrap}>
                <Text style={styles.title}>المحادثات</Text>
                {convos.length === 0 ? (
                    <View style={styles.center}><Text style={styles.muted}>لا توجد محادثات بعد</Text></View>
                ) : (
                    <FlatList
                        data={convos}
                        keyExtractor={(c) => c.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => { setActiveConvoId(item.id); setActiveOther(item.other); }} style={styles.convoItem}>
                                <View style={styles.avatar}><Text style={styles.avatarText}>{item.other?.name?.[0] || "U"}</Text></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.convoName}>{item.other?.name}</Text>
                                    <Text style={styles.convoLast} numberOfLines={1}>{item.last_message}</Text>
                                </View>
                                {item.unread > 0 && <View style={styles.unread}><Text style={styles.unreadText}>{item.unread}</Text></View>}
                            </TouchableOpacity>
                        )}
                    />
                )}
            </SafeAreaView>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.chatHeader}>
                    <TouchableOpacity onPress={() => { setActiveConvoId(null); setActiveOther(null); }}>
                        <Text style={styles.backArrow}>‹</Text>
                    </TouchableOpacity>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{activeOther?.name?.[0]}</Text></View>
                    <Text style={styles.chatName}>{activeOther?.name}</Text>
                </View>
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(m) => m.id}
                    contentContainerStyle={{ padding: 10 }}
                    onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: true })}
                    renderItem={({ item }) => {
                        const mine = item.sender_id === user.id;
                        return (
                            <View style={[styles.msgRow, { justifyContent: mine ? "flex-end" : "flex-start" }]}>
                                <View style={[styles.msgBubble, mine ? styles.msgMine : styles.msgOther]}>
                                    {item.image && <Image source={{ uri: item.image }} style={{ width: 180, height: 180, borderRadius: 10 }} />}
                                    {item.text ? <Text style={mine ? styles.msgTextMine : styles.msgText}>{item.text}</Text> : null}
                                    {translations[item.id] ? <Text style={[styles.translation, mine && { color: "#fff", opacity: 0.8 }]}>🌐 {translations[item.id]}</Text> : null}
                                    {!mine && item.text && !translations[item.id] && (
                                        <TouchableOpacity onPress={() => translate(item)}>
                                            <Text style={styles.translateBtn}>{translating === item.id ? "..." : "ترجم"}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        );
                    }}
                />
                <View style={styles.inputBar}>
                    <TextInput value={input} onChangeText={setInput} placeholder="اكتب رسالة..." placeholderTextColor={theme.colors.textMuted} style={styles.inputBox} />
                    <TouchableOpacity onPress={send} style={styles.sendBtn}>
                        <Text style={styles.sendText}>⇦</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: theme.colors.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    muted: { color: theme.colors.textMuted },
    title: { fontSize: 20, fontWeight: "900", padding: 16, color: theme.colors.text, textAlign: "right" },
    convoItem: { flexDirection: "row", padding: 12, gap: 10, alignItems: "center", backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center" },
    avatarText: { color: theme.colors.primaryFg, fontWeight: "900" },
    convoName: { fontWeight: "800", color: theme.colors.text, textAlign: "right" },
    convoLast: { color: theme.colors.textMuted, fontSize: 12, textAlign: "right" },
    unread: { backgroundColor: theme.colors.danger, minWidth: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center", paddingHorizontal: 6 },
    unreadText: { color: "#fff", fontWeight: "900", fontSize: 11 },
    chatHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    backArrow: { fontSize: 28, color: theme.colors.primary, fontWeight: "700" },
    chatName: { fontWeight: "800", fontSize: 15, color: theme.colors.text },
    msgRow: { flexDirection: "row", marginVertical: 3 },
    msgBubble: { maxWidth: "80%", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
    msgMine: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
    msgOther: { backgroundColor: theme.colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: theme.colors.border },
    msgText: { color: theme.colors.text, fontSize: 14, textAlign: "right" },
    msgTextMine: { color: theme.colors.primaryFg, fontSize: 14, textAlign: "right" },
    translation: { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.25)", fontSize: 12, fontStyle: "italic", color: theme.colors.textMuted, textAlign: "right" },
    translateBtn: { marginTop: 2, color: theme.colors.primary, fontSize: 11, fontWeight: "700", textAlign: "right" },
    inputBar: { flexDirection: "row", padding: 10, gap: 8, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border },
    inputBox: { flex: 1, backgroundColor: theme.colors.surfaceElevated, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: theme.colors.text, textAlign: "right" },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center" },
    sendText: { color: "#fff", fontSize: 18, fontWeight: "900" },
});
