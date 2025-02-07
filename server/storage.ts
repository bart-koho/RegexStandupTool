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
import { hashPassword } from "./auth";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session'
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

  async createUser(insertUser: Partial<InsertUser> & { activationToken?: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      username: insertUser.username!,
      email: insertUser.email!,
      password: insertUser.password,
      role: insertUser.role || 'team_member',
      status: insertUser.role === 'admin' ? 'active' : 'inactive',
      activationToken: insertUser.activationToken,
    }).returning();
    return user;
  }

  async activateUser(token: string, password: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.activationToken, token));

    if (!user) return false;

    const hashedPassword = await hashPassword(password);

    await db
      .update(users)
      .set({
        password: hashedPassword,
        status: 'active',
        activationToken: null,
      })
      .where(eq(users.id, user.id));

    await db
      .update(teamMembers)
      .set({ active: true })
      .where(eq(teamMembers.userId, user.id));

    return true;
  }

  async createTeamMember(
    userId: number,
    member: Omit<TeamMember, "id" | "userId" | "active">,
  ): Promise<TeamMember> {
    const [teamMember] = await db
      .insert(teamMembers)
      .values({
        name: member.name,
        email: member.email,
        userId,
        active: false,
      })
      .returning();
    return teamMember;
  }

  async getTeamMembers(userId: number): Promise<TeamMember[]> {
    return await db
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
    return await db
      .select()
      .from(standups)
      .where(eq(standups.userId, userId));
  }

  async getStandupAssignments(standupId: number): Promise<StandupAssignment[]> {
    return await db
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

  async deleteTeamMember(id: number): Promise<void> {
    // First get the team member to find their userId
    const [teamMember] = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, id));

    if (teamMember) {
      // Delete the team member first (due to foreign key constraint)
      await db.delete(teamMembers).where(eq(teamMembers.id, id));

      // Then delete the associated user
      await db.delete(users).where(eq(users.id, teamMember.userId));
    }
  }
}

export const storage = new DatabaseStorage();