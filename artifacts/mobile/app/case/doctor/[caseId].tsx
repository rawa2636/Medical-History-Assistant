import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  FlatList,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { endpoints } from "@/constants/api";

const C = Colors.light;

interface DoctorNote {
  id: number;
  note: string;
  createdAt: string;
  doctorName: string | null;
}

interface DoctorReview {
  case: {
    id: number;
    status: string;
  };
  report: {
    chiefComplaint: string | null;
    hpi: string | null;
    ros: string | null;
    pmh: string | null;
    drugHistory: string | null;
    allergyHistory: string | null;
    familyHistory: string | null;
    socialHistory: string | null;
    summary: string | null;
    patientInfo: { name: string; age: number | null; gender: string | null } | null;
  } | null;
  doctorNotes: DoctorNote[];
}

function NoteCard({ note }: { note: DoctorNote }) {
  const date = new Date(note.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={[styles.noteCard, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
      <View style={styles.noteHeader}>
        <View style={[styles.noteAvatar, { backgroundColor: C.primary + "20" }]}>
          <Feather name="user-check" size={14} color={C.primary} />
        </View>
        <View style={styles.noteHeaderContent}>
          <Text style={[styles.noteDoctorName, { color: C.text }]}>
            {note.doctorName || "Attending Physician"}
          </Text>
          <Text style={[styles.noteDate, { color: C.textTertiary }]}>{date}</Text>
        </View>
      </View>
      <Text style={[styles.noteText, { color: C.text }]}>{note.note}</Text>
    </View>
  );
}

function ReportSummaryRow({ label, content }: { label: string; content: string | null }) {
  if (!content) return null;
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: C.primary }]}>{label}</Text>
      <Text style={[styles.summaryContent, { color: C.text }]}>{content}</Text>
    </View>
  );
}

export default function DoctorReviewScreen() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [note, setNote] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<DoctorReview>({
    queryKey: ["doctor-review", caseId],
    queryFn: async () => {
      const res = await fetch(endpoints.doctorReview(parseInt(caseId)));
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      if (!note.trim()) throw new Error("Empty note");
      const res = await fetch(endpoints.doctorReview(parseInt(caseId)), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim(), doctorName: doctorName.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNote("");
      setShowNoteInput(false);
      queryClient.invalidateQueries({ queryKey: ["doctor-review", caseId] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to add note. Please try again.");
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <Feather name="alert-circle" size={32} color={C.error} />
        <Text style={[styles.errorText, { color: C.error }]}>Failed to load</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={[styles.retryText, { color: C.primary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { report, doctorNotes: notes } = data;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Doctor Review</Text>
          <Text style={[styles.headerSub, { color: C.textSecondary }]}>
            {report?.patientInfo?.name || "Patient"}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.reportPreview, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <View style={styles.reportPreviewHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Medical History Summary</Text>
            {report && (
              <TouchableOpacity
                style={[styles.viewFullBtn, { borderColor: C.primary + "40" }]}
                onPress={() => router.push({ pathname: "/case/report/[caseId]", params: { caseId } })}
                activeOpacity={0.7}
              >
                <Text style={[styles.viewFullText, { color: C.primary }]}>Full Report</Text>
                <Feather name="external-link" size={12} color={C.primary} />
              </TouchableOpacity>
            )}
          </View>

          {!report ? (
            <View style={styles.noReport}>
              <Feather name="file-text" size={24} color={C.textTertiary} />
              <Text style={[styles.noReportText, { color: C.textSecondary }]}>
                No report generated yet. Complete the interview first.
              </Text>
            </View>
          ) : (
            <View style={styles.reportRows}>
              <ReportSummaryRow label="Chief Complaint" content={report.chiefComplaint} />
              <ReportSummaryRow label="HPI" content={report.hpi} />
              <ReportSummaryRow label="Review of Systems" content={report.ros} />
              <ReportSummaryRow label="Past Medical History" content={report.pmh} />
              <ReportSummaryRow label="Drug History" content={report.drugHistory} />
              <ReportSummaryRow label="Allergies" content={report.allergyHistory} />
              <ReportSummaryRow label="Family History" content={report.familyHistory} />
              <ReportSummaryRow label="Social History" content={report.socialHistory} />
            </View>
          )}
        </View>

        <View style={styles.notesSection}>
          <View style={styles.notesSectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Physician Notes</Text>
            <Text style={[styles.notesCount, { color: C.textSecondary }]}>{notes.length}</Text>
          </View>

          {notes.length === 0 && !showNoteInput && (
            <View style={[styles.emptyNotes, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
              <Feather name="edit-3" size={24} color={C.textTertiary} />
              <Text style={[styles.emptyNotesText, { color: C.textSecondary }]}>
                No physician notes yet. Add your clinical observations.
              </Text>
            </View>
          )}

          {notes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}

          {showNoteInput && (
            <View style={[styles.noteInputCard, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
              <TextInput
                style={[styles.doctorNameInput, { borderColor: C.border, color: C.text }]}
                value={doctorName}
                onChangeText={setDoctorName}
                placeholder="Your name (optional)"
                placeholderTextColor={C.textTertiary}
              />
              <TextInput
                style={[styles.noteInput, { borderColor: C.border, color: C.text }]}
                value={note}
                onChangeText={setNote}
                placeholder="Type your clinical note here..."
                placeholderTextColor={C.textTertiary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                autoFocus
              />
              <View style={styles.noteInputActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: C.border }]}
                  onPress={() => {
                    setShowNoteInput(false);
                    setNote("");
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelBtnText, { color: C.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitNoteBtn, { backgroundColor: C.primary, opacity: addNoteMutation.isPending ? 0.7 : 1 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    addNoteMutation.mutate();
                  }}
                  disabled={addNoteMutation.isPending || !note.trim()}
                  activeOpacity={0.85}
                >
                  {addNoteMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitNoteBtnText}>Add Note</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {!showNoteInput && (
        <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: C.backgroundSecondary, borderTopColor: C.border }]}>
          <TouchableOpacity
            style={[styles.addNoteBtn, { backgroundColor: C.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowNoteInput(true);
            }}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addNoteBtnText}>Add Clinical Note</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  reportPreview: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  reportPreviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  viewFullBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  viewFullText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  noReport: { alignItems: "center", gap: 10, paddingVertical: 20 },
  noReportText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  reportRows: { gap: 12 },
  summaryRow: { gap: 4 },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.6 },
  summaryContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  notesSection: { gap: 10 },
  notesSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 2 },
  notesCount: { fontSize: 15, fontFamily: "Inter_500Medium" },
  emptyNotes: { borderRadius: 14, borderWidth: 1, padding: 24, alignItems: "center", gap: 10 },
  emptyNotesText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  noteCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  noteHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  noteAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  noteHeaderContent: { flex: 1 },
  noteDoctorName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  noteDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  noteText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  noteInputCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  doctorNameInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  noteInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 120 },
  noteInputActions: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  submitNoteBtn: { flex: 2, paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  submitNoteBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  errorText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  retryText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  footer: { paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  addNoteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  addNoteBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
