import { View, Text, StyleSheet, Image, TouchableOpacity, I18nManager } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../theme";

export default function ListingCard({ listing }) {
    const nav = useNavigation();
    return (
        <TouchableOpacity
            onPress={() => nav.navigate("ListingDetail", { id: listing.id })}
            style={styles.card}
            activeOpacity={0.85}
            testID={`listing-card-${listing.id}`}
        >
            <View style={styles.imageBox}>
                {listing.images?.[0] ? (
                    <Image source={{ uri: listing.images[0] }} style={styles.image} />
                ) : (
                    <View style={[styles.image, styles.placeholder]}>
                        <Text style={styles.placeholderText}>لا توجد صورة</Text>
                    </View>
                )}
            </View>
            <View style={styles.body}>
                <Text numberOfLines={2} style={styles.title}>{listing.title}</Text>
                <View style={styles.row}>
                    {listing.price ? (
                        <Text style={styles.price}>{Number(listing.price).toLocaleString()} {listing.currency || "ر.س"}</Text>
                    ) : (
                        <Text style={styles.priceMuted}>على السوم</Text>
                    )}
                    <Text style={styles.city}>{listing.city}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: "hidden",
        flex: 1,
        margin: 6,
    },
    imageBox: { aspectRatio: 4 / 3, backgroundColor: theme.colors.surfaceElevated },
    image: { width: "100%", height: "100%" },
    placeholder: { justifyContent: "center", alignItems: "center" },
    placeholderText: { color: theme.colors.textMuted, fontSize: 12 },
    body: { padding: 10 },
    title: { fontSize: 13, fontWeight: "700", color: theme.colors.text, minHeight: 34, writingDirection: "rtl", textAlign: "right" },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
    price: { fontSize: 15, fontWeight: "900", color: theme.colors.primary },
    priceMuted: { fontSize: 12, color: theme.colors.textMuted },
    city: { fontSize: 10, color: theme.colors.textMuted, textAlign: "right" },
});
