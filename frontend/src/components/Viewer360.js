import { useState, useEffect, useRef, useCallback } from "react";
import { X, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { tr } from "@/contexts/I18nContext";

/**
 * Lightweight 360° image-sequence viewer (web).
 *
 * No 3D, no WebGL — just a swipe-to-rotate frame-flip viewer powered by the
 * listing's ordered image array (8-24 frames). Modeled after the cube-style
 * 360 viewers used on car marketplaces.
 *
 * Props:
 *   images: string[]   — ordered URLs of the rotation sequence
 *   onClose: () => void
 */
export default function Viewer360({ images = [], onClose }) {
    const [index, setIndex] = useState(0);
    const [autoSpin, setAutoSpin] = useState(false);
    const [zoom, setZoom] = useState(1);
    const dragRef = useRef({ active: false, lastX: 0, accum: 0 });
    const frameCount = images.length;
    // Pixels of drag required to advance one frame (smaller = more sensitive)
    const PX_PER_FRAME = 14;

    // Preload first 3 frames to make the initial render snappy.
    useEffect(() => {
        images.slice(0, 3).forEach((src) => { const i = new Image(); i.src = src; });
    }, [images]);

    // Auto-spin loop (40ms = 25fps — plenty for image-sequence rotation).
    useEffect(() => {
        if (!autoSpin || frameCount < 2) return;
        const id = setInterval(() => setIndex((i) => (i + 1) % frameCount), 80);
        return () => clearInterval(id);
    }, [autoSpin, frameCount]);

    const onPointerDown = useCallback((e) => {
        setAutoSpin(false);
        const t = e.touches ? e.touches[0] : e;
        dragRef.current = { active: true, lastX: t.clientX, accum: 0 };
    }, []);

    const onPointerMove = useCallback((e) => {
        if (!dragRef.current.active || frameCount < 2) return;
        const t = e.touches ? e.touches[0] : e;
        const dx = t.clientX - dragRef.current.lastX;
        dragRef.current.lastX = t.clientX;
        dragRef.current.accum += dx;
        const steps = Math.trunc(dragRef.current.accum / PX_PER_FRAME);
        if (steps !== 0) {
            dragRef.current.accum -= steps * PX_PER_FRAME;
            // RTL/LTR neutral: dragging RIGHT advances frames clockwise.
            setIndex((i) => ((i - steps) % frameCount + frameCount) % frameCount);
        }
    }, [frameCount]);

    const onPointerUp = useCallback(() => {
        dragRef.current.active = false;
    }, []);

    if (frameCount === 0) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center select-none" data-testid="viewer-360-modal">
            {/* Frame */}
            <div
                onMouseDown={onPointerDown}
                onMouseMove={onPointerMove}
                onMouseUp={onPointerUp}
                onMouseLeave={onPointerUp}
                onTouchStart={onPointerDown}
                onTouchMove={onPointerMove}
                onTouchEnd={onPointerUp}
                className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
                style={{ touchAction: "none" }}
            >
                {images.map((src, i) => (
                    <img
                        key={src}
                        src={src}
                        alt={`360 frame ${i + 1}`}
                        draggable={false}
                        style={{
                            position: "absolute",
                            maxWidth: "100%",
                            maxHeight: "100%",
                            transform: `scale(${zoom})`,
                            transition: "transform 0.2s ease",
                            display: i === index ? "block" : "none",
                            pointerEvents: "none",
                        }}
                    />
                ))}
            </div>

            {/* Close */}
            <button
                data-testid="viewer-360-close"
                onClick={onClose}
                className="absolute top-4 end-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md"
                aria-label="إغلاق"
            >
                <X className="w-5 h-5" />
            </button>

            {/* Top help label */}
            <div className="absolute top-4 start-4 bg-white/10 backdrop-blur-md text-white text-xs font-arabic-body px-3 py-1.5 rounded-full border border-white/20">
                ↔️ {tr("اسحب للدوران")}
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <button
                    data-testid="viewer-360-zoom-out"
                    onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
                    disabled={zoom <= 1}
                    className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md disabled:opacity-40"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
                <div className="bg-white/15 backdrop-blur-md text-white text-sm font-bold px-4 py-2 rounded-full border border-white/20" data-testid="viewer-360-index">
                    {index + 1} / {frameCount}
                </div>
                <button
                    data-testid="viewer-360-zoom-in"
                    onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
                    disabled={zoom >= 2.5}
                    className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md disabled:opacity-40"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
                <button
                    data-testid="viewer-360-autospin"
                    onClick={() => setAutoSpin((s) => !s)}
                    className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center ${autoSpin ? "bg-emerald-500 text-white" : "bg-white/15 hover:bg-white/30 text-white"}`}
                    aria-label="دوران تلقائي"
                >
                    <RotateCw className={`w-4 h-4 ${autoSpin ? "animate-spin" : ""}`} />
                </button>
            </div>
        </div>
    );
}
