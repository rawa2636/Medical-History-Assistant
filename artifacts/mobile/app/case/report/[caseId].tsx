import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Colors from "@/constants/colors";
import { endpoints } from "@/constants/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const C = Colors.light;

interface CaseReport {
  id: number;
  patientName: string;
  patientAge: number | null;
  patientGender: string | null;
  chiefComplaints: string;
  historyOfPresentIllness: string;
  reviewOfSystems: string;
  pastMedicalHistory: string;
  familyHistory: string;
  socialHistory: string;
  medicationsAllergies: string;
  assessment: string;
  plan: string;
  createdAt: string;
}

function Section({ title, content }: { title: string; content: string }) {
  if (!content || content.trim() === "N/A" || content.trim() === "") return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: C.primary }]}>{title}</Text>
      <Text style={[styles.sectionContent, { color: C.text }]}>{content}</Text>
    </View>
  );
}

function SendCaseModal({
  visible,
  caseId,
  token,
  onClose,
  t,
  isRTL,
}: {
  visible: boolean;
  caseId: string;
  token: string | null;
  onClose: () => void;
  t: (k: string) => string;
  isRTL: boolean;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const options = [
    { id: "free_student", icon: "book-open", color: "#805AD5", label: t("sendFreeStudent"), desc: t("sendFreeStudentDesc") },
    { id: "free_doctor", icon: "user-check", color: C.primary, label: t("sendFreeDoctor"), desc: t("sendFreeDoctorDesc") },
    { id: "paid", icon: "star", color: "#E59F00", label: t("sendPaid"), desc: t("sendPaidDesc") },
  ];

  async function handleSend() {
    if (!selectedType) return;
    if (!token) {
      Alert.alert(
        isRTL ? "يلزم تسجيل الدخول" : "Login Required",
        isRTL ? "يجب تسجيل الدخول لإرسال الحالة." : "You must be logged in to send a case."
      );
      return;
    }
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(endpoints.consultations, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caseId: parseInt(caseId), consultationType: selectedType }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      setSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert(isRTL ? "خطأ" : "Error", e.message || (isRTL ? "فشل الإرسال. حاول مرة أخرى." : "Failed to send case. Please try again."));
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: C.background }]}>
          <View style={[styles.modalHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>{t("sendCase")}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={C.textSecondary} />
            </TouchableOpacity>
          </View>

          {sent ? (
            <View style={styles.sentContainer}>
              <View style={[styles.sentIcon, { backgroundColor: C.success + "20" }]}>
                <Feather name="check-circle" size={40} color={C.success} />
              </View>
              <Text style={[styles.sentTitle, { color: C.text }]}>{t("caseSentTitle")}</Text>
              <Text style={[styles.sentDesc, { color: C.textSecondary, textAlign: "center" }]}>{t("caseSentDesc")}</Text>
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: C.primary }]} onPress={onClose}>
                <Text style={styles.doneBtnText}>{t("done")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.modalDesc, { color: C.textSecondary, textAlign: isRTL ? "right" : "left" }]}>{t("sendCaseDesc")}</Text>
              <View style={styles.consultOptions}>
                {options.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.consultOption, {
                      borderColor: selectedType === opt.id ? opt.color : C.border,
                      backgroundColor: selectedType === opt.id ? opt.color + "10" : C.backgroundSecondary,
                    }]}
                    onPress={() => { Haptics.selectionAsync(); setSelectedType(opt.id); }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.consultOptionIcon, { backgroundColor: opt.color + "20" }]}>
                      <Feather name={opt.icon as any} size={22} color={opt.color} />
                    </View>
                    <View style={[styles.consultOptionText, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                      <Text style={[styles.consultOptionLabel, { color: C.text }]}>{opt.label}</Text>
                      <Text style={[styles.consultOptionDesc, { color: C.textSecondary }]}>{opt.desc}</Text>
                    </View>
                    {selectedType === opt.id && (
                      <View style={[styles.checkCircle, { backgroundColor: opt.color }]}>
                        <Feather name="check" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: C.primary, opacity: (!selectedType || sending) ? 0.6 : 1 }]}
                onPress={handleSend}
                disabled={!selectedType || sending}
                activeOpacity={0.85}
              >
                {sending ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.sendBtnText}>{t("sendNow")}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function mapApiReportToScreen(raw: any): CaseReport {
  const info = raw.patientInfo ?? {};
  return {
    id: raw.id,
    patientName: info.name ?? "Unknown",
    patientAge: info.age ?? null,
    patientGender: info.gender ?? null,
    chiefComplaints: raw.chiefComplaint ?? raw.chiefComplaints ?? "",
    historyOfPresentIllness: raw.hpi ?? raw.historyOfPresentIllness ?? "",
    reviewOfSystems: raw.ros ?? raw.reviewOfSystems ?? "",
    pastMedicalHistory: raw.pmh ?? raw.pastMedicalHistory ?? "",
    familyHistory: raw.familyHistory ?? "",
    socialHistory: raw.socialHistory ?? "",
    medicationsAllergies: [raw.drugHistory, raw.allergyHistory].filter(Boolean).join("\n") || raw.medicationsAllergies || "",
    assessment: raw.assessment ?? raw.summary ?? "",
    plan: raw.plan ?? "",
    createdAt: raw.generatedAt ?? raw.createdAt ?? new Date().toISOString(),
  };
}

export default function ReportScreen() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const { token } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [report, setReport] = useState<CaseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    try {
      const res = await fetch(endpoints.case(parseInt(caseId)));
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const rawReport = data.report ?? data;
      if (rawReport && rawReport.id) {
        setReport(mapApiReportToScreen(rawReport));
      }
    } catch {
      Alert.alert("Error", "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    if (!report) return;
    setDownloading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; padding: 32px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
  h1 { color: #1A6B5E; font-size: 24px; margin-bottom: 4px; }
  .subtitle { color: #6B7280; font-size: 14px; margin-bottom: 24px; border-bottom: 2px solid #1A6B5E; padding-bottom: 12px; }
  .patient-info { background: #f9f9f9; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .patient-info p { margin: 4px 0; font-size: 14px; }
  .patient-info strong { color: #1A6B5E; }
  h2 { color: #1A6B5E; font-size: 16px; margin-top: 20px; margin-bottom: 6px; border-left: 4px solid #1A6B5E; padding-left: 10px; }
  p { font-size: 14px; line-height: 1.6; margin: 0; }
  .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; color: #9ca3af; font-size: 12px; }
</style>
</head>
<body>
  <h1>Hakim — Medical History Report</h1>
  <div class="subtitle">AI-Assisted Medical History Taking — ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
  <div class="patient-info">
    <p><strong>Patient:</strong> ${report.patientName}</p>
    ${report.patientAge ? `<p><strong>Age:</strong> ${report.patientAge}</p>` : ""}
    ${report.patientGender ? `<p><strong>Gender:</strong> ${report.patientGender}</p>` : ""}
    <p><strong>Date:</strong> ${new Date(report.createdAt).toLocaleDateString()}</p>
  </div>
  ${report.chiefComplaints ? `<h2>Chief Complaints</h2><p>${report.chiefComplaints.replace(/\n/g, "<br>")}</p>` : ""}
  ${report.historyOfPresentIllness ? `<h2>History of Present Illness</h2><p>${report.historyOfPresentIllness.replace(/\n/g, "<br>")}</p>` : ""}
  ${report.reviewOfSystems ? `<h2>Review of Systems</h2><p>${report.reviewOfSystems.replace(/\n/g, "<br>")}</p>` : ""}
  ${report.pastMedicalHistory ? `<h2>Past Medical History</h2><p>${report.pastMedicalHistory.replace(/\n/g, "<br>")}</p>` : ""}
  ${report.familyHistory ? `<h2>Family History</h2><p>${report.familyHistory.replace(/\n/g, "<br>")}</p>` : ""}
  ${report.socialHistory ? `<h2>Social History</h2><p>${report.socialHistory.replace(/\n/g, "<br>")}</p>` : ""}
  ${report.medicationsAllergies ? `<h2>Medications & Allergies</h2><p>${report.medicationsAllergies.replace(/\n/g, "<br>")}</p>` : ""}
  ${report.assessment ? `<h2>Assessment</h2><p>${report.assessment.replace(/\n/g, "<br>")}</p>` : ""}
  ${report.plan ? `<h2>Plan</h2><p>${report.plan.replace(/\n/g, "<br>")}</p>` : ""}
  <div class="footer">Generated by Hakim Medical Assistant · For educational and informational purposes only.</div>
</body>
</html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Medical History Report" });
      } else {
        Alert.alert("PDF saved", `Saved to: ${uri}`);
      }
    } catch {
      Alert.alert("Error", "Failed to generate PDF.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <Text style={{ color: C.textSecondary }}>{t("noReport")}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, {
        paddingTop: topPad + 12,
        backgroundColor: C.backgroundSecondary,
        borderBottomColor: C.border,
        flexDirection: isRTL ? "row-reverse" : "row",
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: C.text }]}>{t("medicalReport")}</Text>
          <Text style={[styles.headerSub, { color: C.textSecondary }]}>{report.patientName}</Text>
        </View>
        <TouchableOpacity
          style={[styles.iconBtn, { borderColor: C.border }]}
          onPress={handleDownloadPDF}
          disabled={downloading}
          activeOpacity={0.7}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <Feather name="download" size={18} color={C.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.reportCard, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <View style={[styles.reportHeader, { backgroundColor: C.primary + "12", borderRadius: 10, padding: 14, marginBottom: 16 }]}>
            <Text style={[styles.reportTitle, { color: C.primary }]}>Hakim — Medical History Report</Text>
            <Text style={[styles.reportDate, { color: C.textSecondary }]}>
              {new Date(report.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </Text>
            <View style={[styles.patientChips, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.chip, { backgroundColor: C.primary + "20" }]}>
                <Text style={[styles.chipText, { color: C.primary }]}>{report.patientName}</Text>
              </View>
              {report.patientAge != null && (
                <View style={[styles.chip, { backgroundColor: C.backgroundTertiary }]}>
                  <Text style={[styles.chipText, { color: C.textSecondary }]}>{report.patientAge} yrs</Text>
                </View>
              )}
              {report.patientGender && (
                <View style={[styles.chip, { backgroundColor: C.backgroundTertiary }]}>
                  <Text style={[styles.chipText, { color: C.textSecondary }]}>{report.patientGender}</Text>
                </View>
              )}
            </View>
          </View>

          <Section title="Chief Complaints" content={report.chiefComplaints} />
          <Section title="History of Present Illness" content={report.historyOfPresentIllness} />
          <Section title="Review of Systems" content={report.reviewOfSystems} />
          <Section title="Past Medical History" content={report.pastMedicalHistory} />
          <Section title="Family History" content={report.familyHistory} />
          <Section title="Social History" content={report.socialHistory} />
          <Section title="Medications & Allergies" content={report.medicationsAllergies} />
          <Section title="Assessment" content={report.assessment} />
          <Section title="Plan" content={report.plan} />

          <Text style={[styles.disclaimer, { color: C.textTertiary }]}>
            {t("reportDisclaimer")}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, {
        paddingBottom: bottomPad + 16,
        backgroundColor: C.backgroundSecondary,
        borderTopColor: C.border,
        flexDirection: isRTL ? "row-reverse" : "row",
      }]}>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: C.primary + "12", borderColor: C.primary + "30", flex: 1 }]}
          onPress={handleDownloadPDF}
          disabled={downloading}
          activeOpacity={0.8}
        >
          <Feather name="download" size={18} color={C.primary} />
          <Text style={[styles.footerBtnText, { color: C.primary }]}>{t("downloadPDF")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: C.primary, flex: 1 }]}
          onPress={() => { Haptics.selectionAsync(); setShowSendModal(true); }}
          activeOpacity={0.85}
        >
          <Feather name="send" size={18} color="#fff" />
          <Text style={[styles.footerBtnText, { color: "#fff" }]}>{t("sendCase")}</Text>
        </TouchableOpacity>
      </View>

      <SendCaseModal
        visible={showSendModal}
        caseId={caseId}
        token={token}
        onClose={() => setShowSendModal(false)}
        t={t}
        isRTL={isRTL}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  iconBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  reportCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 0 },
  reportHeader: {},
  reportTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  reportDate: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 10 },
  patientChips: { flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  section: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  sectionContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 16, lineHeight: 16 },
  footer: { paddingTop: 12, paddingHorizontal: 16, gap: 8, borderTopWidth: 1 },
  footerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: "transparent" },
  footerBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  modalHeader: { alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  modalDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  consultOptions: { gap: 10 },
  consultOption: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  consultOptionIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  consultOptionText: { flex: 1 },
  consultOptionLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  consultOptionDesc: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  sendBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sendBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  sentContainer: { alignItems: "center", gap: 12, paddingVertical: 20 },
  sentIcon: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sentTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  sentDesc: { fontSize: 14, fontFamily: "Inter_400Regular", maxWidth: 260, lineHeight: 20 },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
