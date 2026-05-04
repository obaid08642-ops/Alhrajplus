import { useEffect, useRef, useState } from "react";
import { RotateCw, X, Sparkles } from "lucide-react";

/**
 * Spin360Viewer - Lightweight 360° / Object rotator.
 * - Treats the listing's image array as sequential frames (3+ frames recommended).
 * - Drag horizontally (or swipe) to rotate.
 * - Auto-spin on first open until user interacts.
 *
 * Props:
 *   images: string[] (in rotation order)
 *   onClose: () => void
 */
export default function Spin360Viewer({ images = [], onClose }) {
    const [frame, setFrame] = useState(0);
    const [autoSpin, setAutoSpin] = useState(true);
    const containerRef = useRef(null);
    const dragState = useRef({ active: false, startX: 0, startFrame: 0 });

    const total = images.length;

    useEffect(() => {
        if (!autoSpin || total < 2) return;
        const id = setInterval(() => setFrame((f) => (f + 1) % total), 90);
        return () => clearInterval(id);
    }, [autoSpin, total]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const onPointerDown = (e) => {
        setAutoSpin(false);
        dragState.current = {
            active: true,
            startX: e.clientX || e.touches?.[0]?.clientX || 0,
            startFrame: frame,
        };
    };
    const onPointerMove = (e) => {
        if (!dragState.current.active) return;
        const x = e.clientX || e.touches?.[0]?.clientX || 0;
        const w = containerRef.current?.clientWidth || 1;
        const delta = (x - dragState.current.startX) / w; // -1..1 for full width
        const step = Math.round(delta * total * 1.2);
        const next = ((dragState.current.startFrame - step) % total + total) % total;
        setFrame(next);
    };
    const onPointerUp = () => { dragState.current.active = false; };

    if (total === 0) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center" data-testid="spin360-viewer">
            <button data-testid="spin360-close" onClick={onClose} className="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center text-white z-10">
                <X className="w-5 h-5" />
            </button>
            <div className="absolute top-4 start-4 flex items-center gap-2 text-white text-xs font-arabic z-10">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                <span>عرض 360° — اسحب لتدوير المنتج</span>
            </div>

            <div
                ref={containerRef}
                onMouseDown={onPointerDown}
                onMouseMove={onPointerMove}
                onMouseUp={onPointerUp}
                onMouseLeave={onPointerUp}
                onTouchStart={onPointerDown}
                onTouchMove={onPointerMove}
                onTouchEnd={onPointerUp}
                className="relative w-full max-w-2xl aspect-square cursor-grab active:cursor-grabbing select-none"
            >
                <img
                    src={images[frame]}
                    alt={`frame-${frame}`}
                    draggable={false}
                    className="w-full h-full object-contain pointer-events-none"
                />
                {/* Hologram floor reflection */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-3 rounded-full bg-[var(--primary)]/40 blur-md"></div>
            </div>

            <div className="mt-6 flex items-center gap-3">
                <button
                    data-testid="spin360-toggle"
                    onClick={() => setAutoSpin((v) => !v)}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] px-4 py-2 rounded-full text-xs font-bold font-arabic flex items-center gap-2"
                >
                    <RotateCw className={`w-4 h-4 ${autoSpin ? "animate-spin" : ""}`} />
                    {autoSpin ? "إيقاف الدوران" : "ابدأ الدوران"}
                </button>
                <span className="text-white/70 text-xs font-arabic-body">
                    {frame + 1} / {total}
                </span>
            </div>
        </div>
    );
}
