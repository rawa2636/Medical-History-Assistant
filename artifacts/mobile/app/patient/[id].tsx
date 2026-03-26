import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { endpoints } from "@/constants/api";
import { useLanguage } from "@/contexts/LanguageContext";

const C = Colors.light;

interface Case {
  id: number;
  chiefComplaint: string | null;
  status: string;
  createdAt: string;
  hasReport: boolean;
}

interface PatientDetail {
  id: number;
  name: string;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  email: string | null;
  phone: string | null;
  weight: string | null;
  height: string | null;
  maritalStatus: string | null;
  cases: Case[];
}

async function fetchPatient(id: string): Promise<PatientDetail> {
  const res = await fetch(endpoints.patient(parseInt(id)));
  if (!res.ok) throw new Error("Failed to fetch patient");
  const data = await res.json();
  // API returns {patient, profile, cases} — flatten to match screen expectations
  const patient = data.patient ?? data;
  const rawCases = data.cases ?? [];
  return {
    ...patient,
    cases: rawCases.map((c: any) => ({
      id: c.id,
      chiefComplaint: Array.isArray(c.chiefComplaints) ? c.chiefComplaints[0] ?? null : c.chiefComplaints ?? null,
      status: c.status,
      createdAt: c.createdAt,
      hasReport: !!c.hasReport || c.status === "completed",
    })),
  };
}

function CaseCard({ patientCase, isRTL }: { patientCase: Case; isRTL: boolean }) {
  const statusColor =
    patientCase.status === "completed" ? C.success :
    patientCase.status === "in_progress" ? C.accent : C.textTertiary;

  return (
    <TouchableOpacity
      style={[styles.caseCard, { backgroundColor: C.backgroundSecondary, borderColor: C.border, flexDirection: isRTL ? "row-reverse" : "row" }]}
      onPress={() => {
        Haptics.selectionAsync();
        if (patientCase.hasReport) {
          router.push({ pathname: "/case/report/[caseId]", params: { caseId: patientCase.id } });
        } else {
          router.push({ pathname: "/case/ros/[caseId]", params: { caseId: patientCase.id } });
        }
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.caseIconWrap, { backgroundColor: statusColor + "20" }]}>
        <Feather name={patientCase.hasReport ? "file-text" : "activity"} size={18} color={statusColor} />
      </View>
      <View style={[styles.caseContent, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
        <Text style={[styles.caseComplaint, { color: C.text }]} numberOfLines={1}>
          {patientCase.chiefComplaint || "Case #" + patientCase.id}
        </Text>
        <Text style={[styles.caseMeta, { color: C.textSecondary }]}>
          {new Date(patientCase.createdAt).toLocaleDateString()} · {patientCase.status.replace("_", " ")}
        </Text>
      </View>
      <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={16} color={C.textTertiary} />
    </TouchableOpacity>
  );
}

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { t, isRTL } = useLanguage();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const textAlign = isRTL ? "right" : "left";

  const { data: patient, isLoading, error } = useQuery({ queryKey: ["patient", id], queryFn: () => fetchPatient(id) });

  async function handleNewCase() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(endpoints.cases, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: parseInt(id) }),
      });
      if (!res.ok) throw new Error("Failed to create case");
      const newCase = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["patient", id] });
      router.push({ pathname: "/case/ros/[caseId]", params: { caseId: newCase.id } });
    } catch {
      Alert.alert("Error", "Failed to create case. Please try again.");
    }
  }

  async function handleViewProfile() {
    router.push({ pathname: "/patient/profile/[id]", params: { id } });
  }

  const renderCase = useCallback(({ item }: { item: Case }) => (
    <CaseCard patientCase={item} isRTL={isRTL} />
  ), [isRTL]);

  if (isLoading) {
    return <View style={[styles.center, { backgroundColor: C.background }]}><ActivityIndicator size="large" color={C.primary} /></View>;
  }

  if (error || !patient) {
    return <View style={[styles.center, { backgroundColor: C.background }]}><Text style={{ color: C.error }}>{t("errorLoadingPatients")}</Text></View>;
  }

  const initials = patient.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const meta = [patient.age ? `${patient.age} yrs` : null, patient.gender].filter(Boolean).join(" · ");

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border, flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>{t("patientFile")}</Text>
        <TouchableOpacity style={[styles.profileBtn, { borderColor: C.border }]} onPress={handleViewProfile} activeOpacity={0.7}>
          <Feather name="user" size={16} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.patientBanner, { backgroundColor: C.backgroundSecondary, borderBottomColor: C.border, flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={[styles.bigAvatar, { backgroundColor: C.primary + "20" }]}>
          <Text style={[styles.bigAvatarText, { color: C.primary }]}>{initials}</Text>
        </View>
        <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
          <Text style={[styles.patientName, { color: C.text, textAlign }]}>{patient.name}</Text>
          {meta ? <Text style={[styles.patientMeta, { color: C.textSecondary }]}>{meta}</Text> : null}
          {patient.occupation && <Text style={[styles.patientOccupation, { color: C.textTertiary }]}>{patient.occupation}</Text>}
        </View>
      </View>

      <FlatList
        data={patient.cases}
        keyExtractor={(c) => String(c.id)}
        renderItem={renderCase}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={() => (
          <Text style={[styles.sectionLabel, { color: C.textSecondary, textAlign }]}>
            {isRTL ? `الحالات (${patient.cases.length})` : `Cases (${patient.cases.length})`}
          </Text>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Feather name="clipboard" size={32} color={C.textTertiary} />
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>
              {isRTL ? "لا توجد حالات بعد" : "No cases yet"}
            </Text>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: C.backgroundSecondary, borderTopColor: C.border }]}>
        <TouchableOpacity
          style={[styles.newCaseBtn, { backgroundColor: C.primary, flexDirection: isRTL ? "row-reverse" : "row" }]}
          onPress={handleNewCase}
          activeOpacity={0.85}
        >
          <Feather name="plus-circle" size={20} color="#fff" />
          <Text style={styles.newCaseBtnText}>{isRTL ? "حالة جديدة" : "New Case"}</Text>
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
  profileBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  patientBanner: { alignItems: "center", gap: 14, padding: 16, borderBottomWidth: 1 },
  bigAvatar: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  bigAvatarText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  patientName: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  patientMeta: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  patientOccupation: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  listContent: { padding: 16, gap: 0 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  caseCard: { alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  caseIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  caseContent: { flex: 1 },
  caseComplaint: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  caseMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  emptyContainer: { alignItems: "center", gap: 8, paddingVertical: 32 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  footer: { paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  newCaseBtn: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  newCaseBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
