import type {
  User,
  TeamMember,
  Standup,
  StandupAssignment,
  InsertUser,
} from "@shared/schema";
import type { Store } from "express-session";

export interface IStorage {
  sessionStore: Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser> & { activationToken?: string }): Promise<User>;
  activateUser(token: string, password: string): Promise<boolean>;
  createTeamMember(
    userId: number,
    member: Omit<TeamMember, "id" | "userId" | "active">,
  ): Promise<TeamMember>;
  getTeamMembers(userId: number): Promise<TeamMember[]>;
  createStandup(
    userId: number,
    standup: Omit<Standup, "id" | "userId" | "createdAt" | "status">,
  ): Promise<Standup>;
  assignTeamMembers(
    standupId: number,
    teamMemberIds: number[],
  ): Promise<StandupAssignment[]>;
  getStandupsByUser(userId: number): Promise<Standup[]>;
  getStandupAssignments(standupId: number): Promise<StandupAssignment[]>;
  submitResponse(
    responseUrl: string,
    response: any,
  ): Promise<StandupAssignment | undefined>;
}