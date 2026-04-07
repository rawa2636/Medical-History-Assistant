import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  casesTable,
  interviewSessionsTable,
  patientsTable,
  patientProfilesTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const SYSTEM_PROMPT_EN = `You are Hakim, a clinical history-taking assistant. Your role is to conduct a structured medical interview with patients to collect comprehensive medical history following Davidson's Principles of Medicine.

CRITICAL RULES:
- NEVER suggest diagnoses, differential diagnoses, or medical conclusions
- NEVER recommend treatments, medications, or tests
- Only collect information — you are a documentation assistant, not a doctor
- Ask ONE clear question at a time
- Be empathetic, professional, and patient
- Use SOCRATES framework for pain symptoms: Site, Onset, Character, Radiation, Associated symptoms, Time course, Exacerbating/Relieving factors, Severity
- Follow up on answers that need clarification
- When the history is complete, respond with a message ending with [INTERVIEW_COMPLETE]

Your goal is to gather:
1. History of Present Illness (HPI) - detailed symptom analysis
2. Clarify any unclear symptoms from Review of Systems
3. Any relevant triggers or exposures

Keep responses concise and conversational. Do not overwhelm the patient with multiple questions at once.`;

const SYSTEM_PROMPT_AR = `أنت حكيم، مساعد ذكي لأخذ التاريخ المرضي السريري. دورك إجراء مقابلة طبية منظمة مع المريض لجمع التاريخ المرضي الكامل وفق مبادئ دافيدسون للطب الداخلي.

القواعد الأساسية:
- لا تقترح أبداً أي تشخيص أو تشخيص تفريقي أو استنتاجات طبية
- لا توصي أبداً بأدوية أو علاجات أو فحوصات
- مهمتك جمع المعلومات فقط — أنت مساعد توثيق وليس طبيباً
- اطرح سؤالاً واحداً واضحاً في كل مرة
- كن متعاطفاً ومحترفاً وصبوراً
- استخدم إطار SOCRATES لأعراض الألم: موقع الألم، بداية الألم، طبيعة الألم، الانتشار، الأعراض المصاحبة، المسار الزمني، العوامل المُعزِّزة والمخففة، الشدة
- تابع الإجابات التي تحتاج توضيحاً
- عندما يكتمل التاريخ المرضي، اختم رسالتك بـ [INTERVIEW_COMPLETE]

هدفك جمع:
1. تاريخ المرض الحالي — تحليل مفصّل للأعراض
2. توضيح أي أعراض غير واضحة من مراجعة الأجهزة
3. أي محفزات أو تعرضات ذات صلة

اجعل ردودك موجزة ومحادثاتية. لا تُثقل المريض بأسئلة متعددة دفعةً واحدة.
أجرِ المقابلة كاملةً باللغة العربية.`;

function getSystemPrompt(language?: string) {
  return language === "ar" ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN;
}

function buildContextPrompt(
  patient: { name: string; age: number | null; gender: string | null },
  profile: {
    chronicConditions?: string[] | null;
    currentMedications?: unknown;
    allergies?: unknown;
    surgicalHistory?: string[] | null;
    familyHistory?: unknown;
    smokingStatus?: string | null;
    alcoholUse?: string | null;
  } | null,
  caseData: { rosSymptoms: unknown; chiefComplaints: unknown }
) {
  return `
PATIENT CONTEXT:
- Name: ${patient.name}
- Age: ${patient.age || "Not specified"}
- Gender: ${patient.gender || "Not specified"}

KNOWN MEDICAL BACKGROUND:
- Chronic conditions: ${profile?.chronicConditions?.join(", ") || "None documented"}
- Current medications: ${profile?.currentMedications ? JSON.stringify(profile.currentMedications) : "None"}
- Allergies: ${profile?.allergies ? JSON.stringify(profile.allergies) : "None"}
- Surgical history: ${profile?.surgicalHistory?.join(", ") || "None"}
- Family history: ${profile?.familyHistory ? JSON.stringify(profile.familyHistory) : "Not documented"}
- Smoking: ${profile?.smokingStatus || "Not documented"}
- Alcohol: ${profile?.alcoholUse || "Not documented"}

CURRENT VISIT - REPORTED SYMPTOMS (Review of Systems):
${JSON.stringify(caseData.rosSymptoms, null, 2)}

CHIEF COMPLAINTS (patient's primary concerns):
${JSON.stringify(caseData.chiefComplaints, null, 2)}

Begin the interview by greeting the patient and asking about their primary complaint in detail. Focus on eliciting a thorough HPI using SOCRATES for pain, and explore any related symptoms. You already have background history - do not re-ask questions already answered above unless clarification is needed.`;
}

