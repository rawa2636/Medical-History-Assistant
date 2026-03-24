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

const C = Colors.light;

interface Complaint {
  symptom: string;
  duration: string;
}

export default function ChiefComplaintsScreen() {
  const { caseId, symptoms: symptomsParam } = useLocalSearchParams<{ caseId: string; symptoms?: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const allSymptoms: string[] = React.useMemo(() => {
    if (!symptomsParam) return [];
    try {
      const parsed = JSON.parse(symptomsParam);
      return Object.values(parsed).flat() as string[];
    } catch {
      return [];
    }
  }, [symptomsParam]);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);

  function addComplaint() {
    if (!selectedSymptom || !duration.trim()) return;
    if (complaints.length >= 3) {
      Alert.alert("Maximum reached", "You can select up to 3 chief complaints.");
      return;
    }
    if (complaints.find((c) => c.symptom === selectedSymptom)) {
      Alert.alert("Already added", "This symptom has already been added as a chief complaint.");
      return;
    }
    Haptics.selectionAsync();
    setComplaints((prev) => [...prev, { symptom: selectedSymptom, duration: duration.trim() }]);
    setSelectedSymptom(null);
    setDuration("");
  }

  function removeComplaint(idx: number) {
    Haptics.selectionAsync();
    setComplaints((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleNext() {
    if (complaints.length === 0) {
      Alert.alert("No complaints", "Please select at least one chief complaint.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      const res = await fetch(endpoints.caseComplaints(parseInt(caseId)), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaints }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const startRes = await fetch(endpoints.interviewStart(parseInt(caseId)), { method: "POST" });
      if (!startRes.ok) throw new Error("Failed to start interview");

      router.push({ pathname: "/case/interview/[caseId]", params: { caseId } });
    } catch {
      Alert.alert("Error", "Failed to proceed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const availableSymptoms = allSymptoms.filter((s) => !complaints.find((c) => c.symptom === s));

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerStep, { color: C.primary }]}>Step 2 of 3</Text>
          <Text style={[styles.headerTitle, { color: C.text }]}>Chief Complaints</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.progressBar, { backgroundColor: C.backgroundTertiary }]}>
        <View style={[styles.progressFill, { width: "66%", backgroundColor: C.primary }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.infoCard, { backgroundColor: C.primary + "10", borderColor: C.primary + "30" }]}>
          <Feather name="info" size={16} color={C.primary} />
          <Text style={[styles.infoText, { color: C.primary }]}>
            Select up to 3 main symptoms that prompted this visit, and specify how long each has been present.
          </Text>
        </View>

        {complaints.length > 0 && (
          <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Selected Complaints</Text>
            {complaints.map((c, idx) => (
              <View key={idx} style={[styles.complaintItem, { backgroundColor: C.backgroundTertiary }]}>
                <View style={[styles.complaintNumber, { backgroundColor: C.primary }]}>
                  <Text style={styles.complaintNumberText}>{idx + 1}</Text>
                </View>
                <View style={styles.complaintContent}>
                  <Text style={[styles.complaintSymptom, { color: C.text }]}>{c.symptom}</Text>
                  <Text style={[styles.complaintDuration, { color: C.textSecondary }]}>Duration: {c.duration}</Text>
                </View>
                <TouchableOpacity onPress={() => removeComplaint(idx)} style={styles.removeBtn}>
                  <Feather name="x" size={16} color={C.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {complaints.length < 3 && (
          <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>
              Add Complaint {complaints.length + 1}
              {complaints.length === 0 ? " (Primary)" : " (Optional)"}
            </Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: C.textSecondary }]}>Select Symptom</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.symptomScroll}>
                <View style={styles.symptomChips}>
                  {availableSymptoms.length === 0 ? (
                    <Text style={[styles.noSymptoms, { color: C.textTertiary }]}>No more symptoms available</Text>
                  ) : (
                    availableSymptoms.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.symptomChip,
                          {
                            backgroundColor: selectedSymptom === s ? C.primary : C.backgroundTertiary,
                            borderColor: selectedSymptom === s ? C.primary : "transparent",
                          },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedSymptom(selectedSymptom === s ? null : s);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.symptomChipText, { color: selectedSymptom === s ? "#fff" : C.text }]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: C.textSecondary }]}>Duration</Text>
              <View style={styles.durationRow}>
                <TextInput
                  style={[styles.durationInput, { borderColor: C.border, backgroundColor: C.backgroundTertiary, color: C.text }]}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="e.g. 3 days, 2 weeks"
                  placeholderTextColor={C.textTertiary}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[
                    styles.addBtn,
                    {
                      backgroundColor: selectedSymptom && duration ? C.primary : C.backgroundTertiary,
                      opacity: selectedSymptom && duration ? 1 : 0.5,
                    },
                  ]}
                  onPress={addComplaint}
                  disabled={!selectedSymptom || !duration.trim()}
                  activeOpacity={0.7}
                >
                  <Feather name="plus" size={20} color={selectedSymptom && duration ? "#fff" : C.textTertiary} />
                </TouchableOpacity>
              </View>
              <View style={styles.durationSuggestions}>
                {["1 day", "3 days", "1 week", "2 weeks", "1 month"].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.durationChip, { backgroundColor: C.backgroundTertiary }]}
                    onPress={() => setDuration(d)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.durationChipText, { color: C.textSecondary }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: C.backgroundSecondary, borderTopColor: C.border }]}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: C.primary, opacity: saving || complaints.length === 0 ? 0.6 : 1 }]}
          onPress={handleNext}
          disabled={saving || complaints.length === 0}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.nextBtnText}>Start AI Interview</Text>
              <Feather name="message-circle" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  headerStep: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  progressBar: { height: 3 },
  progressFill: { height: 3 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  infoCard: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  complaintItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, gap: 12 },
  complaintNumber: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  complaintNumberText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  complaintContent: { flex: 1 },
  complaintSymptom: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  complaintDuration: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  removeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  field: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  symptomScroll: { marginHorizontal: -4 },
  symptomChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 4 },
  noSymptoms: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  symptomChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  symptomChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  durationRow: { flexDirection: "row", gap: 8 },
  durationInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular" },
  addBtn: { width: 46, height: 46, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  durationSuggestions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  durationChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  durationChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  footer: { paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
