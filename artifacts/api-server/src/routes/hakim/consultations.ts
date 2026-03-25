import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  consultationRequestsTable,
  doctorsTable,
  medicalStudentsTable,
  patientsTable,
  reportsTable,
  casesTable,
} from "@workspace/db/schema";
import { eq, and, or } from "drizzle-orm";
import { requireAuth } from "./auth";

const router: IRouter = Router();

// ─── Submit consultation request (doctors, students, patients) ─────────────
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const allowedRoles = ["patient", "doctor", "student", "admin"];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Not authorized to submit consultations" });
    }

    const { caseId, consultationType, patientNote } = req.body;
    if (!caseId || !consultationType) {
      return res.status(400).json({ error: "caseId and consultationType are required" });
    }

    const validTypes = ["free_student", "free_doctor", "paid"];
    if (!validTypes.includes(consultationType)) {
      return res.status(400).json({ error: "Invalid consultation type" });
    }

    // Verify the case exists
    const [caseRecord] = await db.select().from(casesTable).where(eq(casesTable.id, caseId));
    if (!caseRecord) {
      return res.status(404).json({ error: "Case not found" });
    }

    // Verify the case has a report
    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.caseId, caseId));
    if (!report) {
      return res.status(400).json({ error: "Case must have a completed report before requesting consultation" });
    }

    // Check for duplicate pending request
    const existing = await db.select().from(consultationRequestsTable)
      .where(and(
        eq(consultationRequestsTable.caseId, caseId),
        eq(consultationRequestsTable.status, "pending")
      ));
    if (existing.length > 0) {
      return res.status(409).json({ error: "A pending consultation request already exists for this case" });
    }

    // Get price for paid consultations
    let priceSAR: string | null = null;
    if (consultationType === "paid") {
      priceSAR = req.body.priceSAR || "0";
    }

    const [consultation] = await db.insert(consultationRequestsTable)
      .values({
        patientId: user.id,
        caseId,
        consultationType,
        patientNote: patientNote || null,
        priceSAR,
      })
      .returning();

    res.status(201).json(consultation);
  } catch (err) {
    req.log.error({ err }, "Failed to create consultation request");
    res.status(500).json({ error: "Failed to create consultation request" });
  }
});

// ─── Patient: Get my consultation requests ────────────────────────────────
router.get("/my", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "patient") return res.status(403).json({ error: "Patients only" });

    const consultations = await db.select().from(consultationRequestsTable)
      .where(eq(consultationRequestsTable.patientId, user.id))
      .orderBy(consultationRequestsTable.createdAt);

    res.json(consultations);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch consultations" });
  }
});

// ─── Doctor/Student: Get available consultation requests ──────────────────
router.get("/available", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!["doctor", "student"].includes(user.role)) {
      return res.status(403).json({ error: "Doctors and students only" });
    }

    let typeFilter: string;
    if (user.role === "doctor") {
      typeFilter = req.query.type === "paid" ? "paid" : "free_doctor";
    } else {
      typeFilter = "free_student";
    }

    const requests = await db.select({
      consultation: consultationRequestsTable,
      patient: { id: patientsTable.id, name: patientsTable.name, age: patientsTable.age, gender: patientsTable.gender },
    })
      .from(consultationRequestsTable)
      .innerJoin(patientsTable, eq(consultationRequestsTable.patientId, patientsTable.id))
      .where(and(
        eq(consultationRequestsTable.consultationType, typeFilter),
        eq(consultationRequestsTable.status, "pending"),
      ))
      .orderBy(consultationRequestsTable.createdAt);

    res.json(requests);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch available consultations");
    res.status(500).json({ error: "Failed to fetch consultations" });
  }
});

// ─── Doctor/Student: Accept a consultation ───────────────────────────────
router.post("/:id/accept", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!["doctor", "student"].includes(user.role)) {
      return res.status(403).json({ error: "Doctors and students only" });
    }

    const consultationId = parseInt(req.params.id);
    const [consultation] = await db.select().from(consultationRequestsTable)
      .where(eq(consultationRequestsTable.id, consultationId));

    if (!consultation) return res.status(404).json({ error: "Consultation not found" });
    if (consultation.status !== "pending") return res.status(400).json({ error: "Consultation is not pending" });

    const [updated] = await db.update(consultationRequestsTable)
      .set({
        status: "accepted",
        assignedDoctorId: user.role === "doctor" ? user.id : null,
        assignedStudentId: user.role === "student" ? user.id : null,
        updatedAt: new Date(),
      })
      .where(eq(consultationRequestsTable.id, consultationId))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to accept consultation");
    res.status(500).json({ error: "Failed to accept consultation" });
  }
});

// ─── Doctor/Student: Complete a consultation with response ────────────────
router.post("/:id/complete", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!["doctor", "student"].includes(user.role)) {
      return res.status(403).json({ error: "Doctors and students only" });
    }

    const { providerResponse } = req.body;
    if (!providerResponse) return res.status(400).json({ error: "Response is required" });

    const consultationId = parseInt(req.params.id);
    const [updated] = await db.update(consultationRequestsTable)
      .set({
        status: "completed",
        providerResponse,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(consultationRequestsTable.id, consultationId),
        or(
          eq(consultationRequestsTable.assignedDoctorId, user.id),
          eq(consultationRequestsTable.assignedStudentId, user.id),
        )
      ))
      .returning();

    if (!updated) return res.status(404).json({ error: "Consultation not found or not assigned to you" });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to complete consultation");
    res.status(500).json({ error: "Failed to complete consultation" });
  }
});

// ─── Doctor/Student: My accepted consultations ───────────────────────────
router.get("/assigned", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!["doctor", "student"].includes(user.role)) {
      return res.status(403).json({ error: "Doctors and students only" });
    }

    const condition = user.role === "doctor"
      ? eq(consultationRequestsTable.assignedDoctorId, user.id)
      : eq(consultationRequestsTable.assignedStudentId, user.id);

    const assigned = await db.select({
      consultation: consultationRequestsTable,
      patient: { id: patientsTable.id, name: patientsTable.name, age: patientsTable.age, gender: patientsTable.gender },
    })
      .from(consultationRequestsTable)
      .innerJoin(patientsTable, eq(consultationRequestsTable.patientId, patientsTable.id))
      .where(condition)
      .orderBy(consultationRequestsTable.updatedAt);

    res.json(assigned);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch assigned consultations" });
  }
});

// ─── Get consultation with case report ──────────────────────────────────
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [consultation] = await db.select().from(consultationRequestsTable)
      .where(eq(consultationRequestsTable.id, parseInt(req.params.id)));

    if (!consultation) return res.status(404).json({ error: "Not found" });

    const [report] = await db.select().from(reportsTable)
      .where(eq(reportsTable.caseId, consultation.caseId));

    const [patient] = await db.select({ id: patientsTable.id, name: patientsTable.name, age: patientsTable.age, gender: patientsTable.gender })
      .from(patientsTable)
      .where(eq(patientsTable.id, consultation.patientId));

    res.json({ ...consultation, report, patient });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch consultation" });
  }
});

export default router;
