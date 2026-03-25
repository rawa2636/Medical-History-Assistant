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
  Switch,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { API_BASE } from "@/constants/api";

const C = Colors.light;

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  multiline = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: C.textSecondary }]}>
        {label}{required && <Text style={{ color: C.error }}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          { borderColor: C.border, backgroundColor: C.backgroundSecondary, color: C.text },
          multiline && { height: 90, textAlignVertical: "top" },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.textTertiary}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

function PickerRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: C.textSecondary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.optionRow}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.optionChip,
                {
                  backgroundColor: value === opt.value ? C.primary : C.backgroundSecondary,
                  borderColor: value === opt.value ? C.primary : C.border,
                },
              ]}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionChipText, { color: value === opt.value ? "#fff" : C.textSecondary }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const SPECIALIZATIONS = [
  { label: "طب عام", value: "general" },
  { label: "باطنية", value: "internal_medicine" },
  { label: "أطفال", value: "pediatrics" },
  { label: "نساء وتوليد", value: "obstetrics" },
  { label: "جراحة", value: "surgery" },
  { label: "قلب", value: "cardiology" },
  { label: "عظام", value: "orthopedics" },
  { label: "نفسية", value: "psychiatry" },
  { label: "جلدية", value: "dermatology" },
  { label: "عيون", value: "ophthalmology" },
  { label: "أسنان", value: "dentistry" },
  { label: "أخرى", value: "other" },
];

const WORKPLACE_TYPES = [
  { label: "مستشفى حكومي", value: "government" },
  { label: "مستشفى خاص", value: "private" },
  { label: "عيادة خاصة", value: "clinic" },
  { label: "أكاديمي / جامعي", value: "academic" },
  { label: "متقاعد / متطوع", value: "volunteer" },
];

