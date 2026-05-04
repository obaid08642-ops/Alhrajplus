import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Heart, MessageCircle, Share2, ChevronUp, ChevronDown, Volume2, VolumeX, ArrowLeft } from "lucide-react";

export default function ReelsPage() {
    const [reels, setReels] = useState([]);
    const [active, setActive] = useState(0);
    const [muted, setMuted] = useState(true);
    const refs = useRef([]);

    useEffect(() => {
        // listings with videos
        api.get("/listings", { params: { limit: 30 } }).then(({ data }) => {
            const withVideos = (data.items || []).filter((l) => l.videos?.length > 0);
            setReels(withVideos);
        });
    }, []);

    useEffect(() => {
        refs.current.forEach((v, i) => {
            if (!v) return;
            if (i === active) v.play().catch(() => {}); else v.pause();
        });
    }, [active, reels]);

    const onScroll = (e) => {
        const idx = Math.round(e.target.scrollTop / e.target.clientHeight);
        if (idx !== active) setActive(idx);
    };

    if (reels.length === 0) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center max-w-md px-4">
                <div className="text-6xl mb-3">🎬</div>
                <h2 className="font-arabic font-black text-2xl text-[var(--text)] mb-2">القصص قريباً</h2>
                <p className="text-sm text-[var(--text-muted)] font-arabic-body mb-4">لا توجد فيديوهات بعد. كن أول من يرفع فيديو لمنتجاته!</p>
                <Link to="/post" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2.5 rounded-full font-arabic font-bold text-sm">أنشر إعلان بفيديو</Link>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-x-0 top-16 bottom-16 sm:relative sm:inset-auto sm:h-[calc(100vh-160px)] sm:max-w-md sm:mx-auto sm:rounded-3xl sm:overflow-hidden bg-black">
            <div onScroll={onScroll} className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
                {reels.map((l, i) => (
                    <div key={l.id} className="h-full w-full snap-start relative flex items-center justify-center">
                        <video ref={(el) => (refs.current[i] = el)} src={l.videos[0]} loop muted={muted} playsInline className="w-full h-full object-cover" />
                        {/* Overlay info */}
                        <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                            <Link to={`/listing/${l.id}`} className="block text-white">
                                <h3 className="font-arabic font-bold text-base line-clamp-2 mb-1">{l.title}</h3>
                                {l.price && <div className="font-latin font-black text-xl text-[var(--primary)]">{Number(l.price).toLocaleString()} {l.currency}</div>}
                                <div className="text-xs text-white/70 font-arabic-body">{l.city}</div>
                            </Link>
                        </div>
                        {/* Right action bar */}
                        <div className="absolute end-3 bottom-32 flex flex-col gap-4 text-white">
                            <button className="flex flex-col items-center gap-1"><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><Heart className="w-5 h-5" /></div><span className="text-[10px]">{l.favorites || 0}</span></button>
                            <button className="flex flex-col items-center gap-1"><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><MessageCircle className="w-5 h-5" /></div><span className="text-[10px]">رسالة</span></button>
                            <button className="flex flex-col items-center gap-1"><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><Share2 className="w-5 h-5" /></div><span className="text-[10px]">شارك</span></button>
                            <button onClick={() => setMuted(!muted)} className="flex flex-col items-center gap-1"><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">{muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</div></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
