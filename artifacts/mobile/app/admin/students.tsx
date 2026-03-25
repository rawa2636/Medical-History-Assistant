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
  Modal,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { API_BASE } from "@/constants/api";

const C = Colors.light;

interface Student {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  universityId: number | null;
  universityCardNumber: string;
  studyYear: number;
  verificationStatus: string;
  verificationNote: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

const STATUS_TABS = ["all", "pending", "approved", "rejected"];
const STATUS_LABELS: Record<string, string> = { all: "الكل", pending: "انتظار", approved: "معتمد", rejected: "مرفوض" };
const STATUS_COLORS: Record<string, string> = { pending: C.warning, approved: C.success, rejected: C.error };

function StudentCard({ student, onReview }: { student: Student; onReview: (s: Student) => void }) {
  const statusColor = STATUS_COLORS[student.verificationStatus] || C.textTertiary;
  const date = new Date(student.createdAt).toLocaleDateString("ar-SA", { day: "numeric", month: "short", year: "numeric" });
  const isAutoVerified = !!student.verifiedAt && student.verificationStatus === "approved";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}
      onPress={() => onReview(student)}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: "#805AD520" }]}>
          <Text style={[styles.avatarText, { color: "#805AD5" }]}>{student.fullName.charAt(0)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: C.text }]}>{student.fullName}</Text>
          <Text style={[styles.cardMeta, { color: C.textSecondary }]}>
            السنة {student.studyYear} · {student.universityCardNumber}
          </Text>
          <Text style={[styles.cardDate, { color: C.textTertiary }]}>{date}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[student.verificationStatus]}
            </Text>
          </View>
          {isAutoVerified && (
            <View style={[styles.autoBadge, { backgroundColor: "#805AD515" }]}>
              <Feather name="zap" size={10} color="#805AD5" />
              <Text style={[styles.autoText, { color: "#805AD5" }]}>تلقائي</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ReviewModal({
  student,
  visible,
  onClose,
  onSubmit,
  loading,
}: {
  student: Student | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (action: "approved" | "rejected", note: string) => void;
  loading: boolean;
}) {
  const [note, setNote] = useState("");

  if (!student) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: C.backgroundSecondary }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: C.text }]}>{student.fullName}</Text>
          <Text style={[styles.modalSubtitle, { color: C.textSecondary }]}>
            السنة {student.studyYear} · بطاقة: {student.universityCardNumber}
          </Text>

          <View style={[styles.infoRow, { backgroundColor: C.backgroundTertiary }]}>
            <Feather name="mail" size={14} color={C.textSecondary} />
            <Text style={[styles.infoRowText, { color: C.text }]}>{student.email}</Text>
          </View>

          {student.universityId && (
            <View style={[styles.infoRow, { backgroundColor: C.backgroundTertiary }]}>
              <Feather name="home" size={14} color={C.textSecondary} />
              <Text style={[styles.infoRowText, { color: C.text }]}>جامعة مرتبطة (ID: {student.universityId})</Text>
            </View>
          )}

          <View style={[styles.verifyNote, { backgroundColor: C.warning + "12", borderColor: C.warning + "30" }]}>
            <Feather name="alert-circle" size={14} color={C.warning} />
            <Text style={[styles.verifyNoteText, { color: C.warning }]}>
              تحقق من البطاقة الجامعية قبل الاعتماد
            </Text>
          </View>

          <TextInput
            style={[styles.noteInput, { borderColor: C.border, color: C.text, backgroundColor: C.backgroundTertiary }]}
            value={note}
            onChangeText={setNote}
            placeholder="ملاحظة للطالب (اختياري)..."
            placeholderTextColor={C.textTertiary}
            multiline
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.rejectBtn, { borderColor: C.error, opacity: loading ? 0.6 : 1 }]}
              onPress={() => onSubmit("rejected", note)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Feather name="x" size={18} color={C.error} />
              <Text style={[styles.rejectBtnText, { color: C.error }]}>رفض</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.approveBtn, { backgroundColor: "#805AD5", opacity: loading ? 0.6 : 1 }]}
              onPress={() => onSubmit("approved", note)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Feather name="check" size={18} color="#fff" />
                  <Text style={styles.approveBtnText}>اعتماد</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
            <Text style={[styles.cancelText, { color: C.textSecondary }]}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function AdminStudentsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState("pending");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/registration/students`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, action, note }: { id: number; action: string; note: string }) => {
      const res = await fetch(`${API_BASE}/registration/students/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setSelectedStudent(null);
    },
    onError: () => Alert.alert("خطأ", "فشل تحديث الحالة"),
  });

  const filtered = activeTab === "all" ? students : students.filter((s) => s.verificationStatus === activeTab);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>مراجعة الطلاب</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.tabs, { backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        {STATUS_TABS.map((tab) => {
          const count = tab === "all" ? students.length : students.filter((s) => s.verificationStatus === tab).length;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && [styles.tabActive, { borderBottomColor: "#805AD5" }]]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? "#805AD5" : C.textSecondary }]}>
                {STATUS_LABELS[tab]}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: activeTab === tab ? "#805AD5" : C.backgroundTertiary }]}>
                  <Text style={[styles.tabBadgeText, { color: activeTab === tab ? "#fff" : C.textSecondary }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#805AD5" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <StudentCard student={item} onReview={setSelectedStudent} />}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: bottomPad + 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="inbox" size={36} color={C.textTertiary} />
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>لا توجد طلبات</Text>
            </View>
          }
        />
      )}

      <ReviewModal
        student={selectedStudent}
        visible={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onSubmit={(action, note) => verifyMutation.mutate({ id: selectedStudent!.id, action, note })}
        loading={verifyMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  tabs: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: {},
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  tabBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardMeta: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardRight: { alignItems: "flex-end", gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  autoBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  autoText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalHandle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: -6 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10 },
  infoRowText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  verifyNote: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  verifyNoteText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  noteInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 80, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 10 },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  rejectBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  approveBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12 },
  approveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  cancelBtn: { alignItems: "center", paddingVertical: 10 },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
