import React, { useCallback } from "react";
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
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { endpoints } from "@/constants/api";

const C = Colors.light;

interface Patient {
  id: number;
  name: string;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  weight: string | null;
  height: string | null;
  maritalStatus: string | null;
  createdAt: string;
}

interface Case {
  id: number;
  status: string;
  createdAt: string;
}

interface PatientFull {
  patient: Patient;
  profile: Record<string, unknown> | null;
  cases: Case[];
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    active: { label: "Active", bg: C.primary + "20", color: C.primary },
    interviewing: { label: "Interviewing", bg: "#D69E2E20", color: "#D69E2E" },
    interview_complete: { label: "Interview Done", bg: C.accent + "25", color: "#007A68" },
    report_ready: { label: "Report Ready", bg: C.success + "20", color: C.success },
  };

  const cfg = config[status] || { label: status, bg: C.backgroundTertiary, color: C.textSecondary };

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function CaseCard({ caseData }: { caseData: Case }) {
  const date = new Date(caseData.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const getAction = () => {
    switch (caseData.status) {
      case "active":
        return { label: "Start ROS", route: "/case/ros/[caseId]" };
      case "interviewing":
        return { label: "Continue Interview", route: "/case/interview/[caseId]" };
      case "interview_complete":
        return { label: "Generate Report", route: "/case/report/[caseId]" };
      case "report_ready":
        return { label: "View Report", route: "/case/report/[caseId]" };
      default:
        return { label: "Open Case", route: "/case/ros/[caseId]" };
    }
  };

  const action = getAction();

  return (
    <TouchableOpacity
      style={[styles.caseCard, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}
      onPress={() => {
        Haptics.selectionAsync();
        router.push({ pathname: action.route as any, params: { caseId: caseData.id } });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.caseCardTop}>
        <View style={[styles.caseIcon, { backgroundColor: C.primary + "15" }]}>
          <Feather name="file-text" size={18} color={C.primary} />
        </View>
        <View style={styles.caseCardContent}>
          <Text style={[styles.caseTitle, { color: C.text }]}>Case #{caseData.id}</Text>
          <Text style={[styles.caseDate, { color: C.textSecondary }]}>{date}</Text>
        </View>
        <StatusBadge status={caseData.status} />
      </View>
      <View style={[styles.caseAction, { borderTopColor: C.borderLight }]}>
        <Text style={[styles.caseActionText, { color: C.primary }]}>{action.label}</Text>
        <Feather name="arrow-right" size={14} color={C.primary} />
      </View>
    </TouchableOpacity>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: C.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: C.text }]}>{value}</Text>
    </View>
  );
}

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data, isLoading, error, refetch } = useQuery<PatientFull>({
    queryKey: ["patient", id],
    queryFn: async () => {
      const res = await fetch(endpoints.patient(parseInt(id)));
      if (!res.ok) throw new Error("Failed to fetch patient");
      return res.json();
    },
  });

  const createCaseMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(endpoints.cases, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: parseInt(id) }),
      });
      if (!res.ok) throw new Error("Failed to create case");
      return res.json();
    },
    onSuccess: (newCase) => {
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      router.push({ pathname: "/case/ros/[caseId]", params: { caseId: newCase.id } });
    },
    onError: () => {
      Alert.alert("Error", "Failed to create new case. Please try again.");
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <Feather name="alert-circle" size={32} color={C.error} />
        <Text style={[styles.errorText, { color: C.error }]}>Failed to load patient</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={[styles.retryText, { color: C.primary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { patient, profile, cases } = data;

  const initials = patient.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Patient File</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push({ pathname: "/patient/profile/[id]", params: { id: patient.id } })}
        >
          <Feather name="edit-2" size={18} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileCard, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <View style={[styles.avatarLarge, { backgroundColor: C.primary + "20" }]}>
            <Text style={[styles.avatarLargeText, { color: C.primary }]}>{initials}</Text>
          </View>
          <Text style={[styles.patientName, { color: C.text }]}>{patient.name}</Text>
          <View style={styles.metaRow}>
            {patient.age && (
              <Text style={[styles.metaChip, { color: C.textSecondary, backgroundColor: C.backgroundTertiary }]}>
                {patient.age} years
              </Text>
            )}
            {patient.gender && (
              <Text style={[styles.metaChip, { color: C.textSecondary, backgroundColor: C.backgroundTertiary }]}>
                {patient.gender}
              </Text>
            )}
            {patient.occupation && (
              <Text style={[styles.metaChip, { color: C.textSecondary, backgroundColor: C.backgroundTertiary }]}>
                {patient.occupation}
              </Text>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: C.borderLight }]} />

          <View style={styles.infoGrid}>
            <InfoRow label="Weight" value={patient.weight} />
            <InfoRow label="Height" value={patient.height} />
            <InfoRow label="Marital Status" value={patient.maritalStatus} />
          </View>
        </View>

        {!profile && (
          <TouchableOpacity
            style={[styles.bannerCard, { backgroundColor: C.primary + "12", borderColor: C.primary + "30" }]}
            onPress={() => router.push({ pathname: "/patient/profile/[id]", params: { id: patient.id } })}
            activeOpacity={0.7}
          >
            <Feather name="info" size={18} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: C.primary }]}>Complete Medical Profile</Text>
              <Text style={[styles.bannerSubtitle, { color: C.primaryLight }]}>
                Add chronic conditions, medications, allergies, and family history
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={C.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Cases</Text>
          <Text style={[styles.sectionCount, { color: C.textSecondary }]}>{cases.length}</Text>
        </View>

        {cases.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
            <Feather name="clipboard" size={28} color={C.textTertiary} />
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>No cases yet</Text>
          </View>
        ) : (
          <View style={styles.casesList}>
            {cases.map((c) => (
              <CaseCard key={c.id} caseData={c} />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: C.backgroundSecondary, borderTopColor: C.border }]}>
        <TouchableOpacity
          style={[styles.newCaseBtn, { backgroundColor: C.primary, opacity: createCaseMutation.isPending ? 0.7 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            createCaseMutation.mutate();
          }}
          disabled={createCaseMutation.isPending}
          activeOpacity={0.85}
        >
          {createCaseMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="plus-circle" size={18} color="#fff" />
              <Text style={styles.newCaseBtnText}>New Case</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
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
  scroll: { flex: 1, padding: 16 },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarLargeText: { fontSize: 28, fontFamily: "Inter_700Bold" },
  patientName: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, justifyContent: "center" },
  metaChip: { fontSize: 13, fontFamily: "Inter_500Medium", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  divider: { width: "100%", height: 1, marginVertical: 16 },
  infoGrid: { width: "100%", gap: 10 },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium" },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  bannerTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  bannerSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionCount: { fontSize: 15, fontFamily: "Inter_500Medium" },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  casesList: { gap: 8 },
  caseCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  caseCardTop: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  caseIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  caseCardContent: { flex: 1 },
  caseTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  caseDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  caseAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  caseActionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  errorText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  retryText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  footer: { paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  newCaseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  newCaseBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
