/**
 * GitHub App Connector
 *
 * Implements GitHub App authentication for enterprise-grade integration.
 *
 * Flow:
 * 1. Backend generates a JWT signed with the app's private key
 * 2. User is redirected to GitHub to install the app on their account/org
 * 3. GitHub redirects back with an installation_id
 * 4. Backend exchanges installation_id for an installation access token
 * 5. Token expires in 1 hour, refreshed via new JWT + installation token exchange
 *
 * API: https://docs.github.com/en/rest
 * Auth: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/about-authentication-with-a-github-app
 * Rate Limits: 15,000 requests/hour (authenticated as installation)
 * Permissions: Granular per-repo (issues:read, pull_requests:read, contents:read, metadata:read)
 *
 * Environment variables:
 *   GITHUB_APP_ID          — The GitHub App's numeric ID
 *   GITHUB_APP_PRIVATE_KEY — The PEM-encoded private key (or path to it)
 *   GITHUB_APP_CLIENT_ID   — The OAuth client ID from the GitHub App settings
 *   GITHUB_APP_CLIENT_SECRET — The client secret from the GitHub App settings
 *   GITHUB_APP_SLUG        — The app's URL slug (e.g. "workcontext-integration")
 */

import { ConnectorBase, ToolType, OAuthConfig, TokenResult, SyncedItem } from "./connectorBase";
import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";
import crypto from "crypto";
import fs from "fs";
import path from "path";

export class GitHubAppConnector extends ConnectorBase {
  readonly toolType: ToolType = "github_app";
  readonly displayName = "GitHub (App)";
  readonly iconUrl = "https://cdn.brandfetch.io/id-wVCa7Wd/w/512/h/512/theme/dark/icon.jpeg";
  readonly description = "Enterprise GitHub integration with granular permissions and real-time webhooks";

  readonly oauthConfig: OAuthConfig = {
    clientId: process.env.GITHUB_APP_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_APP_CLIENT_SECRET || "",
    authorizationUrl: "", // Not used — we use installation URL instead
    tokenUrl: "", // Not used — we use installation access token exchange
    scopes: [], // GitHub Apps don't use scopes — permissions are configured in app settings
  };

  private readonly API_BASE = "https://api.github.com";
  private readonly GITHUB_BASE = "https://github.com";

  // ---------- JWT & Token Management ----------

  /**
   * Generate a short-lived JWT signed with the app's private key.
   * This JWT is used to authenticate as the GitHub App itself (not as an installation).
   */
  private generateJWT(): string {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = this.getPrivateKey();

    if (!appId || !privateKey) {
      throw new Error("GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be set");
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60, // Issued at (60s clock drift allowance)
      exp: now + 600, // Expires in 10 minutes (max allowed)
      iss: appId, // GitHub App ID
    };

    // Header
    const header = { alg: "RS256", typ: "JWT" };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    // Sign with private key
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(signingInput);
    const signature = sign.sign(privateKey, "base64url");

    return `${signingInput}.${signature}`;
  }

  /**
   * Get the private key from env or file.
   */
  private getPrivateKey(): string {
    const keyEnv = process.env.GITHUB_APP_PRIVATE_KEY;
    if (!keyEnv) throw new Error("GITHUB_APP_PRIVATE_KEY is not set");

    // If it looks like a file path, read the file
    if (keyEnv.startsWith("/") || keyEnv.startsWith("./")) {
      const keyPath = path.resolve(keyEnv);
      return fs.readFileSync(keyPath, "utf-8");
    }

    // Otherwise treat as the key content directly
    // GitHub stores keys with literal \n — convert to actual newlines
    return keyEnv.replace(/\\n/g, "\n");
  }

  /**
   * Exchange an installation_id for an installation access token.
   * These tokens expire in 1 hour and cannot be refreshed — you must generate a new JWT
   * and exchange again.
   */
  private async getInstallationToken(installationId: string): Promise<{
    access_token: string;
    expires_at: string;
    permissions: Record<string, string>;
    repository_selection: string;
  }> {
    const jwt = this.generateJWT();

    const res = await fetch(
      `${this.API_BASE}/app/installations/${installationId}/access_tokens`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`GitHub App token exchange failed: ${data.message || JSON.stringify(data)}`);
    }

