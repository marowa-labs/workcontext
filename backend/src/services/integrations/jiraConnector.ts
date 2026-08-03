/**
 * Jira Connector
 *
 * Implements OAuth 2.0 (3LO) for Atlassian Cloud products.
 * Scopes: read:jira-work, read:jira-user, offline_access
 *
 * API: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
 * Rate Limits: Varies by endpoint (typically 100 requests/min for search)
 * Pagination: startAt + maxResults
 *
 * Important: Atlassian OAuth tokens can be refreshed via refresh_token.
 * The access token grants access to ALL accessible Jira Cloud sites for the user.
 */

import { ConnectorBase, ToolType, OAuthConfig, TokenResult, SyncedItem } from "./connectorBase";

export class JiraConnector extends ConnectorBase {
  readonly toolType: ToolType = "jira";
  readonly displayName = "Jira";
  readonly iconUrl = "https://cdn.brandfetch.io/id-9QwYm1g_/w/512/h/512/theme/dark/icon.jpeg";
  readonly description = "Search across Jira issues, boards, and projects";

  readonly oauthConfig: OAuthConfig = {
    clientId: process.env.JIRA_CLIENT_ID || "",
    clientSecret: process.env.JIRA_CLIENT_SECRET || "",
    authorizationUrl: "https://auth.atlassian.com/authorize",
    tokenUrl: "https://auth.atlassian.com/oauth/token",
    scopes: [
      "read:jira-work",
      "read:jira-user",
      "offline_access",
      "read:board-scope:jira-software",
    ],
  };

  private readonly ATlassianTokenUrl = "https://auth.atlassian.com/oauth/token";

