import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { endpoints } from "@/constants/api";
import { useLanguage } from "@/contexts/LanguageContext";

const C = Colors.light;

export default function PatientProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { t, isRTL } = useLanguage();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const textAlign = isRTL ? "right" : "left";
  const [saving, setSaving] = useState(false);

  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [surgicalHistory, setSurgicalHistory] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [familyConditions, setFamilyConditions] = useState<string[]>([]);
  const [smokingStatus, setSmokingStatus] = useState("");
  const [alcoholUse, setAlcoholUse] = useState("");

  async function handleSave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const body = {
        chronicConditions,
        surgicalHistory,
        currentMedications: medications.map((m) => ({ name: m })),
        allergies: allergies.map((a) => ({ allergen: a })),
        familyHistory: { conditions: familyConditions },
        smokingStatus: smokingStatus || null,
        alcoholUse: alcoholUse || null,
      };
      const res = await fetch(endpoints.patientProfile(parseInt(id)), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      await queryClient.invalidateQueries({ queryKey: ["patient", id] });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function TagInput({ label, items, onAdd, onRemove, placeholder }: {
    label: string; items: string[];
    onAdd: (item: string) => void; onRemove: (idx: number) => void; placeholder?: string;
  }) {
    const [input, setInputValue] = useState("");
    const handleAdd = () => { if (input.trim()) { onAdd(input.trim()); setInputValue(""); } };
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { color: C.textSecondary, textAlign }]}>{label}</Text>
        <View style={styles.tagRow}>
          {items.map((item, idx) => (
            <TouchableOpacity key={idx} style={[styles.tag, { backgroundColor: C.primary + "20", borderColor: C.primary + "40", flexDirection: isRTL ? "row-reverse" : "row" }]} onPress={() => onRemove(idx)}>
              <Text style={[styles.tagText, { color: C.primary }]}>{item}</Text>
              <Feather name="x" size={12} color={C.primary} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={[styles.inputRow, { borderColor: C.border, backgroundColor: C.backgroundSecondary, flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <TextInput
            style={[styles.tagInput, { color: C.text, textAlign }]}
            value={input}
            onChangeText={setInputValue}
            placeholder={placeholder || (isRTL ? "أضف..." : "Add item...")}
            placeholderTextColor={C.textTertiary}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={handleAdd} style={[styles.addTagBtn, { backgroundColor: C.primary }]}>
            <Feather name="plus" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function SelectOption({ label, options, arOptions, value, onChange }: {
    label: string; options: string[]; arOptions?: string[]; value: string; onChange: (v: string) => void;
  }) {
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { color: C.textSecondary, textAlign }]}>{label}</Text>
        <View style={styles.optionRow}>
          {options.map((opt, idx) => {
            const displayLabel = isRTL && arOptions ? arOptions[idx] : opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.optionBtn, { backgroundColor: value === opt ? C.primary : C.backgroundSecondary, borderColor: value === opt ? C.primary : C.border }]}
                onPress={() => onChange(value === opt ? "" : opt)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionBtnText, { color: value === opt ? "#fff" : C.textSecondary }]}>{displayLabel}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border, flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>{isRTL ? "الملف الطبي" : "Medical Profile"}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.infoBox, { backgroundColor: C.primary + "10", borderColor: C.primary + "30", flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Feather name="info" size={16} color={C.primary} />
          <Text style={[styles.infoText, { color: C.primary, textAlign }]}>
            {isRTL ? "هذه المعلومات تُحفظ بشكل دائم وتُستخدم في جميع الاستشارات المستقبلية." : "This information is stored permanently and used in all future consultations."}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text, textAlign }]}>{t("pastMedicalHistory")}</Text>
          <TagInput label={t("chronicConditions")} items={chronicConditions} onAdd={(v) => setChronicConditions((p) => [...p, v])} onRemove={(i) => setChronicConditions((p) => p.filter((_, idx) => idx !== i))} placeholder={isRTL ? "مثال: ارتفاع ضغط الدم" : "e.g. Hypertension"} />
          <TagInput label={t("surgicalHistory")} items={surgicalHistory} onAdd={(v) => setSurgicalHistory((p) => [...p, v])} onRemove={(i) => setSurgicalHistory((p) => p.filter((_, idx) => idx !== i))} placeholder={isRTL ? "مثال: استئصال الزائدة 2010" : "e.g. Appendicectomy 2010"} />
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text, textAlign }]}>{isRTL ? "الأدوية والحساسية" : "Medications & Allergies"}</Text>
          <TagInput label={t("currentMedications")} items={medications} onAdd={(v) => setMedications((p) => [...p, v])} onRemove={(i) => setMedications((p) => p.filter((_, idx) => idx !== i))} placeholder={isRTL ? "مثال: ميتفورمين 500 مجم" : "e.g. Metformin 500mg"} />
          <TagInput label={t("allergies")} items={allergies} onAdd={(v) => setAllergies((p) => [...p, v])} onRemove={(i) => setAllergies((p) => p.filter((_, idx) => idx !== i))} placeholder={isRTL ? "مثال: البنسلين" : "e.g. Penicillin"} />
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text, textAlign }]}>{t("familyHistory")}</Text>
          <TagInput label={isRTL ? "الأمراض العائلية" : "Family Conditions"} items={familyConditions} onAdd={(v) => setFamilyConditions((p) => [...p, v])} onRemove={(i) => setFamilyConditions((p) => p.filter((_, idx) => idx !== i))} placeholder={isRTL ? "مثال: السكري (الأب)" : "e.g. Diabetes (Father)"} />
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text, textAlign }]}>{t("socialHistory")}</Text>
          <SelectOption label={t("smokingStatus")} options={["Non-smoker", "Ex-smoker", "Current smoker"]} arOptions={["غير مدخن", "مدخن سابق", "مدخن حالي"]} value={smokingStatus} onChange={setSmokingStatus} />
          <SelectOption label={t("alcoholUse")} options={["None", "Occasional", "Moderate", "Heavy"]} arOptions={["لا شيء", "أحياناً", "متوسط", "مفرط"]} value={alcoholUse} onChange={setAlcoholUse} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: C.backgroundSecondary, borderTopColor: C.border }]}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.primary, opacity: saving ? 0.7 : 1, flexDirection: isRTL ? "row-reverse" : "row" }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : (
            <>
              <Feather name="save" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>{isRTL ? "حفظ الملف" : "Save Profile"}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  infoBox: { alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 16 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  field: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  inputRow: { alignItems: "center", borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  tagInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  addTagBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  optionBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  footer: { paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  saveBtn: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
