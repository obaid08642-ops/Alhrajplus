import { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageViewer({ images = [], initialIndex = 0, onClose }) {
    const [idx, setIdx] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [start, setStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
            if (e.key === "ArrowLeft") setIdx((i) => Math.min(i + 1, images.length - 1));
            if (e.key === "ArrowRight") setIdx((i) => Math.max(i - 1, 0));
            if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.5, 4));
            if (e.key === "-") setZoom((z) => Math.max(z - 0.5, 1));
        };
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    }, [images.length, onClose]);

    useEffect(() => { setZoom(1); setOffset({ x: 0, y: 0 }); }, [idx]);

    const onWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        setZoom((z) => Math.min(Math.max(z + delta, 1), 4));
    };
    const onMouseDown = (e) => { if (zoom > 1) { setDragging(true); setStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }); } };
    const onMouseMove = (e) => { if (dragging) setOffset({ x: e.clientX - start.x, y: e.clientY - start.y }); };
    const onMouseUp = () => setDragging(false);

    if (!images.length) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" data-testid="image-viewer-overlay">
            <button data-testid="iv-close" onClick={onClose} className="absolute top-4 end-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white flex items-center justify-center"><X className="w-5 h-5" /></button>
            <div className="absolute top-4 start-4 bg-white/10 backdrop-blur text-white rounded-full px-3 py-1.5 text-xs font-arabic-body">
                {idx + 1} / {images.length}
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 items-center bg-white/10 backdrop-blur rounded-full p-1.5">
                <button data-testid="iv-zoom-out" onClick={() => setZoom((z) => Math.max(z - 0.5, 1))} className="w-9 h-9 rounded-full text-white hover:bg-white/20 flex items-center justify-center"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-white text-xs font-mono px-2">{Math.round(zoom * 100)}%</span>
                <button data-testid="iv-zoom-in" onClick={() => setZoom((z) => Math.min(z + 0.5, 4))} className="w-9 h-9 rounded-full text-white hover:bg-white/20 flex items-center justify-center"><ZoomIn className="w-4 h-4" /></button>
            </div>
            {idx > 0 && (
                <button data-testid="iv-prev" onClick={() => setIdx(idx - 1)} className="absolute end-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"><ChevronRight className="w-5 h-5" /></button>
            )}
            {idx < images.length - 1 && (
                <button data-testid="iv-next" onClick={() => setIdx(idx + 1)} className="absolute start-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
            )}
            <div className="w-full h-full flex items-center justify-center overflow-hidden" onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
                <img
                    src={images[idx]}
                    alt=""
                    className="max-w-full max-h-full object-contain transition-transform select-none"
                    style={{ transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`, cursor: zoom > 1 ? "grab" : "zoom-in" }}
                    onClick={() => zoom === 1 && setZoom(2)}
                    draggable={false}
                />
            </div>
        </div>
    );
}
