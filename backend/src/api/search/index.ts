import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { authenticateExpressRequest } from "../../middleware/auth";
import logger from "../../monitoring/logger";

const router = Router();

// GET /api/search?q=query&limit=20 - Global search across all user's content
router.get("/", authenticateExpressRequest, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const query = req.query.q as string || "";
    const limit = parseInt(req.query.limit as string || "20", 10);

    if (!query.trim()) {
      return res.json({ 
        results: [],
        total: 0,
        categories: { workspaces: 0, projects: 0, tasks: 0 }
      });
    }

    const searchPattern = `%${query}%`;

    // Get all workspaces where user is a member
    const userWorkspaces = await prisma.workspaceMember.findMany({
      where: { user_id: userId },
      select: { workspace_id: true }
    });
    const workspaceIds = userWorkspaces.map((w : any) => w.workspace_id);

    if (workspaceIds.length === 0) {
      return res.json({ 
        results: [],
        total: 0,
        categories: { workspaces: 0, projects: 0, tasks: 0 }
      });
    }

    // Helper function for case-insensitive search using Prisma's contains
    const searchFilter = (field: string) => ({
      contains: query,
      mode: "insensitive" as const,
    });

    // Search workspaces
    const workspaces = await prisma.workspace.findMany({
      where: {
        id: { in: workspaceIds },
        OR: [
          { name: searchFilter("name") },
          { description: searchFilter("description") },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
      },
      take: Math.floor(limit / 3),
    });

    // Search projects (spaces) across all workspaces
    const projects = await prisma.project.findMany({
      where: {
        workspace_id: { in: workspaceIds },
        OR: [
          { title: searchFilter("title") },
          { description: searchFilter("description") },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        workspace_id: true,
        workspace: {
          select: { name: true }
        }
      },
      take: Math.floor(limit / 3),
    });

    // Search tasks across all workspaces
    const tasks = await prisma.workspaceTask.findMany({
      where: {
        workspace_id: { in: workspaceIds },
        OR: [
          { title: searchFilter("title") },
          { description: searchFilter("description") },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        workspace_id: true,
        workspace: {
          select: { name: true }
        }
      },
      take: Math.floor(limit / 3),
    });

    // Format results with scores for relevance
    const formatResults = (items: any[], type: string) => {
      return items.map(item => {
        let score = 0;
        const name = item.name || item.title || "";
        const desc = item.description || "";
        
        // Exact match gets highest score
        if (name.toLowerCase() === query.toLowerCase()) score += 100;
        // Starts with query gets high score
        else if (name.toLowerCase().startsWith(query.toLowerCase())) score += 80;
        // Contains query gets medium score
        else if (name.toLowerCase().includes(query.toLowerCase())) score += 50;
        // Description contains query
        if (desc.toLowerCase().includes(query.toLowerCase())) score += 20;

        return {
          id: item.id,
          type,
          title: name,
          subtitle: item.description || `${type} in ${item.workspace?.name || 'Unknown'}`,
          status: item.status,
          priority: item.priority,
          workspaceId: item.workspace_id,
          workspaceName: item.workspace?.name,
          icon: item.icon,
          score,
        };
      });
    };

    const workspaceResults = formatResults(workspaces, "workspace");
    const projectResults = formatResults(projects, "space");
    const taskResults = formatResults(tasks, "task");

    // Combine and sort by score
    const allResults = [...workspaceResults, ...projectResults, ...taskResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return res.json({
      results: allResults,
      total: allResults.length,
      categories: {
        workspaces: workspaceResults.length,
        projects: projectResults.length,
        tasks: taskResults.length,
      },
      query,
    });
  } catch (error: any) {
    logger.error("Global search error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return res.status(500).json({ 
      error: "Failed to search", 
      details: error.message,
      code: error.code 
    });
  }
});

export default router;
