import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { authenticateExpressRequest } from "../../middleware/auth";
import logger from "../../monitoring/logger";
import tasksRouter from "./tasks/route";
import subtasksRouter from "./tasks/subtasks/route";
import labelsRouter from "./labels-route";
import viewsRouter from "./views-route";
import customFieldsRouter from "./custom-fields-route";

const router = Router();

// Middleware to ensure user is authenticated
router.use(authenticateExpressRequest);

// Sub-routers
router.use("/:workspaceId/custom-fields", customFieldsRouter);
router.use("/", labelsRouter);
router.use("/tasks/subtasks", subtasksRouter);
router.use("/tasks", tasksRouter);
router.use("/:workspaceId/views", viewsRouter);

// GET /api/workspaces/:workspaceId/search - Search for mentions
router.get("/:workspaceId/search", async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const query = req.query.q as string || "";
    const limit = parseInt(req.query.limit as string || "20", 10);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!query.trim()) {
      return res.json({ results: [] });
    }

    // Search users in workspace
    const users = await prisma.workspaceMember.findMany({
      where: {
        workspace_id: workspaceId,
        user: {
          OR: [
            { full_name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            bio: true,
          },
        },
      },
      take: Math.floor(limit / 4),
    });

    // Search projects (spaces) in workspace
    const projects = await prisma.project.findMany({
      where: {
        workspace_id: workspaceId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
      },
      take: Math.floor(limit / 4),
    });

    // Search tasks in workspace
    const tasks = await prisma.workspaceTask.findMany({
      where: {
        workspace_id: workspaceId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
      },
      take: Math.floor(limit / 4),
    });

    // Format results
    const results = [
      ...users.map((member: any) => ({
        id: member.user.id,
        type: "user" as const,
        title: member.user.full_name || member.user.email,
        subtitle: member.user.bio || member.user.email,
      })),
      ...projects.map((project: any) => ({
        id: project.id,
        type: "space" as const,
        title: project.title,
        subtitle: project.description || project.status,
      })),
      ...tasks.map((task: any) => ({
        id: task.id,
        type: "task" as const,
        title: task.title,
        subtitle: `${task.status} • ${task.priority} priority`,
      })),
    ];

    return res.json({ results });
  } catch (error) {
    logger.error("Search error:", error);
    return res.status(500).json({ error: "Failed to search" });
  }
});

