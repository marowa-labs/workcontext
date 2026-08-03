import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { authenticateExpressRequest } from "../../middleware/auth";
import logger from "../../monitoring/logger";
import { SearchAggregator } from "../../services/integrations/searchAggregator";

const router = Router();

// GET /api/search?q=query&limit=20 - Global search across all user's content
router.get("/", authenticateExpressRequest, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const query = (req.query.q as string) || "";
    const limit = parseInt((req.query.limit as string) || "20", 10);

    if (!query.trim()) {
      return res.json({
        results: [],
        total: 0,
        query: "",
        categories: {
          workspaces: 0,
          projects: 0,
          tasks: 0,
          chats: 0,
          documents: 0,
        },
      });
    }

    // Helper: case-insensitive contains filter
    const searchFilter = (field: string) => ({
      contains: query,
      mode: "insensitive" as const,
    });

    // Helper: raw contains for @db.Text fields (no case-insensitive mode)
    const textFilter = (field: string) => ({
      contains: query,
    });

    // Helper: format results with relevance scoring
    const formatResults = (items: any[], type: string) => {
      return items.map((item) => {
        let score = 0;
        const name =
          item.name || item.title || item.content || "";
        const desc = item.description || item.preview || item.institution || "";

        if (name.toLowerCase() === query.toLowerCase()) score += 100;
        else if (name.toLowerCase().startsWith(query.toLowerCase()))
          score += 80;
        else if (name.toLowerCase().includes(query.toLowerCase())) score += 50;
        if (desc.toLowerCase().includes(query.toLowerCase())) score += 20;

        return {
          id: item.id,
          type,
          title: name,
          subtitle: desc,
          status: item.status,
          priority: item.priority,
          workspaceId: item.workspace_id,
          workspaceName: item.workspace?.name,
          icon: item.icon,
          score,
        };
      });
    };

    // Get user workspaces for scoping workspace-dependent queries
    const userWorkspaces = await prisma.workspaceMember.findMany({
      where: { user_id: userId },
      select: { workspace_id: true },
    });
    const workspaceIds = userWorkspaces.map((w: any) => w.workspace_id);

    const queries: Promise<any[]>[] = [];

    if (workspaceIds.length > 0) {
      // 1. Workspaces (name / description)
      queries.push(
        prisma.workspace.findMany({
          where: {
            id: { in: workspaceIds },
            OR: [
              { name: searchFilter("name") },
              { description: searchFilter("description") },
            ],
          },
          select: { id: true, name: true, description: true, icon: true },
          take: limit,
        }),
      );
    } else {
      queries.push(Promise.resolve([]));
    }

    // 2. Projects (title / description) — both workspace-scoped AND standalone
    queries.push(
      prisma.project.findMany({
        where: {
          user_id: userId,
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
          content_format: true,
          metadata: true,
          workspace: { select: { name: true } },
        },
        take: limit,
      }),
    );

    // 3. Tasks (title / description) — only workspace-scoped
    if (workspaceIds.length > 0) {
      queries.push(
        prisma.workspaceTask.findMany({
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
            workspace: { select: { name: true } },
          },
          take: limit,
        }),
      );

      // 4. Workspace Members (users by name or email)
      queries.push(
        prisma.workspaceMember.findMany({
          where: {
            workspace_id: { in: workspaceIds },
            user: {
              OR: [
                { full_name: searchFilter("full_name") },
                { email: searchFilter("email") },
              ],
            },
          },
          select: {
            id: true,
            role: true,
            workspace_id: true,
            user: {
              select: { id: true, full_name: true, email: true },
            },
            workspace: { select: { name: true } },
          },
          take: limit,
        }),
      );
    } else {
      queries.push(
        Promise.resolve([]),
        Promise.resolve([]),
      );
    }

    // 5. AI Chat Sessions (title)
    queries.push(
      prisma.aIChatSession.findMany({
        where: {
          user_id: userId,
          title: searchFilter("title"),
        },
        select: { id: true, title: true, created_at: true },
        take: limit,
      }),
    );

    // 6. AI Chat Messages (content)
    queries.push(
      prisma.aIChatMessage.findMany({
        where: {
          user_id: userId,
          content: searchFilter("content"),
        },
        select: {
          id: true,
          content: true,
          session_id: true,
          created_at: true,
          session: { select: { title: true } },
        },
        distinct: ["session_id"],
        take: limit,
      }),
    );

    // 7. PDF Documents (filename)
    queries.push(
      prisma.pdfDocument.findMany({
        where: {
          user_id: userId,
          filename: searchFilter("filename"),
        },
        select: {
          id: true,
          filename: true,
          created_at: true,
        },
        take: limit,
      }),
    );

    // 9. Document Templates
    queries.push(
      prisma.documentTemplate.findMany({
        where: {
          user_id: userId,
          OR: [
            { name: searchFilter("name") },
            { description: searchFilter("description") },
          ],
        },
        select: { id: true, name: true, description: true, type: true },
        take: limit,
      }),
    );

    const [
      workspaces,
      projects,
      tasks,
      members,
      chatSessions,
      chatMessages,
      pdfDocuments,
      templates,
    ] = await Promise.all(queries);

    // 8. External tool content (Slack, Notion, Jira, GitHub, Figma)
    let externalResults: any[] = [];
    try {
      const externalItems = await SearchAggregator.search({
        userId,
        query,
        k: Math.min(limit, 10),
        threshold: 0.15,
      });

      externalResults = externalItems.map((item) => ({
        id: item.id,
        type: "integration" as const,
        title: item.title || `(${item.source_label})`,
        subtitle: [
          item.source_label,
          item.channel_or_project,
          item.author_name ? `by ${item.author_name}` : null,
          item.content_text ? item.content_text.substring(0, 80) : null,
        ].filter(Boolean).join(" \u2022 "),
        source: item.source,
        sourceLabel: item.source_label,
        contentUrl: item.content_url,
        contentType: item.content_type,
        score: Math.round(item.similarity * 100),
      }));
    } catch (err: any) {
      logger.warn("External tool search failed in global search", { error: err.message });
    }

    // Format all internal result types
    const workspaceResults = formatResults(workspaces, "workspace");
    const projectResults = formatResults(projects, "project");
    const taskResults = formatResults(tasks, "task");

    const chatSessionResults = formatResults(
      chatSessions.map((s: any) => ({
        ...s,
        name: s.title || "Chat session",
        description: new Date(s.created_at).toLocaleDateString(),
      })),
      "chat",
    );

    const chatMessageResults = formatResults(
      chatMessages.map((m: any) => ({
        ...m,
        name:
          (m.session?.title || "AI Chat") +
          " — " +
          (m.content || "").substring(0, 60),
        description: "AI chat message",
        status: m.session_id,
      })),
      "chat",
    );

    const memberResults = formatResults(
      members.map((m: any) => ({
        id: m.user.id,
        name: m.user.full_name || m.user.email || "Unknown",
        description: m.workspace?.name || "Workspace member",
        status: m.role,
        workspace_id: m.workspace_id,
        workspace: m.workspace,
      })),
      "member",
    );

    const pdfResults = formatResults(
      pdfDocuments.map((p: any) => ({
        ...p,
        name: p.filename,
        description:
          "PDF document · " + new Date(p.created_at).toLocaleDateString(),
      })),
      "document",
    );

    const templateResults = formatResults(
      templates.map((t: any) => ({
        ...t,
        name: t.name,
        description: t.type
          ? `${t.type} template · ${t.description || ""}`
          : t.description || "Document template",
      })),
      "template",
    );

    // Combine, deduplicate by id+type, score-sort, slice
    const allResults = [
      ...workspaceResults,
      ...projectResults,
      ...taskResults,
      ...memberResults,
      ...chatSessionResults,
      ...chatMessageResults,
      ...pdfResults,
      ...templateResults,
      ...externalResults,
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return res.json({
      results: allResults,
      total: allResults.length,
      query,
      categories: {
        workspaces: workspaceResults.length,
        projects: projectResults.length,
        tasks: taskResults.length,
        members: memberResults.length,
        chats: chatSessionResults.length + chatMessageResults.length,
        documents: pdfResults.length + templateResults.length,
        integrations: externalResults.length,
      },
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
      code: error.code,
    });
  }
});

export default router;
