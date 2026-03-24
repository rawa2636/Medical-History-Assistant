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

const C = Colors.light;

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  required = false,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: C.textSecondary }]}>
        {label}
        {required && <Text style={{ color: C.error }}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, { color: C.text, borderColor: C.border, backgroundColor: C.backgroundSecondary }]}
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

function GenderSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (g: string) => void;
}) {
  const options = ["Male", "Female", "Other"];
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: C.textSecondary }]}>Gender</Text>
      <View style={styles.genderRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.genderBtn,
              {
                backgroundColor: value === opt ? C.primary : C.backgroundSecondary,
                borderColor: value === opt ? C.primary : C.border,
              },
            ]}
            onPress={() => onChange(opt)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.genderBtnText,
                { color: value === opt ? "#fff" : C.textSecondary },
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function NewPatientScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter the patient's full name.");
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
    } catch (err) {
      Alert.alert("Error", "Failed to create patient. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>New Patient</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Patient Information</Text>
          <FormField label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Ahmed Al-Rashid" required />
          <FormField label="Age" value={age} onChangeText={setAge} placeholder="e.g. 45" keyboardType="numeric" />
          <GenderSelector value={gender} onChange={setGender} />
          <FormField label="Occupation" value={occupation} onChangeText={setOccupation} placeholder="e.g. Engineer" />
          <FormField label="Marital Status" value={maritalStatus} onChangeText={setMaritalStatus} placeholder="e.g. Married" />
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Body Measurements</Text>
          <FormField label="Weight" value={weight} onChangeText={setWeight} placeholder="e.g. 75 kg" />
          <FormField label="Height" value={height} onChangeText={setHeight} placeholder="e.g. 175 cm" />
        </View>

        <View style={[styles.section, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Contact Details</Text>
          <FormField label="Email" value={email} onChangeText={setEmail} placeholder="optional" keyboardType="email-address" />
          <FormField label="Phone" value={phone} onChangeText={setPhone} placeholder="optional" keyboardType="phone-pad" />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: C.backgroundSecondary, borderTopColor: C.border }]}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: C.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="user-plus" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Create Patient</Text>
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
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  genderRow: { flexDirection: "row", gap: 8 },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  genderBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
