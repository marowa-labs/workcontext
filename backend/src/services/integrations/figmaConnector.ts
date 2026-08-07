/**
 * Figma Connector
 *
 * Implements OAuth2 for Figma.
 * Scopes: file_read, file_write, library_read
 *
 * API: https://www.figma.com/developers/api
 * Rate Limits: 60 requests per minute
 * Pagination: Cursor-based for some endpoints
 *
 * We fetch: Figma files, file comments, and project listings.
 */

import {
  ConnectorBase,
  ToolType,
  OAuthConfig,
  TokenResult,
  SyncedItem,
} from "./connectorBase";

export class FigmaConnector extends ConnectorBase {
  readonly toolType: ToolType = "figma";
  readonly displayName = "Figma";
  readonly iconUrl =
    "https://cdn.brandfetch.io/id-0MnQzDp/w/512/h/512/theme/dark/icon.jpeg";
  readonly description = "Search across Figma files, designs, and comments";

  readonly oauthConfig: OAuthConfig = {
    clientId: process.env.FIGMA_CLIENT_ID || "",
    clientSecret: process.env.FIGMA_CLIENT_SECRET || "",
    authorizationUrl: "https://www.figma.com/oauth",
    tokenUrl: "https://www.figma.com/api/oauth/token",
    scopes: ["file_read"],
    usePKCE: true,
    omitResponseType: false,
  };

  private readonly API_BASE = "https://api.figma.com/v1";

