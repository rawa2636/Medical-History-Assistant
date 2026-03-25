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
  const initials = patient.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const age = patient.age ? `${patient.age}y` : "";
  const gender = patient.gender ? patient.gender.charAt(0).toUpperCase() : "";
  const subtitle = [age, gender].filter(Boolean).join(" · ");

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}
      onPress={() => {
        Haptics.selectionAsync();
        router.push({ pathname: "/patient/[id]", params: { id: patient.id } });
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: C.primary + "20" }]}>
        <Text style={[styles.avatarText, { color: C.primary }]}>{initials}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.patientName, { color: C.text }]}>{patient.name}</Text>
        {subtitle ? (
          <Text style={[styles.patientMeta, { color: C.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color={C.textTertiary} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data: patients, isLoading, error, refetch } = useQuery({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: C.primary + "15" }]}>
        <Feather name="users" size={32} color={C.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: C.text }]}>No patients yet</Text>
      <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>
        Add your first patient to get started
      </Text>
    </View>
  ), [C]);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: C.text }]}>Hakim</Text>
          <Text style={[styles.headerSubtitle, { color: C.textSecondary }]}>
            {user ? user.fullName : "Medical History Assistant"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {user?.role === "admin" && (
            <TouchableOpacity
              style={[styles.iconBtn, { borderColor: C.border }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/admin" as any);
              }}
              activeOpacity={0.7}
            >
              <Feather name="settings" size={18} color={C.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: C.border }]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/register" as any);
            }}
            activeOpacity={0.7}
          >
            <Feather name="user-plus" size={18} color={C.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: "#FFE0E0" }]}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await logout();
              router.replace("/login");
            }}
            activeOpacity={0.7}
          >
            <Feather name="log-out" size={18} color="#EF4444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: C.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/patient/new");
            }}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={32} color={C.error} />
          <Text style={[styles.errorText, { color: C.error }]}>Failed to load patients</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={[styles.retryText, { color: C.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PatientCard patient={item} />}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPad + 24 },
            !patients?.length && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListHeaderComponent={
            patients && patients.length > 0 ? (
              <Text style={[styles.sectionHeader, { color: C.textSecondary }]}>
                {patients.length} Patient{patients.length !== 1 ? "s" : ""}
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  cardContent: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  patientMeta: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  retryText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    maxWidth: 240,
  },
});
