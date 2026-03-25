import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  casesTable,
  interviewSessionsTable,
  reportsTable,
  doctorNotesTable,
  insertCaseSchema,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/", async (req, res) => {
  try {
    const data = insertCaseSchema.parse(req.body);
    const [newCase] = await db.insert(casesTable).values(data).returning();
    res.status(201).json(newCase);
  } catch (err) {
    req.log.error({ err }, "Failed to create case");
    res.status(400).json({ error: "Invalid case data" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [theCase] = await db.select().from(casesTable).where(eq(casesTable.id, id));
    if (!theCase) return res.status(404).json({ error: "Case not found" });

    const [[session], [report], notes] = await Promise.all([
      db.select().from(interviewSessionsTable).where(eq(interviewSessionsTable.caseId, id)),
      db.select().from(reportsTable).where(eq(reportsTable.caseId, id)),
      db.select().from(doctorNotesTable).where(eq(doctorNotesTable.caseId, id)),
    ]);

    res.json({ case: theCase, session: session || null, report: report || null, doctorNotes: notes });
  } catch (err) {
    req.log.error({ err }, "Failed to get case");
    res.status(500).json({ error: "Failed to get case" });
  }
});

router.post("/:id/ros", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { symptoms } = req.body;
    const [updated] = await db.update(casesTable)
      .set({ rosSymptoms: symptoms, updatedAt: new Date() })
      .where(eq(casesTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to save ROS");
    res.status(500).json({ error: "Failed to save ROS" });
  }
});

router.post("/:id/chief-complaints", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { complaints } = req.body;
    const [updated] = await db.update(casesTable)
      .set({ chiefComplaints: complaints, status: "interviewing", updatedAt: new Date() })
      .where(eq(casesTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to save complaints");
    res.status(500).json({ error: "Failed to save complaints" });
  }
});

export default router;
