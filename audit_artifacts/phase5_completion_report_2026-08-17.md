# Phase 5 — Communication, Notifications & Deep Links Completion Report

**Date:** 2026-08-17
**Status before publication:** **PASS WITH BLOCKERS**
**Scope:** Comments, Chat semantics, notification schema, Web/Mobile deep links, and the Phase 5 regression suite.

## Scope and implemented requirements

| Area | Completed implementation |
|---|---|
| Comment integrity | `parent_id` is now resolved server-side and must refer to a non-deleted comment on the **same listing**. A foreign, missing, or deleted parent is rejected with `404`. Comment creation is bound to the authenticated account's active country and rejects country tampering with `409`. |
| Comment notifications | A top-level comment notifies the listing owner; a reply notifies the parent-comment author. Self-notifications are suppressed. Both payloads include `listing_id`, `comment_id`, `parent_id` where applicable, `entity_type=comment`, `entity_id`, `schema_version=1`, and the exact focus route. |
| Comment moderation | Added validated comment-report endpoint. Deletion remains owner/admin-only soft deletion. Web and Mobile now expose reply, delete-for-owner, and report-for-other-user flows. |
| Threaded comments | Web and Mobile group root comments with their replies, preserve `parent_id`, display a reply composer state, provide retry/error feedback, and highlight/scroll to the exact comment from a notification link. |
| Chat privacy semantics | Added `POST /chat/messages/{id}/delete-for-me` and `DELETE /chat/conversations/{id}`. These use `hidden_for` per user; they never erase the other participant's conversation or messages. New sends unhide the conversation for the sender. |
| Chat reporting and live deletion | Added validated `POST /chat/messages/{id}/report`. Mobile now handles `message_deleted` WebSocket events. Web and Mobile expose delete-for-me, sender-only delete-for-everyone, message reporting, and delete-conversation-for-me. |
| Chat country boundary | New chat sends validate that both accounts share the active country. Listing-linked messages verify that the listing is visible in that country. Server-side reply snapshots are built from the original stored message in the same conversation, preventing forged reply content. |
| Notification schema | Introduced `schema_version=1`, canonical `entity_type`, `entity_id`, `route`, and normalized identifiers (`listing_id`, `comment_id`, `conversation_id`, `offer_id`, `auction_id`, `user_id`) through `_notification_payload`. This is used by the generic helper and direct price-drop, moderation, broadcast, scheduled-broadcast, test, and Chat paths. |
| Web deep links | `notificationLinks.js` now retains comment IDs in `?focus=comments&comment=...#comments`, understands versioned `route`, and carries `convo` for Chat. Listing recovery returns users who arrived from a notification to `/notifications?missing=listing` if the entity no longer exists. |
| Mobile deep links | Exported one central `routeFromUrl` resolver in `notifications.js`; removed the duplicate route resolver from `MoreScreens`. It carries `commentId`, `focus`, `convo`, listing context, and cold-start pending routes. The Mobile notifications screen now has read-all, error, retry, and live refresh behavior. |

## Validation and test evidence

| Validation | Result |
|---|---|
| `python3 -m compileall -q backend` | **PASS** |
| `pytest -q backend/tests/test_phase5_communication_notifications.py` | **PASS — 4 tests** |
| Backend tests covered | Versioned payload fields; parent-author reply notification and exact comment route; foreign-listing parent rejection; delete-conversation hides records only for requesting user. |
| `CI=true npm test -- --watchAll=false` | **PASS — 4 suites, 14 tests** |
| Web resolver test | **PASS — 3 tests** covering comment reply exact focus, canonical versioned route, and Chat conversation link. |
| `npm run build` | **PASS** — production CRACO bundle compiled successfully. |
| `npx expo export --platform all` | **PASS** — Web, Android, and iOS bundles exported successfully. |
| Pre-publication staging smoke | **PASS (read-only baseline)** — `https://alhrajplus.onrender.com/health` returned `{"status":"ok","service":"haraj-plus-backend"}` and `https://www.alhraj.online/` rendered the public homepage. |

## Issues found and fixed during Phase 5

| Finding | Resolution |
|---|---|
| Versioned `route` was not read by the Web resolver. | Added `data.route` priority and test coverage. |
| `URLSearchParams.size` did not behave consistently under the Web test runtime. | Replaced it with a concrete `toString()` query check. |
| The initially added Mobile resolver replacement left an unreachable duplicate block and duplicate lexical variables. | Removed the duplicate resolver and validated the final app export on all targets. |
| Test fixture did not model the nested country visibility filter. | Corrected the fixture rather than weakening production country validation. |

## Remaining blockers and limitations

| Item | Status and reason |
|---|---|
| Two-account live Chat confirmation | **BLOCKED** until a separate authenticated test account/session is available. This is required to visibly verify fan-out, delete-for-me isolation, and delete-for-everyone across two real clients. |
| Physical-device push-tap validation | **BLOCKED** because Expo/iOS/Android device access and a real registered token are not available in this sandbox. Build/export and resolver paths were verified. |
| Post-publication deployment smoke | **PENDING** until the Phase 5 commit is pushed and Render/Vercel complete their deployments. It must be performed read-only after deploy. |

## Publication record

The commit SHA, target branches, push outcome, deployment revision, and post-deploy smoke result will be appended after the Phase 5 publication step. No Phase 6 implementation is authorized by this report.

## Final phase conclusion

The code and automated regression gate for the Phase 5 scope are complete. Subject to successful commit/push and post-deploy smoke verification, the phase remains **PASS WITH BLOCKERS** exclusively because two-account realtime and physical-device push validation require resources outside this environment.
