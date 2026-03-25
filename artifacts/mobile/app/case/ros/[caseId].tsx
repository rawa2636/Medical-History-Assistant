import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

export default function ReviewOfSystemsScreen() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const insets = useSafeAreaInsets();
  const { t, isRTL, language } = useLanguage();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [expandedSystem, setExpandedSystem] = useState<string | null>(SYMPTOM_SYSTEMS[0].id);

  const totalSelected = Object.values(selectedSymptoms).flat().length;
  const textAlign = isRTL ? "right" : "left";

  function toggleSymptom(systemId: string, symptomEn: string) {
    Haptics.selectionAsync();
    setSelectedSymptoms((prev) => {
      const current = prev[systemId] || [];
      if (current.includes(symptomEn)) {
        return { ...prev, [systemId]: current.filter((s) => s !== symptomEn) };
      } else {
        return { ...prev, [systemId]: [...current, symptomEn] };
      }
    });
  }

  async function handleNext() {
    if (totalSelected === 0) {
      Alert.alert(t("noSymptomsSelected"), t("selectAtLeastOne"));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const res = await fetch(endpoints.caseRos(parseInt(caseId)), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: selectedSymptoms }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push({ pathname: "/case/complaints/[caseId]", params: { caseId, symptoms: JSON.stringify(selectedSymptoms) } });
    } catch {
      Alert.alert("Error", "Failed to save symptoms. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border, flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerStep, { color: C.primary }]}>{t("step1of3")}</Text>
          <Text style={[styles.headerTitle, { color: C.text }]}>{t("reviewOfSystems")}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.progressBar, { backgroundColor: C.backgroundTertiary }]}>
        <View style={[styles.progressFill, { width: "33%", backgroundColor: C.primary }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.instruction, { color: C.textSecondary, textAlign }]}>{t("rosInstruction")}</Text>

        {SYMPTOM_SYSTEMS.map((system) => {
          const selected = selectedSymptoms[system.id] || [];
          const isExpanded = expandedSystem === system.id;
          const systemName = language === "ar" ? system.nameAr : system.name;
          const symptoms = language === "ar" ? system.symptomsAr : system.symptoms;

          return (
            <View key={system.id} style={[styles.systemCard, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
              <TouchableOpacity
                style={[styles.systemHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                onPress={() => { Haptics.selectionAsync(); setExpandedSystem(isExpanded ? null : system.id); }}
                activeOpacity={0.7}
              >
                <View style={[styles.systemIcon, { backgroundColor: system.color + "20" }]}>
                  <Feather name={system.icon as any} size={18} color={system.color} />
                </View>
                <Text style={[styles.systemName, { color: C.text, textAlign }]}>{systemName}</Text>
                <View style={[styles.systemRight, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  {selected.length > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: system.color }]}>
                      <Text style={styles.countBadgeText}>{selected.length}</Text>
                    </View>
                  )}
                  <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={C.textTertiary} />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={[styles.symptomsGrid, { borderTopColor: C.border }]}>
                  {symptoms.map((symptom, idx) => {
                    const englishSymptom = system.symptoms[idx];
                    const isSelected = selected.includes(englishSymptom);
                    return (
                      <TouchableOpacity
                        key={englishSymptom}
                        style={[
                          styles.symptomBtn,
                          {
                            backgroundColor: isSelected ? system.color + "15" : C.background,
                            borderColor: isSelected ? system.color : C.border,
                          },
                        ]}
                        onPress={() => toggleSymptom(system.id, englishSymptom)}
                        activeOpacity={0.7}
                      >
                        {isSelected && <Feather name="check" size={12} color={system.color} />}
                        <Text style={[styles.symptomText, { color: isSelected ? system.color : C.textSecondary }]}>
                          {symptom}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: C.backgroundSecondary, borderTopColor: C.border }]}>
        {totalSelected > 0 && (
          <Text style={[styles.selectedCount, { color: C.textSecondary }]}>
            {isRTL ? `${totalSelected} عرض مختار` : `${totalSelected} symptom${totalSelected !== 1 ? "s" : ""} selected`}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: C.primary, opacity: saving ? 0.7 : 1, flexDirection: isRTL ? "row-reverse" : "row" }]}
          onPress={handleNext}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
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
  content: { padding: 16, gap: 8 },
  instruction: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 4 },
  systemCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  systemHeader: { alignItems: "center", padding: 14, gap: 12 },
  systemIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  systemName: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  systemRight: { alignItems: "center", gap: 8 },
  countBadge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  countBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  symptomsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 12, borderTopWidth: 1 },
  symptomBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  symptomText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  footer: { paddingTop: 12, paddingHorizontal: 16, gap: 8, borderTopWidth: 1 },
  selectedCount: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  nextBtn: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
