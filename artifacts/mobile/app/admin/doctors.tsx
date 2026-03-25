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

interface Doctor {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  specialization: string;
  licenseNumber: string;
  city: string | null;
  workplaceType: string;
  workplace: string | null;
  yearsOfExperience: number | null;
  bio: string | null;
  verificationStatus: string;
  verificationNote: string | null;
  isVolunteer: boolean;
  acceptsPaidCases: boolean;
  createdAt: string;
}

const STATUS_TABS = ["all", "pending", "approved", "rejected"];
const STATUS_LABELS: Record<string, string> = {
  all: "الكل",
  pending: "انتظار",
  approved: "معتمد",
  rejected: "مرفوض",
};
const STATUS_COLORS: Record<string, string> = {
  pending: C.warning,
  approved: C.success,
  rejected: C.error,
};
const SPEC_LABELS: Record<string, string> = {
  general: "طب عام", internal_medicine: "باطنية", pediatrics: "أطفال",
  obstetrics: "نساء وتوليد", surgery: "جراحة", cardiology: "قلب",
  orthopedics: "عظام", psychiatry: "نفسية", dermatology: "جلدية",
  ophthalmology: "عيون", dentistry: "أسنان", other: "أخرى",
};

function DoctorCard({ doctor, onReview }: { doctor: Doctor; onReview: (d: Doctor) => void }) {
  const statusColor = STATUS_COLORS[doctor.verificationStatus] || C.textTertiary;
  const date = new Date(doctor.createdAt).toLocaleDateString("ar-SA", { day: "numeric", month: "short", year: "numeric" });

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}
      onPress={() => onReview(doctor)}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: C.primary + "20" }]}>
          <Text style={[styles.avatarText, { color: C.primary }]}>
            {doctor.fullName.charAt(0)}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: C.text }]}>{doctor.fullName}</Text>
          <Text style={[styles.cardSpec, { color: C.textSecondary }]}>
            {SPEC_LABELS[doctor.specialization] || doctor.specialization}
            {doctor.city ? ` · ${doctor.city}` : ""}
          </Text>
          <Text style={[styles.cardDate, { color: C.textTertiary }]}>{date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[doctor.verificationStatus] || doctor.verificationStatus}
          </Text>
        </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: C.borderLight }]}>
        <View style={styles.footerItem}>
          <Feather name="hash" size={12} color={C.textTertiary} />
          <Text style={[styles.footerText, { color: C.textSecondary }]}>{doctor.licenseNumber}</Text>
        </View>
        {doctor.isVolunteer && (
          <View style={[styles.chip, { backgroundColor: C.primary + "15" }]}>
            <Text style={[styles.chipText, { color: C.primary }]}>متطوع</Text>
          </View>
        )}
        {doctor.acceptsPaidCases && (
          <View style={[styles.chip, { backgroundColor: C.success + "15" }]}>
            <Text style={[styles.chipText, { color: C.success }]}>مدفوع</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function ReviewModal({
  doctor,
  visible,
  onClose,
  onSubmit,
  loading,
}: {
  doctor: Doctor | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (action: "approved" | "rejected", note: string) => void;
  loading: boolean;
}) {
  const [note, setNote] = useState("");

  if (!doctor) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: C.backgroundSecondary }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: C.text }]}>{doctor.fullName}</Text>
          <Text style={[styles.modalSubtitle, { color: C.textSecondary }]}>
            {SPEC_LABELS[doctor.specialization]} · {doctor.licenseNumber}
          </Text>

          {doctor.email && (
            <View style={[styles.infoRow, { backgroundColor: C.backgroundTertiary }]}>
              <Feather name="mail" size={14} color={C.textSecondary} />
              <Text style={[styles.infoRowText, { color: C.text }]}>{doctor.email}</Text>
            </View>
          )}
          {doctor.workplace && (
            <View style={[styles.infoRow, { backgroundColor: C.backgroundTertiary }]}>
              <Feather name="briefcase" size={14} color={C.textSecondary} />
              <Text style={[styles.infoRowText, { color: C.text }]}>{doctor.workplace}</Text>
            </View>
          )}
          {doctor.yearsOfExperience && (
            <View style={[styles.infoRow, { backgroundColor: C.backgroundTertiary }]}>
              <Feather name="clock" size={14} color={C.textSecondary} />
              <Text style={[styles.infoRowText, { color: C.text }]}>{doctor.yearsOfExperience} سنوات خبرة</Text>
            </View>
          )}
          {doctor.bio && (
            <Text style={[styles.bio, { color: C.textSecondary }]}>{doctor.bio}</Text>
          )}

          <TextInput
            style={[styles.noteInput, { borderColor: C.border, color: C.text, backgroundColor: C.backgroundTertiary }]}
            value={note}
            onChangeText={setNote}
            placeholder="ملاحظة اختيارية للطبيب..."
            placeholderTextColor={C.textTertiary}
            multiline
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.rejectBtn, { borderColor: C.error, opacity: loading ? 0.6 : 1 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onSubmit("rejected", note); }}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Feather name="x" size={18} color={C.error} />
              <Text style={[styles.rejectBtnText, { color: C.error }]}>رفض</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.approveBtn, { backgroundColor: C.success, opacity: loading ? 0.6 : 1 }]}
              onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onSubmit("approved", note); }}
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

export default function AdminDoctorsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState("pending");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const { data: doctors = [], isLoading } = useQuery<Doctor[]>({
    queryKey: ["admin-doctors"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/registration/doctors`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, action, note }: { id: number; action: string; note: string }) => {
      const res = await fetch(`${API_BASE}/registration/doctors/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setSelectedDoctor(null);
    },
    onError: () => Alert.alert("خطأ", "فشل تحديث الحالة"),
  });

  const filtered = activeTab === "all" ? doctors : doctors.filter((d) => d.verificationStatus === activeTab);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>مراجعة الأطباء</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.tabs, { backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        {STATUS_TABS.map((tab) => {
          const count = tab === "all" ? doctors.length : doctors.filter((d) => d.verificationStatus === tab).length;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && [styles.tabActive, { borderBottomColor: C.primary }]]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? C.primary : C.textSecondary }]}>
                {STATUS_LABELS[tab]}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: activeTab === tab ? C.primary : C.backgroundTertiary }]}>
                  <Text style={[styles.tabBadgeText, { color: activeTab === tab ? "#fff" : C.textSecondary }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <DoctorCard doctor={item} onReview={setSelectedDoctor} />
          )}
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
        doctor={selectedDoctor}
        visible={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        onSubmit={(action, note) => verifyMutation.mutate({ id: selectedDoctor!.id, action, note })}
        loading={verifyMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
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
  cardSpec: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  footerItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  chipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalHandle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: -6 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10 },
  infoRowText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  bio: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  noteInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 80, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 10 },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  rejectBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  approveBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12 },
  approveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  cancelBtn: { alignItems: "center", paddingVertical: 10 },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
