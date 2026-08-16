=== MOBILE SOCKET ===
/**
 * Mobile WebSocket hook — production-ready real-time chat client.
 * Uses the native React Native WebSocket implementation (no extra deps).
 *
 * Token is read from secure storage (api.js → SecureStore). URL is derived from
 * BACKEND_URL by swapping the scheme: https → wss, http → ws.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { BACKEND_URL } from "./api";

const TOKEN_KEY = "hp_access_token";

async function readToken() {
    try {
        if (SecureStore.isAvailableAsync && (await SecureStore.isAvailableAsync())) {
            const t = await SecureStore.getItemAsync(TOKEN_KEY);
            if (t) return t;
        }
    } catch (_) {}
    return AsyncStorage.getItem(TOKEN_KEY);
}

export function useChatSocket() {
    const wsRef = useRef(null);
    const handlersRef = useRef(new Map());
    const reconnect = useRef(0);
    const pingTimer = useRef(null);
    const retryTimer = useRef(null);
    const [connected, setConnected] = useState(false);

    const dispatch = useCallback((event) => {
        const set = handlersRef.current.get(event.type);
        if (set) set.forEach((h) => { try { h(event); } catch (_) {} });
    }, []);

    const connect = useCallback(async () => {
        const token = await readToken();
        if (!token || !BACKEND_URL) return;
        const url = `${BACKEND_URL.replace(/^http/i, "ws")}/api/ws/chat?token=${encodeURIComponent(token)}`;
        let ws;
        try { ws = new WebSocket(url); } catch (_) { scheduleRetry(); return; }
        wsRef.current = ws;
        ws.onopen = () => {
            setConnected(true);
            reconnect.current = 0;
            if (pingTimer.current) clearInterval(pingTimer.current);
            pingTimer.current = setInterval(() => {
                if (ws.readyState === 1) { try { ws.send(JSON.stringify({ type: "ping" })); } catch (_) {} }
            }, 25000);
        };
        ws.onmessage = (e) => {
            try { dispatch(JSON.parse(e.data)); } catch (_) {}
        };
        ws.onclose = () => {
            setConnected(false);
            if (pingTimer.current) { clearInterval(pingTimer.current); pingTimer.current = null; }
            scheduleRetry();
        };
        ws.onerror = () => { try { ws.close(); } catch (_) {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const scheduleRetry = useCallback(() => {
        if (retryTimer.current) return;
        const a = Math.min(reconnect.current + 1, 6);
        reconnect.current = a;
        retryTimer.current = setTimeout(() => { retryTimer.current = null; connect(); }, Math.min(1000 * 2 ** a, 30000));
    }, [connect]);

    useEffect(() => {
        connect();
        return () => {
            if (pingTimer.current) clearInterval(pingTimer.current);
            if (retryTimer.current) clearTimeout(retryTimer.current);
            try { wsRef.current?.close(); } catch (_) {}
        };
    }, [connect]);

    const send = useCallback((obj) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== 1) return false;
        try { ws.send(JSON.stringify(obj)); return true; } catch (_) { return false; }
    }, []);

    const subscribe = useCallback((type, handler) => {
        if (!handlersRef.current.has(type)) handlersRef.current.set(type, new Set());
        handlersRef.current.get(type).add(handler);
        return () => {
            const set = handlersRef.current.get(type);
            if (set) { set.delete(handler); if (!set.size) handlersRef.current.delete(type); }
        };
    }, []);

    return { send, connected, subscribe };
}
=== MOBILE CHAT HEAD ===
// ChatScreen — Premium WhatsApp-grade design with typing/presence/last-seen/read receipts.
// Two views: conversations list  +  chat thread (selected by route.params.to or list tap).
import { useEffect, useRef, useState, useCallback, useMemo, useLayoutEffect } from "react";
import { useI18n } from "../I18nContext";
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StatusBar, StyleSheet, RefreshControl, Modal, Linking, PanResponder, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SvgXml } from "react-native-svg";
import { CHAT_BG_SVG } from "../components/chatBgSvg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
// expo-audio v1.1+ removed the top-level `AudioModule`/`AudioRecorder`
// named exports. Use the documented functions + grab the native AudioRecorder
// constructor from the default-export module so the chat voice-record
// feature still works.
import AudioModuleDefault from "expo-audio/build/AudioModule";
import { requestRecordingPermissionsAsync, setAudioModeAsync, RecordingPresets } from "expo-audio";
const AudioRecorder = AudioModuleDefault?.AudioRecorder;
import { Send, Camera, MapPin, Mic, Search, ChevronLeft, Check, CheckCheck, Image as ImageIcon, Plus, Languages, Phone, MoreVertical, X, Play, Pause } from "lucide-react-native";
import api from "../api";
import { useAuth } from "../AuthContext";
import { useChatSocket } from "../useChatSocket";
import { useThemeMode } from "../ThemeContext";
import { colors, radius, shadow } from "../theme";

// Audio player module for voice playback
import { useAudioPlayer } from "expo-audio";
function fmtLastSeen(iso, t) {
  const _ = t || ((s) => s);
  // Owner mandate: if we have NO last_seen, we must NOT pretend the user
  // is online. Show a neutral "غير متاح" instead.
  if (!iso) return _("غير متصل");
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return _("آخر ظهور قبل لحظات");
  if (diff < 3600) return `${_("آخر ظهور قبل")} ${Math.floor(diff / 60)} ${_("دقيقة")}`;
  if (diff < 86400) return `${_("آخر ظهور قبل")} ${Math.floor(diff / 3600)} ${_("ساعة")}`;
  if (diff < 604800) return `${_("آخر ظهور قبل")} ${Math.floor(diff / 86400)} ${_("يوم")}`;
  return `${_("آخر ظهور")} ${d.toLocaleDateString()}`;
}
/**
 * Toggle helper — applies the same logic as the backend (one reaction per user
 * per message) so the optimistic UI matches the eventual server state.
 */
