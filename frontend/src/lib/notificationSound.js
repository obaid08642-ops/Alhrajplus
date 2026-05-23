// Harajplus signature notification sound.
// Three-tone ascending pattern (E5 → A5 → C#6) gives a recognizable, premium
// "ding" — distinct from generic WhatsApp/Skype tones. Uses Web Audio API so
// there's no MP3 to download and no codec mismatch across browsers.
//
// Singleton AudioContext is created lazily on first user interaction (modern
// browsers block autoplay before any gesture).

let _ctx = null;

function getCtx() {
    if (typeof window === "undefined") return null;
    if (_ctx) return _ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try { _ctx = new C(); } catch { _ctx = null; }
    return _ctx;
}

/**
 * Play the signature Harajplus notification sound.
 * @param {object} opts { volume?: number 0-1 (default 0.18), variant?: "ding"|"alert" }
 */
export function playNotificationSound(opts = {}) {
    try {
        const ctx = getCtx();
        if (!ctx) return;
        if (ctx.state === "suspended") { try { ctx.resume(); } catch (_) {} }
        const vol = Math.min(0.4, Math.max(0, opts.volume ?? 0.18));
        // E5, A5, C#6 — pleasing major-triad arpeggio.
        const tones = opts.variant === "alert" ? [659.25, 880, 1108.73] : [659.25, 880, 1108.73];
        tones.forEach((freq, i) => {
            const t0 = ctx.currentTime + i * 0.10;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "sine";
            o.frequency.setValueAtTime(freq, t0);
            g.gain.setValueAtTime(0.0001, t0);
            // Quick attack, smooth decay.
            g.gain.exponentialRampToValueAtTime(vol, t0 + 0.018);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
            o.connect(g);
            g.connect(ctx.destination);
            o.start(t0);
            o.stop(t0 + 0.35);
        });
    } catch (_) {}
    try {
        if (navigator.vibrate && document.visibilityState === "visible") {
            navigator.vibrate([40, 60, 40]);
        }
    } catch (_) {}
}
