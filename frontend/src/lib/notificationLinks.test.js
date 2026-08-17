import { notificationUrl } from "./notificationLinks";

describe("notificationUrl", () => {
  test("routes a comment reply to the exact comment focus", () => {
    expect(notificationUrl({
      type: "comment_reply",
      data: { entity: "comment", listing_id: "listing-1", comment_id: "comment-9" },
    })).toBe("/listing/listing-1?focus=comments&comment=comment-9#comments");
  });

  test("keeps a canonical explicit versioned route", () => {
    expect(notificationUrl({
      type: "comment",
      data: { schema_version: 1, route: "/listing/listing-1?focus=comments&comment=comment-9#comments" },
    })).toBe("/listing/listing-1?focus=comments&comment=comment-9#comments");
  });

  test("routes chat notification with a conversation id", () => {
    expect(notificationUrl({ type: "new_message", data: { sender_id: "user-2", convo_id: "user-1_user-2" } }))
      .toBe("/chat?to=user-2&convo=user-1_user-2");
  });
});
