/**
 * Lightweight 360° viewer for React Native — no 3D, no heavy libs.
 *
 * Renders the listing's image sequence using a PanResponder that flips frames
 * proportional to the horizontal drag distance. Works on iOS + Android.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet, Dimensions, PanResponder } from "react-native";
import { X, RotateCw } from "lucide-react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const PX_PER_FRAME = 14;

export default function Viewer360Mobile({ images = [], onClose }) {
    const [index, setIndex] = useState(0);
    const [autoSpin, setAutoSpin] = useState(false);
    const indexRef = useRef(0);
    const accumRef = useRef(0);
    const frameCount = images.length;

    // Preload first 3 frames so swiping feels instant.
    useEffect(() => {
        images.slice(0, 3).forEach((src) => Image.prefetch?.(src).catch(() => {}));
    }, [images]);

    useEffect(() => { indexRef.current = index; }, [index]);

    useEffect(() => {
        if (!autoSpin || frameCount < 2) return;
        const id = setInterval(() => {
            indexRef.current = (indexRef.current + 1) % frameCount;
            setIndex(indexRef.current);
        }, 90);
        return () => clearInterval(id);
    }, [autoSpin, frameCount]);

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 2,
        onPanResponderGrant: () => { accumRef.current = 0; if (autoSpin) setAutoSpin(false); },
        onPanResponderMove: (_, g) => {
            if (frameCount < 2) return;
            const delta = g.dx - accumRef.current;
            const steps = Math.trunc(delta / PX_PER_FRAME);
            if (steps !== 0) {
                accumRef.current += steps * PX_PER_FRAME;
                let next = indexRef.current - steps;
                next = ((next % frameCount) + frameCount) % frameCount;
                indexRef.current = next;
                setIndex(next);
            }
        },
        onPanResponderRelease: () => { accumRef.current = 0; },
    }), [frameCount, autoSpin]);

    if (frameCount === 0) return null;

    return (
        <View style={styles.wrap} {...panResponder.panHandlers} testID="viewer-360-mobile">
            {images.map((src, i) => (
                <Image
                    key={src + i}
                    source={{ uri: src }}
                    resizeMode="contain"
                    style={[styles.frame, { opacity: i === index ? 1 : 0 }]}
                />
            ))}

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12} testID="viewer-360-mobile-close">
                <X size={22} color="#fff" />
            </TouchableOpacity>

            <View style={styles.helpChip} pointerEvents="none">
                <Text style={styles.helpText}>↔️ اسحب للدوران</Text>
            </View>

            <View style={styles.bottomBar}>
                <View style={styles.indexChip}>
                    <Text style={styles.indexText} testID="viewer-360-mobile-index">{index + 1} / {frameCount}</Text>
                </View>
                <TouchableOpacity onPress={() => setAutoSpin((s) => !s)} style={[styles.spinBtn, autoSpin && styles.spinBtnActive]} testID="viewer-360-mobile-autospin">
                    <RotateCw size={16} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000", justifyContent: "center", alignItems: "center", zIndex: 1000 },
    frame: { position: "absolute", width: SCREEN_W, height: SCREEN_H * 0.85 },
    closeBtn: { position: "absolute", top: 50, right: 18, width: 42, height: 42, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
    helpChip: { position: "absolute", top: 56, left: 18, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
    helpText: { color: "#fff", fontSize: 11, fontWeight: "700" },
    bottomBar: { position: "absolute", bottom: 40, flexDirection: "row", gap: 8, alignItems: "center" },
    indexChip: { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)", borderWidth: 1, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
    indexText: { color: "#fff", fontWeight: "900", fontSize: 13 },
    spinBtn: { width: 42, height: 42, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
    spinBtnActive: { backgroundColor: "#10B981" },
});
