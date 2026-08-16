import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

const VISITOR_KEY = "hp_visitor_id";
const SESSION_KEY = "hp_session_id";

function randomId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

async function getOrCreate(key, prefix) {
    try {
        let value = await AsyncStorage.getItem(key);
        if (!value) {
            value = randomId(prefix);
            await AsyncStorage.setItem(key, value);
        }
        return value;
    } catch (_) {
        return randomId(prefix);
    }
}

export async function trackEvent(event, details = {}) {
    try {
        const [visitor_id, session_id] = await Promise.all([
            getOrCreate(VISITOR_KEY, "v"),
            getOrCreate(SESSION_KEY, "s"),
        ]);
        await api.post("/analytics/events", {
            event,
            visitor_id,
            session_id,
            path: details.path,
            category: details.category,
            listing_id: details.listing_id,
            country_code: details.country_code,
        });
    } catch (_) {
        // Analytics must never block mobile navigation or surface an error.
    }
}