function _toggleReactionLocal(prev, emoji, userId) {
  const next = { ...(prev || {}) };
  let sameExisted = false;
  for (const em of Object.keys(next)) {
    const users = (next[em] || []).filter(u => u !== userId);
    if (em === emoji && (next[em] || []).includes(userId)) sameExisted = true;
    if (users.length) next[em] = users; else delete next[em];
  }
  if (!sameExisted) {
    next[emoji] = [...(next[emoji] || []), userId];
  }
  return next;
}

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("ar", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Render message text with clickable URLs.
 * Splits on http(s)://... patterns and emits inline <Text onPress> spans
 * that call Linking.openURL on tap. Same-origin links could be parsed and
 * routed via React Navigation in the future; for now they all open the URL.
 */
function renderLinkedText(text, isMine) {
  if (!text) return null;
  const URL_RX = /(https?:\/\/[^\s<>"']+)/g;
  const parts = text.split(URL_RX);
  const linkColor = isMine ? "#FFEAA7" : colors.primaryDeep;
  return parts.map((part, i) => {
    if (URL_RX.test(part)) {
      URL_RX.lastIndex = 0;
      return (
        <Text
          key={i}
          onPress={() => Linking.openURL(part).catch(() => {})}
          style={{ color: linkColor, textDecorationLine: "underline" }}
        >
          {part}
        </Text>
      );
    }
    URL_RX.lastIndex = 0;
    return part;
  });
}
function fmtDay(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const diff = (today - d) / 86400000;
  if (diff < 1 && d.getDate() === today.getDate()) return "اليوم";
  if (diff < 2) return "أمس";
  return d.toLocaleDateString("ar");
}
export default function ChatScreen() {
  const { t } = useI18n();
  const { isDark, palette } = useThemeMode();
  
  const route = useRoute();
  const nav = useNavigation();
  const {
    user
  } = useAuth();
  const insets = useSafeAreaInsets();
  const initialTo = route.params?.to;
  const initialListing = route.params?.listing;
  // When the user navigates from a listing detail "تواصل مع البائع" CTA we
  // already have seller_name/avatar/id in the route params. Use them
  // immediately so the thread opens INSTANTLY without waiting for the
  // `/users/{id}` fetch — which is what caused the blank-screen bug.
  const initialSellerName = route.params?.seller_name;
  const initialSellerAvatar = route.params?.seller_avatar;
  const [convos, setConvos] = useState([]);
  // Eagerly seed the active thread from route params on FIRST render so the
  // user goes straight to the conversation when arriving from a listing's
  // "تواصل مع البائع" button. Previously the screen flashed the conversation
  // list for ~1 frame because state was filled from a useEffect AFTER mount.
  const [activeOther, setActiveOther] = useState(() =>
    initialTo ? {
      id: initialTo,
      name: initialSellerName || "مستخدم",
      avatar: initialSellerAvatar,
    } : null
  );
  const [activeConvoId, setActiveConvoId] = useState(() =>
    initialTo && user?.id ? [user.id, initialTo].sort().join("_") : null
  );
  const [activeListing, setActiveListing] = useState(initialListing || null);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const loadConvos = useCallback(async () => {
    if (!user) { setLoadingConvos(false); return; }
    try {
      const {
        data
      } = await api.get("/chat/conversations");
      setConvos(data || []);
    } catch (_) {} finally {
      setLoadingConvos(false);
      setRefreshing(false);
    }
  }, [user]);
  const onConvosFocus = useCallback(() => { loadConvos(); }, [loadConvos]);
  useFocusEffect(onConvosFocus);

  // Hide the bottom tab bar whenever a 1:1 chat thread is open.
  // `nav` here IS the Tab navigator's screen-options interface (because
  // ChatScreen is mounted as <Tab.Screen name="ChatTab">). Setting
  // `tabBarStyle` directly on `nav` toggles it for the ChatTab route.
  // useLayoutEffect runs BEFORE paint → no flicker on enter/exit.
  useLayoutEffect(() => {
    const inThread = !!(activeOther && activeOther.id);
    nav.setOptions({ tabBarStyle: inThread ? { display: "none" } : undefined });
  }, [activeOther, nav]);
  // Restore when the screen blurs / unmounts (e.g. user swipes the tab
  // away while still inside a thread).
  useEffect(() => {
    return () => { try { nav.setOptions({ tabBarStyle: undefined }); } catch (_) {} };
  }, [nav]);

  // If user navigated with a target user, open that thread INSTANTLY using
  // any data we already have (from route params), then enrich asynchronously.
  useEffect(() => {
    if (!initialTo || !user) return;
    // 1) Sync state to current route params (handles re-navigation with a
    //    different seller after the screen was already mounted, and also
    //    covers the case where `user` arrived AFTER the lazy-init).
    const seed = {
      id: initialTo,
      name: initialSellerName || t("مستخدم"),
      avatar: initialSellerAvatar,
    };
    setActiveOther(prev => (prev && prev.id === initialTo ? prev : seed));
    setActiveConvoId([user.id, initialTo].sort().join("_"));
    if (initialListing) setActiveListing(initialListing);
    // 2) Enrich profile in the background. If it fails, the seed values stay.
    (async () => {
      try {
        const { data: u } = await api.get(`/users/${initialTo}`);
        if (u && (u.name || u.avatar)) {
          setActiveOther(prev => prev && prev.id === initialTo ? {
            ...prev,
            name: u.name || prev.name,
            avatar: u.avatar || prev.avatar,
            verified: u.verified,
          } : prev);
        }
      } catch (_) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTo, user, initialListing]);
  const openThread = other => {
    if (!user) return;
    setActiveOther(other);
    const convoId = [user.id, other.id].sort().join("_");
    setActiveConvoId(convoId);
  };
  const closeThread = () => {
    setActiveOther(null);
    setActiveConvoId(null);
    setActiveListing(null);
    loadConvos();
  };
  const filtered = useMemo(() => {
    if (!search) return convos;
    const q = search.toLowerCase().trim();
    return convos.filter(c => (c.other_name || "").toLowerCase().includes(q) || (c.last_message || "").toLowerCase().includes(q));
  }, [convos, search]);

  // Guest gate — AFTER all hooks so React's hook order stays stable when
  // user logs in/out without remounting the screen. Previously this returned
  // before useCallback/useEffect/useMemo were called, causing the dreaded
  // "rendered fewer hooks than expected" red-screen error on logout.
  if (!user) {
    return <View style={s.guestWrap}>
                <View style={s.guestIcon}>
                    <Send size={32} color={colors.primary} />
                </View>
                <Text style={s.guestTitle}>{t("الرسائل")}</Text>
                <Text style={s.guestSub}>{t("سجّل دخولك للتواصل مع البائعين والمشترين")}</Text>
                <TouchableOpacity onPress={() => nav.navigate("Login")} style={s.guestBtn}>
                    <Text style={s.guestBtnText}>{t("تسجيل الدخول")}</Text>
                </TouchableOpacity>
            </View>;
  }
  if (activeConvoId && activeOther) {
    return <ChatThread convoId={activeConvoId} other={activeOther} listing={activeListing} onBack={closeThread} />;
  }
  return <View style={{
    flex: 1,
    backgroundColor: colors.bg
  }}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
            <View style={[s.listHeader, {
      paddingTop: insets.top + 2
    }]}>
                <Text style={s.listTitle}>{t("الرسائل")}</Text>
                <TouchableOpacity style={s.searchPillBtn}>
                    <Search size={15} color={colors.textMuted} />
                    <TextInput value={search} onChangeText={setSearch} placeholder={t("ابحث عن محادثة...")} placeholderTextColor={colors.textMuted} style={s.searchInput} />
                </TouchableOpacity>
            </View>
            {loadingConvos ? <ActivityIndicator color={colors.primary} style={{
      marginTop: 30
    }} /> : filtered.length === 0 ? <View style={s.empty}>
                    <View style={s.emptyIcon}><Send size={32} color={colors.primary} /></View>
                    <Text style={s.emptyTitle}>{search ? t("لا نتائج") : t("لا توجد محادثات بعد")}</Text>
                    <Text style={s.emptySub}>{t("تواصل مع البائعين من صفحة الإعلان")}</Text>
                </View> : <FlatList data={filtered} keyExtractor={c => c.id} contentContainerStyle={{
      paddingBottom: 130
    }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
      setRefreshing(true);
      loadConvos();
    }} tintColor={colors.primary} />} renderItem={({
      item
    }) => <ConvoRow convo={item} onPress={() => openThread({
      id: item.other_id,
      name: item.other_name,
      avatar: item.other_avatar,
      verified: item.other_verified
    })} />} ItemSeparatorComponent={() => <View style={s.sep} />} />}
        </View>;
}

// =============== Conversation Row ===============
function ConvoRow({
  convo,
  onPress
}) {
  const { t } = useI18n();
  
  const unread = convo.unread || 0;
  return <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={s.convoRow}>
            <View style={s.avatarWrap}>
                {convo.other_avatar ? <Image source={{
        uri: convo.other_avatar
      }} style={s.avatar} /> : <LinearGradient colors={[colors.primary, "#7CCAEC"]} style={s.avatarGrad}>
                        <Text style={s.avatarText}>{(convo.other_name || "?").slice(0, 1)}</Text>
                    </LinearGradient>}
                {convo.online && <View style={s.onlineDot} />}
            </View>
            <View style={{
      flex: 1,
      minWidth: 0
    }}>
                <View style={s.convoTop}>
                    <Text style={s.convoName} numberOfLines={1}>{convo.other_name || t("مستخدم")}</Text>
                    <Text style={s.convoTime}>{fmtTime(convo.last_message_at)}</Text>
                </View>
                <View style={s.convoBottom}>
                    <Text style={[s.convoMsg, unread > 0 && {
          fontWeight: "800",
          color: colors.text
        }]} numberOfLines={1}>
                        {convo.last_message_type === "image" ? t("📷 صورة") : convo.last_message_type === "voice" ? t("🎙️ رسالة صوتية") : convo.last_message_type === "location" ? t("📍 موقع") : convo.last_message || "..."}
                    </Text>
                    {unread > 0 && <View style={s.unreadBadge}>
                            <Text style={s.unreadText}>{unread > 99 ? "99+" : unread}</Text>
                        </View>}
                </View>
            </View>
        </TouchableOpacity>;
}

// =============== Chat Thread (single conversation) ===============
function ChatThread({
  convoId,
  other,
  listing,
  onBack
}) {
  const { t } = useI18n();
  
  const {
    user
  } = useAuth();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    send: wsSend,
    subscribe
  } = useChatSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [presence, setPresence] = useState({
    online: false,
    last_seen: null
  });
  const [otherTyping, setOtherTyping] = useState(false);
  const [recording, setRecording] = useState(null);
  const [uploading, setUploading] = useState(false);
  // Reply-to state — was missing in last build which caused
  // "Property 'replyTo' doesn't exist" crash at line 805 when the composer
  // tried to render the reply preview.
  const [replyTo, setReplyTo] = useState(null);
  const [showActions, setShowActions] = useState(false);
  // Long-press action sheet: when set, shows {message, options[]}
  const [longPressMsg, setLongPressMsg] = useState(null);
  // Forward picker: when set to a message object, shows the contact picker modal
  const [forwardSrc, setForwardSrc] = useState(null);
  // Lightbox state — when set to an image URL, shows full-screen image modal.
  // Missing useState caused "Property 'lightbox' doesn't exist" crash.
  const [lightbox, setLightbox] = useState(null);
  const listRef = useRef(null);
  const typingTimerRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      const {
        data
      } = await api.get(`/chat/messages/${convoId}`);
      setMessages(data || []);
      // Mark conversation as read
      wsSend({
        type: "read",
        convo_id: convoId
      });
    } catch (_) {} finally {
      setLoading(false);
    }
  }, [convoId, wsSend]);

  // Load presence
  const loadPresence = useCallback(async () => {
    try {
      const {
        data
      } = await api.get(`/chat/presence/${other.id}`);
      setPresence({
        online: !!data.online,
        last_seen: data.last_seen
      });
    } catch (_) {}
  }, [other.id]);
  useEffect(() => {
    loadHistory();
    loadPresence();
  }, [loadHistory, loadPresence]);

  // Subscribe to WS events
  useEffect(() => {
    const unsubMsg = subscribe("message", ev => {
      const m = ev.message;
      if (!m) return;
      if (m.convo_id !== convoId) return;
      setMessages(prev => [...prev, m]);
      // Auto-mark as read since we're viewing
      wsSend({
        type: "read",
        convo_id: convoId
      });
    });
    const unsubTyping = subscribe("typing", ev => {
      if (ev.from !== other.id) return;
      setOtherTyping(!!ev.is_typing);
      if (ev.is_typing) {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setOtherTyping(false), 4000);
      }
    });
    const unsubRead = subscribe("read", ev => {
      if (ev.convo_id !== convoId || ev.by !== other.id) return;
      setMessages(prev => prev.map(m => m.sender_id === user.id ? {
        ...m,
=== WEB SOCKET ===
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Single shared WebSocket connection for chat real-time events.
 *
 * Reconnects automatically with exponential backoff (max 30s). Pings every
 * 25s to keep the connection alive through Render/Vercel idle timeouts.
 *
 * Returns:
 *   {
 *     send(eventObj),               // queue or send
 *     connected,                    // bool
 *     subscribe(type, handler),     // returns unsubscribe()
 *   }
 */
export function useChatSocket() {
    const { user } = useAuth();
    const wsRef = useRef(null);
    const handlersRef = useRef(new Map()); // type → Set<handler>
    const reconnectAttempt = useRef(0);
    const pingTimer = useRef(null);
    const reconnectTimer = useRef(null);
    const [connected, setConnected] = useState(false);
    const userId = user?.id;
    const connectRef = useRef(null);

    const dispatch = useCallback((event) => {
        const set = handlersRef.current.get(event.type);
        if (set) set.forEach((h) => { try { h(event); } catch (_) {} });
        const wildcard = handlersRef.current.get("*");
        if (wildcard) wildcard.forEach((h) => { try { h(event); } catch (_) {} });
    }, []);

    const scheduleReconnect = useCallback(() => {
        if (reconnectTimer.current) return;
        const attempt = Math.min(reconnectAttempt.current + 1, 6);
        reconnectAttempt.current = attempt;
        const delay = Math.min(1000 * 2 ** attempt, 30000); // 2s,4s,8s,16s,30s cap
        reconnectTimer.current = setTimeout(() => {
            reconnectTimer.current = null;
            connectRef.current?.();
        }, delay);
    }, []);

    const connect = useCallback(() => {
        if (!userId) return;
        const token = (() => {
            try { return localStorage.getItem("hp_access_token") || ""; } catch (_) { return ""; }
        })();
        if (!token) return;

        // Build wss:// URL from REACT_APP_BACKEND_URL (https://...) → wss://
        const base = (process.env.REACT_APP_BACKEND_URL || "").replace(/^http/i, "ws");
        const url = `${base}/api/ws/chat?token=${encodeURIComponent(token)}`;
        let ws;
        try {
            ws = new WebSocket(url);
        } catch (_) {
            scheduleReconnect();
            return;
        }
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            reconnectAttempt.current = 0;
            // Keep-alive ping every 25s (avoids idle proxies dropping us)
            if (pingTimer.current) clearInterval(pingTimer.current);
            pingTimer.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    try { ws.send(JSON.stringify({ type: "ping" })); } catch (_) {}
                }
            }, 25000);
        };
        ws.onmessage = (e) => {
            try {
                const ev = JSON.parse(e.data);
                dispatch(ev);
            } catch (_) {}
        };
        ws.onclose = () => {
            setConnected(false);
            if (pingTimer.current) { clearInterval(pingTimer.current); pingTimer.current = null; }
            scheduleReconnect();
        };
        ws.onerror = () => {
            try { ws.close(); } catch (_) {}
        };
    }, [userId, dispatch, scheduleReconnect]);

    connectRef.current = connect;

    useEffect(() => {
        connect();
        return () => {
            if (pingTimer.current) clearInterval(pingTimer.current);
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            try { wsRef.current?.close(); } catch (_) {}
            wsRef.current = null;
        };
    }, [userId, connect]);

    const send = useCallback((obj) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return false;
        try { ws.send(JSON.stringify(obj)); return true; } catch (_) { return false; }
    }, []);

    const subscribe = useCallback((type, handler) => {
        if (!handlersRef.current.has(type)) handlersRef.current.set(type, new Set());
        handlersRef.current.get(type).add(handler);
        return () => {
            const set = handlersRef.current.get(type);
            if (set) {
                set.delete(handler);
                if (set.size === 0) handlersRef.current.delete(type);
            }
        };
    }, []);

    return { send, connected, subscribe };
}
