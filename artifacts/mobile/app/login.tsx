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
import { useLanguage } from "@/contexts/LanguageContext";

const C = {
  primary: "#1A6B5E",
  bg: "#F7F8FA",
  card: "#FFFFFF",
  text: "#0F1923",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  error: "#EF4444",
  purple: "#805AD5",
  blue: "#3182CE",
};

export default function LoginScreen() {
  const { login } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [role, setRole] = useState<UserRole>("doctor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ROLES: { id: UserRole; label: string; icon: string; color: string }[] = [
    { id: "patient", label: t("patient"), icon: "heart", color: "#E53E3E" },
    { id: "doctor", label: t("doctor"), icon: "user-check", color: C.primary },
    { id: "student", label: t("student"), icon: "book-open", color: C.purple },
    { id: "admin", label: t("admin"), icon: "settings", color: C.blue },
  ];

  const selectedRole = ROLES.find((r) => r.id === role)!;
  const textAlign = isRTL ? "right" : "left";

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t("fieldRequired"));
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
      setError(result.error || t("loginFailed"));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Language Toggle */}
          <View style={[styles.langRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <TouchableOpacity
              style={[styles.langBtn, language === "ar" && { backgroundColor: C.primary, borderColor: C.primary }]}
              onPress={() => { Haptics.selectionAsync(); setLanguage("ar"); }}
            >
              <Text style={[styles.langBtnText, { color: language === "ar" ? "#fff" : C.textSecondary }]}>العربية</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, language === "en" && { backgroundColor: C.primary, borderColor: C.primary }]}
              onPress={() => { Haptics.selectionAsync(); setLanguage("en"); }}
            >
              <Text style={[styles.langBtnText, { color: language === "en" ? "#fff" : C.textSecondary }]}>English</Text>
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoCircle, { backgroundColor: C.primary + "18" }]}>
              <Feather name="activity" size={36} color={C.primary} />
            </View>
            <Text style={styles.appName}>{t("appName")}</Text>
            <Text style={styles.appSub}>{t("appSub")}</Text>
          </View>

          {/* Role Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: C.textSecondary, textAlign }]}>{t("loginAs")}</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.roleBtn,
                    role === r.id && { backgroundColor: r.color, borderColor: r.color },
                    role !== r.id && { borderColor: C.border },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setRole(r.id); setError(null); }}
                  activeOpacity={0.8}
                >
                  <Feather name={r.icon as any} size={16} color={role === r.id ? "#fff" : C.textSecondary} />
                  <Text style={[styles.roleBtnText, { color: role === r.id ? "#fff" : C.textSecondary }]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Credentials */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: C.textSecondary, textAlign }]}>
              {role === "admin" ? t("username") : t("email")}
            </Text>
            <View style={[styles.inputWrapper, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Feather name={role === "admin" ? "user" : "mail"} size={18} color={C.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: C.text, textAlign }]}
                value={email}
                onChangeText={setEmail}
                placeholder={role === "admin" ? t("username") : t("emailHint")}
                placeholderTextColor={C.textSecondary}
                keyboardType={role === "admin" ? "default" : "email-address"}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={[styles.sectionLabel, { color: C.textSecondary, textAlign, marginTop: 4 }]}>{t("password")}</Text>
            <View style={[styles.inputWrapper, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Feather name="lock" size={18} color={C.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: C.text, textAlign }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={C.textSecondary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {error && (
            <View style={[styles.errorBox, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Feather name="alert-circle" size={16} color={C.error} />
              <Text style={[styles.errorText, { textAlign }]}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: selectedRole.color }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>{t("login")}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerLink} onPress={() => router.push("/register" as any)}>
            <Text style={[styles.registerLinkText, { textAlign: "center" }]}>
              {t("noAccount")}{" "}
              <Text style={{ color: C.primary, fontFamily: "Inter_600SemiBold" }}>{t("register")}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 24, paddingTop: 16, gap: 20 },
  langRow: { justifyContent: "flex-end", gap: 8 },
  langBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  langBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  header: { alignItems: "center", gap: 8, paddingVertical: 8 },
  logoCircle: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  appName: { fontSize: 32, fontFamily: "Inter_700Bold", color: C.text, letterSpacing: -0.5 },
  appSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: C.card,
  },
  roleBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  inputWrapper: {
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  eyeBtn: { padding: 4 },
  errorBox: {
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EF444412",
    borderRadius: 10,
    padding: 12,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.error, flex: 1 },
  loginBtn: { height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  loginBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  registerLink: { alignItems: "center", paddingVertical: 8 },
  registerLinkText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
});
