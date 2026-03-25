import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const C = Colors.light;

function OptionCard({
  icon,
  title,
  subtitle,
  color,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.cardIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon as any} size={32} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: C.text }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: C.textSecondary }]}>{subtitle}</Text>
      </View>
      <View style={[styles.cardArrow, { backgroundColor: color + "15" }]}>
        <Feather name="arrow-right" size={18} color={color} />
      </View>
    </TouchableOpacity>
  );
}

export default function RegisterChoiceScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>التسجيل في حكيم</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.content, { paddingBottom: bottomPad + 24 }]}>
        <View style={[styles.badge, { backgroundColor: C.primary + "15" }]}>
          <Feather name="shield" size={14} color={C.primary} />
          <Text style={[styles.badgeText, { color: C.primary }]}>
            جميع الحسابات تخضع للتحقق قبل التفعيل
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>أنا...</Text>

        <OptionCard
          icon="user-check"
          title="طبيب مرخص"
          subtitle="طبيب عام أو متخصص يملك رخصة مزاولة المهنة"
          color={C.primary}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/register/doctor");
          }}
        />

        <OptionCard
          icon="book-open"
          title="طالب طب"
          subtitle="طالب في كلية الطب مسجّل في إحدى الجامعات المعتمدة"
          color="#805AD5"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/register/student");
          }}
        />

        <View style={[styles.divider, { backgroundColor: C.border }]} />

        <TouchableOpacity
          style={[styles.adminLink, { borderColor: C.border }]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/admin");
          }}
          activeOpacity={0.7}
        >
          <Feather name="settings" size={16} color={C.textSecondary} />
          <Text style={[styles.adminLinkText, { color: C.textSecondary }]}>لوحة المشرف</Text>
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
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  content: { flex: 1, padding: 20, gap: 14 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  badgeText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  sectionLabel: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: -4 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  cardSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 18 },
  cardArrow: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, marginVertical: 4 },
  adminLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  adminLinkText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