// GET /api/workspaces/:id/analytics - Get workspace analytics with project metrics
router.get("/:id/analytics", async (req: any, res) => {
  try {
    const { id } = req.params;
    const {
      WorkspaceAnalyticsService,
    } = require("../../services/WorkspaceAnalyticsService");
    const analytics =
      await WorkspaceAnalyticsService.getWorkspaceAnalyticsWithProjects(id);
    res.json(analytics);
  } catch (error) {
    logger.error("Error fetching workspace analytics", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// GET /api/workspaces/:id/members - Get only members for selection
router.get("/:id/members", async (req: any, res) => {
  try {
    const { id } = req.params;
    const members = await prisma.workspaceMember.findMany({
      where: { workspace_id: id },
      include: {
        user: {
          select: { id: true, full_name: true, email: true },
        },
      },
    });
    res.json(members.map((m: any) => m.user));
  } catch (error) {
    logger.error("Error fetching workspace members", error);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// GET /api/workspaces - List all workspaces for the current user
router.get("/", async (req: any, res) => {
  try {
    const userId = req.user.id;
    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [{ owner_id: userId }, { members: { some: { user_id: userId } } }],
      },
      include: {
        owner: { select: { id: true, full_name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, full_name: true, email: true } },
          },
        },
        _count: { select: { projects: true } },
      },
    });
    res.json(workspaces);
  } catch (error) {
    logger.error("Error fetching workspaces", error);
    res.status(500).json({ error: "Failed to fetch workspaces" });
  }
});

// GET /api/workspaces/:id/projects - Get projects in workspace
router.get("/:id/projects", async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify user has access to workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspace_id: id,
        user_id: userId,
      },
    });

    if (!membership) {
      return res.status(403).json({ error: "Access denied" });
    }

    const projects = await prisma.project.findMany({
      where: {
        workspace_id: id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        created_at: true,
        updated_at: true,
        workspace_id: true,
      },
      orderBy: { updated_at: "desc" },
    });

    res.json({ projects });
  } catch (error) {
    logger.error("Error fetching workspace projects", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// GET /api/workspaces/:id/tasks - Get tasks in workspace
router.get("/:id/tasks", async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify user has access to workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspace_id: id,
        user_id: userId,
      },
    });

    if (!membership) {
      return res.status(403).json({ error: "Access denied" });
    }

    const tasks = await prisma.workspaceTask.findMany({
      where: {
        workspace_id: id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        created_at: true,
        updated_at: true,
        workspace_id: true,
        project_id: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.json({ tasks });
  } catch (error) {
    logger.error("Error fetching workspace tasks", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// GET /api/workspaces/:id/metrics - Get recent activity and stats
router.get("/:id/metrics", async (req: any, res) => {
  try {
    const { id } = req.params;
    const {
      WorkspaceTaskService,
    } = require("../../services/workspaceTaskService");
    const { ProjectService } = require("../../services/projectService");

    const [recentTasks, recentProjects] = await Promise.all([
      WorkspaceTaskService.getRecentActivity(id, 10),
      ProjectService.getRecentProjects(req.user.id, 5),
    ]);

    res.json({
      recentTasks,
      recentProjects,
    });
  } catch (error) {
    logger.error("Error fetching workspace metrics", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// POST /api/workspaces - Create a new workspace
router.post("/", async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { name, description, icon } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        icon,
        owner_id: userId,
        members: {
          create: {
            user_id: userId,
            role: "admin",
          },
        },
      },
    });

    res.json(workspace);
  } catch (error) {
    logger.error("Error creating workspace", error);
    res.status(500).json({ error: "Failed to create workspace" });
  }
});

// GET /api/workspaces/:id - Get specific workspace
router.get("/:id", async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        OR: [{ owner_id: userId }, { members: { some: { user_id: userId } } }],
      },
      include: {
        projects: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone_number: true,
                field_of_study: true,
              },
            },
          },
        },
      },
    });

    if (!workspace)
      return res.status(404).json({ error: "Workspace not found" });

    res.json(workspace);
  } catch (error) {
    logger.error("Error fetching workspace", error);
    res.status(500).json({ error: "Failed to fetch workspace" });
  }
});

// POST /api/workspaces/:id/invite - Invite a member by email
router.post("/:id/invite", async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { email, role = "viewer" } = req.body;

    // Check permissions (must be admin or owner)
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspace_id_user_id: { workspace_id: id, user_id: userId } },
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { owner: { select: { full_name: true, email: true } } },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    if (workspace.owner_id !== userId && membership?.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    // Check if user exists
    const userToInvite = await prisma.user.findUnique({ where: { email } });
    if (!userToInvite) {
      return res.status(404).json({ error: "User not found with that email" });
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: { workspace_id: id, user_id: userToInvite.id },
      },
    });
    if (existingMember) {
      return res.status(400).json({ error: "User is already a member" });
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.workspaceInvitation.findUnique({
      where: { workspace_id_email: { workspace_id: id, email } },
    });

    if (existingInvite && existingInvite.status === "pending") {
      return res.status(400).json({ error: "Invitation already sent" });
    }

    // Create invitation (7 days expiry)
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspace_id: id,
        email,
        role,
        invited_by: userId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Send email notification
    try {
      const EmailService = require("../../services/emailService").EmailService;
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      await EmailService.sendWorkspaceInvitation({
        to: email,
        workspaceName: workspace.name,
        inviterName: req.user.full_name || req.user.email,
        role,
        acceptUrl: `${frontendUrl}/workspaces/accept/${invitation.token}`,
        expiresAt: invitation.expires_at,
      });
    } catch (emailError) {
      logger.error("Failed to send invitation email:", emailError);
      // Continue even if email fails - user can still see invitation in dashboard
    }

    res.json({
      message: "Invitation sent successfully",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
      },
    });
  } catch (error) {
    logger.error("Error inviting member", error);
    res.status(500).json({ error: "Failed to send invitation" });
  }
});

// GET /api/workspaces/invitations/pending - Get pending invitations for current user
router.get("/invitations/pending", async (req: any, res) => {
  try {
    const email = req.user.email;
    const invitations = await prisma.workspaceInvitation.findMany({
      where: {
        email,
        status: "pending",
        expires_at: { gt: new Date() },
      },
      include: {
        workspace: {
          select: { id: true, name: true, description: true },
        },
        inviter: {
          select: { full_name: true, email: true },
        },
      },
      orderBy: { created_at: "desc" },
    });
    res.json(invitations);
  } catch (error) {
    logger.error("Error fetching pending invitations", error);
    res.status(500).json({ error: "Failed to fetch invitations" });
  }
});

