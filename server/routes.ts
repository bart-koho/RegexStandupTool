import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTeamMemberSchema, responseSchema } from "@shared/schema";
import { generateActivationToken, sendActivationEmail } from "./email";
import { nanoid } from "nanoid";

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

    // Create user account first
    const username = `${parsed.data.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${nanoid(6)}`;
    const activationToken = generateActivationToken();

    try {
      const user = await storage.createUser({
        username,
        email: parsed.data.email,
        role: "team_member",
        activationToken,
      });

      const member = await storage.createTeamMember(req.user!.id, {
        name: parsed.data.name,
        email: parsed.data.email,
      });

      // Send activation email
      const emailSent = await sendActivationEmail(
        parsed.data.email,
        parsed.data.name,
        activationToken
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
      res.status(500).json({ message: 'Failed to delete team member' });
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

  // Keep existing routes
  app.post("/api/standups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const date = new Date().toISOString().split("T")[0];
    const standups = await storage.getStandupsByUser(req.user!.id);
    const identifier = `${date}-#${(standups.length + 1).toString().padStart(3, "0")}`;

    const standup = await storage.createStandup(req.user!.id, { identifier });
    res.status(201).json(standup);
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
    const standups = await storage.getStandupsByUser(req.user!.id);
    res.json(standups);
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