/**
 * Abstract base class for all external tool connectors.
 *
 * Each connector implements the specifics of OAuth2 authorization,
 * content fetching, and search for a single external tool (Slack, Notion, etc.).
 *
 * The framework handles:
 * - Token refresh logic
 * - Sync orchestration (background, with progress via ExternalToolSyncLog)
 * - Chunk-level embedding generation & vector storage
 * - Cross-source semantic search aggregation
 */

import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";
import { EmbeddingService } from "../embeddingService";

// ---------- Types ----------

export type ToolType =
  "slack" | "notion" | "jira" | "github" | "github_app" | "figma";

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  /** Optional separate refresh-token endpoint (e.g. Figma uses /v1/oauth/refresh) */
  refreshTokenUrl?: string;
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
  /** Structured block content (BlockNote-compatible JSON blocks) */
  block_content?: any[] | null;
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
  snippet?: string;
}

// ---------- Helpers ----------

function contentHash(text: string): string {
  return crypto
    .createHash("sha256")
    .update(text || "")
    .digest("hex");
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
  abstract exchangeCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string,
  ): Promise<TokenResult>;

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
    },
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
    state: string,
  ): string | { authorizationUrl: string; pkceData: PKCEData } {
    const params = new URLSearchParams({
      client_id: this.oauthConfig.clientId,
      redirect_uri: redirectUri,
      ...(this.oauthConfig.omitResponseType ? {} : { response_type: "code" }),
      scope: this.oauthConfig.scopes.join(" "),
      state,
      ...this.oauthConfig.extraAuthParams,
    });

    if (this.oauthConfig.usePKCE) {
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

  protected generateCodeVerifier(): string {
    const buffer = crypto.randomBytes(32);
    return buffer
      .toString("base64url")
      .replace(/[^A-Za-z0-9\-._~]/g, "")
      .slice(0, 43);
  }

  protected generateCodeChallenge(codeVerifier: string): string {
    return crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  }

  /**
   * Sync content from the external tool into ExternalToolContent + chunk embeddings.
   *
   * @param connectionId  — the ExternalToolConnection to sync
   * @param syncLogId     — optional pre-created PENDING log; if omitted, creates one.
   *
   * Runs entirely in the background. The caller is expected to fire-and-forget.
   */
  async syncContent(connectionId: string, syncLogId?: string): Promise<number> {
    const connection = await prisma.externalToolConnection.findUnique({
      where: { id: connectionId },
    });
    if (!connection) throw new Error("Connection not found");
    if (connection.status === "disconnected")
      throw new Error("Connection is disconnected");

    let accessToken = connection.access_token;

    // Refresh token if expired
    if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
      if (!connection.refresh_token) {
        await prisma.externalToolConnection.update({
          where: { id: connectionId },
          data: {
            status: "expired",
            sync_error: "Token expired and no refresh token available",
          },
        });
        throw new Error("Token expired and no refresh token available");
      }
      try {
        const newTokens = await this.refreshAccessToken(
          connection.refresh_token,
        );
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
          data: {
            status: "error",
            sync_error: `Token refresh failed: ${err.message}`,
          },
        });
        throw err;
      }
    }

    // Create or adopt the sync log
    const syncLog = syncLogId
      ? await prisma.externalToolSyncLog.update({
          where: { id: syncLogId },
          data: { status: "started", items_synced: 0, items_indexed: 0 },
        })
      : await prisma.externalToolSyncLog.create({
          data: { connection_id: connectionId, status: "started" },
        });

    const updateLog = async (data: Record<string, any>) =>
      prisma.externalToolSyncLog
        .update({ where: { id: syncLog.id }, data })
        .catch(() => {});

    try {
      let totalSynced = 0;
      let totalIndexed = 0;
      let cursor: string | undefined;
      let hasMore = true;

      // Paginate through all content from the external tool
      while (hasMore) {
        const result = await this.fetchContent(accessToken, {
          since: connection.last_synced_at || undefined,
          pageSize: 100,
          cursor,
        });

        // Collect chunks for batch embedding this page
        const chunksToEmbed: { contentId: string; chunks: string[] }[] = [];

        for (const item of result.items) {
          const url = this.getItemUrl(item);
          const hash = contentHash(
            `${item.title || ""}\n${item.content_text || ""}`,
          );

          // Resolve parent
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

          // Build metadata with content hash
          const metadata: Record<string, any> = { ...(item.metadata || {}) };
          metadata.content_hash = hash;

          // Check if content actually changed (delta-sync)
          const existing = await prisma.externalToolContent.findUnique({
            where: {
              connection_id_external_id: {
                connection_id: connectionId,
                external_id: item.external_id,
              },
            },
            select: { id: true, indexed_at: true, metadata: true },
          });

          const contentChanged =
            !existing || (existing.metadata as any)?.content_hash !== hash;

          // Upsert content record
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
              metadata,
              parent_id: parentId || null,
              depth: item.depth ?? 0,
              sort_order: totalSynced,
              last_synced_at: new Date(),
              // If content changed, invalidate existing chunk embeddings
              ...(contentChanged ? { dim: null, indexed_at: null } : {}),
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
              metadata,
              parent_id: parentId || null,
              depth: item.depth ?? 0,
              sort_order: totalSynced,
              last_synced_at: new Date(),
            },
          });

          // If content changed and has text, prepare chunks for embedding
          if (contentChanged && item.content_text) {
            const chunks = EmbeddingService.chunkText(item.content_text);
            if (chunks.length > 0) {
              chunksToEmbed.push({ contentId: upserted.id, chunks });
            }
          }

          // Update parent item_count
          if (parentId) {
            await prisma.externalToolContent.updateMany({
              where: { id: parentId },
              data: { item_count: { increment: 1 } },
            });
          }

          totalSynced++;
        }

        // Batch-embed all chunks for this page
        for (const { contentId, chunks } of chunksToEmbed) {
          const dim = await this.rebuildChunks(contentId, chunks);
          totalIndexed++;
          // Update content-level dim so search knows it's indexed
          if (dim) {
            await prisma.externalToolContent.updateMany({
              where: { id: contentId },
              data: { dim, indexed_at: new Date() },
            });
          }
        }

        cursor = result.nextCursor;
        hasMore = result.hasMore;

        // Progress update every page
        await updateLog({
          items_synced: totalSynced,
          items_indexed: totalIndexed,
        });
      }

      // Done
      await updateLog({
        status: "completed",
        items_synced: totalSynced,
        items_indexed: totalIndexed,
        completed_at: new Date(),
      });

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
        indexed: totalIndexed,
      });

      return totalSynced;
    } catch (err: any) {
      await updateLog({
        status: "failed",
        error_message: err.message,
        completed_at: new Date(),
      });
      await prisma.externalToolConnection.update({
        where: { id: connectionId },
        data: { status: "error", sync_error: err.message },
      });
      throw err;
    }
  }

  /**
   * Delete old chunks, embed new ones, and insert into document_chunks.
   * Returns the embedding dimension used (for setting content.dim).
   */
  private async rebuildChunks(
    contentId: string,
    chunks: string[],
  ): Promise<number | null> {
    // Delete existing chunks
    await prisma.externalDocumentChunk.deleteMany({
      where: { content_id: contentId },
    });

    // Batch-embed
    const results = await EmbeddingService.embedBatch(chunks);
    const dim = results.find((r) => r !== null)?.dim ?? null;

    // Insert chunk rows
    for (let i = 0; i < chunks.length; i++) {
      const emb = results[i];
      if (emb) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO external_document_chunks (id, content_id, chunk_index, chunk_text, embedding, dim, indexed_at)
           VALUES ($1, $2, $3, $4, $5::vector, $6, now())`,
          crypto.randomUUID(),
          contentId,
          i,
          chunks[i],
          `[${emb.vector.join(",")}]`,
          emb.dim,
        );
      } else {
        // Store chunk without embedding (search will skip it)
        await prisma.externalDocumentChunk.create({
          data: {
            content_id: contentId,
            chunk_index: i,
            chunk_text: chunks[i],
          },
        });
      }
    }

    return dim;
  }

  /**
   * Perform a semantic similarity search across chunked content for a connection.
   */
  async searchContent(
    query: string,
    connectionIds?: string[],
    k = 10,
    threshold = 0.15,
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
    const params: any[] = [vectorString, embedding.dim, threshold];

    let connectionClause = "";
    if (connectionIds && connectionIds.length > 0) {
      params.push(connectionIds);
      connectionClause = `AND ect.connection_id = ANY($${params.length})`;
    }

    const toolTypeClause = `AND ect.tool_type = $${params.length + 1}`;
    params.push(this.toolType);

    const limitIdx = params.length + 1;
    params.push(k);

    const sql = `
      SELECT DISTINCT ON (ect.id)
        ect.id,
        ect.connection_id,
        ect.tool_type,
        ect.content_type,
        ect.title,
        ect.content_text,
        ect.content_url,
        ect.author_name,
        ect.channel_or_project,
        ect.metadata,
        edc.chunk_text as snippet,
        1 - (edc.embedding <=> $1::vector) as similarity
      FROM external_document_chunks edc
      JOIN external_tool_content ect ON ect.id = edc.content_id
      WHERE edc.dim = $2::int
        AND edc.embedding IS NOT NULL
        AND 1 - (edc.embedding <=> $1::vector) > $3
        ${connectionClause}
        ${toolTypeClause}
      ORDER BY ect.id, edc.embedding <=> $1::vector
      LIMIT $${limitIdx}
    `;

    try {
      const rows = await prisma.$queryRawUnsafe(sql, ...params);
      return (rows as any[]).map((row) => ({
        connection_id: row.connection_id,
        tool_type: row.tool_type as ToolType,
        content_type: row.content_type,
        external_id: row.external_id || row.id,
        title: row.title,
        content_text: row.content_text,
        content_url: row.content_url,
        author_name: row.author_name,
        channel_or_project: row.channel_or_project,
        similarity: parseFloat(row.similarity),
        snippet: row.snippet,
        metadata: row.metadata,
      }));
    } catch (err: any) {
      logger.error("External chunk search failed", {
        tool: this.toolType,
        error: err.message,
      });
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
  }
}
