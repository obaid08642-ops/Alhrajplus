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
  const explicit = internalize(data.url || data.deep_link || data.link || notification?.url);
  if (explicit) return explicit;

  const listingId = data.listing_id || data.listingId || data.ad_id || data.entity_id || data.target_id || notification?.listing_id;
  const senderId = data.sender_id || data.senderId || data.from_user_id || data.user_id;
  const query = data.query || data.search_query || data.q || "";

  if (["new_message", "message", "chat"].includes(type)) {
    if (senderId) return `/chat?to=${encodeURIComponent(senderId)}${listingId ? `&listing=${encodeURIComponent(listingId)}` : ""}`;
    return "/chat";
  }
  if (["search_alert", "saved_search", "search"].includes(type)) {
    return query ? `/search?q=${encodeURIComponent(query)}` : "/saved-searches";
  }
  if (type === "new_follower" || type === "follower") {
    return senderId ? `/seller/${encodeURIComponent(senderId)}` : "/profile";
  }
  if (type === "auction" && listingId) return `/auctions?openBidFor=${encodeURIComponent(listingId)}`;
  if (LISTING_TYPES.has(type) && listingId) {
    const focus = type === "comment" || type === "comment_reply" ? "#comments" : "";
    return `/listing/${encodeURIComponent(listingId)}${focus}`;
  }
  if (type === "admin_broadcast" && explicit) return explicit;
  return "/notifications";
}
