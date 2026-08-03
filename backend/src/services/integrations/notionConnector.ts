/**
 * Notion Connector
 *
 * Implements OAuth2 (or integration token) for reading pages, databases, and blocks.
 * Notion uses a single "Internal Integration" token (Bearer) or OAuth2 for public integrations.
 * We support both: OAuth2 for public apps, and a direct integration token for simpler setup.
 *
 * API: https://developers.notion.com/reference
 * Rate Limits: 3 requests per second
 * Pagination: Cursor-based (start_cursor param)
 */

import { ConnectorBase, ToolType, OAuthConfig, TokenResult, SyncedItem } from "./connectorBase";
import { convertNotionBlocksToBlockNote } from "./notionToBlockNote";

export class NotionConnector extends ConnectorBase {
  readonly toolType: ToolType = "notion";
  readonly displayName = "Notion";
  readonly iconUrl = "https://cdn.brandfetch.io/id-0MnQzDp/w/512/h/512/theme/dark/icon.jpeg";
  readonly description = "Search across Notion pages, databases, and wikis";

  readonly oauthConfig: OAuthConfig = {
    clientId: process.env.NOTION_CLIENT_ID || "",
    clientSecret: process.env.NOTION_CLIENT_SECRET || "",
    authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
    tokenUrl: "https://api.notion.com/v1/oauth/token",
    scopes: [], // Notion doesn't use scopes in the traditional OAuth sense
  };

  private readonly API_BASE = "https://api.notion.com/v1";
  private readonly NOTION_VERSION = "2022-06-28";

