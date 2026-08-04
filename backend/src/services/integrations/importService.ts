/**
 * Integration Import Service
 *
 * Handles browsing synced external tool content and importing it
 * as WorkContext Projects. Supports both TipTap and BlockNote formats
 * depending on the content type.
 */

import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";

// ---------- Types ----------

export interface BrowseOptions {
  connectionId: string;
  userId: string;
  search?: string;
  contentType?: string;
  cursor?: string;
  limit?: number;
}

export interface BrowseResult {
  items: Array<{
    id: string;
    external_id: string;
    tool_type: string;
    content_type: string;
    title: string | null;
    content_text: string | null;
    content_url: string | null;
    author_name: string | null;
    channel_or_project: string | null;
    last_synced_at: Date | null;
  }>;
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface ImportResult {
  projectId: string;
  title: string;
  source_tool: string;
  source_url: string | null;
  source_external_id: string;
  content_format: "editor" | "blocks";
}

// ---------- Service ----------

export class IntegrationImportService {
  /**
   * Browse synced content items for a connection.
   * Supports search, content type filtering, and pagination.
   */
  static async browseContent(options: BrowseOptions): Promise<BrowseResult> {
    const { connectionId, userId, search, contentType, cursor, limit = 50 } = options;

    // Verify ownership
    const connection = await prisma.externalToolConnection.findFirst({
      where: { id: connectionId, user_id: userId },
    });
    if (!connection) {
      throw new Error("Connection not found or not owned by user");
    }

    // Build where clause
    const where: any = {
      connection_id: connectionId,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content_text: { contains: search, mode: "insensitive" } },
        { channel_or_project: { contains: search, mode: "insensitive" } },
      ];
    }

    if (contentType) {
      where.content_type = contentType;
    }

    // Get total count
    const total = await prisma.externalToolContent.count({ where });

    // Fetch items
    const items = await prisma.externalToolContent.findMany({
      where,
      select: {
        id: true,
        external_id: true,
        tool_type: true,
        content_type: true,
        title: true,
        content_text: true,
        content_url: true,
        author_name: true,
        channel_or_project: true,
        last_synced_at: true,
      },
      orderBy: { last_synced_at: "desc" },
      take: limit + 1, // Fetch one extra to determine hasMore
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
    });

    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;