// POST /api/workspaces/invitations/:token/accept - Accept workspace invitation
router.post("/invitations/:token/accept", async (req: any, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;
    const userEmail = req.user.email;

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (invitation.email !== userEmail) {
      return res
        .status(403)
        .json({ error: "This invitation is for a different email" });
    }

    if (invitation.status !== "pending") {
      return res
        .status(400)
        .json({ error: `Invitation already ${invitation.status}` });
    }

    if (invitation.expires_at < new Date()) {
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      });
      return res.status(410).json({ error: "Invitation has expired" });
    }

    // Add user to workspace
    const member = await prisma.workspaceMember.create({
      data: {
        workspace_id: invitation.workspace_id,
        user_id: userId,
        role: invitation.role,
      },
    });

    // Mark invitation as accepted
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: "accepted" },
    });

    res.json({
      message: "Invitation accepted successfully",
      workspace: invitation.workspace,
      member,
    });
  } catch (error) {
    logger.error("Error accepting invitation", error);
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});

// POST /api/workspaces/invitations/:token/decline - Decline workspace invitation
router.post("/invitations/:token/decline", async (req: any, res) => {
  try {
    const { token } = req.params;
    const userEmail = req.user.email;

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (invitation.email !== userEmail) {
      return res
        .status(403)
        .json({ error: "This invitation is for a different email" });
    }

    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: "declined" },
    });

    res.json({ message: "Invitation declined" });
  } catch (error) {
    logger.error("Error declining invitation", error);
    res.status(500).json({ error: "Failed to decline invitation" });
  }
});

// GET /api/workspaces/:id/activity - Aggregated workspace activity log
router.get("/:id/activity", async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const typeFilter = req.query.type as string | undefined;

    // Verify access
    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        OR: [{ owner_id: userId }, { members: { some: { user_id: userId } } }],
      },
    });
    if (!workspace) {
      return res
        .status(403)
        .json({ error: "Not authorised or workspace not found" });
    }

    const userSelect = { id: true, full_name: true, email: true };

    const [tasks, comments, members, projects] = await Promise.all([
      // Tasks created in this workspace
      !typeFilter || typeFilter === "task"
        ? prisma.workspaceTask.findMany({
            where: { workspace_id: id, is_template: false },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              created_at: true,
              updated_at: true,
              creator: { select: userSelect },
            },
            orderBy: { created_at: "desc" },
            take: 100,
          })
        : [],

      // Task comments
      !typeFilter || typeFilter === "comment"
        ? prisma.taskComment.findMany({
            where: { task: { workspace_id: id } },
            select: {
              id: true,
              content: true,
              created_at: true,
              user: { select: userSelect },
              task: { select: { id: true, title: true } },
            },
            orderBy: { created_at: "desc" },
            take: 100,
          })
        : [],

      // Member join events
      !typeFilter || typeFilter === "member"
        ? prisma.workspaceMember.findMany({
            where: { workspace_id: id },
            select: {
              id: true,
              role: true,
              joined_at: true,
              user: { select: userSelect },
            },
            orderBy: { joined_at: "desc" },
            take: 50,
          })
        : [],

      // Projects created
      !typeFilter || typeFilter === "project"
        ? prisma.project.findMany({
            where: { workspace_id: id },
            select: {
              id: true,
              title: true,
              created_at: true,
              status: true,
              user: { select: userSelect },
            },
            orderBy: { created_at: "desc" },
            take: 50,
          })
        : [],
    ]);

    // Normalize into a unified event shape
    const events: any[] = [
      ...tasks.map((t: any) => ({
        id: `task-${t.id}`,
        type: "task",
        action: "created",
        actor: t.creator,
        target: {
          id: t.id,
          label: t.title,
          meta: `${t.priority} priority · ${t.status}`,
        },
        timestamp: t.created_at,
      })),
      ...comments.map((c: any) => ({
        id: `comment-${c.id}`,
        type: "comment",
        action: "commented",
        actor: c.user,
        target: {
          id: c.task.id,
          label: c.task.title,
          meta: c.content.slice(0, 80),
        },
        timestamp: c.created_at,
      })),
      ...members.map((m: any) => ({
        id: `member-${m.id}`,
        type: "member",
        action: "joined",
        actor: m.user,
        target: { id: id, label: workspace.name, meta: `Role: ${m.role}` },
        timestamp: m.joined_at,
      })),
      ...projects.map((p: any) => ({
        id: `project-${p.id}`,
        type: "project",
        action: "created",
        actor: p.user,
        target: { id: p.id, label: p.title, meta: p.status },
        timestamp: p.created_at,
      })),
    ];

    // Sort by timestamp descending and paginate
    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const paginated = events.slice(offset, offset + limit);

    res.json({ events: paginated, total: events.length });
  } catch (error) {
    logger.error("Error fetching workspace activity", error);
    res.status(500).json({ error: "Failed to fetch activity log" });
  }
});

