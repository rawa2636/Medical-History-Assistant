import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { API_BASE } from "@/constants/api";

const C = Colors.light;

interface University {
  id: number;
  name: string;
  country: string;
  accessCode: string;
  isActive: boolean;
  createdAt: string;
}

function UniversityCard({ uni }: { uni: University }) {
  const [showCode, setShowCode] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.icon, { backgroundColor: "#3182CE18" }]}>
          <Feather name="home" size={20} color="#3182CE" />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardName, { color: C.text }]}>{uni.name}</Text>
          <Text style={[styles.cardCountry, { color: C.textSecondary }]}>{uni.country}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: uni.isActive ? C.success : C.error }]} />
      </View>
      <View style={[styles.codeRow, { borderTopColor: C.borderLight }]}>
        <Text style={[styles.codeLabel, { color: C.textTertiary }]}>كود الوصول:</Text>
        <TouchableOpacity onPress={() => setShowCode((p) => !p)} activeOpacity={0.7}>
          <Text style={[styles.codeValue, { color: showCode ? C.text : C.primary }]}>
            {showCode ? uni.accessCode : "اضغط للعرض"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminUniversitiesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCountry, setNewCountry] = useState("SA");
  const [newCode, setNewCode] = useState("");

  const { data: universities = [], isLoading } = useQuery<University[]>({
    queryKey: ["universities-admin"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/registration/universities`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!newName || !newCode) throw new Error("Missing fields");
      const res = await fetch(`${API_BASE}/registration/universities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, country: newCountry, accessCode: newCode }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["universities-admin"] });
      queryClient.invalidateQueries({ queryKey: ["universities"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setShowAdd(false);
      setNewName("");
      setNewCode("");
    },
    onError: () => Alert.alert("خطأ", "فشل إضافة الجامعة — ربما الكود مستخدم مسبقاً"),
  });

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>الجامعات المعتمدة</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: "#3182CE" }]}
          onPress={() => setShowAdd(true)}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.infoBox, { backgroundColor: "#3182CE10", borderColor: "#3182CE25", margin: 16, marginBottom: 8 }]}>
        <Feather name="info" size={14} color="#3182CE" />
        <Text style={[styles.infoText, { color: "#3182CE" }]}>
          كل جامعة تحصل على كود وصول سري ترفع من خلاله بيانات طلابها. طلاب يتطابق رقم بطاقتهم يُوثَّقون تلقائياً.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3182CE" />
        </View>
      ) : (
        <FlatList
          data={universities}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <UniversityCard uni={item} />}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: bottomPad + 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="home" size={36} color={C.textTertiary} />
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>لا توجد جامعات مضافة</Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: "#3182CE" }]}
                onPress={() => setShowAdd(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyBtnText}>إضافة أول جامعة</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: C.backgroundSecondary }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: C.text }]}>إضافة جامعة جديدة</Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: C.textSecondary }]}>اسم الجامعة *</Text>
              <TextInput
                style={[styles.input, { borderColor: C.border, color: C.text, backgroundColor: C.backgroundTertiary }]}
                value={newName}
                onChangeText={setNewName}
                placeholder="مثال: جامعة الملك سعود"
                placeholderTextColor={C.textTertiary}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: C.textSecondary }]}>رمز الدولة</Text>
              <TextInput
                style={[styles.input, { borderColor: C.border, color: C.text, backgroundColor: C.backgroundTertiary }]}
                value={newCountry}
                onChangeText={setNewCountry}
                placeholder="SA"
                placeholderTextColor={C.textTertiary}
                maxLength={3}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: C.textSecondary }]}>كود الوصول السري *</Text>
              <TextInput
                style={[styles.input, { borderColor: C.border, color: C.text, backgroundColor: C.backgroundTertiary }]}
                value={newCode}
                onChangeText={setNewCode}
                placeholder="كود سري تشاركه مع الجامعة"
                placeholderTextColor={C.textTertiary}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: "#3182CE", opacity: addMutation.isPending ? 0.7 : 1 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                addMutation.mutate();
              }}
              disabled={addMutation.isPending || !newName || !newCode}
              activeOpacity={0.85}
            >
              {addMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>إضافة الجامعة</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowAdd(false)} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={[styles.cancelText, { color: C.textSecondary }]}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  addBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoBox: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardContent: { flex: 1 },
  cardName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardCountry: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  codeLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  codeValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  emptyBtn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  modalHandle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular" },
  submitBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  cancelBtn: { alignItems: "center", paddingVertical: 10 },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
