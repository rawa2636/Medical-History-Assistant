import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/constants/api";

const C = {
  primary: "#1A6B5E", accent: "#00C9A7", bg: "#F7F8FA", card: "#FFFFFF",
  text: "#0F1923", textSecondary: "#6B7280", border: "#E5E7EB",
  green: "#10B981", yellow: "#F59E0B", red: "#EF4444", blue: "#3182CE",
  purple: "#805AD5",
};

const STATUS_COLOR: Record<string, string> = {
  pending: C.yellow, accepted: C.blue, in_review: C.purple,
  completed: C.green, rejected: C.red,
};
const STATUS_LABEL: Record<string, string> = {
  pending: "قيد الانتظار", accepted: "مقبول", in_review: "قيد المراجعة",
  completed: "مكتمل", rejected: "مرفوض",
};
const TYPE_LABEL: Record<string, string> = {
  free_student: "مجاني — طلاب طب", free_doctor: "مجاني — طبيب متطوع", paid: "مدفوع",
};

export default function PatientPortalScreen() {
  const { user, token, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: consultations, isLoading, refetch } = useQuery({
    queryKey: ["my-consultations"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/consultations/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<any[]>;
    },
    enabled: !!token,
  });

  const { data: cases } = useQuery({
    queryKey: ["patient-cases", user?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/patients/${user?.id}/cases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json() as Promise<any[]>;
    },
    enabled: !!user?.id && !!token,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const completedCases = (cases || []).filter((c: any) => c.status === "completed");

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>مرحباً، {user?.fullName?.split(" ")[0]}</Text>
          <Text style={styles.subtitle}>بوابة المريض</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          <Feather name="log-out" size={18} color={C.red} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={consultations || []}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        ListHeaderComponent={
          <View>
            {/* New Request Card */}
            <TouchableOpacity
              style={[styles.requestCard, { backgroundColor: C.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/patient-portal/consult" as any);
              }}
              activeOpacity={0.85}
            >
              <View style={styles.requestCardInner}>
                <View style={styles.requestIcon}>
                  <Feather name="send" size={24} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestTitle}>طلب استشارة جديدة</Text>
                  <Text style={styles.requestSub}>
                    {completedCases.length > 0
                      ? `لديك ${completedCases.length} تقرير جاهز للإرسال`
                      : "أرسل تقريرك لطبيب أو طالب طب"}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: C.card }]}>
                <Text style={styles.statNum}>{(consultations || []).filter((c: any) => c.status === "pending").length}</Text>
                <Text style={styles.statLabel}>قيد الانتظار</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: C.card }]}>
                <Text style={styles.statNum}>{(consultations || []).filter((c: any) => c.status === "accepted" || c.status === "in_review").length}</Text>
                <Text style={styles.statLabel}>جارية</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: C.card }]}>
                <Text style={styles.statNum}>{(consultations || []).filter((c: any) => c.status === "completed").length}</Text>
                <Text style={styles.statLabel}>مكتملة</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>طلباتي</Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Feather name="inbox" size={40} color={C.border} />
              <Text style={styles.emptyText}>لا توجد طلبات بعد</Text>
              <Text style={styles.emptySub}>أرسل تقريرك الطبي للحصول على رأي طبي</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={[styles.consultCard, { backgroundColor: C.card }]}>
            <View style={styles.consultHeader}>
              <View style={[styles.typeBadge, { backgroundColor: C.primary + "15" }]}>
                <Text style={[styles.typeText, { color: C.primary }]}>
                  {TYPE_LABEL[item.consultationType] || item.consultationType}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[item.status] || C.yellow) + "20" }]}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] || C.yellow }]} />
                <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] || C.yellow }]}>
                  {STATUS_LABEL[item.status] || item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.consultDate}>
              {new Date(item.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
            </Text>
            {item.patientNote && (
              <Text style={styles.consultNote} numberOfLines={2}>{item.patientNote}</Text>
            )}
            {item.providerResponse && (
              <View style={styles.responseBox}>
                <Feather name="message-circle" size={14} color={C.green} />
                <Text style={styles.responseText} numberOfLines={3}>{item.providerResponse}</Text>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  greeting: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 10, borderWidth: 1,
    borderColor: "#FFE0E0", alignItems: "center", justifyContent: "center",
  },
  content: { padding: 16, gap: 12 },
  requestCard: { borderRadius: 16, padding: 16, marginBottom: 4 },
  requestCardInner: { flexDirection: "row", alignItems: "center", gap: 14 },
  requestIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  requestTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  requestSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  statCard: {
    flex: 1, borderRadius: 12, padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: C.border,
  },
  statNum: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.text },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 4 },
  consultCard: { borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, gap: 8 },
  consultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  consultDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  consultNote: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.text },
  responseBox: {
    flexDirection: "row", gap: 8, backgroundColor: C.green + "10",
    borderRadius: 10, padding: 10, alignItems: "flex-start",
  },
  responseText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: C.text },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
});
