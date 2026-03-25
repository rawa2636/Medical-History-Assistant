import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";
import { casesTable } from "./cases";
import { doctorsTable, medicalStudentsTable } from "./users";

export const consultationRequestsTable = pgTable("consultation_requests", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  caseId: integer("case_id").notNull().references(() => casesTable.id),
  // free_student | free_doctor | paid
  consultationType: text("consultation_type").notNull(),
  // pending | accepted | in_review | completed | rejected
  status: text("status").notNull().default("pending"),
  assignedDoctorId: integer("assigned_doctor_id").references(() => doctorsTable.id),
  assignedStudentId: integer("assigned_student_id").references(() => medicalStudentsTable.id),
  priceSAR: numeric("price_sar", { precision: 10, scale: 2 }),
  patientNote: text("patient_note"),
  providerResponse: text("provider_response"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertConsultationSchema = createInsertSchema(consultationRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  assignedDoctorId: true,
  assignedStudentId: true,
  completedAt: true,
});

export type ConsultationRequest = typeof consultationRequestsTable.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
