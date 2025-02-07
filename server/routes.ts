import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTeamMemberSchema, responseSchema, users, standups, teamMembers, standupAssignments } from "@shared/schema";
import { generateActivationToken, sendActivationEmail } from "./email";
import { nanoid } from "nanoid";
import { eq, desc, sql } from 'drizzle-orm';
import { db } from './db';

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Team member routes
  app.post("/api/team-members", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user?.role !== 'admin') return res.sendStatus(403);

    const parsed = insertTeamMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    try {
      // Check if user with email already exists
      const existingUser = await storage.getUserByEmail(parsed.data.email);

      if (existingUser) {
        return res.status(400).json({ 
          message: 'A user with this email already exists' 
        });
      }

      // Create user account first
      const username = `${parsed.data.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${nanoid(6)}`;
      const activationToken = generateActivationToken();

      const user = await storage.createUser({
        username,
        email: parsed.data.email,
        role: "team_member",
        activationToken,
      });

      const member = await storage.createTeamMember(user.id, {
        name: parsed.data.name,
        email: parsed.data.email,
      });

      // Get the base URL from the request
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;

      // Send activation email
      const emailSent = await sendActivationEmail(
        parsed.data.email,
        parsed.data.name,
        activationToken,
        baseUrl
      );

      if (!emailSent) {
        // If email fails, still return success but log the error
        console.error('Failed to send activation email to:', parsed.data.email);
      }

      res.status(201).json(member);
    } catch (error) {
      console.error('Error creating team member:', error);
      res.status(500).json({ message: 'Failed to create team member' });
    }
  });

  app.get("/api/team-members", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user?.role !== 'admin') return res.sendStatus(403);

    const members = await storage.getTeamMembers(req.user!.id);
    res.json(members);
  });

  app.delete("/api/team-members/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user?.role !== 'admin') return res.sendStatus(403);

    try {
      await storage.deleteTeamMember(parseInt(req.params.id));
      res.sendStatus(200);
    } catch (error) {
      console.error('Error deleting team member:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to delete team member' 
      });
    }
  });

  // Add activation endpoint
  app.post("/api/activate", async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    const success = await storage.activateUser(token, password);
    if (!success) {
      return res.status(400).json({ message: "Invalid or expired activation token" });
    }

    res.status(200).json({ message: "Account activated successfully" });
  });

  // Add GET endpoint for single standup
  app.get("/api/standups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const standup = await db
        .select()
        .from(standups)
        .where(eq(standups.id, parseInt(req.params.id)))
        .limit(1);

      if (!standup || standup.length === 0) {
        return res.status(404).json({ message: "Standup not found" });
      }

      res.json(standup[0]);
    } catch (error) {
      console.error('Error fetching standup:', error);
      res.status(500).json({ message: 'Failed to fetch standup' });
    }
  });

  app.post("/api/standups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user?.role !== 'admin') return res.sendStatus(403);

    try {
      const date = new Date().toISOString().split("T")[0];
      const standups = await storage.getStandupsByUser(req.user!.id);
      const identifier = `${date}-#${(standups.length + 1).toString().padStart(3, "0")}`;

      // Create the standup with description
      const standup = await storage.createStandup(req.user!.id, { 
        identifier,
        description: req.body.description || null
      });

      // If team members were specified, assign them immediately
      if (req.body.teamMemberIds && Array.isArray(req.body.teamMemberIds)) {
        await storage.assignTeamMembers(standup.id, req.body.teamMemberIds);
      }

      res.status(201).json(standup);
    } catch (error) {
      console.error('Error creating standup:', error);
      res.status(500).json({ message: 'Failed to create standup' });
    }
  });

  app.post("/api/standups/:id/assign", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { teamMemberIds } = req.body;
    if (!Array.isArray(teamMemberIds)) {
      return res.status(400).json({ message: "teamMemberIds must be an array" });
    }

    const assignments = await storage.assignTeamMembers(
      parseInt(req.params.id),
      teamMemberIds,
    );
    res.json(assignments);
  });

  app.get("/api/standups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = 25;
      const offset = (page - 1) * pageSize;

      // First get the user's team member record if they're not an admin
      let query = db.select().from(standups);

      if (req.user?.role !== 'admin') {
        // For team members, only show standups they're assigned to
        const [teamMember] = await db
          .select()
          .from(teamMembers)
          .where(eq(teamMembers.userId, req.user!.id));

        if (!teamMember) {
          return res.json({
            items: [],
            pagination: {
              page,
              pageSize,
              totalItems: 0,
              totalPages: 0,
            },
          });
        }

        const assignedStandupIds = await db
          .select({ standupId: standupAssignments.standupId })
          .from(standupAssignments)
          .where(eq(standupAssignments.teamMemberId, teamMember.id));

        if (assignedStandupIds.length === 0) {
          return res.json({
            items: [],
            pagination: {
              page,
              pageSize,
              totalItems: 0,
              totalPages: 0,
            },
          });
        }

        query = query.where(
          sql`${standups.id} IN (${sql.join(
            assignedStandupIds.map(a => a.standupId)
          )})`
        );
      } else {
        // Admin sees all standups they created
        query = query.where(eq(standups.userId, req.user!.id));
      }

      // Get total count
      const [count] = await db
        .select({ count: sql`count(*)::int` })
        .from(query.as('subquery'));

      // Get paginated results
      const items = await query
        .orderBy(desc(standups.createdAt))
        .limit(pageSize)
        .offset(offset);

      res.json({
        items,
        pagination: {
          page,
          pageSize,
          totalItems: count.count,
          totalPages: Math.ceil(count.count / pageSize),
        },
      });
    } catch (error) {
      console.error('Error fetching standups:', error);
      res.status(500).json({ message: 'Failed to fetch standups' });
    }
  });

  app.get("/api/standups/:id/assignments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const assignments = await storage.getStandupAssignments(parseInt(req.params.id));
    res.json(assignments);
  });

  app.post("/api/responses/:responseUrl", async (req, res) => {
    const parsed = responseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const assignment = await storage.submitResponse(
      req.params.responseUrl,
      parsed.data,
    );

    if (!assignment) {
      return res.status(404).json({ message: "Response URL not found" });
    }

    res.json(assignment);
  });

  const httpServer = createServer(app);
  return httpServer;
}