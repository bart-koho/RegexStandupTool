import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  role: text("role").notNull().default("team_member"),
  status: text("status").notNull().default("inactive"),
  activationToken: text("activation_token"),
  email: text("email").notNull().unique(),
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
  description: text("description"),
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

export const standupReactions = pgTable("standup_reactions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => standupAssignments.id),
  userId: integer("user_id").notNull().references(() => users.id),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const standupComments = pgTable("standup_comments", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => standupAssignments.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  standups: many(standups),
  reactions: many(standupReactions),
  comments: many(standupComments),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const standupsRelations = relations(standups, ({ one, many }) => ({
  user: one(users, {
    fields: [standups.userId],
    references: [users.id],
  }),
  assignments: many(standupAssignments),
}));

export const standupAssignmentsRelations = relations(standupAssignments, ({ one, many }) => ({
  standup: one(standups, {
    fields: [standupAssignments.standupId],
    references: [standups.id],
  }),
  teamMember: one(teamMembers, {
    fields: [standupAssignments.teamMemberId],
    references: [teamMembers.id],
  }),
  reactions: many(standupReactions),
  comments: many(standupComments),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers)
  .pick({
    name: true,
    email: true,
  })
  .extend({
    email: z.string().email(),
  });

export const insertStandupSchema = z.object({
  description: z.string().optional(),
});

export const responseSchema = z.object({
  response: z.string().min(1, "Please provide your update"),
});

export const insertReactionSchema = createInsertSchema(standupReactions)
  .pick({
    assignmentId: true,
    emoji: true,
  });

export const insertCommentSchema = createInsertSchema(standupComments)
  .pick({
    assignmentId: true,
    content: true,
  })
  .extend({
    content: z.string().min(1, "Comment cannot be empty"),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type User = typeof users.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Standup = typeof standups.$inferSelect;
export type StandupAssignment = typeof standupAssignments.$inferSelect;
export type StandupResponse = z.infer<typeof responseSchema>;
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type StandupReaction = typeof standupReactions.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type StandupComment = typeof standupComments.$inferSelect;