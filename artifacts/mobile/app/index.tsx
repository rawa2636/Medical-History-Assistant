import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import { endpoints } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

interface Patient {
  id: number;
  name: string;
  age: number | null;
  gender: string | null;
  createdAt: string;
}

async function fetchPatients(): Promise<Patient[]> {
  const res = await fetch(endpoints.patients);
  if (!res.ok) throw new Error("Failed to fetch patients");
  return res.json();
}

function PatientCard({ patient }: { patient: Patient }) {
  const C = Colors.light;
  const { isRTL, t } = useLanguage();
  const initials = patient.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const age = patient.age ? `${patient.age}` : "";
  const gender = patient.gender ? patient.gender.charAt(0).toUpperCase() : "";
  const subtitle = [age, gender].filter(Boolean).join(" · ");

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.backgroundSecondary, borderColor: C.border, flexDirection: isRTL ? "row-reverse" : "row" }]}
      onPress={() => { Haptics.selectionAsync(); router.push({ pathname: "/patient/[id]", params: { id: patient.id } }); }}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: C.primary + "20" }]}>
        <Text style={[styles.avatarText, { color: C.primary }]}>{initials}</Text>
      </View>
      <View style={[styles.cardContent, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
        <Text style={[styles.patientName, { color: C.text }]}>{patient.name}</Text>
        {subtitle ? <Text style={[styles.patientMeta, { color: C.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={18} color={C.textTertiary} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { data: patients, isLoading, error, refetch } = useQuery({ queryKey: ["patients"], queryFn: fetchPatients });
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: C.primary + "15" }]}>
        <Feather name="users" size={32} color={C.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: C.text }]}>{t("noPatients")}</Text>
      <Text style={[styles.emptySubtitle, { color: C.textSecondary, textAlign: "center" }]}>{t("noPatientsSubtitle")}</Text>
    </View>
  ), [C, t]);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border, flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
          <Text style={[styles.headerTitle, { color: C.text }]}>{t("appName")}</Text>
          <Text style={[styles.headerSubtitle, { color: C.textSecondary }]}>{user ? user.fullName : t("medicalAssistant")}</Text>
        </View>
        <View style={[styles.headerActions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          {user?.role === "admin" && (
            <TouchableOpacity style={[styles.iconBtn, { borderColor: C.border }]} onPress={() => { Haptics.selectionAsync(); router.push("/admin" as any); }} activeOpacity={0.7}>
              <Feather name="settings" size={18} color={C.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.iconBtn, { borderColor: C.border }]} onPress={() => { Haptics.selectionAsync(); setLanguage(language === "ar" ? "en" : "ar"); }} activeOpacity={0.7}>
            <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.textSecondary }}>{language === "ar" ? "EN" : "ع"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { borderColor: C.border }]} onPress={() => { Haptics.selectionAsync(); logout(); }} activeOpacity={0.7}>
            <Feather name="log-out" size={18} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: C.primary }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/patient/new"); }} activeOpacity={0.85}>
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>{t("addPatient")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: C.error }]}>{t("errorLoadingPatients")}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={[styles.retryText, { color: C.primary }]}>{t("retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => <PatientCard patient={item} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 20 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  headerSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  headerActions: { alignItems: "center", gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  listContent: { padding: 16 },
  card: { alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  cardContent: { flex: 1 },
  patientName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  patientMeta: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  retryText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptyContainer: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 40 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", maxWidth: 240 },
});
