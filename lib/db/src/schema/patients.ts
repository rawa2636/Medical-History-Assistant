import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age"),
  gender: text("gender"),
  occupation: text("occupation"),
  weight: text("weight"),
  height: text("height"),
  maritalStatus: text("marital_status"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const patientProfilesTable = pgTable("patient_profiles", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  chronicConditions: text("chronic_conditions").array().default([]),
  surgicalHistory: text("surgical_history").array().default([]),
  currentMedications: jsonb("current_medications").default([]),
  allergies: jsonb("allergies").default([]),
  familyHistory: jsonb("family_history").default({}),
  smokingStatus: text("smoking_status"),
  alcoholUse: text("alcohol_use"),
  occupation: text("occupation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPatientProfileSchema = createInsertSchema(patientProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });

export type Patient = typeof patientsTable.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type PatientProfile = typeof patientProfilesTable.$inferSelect;
export type InsertPatientProfile = z.infer<typeof insertPatientProfileSchema>;
