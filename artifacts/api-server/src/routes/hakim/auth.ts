import { Router, type IRouter, type RequestHandler } from "express";
import { db } from "@workspace/db";
import { doctorsTable, medicalStudentsTable, adminsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router: IRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "hakim-fallback-secret";
const TOKEN_EXPIRY = "30d";

export interface AuthPayload {
  id: number;
  email: string;
  role: "doctor" | "student" | "admin";
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = verifyToken(auth.slice(7));
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  (req as any).user = payload;
  next();
};

// ─── Seed default admin on startup ────────────────────────────────────────
export async function seedAdmin() {
  try {
    const existing = await db.select().from(adminsTable).where(eq(adminsTable.username, "admin"));
    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash("hakim-admin", 10);
      await db.insert(adminsTable).values({ username: "admin", passwordHash });
      console.log("[auth] Default admin created — username: admin, password: hakim-admin");
    }
  } catch (err) {
    console.error("[auth] Failed to seed admin:", err);
  }
}

// ─── POST /api/auth/login ──────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body as { email: string; password: string; role: string };

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, password and role are required" });
    }

    if (role === "admin") {
      // Admin uses username instead of email
      const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, email));
      if (!admin) return res.status(401).json({ error: "Invalid credentials" });

      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      const token = signToken({ id: admin.id, email: admin.username, role: "admin" });
      return res.json({
        token,
        user: { id: admin.id, fullName: "Admin", email: admin.username, role: "admin" },
      });
    }

    if (role === "doctor") {
      const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.email, email));
      if (!doctor) return res.status(401).json({ error: "Invalid credentials" });
      if (!doctor.passwordHash) return res.status(401).json({ error: "Account has no password set" });

      const valid = await bcrypt.compare(password, doctor.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      if (!doctor.isActive) return res.status(403).json({ error: "Account is deactivated" });

      const token = signToken({ id: doctor.id, email: doctor.email, role: "doctor" });
      return res.json({
        token,
        user: {
          id: doctor.id,
          fullName: doctor.fullName,
          email: doctor.email,
          role: "doctor",
          verificationStatus: doctor.verificationStatus,
          specialization: doctor.specialization,
        },
      });
    }

    if (role === "student") {
      const [student] = await db.select().from(medicalStudentsTable).where(eq(medicalStudentsTable.email, email));
      if (!student) return res.status(401).json({ error: "Invalid credentials" });
      if (!student.passwordHash) return res.status(401).json({ error: "Account has no password set" });

      const valid = await bcrypt.compare(password, student.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      if (!student.isActive) return res.status(403).json({ error: "Account is deactivated" });

      const token = signToken({ id: student.id, email: student.email, role: "student" });
      return res.json({
        token,
        user: {
          id: student.id,
          fullName: student.fullName,
          email: student.email,
          role: "student",
          verificationStatus: student.verificationStatus,
          studyYear: student.studyYear,
        },
      });
    }

    return res.status(400).json({ error: "Invalid role" });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Login failed" });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user as AuthPayload;

    if (user.role === "admin") {
      const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.id, user.id));
      if (!admin) return res.status(404).json({ error: "Not found" });
      return res.json({ id: admin.id, fullName: "Admin", email: admin.username, role: "admin" });
    }

    if (user.role === "doctor") {
      const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, user.id));
      if (!doctor) return res.status(404).json({ error: "Not found" });
      return res.json({
        id: doctor.id,
        fullName: doctor.fullName,
        email: doctor.email,
        role: "doctor",
        verificationStatus: doctor.verificationStatus,
        specialization: doctor.specialization,
      });
    }

    if (user.role === "student") {
      const [student] = await db.select().from(medicalStudentsTable).where(eq(medicalStudentsTable.id, user.id));
      if (!student) return res.status(404).json({ error: "Not found" });
      return res.json({
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        role: "student",
        verificationStatus: student.verificationStatus,
        studyYear: student.studyYear,
      });
    }

    res.status(400).json({ error: "Invalid role" });
  } catch (err) {
    req.log.error({ err }, "Failed to get current user");
    res.status(500).json({ error: "Failed to get user" });
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────
router.post("/logout", (_req, res) => {
  res.json({ success: true });
});

export default router;
