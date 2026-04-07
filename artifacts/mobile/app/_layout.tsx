import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorFallback } from "@/components/ErrorFallback";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const PUBLIC_SEGMENTS = ["login", "register"];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = (segments[0] as string | undefined) ?? "";
    const isPublic = PUBLIC_SEGMENTS.includes(firstSegment);

    const isPending =
      (user?.role === "doctor" || user?.role === "student") &&
      user?.verificationStatus === "pending";

    if (!isAuthenticated && !isPublic) {
      router.replace("/login");
    } else if (isAuthenticated && firstSegment === "login") {
      if (user?.role === "admin") {
        router.replace("/admin" as any);
      } else if (user?.role === "patient") {
        router.replace("/patient-portal" as any);
      } else if (isPending) {
        router.replace("/pending" as any);
      } else {
        router.replace("/");
      }
    } else if (isAuthenticated && isPending && firstSegment !== "pending") {
      router.replace("/pending" as any);
    }
  }, [isAuthenticated, isLoading, segments, user]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="index" />
      <Stack.Screen name="patient/[id]" />
      <Stack.Screen name="patient/new" />
      <Stack.Screen name="patient/profile/[id]" />
      <Stack.Screen name="case/ros/[caseId]" />
      <Stack.Screen name="case/complaints/[caseId]" />
      <Stack.Screen name="case/interview/[caseId]" />
      <Stack.Screen name="case/report/[caseId]" />
      <Stack.Screen name="case/doctor/[caseId]" />
      <Stack.Screen name="register/index" />
      <Stack.Screen name="register/doctor" />
      <Stack.Screen name="register/student" />
      <Stack.Screen name="admin/index" />
      <Stack.Screen name="admin/doctors" />
      <Stack.Screen name="admin/students" />
      <Stack.Screen name="admin/universities" />
      <Stack.Screen name="patient-portal/index" />
      <Stack.Screen name="patient-portal/consult" />
      <Stack.Screen name="pending" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <StatusBar style="dark" />
                  <AuthGuard>
                    <RootLayoutNav />
                  </AuthGuard>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </AuthProvider>
          </QueryClientProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
