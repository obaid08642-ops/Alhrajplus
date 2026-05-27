// Lightweight pulsing skeleton placeholders. No external libs — uses Animated.
// Pass `count` to render multiple stacked rows or use <SkeletonCard /> directly.
import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, Dimensions, Easing } from "react-native";
import { colors, radius } from "../theme";

const W = Dimensions.get("window").width;

function usePulse() {
    const val = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(val, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                Animated.timing(val, { toValue: 0.4, duration: 700, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [val]);
    return val;
}

export function SkeletonCard({ width = "100%", height = 180, style }) {
    const op = usePulse();
    return <Animated.View style={[styles.box, { width, height, opacity: op }, style]} />;
}

export function SkeletonLine({ width = "60%", height = 12, style }) {
    const op = usePulse();
    return <Animated.View style={[styles.line, { width, height, opacity: op }, style]} />;
}

// Listing card placeholder (matches ListingCard footprint roughly)
export function SkeletonListingCard() {
    const cardW = (W - 28) / 2; // matches HomeScreen 2-col grid
    return (
        <View style={[styles.cardWrap, { width: cardW }]} testID="skeleton-listing-card">
            <SkeletonCard height={cardW} style={{ borderRadius: radius.md }} />
            <SkeletonLine width="80%" style={{ marginTop: 8 }} />
            <SkeletonLine width="50%" style={{ marginTop: 6 }} />
        </View>
    );
}

// Grid of N listing skeletons — drop-in replacement for ActivityIndicator during feed load
export function SkeletonListingGrid({ count = 6 }) {
    return (
        <View style={styles.grid} testID="skeleton-grid">
            {Array.from({ length: count }).map((_, i) => <SkeletonListingCard key={i} />)}
        </View>
    );
}

// Category tile skeleton
export function SkeletonCategoryGrid({ count = 8 }) {
    return (
        <View style={styles.grid} testID="skeleton-cat-grid">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} width={(W - 28) / 2} height={84} style={{ borderRadius: radius.md, marginBottom: 8 }} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    box: { backgroundColor: colors.surfaceElevated, borderRadius: radius.md },
    line: { backgroundColor: colors.surfaceElevated, borderRadius: 4 },
    cardWrap: { padding: 6 },
    grid: { flexDirection: "row", flexWrap: "wrap", padding: 6, justifyContent: "space-between" },
});
