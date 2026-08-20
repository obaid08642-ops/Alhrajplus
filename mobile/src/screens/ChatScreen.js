// ChatScreen — Premium WhatsApp-grade design with typing/presence/last-seen/read receipts.
// Two views: conversations list  +  chat thread (selected by route.params.to or list tap).
import { useEffect, useRef, useState, useCallback, useMemo, useLayoutEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useI18n } from "../I18nContext";
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StatusBar, StyleSheet, RefreshControl, Modal, Linking, PanResponder, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SvgXml } from "react-native-svg";
import { CHAT_BG_SVG } from "../components/chatBgSvg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { randomUUID } from "expo-crypto";
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
import NativeVoiceCall from "../components/NativeVoiceCall";
import {
  endNativeCall,
  ensureNativeCallSystem,
  showIncomingNativeCall,
  subscribeNativeCallEvents,
} from "../calls/nativeCallSystem";

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
    const { user } = useAuth();
  const chatSocket = useChatSocket();
  const insets = useSafeAreaInsets();
  const initialTo = route.params?.to;
  const initialListing = route.params?.listing;
  const initialIncomingCallId = route.params?.call_id;
  const initialIncomingCallerName = route.params?.caller_name;
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
      const list = Array.isArray(data) ? data : (Array.isArray(data?.conversations) ? data.conversations : (Array.isArray(data?.items) ? data.items : []));
      setConvos(list);
    } catch (_) {} finally {
      setLoadingConvos(false);
      setRefreshing(false);
    }
  }, [user]);
  const onConvosFocus = useCallback(() => { loadConvos(); }, [loadConvos]);
  useFocusEffect(onConvosFocus);

  // Keep the inbox live while it is open. The payload is normalized for both
  // current backend (`data`) and legacy mobile (`message`) shapes.
  useEffect(() => {
    if (!user) return undefined;
    const off = chatSocket.subscribe("message", event => {
      const message = event?.data || event?.message;
      if (!message?.convo_id) return;
      setConvos(current => {
        const index = current.findIndex(c => c.id === message.convo_id);
        const existing = index >= 0 ? current[index] : { id: message.convo_id, other_id: message.sender_id, other_name: message.sender?.name || t("مستخدم"), unread: 0 };
        const unread = message.sender_id !== user.id && message.convo_id !== activeConvoId ? (existing.unread || 0) + 1 : 0;
        const updated = { ...existing, last_message: message.text || "[وسائط]", last_ts: message.ts || message.created_at, unread };
        const rest = index >= 0 ? current.filter((_, i) => i !== index) : current;
        return [updated, ...rest];
      });
    });
    return () => off?.();
  }, [chatSocket.subscribe, user, activeConvoId, t]);

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
    return <ChatThread convoId={activeConvoId} other={activeOther} listing={activeListing} socket={chatSocket} incomingCallId={initialIncomingCallId} incomingCallerName={initialIncomingCallerName} onBack={closeThread} />;
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
                    <Text style={s.convoTime}>{fmtTime(convo.last_message_at || convo.last_ts)}</Text>
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
  socket,
  incomingCallId,
  incomingCallerName,
  onBack
}) {
  const { t } = useI18n();
  const { isDark, palette } = useThemeMode();
  const nativeCallLabels = useMemo(() => ({
    appName: "Haraj Plus",
    alertTitle: t("إذن حساب الاتصال"),
    alertDescription: t("يحتاج الحراج بلس إذنًا لإظهار وإدارة المكالمات الصوتية الواردة."),
    cancelButton: t("إلغاء"),
    okButton: t("متابعة"),
    channelName: t("المكالمات الصوتية"),
    notificationTitle: t("مكالمة صوتية جارية في الحراج بلس"),
  }), [t]);
  
  const {
    user
  } = useAuth();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    send: wsSend,
    subscribe,
    connected
  } = socket;
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
  const [voiceCallVisible, setVoiceCallVisible] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [incomingCallAccepted, setIncomingCallAccepted] = useState(false);
  const [outgoingCall, setOutgoingCall] = useState(null);
  const [activeCallSignal, setActiveCallSignal] = useState(null);
  const [nativeCallSignals, setNativeCallSignals] = useState([]);
  const enqueueNativeCallSignal = useCallback((event) => {
    if (!event?.call_id || !event?.type) return;
    const key = `${event.type}:${event.call_id}:${JSON.stringify(event.data || {})}`;
    setNativeCallSignals(previous => previous.some(item => `${item.type}:${item.call_id}:${JSON.stringify(item.data || {})}` === key) ? previous : [...previous, event].slice(-64));
  }, []);
  const incomingRingtone = useAudioPlayer(require("../../assets/audio/alhrajplus-call-ringtone.mp3"));
  const isSystemCallId = useCallback((value) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || ""), []);
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
  const isAtBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);
  const typingTimerRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const outboxKey = `hp_chat_outbox_${convoId}`;

  const queueForRetry = useCallback(async (item) => {
    try {
      const existing = JSON.parse(await AsyncStorage.getItem(outboxKey) || "[]");
      const next = [...existing.filter(x => x.client_message_id !== item.client_message_id), item].slice(-50);
      await AsyncStorage.setItem(outboxKey, JSON.stringify(next));
    } catch (_) {}
  }, [outboxKey]);

  const flushOutbox = useCallback(async () => {
    if (!connected) return;
    let queued = [];
    try { queued = JSON.parse(await AsyncStorage.getItem(outboxKey) || "[]"); } catch (_) { queued = []; }
    if (!queued.length) return;
    const remaining = [];
    for (const item of queued) {
      try {
        const { data } = await api.post("/chat/send", {
          receiver_id: item.receiver_id,
          listing_id: item.listing_id || null,
          text: item.text,
          reply_to: item.reply_to || null,
          client_message_id: item.client_message_id,
        });
        setMessages(prev => prev.map(m => m.id === item.client_message_id ? { ...data, pending: false, failed: false } : m));
      } catch (_) { remaining.push(item); }
    }
    try { await AsyncStorage.setItem(outboxKey, JSON.stringify(remaining)); } catch (_) {}
  }, [connected, outboxKey]);

  useEffect(() => { flushOutbox(); }, [flushOutbox]);

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      const {
        data
      } = await api.get(`/chat/messages/${convoId}`);
      const list = Array.isArray(data) ? data : (Array.isArray(data?.messages) ? data.messages : (Array.isArray(data?.items) ? data.items : []));
      setMessages(list);
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
    useEffect(() => { loadHistory(); loadPresence(); }, [loadHistory, loadPresence]);

  // REST remains authoritative for messages. Poll only while the real-time
  // channel reconnects so an intermittent socket cannot make chat appear dead.
  useEffect(() => {
    if (connected) return undefined;
    const timer = setInterval(loadHistory, 8000);
    return () => clearInterval(timer);
  }, [connected, loadHistory]);

  useEffect(() => {
    const shouldRing = !!incomingCall?.call_id && !incomingCallAccepted;
    try {
      if (shouldRing) {
        incomingRingtone.loop = true;
        incomingRingtone.play();
      } else incomingRingtone.pause();
    } catch (_) {}
    return () => { try { incomingRingtone.pause(); } catch (_) {} };
  }, [incomingCall?.call_id, incomingCallAccepted, incomingRingtone]);

  // A notification can open the app after the sender already emitted SDP/ICE.
  // Recover the short-lived authorized queue before asking the user to answer.
  const recoveredIncomingCallRef = useRef(null);
  useEffect(() => {
    if (!incomingCallId || recoveredIncomingCallRef.current === incomingCallId) return undefined;
    recoveredIncomingCallRef.current = incomingCallId;
    let active = true;
    (async () => {
      try {
        const { data } = await api.get(`/voice/calls/${incomingCallId}/signals`);
        const session = data?.session || {};
        if (!active || session.convo_id !== convoId || session.caller_id !== other.id || !Array.isArray(data?.signals) || !data.signals.length) return;
        const recovered = { type: "call_invite", from: session.caller_id, convo_id: convoId, call_id: incomingCallId, data: { caller_name: incomingCallerName || other.name || "Haraj Plus" } };
        setIncomingCallAccepted(false);
        setIncomingCall(recovered);
        setActiveCallSignal(recovered);
        setNativeCallSignals(data.signals);
        if (isSystemCallId(incomingCallId)) {
          try {
            await showIncomingNativeCall({
              callId: incomingCallId,
              callerName: incomingCallerName || other.name || t("مكالمة صوتية"),
              handle: "Haraj Plus",
              payload: { to: session.caller_id, convo_id: convoId, call_id: incomingCallId },
              labels: nativeCallLabels,
            });
          } catch (_) {}
        }
        if (active) setVoiceCallVisible(true);
      } catch (_) {}
    })();
    return () => { active = false; };
  }, [convoId, incomingCallId, incomingCallerName, incomingRingtone, isSystemCallId, nativeCallLabels, other.id, other.name, t, wsSend]);

  // Capture an incoming call offer while the native call UI is opening.
  useEffect(() => {
    const offInvite = subscribe("call_invite", event => {
      if (event?.convo_id !== convoId || event.from !== other.id || !event.call_id) return;
      setIncomingCallAccepted(false);
      setIncomingCall(event);
      setActiveCallSignal(event);
      setNativeCallSignals([event]);
      (async () => {
        if (isSystemCallId(event.call_id)) {
          try {
            await showIncomingNativeCall({
              callId: event.call_id,
              callerName: event.data?.caller_name || other.name || t("مكالمة صوتية"),
              handle: "Haraj Plus",
              payload: { to: event.from, convo_id: convoId, call_id: event.call_id },
              labels: nativeCallLabels,
            });
          } catch (_) {}
        }
        setVoiceCallVisible(true);
      })();
    });
    const offOffer = subscribe("call_offer", event => {
      if (event?.convo_id === convoId && event.from === other.id) {
        setIncomingCallAccepted(false);
        setIncomingCall(event);
        setActiveCallSignal(event);
        enqueueNativeCallSignal(event);
      }
    });
    const offAnswer = subscribe("call_answer", event => {
      if (event?.convo_id === convoId && event.from === other.id) {
        setActiveCallSignal(event);
        enqueueNativeCallSignal(event);
      }
    });
    const offIce = subscribe("call_ice", event => {
      if (event?.convo_id === convoId && event.from === other.id) {
        setActiveCallSignal(event);
        enqueueNativeCallSignal(event);
      }
    });
    const offHangup = subscribe("call_hangup", event => {
      if (event?.convo_id === convoId && event.from === other.id) {
        setIncomingCallAccepted(false);
        setIncomingCall(null);
        setActiveCallSignal(event);
        setVoiceCallVisible(false);
      }
    });
    const offReject = subscribe("call_reject", event => {
      if (event?.convo_id === convoId && event.from === other.id && event.call_id === outgoingCall?.call_id) {
        setActiveCallSignal(event);
        setVoiceCallVisible(false);
        setOutgoingCall(null);
        Alert.alert(t("المكالمة مرفوضة"), t("قام المستخدم برفض المكالمة"));
      }
    });
    return () => { offInvite?.(); offOffer?.(); offAnswer?.(); offIce?.(); offHangup?.(); offReject?.(); };
  }, [convoId, enqueueNativeCallSignal, incomingRingtone, isSystemCallId, nativeCallLabels, other.id, outgoingCall?.call_id, subscribe, t, wsSend]);

  // Bridge CallKit / Android ConnectionService actions back to the secured
  // chat signaling channel. When a platform UI cannot be initialized the
  // existing in-app alert remains the safe fallback.
  useEffect(() => {
    ensureNativeCallSystem(nativeCallLabels).catch(() => {});
    return subscribeNativeCallEvents(event => {
      const active = incomingCall || outgoingCall;
      if (!active?.call_id || event.callId !== active.call_id) return;
      if (event.type === "answer") {
        try { incomingRingtone.pause(); } catch (_) {}
        setIncomingCallAccepted(true);
        setVoiceCallVisible(true);
      } else if (event.type === "end" || event.type === "reset") {
        const type = incomingCall && !voiceCallVisible ? "call_reject" : "call_hangup";
        wsSend({ type, to: incomingCall?.from || other.id, convo_id: convoId, call_id: active.call_id, data: {} });
        setVoiceCallVisible(false);
        setIncomingCallAccepted(false);
        setIncomingCall(null);
        setOutgoingCall(null);
        setActiveCallSignal(null);
        setNativeCallSignals([]);
      }
    });
  }, [convoId, incomingCall, incomingRingtone, nativeCallLabels, other.id, outgoingCall, voiceCallVisible, wsSend]);

  // Subscribe to WS events
  useEffect(() => {
    const unsubMsg = subscribe("message", ev => {
      // Backend sends { type: "message", data: message }. Accept the legacy
      // `message` shape too so older mobile builds can reconnect safely.
      const m = ev?.data || ev?.message;
      if (!m || m.convo_id !== convoId) return;
      setMessages(prev => {
        const existingIndex = prev.findIndex(x =>
          (x.client_message_id && m.client_message_id && x.client_message_id === m.client_message_id) ||
          (String(x.id).startsWith("tmp_") && x.sender_id === m.sender_id && x.text === m.text)
        );
        if (existingIndex >= 0) {
          const next = prev.slice();
          next[existingIndex] = { ...m, pending: false, failed: false };
          return next;
        }
        if (prev.some(x => x.id === m.id)) return prev;
        return [...prev, m];
      });
      // Auto-mark as read since we're viewing
      wsSend({
        type: "read",
        convo_id: convoId
      });
    });
    const unsubTyping = subscribe("typing", ev => {
      if (ev.from !== other.id || (ev.convo_id && ev.convo_id !== convoId)) return;
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
        read: true,
        read_at: ev.ts
      } : m));
    });
    const unsubDelivered = subscribe("delivered", ev => {
      if (ev.convo_id && ev.convo_id !== convoId) return;
      setMessages(prev => prev.map(m => m.id === ev.message_id ? {
        ...m,
        delivered: true,
        delivered_at: ev.ts || new Date().toISOString()
      } : m));
    });
    const unsubPresence = subscribe("presence", ev => {
      if (ev.user_id === other.id) setPresence({
        online: !!ev.online,
        last_seen: ev.last_seen
      });
    });
    // Reactions WS event — peer added/removed an emoji on one of our messages.
    const unsubReact = subscribe("reaction", ev => {
      if (ev.convo_id !== convoId) return;
      setMessages(prev => prev.map(m => m.id === ev.message_id ? { ...m, reactions: ev.reactions } : m));
    });
    const unsubDeleted = subscribe("message_deleted", ev => {
      if (ev.convo_id !== convoId || !ev.message_id) return;
      setMessages(prev => prev.filter(m => m.id !== ev.message_id));
      setReplyTo(prev => prev?.id === ev.message_id ? null : prev);
    });
    return () => {
      unsubMsg();
      unsubTyping();
      unsubRead();
      unsubDelivered();
      unsubPresence();
      unsubReact();
      unsubDeleted();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [subscribe, convoId, other.id, user.id, wsSend]);

  // Keep the latest message visible only while the user is already near the
  // bottom. Incoming messages must never pull the user away from older history.
  useEffect(() => {
    if (!isAtBottomRef.current && didInitialScrollRef.current) return;
    const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: didInitialScrollRef.current }), 80);
    didInitialScrollRef.current = true;
    return () => clearTimeout(timer);
  }, [messages.length, otherTyping]);

  // Auto-send listing context on first open via "Contact Seller" CTA.
  // Guarded by:
  //  • a ref so we only fire ONCE per mount of this thread
  //  • a scan of loaded history — if the same listing id was already
  //    referenced by the current user, skip (idempotent across reopens).
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (autoSentRef.current) return;
    if (!listing || !listing.id || !listing.title) return;
    if (loading) return; // wait until history loaded so the dedupe check is meaningful
    const alreadyMentioned = (messages || []).some(
      m => m.sender_id === user.id && (m.listing_id === listing.id || (m.text && m.text.includes(String(listing.id))))
    );
    if (alreadyMentioned) { autoSentRef.current = true; return; }
    autoSentRef.current = true;
    const url = `https://www.alhraj.online/listing/${listing.slug || listing.id}`;
    const priceLine = listing.price ? ` (${Number(listing.price).toLocaleString()} ${listing.currency || ""})` : "";
    const text = `${t("مرحباً، أنا مهتم بإعلانك")}: ${listing.title}${priceLine}\n${url}`;
    (async () => {
      try {
        const { data } = await api.post("/chat/send", {
          receiver_id: other.id,
          listing_id: listing.id,
          text,
        });
        setMessages(m => [...m, data]);
      } catch (_) {}
    })();
  }, [listing, loading, messages, user.id, other.id, t]);
  const sendTyping = is => {
    const now = Date.now();
    if (is && now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    wsSend({
      type: "typing",
      to: other.id,
      convo_id: convoId,
      is_typing: is
    });
  };
  const handleInputChange = txt => {
    setInput(txt);
    if (txt.trim()) sendTyping(true);else sendTyping(false);
  };
  const sendText = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendTyping(false);
    const replySnap = replyTo;
    setReplyTo(null);
    // Optimistic send — append immediately, replace with server payload on
    // success, mark failed on error. Owner mandate: sending must feel
    // INSTANT (no 1–3 sec wait).
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimistic = {
      id: tempId,
      sender_id: user.id,
      receiver_id: other.id,
      listing_id: listing?.id || null,
      text,
      reply_to: replySnap ? {
        id: replySnap.id,
        text: replySnap.text,
        sender_id: replySnap.sender_id,
        sender_name: replySnap.sender_id === user.id ? t("أنت") : other.name
      } : null,
      created_at: new Date().toISOString(),
      reactions: {},
      pending: true,
      client_message_id: tempId,
    };
    setMessages(m => [...m, optimistic]);
    try {
      const { data } = await api.post("/chat/send", {
        receiver_id: other.id,
        listing_id: listing?.id || null,
        text,
        reply_to: optimistic.reply_to,
        client_message_id: tempId,
      });
      setMessages(m => m.map(msg => msg.id === tempId ? { ...data, pending: false } : msg));
    } catch (e) {
      const retryItem = { client_message_id: tempId, receiver_id: other.id, listing_id: listing?.id || null, text, reply_to: optimistic.reply_to, created_at: optimistic.created_at };
      await queueForRetry(retryItem);
      setMessages(m => m.map(msg => msg.id === tempId ? { ...msg, failed: true, pending: false, queued: true } : msg));
    }
  };
  const sendImage = async () => {
    setShowActions(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsMultipleSelection: false
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setUploading(true);
      const {
        data: sig
      } = await api.get("/cloudinary/signature", {
        params: {
          resource_type: "image",
          folder: "chat"
        }
      });
      const fd = new FormData();
      fd.append("file", {
        uri: asset.uri,
        type: "image/jpeg",
        name: `chat_${Date.now()}.jpg`
      });
      fd.append("api_key", sig.api_key);
      fd.append("timestamp", String(sig.timestamp));
      fd.append("signature", sig.signature);
      fd.append("folder", sig.folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
        method: "POST",
        body: fd
      });
      const out = await res.json();
      if (out.secure_url) {
        const {
          data
        } = await api.post("/chat/send", {
          receiver_id: other.id,
          listing_id: listing?.id || null,
          image: out.secure_url,
          text: null
        });
        setMessages(m => [...m, data]);
      }
    } catch (_) {
      Alert.alert(t("خطأ"), t("تعذر إرسال الصورة"));
    } finally {
      setUploading(false);
    }
  };
  const sendLocation = async () => {
    setShowActions(false);
    try {
      const {
        status
      } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("إذن"), t("نحتاج صلاحية الموقع"));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const {
        data
      } = await api.post("/chat/send", {
        receiver_id: other.id,
        listing_id: listing?.id || null,
        location: { lat: loc.coords.latitude, lng: loc.coords.longitude },
        text: null
      });
      setMessages(m => [...m, data]);
    } catch (_) {
      Alert.alert(t("خطأ"), t("تعذر إرسال الموقع"));
    }
  };
  // Ensure playback-friendly audio mode on screen mount so voice notes are
  // audible even when the device is on silent / had previously been in
  // record mode.
  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      } catch (_) {}
    })();
  }, []);
  const toggleRecording = async () => {
    try {
      if (recording) {
        const startTs = recording._startedAt || Date.now();
        await recording.stop();
        const uri = recording.uri;
        const duration_ms = Math.max(0, Date.now() - startTs);
        setRecording(null);
        // Restore playback-friendly audio mode IMMEDIATELY after stopping.
        // Without this, iOS keeps the session in record mode (earpiece route)
        // and `useAudioPlayer` plays silently → user reports "voice notes
        // don't play back".
        try {
          await setAudioModeAsync({
            allowsRecording: false,
            playsInSilentMode: true,
          });
        } catch (_) {}
        if (!uri) return;
        setUploading(true);
        const {
          data: sig
        } = await api.get("/cloudinary/signature", {
          params: {
            resource_type: "video",
            folder: "chat"
          }
        });
        const fd = new FormData();
        fd.append("file", {
          uri,
          type: "audio/m4a",
          name: `voice_${Date.now()}.m4a`
        });
        fd.append("api_key", sig.api_key);
        fd.append("timestamp", String(sig.timestamp));
        fd.append("signature", sig.signature);
        fd.append("folder", sig.folder);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`, {
          method: "POST",
          body: fd
        });
        const out = await res.json();
        if (out.secure_url) {
          const {
            data
          } = await api.post("/chat/send", {
            receiver_id: other.id,
            listing_id: listing?.id || null,
            voice: out.secure_url,
            voice_duration_ms: duration_ms,
            text: null
          });
          setMessages(m => [...m, data]);
        }
        setUploading(false);
      } else {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(t("إذن"), t("نحتاج صلاحية الميكروفون"));
          return;
        }
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true
        });
        if (!AudioRecorder) { Alert.alert(t("خطأ"), t("ميكروفون غير متاح")); return; }
        const rec = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
        await rec.prepareToRecordAsync();
        rec.record();
        // Stamp start time on the recorder so we can compute duration on stop
        // without polling expo-audio's internal status (unreliable on web).
        rec._startedAt = Date.now();
        setRecording(rec);
      }
    } catch (_) {
      setRecording(null);
      setUploading(false);
      Alert.alert(t("خطأ"), t("تعذر التسجيل"));
    }
  };
  const presenceText = presence.online ? t("متصل الآن") : fmtLastSeen(presence.last_seen, t);
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{
    flex: 1,
    // Bg color matches the SVG's baked background (#f9f6f1) so seams are invisible.
    backgroundColor: palette.bg
  }} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
            {/* Fixed chat background — single absolute layer behind EVERYTHING
                (header, messages, composer). Lifted out of the messages
                container so it can never scroll with the FlatList. */}
            <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
              <SvgXml xml={CHAT_BG_SVG} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
            </View>
            {/* Thread header */}
            <View style={[s.threadHeader, {
      paddingTop: insets.top + 2
    }]}>
                <LinearGradient colors={[palette.primary, palette.primaryHover || palette.primary]} style={StyleSheet.absoluteFillObject} start={{
        x: 0,
        y: 0
      }} end={{
        x: 1,
        y: 0
      }} />
                <TouchableOpacity onPress={onBack} style={s.headBtn} hitSlop={8}>
                    <ChevronLeft size={24} color="#fff" />
                </TouchableOpacity>
                <View style={s.threadAvatar}>
                    {other.avatar ? <Image source={{
          uri: other.avatar
        }} style={{
          width: 38,
          height: 38,
          borderRadius: 999
        }} /> : <Text style={s.avatarText}>{other.name?.slice(0, 1)}</Text>}
                </View>
                <View style={{
        flex: 1,
        marginStart: 6
      }}>
                    <View style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4
        }}>
                        <Text style={s.threadName} numberOfLines={1}>{other.name}</Text>
                        {other.verified && <View style={s.verifiedDot} />}
                    </View>
                    <Text style={s.threadStatus} numberOfLines={1}>
                        {otherTyping ? t("يكتب الآن...") : presenceText}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => { setIncomingCall(null); setActiveCallSignal(null); setNativeCallSignals([]); setOutgoingCall({ call_id: randomUUID() }); setVoiceCallVisible(true); }} style={s.headBtn} hitSlop={8} testID="chat-call-btn">
                    <Phone size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
        Alert.alert(t("خيارات"), `${other.name || t("المستخدم")}`, [{
          text: t("الإبلاغ عن المستخدم"),
          onPress: async () => {
            try {
              await api.post("/reports", {
                target_type: "user",
                target_id: other.id,
                reason: "inappropriate"
              });
              Alert.alert("✅", t("تم استلام بلاغك"));
            } catch (_) {
              Alert.alert(t("خطأ"), t("تعذر إرسال البلاغ"));
            }
          }
        }, {
          text: t("حظر المستخدم"),
          style: "destructive",
          onPress: async () => {
            try {
              await api.post(`/blocks/${other.id}`);
              Alert.alert("🚫", t("تم حظر المستخدم"));
              onBack?.();
            } catch (_) {
              Alert.alert(t("خطأ"), t("تعذر الحظر"));
            }
          }
        }, {
          text: t("حذف المحادثة لدي"),
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/chat/conversations/${convoId}`);
              setMessages([]);
              onBack?.();
            } catch (_) {
              Alert.alert(t("خطأ"), t("تعذر حذف المحادثة"));
            }
          }
        }, {
          text: t("إلغاء"),
          style: "cancel"
        }]);
      }} style={s.headBtn} hitSlop={8} testID="chat-more-btn">
                    <MoreVertical size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Listing context pill */}
            {listing && <TouchableOpacity onPress={() => listing.id && nav.navigate("ListingDetail", {
      id: listing.id
    })} activeOpacity={0.85} style={s.listingPill} testID="chat-listing-pill">
                    {listing.images?.[0] && <Image source={{
        uri: listing.images[0]
      }} style={s.listingThumb} />}
                    <View style={{
        flex: 1
      }}>
                        <Text style={s.listingTitle} numberOfLines={1}>{listing.title}</Text>
                        {listing.price && <Text style={s.listingPrice}>{Number(listing.price).toLocaleString()} {listing.currency}</Text>}
                    </View>
                </TouchableOpacity>}

            {/* Messages */}
            {loading ? <View style={{
      flex: 1,
      justifyContent: "center"
    }}><ActivityIndicator color={colors.primary} /></View> : <View style={{ flex: 1 }}>
                  <FlatList ref={listRef} data={messages} keyExtractor={m => m.id} onScroll={event => {
                    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                    const distance = contentSize.height - (contentOffset.y + layoutMeasurement.height);
                    isAtBottomRef.current = distance < 80;
                  }} scrollEventThrottle={100} contentContainerStyle={{
                    padding: 12,
                    paddingBottom: 16
                  }} renderItem={({
                    item,
                    index
                  }) => {
                    const prev = messages[index - 1];
                    const prevTs = prev?.ts || prev?.created_at;
                    const itemTs = item.ts || item.created_at;
                    const showDay = !prev || fmtDay(prevTs) !== fmtDay(itemTs);
                    return <>
                              {showDay && <View style={s.dayChip}><Text style={s.dayChipText}>{fmtDay(itemTs)}</Text></View>}
                              <MessageBubble m={item} isMine={item.sender_id === user.id} onImagePress={setLightbox} onLongPress={setLongPressMsg} onSwipeReply={setReplyTo} />
                          </>;
                  }} ListFooterComponent={otherTyping ? <TypingIndicator /> : null} onContentSizeChange={() => {
                    if (isAtBottomRef.current || !didInitialScrollRef.current) {
                      listRef.current?.scrollToEnd({ animated: didInitialScrollRef.current });
                      didInitialScrollRef.current = true;
                    }
                  }} />
                </View>}

            {/* Action sheet */}
            {showActions && <View style={s.actionSheet}>
                    <TouchableOpacity onPress={sendImage} style={s.actionBtn}>
                        <View style={[s.actionIcon, {
          backgroundColor: "#10B981"
        }]}><ImageIcon size={20} color="#fff" /></View>
                        <Text style={s.actionLabel}>{t("صورة")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={sendLocation} style={s.actionBtn}>
                        <View style={[s.actionIcon, {
          backgroundColor: "#EF4444"
        }]}><MapPin size={20} color="#fff" /></View>
                        <Text style={s.actionLabel}>{t("الموقع")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
        setShowActions(false);
      }} style={s.actionBtn}>
                        <View style={[s.actionIcon, {
          backgroundColor: colors.textMuted
        }]}><X size={20} color="#fff" /></View>
                        <Text style={s.actionLabel}>{t("إغلاق")}</Text>
                    </TouchableOpacity>
                </View>}

            {/* Composer */}
            <View style={{
      paddingBottom: Math.max(insets.bottom, 8),
      backgroundColor: "#EFEAE2"
    }}>
                {replyTo && <View style={s.replyBox}>
                        <View style={[s.replyBar, {
          backgroundColor: colors.primary
        }]} />
                        <View style={{
          flex: 1
        }}>
                            <Text style={s.replyBoxName}>{replyTo.sender_id === user.id ? t("ردك على نفسك") : `رد على ${other.name}`}</Text>
                            <Text style={s.replyBoxText} numberOfLines={1}>{(replyTo.text || "").slice(0, 80)}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setReplyTo(null)} style={s.replyBoxClose} hitSlop={6}>
                            <X size={14} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>}
                <View style={[s.composer, {
        paddingBottom: 0
      }]}>
                <TouchableOpacity onPress={() => setShowActions(v => !v)} style={s.composerIconBtn} hitSlop={8}>
                    <Plus size={22} color={colors.textMuted} style={{
            transform: [{
              rotate: showActions ? "45deg" : "0deg"
            }]
          }} />
                </TouchableOpacity>
                <TextInput value={input} onChangeText={handleInputChange} placeholder={t("رسالة...")} placeholderTextColor={colors.textMuted} style={s.composerInput} multiline maxLength={2000} onBlur={() => sendTyping(false)} />
                {input.trim() ? <TouchableOpacity onPress={sendText} style={s.sendBtn}>
                        <Send size={18} color="#fff" />
                    </TouchableOpacity> : <TouchableOpacity onPress={toggleRecording} style={[s.sendBtn, recording && {
          backgroundColor: "#EF4444"
        }]}>
                        {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Mic size={20} color="#fff" />}
                    </TouchableOpacity>}
                </View>
            </View>

            {/* Image Lightbox */}
            {lightbox && <Modal visible transparent animationType="fade" onRequestClose={() => setLightbox(null)}>
                    <View style={s.lightboxBg}>
                        <TouchableOpacity style={s.lightboxClose} onPress={() => setLightbox(null)} hitSlop={10}>
                            <X size={28} color="#fff" />
                        </TouchableOpacity>
                        <Image source={{
          uri: lightbox
        }} style={s.lightboxImg} resizeMode="contain" />
                    </View>
                </Modal>}

            {/* Long-press action sheet — Reactions row at top + Reply / Forward / Copy */}
            {longPressMsg && <Modal visible transparent animationType="fade" onRequestClose={() => setLongPressMsg(null)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setLongPressMsg(null)} style={s.lpBg}>
                    <View style={s.lpSheet}>
                        {/* Emoji reactions strip — WhatsApp-style */}
                        <View style={s.reactRow}>
                            {["❤️", "👍", "😂", "😮", "😢", "🙏"].map(em => (
                                <TouchableOpacity
                                    key={em}
                                    onPress={async () => {
                                        const mid = longPressMsg.id;
                                        setLongPressMsg(null);
                                        try {
                                            await api.post(`/chat/messages/${mid}/react`, { emoji: em });
                                            // Optimistic local update — patch the matching message
                                            setMessages(prev => prev.map(m => m.id === mid ? { ...m, reactions: _toggleReactionLocal(m.reactions, em, user?.id) } : m));
                                        } catch (_) {}
                                    }}
                                    style={s.reactBtn}
                                    testID={`msg-react-${em}`}
                                    hitSlop={6}
                                >
                                    <Text style={s.reactEmoji}>{em}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity onPress={() => { setReplyTo(longPressMsg); setLongPressMsg(null); }} style={s.lpRow} testID="msg-action-reply">
                            <Text style={s.lpText}>↩  {t("الرد")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setForwardSrc(longPressMsg); setLongPressMsg(null); }} style={s.lpRow} testID="msg-action-forward">
                            <Text style={s.lpText}>↪  {t("إعادة توجيه")}</Text>
                        </TouchableOpacity>
                        {(longPressMsg.text) ? <TouchableOpacity onPress={async () => {
                            try { const Clip = require("@react-native-clipboard/clipboard").default; Clip.setString(longPressMsg.text); }
                            catch { /* clipboard module not installed — silently skip */ }
                            setLongPressMsg(null);
                        }} style={s.lpRow} testID="msg-action-copy">
                            <Text style={s.lpText}>📋  {t("نسخ النص")}</Text>
                        </TouchableOpacity> : null}
                        <TouchableOpacity onPress={async () => { const message = longPressMsg; setLongPressMsg(null); try { await api.post(`/chat/messages/${message.id}/delete-for-me`); setMessages(prev => prev.filter(m => m.id !== message.id)); } catch (_) { Alert.alert(t("خطأ"), t("تعذر حذف الرسالة")); } }} style={s.lpRow} testID="msg-action-delete-for-me"><Text style={s.lpText}>🗑  {t("حذف لدي")}</Text></TouchableOpacity>
                        {longPressMsg.sender_id === user?.id ? <TouchableOpacity onPress={async () => { const message = longPressMsg; setLongPressMsg(null); try { await api.delete(`/chat/messages/${message.id}`); setMessages(prev => prev.filter(m => m.id !== message.id)); } catch (_) { Alert.alert(t("خطأ"), t("تعذر حذف الرسالة")); } }} style={s.lpRow} testID="msg-action-delete-all"><Text style={[s.lpText, { color: "#DC2626" }]}>🗑  {t("حذف لدى الجميع")}</Text></TouchableOpacity> : null}
                        <TouchableOpacity onPress={async () => { const message = longPressMsg; setLongPressMsg(null); try { await api.post(`/chat/messages/${message.id}/report`, { reason: "inappropriate_content" }); Alert.alert(t("تم"), t("تم استلام بلاغك")); } catch (_) { Alert.alert(t("خطأ"), t("تعذر إرسال البلاغ")); } }} style={s.lpRow} testID="msg-action-report"><Text style={s.lpText}>⚑  {t("إبلاغ عن الرسالة")}</Text></TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>}

            {/* Forward contact picker */}
            {forwardSrc && <ForwardPicker src={forwardSrc} onClose={() => setForwardSrc(null)} currentUser={user} onForwarded={() => { setForwardSrc(null); }} />}
            <NativeVoiceCall visible={voiceCallVisible} role={incomingCall ? "receiver" : "caller"} to={incomingCall?.from || other.id} convoId={convoId} callId={incomingCall?.call_id || outgoingCall?.call_id} signalingEvents={nativeCallSignals} name={other.name} incomingAccepted={incomingCallAccepted} onAcceptIncoming={() => { try { incomingRingtone.pause(); } catch (_) {} setIncomingCallAccepted(true); }} onRejectIncoming={() => { const activeCall = incomingCall; if (activeCall?.call_id) wsSend({ type: "call_reject", to: activeCall.from || other.id, convo_id: convoId, call_id: activeCall.call_id, data: {} }); endNativeCall(activeCall?.call_id, "local"); setVoiceCallVisible(false); setIncomingCallAccepted(false); setIncomingCall(null); setActiveCallSignal(null); setNativeCallSignals([]); }} onSignal={wsSend} onClose={({ signalAlreadySent = false } = {}) => { const activeCall = incomingCall || outgoingCall; if (activeCall?.call_id) endNativeCall(activeCall.call_id, signalAlreadySent ? "local" : "remote"); if (!signalAlreadySent && activeCall?.call_id) wsSend({ type: "call_hangup", to: incomingCall?.from || other.id, convo_id: convoId, call_id: activeCall.call_id, data: {} }); setVoiceCallVisible(false); setIncomingCallAccepted(false); setIncomingCall(null); setOutgoingCall(null); setActiveCallSignal(null); setNativeCallSignals([]); }} />
        </KeyboardAvoidingView>;
}

function ForwardPicker({ src, onClose, currentUser, onForwarded }) {
    const { t } = useI18n();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/chat/conversations");
                const list = Array.isArray(data) ? data : (Array.isArray(data?.conversations) ? data.conversations : (Array.isArray(data?.items) ? data.items : []));
                setList(list);
            } catch (_) {} finally { setLoading(false); }
        })();
    }, []);
    const send = async (other) => {
        try {
            await api.post("/chat/send", {
                receiver_id: other.id,
                text: src.text || null,
                image: src.image || null,
                voice: src.voice || null,
                voice_duration_ms: src.voice_duration_ms || null,
                forwarded_from: { name: src.sender_name || "", message_id: src.id }
            });
            onForwarded();
            Alert.alert("✓", t("تمت إعادة التوجيه"));
        } catch (_) {
            Alert.alert(t("خطأ"), t("تعذرت إعادة التوجيه"));
        }
    };
    return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={s.lpBg}>
            <View style={[s.lpSheet, { maxHeight: "70%" }]}>
                <Text style={s.fwdTitle}>{t("إعادة توجيه إلى")}</Text>
                {loading ? <ActivityIndicator color={colors.primary} style={{ padding: 20 }} /> :
                  list.length === 0 ? <Text style={s.fwdEmpty}>{t("لا توجد محادثات")}</Text> :
                  <FlatList data={list} keyExtractor={c => c.id} renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => send({ id: item.other_id, name: item.other_name })} style={s.fwdRow} testID={`fwd-to-${item.other_id}`}>
                        <Text style={s.fwdName}>{item.other_name || t("مستخدم")}</Text>
                        <Text style={s.fwdSub} numberOfLines={1}>{item.last_message || ""}</Text>
                    </TouchableOpacity>
                  )} />}
            </View>
        </TouchableOpacity>
    </Modal>;
}

