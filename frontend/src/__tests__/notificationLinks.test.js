import { notificationUrl } from "../lib/notificationLinks";

describe("notificationUrl", () => {
  test.each([
    [{ type: "new_message", data: { sender_id: "u1" } }, "/chat?to=u1"],
    [{ type: "comment", data: { listing_id: "l1" } }, "/listing/l1#comments"],
    [{ type: "auction", data: { listing_id: "l2" } }, "/auctions?openBidFor=l2"],
    [{ type: "search_alert", data: { query: "iphone" } }, "/search?q=iphone"],
    [{ type: "story", data: { url: "/reels" } }, "/reels"],
    [{ type: "listing_approved", data: { payload: { url: "https://alhraj.online/listing/l3" } } }, "/listing/l3"],
  ])("maps %o to %s", (notification, expected) => {
    expect(notificationUrl(notification)).toBe(expected);
  });

  test("never returns the home route for an unrecognized notification", () => {
    expect(notificationUrl({ type: "unknown_type" })).toBe("/notifications");
  });
});