// PATCH /api/workspaces/:id - Update workspace (owner or admin only)
router.patch("/:id", async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, icon } = req.body;

    // Only allow name/description/icon updates
    if (!name && description === undefined && icon === undefined) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    // Check permissions (must be owner or admin member)
    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        OR: [
          { owner_id: userId },
          { members: { some: { user_id: userId, role: "admin" } } },
        ],
      },
    });

    if (!workspace) {
      return res
        .status(403)
        .json({ error: "Not authorised or workspace not found" });
    }

    const updated = await prisma.workspace.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
      },
    });

    res.json(updated);
  } catch (error) {
    logger.error("Error updating workspace", error);
    res.status(500).json({ error: "Failed to update workspace" });
  }
});

// DELETE /api/workspaces/:id - Delete workspace (owner only)
router.delete("/:id", async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Only the owner can delete
    const workspace = await prisma.workspace.findFirst({
      where: { id, owner_id: userId },
    });

    if (!workspace) {
      return res
        .status(403)
        .json({ error: "Only the workspace owner can delete it" });
    }

    // Prisma schema uses onDelete: Cascade on all workspace relations
    await prisma.workspace.delete({ where: { id } });

    res.json({ message: "Workspace deleted successfully" });
  } catch (error) {
    logger.error("Error deleting workspace", error);
    res.status(500).json({ error: "Failed to delete workspace" });
  }
});

// PATCH /api/workspaces/:id/members/:userId - Update member role
router.patch("/:id/members/:userId", async (req: any, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const { role } = req.body;
    const requesterId = req.user.id;

    if (!["admin", "editor", "viewer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check permissions: Requester must be owner or admin
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          where: { user_id: requesterId },
        },
      },
    });

    if (!workspace)
      return res.status(404).json({ error: "Workspace not found" });

    const isOwner = workspace.owner_id === requesterId;
    const isAdmin = workspace.members[0]?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    // Prevent modifying owner's role
    if (workspace.owner_id === targetUserId) {
      return res
        .status(403)
        .json({ error: "Cannot change the role of the workspace owner" });
    }

    // Update the member role
    const updatedMember = await prisma.workspaceMember.update({
      where: {
        workspace_id_user_id: {
          workspace_id: id,
          user_id: targetUserId,
        },
      },
      data: { role },
      include: { user: { select: { id: true, full_name: true, email: true } } },
    });

    res.json(updatedMember);
  } catch (error) {
    logger.error("Error updating member role", error);
    res.status(500).json({ error: "Failed to update member role" });
  }
});

// DELETE /api/workspaces/:id/members/:userId - Remove member
router.delete("/:id/members/:userId", async (req: any, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const requesterId = req.user.id;

    // Check permissions
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          where: { user_id: requesterId },
        },
      },
    });

    if (!workspace)
      return res.status(404).json({ error: "Workspace not found" });

    const isOwner = workspace.owner_id === requesterId;
    const isAdmin = workspace.members[0]?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    // Prevent removing owner
    if (workspace.owner_id === targetUserId) {
      return res
        .status(403)
        .json({ error: "Cannot remove the workspace owner" });
    }

    // Remove the member
    await prisma.workspaceMember.delete({
      where: {
        workspace_id_user_id: {
          workspace_id: id,
          user_id: targetUserId,
        },
      },
    });

    res.json({ success: true, message: "Member removed" });
  } catch (error) {
    logger.error("Error removing member", error);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

export default router;
