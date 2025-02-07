import { IStorage } from "./types";
import {
  User,
  TeamMember,
  Standup,
  StandupAssignment,
  InsertUser,
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { randomBytes } from "crypto";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teamMembers: Map<number, TeamMember>;
  private standups: Map<number, Standup>;
  private assignments: Map<number, StandupAssignment>;
  private currentIds: { [key: string]: number };
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.teamMembers = new Map();
    this.standups = new Map();
    this.assignments = new Map();
    this.currentIds = {
      users: 1,
      teamMembers: 1,
      standups: 1,
      assignments: 1,
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  async createTeamMember(
    userId: number,
    member: Omit<TeamMember, "id" | "userId" | "active">,
  ): Promise<TeamMember> {
    const id = this.currentIds.teamMembers++;
    const teamMember = { id, userId, active: true, ...member };
    this.teamMembers.set(id, teamMember);
    return teamMember;
  }

  async getTeamMembers(userId: number): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values()).filter(
      (member) => member.userId === userId && member.active,
    );
  }

  async createStandup(
    userId: number,
    standup: Omit<Standup, "id" | "userId" | "createdAt" | "status">,
  ): Promise<Standup> {
    const id = this.currentIds.standups++;
    const newStandup = {
      id,
      userId,
      createdAt: new Date(),
      status: "draft",
      ...standup,
    };
    this.standups.set(id, newStandup);
    return newStandup;
  }

  async assignTeamMembers(
    standupId: number,
    teamMemberIds: number[],
  ): Promise<StandupAssignment[]> {
    const assignments: StandupAssignment[] = [];

    for (const teamMemberId of teamMemberIds) {
      const id = this.currentIds.assignments++;
      const responseUrl = randomBytes(32).toString("hex");
      const assignment = {
        id,
        standupId,
        teamMemberId,
        responseUrl,
        status: "pending",
        response: null,
      };
      this.assignments.set(id, assignment);
      assignments.push(assignment);
    }

    return assignments;
  }

  async getStandupsByUser(userId: number): Promise<Standup[]> {
    return Array.from(this.standups.values()).filter(
      (standup) => standup.userId === userId,
    );
  }

  async getStandupAssignments(standupId: number): Promise<StandupAssignment[]> {
    return Array.from(this.assignments.values()).filter(
      (assignment) => assignment.standupId === standupId,
    );
  }

  async submitResponse(
    responseUrl: string,
    response: any,
  ): Promise<StandupAssignment | undefined> {
    const assignment = Array.from(this.assignments.values()).find(
      (a) => a.responseUrl === responseUrl,
    );

    if (assignment) {
      const updated = {
        ...assignment,
        response,
        status: "completed",
      };
      this.assignments.set(assignment.id, updated);
      return updated;
    }

    return undefined;
  }
}

export const storage = new MemStorage();
