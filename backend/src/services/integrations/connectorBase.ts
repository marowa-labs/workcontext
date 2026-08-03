/**
 * Abstract base class for all external tool connectors.
 *
 * Each connector implements the specifics of OAuth2 authorization,
 * content fetching, and search for a single external tool (Slack, Notion, etc.).
 *
 * The framework handles:
 * - Token refresh logic
 * - Sync orchestration
 * - Embedding generation & vector storage
 * - Cross-source search aggregation
 */

import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";
import { EmbeddingService } from "../embeddingService";

// ---------- Types ----------

export type ToolType = "slack" | "notion" | "jira" | "github" | "github_app" | "figma";

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  /** Extra auth params (e.g. Slack needs `user_scope` in addition to `scope`) */
  extraAuthParams?: Record<string, string>;
  /** Use PKCE flow (Figma requires this) */
  usePKCE?: boolean;
  /** Omit response_type=code in authorization URL (Figma doesn't use it) */
  omitResponseType?: boolean;
}

/** PKCE challenge data stored during OAuth flow */
export interface PKCEData {
  codeVerifier: string;
  codeChallenge: string;
}

export interface TokenResult {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

export interface SyncedItem {
  /** Unique ID within the external tool */
  external_id: string;
  content_type: string;
  title: string | null;
  content_text: string | null;
  content_url: string | null;
  author_name: string | null;
  author_avatar: string | null;
  channel_or_project: string | null;
  metadata?: Record<string, any>;
  /** Parent item's external_id for hierarchy (e.g., repo full_name for files, page_id for sub-pages) */
  parent_external_id?: string | null;
  /** Depth in the tree: 0 = root, 1 = child, 2 = grandchild */
  depth?: number;
}

export interface SearchResult {
  connection_id: string;
  tool_type: ToolType;
  content_type: string;
  external_id: string;
  title: string | null;
  content_text: string | null;
  content_url: string | null;
  author_name: string | null;
  channel_or_project: string | null;
  similarity: number;
  metadata?: Record<string, any>;
}

// ---------- Base Connector ----------

export abstract class ConnectorBase {
  abstract readonly toolType: ToolType;
  abstract readonly displayName: string;
  abstract readonly iconUrl: string;
  abstract readonly description: string;
  abstract readonly oauthConfig: OAuthConfig;

  // ------ Abstract methods each connector must implement ------

  /** Exchange authorization code for tokens. Pass codeVerifier for PKCE flows (e.g. Figma). */
  abstract exchangeCode(code: string, redirectUri: string, codeVerifier?: string): Promise<TokenResult>;

  /** Refresh an expired access token */
  abstract refreshAccessToken(refreshToken: string): Promise<TokenResult>;

  /** Fetch user/workspace info after authorization to populate connection metadata */
  abstract fetchWorkspaceInfo(accessToken: string): Promise<{
    workspace_external_id: string;
    workspace_external_name: string;
    metadata?: Record<string, any>;
  }>;

  /** Fetch content items from the tool (paginated) */
  abstract fetchContent(
    accessToken: string,
    options: {
      since?: Date;
      pageSize?: number;
      cursor?: string;
    }
  ): Promise<{
    items: SyncedItem[];
    nextCursor?: string;
    hasMore: boolean;
  }>;

  /** Generate a deep link to a specific item in the external tool */
  abstract getItemUrl(item: SyncedItem): string;

  // ------ Shared implementation ------

