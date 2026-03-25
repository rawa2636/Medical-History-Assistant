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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { endpoints } from "@/constants/api";
import { useLanguage } from "@/contexts/LanguageContext";

const C = Colors.light;

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  required?: boolean;
  textAlign: "left" | "right";
};

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", required = false, textAlign }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: C.textSecondary, textAlign }]}>
        {label}{required && <Text style={{ color: C.error }}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, { color: C.text, borderColor: C.border, backgroundColor: C.backgroundSecondary, textAlign }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textTertiary}
        keyboardType={keyboardType}
        returnKeyType="next"
      />
    </View>
  );
}

export default function NewPatientScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { t, isRTL } = useLanguage();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const textAlign = isRTL ? "right" : "left";

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const genderOptions = [
    { value: "Male", label: t("male") },
    { value: "Female", label: t("female") },
    { value: "Other", label: t("other") },
  ];

  const maritalOptions = [
    { value: "Single", label: t("single") },
    { value: "Married", label: t("married") },
    { value: "Divorced", label: t("divorced") },
    { value: "Widowed", label: t("widowed") },
  ];

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert(t("nameRequired"), "");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const body: Record<string, string | number | null> = {
        name: name.trim(),
        age: age ? parseInt(age) : null,
        gender: gender || null,
        occupation: occupation || null,
        email: email || null,
        phone: phone || null,
        weight: weight || null,
        height: height || null,
        maritalStatus: maritalStatus || null,
      };
      const res = await fetch(endpoints.patients, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create patient");
      const patient = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
      router.replace({ pathname: "/patient/[id]", params: { id: patient.id } });
    } catch {
      Alert.alert("Error", "Failed to create patient. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border, flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>{t("newPatient")}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text, textAlign }]}>
            {isRTL ? "بيانات المريض" : "Patient Information"}
          </Text>
          <Field label={t("fullName")} value={name} onChangeText={setName} placeholder={t("fullNamePlaceholder")} required textAlign={textAlign} />
          <Field label={t("age")} value={age} onChangeText={setAge} placeholder={t("agePlaceholder")} keyboardType="numeric" textAlign={textAlign} />

          <View style={styles.field}>
            <Text style={[styles.label, { color: C.textSecondary, textAlign }]}>{t("gender")}</Text>
            <View style={styles.optionRow}>
              {genderOptions.map((opt) => (
                <TouchableOpacity key={opt.value} style={[styles.optionBtn, { backgroundColor: gender === opt.value ? C.primary : C.backgroundTertiary, borderColor: gender === opt.value ? C.primary : C.border }]} onPress={() => setGender(opt.value)} activeOpacity={0.7}>
                  <Text style={[styles.optionBtnText, { color: gender === opt.value ? "#fff" : C.textSecondary }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Field label={t("occupation")} value={occupation} onChangeText={setOccupation} placeholder={t("occupationPlaceholder")} textAlign={textAlign} />

          <View style={styles.field}>
            <Text style={[styles.label, { color: C.textSecondary, textAlign }]}>{t("maritalStatus")}</Text>
            <View style={styles.optionRow}>
              {maritalOptions.map((opt) => (
                <TouchableOpacity key={opt.value} style={[styles.optionBtn, { backgroundColor: maritalStatus === opt.value ? C.primary : C.backgroundTertiary, borderColor: maritalStatus === opt.value ? C.primary : C.border }]} onPress={() => setMaritalStatus(opt.value)} activeOpacity={0.7}>
                  <Text style={[styles.optionBtnText, { color: maritalStatus === opt.value ? "#fff" : C.textSecondary }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text, textAlign }]}>
            {isRTL ? "المقاسات الجسدية" : "Body Measurements"}
          </Text>
          <Field label={t("weight")} value={weight} onChangeText={setWeight} placeholder={t("weightPlaceholder")} keyboardType="numeric" textAlign={textAlign} />
          <Field label={t("height")} value={height} onChangeText={setHeight} placeholder={t("heightPlaceholder")} keyboardType="numeric" textAlign={textAlign} />
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text, textAlign }]}>
            {isRTL ? "بيانات الاتصال" : "Contact Details"}
          </Text>
          <Field label={t("email")} value={email} onChangeText={setEmail} placeholder={isRTL ? "اختياري" : "optional"} keyboardType="email-address" textAlign={textAlign} />
          <Field label={isRTL ? "الهاتف" : "Phone"} value={phone} onChangeText={setPhone} placeholder={isRTL ? "اختياري" : "optional"} keyboardType="phone-pad" textAlign={textAlign} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: C.backgroundSecondary, borderTopColor: C.border }]}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.primary, opacity: saving ? 0.7 : 1, flexDirection: isRTL ? "row-reverse" : "row" }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : (
            <>
              <Feather name="user-plus" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>{isRTL ? "إضافة مريض" : "Create Patient"}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular" },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  optionBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  footer: { paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  saveBtn: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