  async exchangeCode(code: string, redirectUri: string): Promise<TokenResult> {
    // Notion uses Basic Auth for token exchange (client_id:client_secret as Base64)
    const credentials = Buffer.from(
      `${this.oauthConfig.clientId}:${this.oauthConfig.clientSecret}`
    ).toString("base64");

    const res = await fetch(this.oauthConfig.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(`Notion OAuth error: ${data.error}`);

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResult> {
    // Notion OAuth refresh tokens are long-lived but can be refreshed
    const credentials = Buffer.from(
      `${this.oauthConfig.clientId}:${this.oauthConfig.clientSecret}`
    ).toString("base64");

    const res = await fetch(this.oauthConfig.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(`Notion token refresh failed: ${data.error}`);

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    };
  }

  async fetchWorkspaceInfo(accessToken: string) {
    // Notion: use the token itself to fetch bot user info
    const res = await fetch(`${this.API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Notion-Version": this.NOTION_VERSION,
      },
    });
    const data = await res.json();
    if (data.object === "error") throw new Error(`Notion API error: ${data.message}`);

    // For OAuth, the workspace info comes from the token response
    // For internal integrations, we get the bot user
    return {
      workspace_external_id: data.id,
      workspace_external_name: data.name || "Notion Workspace",
      metadata: {
        type: data.type,
        avatar_url: data.avatar_url,
      },
    };
  }

  async fetchContent(
    accessToken: string,
    options: { since?: Date; pageSize?: number; cursor?: string }
  ): Promise<{ items: SyncedItem[]; nextCursor?: string; hasMore: boolean }> {
    const items: SyncedItem[] = [];
    const pageSize = options.pageSize || 100;

    // Search all accessible pages
    let hasMore = true;
    let startCursor = options.cursor;

    while (hasMore && items.length < 500) { // Cap at 500 items per sync
      const body: Record<string, any> = {
        page_size: Math.min(pageSize, 100),
      };
      if (startCursor) body.start_cursor = startCursor;

      const res = await fetch(`${this.API_BASE}/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Notion-Version": this.NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.object === "error") throw new Error(`Notion search error: ${data.message}`);

      for (const result of data.results || []) {
        const item = this.parseNotionResult(result);
        if (item) {
          // For pages (not databases), fetch the actual page body content
          if (result.object === "page" && item.content_type === "page") {
            try {
              const bodyContent = await this.fetchPageBodyContent(accessToken, result.id);
              if (bodyContent) {
                // Store plain text for search/embedding (truncated)
                item.content_text = bodyContent.text?.slice(0, 8000) || item.content_text;
                // Store structured blocks for BlockNote rendering
                if (bodyContent.blocks && bodyContent.blocks.length > 0) {
                  item.block_content = bodyContent.blocks;
                }
              }
            } catch (err: any) {
              // Log but don't fail - we still have property text as fallback
              console.warn(`Failed to fetch page body for ${result.id}:`, err.message);
            }
          }
          items.push(item);
        }
      }

      hasMore = data.has_more;
      startCursor = data.next_cursor;
    }

    return {
      items,
      nextCursor: startCursor || undefined,
      hasMore,
    };
  }

  private parseNotionResult(result: any): SyncedItem | null {
    if (!result || !result.id) return null;

    const title = this.extractTitle(result);
    const content = this.extractPlainText(result);
    const url = result.url || result.public_url || "";
    const lastEdited = result.last_edited_time;

    let contentType = "page";
    if (result.object === "database") contentType = "database";
    else if (result.parent?.type === "database_id") contentType = "database_entry";

    // Determine hierarchy: Notion parent types map to depth levels
    let depth = 0;
    let parentExternalId: string | null = null;
    const parentType = result.parent?.type;

    if (parentType === "page_id") {
      // Child page → depth 1, parent is the page
      depth = 1;
      parentExternalId = result.parent.page_id;
    } else if (parentType === "database_id") {
      // Database entry → depth 1, parent is the database
      depth = 1;
      parentExternalId = result.parent.database_id;
    } else if (parentType === "workspace") {
      // Top-level page → depth 0 (root)
      depth = 0;
    }

    return {
      external_id: result.id,
      content_type: contentType,
      title: title || "Untitled",
      content_text: content || null,
      content_url: url,
      author_name: null,
      author_avatar: null,
      channel_or_project: parentType === "database_id"
        ? result.parent.database_id
        : null,
      parent_external_id: parentExternalId,
      depth,
      metadata: {
        object: result.object,
        icon: result.icon,
        cover: result.cover,
        last_edited_time: lastEdited,
        created_time: result.created_time,
        parent_type: parentType,
        tags: result.properties?.Tags?.multi_select?.map((t: any) => t.name),
        status: result.properties?.Status?.status?.name,
        type: result.type,
      },
    };
  }

  private extractTitle(result: any): string {
    // Try various title property names
    if (result.properties?.title?.title) {
      return result.properties.title.title
        .map((t: any) => t.plain_text)
        .join("");
    }
    if (result.properties?.Name?.title) {
      return result.properties.Name.title
        .map((t: any) => t.plain_text)
        .join("");
    }
    if (result.title) {
      if (Array.isArray(result.title)) {
        return result.title.map((t: any) => t.plain_text).join("");
      }
      return typeof result.title === "string" ? result.title : "";
    }
    return "";
  }

  private extractPlainText(result: any): string {
    // Extract plain text from page content (paragraphs, headings, etc.)
    const texts: string[] = [];

    if (result.properties) {
      for (const [, prop] of Object.entries(result.properties) as any[]) {
        if (prop.rich_text && Array.isArray(prop.rich_text)) {
          texts.push(
            prop.rich_text.map((t: any) => t.plain_text).join("")
          );
        }
      }
    }

    return texts.filter(Boolean).join("\n").slice(0, 8000);
  }

  /**
   * Fetch the actual page body content from Notion blocks API.
   * Returns both plain text (for search/embedding) and structured blocks
   * (for BlockNote editor rendering).
   */
  private async fetchPageBodyContent(
    accessToken: string,
    pageId: string
  ): Promise<{ text: string; blocks: any[] } | null> {
    const rawBlocks: any[] = [];
    const texts: string[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore && texts.join("\n").length < 16000) {
      const url = `${this.API_BASE}/blocks/${pageId}/children${cursor ? `?start_cursor=${cursor}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Notion-Version": this.NOTION_VERSION,
        },
      });

      if (!res.ok) break;

      const data = await res.json();
      if (data.object === "error") break;

      for (const block of data.results || []) {
        // For structured blocks: fetch children and attach them
        if (block.has_children) {
          block._children = await this.fetchBlockChildrenRaw(accessToken, block.id);
        }
        rawBlocks.push(block);

        // For plain text: extract text (used for search/embedding)
        const text = this.extractBlockText(block);
        if (text) texts.push(text);
      }

      hasMore = data.has_more || false;
      cursor = data.next_cursor || undefined;
    }

