// Mobile cascading selectors for cars + phones. Shares backend endpoints with
// the web client so options stay in sync (single source of truth).
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from "react-native";
import api from "../api";
import { useI18n } from "../I18nContext";
import { colors } from "../theme";

function Picker({ value, options, placeholder, onChange, disabled }) {
    const [open, setOpen] = useState(false);
    const valid = !disabled && (options || []).length > 0;
    return (
        <>
            <TouchableOpacity
                disabled={!valid}
                onPress={() => setOpen(true)}
                style={[ps.input, !valid && { opacity: 0.5 }]}
            >
                <Text style={value ? ps.txt : ps.ph}>{value || placeholder || "—"}</Text>
            </TouchableOpacity>
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} style={ps.backdrop}>
                    <View style={ps.sheet}>
                        <FlatList
                            data={options || []}
                            keyExtractor={(o, i) => `${o}-${i}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => { onChange(item); setOpen(false); }} style={ps.item}>
                                    <Text style={[ps.itemTxt, item === value && { color: colors.primary, fontWeight: "800" }]}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

export function CarCascadeMobile({ value, onChange }) {
    const { t } = useI18n();
    const v = value || {};
    const [brands, setBrands] = useState([]);
    const [years, setYears] = useState([]);
    const [models, setModels] = useState([]);
    const [trims, setTrims] = useState([]);

    useEffect(() => {
        api.get("/meta/car-brands").then(({ data }) => {
            setBrands(data.brands || []);
            setYears(data.years || []);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        if (!v.car_brand) { setModels([]); return; }
        api.get("/meta/car-models", { params: { brand: v.car_brand } })
            .then(({ data }) => setModels(data.models || []))
            .catch(() => setModels([]));
    }, [v.car_brand]);

    useEffect(() => {
        if (!v.car_brand || !v.car_model) { setTrims([]); return; }
        api.get("/meta/car-trims", { params: { brand: v.car_brand, model: v.car_model } })
            .then(({ data }) => setTrims(data.trims || []))
            .catch(() => setTrims([]));
    }, [v.car_brand, v.car_model]);

    const set = (patch) => onChange({ ...v, ...patch });

    return (
        <View style={s.wrap}>
            <Text style={s.title}>🚗 {t("تفاصيل السيارة")}</Text>
            <View style={s.row}>
                <Lab text={t("الماركة")}><Picker value={v.car_brand || ""} options={brands} placeholder="—" onChange={(b) => set({ car_brand: b, car_model: "", car_trim: "" })} /></Lab>
                <Lab text={t("الموديل")}><Picker value={v.car_model || ""} options={models} placeholder="—" disabled={!v.car_brand} onChange={(m) => set({ car_model: m, car_trim: "" })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("السنة")}><Picker value={v.car_year || ""} options={years} placeholder="—" onChange={(y) => set({ car_year: y })} /></Lab>
                <Lab text={t("الفئة")}><Picker value={v.car_trim || ""} options={trims} placeholder="—" disabled={!v.car_model} onChange={(tx) => set({ car_trim: tx })} /></Lab>
            </View>
        </View>
    );
}

export function PhoneCascadeMobile({ value, onChange }) {
    const { t } = useI18n();
    const v = value || {};
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [storages, setStorages] = useState([]);
    const [palette, setPalette] = useState([]);

    useEffect(() => {
        api.get("/meta/phone-brands").then(({ data }) => setBrands(data.brands || [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (!v.phone_brand) { setModels([]); return; }
        api.get("/meta/phone-models", { params: { brand: v.phone_brand } })
            .then(({ data }) => setModels(data.models || []))
            .catch(() => setModels([]));
    }, [v.phone_brand]);

    useEffect(() => {
        if (!v.phone_brand || !v.phone_model) { setStorages([]); setPalette([]); return; }
        api.get("/meta/phone-variants", { params: { brand: v.phone_brand, model: v.phone_model } })
            .then(({ data }) => { setStorages(data.storage || []); setPalette(data.color || []); })
            .catch(() => { setStorages([]); setPalette([]); });
    }, [v.phone_brand, v.phone_model]);

    const set = (patch) => onChange({ ...v, ...patch });

    return (
        <View style={s.wrap}>
            <Text style={s.title}>📱 {t("تفاصيل الجوال")}</Text>
            <View style={s.row}>
                <Lab text={t("الماركة")}><Picker value={v.phone_brand || ""} options={brands} placeholder="—" onChange={(b) => set({ phone_brand: b, phone_model: "", phone_storage: "", phone_color: "" })} /></Lab>
                <Lab text={t("الموديل")}><Picker value={v.phone_model || ""} options={models} placeholder="—" disabled={!v.phone_brand} onChange={(m) => set({ phone_model: m, phone_storage: "", phone_color: "" })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("السعة")}><Picker value={v.phone_storage || ""} options={storages} placeholder="—" disabled={!v.phone_model} onChange={(x) => set({ phone_storage: x })} /></Lab>
                <Lab text={t("اللون")}><Picker value={v.phone_color || ""} options={palette} placeholder="—" disabled={!v.phone_model} onChange={(x) => set({ phone_color: x })} /></Lab>
            </View>
        </View>
    );
}

function Lab({ text, children }) {
    return (
        <View style={{ flex: 1 }}>
            <Text style={s.label}>{text}</Text>
            {children}
        </View>
    );
}

const s = StyleSheet.create({
    wrap: { backgroundColor: colors.surface, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
    title: { fontSize: 12, fontWeight: "700", color: colors.text, marginBottom: 8 },
    row: { flexDirection: "row", gap: 8, marginBottom: 8 },
    label: { fontSize: 10, color: colors.textMuted, marginBottom: 4, fontWeight: "700" },
});

const ps = StyleSheet.create({
    input: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10 },
    txt: { color: colors.text, fontSize: 13 },
    ph: { color: colors.textMuted, fontSize: 13 },
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "70%", paddingVertical: 8 },
    item: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    itemTxt: { color: colors.text, fontSize: 14 },
});
