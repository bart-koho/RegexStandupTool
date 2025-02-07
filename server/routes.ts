import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTeamMemberSchema, responseSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Team member routes
  app.post("/api/team-members", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const parsed = insertTeamMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const member = await storage.createTeamMember(req.user!.id, parsed.data);
    res.status(201).json(member);
  });

  app.get("/api/team-members", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const members = await storage.getTeamMembers(req.user!.id);
    res.json(members);
  });

  // Standup routes
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
