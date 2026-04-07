import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const C = Colors.light;

export default function PendingVerificationScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { user, logout } = useAuth();

  const isStudent = user?.role === "student";
  const accentColor = isStudent ? "#805AD5" : C.primary;

  return (
    <View style={[styles.container, { backgroundColor: C.background, paddingTop: topPad, paddingBottom: bottomPad + 24 }]}>
      <View style={styles.inner}>
        <View style={[styles.iconWrap, { backgroundColor: C.warning + "18" }]}>
          <Feather name="clock" size={52} color={C.warning} />
        </View>

        <Text style={[styles.title, { color: C.text }]}>حسابك قيد المراجعة</Text>

        <Text style={[styles.subtitle, { color: C.textSecondary }]}>
          {isStudent
            ? "طلب تسجيلك كطالب طب قيد المراجعة من الإدارة. سيتم إشعارك فور الموافقة."
            : "طلب تسجيلك كطبيب قيد المراجعة من الإدارة. سيتم إشعارك فور التحقق من رخصة المزاولة."}
        </Text>

        <View style={[styles.card, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <View style={styles.cardRow}>
            <View style={[styles.cardIcon, { backgroundColor: accentColor + "15" }]}>
              <Feather name="user" size={18} color={accentColor} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardLabel, { color: C.textSecondary }]}>الاسم</Text>
              <Text style={[styles.cardValue, { color: C.text }]}>{user?.fullName || "—"}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: C.borderLight }]} />

          <View style={styles.cardRow}>
            <View style={[styles.cardIcon, { backgroundColor: accentColor + "15" }]}>
              <Feather name="mail" size={18} color={accentColor} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardLabel, { color: C.textSecondary }]}>البريد الإلكتروني</Text>
              <Text style={[styles.cardValue, { color: C.text }]}>{user?.email || "—"}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: C.borderLight }]} />

          <View style={styles.cardRow}>
            <View style={[styles.cardIcon, { backgroundColor: C.warning + "15" }]}>
              <Feather name="shield" size={18} color={C.warning} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardLabel, { color: C.textSecondary }]}>الحالة</Text>
              <View style={[styles.statusBadge, { backgroundColor: C.warning + "18" }]}>
                <Text style={[styles.statusText, { color: C.warning }]}>قيد المراجعة</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.steps, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.stepsTitle, { color: C.text }]}>ما الذي يحدث الآن؟</Text>
          {[
            { icon: "check-circle", text: "تم استلام طلبك بنجاح", done: true },
            { icon: "search", text: "الإدارة تراجع بياناتك ووثائقك", done: false },
            { icon: "unlock", text: "تفعيل حسابك والإشعار بالموافقة", done: false },
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepIcon, { backgroundColor: step.done ? C.success + "18" : C.backgroundTertiary }]}>
                <Feather name={step.icon as any} size={14} color={step.done ? C.success : C.textTertiary} />
              </View>
              <Text style={[styles.stepText, { color: step.done ? C.text : C.textSecondary }]}>{step.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.refreshBtn, { borderColor: accentColor, backgroundColor: accentColor + "10" }]}
          onPress={() => router.replace("/login")}
          activeOpacity={0.7}
        >
          <Feather name="refresh-cw" size={16} color={accentColor} />
          <Text style={[styles.refreshText, { color: accentColor }]}>تحقق من الحالة</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => { await logout(); router.replace("/login"); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.logoutText, { color: C.textSecondary }]}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  iconWrap: { width: 100, height: 100, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21, maxWidth: 300 },
  card: { width: "100%", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  cardIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  cardValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 2 },
  statusText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1, marginHorizontal: 14 },
  steps: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  stepsTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 4 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 13, paddingHorizontal: 28, borderRadius: 14, borderWidth: 1.5 },
  refreshText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  logoutBtn: { paddingVertical: 8 },
  logoutText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
