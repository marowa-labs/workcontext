/**
 * Integrations API Routes
 *
 * GET    /api/integrations              — List connected tools
 * POST   /api/integrations              — Start OAuth flow (returns authorization URL)
 * POST   /api/integrations/callback     — OAuth callback (exchange code, create connection)
 * POST   /api/integrations/:id/sync     — Trigger sync for a connection
 * DELETE /api/integrations/:id          — Disconnect a tool
 * GET    /api/integrations/search       — Cross-source semantic search
 * GET    /api/integrations/:id/browse   — Browse synced content for import
 * GET    /api/integrations/:id/types    — Get content types for a connection
 * POST   /api/integrations/import       — Import content as a new Project
 */

import { Router } from "express";
import { authenticateExpressRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { getConnector, getAllConnectors, getToolTypes } from "../../services/integrations/connectorRegistry";
import { SearchAggregator } from "../../services/integrations/searchAggregator";
import { ToolType } from "../../services/integrations/connectorBase";
import { IntegrationImportService } from "../../services/integrations/importService";
import crypto from "crypto";
import logger from "../../monitoring/logger";

const router: Router = Router();

// ---------- Helper: get authenticated user ID ----------

function getUserId(req: any): string {
  const user = (req as any).user;
  if (!user) throw new Error("Unauthorized");
  return user.id || user.sub || user.userId;
}

// ============================================================
// GET /api/integrations — List all connected tools + available tools
// ============================================================
router.get("/", authenticateExpressRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    const summary = await SearchAggregator.getConnectionsSummary(userId);

    // Also return available (not yet connected) tool types
    const connectedTypes = new Set(summary.map((s) => s.tool_type));
    const allConnectors = getAllConnectors();
    const available = allConnectors
      .filter((c) => !connectedTypes.has(c.toolType))
      .map((c) => ({
        tool_type: c.toolType,
        display_name: c.displayName,
        description: c.description,
        icon_url: c.iconUrl,
        connected: false,
      }));

    return res.json({
      success: true,
      connections: summary,
      available,
    });
  } catch (error: any) {
    logger.error("GET /api/integrations failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET /api/integrations/available — List all available tool types
// ============================================================
router.get("/available", authenticateExpressRequest, async (_req, res) => {
  try {
    const connectors = getAllConnectors();
    return res.json({
      success: true,
      tools: connectors.map((c) => ({
        tool_type: c.toolType,
        display_name: c.displayName,
        description: c.description,
        icon_url: c.iconUrl,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// POST /api/integrations — Start OAuth flow
// Body: { tool_type: "slack"|"notion"|..., workspace_id?: string }
// Returns: { authorization_url, state }
// ============================================================
router.post("/", authenticateExpressRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { tool_type, workspace_id } = req.body;

    if (!tool_type || typeof tool_type !== "string") {
      return res.status(400).json({ success: false, message: "tool_type is required" });
    }

    const connector = getConnector(tool_type as ToolType);
    if (!connector) {
      return res.status(400).json({
        success: false,
        message: `Unknown tool type: ${tool_type}. Available: ${getToolTypes().join(", ")}`,
      });
    }

    // Generate state token for CSRF protection
    const state = crypto.randomBytes(32).toString("hex");
    const stateData = {
      userId,
      toolType: tool_type,
      workspaceId: workspace_id || null,
      createdAt: Date.now(),
    };

    // Store state in database (expires in 10 minutes)
    await prisma.idempotencyRecord.upsert({
      where: { idempotency_key: `oauth_state:${state}` },
      update: { result: JSON.stringify(stateData), status: "pending" },
      create: {
        idempotency_key: `oauth_state:${state}`,
        status: "pending",
        result: JSON.stringify(stateData),
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Build redirect URI
    const baseUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const redirectUri = `${baseUrl}/api/integrations/callback`;

    // GitHub App uses a different flow (installation URL instead of OAuth)
    let authorizationUrl: string;
    let pkceData: { codeVerifier: string; codeChallenge: string } | undefined;

    if (tool_type === "github_app") {
      const { GitHubAppConnector } = await import("../../services/integrations/githubAppConnector");
      const ghApp = new GitHubAppConnector();
      authorizationUrl = ghApp.getInstallationUrl(state);
    } else {
      const authResult = connector.getAuthorizationUrl(redirectUri, state);
      if (typeof authResult === "string") {
        authorizationUrl = authResult;
      } else {
        authorizationUrl = authResult.authorizationUrl;
        pkceData = authResult.pkceData;
      }
    }

    // Store PKCE code_verifier in state record if applicable
    const stateUpdate: any = {
      result: JSON.stringify({ ...stateData, pkceData }),
    };

    await prisma.idempotencyRecord.update({
      where: { idempotency_key: `oauth_state:${state}` },
      data: stateUpdate,
    });

    return res.json({
      success: true,
      authorization_url: authorizationUrl,
      state,
      tool_type,
    });
  } catch (error: any) {
    logger.error("POST /api/integrations failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// POST /api/integrations/callback — OAuth callback
// Query: code, state
// ============================================================
router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };

    if (!code || !state) {
      return res.status(400).send("Missing authorization code or state");
    }

    // Validate state
    const stateRecord = await prisma.idempotencyRecord.findUnique({
      where: { idempotency_key: `oauth_state:${state}` },
    });

    if (!stateRecord || stateRecord.status !== "pending") {
      return res.status(400).send("Invalid or expired OAuth state");
    }

    const stateData = JSON.parse(stateRecord.result || "{}");

    // Mark state as used
    await prisma.idempotencyRecord.update({
      where: { idempotency_key: `oauth_state:${state}` },
      data: { status: "completed" },
    });

    const connector = getConnector(stateData.toolType as ToolType);
    if (!connector) {
      return res.status(400).send("Unknown tool type");
    }

    const baseUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const redirectUri = `${baseUrl}/api/integrations/callback`;

    // Exchange code for tokens (pass PKCE code_verifier if present)
    const codeVerifier = stateData.pkceData?.codeVerifier;
    const tokens = await connector.exchangeCode(code, redirectUri, codeVerifier);

    // Fetch workspace info from the tool
    let workspaceInfo;
    try {
      workspaceInfo = await connector.fetchWorkspaceInfo(tokens.access_token);
    } catch (err: any) {
      logger.warn("Failed to fetch workspace info", { tool: stateData.toolType, error: err.message });
      workspaceInfo = {
        workspace_external_id: "unknown",
        workspace_external_name: "Connected",
      };
    }

    // Upsert the connection
    const connection = await prisma.externalToolConnection.upsert({
      where: {
        user_id_tool_type_workspace_external_id: {
          user_id: stateData.userId,
          tool_type: stateData.toolType,
          workspace_external_id: workspaceInfo.workspace_external_id,
        },
      },
      update: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_type: tokens.token_type || "Bearer",
        expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        scope: tokens.scope || null,
        tool_name: `${connector.displayName} — ${workspaceInfo.workspace_external_name}`,
        workspace_external_name: workspaceInfo.workspace_external_name,
        metadata: workspaceInfo.metadata || undefined,
        status: "active",
        sync_error: null,
        workspace_id: stateData.workspaceId || null,
      },
      create: {
        user_id: stateData.userId,
        workspace_id: stateData.workspaceId || null,
        tool_type: stateData.toolType,
        tool_name: `${connector.displayName} — ${workspaceInfo.workspace_external_name}`,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_type: tokens.token_type || "Bearer",
        expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        scope: tokens.scope || null,
        workspace_external_id: workspaceInfo.workspace_external_id,
        workspace_external_name: workspaceInfo.workspace_external_name,
        metadata: workspaceInfo.metadata || undefined,
        status: "active",
      },
    });

    // Redirect to frontend settings page with success
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(
      `${frontendUrl}/settings/integrations?connected=${stateData.toolType}&connection_id=${connection.id}`
    );
  } catch (error: any) {
    logger.error("OAuth callback failed", { error: error.message });
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(
      `${frontendUrl}/settings/integrations?error=${encodeURIComponent(error.message)}`
    );
  }
});

// ============================================================
// GET /api/integrations/github/installation/callback
// GitHub App installation callback
// Query: installation_id, setup_action, state
// ============================================================
router.get("/github/installation/callback", async (req, res) => {
  try {
    const { installation_id, setup_action, state } = req.query as {
      installation_id?: string;
      setup_action?: string;
      state?: string;
    };

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    if (!installation_id) {
      return res.redirect(
        `${frontendUrl}/settings/integrations?error=Missing installation ID`
      );
    }

    if (setup_action === "update" || setup_action === "request") {
      // App permissions were updated or requested — redirect back
      return res.redirect(
        `${frontendUrl}/settings/integrations?connected=github_app&installation_id=${installation_id}`
      );
    }

    // Validate state
    if (state) {
      const stateRecord = await prisma.idempotencyRecord.findUnique({
        where: { idempotency_key: `oauth_state:${state}` },
      });

      if (!stateRecord || stateRecord.status !== "pending") {
        return res.redirect(
          `${frontendUrl}/settings/integrations?error=Invalid or expired state`
        );
      }

      const stateData = JSON.parse(stateRecord.result || "{}");

      // Mark state as used
      await prisma.idempotencyRecord.update({
        where: { idempotency_key: `oauth_state:${state}` },
        data: { status: "completed" },
      });

      // Create connection via the GitHub App connector
      const { GitHubAppConnector } = await import("../../services/integrations/githubAppConnector");
      const ghApp = new GitHubAppConnector();

      const connection = await ghApp.handleInstallationCallback(
        stateData.userId,
        Number(installation_id),
        stateData.workspaceId || undefined
      );

      return res.redirect(
        `${frontendUrl}/settings/integrations?connected=github_app&connection_id=${connection.id}`
      );
    }

    // No state — redirect with info
    return res.redirect(
      `${frontendUrl}/settings/integrations?connected=github_app&installation_id=${installation_id}`
    );
  } catch (error: any) {
    logger.error("GitHub App installation callback failed", { error: error.message });
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(
      `${frontendUrl}/settings/integrations?error=${encodeURIComponent(error.message)}`
    );
  }
});

// ============================================================
// POST /api/integrations/:id/sync — Trigger sync
// ============================================================
router.post("/:id/sync", authenticateExpressRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = String(req.params.id);

    // Verify ownership
    const connection = await prisma.externalToolConnection.findFirst({
      where: { id, user_id: userId },
    });
    if (!connection) {
      return res.status(404).json({ success: false, message: "Connection not found" });
    }
    if (connection.status === "disconnected") {
      return res.status(400).json({ success: false, message: "Connection is disconnected" });
    }

    const connector = getConnector(connection.tool_type as ToolType);
    if (!connector) {
      return res.status(400).json({ success: false, message: "Unknown tool type" });
    }

    // Prevent duplicate syncs — if one is already running, return the existing log
    const activeLog = await prisma.externalToolSyncLog.findFirst({
      where: { connection_id: id, status: { in: ["pending", "started"] } },
    });
    if (activeLog) {
      return res.status(202).json({
        success: true,
        message: "Sync already in progress",
        connection_id: id,
        sync_log_id: activeLog.id,
        status: activeLog.status,
        items_synced: activeLog.items_synced,
      });
    }

    // Create a PENDING log so the frontend can poll it immediately
    const syncLog = await prisma.externalToolSyncLog.create({
      data: { connection_id: id, status: "pending" },
    });

    // Fire-and-forget: run sync in background
    connector.syncContent(id, syncLog.id).catch((err) => {
      logger.error("Background sync failed", { connectionId: id, error: err.message });
    });

    return res.status(202).json({
      success: true,
      message: "Sync started",
      connection_id: id,
      sync_log_id: syncLog.id,
      status: "pending",
    });
  } catch (error: any) {
    logger.error("POST /api/integrations/:id/sync failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// DELETE /api/integrations/:id — Disconnect a tool
// ============================================================
router.delete("/:id", authenticateExpressRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = String(req.params.id);

    const connection = await prisma.externalToolConnection.findFirst({
      where: { id, user_id: userId },
    });
    if (!connection) {
      return res.status(404).json({ success: false, message: "Connection not found" });
    }

    const connector = getConnector(connection.tool_type as ToolType);
    if (connector) {
      await connector.disconnect(id);
    } else {
      await prisma.externalToolConnection.update({
        where: { id },
        data: { status: "disconnected" },
      });
    }

    return res.json({ success: true, message: "Connection disconnected" });
  } catch (error: any) {
    logger.error("DELETE /api/integrations/:id failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET /api/integrations/:id/status — Get sync status for a connection
// ============================================================
router.get("/:id/status", authenticateExpressRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = String(req.params.id);

    const connection = await prisma.externalToolConnection.findFirst({
      where: { id, user_id: userId },
      include: {
        sync_logs: {
          orderBy: { started_at: "desc" },
          take: 5,
        },
        _count: { select: { content: true } },
      },
    });
    if (!connection) {
      return res.status(404).json({ success: false, message: "Connection not found" });
    }

    const connWithExtras = connection as typeof connection & { sync_logs: any[]; _count: { content: number } };

    return res.json({
      success: true,
      connection: {
        id: connWithExtras.id,
        tool_type: connWithExtras.tool_type,
        tool_name: connWithExtras.tool_name,
        status: connWithExtras.status,
        last_synced_at: connWithExtras.last_synced_at,
        sync_error: connWithExtras.sync_error,
        content_count: connWithExtras._count.content,
        sync_logs: connWithExtras.sync_logs.map((log: any) => ({
          id: log.id,
          status: log.status,
          items_synced: log.items_synced,
          items_indexed: log.items_indexed,
          error_message: log.error_message,
          started_at: log.started_at,
          completed_at: log.completed_at,
        })),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET /api/integrations/:id/browse — Browse synced content for import
// Query: search?, content_type?, cursor?, limit?
// ============================================================
router.get("/:id/browse", authenticateExpressRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = String(req.params.id);
    const { search, content_type, cursor, limit } = req.query as {
      search?: string;
      content_type?: string;
      cursor?: string;
      limit?: string;
    };

    const result = await IntegrationImportService.browseContent({
      connectionId: id,
      userId,
      search,
      contentType: content_type,
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error("GET /api/integrations/:id/browse failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET /api/integrations/:id/tree — Browse synced content as a tree
// Query: search?, content_type?
// ============================================================
router.get("/:id/tree", authenticateExpressRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = String(req.params.id);
    const { search, content_type } = req.query as {
      search?: string;
      content_type?: string;
    };

    const result = await IntegrationImportService.getTreeContent({
      connectionId: id,
      userId,
      search,
      contentType: content_type,
    });

    return res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error("GET /api/integrations/:id/tree failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// POST /api/integrations/import-tree — Import an entire tree (repo, workspace, team) as one Project
// ============================================================
router.post("/import-tree", authenticateExpressRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { root_content_id, workspace_id } = req.body;

    if (!root_content_id) {
      return res.status(400).json({ success: false, message: "root_content_id is required" });
    }

    const result = await IntegrationImportService.importTreeAsProject({
      rootContentId: root_content_id,
      userId,
      workspaceId: workspace_id,
    });

    return res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error("POST /api/integrations/import-tree failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET /api/integrations/:id/types — Get content types for a connection
// ============================================================
router.get("/:id/types", authenticateExpressRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = String(req.params.id);

    const types = await IntegrationImportService.getContentTypes(id, userId);
    return res.json({ success: true, types });
  } catch (error: any) {
    logger.error("GET /api/integrations/:id/types failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// POST /api/integrations/import — Import content as a new Project
// Body: { content_id: string, workspace_id?: string }
// ============================================================
router.post("/import", authenticateExpressRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { content_id, workspace_id } = req.body;

    if (!content_id) {
      return res.status(400).json({ success: false, message: "content_id is required" });
    }

    const result = await IntegrationImportService.importAsProject({
      contentId: content_id,
      userId,
      workspaceId: workspace_id || undefined,
    });

    return res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error("POST /api/integrations/import failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

// ============================================================
// GET /api/integrations/embed/:contentId — Get embeddable data for a content item
// Returns the right embed format based on tool type:
//   - Figma: iframe URL + thumbnail
//   - GitHub: raw file URL + markdown content
//   - Notion: page URL
//   - Slack: message permalink
//   - Jira: issue URL + embedded issue data
// ============================================================
router.get("/embed/:contentId", authenticateExpressRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    const contentId = String(req.params.contentId);

    const contentItem = await prisma.externalToolContent.findUnique({
      where: { id: contentId },
      include: { connection: true },
    });

    if (!contentItem) {
      return res.status(404).json({ success: false, message: "Content item not found" });
    }

    // Verify ownership
    if (contentItem.connection.user_id !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const toolType = contentItem.tool_type;
    const metadata = (contentItem.metadata as any) || {};
    const contentUrl = contentItem.content_url || "";

    // Build embed data based on tool type
    let embedData: any = {
      tool_type: toolType,
      content_type: contentItem.content_type,
      title: contentItem.title,
      source_url: contentUrl,
      edit_url: contentUrl, // Default: same as source
      last_synced_at: contentItem.last_synced_at,
    };

    switch (toolType) {
      case "figma": {
        // Figma: build embed URL from file key
        // Embed URL format: https://www.figma.com/embed?embed_host=share&url=FILE_URL
        const fileUrl = contentUrl || `https://www.figma.com/file/${metadata.file_id}`;
        const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(fileUrl)}`;

        embedData = {
          ...embedData,
          embed_type: "iframe",
          embed_url: embedUrl,
          thumbnail_url: metadata.thumbnail || null,
          pages: metadata.pages || [],
          page_count: metadata.page_count || 0,
          component_count: metadata.component_count || 0,
          version: metadata.version || null,
          last_modified: metadata.last_modified || null,
          edit_url: fileUrl, // Edit in Figma
        };
        break;
      }

      case "github": {
        // GitHub: build raw content URL and edit URL
        const externalId = contentItem.external_id; // e.g. "repo_name:branch:path"
        const parts = externalId.split(":");
        const repoName = parts[0] || "";
        const filePath = parts.slice(2).join(":") || "README.md";
        const branch = parts[1] || "main";

        const rawUrl = `https://raw.githubusercontent.com/${repoName}/${branch}/${filePath}`;
        const ghEditUrl = `https://github.com/${repoName}/edit/${branch}/${filePath}`;
        const ghViewUrl = `https://github.com/${repoName}/blob/${branch}/${filePath}`;

        embedData = {
          ...embedData,
          embed_type: "code",
          raw_url: rawUrl,
          view_url: ghViewUrl,
          edit_url: ghEditUrl, // Edit in GitHub
          repo_name: repoName,
          file_path: filePath,
          branch: branch,
          content_text: contentItem.content_text, // Markdown content
        };
        break;
      }

      case "notion": {
        embedData = {
          ...embedData,
          embed_type: "link",
          edit_url: contentUrl, // Edit in Notion
          snippet: contentItem.content_text?.slice(0, 500) || null,
        };
        break;
      }

      case "slack": {
        embedData = {
          ...embedData,
          embed_type: "link",
          edit_url: contentUrl, // Open in Slack
          channel: contentItem.channel_or_project,
          author: contentItem.author_name,
          snippet: contentItem.content_text?.slice(0, 500) || null,
        };
        break;
      }

      case "jira": {
        embedData = {
          ...embedData,
          embed_type: "link",
          edit_url: contentUrl, // Open in Jira
          project: contentItem.channel_or_project,
          snippet: contentItem.content_text?.slice(0, 500) || null,
        };
        break;
      }

      default: {
        embedData = {
          ...embedData,
          embed_type: "link",
          snippet: contentItem.content_text?.slice(0, 500) || null,
        };
        break;
      }
    }

    return res.json({ success: true, embed: embedData });
  } catch (error: any) {
    logger.error("GET /api/integrations/embed/:contentId failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// POST /api/integrations/:id/sync-back — Pull latest changes from source
// Re-fetches content from the external tool and updates local records
// ============================================================
router.post("/:id/sync-back", authenticateExpressRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = String(req.params.id);
    const { content_id } = req.body as { content_id?: string };

    // Verify ownership
    const connection = await prisma.externalToolConnection.findFirst({
      where: { id, user_id: userId },
    });
    if (!connection) {
      return res.status(404).json({ success: false, message: "Connection not found" });
    }

    // Full connection sync (re-fetches all content)
    const connector = getConnector(connection.tool_type as ToolType);
    if (!connector) {
      return res.status(400).json({ success: false, message: "Unknown tool type" });
    }

    // Start sync in background
    connector.syncContent(id).catch((err: any) => {
      logger.error("Sync-back failed", { connectionId: id, error: err.message });
    });

    return res.json({
      success: true,
      message: "Sync-back started. Latest content from the source tool will be pulled.",
      connection_id: id,
    });
  } catch (error: any) {
    logger.error("POST /api/integrations/:id/sync-back failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});