  /**
   * Build the full OAuth authorization URL with correct scopes and state.
   * If PKCE is enabled, generates a code_verifier and code_challenge.
   * Returns the authorization URL and (if PKCE) the PKCE data to store.
   */
  getAuthorizationUrl(
    redirectUri: string,
    state: string
  ): string | { authorizationUrl: string; pkceData: PKCEData } {
    const params = new URLSearchParams({
      client_id: this.oauthConfig.clientId,
      redirect_uri: redirectUri,
      ...(this.oauthConfig.omitResponseType
        ? {}
        : { response_type: "code" }),
      scope: this.oauthConfig.scopes.join(" "),
      state,
      ...this.oauthConfig.extraAuthParams,
    });

    if (this.oauthConfig.usePKCE) {
      // Generate PKCE code_verifier and code_challenge
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = this.generateCodeChallenge(codeVerifier);

      params.set("code_challenge", codeChallenge);
      params.set("code_challenge_method", "S256");

      return {
        authorizationUrl: `${this.oauthConfig.authorizationUrl}?${params.toString()}`,
        pkceData: { codeVerifier, codeChallenge },
      };
    }

    return `${this.oauthConfig.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Generate a cryptographically random code_verifier for PKCE.
   * 43-128 characters from unreserved characters [A-Z] / [a-z] / [0-9] / '-' / '.' / '_' / '~'.
   */
  protected generateCodeVerifier(): string {
    const crypto = require("crypto");
    const buffer = crypto.randomBytes(32);
    return buffer
      .toString("base64url")
      .replace(/[^A-Za-z0-9\-._~]/g, "")
      .slice(0, 43);
  }

  /**
   * Generate a code_challenge from a code_verifier using SHA-256.
   */
  protected generateCodeChallenge(codeVerifier: string): string {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  }

  /**
   * Sync content from the external tool into ExternalToolContent + embeddings.
   * Returns the number of items synced.
   */
  async syncContent(connectionId: string): Promise<number> {
    const connection = await prisma.externalToolConnection.findUnique({
      where: { id: connectionId },
    });
    if (!connection) throw new Error("Connection not found");
    if (connection.status === "disconnected") throw new Error("Connection is disconnected");

    let accessToken = connection.access_token;

    // Refresh token if expired
    if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
      if (!connection.refresh_token) {
        await prisma.externalToolConnection.update({
          where: { id: connectionId },
          data: { status: "expired", sync_error: "Token expired and no refresh token available" },
        });
        throw new Error("Token expired and no refresh token available");
      }
      try {
        const newTokens = await this.refreshAccessToken(connection.refresh_token);
        accessToken = newTokens.access_token;
        await prisma.externalToolConnection.update({
          where: { id: connectionId },
          data: {
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token || connection.refresh_token,
            expires_at: newTokens.expires_in
              ? new Date(Date.now() + newTokens.expires_in * 1000)
              : null,
            token_type: newTokens.token_type || connection.token_type,
            status: "active",
            sync_error: null,
          },
        });
      } catch (err: any) {
        await prisma.externalToolConnection.update({
          where: { id: connectionId },
          data: { status: "error", sync_error: `Token refresh failed: ${err.message}` },
        });
        throw err;
      }
    }

    // Create sync log
    const syncLog = await prisma.externalToolSyncLog.create({
      data: { connection_id: connectionId, status: "started" },
    });

    try {
      let totalSynced = 0;
      let cursor: string | undefined;
      let hasMore = true;

      // Fetch all pages
      while (hasMore) {
        const result = await this.fetchContent(accessToken, {
          since: connection.last_synced_at || undefined,
          pageSize: 100,
          cursor,
        });

        // Upsert content items
        for (const item of result.items) {
          const url = this.getItemUrl(item);
          const textForEmbedding = [item.title, item.content_text]
            .filter(Boolean)
            .join("\n")
            .slice(0, 8000);

          // Upsert the content record
          // Resolve parent_id if this item has a parent_external_id
          let parentId: string | undefined;
          if (item.parent_external_id) {
            const parent = await prisma.externalToolContent.findUnique({
              where: {
                connection_id_external_id: {
                  connection_id: connectionId,
                  external_id: item.parent_external_id,
                },
              },
              select: { id: true },
            });
            parentId = parent?.id;
          }

          const upserted = await prisma.externalToolContent.upsert({
            where: {
              connection_id_external_id: {
                connection_id: connectionId,
                external_id: item.external_id,
              },
            },
            update: {
              title: item.title,
              content_text: item.content_text,
              content_url: url,
              author_name: item.author_name,
              author_avatar: item.author_avatar,
              channel_or_project: item.channel_or_project,
              content_type: item.content_type,
              metadata: item.metadata || undefined,
              parent_id: parentId || null,
              depth: item.depth ?? 0,
              sort_order: totalSynced,
              last_synced_at: new Date(),
            },
            create: {
              connection_id: connectionId,
              external_id: item.external_id,
              tool_type: this.toolType,
              content_type: item.content_type,
              title: item.title,
              content_text: item.content_text,
              content_url: url,
              author_name: item.author_name,
              author_avatar: item.author_avatar,
              channel_or_project: item.channel_or_project,
              metadata: item.metadata || undefined,
              parent_id: parentId || null,
              depth: item.depth ?? 0,
              sort_order: totalSynced,
              last_synced_at: new Date(),
            },
          });

          // Update parent's item_count
          if (parentId) {
            await prisma.externalToolContent.updateMany({
              where: { id: parentId },
              data: { item_count: { increment: 1 } },
            });
          }

          totalSynced++;
        }

        cursor = result.nextCursor;
        hasMore = result.hasMore;
      }

      // Generate embeddings for newly synced content
      const unindexed = await prisma.externalToolContent.findMany({
        where: {
          connection_id: connectionId,
          indexed_at: null,
          content_text: { not: null },
        },
      });

      let indexedCount = 0;
      for (const item of unindexed) {
        if (!item.content_text) continue;
        try {
          const embedding = await EmbeddingService.embed(item.content_text.slice(0, 8000));
          await prisma.$executeRawUnsafe(
            `UPDATE external_tool_content
             SET embedding = $1::vector, dim = $2, indexed_at = now()
             WHERE id = $3`,
            `[${embedding.vector.join(",")}]`,
            embedding.dim,
            item.id,
          );
          indexedCount++;
        } catch (err: any) {
          logger.warn("Failed to generate embedding for external content", {
            contentId: item.id,
            error: err.message,
          });
        }
      }

      // Update sync log
      await prisma.externalToolSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "completed",
          items_synced: totalSynced,
          items_indexed: indexedCount,
          completed_at: new Date(),
        },
      });

      // Update connection
      await prisma.externalToolConnection.update({
        where: { id: connectionId },
        data: {
          last_synced_at: new Date(),
          status: "active",
          sync_error: null,
        },
      });

      logger.info("Sync completed", {
        connectionId,
        tool: this.toolType,
        synced: totalSynced,
        indexed: indexedCount,
      });

      return totalSynced;
    } catch (err: any) {
      await prisma.externalToolSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "failed",
          error_message: err.message,
          completed_at: new Date(),
        },
      });
      await prisma.externalToolConnection.update({
        where: { id: connectionId },
        data: { status: "error", sync_error: err.message },
      });
      throw err;
    }
  }

  /**
   * Perform a semantic similarity search across synced content for a connection.
   */
  async searchContent(
    query: string,
    connectionIds?: string[],
    k = 10,
    threshold = 0.15
  ): Promise<SearchResult[]> {
    const cleanQuery = (query || "").trim();
    if (!cleanQuery) return [];

    let embedding;
    try {
      embedding = await EmbeddingService.embed(cleanQuery);
    } catch (err: any) {
      logger.warn("Search embedding failed", { error: err.message });
      return [];
    }

    const vectorString = `[${embedding.vector.join(",")}]`;
    const params: any[] = [vectorString, embedding.dim];

    let connectionClause = "";
    if (connectionIds && connectionIds.length > 0) {
      connectionClause = `AND ect.connection_id = ANY($${params.length + 1})`;
      params.push(connectionIds);
    }

    // Filter by tool type
    const toolTypeClause = `AND ect.tool_type = $${params.length + 1}`;
    params.push(this.toolType);

    const thresholdIdx = params.length + 1;
    const limitIdx = params.length + 2;
    params.push(threshold, k);

    const sql = `
      SELECT
        ect.connection_id,
        ect.tool_type,
        ect.content_type,
        ect.external_id,
        ect.title,
        ect.content_text,
        ect.content_url,
        ect.author_name,
        ect.channel_or_project,
        ect.metadata,
        1 - (ect.embedding <=> $1::vector) as similarity
      FROM external_tool_content ect
      WHERE ect.dim = $2::int
        AND ect.embedding IS NOT NULL
        AND 1 - (ect.embedding <=> $1::vector) > $${thresholdIdx}
        ${connectionClause}
        ${toolTypeClause}
      ORDER BY ect.embedding <=> $1::vector
      LIMIT $${limitIdx}
    `;

    try {
      const rows = await prisma.$queryRawUnsafe(sql, ...params);
      return (rows as any[]).map((row) => ({
        connection_id: row.connection_id,
        tool_type: row.tool_type as ToolType,
        content_type: row.content_type,
        external_id: row.external_id,
        title: row.title,
        content_text: row.content_text,
        content_url: row.content_url,
        author_name: row.author_name,
        channel_or_project: row.channel_or_project,
        similarity: parseFloat(row.similarity),
        metadata: row.metadata,
      }));
    } catch (err: any) {
      logger.error("External content search failed", { tool: this.toolType, error: err.message });
      return [];
    }
  }

  /**
   * Disconnect and clean up a connection.
   */
  async disconnect(connectionId: string): Promise<void> {
    await prisma.externalToolConnection.update({
      where: { id: connectionId },
      data: { status: "disconnected" },
    });
    // Optionally: delete synced content, or keep for historical reference
    // We keep content but mark connection as disconnected
  }
}
