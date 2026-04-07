import React, { useState, useEffect } from "react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { endpoints } from "@/constants/api";
import { useLanguage } from "@/contexts/LanguageContext";

const C = Colors.light;

type TagInputProps = {
  label: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (idx: number) => void;
  placeholder?: string;
  isRTL: boolean;
  textAlign: "left" | "right";
};

function TagInput({ label, items, onAdd, onRemove, placeholder, isRTL, textAlign }: TagInputProps) {
  const [input, setInputValue] = useState("");
  const handleAdd = () => {
    if (input.trim()) {
      onAdd(input.trim());
      setInputValue("");
    }
  };
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: C.textSecondary, textAlign }]}>{label}</Text>
      <View style={styles.tagRow}>
        {items.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.tag, { backgroundColor: C.primary + "20", borderColor: C.primary + "40", flexDirection: isRTL ? "row-reverse" : "row" }]}
            onPress={() => onRemove(idx)}
          >
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

type SelectOptionProps = {
  label: string;
  options: string[];
  arOptions?: string[];
  value: string;
  onChange: (v: string) => void;
  isRTL: boolean;
  textAlign: "left" | "right";
};

function SelectOption({ label, options, arOptions, value, onChange, isRTL, textAlign }: SelectOptionProps) {
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

interface ProfileData {
  chronicConditions?: string[] | null;
  surgicalHistory?: string[] | null;
  currentMedications?: Array<{ name: string } | string> | null;
  allergies?: Array<{ allergen: string } | string> | null;
  familyHistory?: { conditions?: string[] } | null;
  smokingStatus?: string | null;
  alcoholUse?: string | null;
}

async function fetchPatientProfile(id: string): Promise<ProfileData | null> {
  const res = await fetch(endpoints.patient(parseInt(id)));
  if (!res.ok) return null;
  const data = await res.json();
  return data.profile || null;
}

function extractStringArray(arr: Array<{ name: string } | { allergen: string } | string> | null | undefined): string[] {
  if (!arr) return [];
  return arr.map((item) => {
    if (typeof item === "string") return item;
    if ("name" in item) return item.name;
    if ("allergen" in item) return item.allergen;
    return "";
  }).filter(Boolean);
}

export default function PatientProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { t, isRTL } = useLanguage();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const textAlign = isRTL ? "right" : "left";
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [surgicalHistory, setSurgicalHistory] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [familyConditions, setFamilyConditions] = useState<string[]>([]);
  const [smokingStatus, setSmokingStatus] = useState("");
  const [alcoholUse, setAlcoholUse] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["patient-profile", id],
    queryFn: () => fetchPatientProfile(id),
  });

  useEffect(() => {
    if (profile && !initialized) {
      setChronicConditions(profile.chronicConditions || []);
      setSurgicalHistory(profile.surgicalHistory || []);
      setMedications(extractStringArray(profile.currentMedications as any));
      setAllergies(extractStringArray(profile.allergies as any));
      setFamilyConditions(profile.familyHistory?.conditions || []);
      setSmokingStatus(profile.smokingStatus || "");
      setAlcoholUse(profile.alcoholUse || "");
      setInitialized(true);
    }
  }, [profile, initialized]);

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
      await queryClient.invalidateQueries({ queryKey: ["patient-profile", id] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert(isRTL ? "خطأ" : "Error", isRTL ? "فشل حفظ الملف. حاول مجدداً." : "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
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
        <View style={[styles.infoBox, { backgroundColor: profile ? C.success + "15" : C.primary + "10", borderColor: profile ? C.success + "40" : C.primary + "30", flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Feather name={profile ? "check-circle" : "info"} size={16} color={profile ? C.success : C.primary} />
          <Text style={[styles.infoText, { color: profile ? C.success : C.primary, textAlign }]}>
            {profile
              ? (isRTL ? "تم تحميل الملف الطبي الموجود. يمكنك تعديله وحفظه." : "Existing profile loaded. You can edit and save changes.")
              : (isRTL ? "هذه المعلومات تُحفظ بشكل دائم وتُستخدم في جميع الاستشارات المستقبلية." : "This information is stored permanently and used in all future consultations.")}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text, textAlign }]}>{t("pastMedicalHistory")}</Text>
          <TagInput
            label={t("chronicConditions")}
            items={chronicConditions}
            onAdd={(v) => setChronicConditions((p) => [...p, v])}
            onRemove={(i) => setChronicConditions((p) => p.filter((_, idx) => idx !== i))}
            placeholder={isRTL ? "مثال: ارتفاع ضغط الدم" : "e.g. Hypertension"}
            isRTL={isRTL}
            textAlign={textAlign}
          />
          <TagInput
            label={t("surgicalHistory")}
            items={surgicalHistory}
            onAdd={(v) => setSurgicalHistory((p) => [...p, v])}
            onRemove={(i) => setSurgicalHistory((p) => p.filter((_, idx) => idx !== i))}
            placeholder={isRTL ? "مثال: استئصال الزائدة 2010" : "e.g. Appendicectomy 2010"}
            isRTL={isRTL}
            textAlign={textAlign}
          />
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text, textAlign }]}>{isRTL ? "الأدوية والحساسية" : "Medications & Allergies"}</Text>
          <TagInput
            label={t("currentMedications")}
            items={medications}
            onAdd={(v) => setMedications((p) => [...p, v])}
            onRemove={(i) => setMedications((p) => p.filter((_, idx) => idx !== i))}
            placeholder={isRTL ? "مثال: ميتفورمين 500 مجم" : "e.g. Metformin 500mg"}
            isRTL={isRTL}
            textAlign={textAlign}
          />
          <TagInput
            label={t("allergies")}
            items={allergies}
            onAdd={(v) => setAllergies((p) => [...p, v])}
            onRemove={(i) => setAllergies((p) => p.filter((_, idx) => idx !== i))}
            placeholder={isRTL ? "مثال: البنسلين" : "e.g. Penicillin"}
            isRTL={isRTL}
            textAlign={textAlign}
          />
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text, textAlign }]}>{t("familyHistory")}</Text>
          <TagInput
            label={isRTL ? "الأمراض العائلية" : "Family Conditions"}
            items={familyConditions}
            onAdd={(v) => setFamilyConditions((p) => [...p, v])}
            onRemove={(i) => setFamilyConditions((p) => p.filter((_, idx) => idx !== i))}
            placeholder={isRTL ? "مثال: السكري (الأب)" : "e.g. Diabetes (Father)"}
            isRTL={isRTL}
            textAlign={textAlign}
          />
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text, textAlign }]}>{t("socialHistory")}</Text>
          <SelectOption
            label={t("smokingStatus")}
            options={["Non-smoker", "Ex-smoker", "Current smoker"]}
            arOptions={["غير مدخن", "مدخن سابق", "مدخن حالي"]}
            value={smokingStatus}
            onChange={setSmokingStatus}
            isRTL={isRTL}
            textAlign={textAlign}
          />
          <SelectOption
            label={t("alcoholUse")}
            options={["None", "Occasional", "Moderate", "Heavy"]}
            arOptions={["لا شيء", "أحياناً", "متوسط", "مفرط"]}
            value={alcoholUse}
            onChange={setAlcoholUse}
            isRTL={isRTL}
            textAlign={textAlign}
          />
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
