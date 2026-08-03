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

            items.push({
              external_id: `${site.id}_${issue.key}`,
              content_type: "ticket",
              title: `${issue.key}: ${fields.summary}`,
              content_text: [description, commentText].filter(Boolean).join("\n\n").slice(0, 8000),
              content_url: `${siteUrl}/browse/${issue.key}`,
              author_name: fields.reporter?.displayName || null,
              author_avatar: fields.reporter?.avatarUrls?.["48x48"] || null,
              channel_or_project: fields.project?.key || null,
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
