import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  active: boolean("active").notNull().default(true),
  userId: integer("user_id").notNull().references(() => users.id),
});

export const standups = pgTable("standups", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("draft"),
});

export const standupAssignments = pgTable("standup_assignments", {
  id: serial("id").primaryKey(),
  standupId: integer("standup_id").notNull().references(() => standups.id),
  teamMemberId: integer("team_member_id").notNull().references(() => teamMembers.id),
  responseUrl: text("response_url").notNull().unique(),
  status: text("status").notNull().default("pending"),
  response: json("response").default(null),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers)
  .pick({
    name: true,
    email: true,
  })
  .extend({
    email: z.string().email(),
  });

export const insertStandupSchema = createInsertSchema(standups).pick({
  identifier: true,
});

export const responseSchema = z.object({
  accomplishments: z.string(),
  blockers: z.string(),
  plans: z.string(),
  help: z.string(),
  notes: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type User = typeof users.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Standup = typeof standups.$inferSelect;
export type StandupAssignment = typeof standupAssignments.$inferSelect;
export type StandupResponse = z.infer<typeof responseSchema>;