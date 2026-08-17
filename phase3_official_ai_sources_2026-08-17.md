# Official AI source notes — 2026-08-17

## OpenAI
Source: https://developers.openai.com/api/docs/guides/rate-limits

The official rate-limit guide describes limits using RPM, RPD, TPM and related model/service metrics. It states that rate limits are restrictions over a specified period, are used to protect against abuse and ensure fair access, and vary by organization/usage tier and model. Exact values should be read from the provider dashboard/API context rather than hardcoded in Alhrajplus.

## Google Gemini
Source: https://ai.google.dev/gemini-api/docs/rate-limits

The official guide states that Gemini limits are commonly measured as requests per minute (RPM), input tokens per minute (TPM), and requests per day (RPD). Limits are applied per project, not per API key; RPD resets at midnight Pacific; limits vary by model and preview/experimental models are more restricted. It also documents spend-based limits for applicable tiers and 429 RESOURCE_EXHAUSTED behavior. Alhrajplus should therefore store configured safety thresholds and observed provider metadata, not claim a universal free-tier quota.

## Implementation implications

The current orchestrator has a provider order and daily token field, but it does not yet fully implement provider-specific RPM/RPD/TPM/monthly limits, cooldown state, health classification, admin-selected primary with fallback, or configurable max fallback count. The Admin panel currently exposes order, enabled, weight, daily limit and basic daily usage/errors, but not all fields required by pasted_content_4.txt. These are verified Phase 3 gaps, not assumptions.
