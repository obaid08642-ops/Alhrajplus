import { useEffect, useState } from "react";
import { X, RotateCw, Box } from "lucide-react";
import { tr } from "@/contexts/I18nContext";

export default function Model3DViewer({ src, onClose }) {
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        let mounted = true;
        import("@google/model-viewer").then(() => mounted && setReady(true)).catch(() => mounted && setFailed(true));
        return () => { mounted = false; };
    }, []);
    return <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-3" data-testid="model-3d-modal">
        <button onClick={onClose} className="absolute top-4 end-4 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center z-10" aria-label={tr("إغلاق")}><X className="w-5 h-5" /></button>
        {!ready || failed ? <div className="text-center text-white font-arabic space-y-3"><Box className="w-10 h-10 mx-auto text-cyan-300" />{failed ? <p>{tr("تعذر تحميل عارض 3D لهذا الملف")}</p> : <p>{tr("جاري تحميل العارض...")}</p>}</div> : <div className="w-full max-w-5xl h-[80vh] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10"><model-viewer src={src} alt={tr("نموذج ثلاثي الأبعاد للإعلان")} camera-controls auto-rotate shadow-intensity="1" exposure="1" style={{ width: "100%", height: "100%" }} onError={() => setFailed(true)}><div slot="progress-bar" className="h-1 bg-cyan-400" /></model-viewer></div>}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/80 text-xs font-arabic-body bg-white/10 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2"><RotateCw className="w-3.5 h-3.5" />{tr("اسحب للتدوير، واستخدم إصبعين للتكبير")}</div>
    </div>;
}
