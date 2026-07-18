import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";
import { EmbeddingService } from "./embeddingService";

export type EntityType = "project" | "task" | "note";

interface UpsertInput {
  ownerId: string;
  workspaceId?: string | null;
  entityType: EntityType;
  entityId: string;
  title?: string | null;
  content: string; // plain text to embed
}

export interface RelatedItem {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  title: string | null;
  content: string | null;
  workspace_id: string | null;
  similarity: number;
}

/**
 * Unified context layer. Stores and retrieves vector embeddings for workspace
 * items (projects, tasks, notes) so the app can surface semantically related
 * content and power cross-workspace RAG retrieval.
 *
 * Embeddings are generated provider-agnostically (see EmbeddingService) and the
 * stored `dim` keeps similarity comparisons safe across providers.
 */
export class ContextEmbeddingService {
  // ---------- Text helpers ----------

  /**
   * Extract plain text from a TipTap/ProseMirror JSON document (or any nested
   * structure containing `text` leaves). Returns "" for non-string/empty input.
   */
  static extractText(node: any): string {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map((n) => this.extractText(n)).join(" ");
    if (typeof node === "object") {
      let out = "";
      if (node.type === "text" && typeof node.text === "string") {
        out += node.text + " ";
      }
      if (node.content) out += this.extractText(node.content) + " ";
      if (Array.isArray(node.attrs?.text)) out += node.attrs.text.join(" ");
      return out;
    }
    return "";
  }

  static buildProjectText(project: {
    title?: string | null;
    description?: string | null;
    content?: any;
  }): string {
    const body = this.extractText(project.content);
    return [project.title || "", project.description || "", body]
      .filter(Boolean)
      .join("\n")
      .slice(0, 8000);
  }

  static buildTaskText(task: {
    title?: string | null;
    description?: string | null;
  }): string {
    return [task.title || "", task.description || ""]
      .filter(Boolean)
      .join("\n")
      .slice(0, 8000);
  }

  // ---------- Write path ----------

  static async upsert(input: UpsertInput): Promise<void> {
    const text = (input.content || "").trim();
    if (!text) return; // nothing meaningful to embed

    let embedding: Awaited<ReturnType<typeof EmbeddingService.embed>>;
    try {
      embedding = await EmbeddingService.embed(text);
    } catch (error: any) {
      logger.warn("ContextEmbeddingService: embedding failed", {
        entityType: input.entityType,
        entityId: input.entityId,
        error: error.message,
      });
      return;
    }

    try {
      // Idempotent: replace any existing embedding for this entity.
      await prisma.$executeRawUnsafe(
        `DELETE FROM context_embeddings WHERE entity_type = $1 AND entity_id = $2`,
        input.entityType,
        input.entityId,
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO context_embeddings
           (owner_id, workspace_id, entity_type, entity_id, title, content, embedding, dim, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8, now(), now())`,
        input.ownerId,
        input.workspaceId ?? null,
        input.entityType,
        input.entityId,
        input.title ?? null,
        text,
        `[${embedding.vector.join(",")}]`,
        embedding.dim,
      );
    } catch (error: any) {
      logger.error("ContextEmbeddingService: failed to store embedding", {
        entityType: input.entityType,
        entityId: input.entityId,
        error: error.message,
      });
    }
  }

  static async upsertForProject(project: {
    id: string;
    user_id: string;
    workspace_id?: string | null;
    title?: string | null;
    description?: string | null;
    content?: any;
  }): Promise<void> {
    await this.upsert({
      ownerId: project.user_id,
      workspaceId: project.workspace_id,
      entityType: "project",
      entityId: project.id,
      title: project.title,
      content: this.buildProjectText(project),
    });
  }

  static async upsertForTask(task: {
    id: string;
    creator_id: string;
    workspace_id: string;
    title?: string | null;
    description?: string | null;
  }): Promise<void> {
    await this.upsert({
      ownerId: task.creator_id,
      workspaceId: task.workspace_id,
      entityType: "task",
      entityId: task.id,
      title: task.title,
      content: this.buildTaskText(task),
    });
  }

  static async upsertForNote(note: {
    id: string;
    user_id: string;
    project_id: string;
    title?: string | null;
    content?: string | null;
  }): Promise<void> {
    await this.upsert({
      ownerId: note.user_id,
      workspaceId: null,
      entityType: "note",
      entityId: note.id,
      title: note.title,
      content: [note.title || "", note.content || ""].join("\n"),
    });
  }

  static async remove(
    entityType: EntityType,
    entityId: string,
  ): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM context_embeddings WHERE entity_type = $1 AND entity_id = $2`,
        entityType,
        entityId,
      );
    } catch (error: any) {
      logger.error("ContextEmbeddingService: failed to remove embedding", {
        entityType,
        entityId,
        error: error.message,
      });
    }
  }

  // ---------- Read path (semantic similarity) ----------

  /**
   * Find the most semantically similar workspace items to `query`.
   * Scopes by `workspaceId` when provided, otherwise by `ownerId`.
   * Only compares vectors with the same dimension as the query embedding.
   */
  static async similaritySearch({
    workspaceId,
    ownerId,
    entityTypes,
    query,
    k = 5,
    threshold = 0.15,
  }: {
    workspaceId?: string | null;
    ownerId?: string;
    entityTypes?: EntityType[];
    query: string;
    k?: number;
    threshold?: number;
  }): Promise<RelatedItem[]> {
    const cleanQuery = (query || "").trim();
    if (!cleanQuery) return [];

    let embedding: Awaited<ReturnType<typeof EmbeddingService.embed>>;
    try {
      embedding = await EmbeddingService.embed(cleanQuery);
    } catch (error: any) {
      logger.warn("ContextEmbeddingService: retrieval embedding failed", {
        error: error.message,
      });
      return [];
    }

    const vectorString = `[${embedding.vector.join(",")}]`;
    const params: any[] = [vectorString, embedding.dim];
    let scopeClause: string;
    if (workspaceId) {
      scopeClause = ` AND workspace_id = $3`;
      params.push(workspaceId);
    } else {
      scopeClause = ` AND owner_id = $3`;
      params.push(ownerId);
    }

    let typeClause = "";
    if (entityTypes && entityTypes.length) {
      typeClause = ` AND entity_type = ANY($${params.length + 1})`;
      params.push(entityTypes);
    }

    const simIdx = params.length + 1;
    const limitIdx = params.length + 2;
    params.push(threshold, k);

    const sql = `SELECT id, entity_type, entity_id, title, content, workspace_id,
        1 - (embedding <=> $1::vector) as similarity
      FROM context_embeddings
      WHERE dim = $2::int${scopeClause}${typeClause}
        AND 1 - (embedding <=> $1::vector) > $${simIdx}
      ORDER BY similarity DESC
      LIMIT $${limitIdx}`;

    try {
      const rows = (await prisma.$queryRawUnsafe(sql, ...params)) as RelatedItem[];
      return rows;
    } catch (error: any) {
      logger.error("ContextEmbeddingService: similarity search failed", {
        error: error.message,
      });
      return [];
    }
  }
}