export default function DoctorRegisterScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [city, setCity] = useState("");
  const [workplaceType, setWorkplaceType] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [yearsOfExp, setYearsOfExp] = useState("");
  const [bio, setBio] = useState("");
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [acceptsPaid, setAcceptsPaid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!fullName || !email || !specialization || !licenseNumber) {
      Alert.alert("بيانات ناقصة", "يرجى إدخال الاسم، البريد الإلكتروني، التخصص، ورقم الرخصة.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/registration/doctors/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone: phone || null,
          specialization,
          licenseNumber,
          city: city || null,
          workplaceType: workplaceType || "private",
          workplace: workplace || null,
          yearsOfExperience: yearsOfExp ? parseInt(yearsOfExp) : null,
          bio: bio || null,
          isVolunteer,
          acceptsPaidCases: acceptsPaid,
        }),
      });

      if (res.status === 409) {
        Alert.alert("مسجّل مسبقاً", "هذا البريد الإلكتروني مسجّل بالفعل.");
        return;
      }
      if (!res.ok) throw new Error("Failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch {
      Alert.alert("خطأ", "فشل التسجيل. يرجى المحاولة مجدداً.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <View style={[styles.successScreen, { paddingTop: topPad }]}>
          <View style={[styles.successIcon, { backgroundColor: C.success + "20" }]}>
            <Feather name="check-circle" size={56} color={C.success} />
          </View>
          <Text style={[styles.successTitle, { color: C.text }]}>تم استلام طلبك!</Text>
          <Text style={[styles.successSubtitle, { color: C.textSecondary }]}>
            سيتم مراجعة بياناتك ووثائقك من قِبل الفريق الطبي وإشعارك خلال 24-48 ساعة.
          </Text>
          <TouchableOpacity
            style={[styles.homeBtn, { backgroundColor: C.primary }]}
            onPress={() => router.replace("/")}
            activeOpacity={0.85}
          >
            <Text style={styles.homeBtnText}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>تسجيل طبيب</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.infoBox, { backgroundColor: C.primary + "10", borderColor: C.primary + "25" }]}>
          <Feather name="info" size={15} color={C.primary} />
          <Text style={[styles.infoText, { color: C.primary }]}>
            سيتم مراجعة طلبك وتفعيل حسابك بعد التحقق من رخصة المزاولة.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>المعلومات الشخصية</Text>
          <Field label="الاسم الكامل" value={fullName} onChange={setFullName} placeholder="الاسم بالكامل" required />
          <Field label="البريد الإلكتروني" value={email} onChange={setEmail} placeholder="example@email.com" keyboardType="email-address" required />
          <Field label="رقم الجوال" value={phone} onChange={setPhone} placeholder="+966 5x xxx xxxx" keyboardType="phone-pad" />
          <Field label="المدينة" value={city} onChange={setCity} placeholder="الرياض، جدة، الدمام..." />
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>المؤهلات المهنية</Text>
          <Field label="رقم رخصة مزاولة المهنة" value={licenseNumber} onChange={setLicenseNumber} placeholder="رقم الرخصة الرسمية" required />
          <Field label="سنوات الخبرة" value={yearsOfExp} onChange={setYearsOfExp} placeholder="مثال: 10" keyboardType="numeric" />
          <PickerRow label="التخصص" options={SPECIALIZATIONS} value={specialization} onChange={setSpecialization} />
          <PickerRow label="جهة العمل" options={WORKPLACE_TYPES} value={workplaceType} onChange={setWorkplaceType} />
          <Field label="اسم المستشفى / العيادة" value={workplace} onChange={setWorkplace} placeholder="اختياري" />
          <Field label="نبذة مختصرة (اختياري)" value={bio} onChange={setBio} placeholder="أكتب نبذة عنك..." multiline />
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>إعدادات الاستشارات</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchContent}>
              <Text style={[styles.switchLabel, { color: C.text }]}>أتطوع للحالات المجانية</Text>
              <Text style={[styles.switchSubtitle, { color: C.textSecondary }]}>
                مراجعة حالات الطلاب والمرضى دون رسوم
              </Text>
            </View>
            <Switch
              value={isVolunteer}
              onValueChange={setIsVolunteer}
              trackColor={{ false: C.border, true: C.primary + "80" }}
              thumbColor={isVolunteer ? C.primary : C.textTertiary}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: C.borderLight }]} />

          <View style={styles.switchRow}>
            <View style={styles.switchContent}>
              <Text style={[styles.switchLabel, { color: C.text }]}>أقبل الاستشارات المدفوعة</Text>
              <Text style={[styles.switchSubtitle, { color: C.textSecondary }]}>
                استشارات برسوم رمزية يحددها النظام
              </Text>
            </View>
            <Switch
              value={acceptsPaid}
              onValueChange={setAcceptsPaid}
              trackColor={{ false: C.border, true: C.primary + "80" }}
              thumbColor={acceptsPaid ? C.primary : C.textTertiary}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: C.warning + "10", borderColor: C.warning + "30" }]}>
          <View style={styles.docRow}>
            <Feather name="file-text" size={18} color={C.warning} />
            <Text style={[styles.docTitle, { color: C.text }]}>الوثائق المطلوبة</Text>
          </View>
          <Text style={[styles.docNote, { color: C.textSecondary }]}>
            بعد التسجيل، سيتواصل معك الفريق لرفع صورة من:
          </Text>
          {["رخصة مزاولة المهنة", "الشهادة الجامعية", "أي شهادات تخصص"].map((doc) => (
            <View key={doc} style={styles.docItem}>
              <Feather name="check" size={14} color={C.warning} />
              <Text style={[styles.docItemText, { color: C.text }]}>{doc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: C.backgroundSecondary, borderTopColor: C.border }]}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: C.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>إرسال طلب التسجيل</Text>
            </>
          )}
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
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  infoBox: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular" },
  optionRow: { flexDirection: "row", gap: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  optionChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  switchContent: { flex: 1 },
  switchLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  switchSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  divider: { height: 1 },
  docRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  docTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  docNote: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  docItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  docItemText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  footer: { paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  successScreen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  successIcon: { width: 100, height: 100, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  homeBtn: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 14, marginTop: 8 },
  homeBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
