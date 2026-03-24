import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  casesTable,
  interviewSessionsTable,
  reportsTable,
  patientsTable,
  patientProfilesTable,
  doctorNotesTable,
  insertDoctorNoteSchema,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/:id/doctor-review", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [theCase] = await db.select().from(casesTable).where(eq(casesTable.id, id));
    if (!theCase) return res.status(404).json({ error: "Case not found" });

    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, theCase.patientId));
    const [profile] = await db.select().from(patientProfilesTable).where(eq(patientProfilesTable.patientId, theCase.patientId));
    const [session] = await db.select().from(interviewSessionsTable).where(eq(interviewSessionsTable.caseId, id));
    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.caseId, id));
    const notes = await db.select().from(doctorNotesTable).where(eq(doctorNotesTable.caseId, id)).orderBy(doctorNotesTable.createdAt);

    res.json({
      case: theCase,
      patient,
      profile: profile || null,
      session: session || null,
      report: report || null,
      doctorNotes: notes,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get doctor review");
    res.status(500).json({ error: "Failed to get doctor review" });
  }
});

router.post("/:id/doctor-review", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertDoctorNoteSchema.parse({ ...req.body, caseId: id });
    const [note] = await db.insert(doctorNotesTable).values(data).returning();
    res.status(201).json(note);
  } catch (err) {
    req.log.error({ err }, "Failed to add doctor note");
    res.status(400).json({ error: "Invalid note data" });
  }
});

export default router;