// =============== Message Bubble ===============
function MessageBubble({
  m,
  isMine,
  onImagePress,
  onLongPress,
  onSwipeReply
}) {
  const { t } = useI18n();
  // Swipe-to-reply (WhatsApp-style). Horizontal pan ≥ 60 px in the user's
  // natural reading direction (RTL → swipe LEFT, LTR → swipe RIGHT) triggers
  // onSwipeReply(m). The bubble follows the finger up to ±90 px then springs
  // back. We intentionally only intercept when the swipe is mostly horizontal
  // so vertical list scrolling stays smooth.
  const translateX = useRef(new Animated.Value(0)).current;
  const SWIPE_TRIGGER = 60;
  const MAX_TRANSLATE = 90;
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderMove: (_e, g) => {
      const dx = Math.max(-MAX_TRANSLATE, Math.min(MAX_TRANSLATE, g.dx));
      translateX.setValue(dx);
    },
    onPanResponderRelease: (_e, g) => {
      const triggered = Math.abs(g.dx) > SWIPE_TRIGGER;
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
      if (triggered && onSwipeReply) onSwipeReply(m);
    },
    onPanResponderTerminate: () => {
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;
  const text = m.text || "";
  // ✅ NEW unified schema: read media from dedicated fields (matches Web).
  //    Fallback (backward-compat): older messages stored the URL inside `text`
  //    with an emoji prefix — keep parsing those so the history still renders.
  const legacyImage = text.startsWith("📷 ");
  const legacyVoice = text.startsWith("🎙️ ");
  const legacyLocation = text.startsWith("📍 ");
  const isImage = !!m.image || legacyImage;
  const isVoice = !!m.voice || legacyVoice;
  const isLocation = !!m.location || legacyLocation;
  // Build the URL (or coords) for whichever media this message carries.
  let url = null;
  if (m.image) url = m.image;
  else if (m.voice) url = m.voice;
  else if (m.location && (m.location.lat != null) && (m.location.lng != null))
    url = `https://maps.google.com/?q=${m.location.lat},${m.location.lng}`;
  else if (legacyImage) url = text.slice("📷 ".length).trim();
  else if (legacyVoice) url = text.slice("🎙️ ".length).trim();
  else if (legacyLocation) url = text.slice("📍 ".length).trim();
  // Hide the raw URL when the message has a media field (web→mobile would
  // otherwise dump the bare Cloudinary link below the player).  Plain text
  // messages still render through the normal `text` path below.
  const showText = !isImage && !isVoice && !isLocation && text.length > 0;
  // Strict null-guard per owner mandate — never destructure or access reply_to
  // sub-properties unless explicitly validated. Prevents the runtime crash
  // "Property 'replyTo' doesn't exist" reported on the previous build.
  const replyTo = m?.reply_to ?? null;
  const call = m?.system_type === "call" ? m.call : null;
  if (call) {
    const duration = Math.max(0, Number(call.duration_seconds || 0));
    const durationLabel = duration ? `${String(Math.floor(duration / 60)).padStart(2, "0")}:${String(duration % 60).padStart(2, "0")}` : "";
    const statusLabel = call.status === "missed" ? (isMine ? t("لم يتم الرد") : t("مكالمة فائتة"))
      : call.status === "rejected" ? t("تم رفض المكالمة")
        : call.status === "connected" ? t("مكالمة جارية")
          : call.status === "ended" ? t("انتهت مكالمة صوتية")
            : (isMine ? t("مكالمة صوتية صادرة") : t("مكالمة صوتية واردة"));
    const warning = call.status === "missed" || call.status === "rejected";
    return <View style={{ alignItems: "center", marginVertical: 10 }} testID={`call-timeline-${call.id}`}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}>
        <Phone size={15} color={warning ? "#F87171" : colors.primary} />
        <Text style={{ color: "#D6E6F4", fontSize: 12, fontWeight: "700" }}>{statusLabel}{durationLabel ? ` · ${durationLabel}` : ""}</Text>
        <Text style={{ color: "#9BAFC5", fontSize: 11 }}>{fmtTime(m.ts || m.created_at)}</Text>
      </View>
    </View>;
  }
  return <Animated.View {...panResponder.panHandlers} style={{ transform: [{ translateX }] }}>
    <TouchableOpacity activeOpacity={0.85} onLongPress={() => onLongPress?.(m)} delayLongPress={350} style={[s.bubbleWrap, {
    alignItems: isMine ? "flex-end" : "flex-start"
  }]}>
            <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther, isImage && {
      padding: 3
    }]}>
                {/* Forwarded badge (shown above the bubble content). */}
                {m.forwarded_from ? <View style={s.fwdBadge}>
                    <Text style={s.fwdBadgeText}>↪ {t("معاد توجيهها")}{m.forwarded_from.name ? ` · ${m.forwarded_from.name}` : ""}</Text>
                </View> : null}
                {/* Quoted reply preview */}
                {replyTo && <View style={[s.replyPreview, isMine && {
        backgroundColor: "rgba(255,255,255,0.12)"
      }]}>
                        <View style={[s.replyBar, {
          backgroundColor: isMine ? "#FFD166" : colors.primary
        }]} />
                        <View style={{
          flex: 1
        }}>
                            <Text style={[s.replyName, isMine && {
            color: "#FFD166"
          }]} numberOfLines={1}>
                                {replyTo.sender_name || (replyTo.sender_id === m.sender_id ? t("أنت") : "")}
                            </Text>
                            <Text style={[s.replyText, isMine && {
            color: "rgba(255,255,255,0.85)"
          }]} numberOfLines={1}>
                                {(replyTo.text || "").startsWith("📷") ? t("📷 صورة") : (replyTo.text || "").startsWith("🎙️") ? t("🎙️ رسالة صوتية") : (replyTo.text || "").startsWith("📍") ? t("📍 موقع") : replyTo.text || ""}
                            </Text>
                        </View>
                    </View>}
                {isImage && url ? <TouchableOpacity onPress={() => onImagePress?.(url)} activeOpacity={0.9}>
                        <Image source={{
          uri: url
        }} style={s.bubbleImg} resizeMode="cover" />
                    </TouchableOpacity> : isVoice && url ? <VoicePlayer url={url} isMine={isMine} duration_ms={m.voice_duration_ms} /> : isLocation && url ? <TouchableOpacity onPress={() => Linking.openURL(url)} style={s.locationBubble}>
                        <MapPin size={14} color={isMine ? "#fff" : colors.primary} />
                        <Text style={[s.bubbleText, isMine && {
          color: "#fff"
        }]}>{t("📍 الموقع المشترك")}</Text>
                    </TouchableOpacity> : showText ? <Text style={[s.bubbleText, isMine && {
        color: "#fff"
      }]} selectable>{renderLinkedText(text, isMine)}</Text> : null}
                <View style={[s.metaRow, isImage && {
        paddingHorizontal: 8,
        paddingBottom: 4
      }]}>
                    <Text style={[s.metaTime, isMine && {
          color: "rgba(255,255,255,0.85)"
        }]}>{fmtTime(m.ts || m.created_at)}</Text>
                    {isMine && (
                      m.failed ? <Text style={{ color: "#fca5a5", fontSize: 12, fontWeight: "900" }}>!</Text>
                      : m.pending ? <Check size={13} color="rgba(255,255,255,0.55)" />
                      : m.read ? <CheckCheck size={14} color="#B5E61D" strokeWidth={3} />
                      : m.delivered ? <CheckCheck size={14} color="rgba(181,230,29,0.55)" strokeWidth={3} />
                      : <Check size={14} color="#B5E61D" strokeWidth={3} />
                    )}
                </View>
            </View>
            {/* Reactions row — rendered just below the bubble, slightly offset
                to overlap the bottom edge (WhatsApp style). */}
            {m.reactions && Object.keys(m.reactions).length > 0 && (
                <View style={[s.reactionsRow, isMine ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]}>
                    {Object.entries(m.reactions).map(([em, users]) => (
                        <View key={em} style={s.reactionChip}>
                            <Text style={s.reactionChipEmoji}>{em}</Text>
                            {(users || []).length > 1 && <Text style={s.reactionChipCount}>{(users || []).length}</Text>}
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
  </Animated.View>;
}

// =============== Voice Player ===============
function VoicePlayer({
  url,
  isMine,
  duration_ms
}) {
  const { t } = useI18n();
  const player = useAudioPlayer(url);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 position
  const [elapsed, setElapsed] = useState(0);   // seconds played
  // Ensure playback-route audio mode (not record route) BEFORE every play.
  // Solves "voice messages don't play back" — iOS keeps the session in
  // record mode (earpiece) after recording until reset.
  const ensurePlaybackMode = useCallback(async () => {
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch (_) {}
  }, []);
  // Stable per-message waveform — derived from the URL so each clip has its
  // own pseudo-random heights instead of every bubble showing the same shape.
  const BARS = useMemo(() => {
    const seed = (url || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: 22 }, (_, i) => {
      const x = Math.sin((seed + i * 37) * 0.61);
      return 5 + Math.round(((x + 1) / 2) * 18); // 5..23 px
    });
  }, [url]);
  const toggle = async () => {
    if (!player) return;
    try {
      if (playing) {
        player.pause();
        setPlaying(false);
      } else {
        // Reset audio session every time → guarantees speaker-route playback.
        await ensurePlaybackMode();
        // If clip already finished, rewind before playing again.
        try { if ((player.currentTime || 0) >= (player.duration || 0) - 0.1) player.seekTo(0); } catch (_) {}
        player.play();
        setPlaying(true);
      }
    } catch (_) {
      Alert.alert(t("خطأ"), t("تعذر تشغيل الصوت"));
    }
  };
  useEffect(() => {
    if (!player) return;
    // Fast tick (120ms) for smooth waveform animation while playing.
    const interval = setInterval(() => {
      if (player.playing !== playing) setPlaying(player.playing);
      const dur = player.duration || (duration_ms ? duration_ms / 1000 : 0);
      const cur = player.currentTime || 0;
      if (dur > 0) setProgress(Math.min(1, cur / dur));
      setElapsed(cur);
      if (cur >= (dur || 0) - 0.1 && (dur || 0) > 0) {
        player.seekTo(0);
        player.pause();
        setPlaying(false);
        setProgress(0);
        setElapsed(0);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [player, playing, duration_ms]);
  const totalSec = duration_ms ? duration_ms / 1000 : (player?.duration || 0);
  const label = (() => {
    if (!totalSec) return t("صوت");
    const used = playing ? elapsed : totalSec;
    const m = Math.floor(used / 60);
    const s = Math.floor(used % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  })();
  return <View style={s.voiceBubble}>
            <TouchableOpacity onPress={toggle} style={[s.voicePlayBtn, isMine && { backgroundColor: "rgba(255,255,255,0.95)" }]}>
                {playing ? <Pause size={14} color={isMine ? colors.primaryDeep : "#fff"} fill={isMine ? colors.primaryDeep : "#fff"} /> : <Play size={14} color={isMine ? colors.primaryDeep : "#fff"} fill={isMine ? colors.primaryDeep : "#fff"} />}
            </TouchableOpacity>
            <View style={s.voiceWave}>
                {BARS.map((h, i) => {
                  // Bars before the playhead are "active" (filled), after are dim.
                  const pos = (i + 0.5) / BARS.length;
                  const passed = pos <= progress;
                  // Active bar bounces a bit while playing for a TikTok-like animation.
                  const bonus = playing && Math.abs(pos - progress) < 0.08 ? 4 : 0;
                  return <View key={i} style={[s.voiceBar, {
                    height: h + bonus,
                    backgroundColor: passed
                      ? (isMine ? "#fff" : colors.primaryDeep)
                      : (isMine ? "rgba(255,255,255,0.45)" : "rgba(11,21,48,0.25)")
                  }]} />;
                })}
            </View>
            <Text style={[s.voiceTime, {
      color: isMine ? "rgba(255,255,255,0.85)" : colors.textMuted
    }]}>{label}</Text>
        </View>;
}

// =============== Typing Indicator ===============
function TypingIndicator() {
  return <View style={[s.bubbleWrap, {
    alignItems: "flex-start"
  }]}>
            <View style={[s.bubble, s.bubbleOther, {
      paddingVertical: 12,
      flexDirection: "row",
      gap: 4
    }]}>
                <Dot delay={0} />
                <Dot delay={150} />
                <Dot delay={300} />
            </View>
        </View>;
}
function Dot({
  delay
}) {
  const [bright, setBright] = useState(false);
  useEffect(() => {
    const start = setTimeout(() => {
      const id = setInterval(() => setBright(b => !b), 500);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(start);
  }, [delay]);
  return <View style={{
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: bright ? colors.primary : colors.textMuted,
    opacity: bright ? 1 : 0.4
  }} />;
}

// =============== Styles ===============
const s = StyleSheet.create({
  // Guest
  guestWrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14
  },
  guestIcon: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: "rgba(137,207,240,0.15)",
    alignItems: "center",
    justifyContent: "center"
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text
  },
  guestSub: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center"
  },
  guestBtn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12
  },
  guestBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800"
  },
  // Conversations list
  listHeader: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: colors.bg
  },
  listTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 10
  },
  searchPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    paddingVertical: 0
  },
  convoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: colors.surface,
    gap: 10
  },
  sep: {
    height: 1,
    backgroundColor: colors.border,
    marginStart: 70
  },
  avatarWrap: {
    width: 52,
    height: 52,
    position: "relative"
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999
  },
  avatarGrad: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 20
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    end: 1,
    width: 13,
    height: 13,
    borderRadius: 999,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: colors.surface
  },
  convoTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  convoName: {
    fontSize: 14.5,
    fontWeight: "800",
    color: colors.text,
    flex: 1,
    marginEnd: 6
  },
  convoTime: {
    fontSize: 10.5,
    color: colors.textMuted
  },
  convoBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    gap: 6
  },
  convoMsg: {
    flex: 1,
    fontSize: 12.5,
    color: colors.textMuted
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5
  },
  unreadText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800"
  },
  empty: {
    alignItems: "center",
    padding: 40,
    gap: 10
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: "rgba(137,207,240,0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center"
  },
  // Thread header
  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingBottom: 6,
    gap: 4
  },
  headBtn: {
    padding: 6
  },
  threadAvatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  threadName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    flexShrink: 1
  },
  verifiedDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#10B981"
  },
  threadStatus: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10.5,
    marginTop: 1
  },
  // Listing context
  listingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 8,
    backgroundColor: "#FFF9E6",
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  listingThumb: {
    width: 38,
    height: 38,
    borderRadius: 8
  },
  listingTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text
  },
  listingPrice: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "700",
    marginTop: 1
  },
  // Day chip
  dayChip: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 10
  },
  dayChipText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.text
  },
  // Bubble
  bubbleWrap: {
    marginBottom: 8,
    paddingHorizontal: 4
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...shadow.card,
    shadowOpacity: 0.05
  },
  bubbleMine: {
    // Owner mandate: baby-blue branded outgoing bubble (no more WhatsApp green).
    backgroundColor: "#5FB6E0",
    borderBottomEndRadius: 6
  },
  bubbleOther: {
    backgroundColor: "#FFFFFF",
    borderBottomStartRadius: 6
  },
  bubbleText: {
    fontSize: 14.5,
    color: colors.text,
    lineHeight: 20
  },
  bubbleImg: {
    width: 220,
    height: 160,
    borderRadius: 14,
    marginVertical: 2
  },
  voiceBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 180,
    paddingVertical: 4
  },
  voicePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  voiceWave: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flex: 1
  },
  voiceBar: {
    width: 2.5,
    borderRadius: 1
  },
  voiceTime: {
    fontSize: 10.5,
    fontWeight: "700"
  },
  locationBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 2
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4
  },
  metaTime: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600"
  },
  // Composer
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 6,
    backgroundColor: "#EFEAE2"
  },
  composerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff"
  },
  composerInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
    minHeight: 38
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#075E54",
    alignItems: "center",
    justifyContent: "center"
  },
  // Action sheet
  actionSheet: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: colors.border
  },
  actionBtn: {
    alignItems: "center",
    gap: 5
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  actionLabel: {
    fontSize: 11,
    color: colors.text,
    fontWeight: "700"
  },
  // Lightbox
  lightboxBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    alignItems: "center",
    justifyContent: "center"
  },
  // Long-press action sheet + forward picker
  lpBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: 20
  },
  lpSheet: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 8,
    ...shadow.cardLarge
  },
  lpRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginVertical: 2
  },
  lpText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "800",
    textAlign: "right"
  },
  fwdTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.text,
    textAlign: "right",
    padding: 12,
    paddingBottom: 8
  },
  fwdEmpty: {
    padding: 24,
    color: colors.textMuted,
    textAlign: "center"
  },
  fwdRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginVertical: 2,
    backgroundColor: colors.surfaceCard
  },
  fwdName: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.text,
    textAlign: "right"
  },
  fwdSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: 2
  },
  fwdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(137,207,240,0.18)",
    borderRadius: 999,
    alignSelf: "flex-start",
    marginBottom: 6
  },
  fwdBadgeText: {
    fontSize: 10.5,
    color: colors.primaryDeep,
    fontWeight: "900"
  },
  // Reaction strip inside long-press sheet — 6 emojis in a row.
  reactRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 999
  },
  reactBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  reactEmoji: {
    fontSize: 26
  },
  // Reaction chips displayed under a message bubble.
  reactionsRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: -4,
    marginBottom: 6,
    paddingHorizontal: 4
  },
  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2
  },
  reactionChipEmoji: {
    fontSize: 11
  },
  reactionChipCount: {
    fontSize: 9.5,
    color: colors.textMuted,
    fontWeight: "700"
  },
  lightboxClose: {
    position: "absolute",
    top: 60,
    end: 20,
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10
  },
  lightboxImg: {
    width: "100%",
    height: "85%"
  },
  // Reply
  replyPreview: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginBottom: 4,
    overflow: "hidden"
  },
  replyBar: {
    width: 3,
    borderRadius: 2
  },
  replyName: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 1
  },
  replyText: {
    fontSize: 11,
    color: colors.textMuted
  },
  replyBox: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 8,
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
    paddingEnd: 10,
    ...shadow.card,
    shadowOpacity: 0.04
  },
  replyBoxName: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary
  },
  replyBoxText: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 1
  },
  replyBoxClose: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center"
  }
});