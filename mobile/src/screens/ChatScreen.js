// ChatScreen — Premium WhatsApp-grade design with typing/presence/last-seen/read receipts.
// Two views: conversations list  +  chat thread (selected by route.params.to or list tap).
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useI18n } from "../I18nContext";
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StatusBar, StyleSheet, RefreshControl, Modal, Linking } from "react-native";
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
import { colors, radius, shadow } from "../theme";

// Audio player module for voice playback
import { useAudioPlayer } from "expo-audio";
function fmtLastSeen(iso) {
  if (!iso) return "متصل الآن";
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "آخر ظهور قبل لحظات";
  if (diff < 3600) return `آخر ظهور قبل ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `آخر ظهور قبل ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 604800) return `آخر ظهور قبل ${Math.floor(diff / 86400)} يوم`;
  return `آخر ظهور ${d.toLocaleDateString("ar")}`;
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
  const [showActions, setShowActions] = useState(false);
  // Long-press action sheet: when set, shows {message, options[]}
  const [longPressMsg, setLongPressMsg] = useState(null);
  // Forward picker: when set to a message object, shows the contact picker modal
  const [forwardSrc, setForwardSrc] = useState(null);
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
        read: true,
        read_at: ev.ts
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
    return () => {
      unsubMsg();
      unsubTyping();
      unsubRead();
      unsubPresence();
      unsubReact();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [subscribe, convoId, other.id, user.id, wsSend]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({
      animated: true
    }), 80);
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
    const url = `https://alhrajplus.com/listing/${listing.id}`;
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
    try {
      const {
        data
      } = await api.post("/chat/send", {
        receiver_id: other.id,
        listing_id: listing?.id || null,
        text,
        reply_to: replySnap ? {
          id: replySnap.id,
          text: replySnap.text,
          sender_id: replySnap.sender_id,
          sender_name: replySnap.sender_id === user.id ? t("أنت") : other.name
        } : null
      });
      setMessages(m => [...m, data]);
    } catch (e) {
      Alert.alert(t("خطأ"), t("تعذر إرسال الرسالة"));
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
          text: `📷 ${out.secure_url}`
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
      const url = `https://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;
      const {
        data
      } = await api.post("/chat/send", {
        receiver_id: other.id,
        listing_id: listing?.id || null,
        text: `📍 ${url}`
      });
      setMessages(m => [...m, data]);
    } catch (_) {
      Alert.alert(t("خطأ"), t("تعذر إرسال الموقع"));
    }
  };
  const toggleRecording = async () => {
    try {
      if (recording) {
        const startTs = recording._startedAt || Date.now();
        await recording.stop();
        const uri = recording.uri;
        const duration_ms = Math.max(0, Date.now() - startTs);
        setRecording(null);
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
            text: `🎙️ ${out.secure_url}`
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
  const presenceText = presence.online ? t("متصل الآن") : fmtLastSeen(presence.last_seen);
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{
    flex: 1,
    // Bg color matches the SVG's baked background (#f9f6f1) so seams are invisible.
    backgroundColor: "#f9f6f1"
  }} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
            {/* Thread header */}
            <View style={[s.threadHeader, {
      paddingTop: insets.top + 2
    }]}>
                <LinearGradient colors={[colors.primary, "#2A8CBD"]} style={StyleSheet.absoluteFillObject} start={{
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
                <TouchableOpacity onPress={() => {
        const phone = other.phone_full || other.phone;
        if (phone) {
          Linking.openURL(`tel:${phone}`);
        } else {
          Alert.alert(t("غير متاح"), t("رقم الهاتف غير متوفر"));
        }
      }} style={s.headBtn} hitSlop={8} testID="chat-call-btn">
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
    }}><ActivityIndicator color={colors.primary} /></View> : <View style={{ flex: 1, position: "relative" }}>
                  {/* SVG product pattern bg — owner-supplied tile (390×844).
                      Rendered once as a single full-screen layer behind the
                      message list. We don't tile to avoid expensive re-renders
                      on big screens; the SVG is opacity-baked already. */}
                  <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
                    <SvgXml xml={CHAT_BG_SVG} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
                  </View>
                  <FlatList ref={listRef} data={messages} keyExtractor={m => m.id} contentContainerStyle={{
                    padding: 12,
                    paddingBottom: 16
                  }} renderItem={({
                    item,
                    index
                  }) => {
                    const prev = messages[index - 1];
                    const showDay = !prev || fmtDay(prev.created_at) !== fmtDay(item.created_at);
                    return <>
                              {showDay && <View style={s.dayChip}><Text style={s.dayChipText}>{fmtDay(item.created_at)}</Text></View>}
                              <MessageBubble m={item} isMine={item.sender_id === user.id} onImagePress={setLightbox} onLongPress={setLongPressMsg} />
                          </>;
                  }} ListFooterComponent={otherTyping ? <TypingIndicator /> : null} onContentSizeChange={() => listRef.current?.scrollToEnd({
                    animated: false
                  })} />
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
                    </View>
                </TouchableOpacity>
            </Modal>}

            {/* Forward contact picker */}
            {forwardSrc && <ForwardPicker src={forwardSrc} onClose={() => setForwardSrc(null)} currentUser={user} onForwarded={() => { setForwardSrc(null); }} />}
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
                setList(data || []);
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
  onLongPress
}) {
  const { t } = useI18n();
  
  const text = m.text || "";
  const isImage = text.startsWith("📷 ");
  const isVoice = text.startsWith("🎙️ ");
  const isLocation = text.startsWith("📍 ");
  const url = isImage || isVoice || isLocation ? text.slice(2).trim() : null;
  // Strict null-guard per owner mandate — never destructure or access reply_to
  // sub-properties unless explicitly validated. Prevents the runtime crash
  // "Property 'replyTo' doesn't exist" reported on the previous build.
  const replyTo = m?.reply_to ?? null;
  return <TouchableOpacity activeOpacity={0.85} onLongPress={() => onLongPress?.(m)} delayLongPress={350} style={[s.bubbleWrap, {
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
                    </TouchableOpacity> : <Text style={[s.bubbleText, isMine && {
        color: "#fff"
      }]} selectable>{renderLinkedText(text, isMine)}</Text>}
                <View style={[s.metaRow, isImage && {
        paddingHorizontal: 8,
        paddingBottom: 4
      }]}>
                    <Text style={[s.metaTime, isMine && {
          color: "rgba(255,255,255,0.75)"
        }]}>{fmtTime(m.created_at)}</Text>
                    {isMine && (m.read ? <CheckCheck size={12} color="#4FC3F7" /> : <Check size={12} color="rgba(255,255,255,0.75)" />)}
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
        </TouchableOpacity>;
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
  // Stable per-message waveform — derived from the URL so each clip has its
  // own pseudo-random heights instead of every bubble showing the same shape.
  const BARS = useMemo(() => {
    const seed = (url || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: 22 }, (_, i) => {
      const x = Math.sin((seed + i * 37) * 0.61);
      return 5 + Math.round(((x + 1) / 2) * 18); // 5..23 px
    });
  }, [url]);
  const toggle = () => {
    if (playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
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