  async exchangeCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string,
  ): Promise<TokenResult> {
    // Figma requires PKCE: grant_type + code_verifier
    const body: Record<string, string> = {
      code,
      redirect_uri: redirectUri,
      client_id: this.oauthConfig.clientId,
      client_secret: this.oauthConfig.clientSecret,
      grant_type: "authorization_code",
    };

    if (codeVerifier) {
      body.code_verifier = codeVerifier;
    }

    const res = await fetch(this.oauthConfig.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body),
    });
    const data = await res.json();
    if (data.err || data.error) {
      throw new Error(`Figma OAuth error: ${data.err || data.error}`);
    }

    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    };
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResult> {
    // Figma doesn't use refresh tokens in the standard OAuth flow.
    // Tokens are long-lived. If expired, user must re-authenticate.
    throw new Error(
      "Figma tokens don't support refresh. Re-authenticate if expired.",
    );
  }

  async fetchWorkspaceInfo(accessToken: string) {
    // Figma: get current user info
    const res = await fetch(`${this.API_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (data.err) throw new Error(`Figma API error: ${data.err}`);

    return {
      workspace_external_id: data.id,
      workspace_external_name: data.handle || data.email || "Figma Account",
      metadata: {
        handle: data.handle,
        email: data.email,
        img_url: data.img_url,
      },
    };
  }

  async fetchContent(
    accessToken: string,
    options: { since?: Date; pageSize?: number; cursor?: string },
  ): Promise<{ items: SyncedItem[]; nextCursor?: string; hasMore: boolean }> {
    const items: SyncedItem[] = [];
    let isPersonalAccount = false;

    // 1) Fetch team projects (works for organization accounts)
    try {
      const teamsRes = await fetch(`${this.API_BASE}/teams`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (teamsRes.ok) {
        const teams = await teamsRes.json();
        const teamList = teams.teams || [];

        if (teamList.length === 0) {
          isPersonalAccount = true;
        }

        for (const team of teamList.slice(0, 3)) {
          // Create team as ROOT node
          items.push({
            external_id: `figma_team_${team.id}`,
            content_type: "team",
            title: team.name || `Team ${team.id}`,
            content_text: `Figma Team: ${team.name}`,
            content_url: `https://www.figma.com/team/${team.id}`,
            author_name: null,
            author_avatar: null,
            channel_or_project: team.name,
            depth: 0,
            metadata: {
              team_id: team.id,
              team_name: team.name,
              member_count: team.member_count,
            },
          });

          const projectsRes = await fetch(
            `${this.API_BASE}/teams/${team.id}/projects`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
          const projects = await projectsRes.json();

          for (const project of (projects.projects || []).slice(0, 10)) {
            // Create project as child of team
            items.push({
              external_id: `figma_project_${project.id}`,
              content_type: "project",
              title: project.name || `Project ${project.id}`,
              content_text: `Figma Project: ${project.name} (${(project.files || []).length} files)`,
              content_url: `https://www.figma.com/project/${project.id}`,
              author_name: null,
              author_avatar: null,
              channel_or_project: `${team.name} / ${project.name}`,
              parent_external_id: `figma_team_${team.id}`,
              depth: 1,
              metadata: {
                project_id: project.id,
                project_name: project.name,
                team_id: team.id,
                file_count: (project.files || []).length,
              },
            });

            const filesRes = await fetch(
              `${this.API_BASE}/projects/${project.id}/files`,
              { headers: { Authorization: `Bearer ${accessToken}` } },
            );
            const files = await filesRes.json();

            for (const file of (files.files || []).slice(0, 10)) {
              items.push(this.buildFileItem(file, team, project));
            }
          }
        }
      } else if (teamsRes.status === 403 || teamsRes.status === 404) {
        isPersonalAccount = true;
      }
    } catch {
      isPersonalAccount = true;
    }

    // 2) For personal accounts: try to fetch files from the user's own projects
    if (isPersonalAccount) {
      try {
        // Get user info to find their files
        const meRes = await fetch(`${this.API_BASE}/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (meRes.ok) {
          const me = await meRes.json();

          // Figma doesn't have a "list all my files" API for personal accounts.
          // The best we can do is create a placeholder item informing the user
          // that personal account sync is limited.
          if (items.length === 0) {
            items.push({
              external_id: `figma-personal-${me.id}`,
              content_type: "figma_account_info",
              title: `${me.handle || me.email || "Your Figma Account"} — Personal Account`,
              content_text: [
                `Account: ${me.handle || me.email}`,
                `Plan: ${me.plan?.type || "Unknown"}`,
                `Email: ${me.email}`,
                "",
                "Note: Personal Figma accounts have limited API access.",
                "To sync files automatically, create a Team in Figma and move your files there.",
                "Alternatively, you can import individual Figma files by URL from the Integrations page.",
              ].join("\n"),
              content_url: `https://www.figma.com/@${me.handle}`,
              author_name: me.handle || me.email,
              author_avatar: me.img_url || null,
              channel_or_project: null,
              metadata: {
                account_type: "personal",
                handle: me.handle,
                email: me.email,
                plan: me.plan?.type,
                note: "Limited sync — personal accounts cannot enumerate files via API",
              },
            });
          }
        }
      } catch {
        // Best effort — don't fail the entire sync
      }
    }

    return { items, hasMore: false };
  }

  /** Build a SyncedItem from a Figma file object */
  private buildFileItem(file: any, team: any, project: any): SyncedItem {
    return {
      external_id: file.key || file.id,
      content_type: "figma_file",
      title: file.name || "Untitled Figma File",
      content_text: [
        `File: ${file.name}`,
        `Last modified: ${file.lastModified}`,
        `Thumbnail: ${file.thumbnailUrl}`,
        `Pages: ${(file.pages || []).map((p: any) => p.name).join(", ")}`,
        `Components: ${file.componentCount || "N/A"}`,
        `Version: ${file.version}`,
      ]
        .filter(Boolean)
        .join("\n"),
      content_url: `https://www.figma.com/file/${file.key}`,
      author_name: null,
      author_avatar: null,
      channel_or_project: `${team.name} / ${project.name}`,
      parent_external_id: `figma_project_${project.id}`,
      depth: 2,
      metadata: {
        team_id: team.id,
        team_name: team.name,
        project_id: project.id,
        project_name: project.name,
        file_id: file.key || file.id,
        version: file.version,
        last_modified: file.lastModified,
        thumbnail: file.thumbnailUrl,
        page_count: (file.pages || []).length,
        component_count: file.componentCount,
        pages: (file.pages || []).map((p: any) => ({
          id: p.id,
          name: p.name,
        })),
      },
    };
  }

  getItemUrl(item: SyncedItem): string {
    return item.content_url || "";
  }
}
