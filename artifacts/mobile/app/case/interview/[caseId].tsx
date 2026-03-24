import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  Keyboard,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Colors from "@/constants/colors";
import { endpoints } from "@/constants/api";
import { fetch } from "expo/fetch";

const C = Colors.light;

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

function MessageBubble({ message, isLast }: { message: Message; isLast: boolean }) {
  const isUser = message.role === "user";

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
      {!isUser && (
        <View style={[styles.assistantAvatar, { backgroundColor: C.primary }]}>
          <Text style={styles.assistantAvatarText}>H</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: C.primary }]
            : [styles.bubbleAssistant, { backgroundColor: C.backgroundSecondary, borderColor: C.border }],
        ]}
      >
        <Text style={[styles.bubbleText, { color: isUser ? "#fff" : C.text }]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.messageRow}>
      <View style={[styles.assistantAvatar, { backgroundColor: C.primary }]}>
        <Text style={styles.assistantAvatarText}>H</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleAssistant, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
        <Text style={[styles.bubbleText, { color: C.textSecondary }]}>Hakim is typing{dots}</Text>
      </View>
    </View>
  );
}

export default function InterviewScreen() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadExistingSession();
  }, []);

  async function loadExistingSession() {
    try {
      const res = await window.fetch(endpoints.case(parseInt(caseId)));
      if (res.ok) {
        const data = await res.json();
        if (data.session?.messages?.length > 0) {
          setMessages(data.session.messages);
          setIsComplete(data.session.isComplete === "true");
        }
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || isStreaming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage = input.trim();
    setInput("");
    Keyboard.dismiss();

    const userMsg: Message = { role: "user", content: userMessage, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    let assistantContent = "";
    const assistantMsg: Message = { role: "assistant", content: "", timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const response = await fetch(endpoints.interviewMessage(parseInt(caseId)), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantContent += data.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: assistantContent,
                  };
                  return updated;
                });
              }
              if (data.done && data.isComplete) {
                setIsComplete(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch {
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "I'm having trouble connecting. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleGenerateReport() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setGeneratingReport(true);

    try {
      const res = await window.fetch(endpoints.generateReport(parseInt(caseId)), { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate report");
      router.replace({ pathname: "/case/report/[caseId]", params: { caseId } });
    } catch {
      Alert.alert("Error", "Failed to generate report. Please try again.");
    } finally {
      setGeneratingReport(false);
    }
  }

  const renderItem = useCallback(({ item, index }: { item: Message; index: number }) => (
    <MessageBubble message={item} isLast={index === messages.length - 1} />
  ), [messages.length]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={[styles.loadingText, { color: C.textSecondary }]}>Loading interview...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: C.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.backgroundSecondary, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerStep, { color: C.primary }]}>Step 3 of 3</Text>
          <Text style={[styles.headerTitle, { color: C.text }]}>AI Interview</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: isComplete ? C.success : C.accent }]} />
      </View>

      <View style={[styles.progressBar, { backgroundColor: C.backgroundTertiary }]}>
        <View style={[styles.progressFill, { width: "100%", backgroundColor: C.primary }]} />
      </View>

      {isComplete && !generatingReport && (
        <TouchableOpacity
          style={[styles.completeBanner, { backgroundColor: C.success + "15", borderColor: C.success + "30" }]}
          onPress={handleGenerateReport}
          activeOpacity={0.8}
        >
          <Feather name="check-circle" size={18} color={C.success} />
          <Text style={[styles.completeBannerText, { color: C.success }]}>
            Interview complete — Tap to generate report
          </Text>
          <Feather name="arrow-right" size={16} color={C.success} />
        </TouchableOpacity>
      )}

      {generatingReport && (
        <View style={[styles.completeBanner, { backgroundColor: C.primary + "15", borderColor: C.primary + "30" }]}>
          <ActivityIndicator size="small" color={C.primary} />
          <Text style={[styles.completeBannerText, { color: C.primary }]}>Generating your medical history report...</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => String(index)}
        renderItem={renderItem}
        contentContainerStyle={[styles.messageList, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={isStreaming && messages[messages.length - 1]?.content === "" ? <TypingIndicator /> : null}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />

      {!isComplete && (
        <View style={[styles.inputContainer, { paddingBottom: bottomPad + 8, backgroundColor: C.backgroundSecondary, borderTopColor: C.border }]}>
          <TextInput
            style={[styles.textInput, { color: C.text, backgroundColor: C.backgroundTertiary, borderColor: C.border }]}
            value={input}
            onChangeText={setInput}
            placeholder="Type your response..."
            placeholderTextColor={C.textTertiary}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: input.trim() ? C.primary : C.backgroundTertiary,
                opacity: isStreaming ? 0.6 : 1,
              },
            ]}
            onPress={sendMessage}
            disabled={!input.trim() || isStreaming}
            activeOpacity={0.7}
          >
            <Feather name="send" size={18} color={input.trim() ? "#fff" : C.textTertiary} />
          </TouchableOpacity>
        </View>
      )}

      {isComplete && (
        <View style={[styles.inputContainer, { paddingBottom: bottomPad + 8, backgroundColor: C.backgroundSecondary, borderTopColor: C.border }]}>
          <TouchableOpacity
            style={[styles.reportBtn, { backgroundColor: C.primary, opacity: generatingReport ? 0.7 : 1 }]}
            onPress={handleGenerateReport}
            disabled={generatingReport}
            activeOpacity={0.85}
          >
            {generatingReport ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="file-text" size={18} color="#fff" />
                <Text style={styles.reportBtnText}>Generate Medical Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
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
  headerStep: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  progressBar: { height: 3 },
  progressFill: { height: 3 },
  completeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
  },
  completeBannerText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  messageList: { padding: 16, gap: 12 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "85%" },
  messageRowUser: { alignSelf: "flex-end" },
  messageRowAssistant: { alignSelf: "flex-start" },
  assistantAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  assistantAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  bubble: { padding: 12, borderRadius: 18, maxWidth: "100%" },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  reportBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  reportBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