    return {
      access_token: data.token,
      expires_at: data.expires_at,
      permissions: data.permissions,
      repository_selection: data.repository_selection,
    };
  }

  /**
   * Get a valid installation access token, refreshing if expired.
   * We store the installation token in ExternalToolConnection metadata.
   */
  private async getValidAccessToken(connection: {
    access_token: string;
    metadata?: any;
  }): Promise<string> {
    const meta = connection.metadata as any;
    const expiresAt = meta?.installation_token_expires_at;
    const installationId = meta?.installation_id;

    // If we have a non-expired installation token, use it
    if (expiresAt && new Date(expiresAt) > new Date(Date.now() + 5 * 60 * 1000)) {
      return connection.access_token;
    }

    // Otherwise refresh via installation token exchange
    if (!installationId) {
      throw new Error("No installation_id stored — re-install the GitHub App");
    }

    const tokenData = await this.getInstallationToken(String(installationId));

    // Update the connection with the new token
    // Note: We can't update directly here since we don't have the connection ID
    // The caller should handle this
    return tokenData.access_token;
  }

  // ---------- ConnectorBase Implementation ----------

  /**
   * Handle the GitHub App installation callback.
   * This is called when GitHub redirects back after the user installs the app.
   * It creates/updates the ExternalToolConnection record.
   */
  async handleInstallationCallback(
    userId: string,
    installationId: number,
    workspaceId?: string
  ): Promise<{ id: string }> {
    const tokenData = await this.getInstallationToken(String(installationId));

    // Fetch installation info to get account details
    const jwt = this.generateJWT();
    const installRes = await fetch(
      `${this.API_BASE}/app/installations/${installationId}`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    const installData = await installRes.json();

    const account = installData.account;
    const workspaceExternalId = String(account.id);
    const workspaceExternalName = account.login || account.name || "GitHub";
    const accountType = account.type || "User";

    // Upsert the connection
    const connection = await (prisma.externalToolConnection as any).upsert({
      where: {
        user_id_tool_type_workspace_external_id: {
          user_id: userId,
          tool_type: "github_app",
          workspace_external_id: workspaceExternalId,
        },
      },
      update: {
        access_token: tokenData.access_token,
        refresh_token: String(installationId),
        token_type: "Bearer",
        expires_at: new Date(Date.now() + 3600 * 1000),
        scope: "",
        tool_name: `GitHub App — ${workspaceExternalName}`,
        workspace_external_name: workspaceExternalName,
        metadata: {
          installation_id: installationId,
          installation_token_expires_at: tokenData.expires_at,
          account_type: accountType,
          permissions: tokenData.permissions,
          repository_selection: tokenData.repository_selection,
        },
        status: "active",
        sync_error: null,
        workspace_id: workspaceId || null,
      },
      create: {
        user_id: userId,
        workspace_id: workspaceId || null,
        tool_type: "github_app",
        tool_name: `GitHub App — ${workspaceExternalName}`,
        access_token: tokenData.access_token,
        refresh_token: String(installationId),
        token_type: "Bearer",
        expires_at: new Date(Date.now() + 3600 * 1000),
        scope: "",
        workspace_external_id: workspaceExternalId,
        workspace_external_name: workspaceExternalName,
        metadata: {
          installation_id: installationId,
          installation_token_expires_at: tokenData.expires_at,
          account_type: accountType,
          permissions: tokenData.permissions,
          repository_selection: tokenData.repository_selection,
        },
        status: "active",
      },
    });

    return { id: connection.id };
  }

  /**
   * Exchange authorization code for tokens.
   *
   * For GitHub App, the "code" is actually the installation_id from the redirect,
   * and we exchange it for an installation access token.
   */
  async exchangeCode(code: string, _redirectUri: string): Promise<TokenResult> {
    // For GitHub App, code = installation_id
    const installationId = code;

    if (!installationId || isNaN(Number(installationId))) {
      throw new Error("Invalid installation_id from GitHub App redirect");
    }

    const tokenData = await this.getInstallationToken(installationId);

    return {
      access_token: tokenData.access_token,
      token_type: "Bearer",
      scope: "", // GitHub Apps use permissions, not scopes
      expires_in: 3600, // 1 hour
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResult> {
    // refreshToken = installation_id
    const installationId = refreshToken;
    const tokenData = await this.getInstallationToken(installationId);

    return {
      access_token: tokenData.access_token,
      token_type: "Bearer",
      expires_in: 3600,
    };
  }

  /**
   * Fetch the installation's workspace info (org/user it's installed on).
   */
  async fetchWorkspaceInfo(accessToken: string) {
    // Use the installation token to get current user/installation info
    const res = await fetch(`${this.API_BASE}/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    const data = await res.json();
    if (data.message === "Bad credentials") throw new Error("Invalid GitHub App token");

    // For GitHub App installations, the "user" endpoint returns the installation account
    return {
      workspace_external_id: String(data.id),
      workspace_external_name: data.login || data.name || "GitHub App Installation",
      metadata: {
        login: data.login,
        type: data.type, // "User" or "Organization"
        avatar_url: data.avatar_url,
        html_url: data.html_url,
        installation_id: undefined, // Will be set during callback
      },
    };
  }

  /**
   * Fetch content from repos accessible by this installation.
   * GitHub App tokens have access to repos the installation is granted.
   */
  async fetchContent(
    accessToken: string,
    options: { since?: Date; pageSize?: number; cursor?: string }
  ): Promise<{ items: SyncedItem[]; nextCursor?: string; hasMore: boolean }> {
    const items: SyncedItem[] = [];
    const pageSize = options.pageSize || 30;
    const since = options.since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sinceStr = since.toISOString().split("T")[0];

    // 1) Fetch repos accessible to this installation
    const reposRes = await fetch(
      `${this.API_BASE}/installation/repositories?per_page=30`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    const reposData = await reposRes.json();
    const repos = reposData.repositories || [];

    for (const repo of repos.slice(0, 15)) {
      const fullName = repo.full_name;

      // 2) Fetch recent issues
      try {
        const issues = await this.githubFetchAll(
          `${this.API_BASE}/repos/${fullName}/issues?state=all&since=${sinceStr}&sort=updated&per_page=${pageSize}`,
          accessToken
        );
        for (const issue of issues) {
          if (issue.pull_request) continue;
          items.push({
            external_id: `${fullName}_issue_${issue.number}`,
            content_type: "issue",
            title: `#${issue.number}: ${issue.title}`,
            content_text: issue.body?.slice(0, 8000) || null,
            content_url: issue.html_url,
            author_name: issue.user?.login || null,
            author_avatar: issue.user?.avatar_url || null,
            channel_or_project: fullName,
            metadata: {
              repo: fullName,
              number: issue.number,
              state: issue.state,
              labels: issue.labels?.map((l: any) => l.name),
              comments: issue.comments,
              created_at: issue.created_at,
              updated_at: issue.updated_at,
            },
          });
        }
      } catch { /* skip */ }

      // 3) Fetch recent pull requests
      try {
        const prs = await this.githubFetchAll(
          `${this.API_BASE}/repos/${fullName}/pulls?state=all&sort=updated&per_page=${Math.min(pageSize, 10)}`,
          accessToken
        );
        for (const pr of prs) {
          items.push({
            external_id: `${fullName}_pr_${pr.number}`,
            content_type: "pr",
            title: `#${pr.number}: ${pr.title}`,
            content_text: [
              pr.body || "",
              `Author: ${pr.user?.login}`,
              `State: ${pr.state}`,
              `Base: ${pr.base?.ref} <- Head: ${pr.head?.ref}`,
            ].filter(Boolean).join("\n").slice(0, 8000),
            content_url: pr.html_url,
            author_name: pr.user?.login || null,
            author_avatar: pr.user?.avatar_url || null,
            channel_or_project: fullName,
            metadata: {
              repo: fullName,
              number: pr.number,
              state: pr.state,
              additions: pr.additions,
              deletions: pr.deletions,
              changed_files: pr.changed_files,
            },
          });
        }
      } catch { /* skip */ }

      // 4) Fetch README
      try {
        const readmeRes = await fetch(
          `${this.API_BASE}/repos/${fullName}/readme`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
          }
        );
        if (readmeRes.ok) {
          const readme = await readmeRes.json();
          if (readme.content) {
            const decoded = Buffer.from(readme.content, "base64").toString("utf-8");
            items.push({
              external_id: `${fullName}_readme`,
              content_type: "file",
              title: `${fullName} — README`,
              content_text: decoded.slice(0, 8000),
              content_url: readme.html_url,
              author_name: null,
              author_avatar: null,
              channel_or_project: fullName,
              metadata: { path: readme.path, size: readme.size },
            });
          }
        }
      } catch { /* skip */ }
    }

    return { items, hasMore: false };
  }

  getItemUrl(item: SyncedItem): string {
    return item.content_url || "";
  }

  /**
   * Build the GitHub App installation URL.
   * Unlike OAuth, this redirects the user to install the app on their account/org.
   */
  getInstallationUrl(state: string): string {
    const appSlug = process.env.GITHUB_APP_SLUG;
    if (!appSlug) {
      throw new Error("GITHUB_APP_SLUG must be set");
    }
    return `${this.GITHUB_BASE}/apps/${appSlug}/installations/new?state=${state}`;
  }

  // ---------- Helpers ----------

  private async githubFetchAll(url: string, accessToken: string, maxPages = 3): Promise<any[]> {
    const results: any[] = [];
    let currentUrl: string | undefined = url;
    let page = 0;

    while (currentUrl && page < maxPages) {
      const res: Response = await fetch(currentUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (!res.ok) break;

      const data = await res.json();
      if (Array.isArray(data)) {
        results.push(...data);
      }

      const linkHeader: string | null = res.headers.get("Link");
      currentUrl = this.parseNextLink(linkHeader) || undefined;
      page++;
    }

    return results;
  }

  private parseNextLink(linkHeader: string | null): string | null {
    if (!linkHeader) return null;
    const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    return match ? match[1] : null;
  }
}