    return {
      items: resultItems,
      total,
      hasMore,
      nextCursor: hasMore ? resultItems[resultItems.length - 1].id : null,
    };
  }

  /**
   * Browse synced content as a tree structure.
   * Returns root items with nested children for hierarchical display.
   */
  static async getTreeContent(options: {
    connectionId: string;
    userId: string;
    search?: string;
    contentType?: string;
  }): Promise<{ tree: any[]; total: number }> {
    const { connectionId, userId, search, contentType } = options;

    const connection = await prisma.externalToolConnection.findFirst({
      where: { id: connectionId, user_id: userId },
    });
    if (!connection) {
      throw new Error("Connection not found or not owned by user");
    }

    const where: any = { connection_id: connectionId };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content_text: { contains: search, mode: "insensitive" } },
        { channel_or_project: { contains: search, mode: "insensitive" } },
      ];
    }
    if (contentType) {
      where.content_type = contentType;
    }

    const total = await prisma.externalToolContent.count({ where });

    // Fetch ALL items for this connection (up to 500 for tree building)
    const allItems = await prisma.externalToolContent.findMany({
      where,
      select: {
        id: true,
        external_id: true,
        content_type: true,
        title: true,
        content_text: true,
        content_url: true,
        author_name: true,
        channel_or_project: true,
        last_synced_at: true,
        parent_id: true,
        depth: true,
        item_count: true,
        sort_order: true,
        metadata: true,
      },
      orderBy: [{ depth: "asc" }, { sort_order: "asc" }],
      take: 500,
    });

    // Build the tree
    const itemMap = new Map<string, any>();
    const rootItems: any[] = [];

    // First pass: create all nodes
    for (const item of allItems) {
      itemMap.set(item.id, {
        ...item,
        children: [],
        has_children: item.item_count > 0,
      });
    }

    // Second pass: attach children to parents
    for (const item of allItems) {
      const node = itemMap.get(item.id)!;
      if (item.parent_id && itemMap.has(item.parent_id)) {
        itemMap.get(item.parent_id)!.children.push(node);
      } else if (!item.parent_id || !itemMap.has(item.parent_id)) {
        rootItems.push(node);
      }
    }

    return { tree: rootItems, total };
  }

  /**
   * Import an entire tree node and all its children as a single Project.
   * Used for importing a GitHub repo, Notion workspace, Figma team, etc.
   */
  static async importTreeAsProject(options: {
    rootContentId: string;
    userId: string;
    workspaceId?: string;
  }): Promise<ImportResult> {
    const { rootContentId, userId, workspaceId } = options;

    const rootItem = await prisma.externalToolContent.findUnique({
      where: { id: rootContentId },
      include: { connection: true },
    });
    if (!rootItem) throw new Error("Content item not found");
    if (rootItem.connection.user_id !== userId) throw new Error("Not authorized");

    // Fetch all children recursively
    const allChildren = await this.getAllChildren(rootItem.id);

    // Build combined content
    const sourceTitle = rootItem.title || "Imported Collection";
    const toolType = rootItem.tool_type;
    const childrenCount = allChildren.length;

    const blocks: any[] = [];

    // Root item header
    blocks.push({
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: sourceTitle }],
    });

    if (rootItem.content_url) {
      blocks.push({
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [{ type: "link", attrs: { href: rootItem.content_url } }],
            text: `View in ${toolType.charAt(0).toUpperCase() + toolType.slice(1)} →`,
          },
        ],
      });
    }

    blocks.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: `Imported from ${toolType} — ${childrenCount} items`,
        },
      ],
    });

    // Group children by depth/type
    const grouped = this.groupChildrenByType(allChildren);

    for (const [groupTitle, items] of Object.entries(grouped)) {
      blocks.push({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: groupTitle }],
      });

      for (const item of items) {
        // Item as a bullet with link
        const bulletContent: any[] = [];

        if (item.content_url) {
          bulletContent.push({
            type: "text",
            marks: [{ type: "link", attrs: { href: item.content_url } }],
            text: item.title || "Untitled",
          });
        } else {
          bulletContent.push({
            type: "text",
            text: item.title || "Untitled",
          });
        }

        if (item.author_name) {
          bulletContent.push({
            type: "text",
            text: ` — ${item.author_name}`,
          });
        }

        blocks.push({
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{ type: "paragraph", content: bulletContent }],
            },
          ],
        });
      }
    }

    const tipTapContent = { type: "doc", content: blocks };

    // Also build BlockNote content
    const blockNoteContent = this.buildBlockNoteContent(
      rootItem.title,
      rootItem.content_text,
      toolType,
      rootItem.content_url,
      rootItem.channel_or_project,
      rootItem.author_name
    );

    // Determine best format
    const contentFormat = this.getContentFormat(toolType, rootItem.content_type);

    // Calculate word count from all content for progress tracking
    const allContentText = [
      rootItem.content_text || "",
      ...allChildren.map((c) => c.content_text || ""),
    ].join(" ");
    const wordCount = IntegrationImportService.calculateWordCount(allContentText, sourceTitle);

    // Create the Project
    const project = await prisma.project.create({
      data: {
        title: sourceTitle,
        description: `Imported ${childrenCount} items from ${toolType}`,
        content: tipTapContent as any,
        block_content: contentFormat === "blocks" ? blockNoteContent as any : undefined,
        content_format: contentFormat,
        word_count: wordCount,
        user_id: userId,
        workspace_id: workspaceId || null,
        type: "document",
        metadata: {
          imported_from: toolType,
          source_tool: toolType,
          source_external_id: rootItem.external_id,
          source_url: rootItem.content_url,
          external_content_id: rootItem.id,
          import_type: "collection",
          items_imported: childrenCount,
          imported_at: new Date().toISOString(),
        },
      },
    });

    // Index for search
    try {
      const { ContextEmbeddingService } = await import("../contextEmbeddingService");
      await ContextEmbeddingService.upsertForProject({
        id: project.id,
        user_id: userId,
        workspace_id: project.workspace_id,
        title: project.title,
        description: project.description,
        content: project.content,
      });
    } catch (err: any) {
      logger.warn("Failed to index imported collection for search", { error: err.message });
    }

    return {
      projectId: project.id,
      title: sourceTitle,
      source_tool: toolType,
      source_url: rootItem.content_url,
      source_external_id: rootItem.external_id,
      content_format: contentFormat,
    };
  }

  /** Recursively get all children of a content item */
  private static async getAllChildren(parentId: string): Promise<any[]> {
    const children = await prisma.externalToolContent.findMany({
      where: { parent_id: parentId },
      orderBy: { sort_order: "asc" },
    });

    let allChildren = [...children];
    for (const child of children) {
      const grandchildren = await this.getAllChildren(child.id);
      allChildren = allChildren.concat(grandchildren);
    }
    return allChildren;
  }

  /** Group children by content type for structured display */
  private static groupChildrenByType(items: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    for (const item of items) {
      const label = this.getContentTypeLabel(item.content_type);
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    }

    return groups;
  }

  /** Get human-readable label for content type */
  private static getContentTypeLabel(contentType: string): string {
    const labels: Record<string, string> = {
      repo: "Repositories",
      issue: "Issues",
      pr: "Pull Requests",
      readme: "Readmes",
      code_file: "Code Files",
      page: "Pages",
      database: "Databases",
      block: "Blocks",
      message: "Messages",
      channel: "Channels",
      thread: "Threads",
      team: "Teams",
      project: "Projects",
      figma_file: "Design Files",
      figma_account_info: "Account Info",
      epic: "Epics",
      sprint: "Sprints",
    };
    return labels[contentType] || contentType.charAt(0).toUpperCase() + contentType.slice(1);
  }

  /**
   * Calculate word count from content text.
   * Combines all available text and counts words.
   */
  private static calculateWordCount(contentText: string | null, title: string): number {
    const combined = `${title || ""} ${contentText || ""}`;
    const words = combined
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    return words.length;
  }

  /**
   * Get available content types for a connection.
   */
  static async getContentTypes(
    connectionId: string,
    userId: string
  ): Promise<Array<{ type: string; count: number }>> {
    const connection = await prisma.externalToolConnection.findFirst({
      where: { id: connectionId, user_id: userId },
    });
    if (!connection) {
      throw new Error("Connection not found or not owned by user");
    }

    const results = await prisma.externalToolContent.groupBy({
      by: ["content_type"],
      where: { connection_id: connectionId },
      _count: { content_type: true },
    });

    return results.map((r) => ({
      type: r.content_type,
      count: r._count.content_type,
    }));
  }

  /**
   * Import a synced external content item as a new Project.
   * Converts the content into TipTap-compatible JSON format.
   */
  static async importAsProject(options: {
    contentId: string;
    userId: string;
    workspaceId?: string;
  }): Promise<ImportResult> {
    const { contentId, userId, workspaceId } = options;

    // Fetch the content item
    const contentItem = await prisma.externalToolContent.findUnique({
      where: { id: contentId },
      include: {
        connection: {
          select: {
            tool_type: true,
            tool_name: true,
            workspace_id: true,
          },
        },
      },
    });

    if (!contentItem) {
      throw new Error("Content item not found");
    }

    // Verify the user owns this connection
    if (contentItem.connection.workspace_id !== workspaceId) {
      // For safety, check via the connection's user_id
      const connection = await prisma.externalToolConnection.findUnique({
        where: { id: contentItem.connection_id },
        select: { user_id: true },
      });
      if (connection?.user_id !== userId) {
        throw new Error("Not authorized to import this content");
      }
    }

    // Determine content format based on tool type and content type
    const contentFormat = IntegrationImportService.getContentFormat(
      contentItem.tool_type,
      contentItem.content_type
    );

    // Build content in the appropriate format
    let editorContent: any;
    let blockContent: any = null;

    // Check if we have pre-built structured blocks from sync (e.g., Notion page body blocks)
    const metadata = contentItem.metadata as any;
    const existingBlockContent = metadata?.block_content;

    if (contentFormat === "blocks" && existingBlockContent && Array.isArray(existingBlockContent) && existingBlockContent.length > 0) {
      // Use the pre-built structured blocks from Notion connector
      blockContent = existingBlockContent;
      // Also build TipTap for backward compatibility
      editorContent = IntegrationImportService.buildTipTapContent(
        contentItem.title,
        contentItem.content_text,
        contentItem.tool_type,
        contentItem.content_url,
        contentItem.channel_or_project,
        contentItem.author_name
      );
    } else if (contentFormat === "blocks") {
      blockContent = IntegrationImportService.buildBlockNoteContent(
        contentItem.title,
        contentItem.content_text,
        contentItem.tool_type,
        contentItem.content_url,
        contentItem.channel_or_project,
        contentItem.author_name
      );
      // Also build TipTap for backward compatibility
      editorContent = IntegrationImportService.buildTipTapContent(
        contentItem.title,
        contentItem.content_text,
        contentItem.tool_type,
        contentItem.content_url,
        contentItem.channel_or_project,
        contentItem.author_name
      );
    } else {
      editorContent = IntegrationImportService.buildTipTapContent(
        contentItem.title,
        contentItem.content_text,
        contentItem.tool_type,
        contentItem.content_url,
        contentItem.channel_or_project,
        contentItem.author_name
      );
    }

    // Determine the effective workspace_id
    const effectiveWorkspaceId = workspaceId || contentItem.connection.workspace_id || null;

    // Calculate word count from content text for progress tracking
    const wordCount = IntegrationImportService.calculateWordCount(
      contentItem.content_text,
      contentItem.title || ""
    );

    // Create the project with content_format flag
    const project = await prisma.project.create({
      data: {
        user_id: userId,
        workspace_id: effectiveWorkspaceId,
        title: contentItem.title || `Imported from ${contentItem.connection.tool_name}`,
        content: editorContent,
        word_count: wordCount,
        type: "document",
        status: "draft",
        content_format: contentFormat,
        block_content: blockContent,
        metadata: {
          source_tool: contentItem.tool_type,
          source_url: contentItem.content_url,
          source_external_id: contentItem.external_id,
          source_channel: contentItem.channel_or_project,
          source_author: contentItem.author_name,
          imported_at: new Date().toISOString(),
          external_content_id: contentItem.id, // Reference to ExternalToolContent for embed rendering
        },
        // Store import source info in description
        description: `Imported from ${contentItem.tool_type} \u2014 ${contentItem.channel_or_project || contentItem.content_type}. Source: ${contentItem.content_url || 'N/A'}`,
      },
    });

    // Generate embedding for the new project
    try {
      const { ContextEmbeddingService } = await import("../contextEmbeddingService");
      await ContextEmbeddingService.upsertForProject({
        id: project.id,
        user_id: userId,
        workspace_id: effectiveWorkspaceId,
        title: project.title || "",
        description: project.description,
        content: editorContent,
      });
    } catch (err: any) {
      logger.warn("Failed to index imported project", { error: err.message });
    }

    logger.info("Content imported as project", {
      projectId: project.id,
      sourceTool: contentItem.tool_type,
      sourceId: contentItem.external_id,
      contentFormat,
    });

    return {
      projectId: project.id,
      title: project.title || "",
      source_tool: contentItem.tool_type,
      source_url: contentItem.content_url,
      source_external_id: contentItem.external_id,
      content_format: contentFormat,
    };
  }

  /**
   * Determine the best content format for imported content.
   * V1: Use "editor" format for all tools. Notion content is stored as
   * clean markdown (no more BlockNote conversion edge cases).
   * "blocks" format is reserved for future use with native block editors.
   */
  private static getContentFormat(toolType: string, _contentType: string): "editor" | "blocks" {
    // V1: Everything uses the standard editor (TipTap) with markdown content.
    return "editor";
  }

  /**
   * Build BlockNote-compatible JSON blocks from external content.
   * Used for Notion pages, Jira issues, and other block-structured content.
   */
  private static buildBlockNoteContent(
    title: string | null,
    contentText: string | null,
    toolType: string,
    contentUrl: string | null,
    channelOrProject: string | null,
    authorName: string | null
  ): any[] {
    const blocks: any[] = [];
    const generateId = () => Math.random().toString(36).substring(2, 12);

    // Source attribution header
    const metaParts: string[] = [];
    metaParts.push(`Imported from ${toolType.charAt(0).toUpperCase() + toolType.slice(1)}`);
    if (channelOrProject) metaParts.push(`in ${channelOrProject}`);
    if (authorName) metaParts.push(`by ${authorName}`);

    // Title
    blocks.push({
      id: generateId(),
      type: "heading",
      props: { level: 1, textColor: "default", backgroundColor: "default", textAlignment: "left" },
      content: title || "Untitled",
      children: [],
    });

    // Source metadata
    blocks.push({
      id: generateId(),
      type: "paragraph",
      props: { textColor: "gray", backgroundColor: "default", textAlignment: "left" },
      content: metaParts.join(" "),
      children: [],
    });

    // Source link
    if (contentUrl) {
      blocks.push({
        id: generateId(),
        type: "paragraph",
        props: { textColor: "blue", backgroundColor: "default", textAlignment: "left" },
        content: "View original",
        children: [],
      });
    }

    // Main content blocks
    if (contentText) {
      const paragraphs = contentText.split(/\n\s*\n/).filter(Boolean);
      for (const para of paragraphs) {
        const trimmed = para.trim();
        if (!trimmed) continue;

        if (trimmed.length < 100 && !trimmed.endsWith(".") && !trimmed.endsWith(",") && !trimmed.endsWith(":")) {
          blocks.push({
            id: generateId(),
            type: "heading",
            props: { level: 2, textColor: "default", backgroundColor: "default", textAlignment: "left" },
            content: trimmed,
            children: [],
          });
        } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
          // Bullet list items
          const items = trimmed.split(/\n/).filter(l => l.trim().startsWith("- ") || l.trim().startsWith("* ") || l.trim().startsWith("• "));
          for (const item of items) {
            blocks.push({
              id: generateId(),
              type: "bulletListItem",
              props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
              content: item.replace(/^[\-\*•]\s*/, ""),
              children: [],
            });
          }
        } else if (/^\d+\./.test(trimmed)) {
          // Ordered list items
          const items = trimmed.split(/\n/).filter(l => /^\d+\./.test(l.trim()));
          for (const item of items) {
            blocks.push({
              id: generateId(),
              type: "numberedListItem",
              props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
              content: item.replace(/^\d+\.\s*/, ""),
              children: [],
            });
          }
        } else if (trimmed.startsWith("```") || trimmed.startsWith("    ")) {
          // Code blocks
          blocks.push({
            id: generateId(),
            type: "codeBlock",
            props: { language: "plainText" },
            content: trimmed.replace(/^```\w*\n?/, ""),
            children: [],
          });
        } else if (trimmed.startsWith("> ")) {
          // Blockquote → styled paragraph
          blocks.push({
            id: generateId(),
            type: "paragraph",
            props: { textColor: "default", backgroundColor: "gray", textAlignment: "left" },
            content: trimmed.replace(/^>\s*/, ""),
            children: [],
          });
        } else {
          // Regular paragraph
          blocks.push({
            id: generateId(),
            type: "paragraph",
            props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
            content: trimmed,
            children: [],
          });
        }
      }
    } else {
      blocks.push({
        id: generateId(),
        type: "paragraph",
        props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
        content: "No content available.",
        children: [],
      });
    }

    return blocks;
  }

  /**
   * Convert external content into TipTap-compatible JSON document format.
   * This creates a structured document that the editor can render.
   */
  private static buildTipTapContent(
    title: string | null,
    contentText: string | null,
    toolType: string,
    contentUrl: string | null,
    channelOrProject: string | null,
    authorName: string | null
  ): any {
    const nodes: any[] = [];

    // Add a source attribution block at the top
    nodes.push({
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: title || "Untitled" }],
    });

    // Add source metadata
    const metaParts: string[] = [];
    metaParts.push(`Imported from ${toolType.charAt(0).toUpperCase() + toolType.slice(1)}`);
    if (channelOrProject) metaParts.push(`in ${channelOrProject}`);
    if (authorName) metaParts.push(`by ${authorName}`);

    nodes.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [
            { type: "italic" },
            { type: "textStyle", attrs: { color: "#6b7280" } },
          ],
          text: metaParts.join(" "),
        },
      ],
    });

    // Add source link if available
    if (contentUrl) {
      nodes.push({
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [
              {
                type: "link",
                attrs: { href: contentUrl, target: "_blank" },
              },
            ],
            text: `View original →`,
          },
        ],
      });
    }

    // Add a separator
    nodes.push({ type: "horizontalRule" });

    // Add the main content as paragraphs
    if (contentText) {
      const paragraphs = contentText.split(/\n\s*\n/).filter(Boolean);
      for (const para of paragraphs) {
        const trimmed = para.trim();
        if (!trimmed) continue;

        // Check if it looks like a heading (short line, no punctuation at end)
        if (trimmed.length < 100 && !trimmed.endsWith(".") && !trimmed.endsWith(",") && !trimmed.endsWith(":")) {
          nodes.push({
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: trimmed }],
          });
        } else {
          // Regular paragraph — split long content into chunks if needed
          if (trimmed.length > 10000) {
            // Split into smaller paragraphs
            const chunks = trimmed.match(/.{1,5000}(?:\s|$)/g) || [trimmed];
            for (const chunk of chunks) {
              nodes.push({
                type: "paragraph",
                content: [{ type: "text", text: chunk }],
              });
            }
          } else {
            nodes.push({
              type: "paragraph",
              content: [{ type: "text", text: trimmed }],
            });
          }
        }
      }
    } else {
      nodes.push({
        type: "paragraph",
        content: [{ type: "text", text: "No content available." }],
      });
    }

    return {
      type: "doc",
      content: nodes,
    };
  }
}
