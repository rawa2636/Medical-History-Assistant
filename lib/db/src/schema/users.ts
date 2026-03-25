import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const universitiesTable = pgTable("universities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull().default("SA"),
  accessCode: text("access_code").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const universityStudentsTable = pgTable("university_students", {
  id: serial("id").primaryKey(),
  universityId: integer("university_id").notNull().references(() => universitiesTable.id),
  fullName: text("full_name").notNull(),
  universityCardNumber: text("university_card_number").notNull(),
  studyYear: integer("study_year"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doctorsTable = pgTable("doctors", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  specialization: text("specialization").notNull(),
  licenseNumber: text("license_number").notNull(),
  country: text("country").notNull().default("SA"),
  city: text("city"),
  workplaceType: text("workplace_type").notNull().default("private"),
  workplace: text("workplace"),
  yearsOfExperience: integer("years_of_experience"),
  bio: text("bio"),
  licenseFileUrl: text("license_file_url"),
  certificateFileUrl: text("certificate_file_url"),
  profilePhotoUrl: text("profile_photo_url"),
  verificationStatus: text("verification_status").notNull().default("pending"),
  verificationNote: text("verification_note"),
  verifiedAt: timestamp("verified_at"),
  isVolunteer: boolean("is_volunteer").notNull().default(false),
  acceptsPaidCases: boolean("accepts_paid_cases").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const medicalStudentsTable = pgTable("medical_students", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  universityId: integer("university_id").references(() => universitiesTable.id),
  universityCardNumber: text("university_card_number").notNull(),
  studyYear: integer("study_year").notNull(),
  cardPhotoUrl: text("card_photo_url"),
  verificationStatus: text("verification_status").notNull().default("pending"),
  verificationNote: text("verification_note"),
  verifiedAt: timestamp("verified_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUniversitySchema = createInsertSchema(universitiesTable).omit({ id: true, createdAt: true });
export const insertUniversityStudentSchema = createInsertSchema(universityStudentsTable).omit({ id: true, createdAt: true });
export const insertDoctorSchema = createInsertSchema(doctorsTable).omit({ id: true, createdAt: true, updatedAt: true, verificationStatus: true, verifiedAt: true });
export const insertMedicalStudentSchema = createInsertSchema(medicalStudentsTable).omit({ id: true, createdAt: true, updatedAt: true, verificationStatus: true, verifiedAt: true });

export type University = typeof universitiesTable.$inferSelect;
export type UniversityStudent = typeof universityStudentsTable.$inferSelect;
export type Doctor = typeof doctorsTable.$inferSelect;
export type MedicalStudent = typeof medicalStudentsTable.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type InsertMedicalStudent = z.infer<typeof insertMedicalStudentSchema>;
