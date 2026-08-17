# Phase 4 — Voice and image search

## Implemented

Web search now has explicit voice phases for permission request, listening, transcription, success and error. It shows live status with `aria-live`, preserves the recognized text in the input, then executes the search. Image search now tracks selected/processing/success/error state, displays a preview while processing, validates type and size, calls the existing `/ai/image-search` contract, and navigates to the result query after a successful response.

## Verification

The Web production build passed. Mobile Expo web export passed. Backend Python compilation passed for the related modules.

## Remaining evidence boundary

Browser SpeechRecognition and camera/microphone permission behavior still require a real Chrome/Safari permission test. Mobile voice/image search parity is not yet a complete native feature: the mobile chat has media capture, but the marketplace top-level search does not yet expose the same search state machine. This remains a tracked cross-platform gap for the later parity/testing phase rather than being falsely marked complete.
