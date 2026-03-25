import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, TextInput, Alert,
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
  green: "#10B981", yellow: "#F59E0B", red: "#EF4444",
  blue: "#3182CE", purple: "#805AD5",
};

type ConsultType = "free_student" | "free_doctor" | "paid";

const CONSULT_OPTIONS: {
  id: ConsultType;
  title: string;
  description: string;
  icon: string;
  color: string;
  badge?: string;
}[] = [
  {
    id: "free_student",
    title: "مجاني — طلاب الطب",
    description: "يُراجع تقريرك طالب طب معتمد من جامعة موثّقة",
    icon: "book-open",
    color: C.purple,
    badge: "مجاني",
  },
  {
    id: "free_doctor",
    title: "مجاني — طبيب متطوع",
    description: "يُراجع تقريرك طبيب متطوع بدون أي رسوم",
    icon: "user-check",
    color: C.green,
    badge: "مجاني",
  },
  {
    id: "paid",
    title: "استشارة مدفوعة",
    description: "احصل على مراجعة مفصّلة من طبيب متخصص",
    icon: "star",
    color: C.primary,
    badge: "مدفوع",
  },
];

export default function ConsultRequestScreen() {
  const { user, token } = useAuth();
  const [selectedType, setSelectedType] = useState<ConsultType | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: cases, isLoading } = useQuery({
    queryKey: ["patient-cases-consult", user?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/patients/${user?.id}/cases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data: any[] = await res.json();
      // Only completed cases with reports
      return data.filter((c: any) => c.status === "completed");
    },
    enabled: !!user?.id && !!token,
  });

  const handleSubmit = async () => {
    if (!selectedType) return Alert.alert("يرجى اختيار نوع الاستشارة");
    if (!selectedCaseId) return Alert.alert("يرجى اختيار التقرير");

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(`${API_BASE}/consultations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          caseId: selectedCaseId,
          consultationType: selectedType,
          patientNote: note.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        Alert.alert("خطأ", data.error || "فشل إرسال الطلب");
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("تم الإرسال!", "سيتم مراجعة طلبك قريباً", [
        { text: "حسناً", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("خطأ", "فشل الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلب استشارة</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Step 1: Consultation type */}
        <Text style={styles.stepTitle}>١. نوع الاستشارة</Text>
        <View style={styles.optionsGap}>
          {CONSULT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.optionCard,
                selectedType === opt.id && { borderColor: opt.color, borderWidth: 2 },
                selectedType !== opt.id && { borderColor: C.border, borderWidth: 1 },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedType(opt.id);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: opt.color + "18" }]}>
                <Feather name={opt.icon as any} size={22} color={opt.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.optionTitleRow}>
                  <Text style={styles.optionTitle}>{opt.title}</Text>
                  <View style={[styles.badge, { backgroundColor: opt.color + "20" }]}>
                    <Text style={[styles.badgeText, { color: opt.color }]}>{opt.badge}</Text>
                  </View>
                </View>
                <Text style={styles.optionDesc}>{opt.description}</Text>
              </View>
              {selectedType === opt.id && (
                <Feather name="check-circle" size={20} color={opt.color} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Step 2: Pick report */}
        <Text style={styles.stepTitle}>٢. اختر التقرير</Text>
        {isLoading ? (
          <ActivityIndicator color={C.primary} />
        ) : (cases || []).length === 0 ? (
          <View style={[styles.emptyReports, { backgroundColor: C.card }]}>
            <Feather name="file-text" size={28} color={C.border} />
            <Text style={styles.emptyReportsText}>لا توجد تقارير مكتملة</Text>
            <Text style={styles.emptyReportsSub}>يجب إجراء مقابلة طبية أولاً لإنشاء تقرير</Text>
          </View>
        ) : (
          <View style={styles.optionsGap}>
            {(cases || []).map((c: any) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.caseCard,
                  selectedCaseId === c.id && { borderColor: C.primary, borderWidth: 2 },
                  selectedCaseId !== c.id && { borderColor: C.border, borderWidth: 1 },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCaseId(c.id);
                }}
                activeOpacity={0.8}
              >
                <Feather name="file-text" size={18} color={C.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.caseTitle}>تقرير #{c.id}</Text>
                  <Text style={styles.caseDate}>
                    {new Date(c.createdAt).toLocaleDateString("ar-SA", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </Text>
                </View>
                {selectedCaseId === c.id && (
                  <Feather name="check-circle" size={18} color={C.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 3: Optional note */}
        <Text style={styles.stepTitle}>٣. ملاحظة إضافية (اختياري)</Text>
        <View style={[styles.noteBox, { borderColor: C.border }]}>
          <TextInput
            style={styles.noteInput}
            placeholder="اكتب أي معلومة إضافية تريد إيصالها للطبيب..."
            placeholderTextColor={C.textSecondary + "99"}
            multiline
            numberOfLines={4}
            value={note}
            onChangeText={setNote}
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: selectedType && selectedCaseId ? C.primary : C.border },
          ]}
          onPress={handleSubmit}
          disabled={submitting || !selectedType || !selectedCaseId}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitText}>إرسال الطلب</Text>
              <Feather name="send" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.text },
  content: { padding: 20, gap: 14 },
  stepTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text },
  optionsGap: { gap: 10 },
  optionCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.card, borderRadius: 14, padding: 14,
  },
  optionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  optionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  optionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  optionDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 17 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  emptyReports: {
    alignItems: "center", gap: 8, padding: 30, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
  },
  emptyReportsText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  emptyReportsSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
  caseCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 12, padding: 14,
  },
  caseTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  caseDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  noteBox: {
    backgroundColor: C.card, borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 100,
  },
  noteInput: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.text, minHeight: 80 },
  submitBtn: {
    height: 54, borderRadius: 14, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 10, marginTop: 6,
  },
  submitText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
