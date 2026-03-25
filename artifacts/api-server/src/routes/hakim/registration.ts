import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  doctorsTable,
  medicalStudentsTable,
  universitiesTable,
  universityStudentsTable,
  insertDoctorSchema,
  insertMedicalStudentSchema,
} from "@workspace/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

// ─── Doctor Registration ───────────────────────────────────────────────────

router.post("/doctors/register", async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    const data = insertDoctorSchema.parse(rest);
    const [existing] = await db.select().from(doctorsTable).where(eq(doctorsTable.email, data.email));
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const [doctor] = await db.insert(doctorsTable).values({ ...data, passwordHash }).returning();
    const { passwordHash: _ph, ...safeDoctor } = doctor;
    res.status(201).json(safeDoctor);
  } catch (err) {
    req.log.error({ err }, "Doctor registration failed");
    res.status(400).json({ error: "Invalid registration data" });
  }
});

router.get("/doctors", async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = db.select().from(doctorsTable);

    const conditions = [];
    if (status) conditions.push(eq(doctorsTable.verificationStatus, status as string));
    if (search) conditions.push(
      or(
        ilike(doctorsTable.fullName, `%${search}%`),
        ilike(doctorsTable.email, `%${search}%`),
        ilike(doctorsTable.specialization, `%${search}%`)
      )
    );

    const doctors = conditions.length > 0
      ? await db.select().from(doctorsTable).where(conditions.length === 1 ? conditions[0] : conditions[0])
      : await db.select().from(doctorsTable).orderBy(doctorsTable.createdAt);

    res.json(doctors);
  } catch (err) {
    req.log.error({ err }, "Failed to list doctors");
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

router.get("/doctors/:id", async (req, res) => {
  try {
    const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, parseInt(req.params.id)));
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch doctor" });
  }
});

// Admin: verify or reject a doctor
router.post("/doctors/:id/verify", async (req, res) => {
  try {
    const { action, note } = req.body;
    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ error: "Action must be approved or rejected" });
    }

    const [doctor] = await db.update(doctorsTable)
      .set({
        verificationStatus: action,
        verificationNote: note || null,
        verifiedAt: action === "approved" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(doctorsTable.id, parseInt(req.params.id)))
      .returning();

    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    req.log.error({ err }, "Doctor verification failed");
    res.status(500).json({ error: "Failed to update verification" });
  }
});

// ─── University Management ─────────────────────────────────────────────────

router.get("/universities", async (req, res) => {
  try {
    const universities = await db.select().from(universitiesTable).orderBy(universitiesTable.name);
    res.json(universities);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch universities" });
  }
});

router.post("/universities", async (req, res) => {
  try {
    const { name, country, accessCode } = req.body;
    if (!name || !accessCode) return res.status(400).json({ error: "Name and access code required" });

    const [university] = await db.insert(universitiesTable)
      .values({ name, country: country || "SA", accessCode })
      .returning();
    res.status(201).json(university);
  } catch (err) {
    req.log.error({ err }, "Failed to create university");
    res.status(400).json({ error: "Failed to create university — access code may already exist" });
  }
});

// University uploads student data
router.post("/universities/:id/students", async (req, res) => {
  try {
    const universityId = parseInt(req.params.id);
    const { accessCode, students } = req.body;

    const [university] = await db.select().from(universitiesTable).where(eq(universitiesTable.id, universityId));
    if (!university) return res.status(404).json({ error: "University not found" });
    if (university.accessCode !== accessCode) return res.status(403).json({ error: "Invalid access code" });

    const records = (students as Array<{ fullName: string; universityCardNumber: string; studyYear?: number }>)
      .map((s) => ({ universityId, fullName: s.fullName, universityCardNumber: s.universityCardNumber, studyYear: s.studyYear || null }));

    const inserted = await db.insert(universityStudentsTable).values(records).returning();
    res.status(201).json({ uploaded: inserted.length });
  } catch (err) {
    req.log.error({ err }, "Failed to upload students");
    res.status(400).json({ error: "Failed to upload student data" });
  }
});

// ─── Medical Student Registration ─────────────────────────────────────────

router.post("/students/register", async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    const data = insertMedicalStudentSchema.parse(rest);

    const [existing] = await db.select().from(medicalStudentsTable).where(eq(medicalStudentsTable.email, data.email));
    if (existing) return res.status(409).json({ error: "Email already registered" });

    // Auto-verify if university data matches
    let verificationStatus: "pending" | "approved" = "pending";
    let verifiedAt: Date | null = null;

    if (data.universityId && data.universityCardNumber) {
      const studentMatch = await db.select()
        .from(universityStudentsTable)
        .where(eq(universityStudentsTable.universityCardNumber, data.universityCardNumber));

      if (studentMatch.length > 0 && studentMatch[0].universityId === data.universityId) {
        verificationStatus = "approved";
        verifiedAt = new Date();
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [student] = await db.insert(medicalStudentsTable)
      .values({ ...data, passwordHash, verificationStatus, verifiedAt })
      .returning();

    const { passwordHash: _ph, ...safeStudent } = student;
    res.status(201).json({
      ...safeStudent,
      autoVerified: verificationStatus === "approved",
    });
  } catch (err) {
    req.log.error({ err }, "Student registration failed");
    res.status(400).json({ error: "Invalid registration data" });
  }
});

router.get("/students", async (req, res) => {
  try {
    const { status } = req.query;
    const students = status
      ? await db.select().from(medicalStudentsTable).where(eq(medicalStudentsTable.verificationStatus, status as string))
      : await db.select().from(medicalStudentsTable).orderBy(medicalStudentsTable.createdAt);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

router.post("/students/:id/verify", async (req, res) => {
  try {
    const { action, note } = req.body;
    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ error: "Action must be approved or rejected" });
    }

    const [student] = await db.update(medicalStudentsTable)
      .set({
        verificationStatus: action,
        verificationNote: note || null,
        verifiedAt: action === "approved" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(medicalStudentsTable.id, parseInt(req.params.id)))
      .returning();

    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: "Failed to update verification" });
  }
});

// ─── Admin Stats ───────────────────────────────────────────────────────────

router.get("/admin/stats", async (req, res) => {
  try {
    const allDoctors = await db.select().from(doctorsTable);
    const allStudents = await db.select().from(medicalStudentsTable);
    const allUniversities = await db.select().from(universitiesTable);

    const stats = {
      doctors: {
        total: allDoctors.length,
        pending: allDoctors.filter((d) => d.verificationStatus === "pending").length,
        approved: allDoctors.filter((d) => d.verificationStatus === "approved").length,
        rejected: allDoctors.filter((d) => d.verificationStatus === "rejected").length,
        volunteers: allDoctors.filter((d) => d.isVolunteer).length,
      },
      students: {
        total: allStudents.length,
        pending: allStudents.filter((s) => s.verificationStatus === "pending").length,
        approved: allStudents.filter((s) => s.verificationStatus === "approved").length,
        rejected: allStudents.filter((s) => s.verificationStatus === "rejected").length,
        autoVerified: allStudents.filter((s) => s.verifiedAt && s.verificationStatus === "approved").length,
      },
      universities: {
        total: allUniversities.length,
        active: allUniversities.filter((u) => u.isActive).length,
      },
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
