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
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
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
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: C.textSecondary }]}>
        {label}{required && <Text style={{ color: C.error }}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, { borderColor: C.border, backgroundColor: C.backgroundSecondary, color: C.text }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.textTertiary}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const STUDY_YEARS = [1, 2, 3, 4, 5, 6, 7];

export default function StudentRegisterScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [studyYear, setStudyYear] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [autoVerified, setAutoVerified] = useState(false);

  const { data: universities = [] } = useQuery<University[]>({
    queryKey: ["universities"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/registration/universities`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  async function handleSubmit() {
    if (!fullName || !email || !cardNumber || !studyYear) {
      Alert.alert("بيانات ناقصة", "يرجى إدخال الاسم والبريد الإلكتروني ورقم البطاقة والسنة الدراسية.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/registration/students/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone: phone || null,
          universityId: selectedUniversity?.id || null,
          universityCardNumber: cardNumber,
          studyYear,
        }),
      });

      if (res.status === 409) {
        Alert.alert("مسجّل مسبقاً", "هذا البريد الإلكتروني مسجّل بالفعل.");
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAutoVerified(data.autoVerified || false);
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
          <View style={[
            styles.successIcon,
            { backgroundColor: autoVerified ? C.success + "20" : C.warning + "20" },
          ]}>
            <Feather
              name={autoVerified ? "check-circle" : "clock"}
              size={56}
              color={autoVerified ? C.success : C.warning}
            />
          </View>

          <Text style={[styles.successTitle, { color: C.text }]}>
            {autoVerified ? "تم التحقق تلقائياً! ✓" : "تم استلام طلبك"}
          </Text>

          <View style={[
            styles.successBanner,
            { backgroundColor: autoVerified ? C.success + "12" : C.warning + "12", borderColor: autoVerified ? C.success + "30" : C.warning + "30" },
          ]}>
            <Text style={[styles.successBannerText, { color: autoVerified ? C.success : C.warning }]}>
              {autoVerified
                ? "تطابقت بياناتك مع سجلات الجامعة — حسابك نشط الآن"
                : "بياناتك قيد المراجعة. سيتم إشعارك بعد التحقق من بطاقتك الجامعية"}
            </Text>
          </View>

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
        <Text style={[styles.headerTitle, { color: C.text }]}>تسجيل طالب طب</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.infoBox, { backgroundColor: "#805AD520", borderColor: "#805AD530" }]}>
          <Feather name="zap" size={15} color="#805AD5" />
          <Text style={[styles.infoText, { color: "#805AD5" }]}>
            إذا رفعت جامعتك بياناتك مسبقاً، سيتم التحقق من حسابك تلقائياً فور التسجيل.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>المعلومات الشخصية</Text>
          <Field label="الاسم الكامل" value={fullName} onChange={setFullName} placeholder="الاسم بالكامل" required />
          <Field label="البريد الإلكتروني" value={email} onChange={setEmail} placeholder="example@email.com" keyboardType="email-address" required />
          <Field label="رقم الجوال" value={phone} onChange={setPhone} placeholder="+966 5x xxx xxxx" keyboardType="phone-pad" />
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>معلومات الجامعة</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: C.textSecondary }]}>
              الجامعة <Text style={{ color: C.error }}>*</Text>
            </Text>
            <ScrollView style={styles.universityScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {universities.length === 0 ? (
                <Text style={[styles.noUniversities, { color: C.textTertiary }]}>
                  لا توجد جامعات مسجّلة حتى الآن
                </Text>
              ) : (
                <View style={styles.universityList}>
                  {universities.map((uni) => (
                    <TouchableOpacity
                      key={uni.id}
                      style={[
                        styles.universityItem,
                        {
                          backgroundColor: selectedUniversity?.id === uni.id ? C.primary + "15" : C.backgroundTertiary,
                          borderColor: selectedUniversity?.id === uni.id ? C.primary : "transparent",
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedUniversity(uni);
                      }}
                      activeOpacity={0.7}
                    >
                      <Feather
                        name="check-circle"
                        size={16}
                        color={selectedUniversity?.id === uni.id ? C.primary : C.backgroundTertiary}
                      />
                      <Text style={[styles.universityName, { color: C.text }]}>{uni.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>

          <Field
            label="رقم البطاقة الجامعية"
            value={cardNumber}
            onChange={setCardNumber}
            placeholder="الرقم المدوّن على البطاقة"
            required
          />

          <View style={styles.field}>
            <Text style={[styles.label, { color: C.textSecondary }]}>
              السنة الدراسية <Text style={{ color: C.error }}>*</Text>
            </Text>
            <View style={styles.yearsRow}>
              {STUDY_YEARS.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearBtn,
                    {
                      backgroundColor: studyYear === year ? C.primary : C.backgroundSecondary,
                      borderColor: studyYear === year ? C.primary : C.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setStudyYear(year);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.yearBtnText, { color: studyYear === year ? "#fff" : C.textSecondary }]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundTertiary, borderColor: C.border }]}>
          <View style={styles.docRow}>
            <Feather name="camera" size={16} color={C.textSecondary} />
            <Text style={[styles.docTitle, { color: C.textSecondary }]}>
              بعد التسجيل قد يُطلب منك رفع صورة البطاقة الجامعية للتحقق اليدوي
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: C.backgroundSecondary, borderTopColor: C.border }]}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: "#805AD5", opacity: saving ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>تسجيل الحساب</Text>
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
  universityScroll: { maxHeight: 200 },
  universityList: { gap: 8 },
  noUniversities: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic", padding: 8 },
  universityItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1 },
  universityName: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  yearsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  yearBtn: { width: 46, height: 46, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  yearBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  docRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  docTitle: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  footer: { paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  successScreen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  successIcon: { width: 100, height: 100, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  successBanner: { padding: 14, borderRadius: 14, borderWidth: 1 },
  successBannerText: { fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center", lineHeight: 20 },
  homeBtn: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 14, marginTop: 8 },
  homeBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