    // Convert raw Notion blocks to BlockNote format
    const blockNoteBlocks = convertNotionBlocksToBlockNote(rawBlocks);

    return {
      text: texts.filter(Boolean).join("\n") || "",
      blocks: blockNoteBlocks,
    };
  }

  /** Fetch child blocks as raw Notion blocks (preserving structure for BlockNote conversion) */
  private async fetchBlockChildrenRaw(
    accessToken: string,
    blockId: string
  ): Promise<any[]> {
    const blocks: any[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore && blocks.length < 200) {
      const url = `${this.API_BASE}/blocks/${blockId}/children${cursor ? `?start_cursor=${cursor}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Notion-Version": this.NOTION_VERSION,
        },
      });

      if (!res.ok) break;
      const data = await res.json();
      if (data.object === "error") break;

      for (const block of data.results || []) {
        // Recursively fetch nested children
        if (block.has_children) {
          block._children = await this.fetchBlockChildrenRaw(accessToken, block.id);
        }
        blocks.push(block);
      }

      hasMore = data.has_more || false;
      cursor = data.next_cursor || undefined;
    }

    return blocks;
  }

  /** Fetch child blocks as plain text (legacy, for backward compatibility) */
  private async fetchBlockChildren(
    accessToken: string,
    blockId: string
  ): Promise<string | null> {
    const texts: string[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore && texts.join("\n").length < 4000) {
      const url = `${this.API_BASE}/blocks/${blockId}/children${cursor ? `?start_cursor=${cursor}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Notion-Version": this.NOTION_VERSION,
        },
      });

      if (!res.ok) break;
      const data = await res.json();
      if (data.object === "error") break;

      for (const block of data.results || []) {
        const text = this.extractBlockText(block);
        if (text) texts.push(text);
      }

      hasMore = data.has_more || false;
      cursor = data.next_cursor || undefined;
    }

    return texts.filter(Boolean).join("\n") || null;
  }

  /** Extract plain text from a single Notion block */
  private extractBlockText(block: any): string {
    if (!block || !block.type) return "";

    const blockData = block[block.type];
    if (!blockData) return "";

    // Handle rich_text blocks (paragraphs, headings, bullets, numbered lists, quotes, callouts)
    if (Array.isArray(blockData.rich_text)) {
      return blockData.rich_text
        .map((t: any) => t.plain_text)
        .join("");
    }

    // Handle toggle blocks
    if (blockData.rich_text && Array.isArray(blockData.rich_text)) {
      return blockData.rich_text.map((t: any) => t.plain_text).join("");
    }

    // Handle code blocks
    if (block.type === "code" && blockData.rich_text) {
      const language = blockData.language ? `[${blockData.language}] ` : "";
      return language + blockData.rich_text.map((t: any) => t.plain_text).join("");
    }

    // Handle bookmark, equation, table of contents, divider
    if (block.type === "bookmark") return blockData.url || "";
    if (block.type === "equation") return blockData.expression || "";
    if (block.type === "divider") return "---";

    return "";
  }

  getItemUrl(item: SyncedItem): string {
    return item.content_url || "";
  }
}
