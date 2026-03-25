import { pgTable, text, serial, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";

export const casesTable = pgTable("cases", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  status: text("status").notNull().default("active"),
  rosSymptoms: jsonb("ros_symptoms").default({}),
  chiefComplaints: jsonb("chief_complaints").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("cases_patient_id_idx").on(t.patientId),
  index("cases_status_idx").on(t.status),
]);

export const interviewSessionsTable = pgTable("interview_sessions", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id),
  messages: jsonb("messages").notNull().default([]),
  isComplete: text("is_complete").notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("interview_sessions_case_id_idx").on(t.caseId),
]);

export const medicalHistoriesTable = pgTable("medical_histories", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id),
  chiefComplaint: text("chief_complaint"),
  hpi: text("hpi"),
  ros: jsonb("ros").default({}),
  pmh: jsonb("pmh").default({}),
  psh: text("psh").array().default([]),
  medications: jsonb("medications").default([]),
  allergies: jsonb("allergies").default([]),
  familyHistory: jsonb("family_history").default({}),
  socialHistory: jsonb("social_history").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("medical_histories_case_id_idx").on(t.caseId),
]);

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id),
  patientInfo: jsonb("patient_info").notNull().default({}),
  chiefComplaint: text("chief_complaint"),
  hpi: text("hpi"),
  ros: text("ros"),
  pmh: text("pmh"),
  drugHistory: text("drug_history"),
  allergyHistory: text("allergy_history"),
  familyHistory: text("family_history"),
  socialHistory: text("social_history"),
  summary: text("summary"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
}, (t) => [
  index("reports_case_id_idx").on(t.caseId),
]);

export const doctorNotesTable = pgTable("doctor_notes", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id),
  doctorName: text("doctor_name").notNull(),
  notes: text("notes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("doctor_notes_case_id_idx").on(t.caseId),
]);

export const insertCaseSchema = createInsertSchema(casesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInterviewSessionSchema = createInsertSchema(interviewSessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMedicalHistorySchema = createInsertSchema(medicalHistoriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, generatedAt: true });
export const insertDoctorNoteSchema = createInsertSchema(doctorNotesTable).omit({ id: true, createdAt: true });

export type Case = typeof casesTable.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type InterviewSession = typeof interviewSessionsTable.$inferSelect;
export type InsertInterviewSession = z.infer<typeof insertInterviewSessionSchema>;
export type MedicalHistory = typeof medicalHistoriesTable.$inferSelect;
export type InsertMedicalHistory = z.infer<typeof insertMedicalHistorySchema>;
export type Report = typeof reportsTable.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type DoctorNote = typeof doctorNotesTable.$inferSelect;
export type InsertDoctorNote = z.infer<typeof insertDoctorNoteSchema>;
