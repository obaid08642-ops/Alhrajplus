import { useState, useEffect, useRef } from "react";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageViewer({ images = [], initialIndex = 0, onClose }) {
    const [idx, setIdx] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const dragRef = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });
    const swipeRef = useRef({ sx: 0, sy: 0, time: 0, started: false });

    const next = () => setIdx((i) => (i + 1) % images.length);
    const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
            if (e.key === "ArrowLeft") next();
            if (e.key === "ArrowRight") prev();
            if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.5, 4));
            if (e.key === "-") setZoom((z) => Math.max(z - 0.5, 1));
        };
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images.length, onClose]);

    useEffect(() => { setZoom(1); setOffset({ x: 0, y: 0 }); }, [idx]);

    const onWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        setZoom((z) => Math.min(Math.max(z + delta, 1), 4));
    };

    // ----- Mouse drag (when zoomed) -----
    const onMouseDown = (e) => {
        if (zoom > 1) {
            dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
        }
    };
    const onMouseMove = (e) => {
        if (dragRef.current.active) {
            setOffset({ x: dragRef.current.ox + (e.clientX - dragRef.current.sx), y: dragRef.current.oy + (e.clientY - dragRef.current.sy) });
        }
    };
    const onMouseUp = () => { dragRef.current.active = false; };

    // ----- Touch swipe to navigate (when not zoomed) -----
    const onTouchStart = (e) => {
        const t = e.touches[0];
        if (zoom > 1) {
            // pan when zoomed
            dragRef.current = { active: true, sx: t.clientX, sy: t.clientY, ox: offset.x, oy: offset.y };
            return;
        }
        swipeRef.current = { sx: t.clientX, sy: t.clientY, time: Date.now(), started: true };
    };
    const onTouchMove = (e) => {
        const t = e.touches[0];
        if (zoom > 1 && dragRef.current.active) {
            setOffset({ x: dragRef.current.ox + (t.clientX - dragRef.current.sx), y: dragRef.current.oy + (t.clientY - dragRef.current.sy) });
        }
    };
    const onTouchEnd = (e) => {
        dragRef.current.active = false;
        if (zoom > 1) return;
        if (!swipeRef.current.started) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - swipeRef.current.sx;
        const dy = Math.abs(t.clientY - swipeRef.current.sy);
        const dt = Date.now() - swipeRef.current.time;
        swipeRef.current.started = false;
        // Horizontal swipe with min distance and not too vertical, fast enough
        if (Math.abs(dx) > 50 && dy < 80 && dt < 800) {
            // Right swipe in RTL = previous; Left swipe = next
            // For both LTR/RTL we use natural: dx>0 means swipe right -> previous image
            if (dx > 0) prev();
            else next();
        }
    };

    if (!images.length) return null;
    const showNav = images.length > 1;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" data-testid="image-viewer-overlay">
            <button data-testid="iv-close" onClick={onClose} aria-label="إغلاق" className="absolute top-3 end-3 w-14 h-14 rounded-full bg-red-500/95 hover:bg-red-500 shadow-2xl text-white flex items-center justify-center z-[110] border-2 border-white/40"><X className="w-7 h-7" /></button>

            <div className="absolute top-5 start-4 bg-white/15 backdrop-blur text-white rounded-full px-4 py-1.5 text-sm font-bold font-arabic-body shadow-lg z-[105]">
                {idx + 1} / {images.length}
            </div>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 items-center bg-white/15 backdrop-blur rounded-full p-1.5 z-[105] shadow-lg">
                <button data-testid="iv-zoom-out" onClick={() => setZoom((z) => Math.max(z - 0.5, 1))} className="w-10 h-10 rounded-full text-white hover:bg-white/25 flex items-center justify-center"><ZoomOut className="w-5 h-5" /></button>
                <span className="text-white text-xs font-bold font-mono px-2 min-w-[3em] text-center">{Math.round(zoom * 100)}%</span>
                <button data-testid="iv-zoom-in" onClick={() => setZoom((z) => Math.min(z + 0.5, 4))} className="w-10 h-10 rounded-full text-white hover:bg-white/25 flex items-center justify-center"><ZoomIn className="w-5 h-5" /></button>
            </div>

            {showNav && (
                <>
                    {/* Previous (right side in RTL) */}
                    <button data-testid="iv-prev" onClick={prev} aria-label="السابق" className="absolute end-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 active:bg-white/40 backdrop-blur text-white flex items-center justify-center shadow-lg z-[105] mt-7"><ChevronRight className="w-6 h-6" /></button>
                    {/* Next (left side in RTL) */}
                    <button data-testid="iv-next" onClick={next} aria-label="التالي" className="absolute start-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 active:bg-white/40 backdrop-blur text-white flex items-center justify-center shadow-lg z-[105] mt-7"><ChevronLeft className="w-6 h-6" /></button>
                </>
            )}

            {/* Thumbnail strip at bottom */}
            {showNav && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[92vw] overflow-x-auto px-2 py-1 z-[105]">
                    {images.map((src, i) => (
                        <button
                            key={i}
                            data-testid={`iv-thumb-${i}`}
                            onClick={() => setIdx(i)}
                            className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? "border-[var(--primary)] scale-110" : "border-white/30 opacity-60 hover:opacity-100"}`}
                        >
                            <img src={src} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            <div
                className="w-full h-full flex items-center justify-center overflow-hidden touch-pan-y"
                onWheel={onWheel}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <img
                    src={images[idx]}
                    alt=""
                    className="max-w-full max-h-full object-contain transition-transform select-none"
                    style={{ transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`, cursor: zoom > 1 ? "grab" : "default" }}
                    draggable={false}
                />
            </div>
        </div>
    );
}
