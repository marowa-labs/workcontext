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
        if (item) items.push(item);
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

  getItemUrl(item: SyncedItem): string {
    return item.content_url || "";
  }
}