  async exchangeCode(code: string, redirectUri: string): Promise<TokenResult> {
    const res = await fetch(this.ATlassianTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: this.oauthConfig.clientId,
        client_secret: this.oauthConfig.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(`Jira OAuth error: ${data.error_description || data.error}`);

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResult> {
    const res = await fetch(this.ATlassianTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: this.oauthConfig.clientId,
        client_secret: this.oauthConfig.clientSecret,
        refresh_token: refreshToken,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(`Jira token refresh failed: ${data.error_description || data.error}`);

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token, // New refresh token issued
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    };
  }

  async fetchWorkspaceInfo(accessToken: string) {
    // Fetch accessible Jira sites
    const res = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    const data = await res.json();
    if (!data.data || data.data.length === 0) {
      throw new Error("No accessible Jira sites found");
    }

    // Use the first accessible site (or most recent)
    const site = data.data[0];

    return {
      workspace_external_id: site.id,
      workspace_external_name: site.name,
      metadata: {
        url: site.url,
        scopes: site.scopes,
        icon_url: site.icon?.url,
        all_sites: data.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          url: s.url,
        })),
      },
    };
  }

  async fetchContent(
    accessToken: string,
    options: { since?: Date; pageSize?: number; cursor?: string }
  ): Promise<{ items: SyncedItem[]; nextCursor?: string; hasMore: boolean }> {
    const items: SyncedItem[] = [];
    const pageSize = options.pageSize || 50;

    // First, get accessible resources to find Jira site URLs
    const resourcesRes = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    const resources = await resourcesRes.json();
    const sites = resources.data || [];

    for (const site of sites.slice(0, 3)) { // Limit to 3 sites
      const siteUrl = site.url; // e.g., https://yourteam.atlassian.net

      // JQL: fetch recently updated issues
      let jql = "updated >= -7d";
      if (options.since) {
        const sinceStr = options.since.toISOString().split("T")[0];
        jql = `updated >= "${sinceStr}"`;
      }

      let startAt = parseInt(options.cursor || "0");
      let total = Infinity;

      while (startAt < Math.min(total, 200)) { // Cap at 200 issues per site
        const searchUrl = `${siteUrl}/rest/api/3/search`;
        const params = new URLSearchParams({
          jql,
          maxResults: pageSize.toString(),
          startAt: startAt.toString(),
          fields: "summary,description,status,assignee,reporter,created,updated,issuetype,priority,labels,project,comment",
        });

        try {
          const searchRes = await fetch(`${searchUrl}?${params.toString()}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          });
          const searchData = await searchRes.json();
          if (searchData.errorMessages) {
            throw new Error(searchData.errorMessages.join(", "));
          }

          total = searchData.total || 0;

          for (const issue of searchData.issues || []) {
            const fields = issue.fields;
            const description = fields.description
              ? this.extractAtlassianDoc(fields.description)
              : "";
            const commentText = (fields.comment?.comments || [])
              .slice(0, 5)
              .map((c: any) => this.extractAtlassianDoc(c.body))
              .filter(Boolean)
              .join("\n");

            // Convert ADF description to BlockNote blocks
            let blockContent: any[] | undefined;
            if (fields.description && typeof fields.description === "object" && fields.description.type === "doc") {
              blockContent = this.adfToBlockNoteBlocks(fields.description);
            }

            items.push({
              external_id: `${site.id}_${issue.key}`,
              content_type: "ticket",
              title: `${issue.key}: ${fields.summary}`,
              content_text: [description, commentText].filter(Boolean).join("\n\n").slice(0, 8000),
              content_url: `${siteUrl}/browse/${issue.key}`,
              author_name: fields.reporter?.displayName || null,
              author_avatar: fields.reporter?.avatarUrls?.["48x48"] || null,
              channel_or_project: fields.project?.key || null,
              block_content: blockContent,
              metadata: {
                site_id: site.id,
                site_url: siteUrl,
                issue_key: issue.key,
                status: fields.status?.name,
                priority: fields.priority?.name,
                issue_type: fields.issuetype?.name,
                assignee: fields.assignee?.displayName,
                labels: fields.labels,
                created: fields.created,
                updated: fields.updated,
                comment_count: fields.comment?.total || 0,
              },
            });
          }

          startAt += (searchData.issues || []).length;
        } catch (err) {
          // Skip sites where we don't have access
          break;
        }
      }
    }

    return {
      items,
      nextCursor: undefined, // Jira uses startAt, handled internally
      hasMore: false,
    };
  }

  /**
   * Extract plain text from Atlassian Document Format (ADF) or markdown
   */
  private extractAtlassianDoc(doc: any): string {
    if (!doc) return "";
    if (typeof doc === "string") return doc;
    if (doc.type === "doc" && doc.content) {
      return this.walkAdf(doc.content);
    }
    return JSON.stringify(doc).slice(0, 2000);
  }

  /**
   * Convert Atlassian Document Format (ADF) to BlockNote-compatible blocks.
   * ADF is structurally similar to ProseMirror/TipTap.
   */
  private adfToBlockNoteBlocks(doc: any): any[] {
    if (!doc || !doc.content) return [];
    const blocks: any[] = [];
    for (const node of doc.content) {
      const converted = this.convertAdfNode(node);
      if (converted) {
        if (Array.isArray(converted)) blocks.push(...converted);
        else blocks.push(converted);
      }
    }
    return blocks;
  }

  private convertAdfNode(node: any): any | any[] | null {
    if (!node) return null;
    const text = this.extractAdfText(node);
    const id = Math.random().toString(36).substring(2, 12) + Date.now().toString(36);

    switch (node.type) {
      case "heading": {
        const level = Math.min(node.attrs?.level || 1, 3) as 1 | 2 | 3;
        return { id, type: "heading", props: { level, textColor: "default", backgroundColor: "default", textAlignment: "left" }, content: text, children: [] };
      }
      case "paragraph":
        return { id, type: "paragraph", props: { textColor: "default", backgroundColor: "default", textAlignment: "left" }, content: text, children: [] };
      case "bulletList":
      case "orderedList":
      case "taskList":
        if (node.content) {
          return node.content.map((child: any) => this.convertAdfNode(child)).flat().filter(Boolean);
        }
        return null;
      case "listItem":
      case "taskItem":
        if (node.content) {
          // Check if it's inside a taskList (checkbox)
          const innerContent = node.content.map((child: any) => this.convertAdfNode(child)).flat().filter(Boolean);
          if (innerContent.length > 0) {
            return {
              ...innerContent[0],
              type: node.parentType === "taskList" || node.attrs?.localId ? "checkListItem" : innerContent[0].type,
              props: { ...innerContent[0].props, ...(node.attrs?.state === "TODO" ? { checked: false } : node.attrs?.state === "DONE" ? { checked: true } : {}) },
            };
          }
          return null;
        }
        return null;
      case "codeBlock":
        return { id, type: "codeBlock", props: { language: node.attrs?.language || "plainText" }, content: text, children: [] };
      case "blockquote":
        return { id, type: "paragraph", props: { textColor: "default", backgroundColor: "gray", textAlignment: "left" }, content: text, children: [] };
      case "rule":
        return { id, type: "paragraph", props: { textColor: "default", backgroundColor: "default", textAlignment: "left" }, content: "---", children: [] };
      case "mediaSingle":
      case "media":
        if (node.content) {
          return node.content.map((child: any) => this.convertAdfNode(child)).flat().filter(Boolean);
        }
        return null;
      case "mediaGroup":
        if (node.content) {
          return node.content.map((child: any) => this.convertAdfNode(child)).flat().filter(Boolean);
        }
        return null;
      case "panel":
        // Panel → callout-style paragraph
        return { id, type: "paragraph", props: { textColor: "default", backgroundColor: "yellow", textAlignment: "left" }, content: text, children: [] };
      case "table":
        // Render table as markdown-style code block
        return this.convertAdfTable(node);
      case "tableRow":
      case "tableCell":
      case "tableHeader":
        return null; // Handled by parent table
      case "emoji":
        return { id, type: "paragraph", props: { textColor: "default", backgroundColor: "default", textAlignment: "left" }, content: node.attrs?.shortName || "😀", children: [] };
      case "mention":
        return { id, type: "paragraph", props: { textColor: "blue", backgroundColor: "default", textAlignment: "left" }, content: `@${node.attrs?.text || node.attrs?.userId || "user"}`, children: [] };
      case "hardBreak":
        return null;
      case "text":
        return null; // Handled by parent
      default:
        return text ? { id, type: "paragraph", props: { textColor: "default", backgroundColor: "default", textAlignment: "left" }, content: text, children: [] } : null;
    }
  }

  private convertAdfTable(node: any): any {
    const rows: string[] = [];
    if (node.content) {
      for (const row of node.content) {
        if (row.type === "tableRow" && row.content) {
          const cells = row.content
            .filter((cell: any) => cell.type === "tableCell" || cell.type === "tableHeader")
            .map((cell: any) => this.extractAdfText(cell))
            .join(" | ");
          rows.push(`| ${cells} |`);
        }
      }
    }
    if (rows.length > 1) {
      const headerCells = rows[0].split("|").filter(Boolean).length;
      rows.splice(1, 0, `| ${Array(headerCells).fill("---").join(" | ")} |`);
    }
    const id = Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    return { id, type: "codeBlock", props: { language: "markdown" }, content: rows.join("\n"), children: [] };
  }

  private extractAdfText(node: any): string {
    if (!node) return "";
    if (node.type === "text") return node.text || "";
    if (node.content && Array.isArray(node.content)) {
      return node.content.map((child: any) => this.extractAdfText(child)).join("");
    }
    return "";
  }

  private walkAdf(nodes: any[]): string {
    return nodes
      .map((node) => {
        if (node.type === "text") return node.text || "";
        if (node.content) return this.walkAdf(node.content);
        return "";
      })
      .join(" ");
  }

  getItemUrl(item: SyncedItem): string {
    return item.content_url || "";
  }
}
