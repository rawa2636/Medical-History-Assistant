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
import Colors from "@/constants/colors";
import { endpoints } from "@/constants/api";
import { SYMPTOM_SYSTEMS } from "@/constants/symptoms";
import { useLanguage } from "@/contexts/LanguageContext";

const C = Colors.light;

interface Complaint {
  symptom: string;
  symptomAr: string;
  duration: string;
}

export default function ChiefComplaintsScreen() {
  const { caseId, symptoms: symptomsParam } = useLocalSearchParams<{ caseId: string; symptoms?: string }>();
  const insets = useSafeAreaInsets();
  const { t, isRTL, language } = useLanguage();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const textAlign = isRTL ? "right" : "left";

  const allSymptomPairs: { en: string; ar: string }[] = React.useMemo(() => {
    if (!symptomsParam) return [];
    try {
      const parsed = JSON.parse(symptomsParam) as Record<string, string[]>;
      return Object.entries(parsed).flatMap(([systemId, englishSymptoms]) => {
        const system = SYMPTOM_SYSTEMS.find((s) => s.id === systemId);
        return (englishSymptoms as string[]).map((en) => {
          const idx = system?.symptoms.indexOf(en) ?? -1;
          const ar = idx >= 0 ? (system?.symptomsAr[idx] ?? en) : en;
          return { en, ar };
        });
      });
    } catch {
      return [];
    }
  }, [symptomsParam]);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedSymptomEn, setSelectedSymptomEn] = useState<string | null>(null);
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);

  function addComplaint() {
    if (!selectedSymptomEn || !duration.trim()) return;
    if (complaints.length >= 3) {
      Alert.alert(t("maxComplaints"), t("maxComplaintsMsg"));
      return;
    }
    if (complaints.find((c) => c.symptom === selectedSymptomEn)) {
      Alert.alert(t("alreadyAdded"), t("alreadyAddedMsg"));
      return;
    }
    Haptics.selectionAsync();
    const pair = allSymptomPairs.find((p) => p.en === selectedSymptomEn);
    setComplaints((prev) => [...prev, { symptom: selectedSymptomEn, symptomAr: pair?.ar ?? selectedSymptomEn, duration: duration.trim() }]);
    setSelectedSymptomEn(null);
    setDuration("");
  }

  function removeComplaint(idx: number) {
    Haptics.selectionAsync();
    setComplaints((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleNext() {
    if (complaints.length === 0) {
      Alert.alert(t("noComplaints"), t("selectAtLeastOneComplaint"));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const apiComplaints = complaints.map((c) => ({ symptom: c.symptom, symptomAr: c.symptomAr, duration: c.duration }));
      const res = await fetch(endpoints.caseComplaints(parseInt(caseId)), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaints: apiComplaints }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const startRes = await fetch(endpoints.interviewStart(parseInt(caseId)), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language }) });
      if (!startRes.ok) throw new Error("Failed to start interview");
      router.push({ pathname: "/case/interview/[caseId]", params: { caseId } });
    } catch {
      Alert.alert("Error", "Failed to proceed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const availableSymptomPairs = allSymptomPairs.filter((p) => !complaints.find((c) => c.symptom === p.en));

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border, flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerStep, { color: C.primary }]}>{t("step2of3")}</Text>
          <Text style={[styles.headerTitle, { color: C.text }]}>{t("chiefComplaints")}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.progressBar, { backgroundColor: C.backgroundTertiary }]}>
        <View style={[styles.progressFill, { width: "66%", backgroundColor: C.primary }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={[styles.instruction, { color: C.textSecondary, textAlign }]}>{t("complaintsInstruction")}</Text>

        {complaints.length > 0 && (
          <View style={[styles.card, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
            <Text style={[styles.cardTitle, { color: C.text, textAlign }]}>{t("chiefComplaintsTitle")}</Text>
            {complaints.map((c, idx) => (
              <View key={idx} style={[styles.complaintRow, { backgroundColor: C.primary + "10", flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={[styles.complaintDot, { backgroundColor: C.primary }]} />
                <View style={[styles.complaintContent, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                  <Text style={[styles.complaintSymptom, { color: C.text }]}>{language === "ar" ? c.symptomAr : c.symptom}</Text>
                  <Text style={[styles.complaintDuration, { color: C.textSecondary }]}>{c.duration}</Text>
                </View>
                <TouchableOpacity onPress={() => removeComplaint(idx)} style={styles.removeBtn}>
                  <Feather name="x" size={16} color={C.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {complaints.length < 3 && (
          <View style={[styles.card, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
            <Text style={[styles.cardTitle, { color: C.text, textAlign }]}>{t("selectSymptom")}</Text>
            <View style={styles.symptomGrid}>
              {availableSymptomPairs.map((pair) => (
                <TouchableOpacity
                  key={pair.en}
                  style={[styles.symptomChip, { backgroundColor: selectedSymptomEn === pair.en ? C.primary + "15" : C.background, borderColor: selectedSymptomEn === pair.en ? C.primary : C.border }]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedSymptomEn(selectedSymptomEn === pair.en ? null : pair.en); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.symptomChipText, { color: selectedSymptomEn === pair.en ? C.primary : C.textSecondary }]}>
                    {language === "ar" ? pair.ar : pair.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedSymptomEn && (
              <>
                <Text style={[styles.durationLabel, { color: C.textSecondary, textAlign }]}>{t("durationLabel")}</Text>
                <View style={[styles.durationRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <TextInput
                    style={[styles.durationInput, { color: C.text, borderColor: C.border, backgroundColor: C.background, flex: 1, textAlign }]}
                    value={duration}
                    onChangeText={setDuration}
                    placeholder={t("durationPlaceholder")}
                    placeholderTextColor={C.textTertiary}
                    returnKeyType="done"
                    onSubmitEditing={addComplaint}
                  />
                  <TouchableOpacity style={[styles.addBtn, { backgroundColor: C.primary }]} onPress={addComplaint} activeOpacity={0.8}>
                    <Feather name="plus" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>{t("addComplaint")}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: C.backgroundSecondary, borderTopColor: C.border }]}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: C.primary, opacity: (saving || complaints.length === 0) ? 0.6 : 1, flexDirection: isRTL ? "row-reverse" : "row" }]}
          onPress={handleNext}
          disabled={saving || complaints.length === 0}
          activeOpacity={0.85}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={styles.nextBtnText}>{t("next")}</Text>
              <Feather name={isRTL ? "arrow-left" : "arrow-right"} size={18} color="#fff" />
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
  headerCenter: { alignItems: "center" },
  headerStep: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  progressBar: { height: 3 },
  progressFill: { height: 3 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  instruction: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  complaintRow: { alignItems: "center", gap: 10, padding: 10, borderRadius: 10 },
  complaintDot: { width: 8, height: 8, borderRadius: 4 },
  complaintContent: { flex: 1 },
  complaintSymptom: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  complaintDuration: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  removeBtn: { padding: 4 },
  symptomGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  symptomChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  symptomChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  durationLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  durationRow: { gap: 8, alignItems: "center" },
  durationInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, fontFamily: "Inter_400Regular" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  footer: { paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  nextBtn: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
