import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { API_BASE } from "@/constants/api";

const C = Colors.light;

interface Stats {
  doctors: { total: number; pending: number; approved: number; rejected: number; volunteers: number };
  students: { total: number; pending: number; approved: number; rejected: number; autoVerified: number };
  universities: { total: number; active: number };
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: color + "12", borderColor: color + "25" }]}>
      <Feather name={icon as any} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: C.textSecondary }]}>{label}</Text>
    </View>
  );
}

function NavCard({
  icon,
  title,
  subtitle,
  badge,
  badgeColor,
  color,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  badge?: number;
  badgeColor?: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.navCard, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.navCardIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.navCardContent}>
        <Text style={[styles.navCardTitle, { color: C.text }]}>{title}</Text>
        <Text style={[styles.navCardSubtitle, { color: C.textSecondary }]}>{subtitle}</Text>
      </View>
      <View style={styles.navCardRight}>
        {badge !== undefined && badge > 0 && (
          <View style={[styles.navBadge, { backgroundColor: badgeColor || C.error }]}>
            <Text style={styles.navBadgeText}>{badge}</Text>
          </View>
        )}
        <Feather name="chevron-right" size={18} color={C.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

export default function AdminPanelScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: stats, isLoading, refetch } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/registration/admin/stats`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>لوحة المشرف</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.backBtn}>
          <Feather name="refresh-cw" size={18} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={C.primary} />
            <Text style={[styles.loadingText, { color: C.textSecondary }]}>تحميل الإحصائيات...</Text>
          </View>
        ) : stats ? (
          <>
            <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>إحصائيات عامة</Text>

            <View style={styles.statsGrid}>
              <StatCard label="أطباء" value={stats.doctors.total} color={C.primary} icon="user-check" />
              <StatCard label="طلاب" value={stats.students.total} color="#805AD5" icon="book-open" />
              <StatCard label="جامعات" value={stats.universities.total} color="#3182CE" icon="home" />
              <StatCard label="انتظار" value={stats.doctors.pending + stats.students.pending} color={C.error} icon="clock" />
            </View>

            <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>الأطباء</Text>
            <View style={styles.miniStats}>
              {[
                { label: "معتمد", value: stats.doctors.approved, color: C.success },
                { label: "انتظار", value: stats.doctors.pending, color: C.warning },
                { label: "مرفوض", value: stats.doctors.rejected, color: C.error },
                { label: "متطوع", value: stats.doctors.volunteers, color: C.primary },
              ].map((s) => (
                <View key={s.label} style={[styles.miniStat, { backgroundColor: s.color + "12" }]}>
                  <Text style={[styles.miniStatValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.miniStatLabel, { color: C.textSecondary }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>الطلاب</Text>
            <View style={styles.miniStats}>
              {[
                { label: "معتمد", value: stats.students.approved, color: C.success },
                { label: "انتظار", value: stats.students.pending, color: C.warning },
                { label: "تلقائي", value: stats.students.autoVerified, color: "#805AD5" },
                { label: "مرفوض", value: stats.students.rejected, color: C.error },
              ].map((s) => (
                <View key={s.label} style={[styles.miniStat, { backgroundColor: s.color + "12" }]}>
                  <Text style={[styles.miniStatValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.miniStatLabel, { color: C.textSecondary }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>إجراءات المشرف</Text>

        <NavCard
          icon="user-check"
          title="مراجعة الأطباء"
          subtitle="مراجعة طلبات التسجيل والتحقق من الرخص"
          badge={stats?.doctors.pending}
          badgeColor={C.error}
          color={C.primary}
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/admin/doctors");
          }}
        />

        <NavCard
          icon="book-open"
          title="مراجعة الطلاب"
          subtitle="مراجعة طلبات طلاب الطب وتوثيق البطاقات"
          badge={stats?.students.pending}
          badgeColor="#805AD5"
          color="#805AD5"
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/admin/students");
          }}
        />

        <NavCard
          icon="home"
          title="الجامعات المعتمدة"
          subtitle="إدارة الجامعات وبيانات الطلاب المرفوعة"
          badge={stats?.universities.total}
          badgeColor="#3182CE"
          color="#3182CE"
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/admin/universities");
          }}
        />
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 10 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 20, justifyContent: "center" },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 6 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    flex: 1,
    minWidth: "44%",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  statValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  miniStats: { flexDirection: "row", gap: 8 },
  miniStat: { flex: 1, alignItems: "center", padding: 10, borderRadius: 12, gap: 4 },
  miniStatValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  miniStatLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  navCardIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  navCardContent: { flex: 1 },
  navCardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  navCardSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  navCardRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  navBadge: { minWidth: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  navBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
});
