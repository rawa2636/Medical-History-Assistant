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
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { endpoints } from "@/constants/api";

const C = Colors.light;

interface Report {
  id: number;
  caseId: number;
  patientInfo: { name: string; age: number | null; gender: string | null; occupation: string | null };
  chiefComplaint: string | null;
  hpi: string | null;
  ros: string | null;
  pmh: string | null;
  drugHistory: string | null;
  allergyHistory: string | null;
  familyHistory: string | null;
  socialHistory: string | null;
  summary: string | null;
  generatedAt: string;
}

function ReportSection({ title, icon, content, color }: { title: string; icon: string; content: string | null; color?: string }) {
  const [expanded, setExpanded] = useState(true);
  if (!content) return null;

  return (
    <View style={[styles.reportSection, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
      <TouchableOpacity
        style={styles.reportSectionHeader}
        onPress={() => {
          Haptics.selectionAsync();
          setExpanded((p) => !p);
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.sectionIcon, { backgroundColor: (color || C.primary) + "20" }]}>
          <Feather name={icon as any} size={16} color={color || C.primary} />
        </View>
        <Text style={[styles.sectionHeaderText, { color: C.text }]}>{title}</Text>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={C.textTertiary} />
      </TouchableOpacity>
      {expanded && (
        <Text style={[styles.sectionContent, { color: C.textSecondary }]}>{content}</Text>
      )}
    </View>
  );
}

export default function ReportScreen() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [generating, setGenerating] = useState(false);

  const { data: report, isLoading, error, refetch } = useQuery<Report>({
    queryKey: ["report", caseId],
    queryFn: async () => {
      const res = await fetch(endpoints.report(parseInt(caseId)));
      if (!res.ok) throw new Error("Report not found");
      return res.json();
    },
    retry: false,
  });

  async function handleGenerate() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setGenerating(true);
    try {
      const res = await fetch(endpoints.generateReport(parseInt(caseId)), { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate");
      refetch();
    } catch {
      Alert.alert("Error", "Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Medical Report</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.center, { flex: 1 }]}>
          <View style={[styles.noReportIcon, { backgroundColor: C.primary + "15" }]}>
            <Feather name="file-text" size={36} color={C.primary} />
          </View>
          <Text style={[styles.noReportTitle, { color: C.text }]}>No Report Yet</Text>
          <Text style={[styles.noReportSubtitle, { color: C.textSecondary }]}>
            Complete the interview first, then generate a structured medical history report.
          </Text>
          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: C.primary, opacity: generating ? 0.7 : 1 }]}
            onPress={handleGenerate}
            disabled={generating}
            activeOpacity={0.85}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="zap" size={18} color="#fff" />
                <Text style={styles.generateBtnText}>Generate Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const date = new Date(report.generatedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Medical Report</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push({ pathname: "/case/doctor/[caseId]", params: { caseId } })}
        >
          <Feather name="user-check" size={18} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.reportHeader, { backgroundColor: C.primary, borderColor: C.primaryDark }]}>
          <View style={styles.reportHeaderTop}>
            <View>
              <Text style={styles.reportHeaderName}>{report.patientInfo?.name || "Patient"}</Text>
              <View style={styles.reportHeaderMeta}>
                {report.patientInfo?.age && (
                  <Text style={styles.reportHeaderMetaText}>{report.patientInfo.age}y</Text>
                )}
                {report.patientInfo?.gender && (
                  <Text style={styles.reportHeaderMetaText}>{report.patientInfo.gender}</Text>
                )}
                {report.patientInfo?.occupation && (
                  <Text style={styles.reportHeaderMetaText}>{report.patientInfo.occupation}</Text>
                )}
              </View>
            </View>
            <View style={[styles.reportBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={styles.reportBadgeText}>Medical History</Text>
            </View>
          </View>
          <Text style={styles.reportDate}>Generated: {date}</Text>
          <View style={[styles.disclaimer, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Feather name="alert-circle" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.disclaimerText}>
              This is a history report only. No diagnosis or treatment recommendations are included.
            </Text>
          </View>
        </View>

        {report.summary && (
          <View style={[styles.summaryCard, { backgroundColor: C.success + "10", borderColor: C.success + "30" }]}>
            <Text style={[styles.summaryLabel, { color: C.success }]}>Summary for Physician</Text>
            <Text style={[styles.summaryText, { color: C.text }]}>{report.summary}</Text>
          </View>
        )}

        <ReportSection title="Chief Complaint" icon="alert-circle" content={report.chiefComplaint} color="#E53E3E" />
        <ReportSection title="History of Present Illness" icon="clock" content={report.hpi} />
        <ReportSection title="Review of Systems" icon="list" content={report.ros} color="#3182CE" />
        <ReportSection title="Past Medical History" icon="archive" content={report.pmh} color="#805AD5" />
        <ReportSection title="Drug History" icon="package" content={report.drugHistory} color="#D69E2E" />
        <ReportSection title="Allergy History" icon="alert-triangle" content={report.allergyHistory} color="#E53E3E" />
        <ReportSection title="Family History" icon="users" content={report.familyHistory} color="#38A169" />
        <ReportSection title="Social History" icon="coffee" content={report.socialHistory} color="#718096" />

        <TouchableOpacity
          style={[styles.regenerateBtn, { borderColor: C.border }]}
          onPress={handleGenerate}
          disabled={generating}
          activeOpacity={0.7}
        >
          {generating ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <>
              <Feather name="refresh-cw" size={16} color={C.primary} />
              <Text style={[styles.regenerateBtnText, { color: C.primary }]}>Regenerate Report</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 10 },
  reportHeader: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginBottom: 2,
  },
  reportHeaderTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  reportHeaderName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  reportHeaderMeta: { flexDirection: "row", gap: 8, marginTop: 4 },
  reportHeaderMetaText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  reportBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  reportBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  reportDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  disclaimer: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 10 },
  disclaimerText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.9)", flex: 1, lineHeight: 16 },
  summaryCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.8 },
  summaryText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  reportSection: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  reportSectionHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  sectionIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  sectionHeaderText: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sectionContent: { paddingHorizontal: 14, paddingBottom: 14, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  noReportIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  noReportTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  noReportSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginTop: 8,
  },
  generateBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  regenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  regenerateBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