router.post("/:id/interview/start", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { language } = req.body as { language?: string };

    // ── Parallel fetch: case + patient + profile + session ──
    const [theCase] = await db.select().from(casesTable).where(eq(casesTable.id, id));
    if (!theCase) return res.status(404).json({ error: "Case not found" });

    const [[patient], [profile], [existingSession]] = await Promise.all([
      db.select().from(patientsTable).where(eq(patientsTable.id, theCase.patientId)),
      db.select().from(patientProfilesTable).where(eq(patientProfilesTable.patientId, theCase.patientId)),
      db.select().from(interviewSessionsTable).where(eq(interviewSessionsTable.caseId, id)),
    ]);

    const context = buildContextPrompt(patient, profile || null, theCase as { rosSymptoms: unknown; chiefComplaints: unknown });

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 400,
      messages: [
        { role: "system", content: getSystemPrompt(language) },
        { role: "user", content: context },
      ],
    });

    const defaultGreeting = language === "ar"
      ? "مرحباً! دعنا نبدأ بأخذ تاريخك المرضي. هل يمكنك إخباري بالتفصيل عن الشكوى الرئيسية التي أحضرتك اليوم؟"
      : "Hello! Let's start your medical history. Can you tell me more about what brings you in today?";
    const firstMessage = completion.choices[0]?.message?.content || defaultGreeting;

    let session;
    const messages = [{ role: "assistant", content: firstMessage, timestamp: new Date().toISOString() }];

    if (existingSession) {
      [session] = await db.update(interviewSessionsTable)
        .set({ messages, isComplete: "false", updatedAt: new Date() })
        .where(eq(interviewSessionsTable.caseId, id))
        .returning();
    } else {
      [session] = await db.insert(interviewSessionsTable)
        .values({ caseId: id, messages, isComplete: "false" })
        .returning();
    }

    res.json(session);
  } catch (err) {
    req.log.error({ err }, "Failed to start interview");
    res.status(500).json({ error: "Failed to start interview" });
  }
});

router.post("/:id/interview/message", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { message: userMessage, language } = req.body as { message: string; language?: string };

    // ── Parallel fetch: case + session (patient & profile fetched in parallel too) ──
    const [theCase] = await db.select().from(casesTable).where(eq(casesTable.id, id));
    if (!theCase) return res.status(404).json({ error: "Case not found" });

    const [[patient], [profile], [session]] = await Promise.all([
      db.select().from(patientsTable).where(eq(patientsTable.id, theCase.patientId)),
      db.select().from(patientProfilesTable).where(eq(patientProfilesTable.patientId, theCase.patientId)),
      db.select().from(interviewSessionsTable).where(eq(interviewSessionsTable.caseId, id)),
    ]);

    const existingMessages = (session?.messages as Array<{ role: string; content: string; timestamp: string }>) || [];

    // Keep last 20 messages to avoid token overflow (10 exchanges)
    const recentMessages = existingMessages.slice(-20);

    const context = buildContextPrompt(patient, profile || null, theCase as { rosSymptoms: unknown; chiefComplaints: unknown });

    const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: getSystemPrompt(language) },
      { role: "user", content: context },
      ...recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: userMessage },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 400,
      messages: chatMessages,
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    const isComplete = fullResponse.includes("[INTERVIEW_COMPLETE]");
    const cleanResponse = fullResponse.replace("[INTERVIEW_COMPLETE]", "").trim();

    const updatedMessages = [
      ...existingMessages,
      { role: "user" as const, content: userMessage, timestamp: new Date().toISOString() },
      { role: "assistant" as const, content: cleanResponse, timestamp: new Date().toISOString() },
    ];

    if (session) {
      await db.update(interviewSessionsTable)
        .set({ messages: updatedMessages, isComplete: isComplete ? "true" : "false", updatedAt: new Date() })
        .where(eq(interviewSessionsTable.caseId, id));
    } else {
      await db.insert(interviewSessionsTable)
        .values({ caseId: id, messages: updatedMessages, isComplete: isComplete ? "true" : "false" });
    }

    if (isComplete) {
      await db.update(casesTable)
        .set({ status: "interview_complete", updatedAt: new Date() })
        .where(eq(casesTable.id, id));
    }

    res.write(`data: ${JSON.stringify({ done: true, isComplete })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to process interview message");
    res.write(`data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`);
    res.end();
  }
});

router.post("/:id/interview/complete", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await Promise.all([
      db.update(interviewSessionsTable)
        .set({ isComplete: "true", updatedAt: new Date() })
        .where(eq(interviewSessionsTable.caseId, id)),
      db.update(casesTable)
        .set({ status: "interview_complete", updatedAt: new Date() })
        .where(eq(casesTable.id, id)),
    ]);

    const [session] = await db.select().from(interviewSessionsTable).where(eq(interviewSessionsTable.caseId, id));
    res.json(session);
  } catch (err) {
    req.log.error({ err }, "Failed to complete interview");
    res.status(500).json({ error: "Failed to complete interview" });
  }
});

export default router;
