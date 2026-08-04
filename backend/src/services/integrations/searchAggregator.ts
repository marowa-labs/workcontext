/**
 * Cross-Source Search Aggregator
 *
 * Searches across all connected external tools + internal workspace content
 * in a single query, returning unified, ranked results.
 */

import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";
import { EmbeddingService } from "../embeddingService";
import { ContextEmbeddingService } from "../contextEmbeddingService";
import { ToolType } from "./connectorBase";

export interface UnifiedSearchResult {
  id: string;
  source: "internal" | ToolType;
  source_label: string;
  content_type: string;
  title: string | null;
  content_text: string | null;
  content_url: string | null;
  author_name: string | null;
  channel_or_project: string | null;
  similarity: number;
  metadata?: Record<string, any>;
  snippet?: string;
}

const TOOL_DISPLAY_NAMES: Record<ToolType, string> = {
  slack: "Slack",
  notion: "Notion",
  jira: "Jira",
  github: "GitHub",
  github_app: "GitHub (App)",
  figma: "Figma",
};

export class SearchAggregator {
  /**
   * Search across all connected external tools and internal workspace items.
   */
  static async search({
    userId,
    query,
    workspaceId,
    toolTypes,
    contentTypes,
    k = 20,
    threshold = 0.15,
  }: {
    userId: string;
    query: string;
    workspaceId?: string;
    toolTypes?: ToolType[];
    contentTypes?: string[];
    k?: number;
    threshold?: number;
  }): Promise<UnifiedSearchResult[]> {
    const cleanQuery = (query || "").trim();
    if (!cleanQuery) return [];

    // Get embedding for query
    let embedding;
    try {
      embedding = await EmbeddingService.embed(cleanQuery);
    } catch (err: any) {
      logger.warn("SearchAggregator: embedding failed", { error: err.message });
      return [];
    }

    const vectorString = `[${embedding.vector.join(",")}]`;

    // Get all active connections for the user
    const connections = await prisma.externalToolConnection.findMany({
      where: {
        user_id: userId,
        status: "active",
        ...(toolTypes && toolTypes.length > 0 ? { tool_type: { in: toolTypes } } : {}),
      },
      select: { id: true, tool_type: true, tool_name: true },
    });

    const connectionIds = connections.map((c) => c.id);
    const connectionMap = new Map(connections.map((c) => [c.id, c]));

    const allResults: UnifiedSearchResult[] = [];

    // 1) Search external tool content via chunk-level embeddings
    if (connectionIds.length > 0) {
      const contentTypeClause =
        contentTypes && contentTypes.length > 0
          ? `AND ect.content_type = ANY($5)`
          : "";
      const contentTypeParams =
        contentTypes && contentTypes.length > 0 ? [contentTypes] : [];

      const externalSql = `
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
          AND ect.connection_id = ANY($4)
          ${contentTypeClause}
        ORDER BY ect.id, edc.embedding <=> $1::vector
        LIMIT $${5 + contentTypeParams.length}
      `;

      const externalParams: any[] = [
        vectorString,
        embedding.dim,
        threshold,
        connectionIds,
        ...contentTypeParams,
        k,
      ];

      try {
        const externalRows = await prisma.$queryRawUnsafe(externalSql, ...externalParams);
        for (const row of externalRows as any[]) {
          const conn = connectionMap.get(row.connection_id);
          allResults.push({
            id: row.id,
            source: row.tool_type as ToolType,
            source_label:
              TOOL_DISPLAY_NAMES[row.tool_type as ToolType] || row.tool_type,
            content_type: row.content_type,
            title: row.title,
            content_text: row.content_text,
            content_url: row.content_url,
            author_name: row.author_name,
            channel_or_project: row.channel_or_project,
            similarity: parseFloat(row.similarity),
            snippet: row.snippet,
            metadata: {
              ...row.metadata,
              connection_id: row.connection_id,
              connection_name: conn?.tool_name,
            },
          });
        }
      } catch (err: any) {
        logger.error("SearchAggregator: external search failed", {
          error: err.message,
        });
      }
    }

    // 2) Search internal workspace content (projects + tasks)
    try {
      const internalResults = await ContextEmbeddingService.similaritySearch({
        workspaceId,
        ownerId: userId,
        entityTypes: ["project", "task"],
        query: cleanQuery,
        k: Math.ceil(k / 2),
        threshold,
      });

      for (const item of internalResults) {
        allResults.push({
          id: item.id,
          source: "internal",
          source_label:
            item.entity_type === "project" ? "Project" : "Task",
          content_type: item.entity_type,
          title: item.title,
          content_text: item.content,
          content_url:
            item.entity_type === "project"
              ? `/dashboard/projects/${item.entity_id}`
              : `/dashboard/tasks`,
          author_name: null,
          channel_or_project: null,
          similarity: item.similarity,
          metadata: {
            entity_type: item.entity_type,
            entity_id: item.entity_id,
          },
        });
      }
    } catch (err: any) {
      logger.error("SearchAggregator: internal search failed", {
        error: err.message,
      });
    }

    // Sort by similarity (highest first) and deduplicate
    allResults.sort((a, b) => b.similarity - a.similarity);

    // Return top k results
    return allResults.slice(0, k);
  }

  /**
   * Get a summary of all connected integrations for a user.
   */
  static async getConnectionsSummary(userId: string) {
    const connections = await prisma.externalToolConnection.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        tool_type: true,
        tool_name: true,
        status: true,
        workspace_external_name: true,
        last_synced_at: true,
        created_at: true,
        _count: {
          select: { content: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return connections.map((c) => ({
      id: c.id,
      tool_type: c.tool_type,
      tool_name: c.tool_name,
      display_name:
        TOOL_DISPLAY_NAMES[c.tool_type as ToolType] || c.tool_type,
      status: c.status,
      workspace_name: c.workspace_external_name,
      last_synced: c.last_synced_at,
      connected_at: c.created_at,
      content_count: c._count.content,
    }));
  }
}
