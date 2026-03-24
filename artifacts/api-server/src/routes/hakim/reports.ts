import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  casesTable,
  interviewSessionsTable,
  reportsTable,
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

const REPORT_PROMPT = `You are a medical documentation specialist. Generate a structured medical history report in JSON format based on the patient's information and interview transcript.

CRITICAL RULES:
- DO NOT include any diagnosis, differential diagnosis, or medical conclusions
- DO NOT recommend treatments, medications, or investigations
- Only document what the patient reported — this is a history-taking document only
- Write in clear, professional medical language
- Use third-person past tense (e.g., "The patient reported...", "She complained of...")

Return ONLY valid JSON with these exact fields:
{
  "chiefComplaint": "One sentence summary of main complaint with duration",
  "hpi": "Detailed narrative paragraph of History of Present Illness using SOCRATES framework where applicable",
  "ros": "Summary of Review of Systems findings, including positive and relevant negative symptoms",
  "pmh": "Past Medical History summary including chronic conditions and surgeries",
  "drugHistory": "Current medications summary",
  "allergyHistory": "Allergies summary",
  "familyHistory": "Family history summary",
  "socialHistory": "Social history including occupation, smoking, alcohol, lifestyle",
  "summary": "Brief 2-3 sentence executive summary for the reviewing physician"
}`;

router.post("/:id/generate-report", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [theCase] = await db.select().from(casesTable).where(eq(casesTable.id, id));
    if (!theCase) return res.status(404).json({ error: "Case not found" });

    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, theCase.patientId));
    const [profile] = await db.select().from(patientProfilesTable).where(eq(patientProfilesTable.patientId, theCase.patientId));
    const [session] = await db.select().from(interviewSessionsTable).where(eq(interviewSessionsTable.caseId, id));

    const messages = (session?.messages as Array<{ role: string; content: string }>) || [];
    const transcript = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");

    const contextData = {
      patient: {
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        occupation: patient.occupation,
        maritalStatus: patient.maritalStatus,
      },
      profile: profile || {},
      rosSymptoms: theCase.rosSymptoms,
      chiefComplaints: theCase.chiefComplaints,
      interviewTranscript: transcript,
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2000,
      messages: [
        { role: "system", content: REPORT_PROMPT },
        {
          role: "user",
          content: `Generate a structured medical history report from this data:\n\n${JSON.stringify(contextData, null, 2)}`,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content || "{}";
    let reportData: Record<string, string | null>;

    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      reportData = JSON.parse(cleaned);
    } catch {
      reportData = {
        chiefComplaint: "Unable to generate report - parsing error",
        hpi: rawContent,
        ros: null,
        pmh: null,
        drugHistory: null,
        allergyHistory: null,
        familyHistory: null,
        socialHistory: null,
        summary: null,
      };
    }

    const patientInfo = {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      occupation: patient.occupation,
      maritalStatus: patient.maritalStatus,
    };

    const [existingReport] = await db.select().from(reportsTable).where(eq(reportsTable.caseId, id));

    let report;
    if (existingReport) {
      [report] = await db.update(reportsTable)
        .set({
          patientInfo,
          chiefComplaint: reportData.chiefComplaint,
          hpi: reportData.hpi,
          ros: reportData.ros,
          pmh: reportData.pmh,
          drugHistory: reportData.drugHistory,
          allergyHistory: reportData.allergyHistory,
          familyHistory: reportData.familyHistory,
          socialHistory: reportData.socialHistory,
          summary: reportData.summary,
          generatedAt: new Date(),
        })
        .where(eq(reportsTable.caseId, id))
        .returning();
    } else {
      [report] = await db.insert(reportsTable).values({
        caseId: id,
        patientInfo,
        chiefComplaint: reportData.chiefComplaint,
        hpi: reportData.hpi,
        ros: reportData.ros,
        pmh: reportData.pmh,
        drugHistory: reportData.drugHistory,
        allergyHistory: reportData.allergyHistory,
        familyHistory: reportData.familyHistory,
        socialHistory: reportData.socialHistory,
        summary: reportData.summary,
      }).returning();
    }

    await db.update(casesTable)
      .set({ status: "report_ready", updatedAt: new Date() })
      .where(eq(casesTable.id, id));

    res.json(report);
  } catch (err) {
    req.log.error({ err }, "Failed to generate report");
    res.status(500).json({ error: "Failed to generate report" });
  }
});

router.get("/:id/report", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.caseId, id));
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json(report);
  } catch (err) {
    req.log.error({ err }, "Failed to get report");
    res.status(500).json({ error: "Failed to get report" });
  }
});

export default router;
