import { IStorage } from "./types";
import {
  users,
  teamMembers,
  standups,
  standupAssignments,
  type User,
  type TeamMember,
  type Standup,
  type StandupAssignment,
  type InsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import crypto from 'crypto';

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createTeamMember(
    userId: number,
    member: Omit<TeamMember, "id" | "userId" | "active">,
  ): Promise<TeamMember> {
    const [teamMember] = await db
      .insert(teamMembers)
      .values({ ...member, userId, active: true })
      .returning();
    return teamMember;
  }

  async getTeamMembers(userId: number): Promise<TeamMember[]> {
    return db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId))
      .where(eq(teamMembers.active, true));
  }

  async createStandup(
    userId: number,
    standup: Omit<Standup, "id" | "userId" | "createdAt" | "status">,
  ): Promise<Standup> {
    const [newStandup] = await db
      .insert(standups)
      .values({
        ...standup,
        userId,
        status: "draft",
        createdAt: new Date(),
      })
      .returning();
    return newStandup;
  }

  async assignTeamMembers(
    standupId: number,
    teamMemberIds: number[],
  ): Promise<StandupAssignment[]> {
    const assignments = await Promise.all(
      teamMemberIds.map(async (teamMemberId) => {
        const [assignment] = await db
          .insert(standupAssignments)
          .values({
            standupId,
            teamMemberId,
            responseUrl: crypto.randomBytes(32).toString("hex"),
            status: "pending",
          })
          .returning();
        return assignment;
      }),
    );
    return assignments;
  }

  async getStandupsByUser(userId: number): Promise<Standup[]> {
    return db.select().from(standups).where(eq(standups.userId, userId));
  }

  async getStandupAssignments(standupId: number): Promise<StandupAssignment[]> {
    return db
      .select()
      .from(standupAssignments)
      .where(eq(standupAssignments.standupId, standupId));
  }

  async submitResponse(
    responseUrl: string,
    response: any,
  ): Promise<StandupAssignment | undefined> {
    const [assignment] = await db
      .update(standupAssignments)
      .set({ response, status: "completed" })
      .where(eq(standupAssignments.responseUrl, responseUrl))
      .returning();
    return assignment;
  }
}

export const storage = new DatabaseStorage();