// CountrySwitcher — pill button + bottom-sheet modal to change the current
// country. Mirrors web `CountrySwitcher` + `CountryPicker`. Country selection
// is persisted via CountryContext.setCountry(), which also updates the user
// profile so refresh keeps the choice (matches the audit fix from Phase 0).
import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from "react-native";
import { Globe2, Check, X } from "lucide-react-native";
import { useCountry } from "../CountryContext";
import { colors, radius } from "../theme";
import { useI18n } from "../I18nContext";
export default function CountrySwitcher({
  tintLight = false
}) {
  const { t } = useI18n();
  
  const {
    current,
    countries,
    setCountry
  } = useCountry();
  const [open, setOpen] = useState(false);
  return <>
            <TouchableOpacity onPress={() => setOpen(true)} style={[styles.btn, tintLight && styles.btnLight]} testID="country-switcher-btn" activeOpacity={0.85} hitSlop={6}>
                {current ? <Text style={[styles.flag, tintLight && {
        color: "#fff"
      }]}>{current.flag}</Text> : <Globe2 size={18} color={tintLight ? "#fff" : colors.text} />}
                {/* Show country name only when there's room — compact pill in tight headers */}
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} style={styles.sheetBg}>
                    <View style={styles.sheet}>
                        <View style={styles.sheetHead}>
                            <Text style={styles.sheetTitle}>{t("اختر الدولة")}</Text>
                            <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8} testID="country-switcher-close">
                                <X size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <FlatList data={countries} keyExtractor={c => c.code} renderItem={({
            item
          }) => {
            const isCur = current?.code === item.code;
            return <TouchableOpacity onPress={async () => {
              await setCountry(item.code);
              setOpen(false);
            }} style={[styles.row, isCur && styles.rowActive]} testID={`country-pick-${item.code}`}>
                                        <Text style={styles.rowFlag}>{item.flag}</Text>
                                        <View style={{
                flex: 1
              }}>
                                            <Text style={[styles.rowName, isCur && {
                  color: colors.primary,
                  fontWeight: "900"
                }]}>{item.name_ar}</Text>
                                            <Text style={styles.rowSub}>{item.currency_code} • {item.code}</Text>
                                        </View>
                                        {isCur && <Check size={18} color={colors.primary} />}
                                    </TouchableOpacity>;
          }} style={{
            maxHeight: 420
          }} />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>;
}
const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  btnLight: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.3)"
  },
  flag: {
    fontSize: 16
  },
  code: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.text,
    maxWidth: 80
  },
  sheetBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: 20
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    maxHeight: "75%"
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 10
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  rowActive: {
    backgroundColor: "rgba(137,207,240,0.08)"
  },
  rowFlag: {
    fontSize: 26
  },
  rowName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text
  },
  rowSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1
  }
});