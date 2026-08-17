const LISTING_TYPES = new Set([
  "listing_approved", "listing_rejected", "price_drop", "listing_offer",
  "listing_offer_update", "auction", "auction_outbid", "comment",
  "comment_reply", "listing_expired", "listing_sold", "new_listing",
  "moderation_flagged", "ai_moderation_flagged",
]);

function parseData(notification) {
  const raw = notification?.data;
  if (raw && typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {}
  }
  return {};
}

function internalize(url) {
  if (!url || typeof url !== "string") return "";
  const value = url.trim();
  if (value.startsWith("/")) return value;
  try {
    const parsed = new URL(value, globalThis.location?.origin || "https://alhraj.online");
    const origin = globalThis.location?.origin;
    if (!origin || parsed.origin === origin || parsed.hostname === "alhraj.online") {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch (_) {}
  return "";
}

export function notificationData(notification) {
  const data = parseData(notification);
  // Some push bridges wrap the original payload inside data.payload.
  if (data.payload && typeof data.payload === "object") return { ...data.payload, ...data };
  return data;
}

export function notificationUrl(notification) {
  const data = notificationData(notification);
  const type = String(notification?.type || data.type || data.notification_type || "").toLowerCase();
  const explicit = internalize(data.route || data.url || data.deep_link || data.link || notification?.url);
  if (explicit) return explicit;

  const listingId = data.listing_id || data.listingId || data.ad_id || notification?.listing_id;
  const commentId = data.comment_id || data.commentId || (data.entity === "comment" ? data.entity_id : null);
  const conversationId = data.conversation_id || data.convo_id || data.conversationId;
  const senderId = data.sender_id || data.senderId || data.from_user_id || data.caller_id || data.user_id;
  const query = data.query || data.search_query || data.q || "";

  if (["new_message", "message", "chat", "incoming_call", "voice_call"].includes(type)) {
    const params = new URLSearchParams();
    if (senderId) params.set("to", senderId);
    if (listingId) params.set("listing", listingId);
    if (conversationId) params.set("convo", conversationId);
    const queryString = params.toString();
    return queryString ? `/chat?${queryString}` : "/chat";
  }
  if (["search_alert", "saved_search", "search"].includes(type)) {
    return query ? `/search?q=${encodeURIComponent(query)}` : "/saved-searches";
  }
  if (type === "new_follower" || type === "follower") {
    return senderId ? `/seller/${encodeURIComponent(senderId)}` : "/profile";
  }
  if (type === "auction" && listingId) return `/auctions?openBidFor=${encodeURIComponent(listingId)}`;
  if (LISTING_TYPES.has(type) && listingId) {
    const isComment = type === "comment" || type === "comment_reply";
    const commentQuery = isComment && commentId ? `?focus=comments&comment=${encodeURIComponent(commentId)}` : "";
    return `/listing/${encodeURIComponent(listingId)}${commentQuery}${isComment ? "#comments" : ""}`;
  }
  if (type === "admin_broadcast" && explicit) return explicit;
  return "/notifications";
}
