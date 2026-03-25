import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

const C = {
  primary: "#1A6B5E",
  accent: "#00C9A7",
  bg: "#F7F8FA",
  card: "#FFFFFF",
  text: "#0F1923",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  error: "#EF4444",
  purple: "#805AD5",
  blue: "#3182CE",
};

const ROLES: { id: UserRole; label: string; icon: string; color: string; hint: string }[] = [
  { id: "patient", label: "مريض", icon: "heart", color: "#E53E3E", hint: "البريد الإلكتروني" },
  { id: "doctor", label: "طبيب", icon: "user-check", color: C.primary, hint: "البريد الإلكتروني المسجّل" },
  { id: "student", label: "طالب طب", icon: "book-open", color: C.purple, hint: "البريد الإلكتروني المسجّل" },
  { id: "admin", label: "مدير", icon: "settings", color: C.blue, hint: "اسم المستخدم" },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>("doctor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRole = ROLES.find((r) => r.id === role)!;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("يرجى إدخال جميع البيانات");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError(null);

    const result = await login(email.trim(), password, role);
    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (role === "patient") {
        router.replace("/patient-portal" as any);
      } else {
        router.replace("/");
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || "فشل تسجيل الدخول");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoCircle, { backgroundColor: C.primary + "18" }]}>
              <Feather name="activity" size={36} color={C.primary} />
            </View>
            <Text style={styles.appName}>Hakim</Text>
            <Text style={styles.appSub}>المساعد الطبي الذكي</Text>
          </View>

          {/* Role Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>تسجيل الدخول كـ</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.roleBtn,
                    role === r.id && { backgroundColor: r.color, borderColor: r.color },
                    role !== r.id && { borderColor: C.border },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRole(r.id);
                    setError(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={r.icon as any}
                    size={16}
                    color={role === r.id ? "#fff" : C.textSecondary}
                  />
                  <Text
                    style={[
                      styles.roleBtnText,
                      { color: role === r.id ? "#fff" : C.textSecondary },
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{selectedRole.hint}</Text>
              <View style={[styles.inputBox, { borderColor: C.border }]}>
                <Feather name="mail" size={18} color={C.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={role === "admin" ? "admin" : "example@email.com"}
                  placeholderTextColor={C.textSecondary + "99"}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(null); }}
                  autoCapitalize="none"
                  keyboardType={role === "admin" ? "default" : "email-address"}
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>كلمة المرور</Text>
              <View style={[styles.inputBox, { borderColor: C.border }]}>
                <Feather name="lock" size={18} color={C.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={C.textSecondary + "99"}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(null); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color={C.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color={C.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: selectedRole.color }]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
                  <Feather name="arrow-right" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/register");
            }}
          >
            <Text style={styles.registerLinkText}>
              ليس لديك حساب؟{" "}
              <Text style={{ color: C.primary, fontFamily: "Inter_600SemiBold" }}>
                سجّل الآن
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, padding: 24, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: C.text,
    letterSpacing: -0.5,
  },
  appSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 4,
  },
  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.textSecondary,
    marginBottom: 10,
  },
  roleRow: { flexDirection: "row", gap: 8 },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: C.card,
  },
  roleBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  form: { gap: 16, marginBottom: 24 },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.text,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  eyeBtn: { padding: 4 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.error + "12",
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.error,
    flex: 1,
  },
  loginBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  registerLink: { alignItems: "center", paddingVertical: 8 },
  registerLinkText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
});
