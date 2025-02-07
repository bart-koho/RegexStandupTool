import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTeamMemberSchema, responseSchema, users, standups, teamMembers, standupAssignments, insertReactionSchema, standupReactions, insertCommentSchema, standupComments } from "@shared/schema";
import { generateActivationToken, sendActivationEmail } from "./email";
import { nanoid } from "nanoid";
import { eq, desc, sql, inArray, and } from 'drizzle-orm';
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

    try {
      // If standupId is provided, return all team members for that standup
      const standupId = req.query.standupId;
      if (standupId) {
        const assignments = await db
          .select({
            teamMemberId: standupAssignments.teamMemberId
          })
          .from(standupAssignments)
          .where(eq(standupAssignments.standupId, parseInt(standupId as string)));

        const teamMemberIds = assignments.map(a => a.teamMemberId);
        const members = await db
          .select()
          .from(teamMembers)
          .where(inArray(teamMembers.id, teamMemberIds));

        return res.json(members);
      }

      // Otherwise return all team members
      const members = await db
        .select()
        .from(teamMembers);

      return res.json(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      res.status(500).json({ message: 'Failed to fetch team members' });
    }
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

      // Get total count first
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(standups);

      // Get standups with their assignment stats
      const items = await db
        .select({
          standup: standups,
          stats: sql<{ totalAssignments: number; completedResponses: number }>`
            json_build_object(
              'totalAssignments', (
                SELECT COUNT(DISTINCT team_member_id)::int 
                FROM standup_assignments sa
                WHERE sa.standup_id = standups.id
              ),
              'completedResponses', (
                SELECT COUNT(*)::int 
                FROM standup_assignments sa
                WHERE sa.standup_id = standups.id 
                AND sa.status = 'completed'
              )
            )
          `
        })
        .from(standups)
        .orderBy(desc(standups.createdAt))
        .limit(pageSize)
        .offset(offset);

      return res.json({
        items: items.map(item => ({
          ...item.standup,
          stats: item.stats
        })),
        pagination: {
          page,
          pageSize,
          totalItems: countResult.count,
          totalPages: Math.ceil(countResult.count / pageSize),
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

  app.patch("/api/responses/:responseUrl", async (req, res) => {
    const parsed = responseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const assignment = await db
      .update(standupAssignments)
      .set({ 
        response: parsed.data,
        // Don't change the status since it's already completed
      })
      .where(eq(standupAssignments.responseUrl, req.params.responseUrl))
      .returning();

    if (!assignment || assignment.length === 0) {
      return res.status(404).json({ message: "Response URL not found" });
    }

    res.json(assignment[0]);
  });

  // Add reaction to a standup response
  app.post("/api/responses/:id/reactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parsed = insertReactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    try {
      // Check if user already reacted with this emoji
      const existingReaction = await db
        .select()
        .from(standupReactions)
        .where(
          and(
            eq(standupReactions.assignmentId, parseInt(req.params.id)),
            eq(standupReactions.userId, req.user!.id),
            eq(standupReactions.emoji, parsed.data.emoji)
          )
        );

      if (existingReaction.length > 0) {
        // If reaction exists, remove it (toggle behavior)
        await db
          .delete(standupReactions)
          .where(eq(standupReactions.id, existingReaction[0].id));
        return res.json({ removed: true });
      }

      // Add new reaction
      const [reaction] = await db
        .insert(standupReactions)
        .values({
          assignmentId: parseInt(req.params.id),
          userId: req.user!.id,
          emoji: parsed.data.emoji,
        })
        .returning();

      res.status(201).json(reaction);
    } catch (error) {
      console.error('Error managing reaction:', error);
      res.status(500).json({ message: 'Failed to manage reaction' });
    }
  });

  // Get reactions for a standup response
  app.get("/api/responses/:id/reactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const reactions = await db
        .select({
          reaction: standupReactions,
          user: {
            id: users.id,
            username: users.username,
          },
        })
        .from(standupReactions)
        .innerJoin(users, eq(users.id, standupReactions.userId))
        .where(eq(standupReactions.assignmentId, parseInt(req.params.id)));

      // Group reactions by emoji
      const groupedReactions = reactions.reduce((acc, { reaction, user }) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(user);
        return acc;
      }, {} as Record<string, typeof reactions[0]['user'][]>);

      res.json(groupedReactions);
    } catch (error) {
      console.error('Error fetching reactions:', error);
      res.status(500).json({ message: 'Failed to fetch reactions' });
    }
  });

  // Get comments for a standup response
  app.get("/api/responses/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const comments = await db
        .select({
          comment: standupComments,
          user: {
            id: users.id,
            username: users.username,
          },
        })
        .from(standupComments)
        .innerJoin(users, eq(users.id, standupComments.userId))
        .where(eq(standupComments.assignmentId, parseInt(req.params.id)))
        .orderBy(desc(standupComments.createdAt));

      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  });

  // Add a comment to a standup response
  app.post("/api/responses/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parsed = insertCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    try {
      const [comment] = await db
        .insert(standupComments)
        .values({
          assignmentId: parseInt(req.params.id),
          userId: req.user!.id,
          content: parsed.data.content,
        })
        .returning();

      // Return the comment with the user information
      const [commentWithUser] = await db
        .select({
          comment: standupComments,
          user: {
            id: users.id,
            username: users.username,
          },
        })
        .from(standupComments)
        .innerJoin(users, eq(users.id, standupComments.userId))
        .where(eq(standupComments.id, comment.id));

      res.status(201).json(commentWithUser);
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ message: 'Failed to add comment' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}