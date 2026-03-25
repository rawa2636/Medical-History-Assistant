import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  patientsTable,
  patientProfilesTable,
  casesTable,
  insertPatientSchema,
  insertPatientProfileSchema,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const patients = await db.select().from(patientsTable).orderBy(patientsTable.createdAt);
    res.json(patients);
  } catch (err) {
    req.log.error({ err }, "Failed to list patients");
    res.status(500).json({ error: "Failed to list patients" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = insertPatientSchema.parse(req.body);
    const [patient] = await db.insert(patientsTable).values(data).returning();
    res.status(201).json(patient);
  } catch (err) {
    req.log.error({ err }, "Failed to create patient");
    res.status(400).json({ error: "Invalid patient data" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const [[profile], cases] = await Promise.all([
      db.select().from(patientProfilesTable).where(eq(patientProfilesTable.patientId, id)),
      db.select().from(casesTable).where(eq(casesTable.patientId, id)).orderBy(casesTable.createdAt),
    ]);

    res.json({ patient, profile: profile || null, cases });
  } catch (err) {
    req.log.error({ err }, "Failed to get patient");
    res.status(500).json({ error: "Failed to get patient" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const [patient] = await db.update(patientsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(patientsTable.id, id))
      .returning();
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err) {
    req.log.error({ err }, "Failed to update patient");
    res.status(500).json({ error: "Failed to update patient" });
  }
});

router.post("/:id/profile", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const data = { ...req.body, patientId };

    const [existing] = await db.select().from(patientProfilesTable).where(eq(patientProfilesTable.patientId, patientId));

    let profile;
    if (existing) {
      [profile] = await db.update(patientProfilesTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(patientProfilesTable.patientId, patientId))
        .returning();
    } else {
      const parsed = insertPatientProfileSchema.parse(data);
      [profile] = await db.insert(patientProfilesTable).values(parsed).returning();
    }

    res.json(profile);
  } catch (err) {
    req.log.error({ err }, "Failed to save profile");
    res.status(500).json({ error: "Failed to save profile" });
  }
});

router.get("/:id/cases", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const cases = await db.select().from(casesTable).where(eq(casesTable.patientId, patientId)).orderBy(casesTable.createdAt);
    res.json(cases);
  } catch (err) {
    req.log.error({ err }, "Failed to get patient cases");
    res.status(500).json({ error: "Failed to get cases" });
  }
});

export default router;
