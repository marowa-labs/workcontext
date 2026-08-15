/**
 * GitHub Connector
 *
 * Implements OAuth2 for GitHub Apps / OAuth Apps.
 * Scopes: repo, read:user, read:org
 *
 * API: https://docs.github.com/en/rest
 * Rate Limits: 5,000 requests/hour (authenticated)
 * Pagination: Link header with page/per_page params
 *
 * We fetch: Issues, Pull Requests, Discussions (if available), README files,
 * and recent commit messages.
 */

import {
  ConnectorBase,
  ToolType,
  OAuthConfig,
  TokenResult,
  SyncedItem,
} from "./connectorBase";

export class GitHubConnector extends ConnectorBase {
  readonly toolType: ToolType = "github";
  readonly displayName = "GitHub";
  readonly iconUrl =
    "https://cdn.brandfetch.io/id-wVCa7Wd/w/512/h/512/theme/dark/icon.jpeg";
  readonly description = "Search across GitHub issues, PRs, repos, and code";

  readonly oauthConfig: OAuthConfig = {
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    authorizationUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["repo", "read:user", "read:org"],
  };

  private readonly API_BASE = "https://api.github.com";

  async exchangeCode(code: string, _redirectUri: string): Promise<TokenResult> {
    const res = await fetch(this.oauthConfig.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: this.oauthConfig.clientId,
        client_secret: this.oauthConfig.clientSecret,
        code,
      }),
    });
    const data = await res.json();
    if (data.error)
      throw new Error(
        `GitHub OAuth error: ${data.error_description || data.error}`,
      );

    return {
      access_token: data.access_token,
      token_type: data.token_type,
      scope: data.scope,
    };
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResult> {
    // GitHub OAuth tokens don't expire (unless user revokes or app has "expiring tokens" enabled)
    // For GitHub Apps, we'd use a different flow. For now, throw an error.
    throw new Error(
      "GitHub OAuth tokens don't expire. Re-authenticate if revoked.",
    );
  }

  async fetchWorkspaceInfo(accessToken: string) {
    // Fetch current user info
    const userRes = await fetch(`${this.API_BASE}/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    const user = await userRes.json();
    if (user.message === "Bad credentials")
      throw new Error("Invalid GitHub token");

    // Fetch user's organizations
    const orgsRes = await fetch(`${this.API_BASE}/user/orgs`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    const orgs = await orgsRes.json();

    return {
      workspace_external_id: user.login,
      workspace_external_name: user.name || user.login,
      metadata: {
        login: user.login,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
        organizations: (Array.isArray(orgs) ? orgs : []).map((o: any) => ({
          login: o.login,
          name: o.name,
          avatar_url: o.avatar_url,
        })),
      },
    };
  }

  async fetchContent(
    accessToken: string,
    options: { since?: Date; pageSize?: number; cursor?: string },
  ): Promise<{ items: SyncedItem[]; nextCursor?: string; hasMore: boolean }> {
    const items: SyncedItem[] = [];
    const pageSize = options.pageSize || 30;
    const since =
      options.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sinceStr = since.toISOString().split("T")[0];

    // 1) Fetch user's repos
    const repos = await this.githubFetchAll(
      `${this.API_BASE}/user/repos?sort=updated&per_page=20&direction=desc`,
      accessToken,
    );

    for (const repo of (Array.isArray(repos) ? repos : []).slice(0, 15)) {
      const fullName = repo.full_name;

      // Create repo as ROOT node
      items.push({
        external_id: `repo_${fullName}`,
        content_type: "repo",
        title: fullName,
        content_text: repo.description?.slice(0, 8000) || null,
        content_url: repo.html_url,
        author_name: repo.owner?.login || null,
        author_avatar: repo.owner?.avatar_url || null,
        channel_or_project: fullName,
        depth: 0,
        metadata: {
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          visibility: repo.visibility,
          updated_at: repo.updated_at,
          default_branch: repo.default_branch,
        },
      });

      // 2) Fetch recent issues (children of repo)
      try {
        const issues = await this.githubFetchAll(
          `${this.API_BASE}/repos/${fullName}/issues?state=all&since=${sinceStr}&sort=updated&per_page=${pageSize}`,
          accessToken,
        );
        let issueOrder = 0;
        for (const issue of Array.isArray(issues) ? issues : []) {
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
            parent_external_id: `repo_${fullName}`,
            depth: 1,
            block_content: issue.body
              ? this.markdownToBlockNoteBlocks(issue.body)
              : undefined,
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
          issueOrder++;
        }
      } catch {
        /* skip repos we can't access */
      }

      // 3) Fetch recent pull requests (children of repo)
      try {
        const prs = await this.githubFetchAll(
          `${this.API_BASE}/repos/${fullName}/pulls?state=all&sort=updated&per_page=${Math.min(pageSize, 10)}`,
          accessToken,
        );
        for (const pr of Array.isArray(prs) ? prs : []) {
          const prBody = [
            pr.body || "",
            `Author: ${pr.user?.login}`,
            `State: ${pr.state}`,
            `Base: ${pr.base?.ref} <- Head: ${pr.head?.ref}`,
          ]
            .filter(Boolean)
            .join("\n");
          items.push({
            external_id: `${fullName}_pr_${pr.number}`,
            content_type: "pr",
            title: `#${pr.number}: ${pr.title}`,
            content_text: prBody.slice(0, 8000),
            content_url: pr.html_url,
            author_name: pr.user?.login || null,
            author_avatar: pr.user?.avatar_url || null,
            channel_or_project: fullName,
            parent_external_id: `repo_${fullName}`,
            depth: 1,
            block_content: pr.body
              ? this.markdownToBlockNoteBlocks(pr.body)
              : undefined,
            metadata: {
              repo: fullName,
              number: pr.number,
              state: pr.state,
              mergeable: pr.mergeable,
              additions: pr.additions,
              deletions: pr.deletions,
              changed_files: pr.changed_files,
              created_at: pr.created_at,
              updated_at: pr.updated_at,
            },
          });
        }
      } catch {
        /* skip */
      }

      // 4) Fetch file tree (children of repo)
      try {
        const treeRes = await fetch(
          `${this.API_BASE}/repos/${fullName}/git/trees/${repo.default_branch || "main"}?recursive=1`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          },
        );
        if (treeRes.ok) {
          const tree = await treeRes.json();
          const files = (tree.tree || [])
            .filter((t: any) => t.type === "blob")
            .slice(0, 50);
          for (const file of files) {
            items.push({
              external_id: `${fullName}_file_${file.path}`,
              content_type: "file",
              title: file.path.split("/").pop() || file.path,
              content_text: `File: ${file.path}\nSize: ${file.size || 0} bytes\nSHA: ${file.sha?.slice(0, 7)}`,
              content_url: `https://github.com/${fullName}/blob/${repo.default_branch || "main"}/${file.path}`,
              author_name: null,
              author_avatar: null,
              channel_or_project: fullName,
              parent_external_id: `repo_${fullName}`,
              depth: 1,
              metadata: {
                repo: fullName,
                path: file.path,
                size: file.size,
                sha: file.sha,
              },
            });
          }
        }
      } catch {
        /* skip */
      }
    }

    return { items, hasMore: false };
  }

  /**
   * Fetch all pages of a paginated GitHub API endpoint.
   */
  private async githubFetchAll(
    url: string,
    accessToken: string,
    maxPages = 3,
  ): Promise<any[]> {
    const results: any[] = [];
    let currentUrl: string | undefined = url;
    let page = 0;

    while (currentUrl && page < maxPages) {
      const res: Response = await fetch(currentUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!res.ok) break;

      const data = await res.json();
      if (Array.isArray(data)) {
        results.push(...data);
      }

      // Parse Link header for next page
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

  /**
   * Convert markdown text to BlockNote-compatible blocks.
   * Parses common markdown patterns into structured blocks.
   */
  private markdownToBlockNoteBlocks(markdown: string): any[] {
    if (!markdown) return [];
    const blocks: any[] = [];
    const lines = markdown.split("\n");
    let i = 0;

    const genId = () =>
      Math.random().toString(36).substring(2, 12) + Date.now().toString(36);

    while (i < lines.length) {
      const line = lines[i];

      // Empty line → skip
      if (line.trim() === "") {
        i++;
        continue;
      }

      // Headings: # Heading, ## Heading, ### Heading
      const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (headingMatch) {
        const level = Math.min(headingMatch[1].length, 3) as 1 | 2 | 3;
        blocks.push({
          id: genId(),
          type: "heading",
          props: {
            level,
            textColor: "default",
            backgroundColor: "default",
            textAlignment: "left",
          },
          content: headingMatch[2].trim(),
          children: [],
        });
        i++;
        continue;
      }

      // Code blocks: ```
      if (line.trim().startsWith("```")) {
        const lang = line.trim().replace(/^```/, "").trim() || "plainText";
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        blocks.push({
          id: genId(),
          type: "codeBlock",
          props: { language: lang },
          content: codeLines.join("\n"),
          children: [],
        });
        i++;
        continue; // Skip closing ```
      }

      // Horizontal rule: ---, ***, ___
      if (/^[-*_]{3,}\s*$/.test(line.trim())) {
        blocks.push({
          id: genId(),
          type: "paragraph",
          props: {
            textColor: "default",
            backgroundColor: "default",
            textAlignment: "left",
          },
          content: "─────────────────────────────────────",
          children: [],
        });
        i++;
        continue;
      }

      // Blockquote: > text
      if (line.trim().startsWith("> ")) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("> ")) {
          quoteLines.push(lines[i].trim().replace(/^>\s*/, ""));
          i++;
        }
        blocks.push({
          id: genId(),
          type: "paragraph",
          props: {
            textColor: "default",
            backgroundColor: "gray",
            textAlignment: "left",
          },
          content: quoteLines.join("\n"),
          children: [],
        });
        continue;
      }

      // Unordered list: - item or * item or + item
      const bulletMatch = line.match(/^(\s*)[-*+]\s+(.+)/);
      if (bulletMatch) {
        const indent = bulletMatch[1].length;
        blocks.push({
          id: genId(),
          type: "bulletListItem",
          props: {
            textColor: "default",
            backgroundColor: "default",
            textAlignment: "left",
          },
          content: bulletMatch[2].trim(),
          children: [],
        });
        i++;
        continue;
      }

      // Ordered list: 1. item
      const orderedMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
      if (orderedMatch) {
        blocks.push({
          id: genId(),
          type: "numberedListItem",
          props: {
            textColor: "default",
            backgroundColor: "default",
            textAlignment: "left",
          },
          content: orderedMatch[2].trim(),
          children: [],
        });
        i++;
        continue;
      }

      // Task list: - [ ] item or - [x] item
      const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.+)/);
      if (taskMatch) {
        blocks.push({
          id: genId(),
          type: "checkListItem",
          props: {
            textColor: "default",
            backgroundColor: "default",
            textAlignment: "left",
            checked: taskMatch[2].toLowerCase() === "x",
          },
          content: taskMatch[3].trim(),
          children: [],
        });
        i++;
        continue;
      }

      // Image: ![alt](url)
      const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        blocks.push({
          id: genId(),
          type: "image",
          props: {
            url: imageMatch[2],
            caption: imageMatch[1],
            previewWidth: 512,
          },
          content: undefined,
          children: [],
        });
        i++;
        continue;
      }

      // Link-only line: [text](url)
      const linkMatch = line.match(/^\[([^\]]+)\]\(([^)]+)\)\s*$/);
      if (linkMatch) {
        blocks.push({
          id: genId(),
          type: "paragraph",
          props: {
            textColor: "blue",
            backgroundColor: "default",
            textAlignment: "left",
          },
          content: linkMatch[1],
          children: [],
        });
        i++;
        continue;
      }

      // Table: | col1 | col2 |
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const tableLines: string[] = [];
        while (
          i < lines.length &&
          lines[i].trim().startsWith("|") &&
          lines[i].trim().endsWith("|")
        ) {
          tableLines.push(lines[i].trim());
          i++;
        }
        // Convert table to markdown code block
        blocks.push({
          id: genId(),
          type: "codeBlock",
          props: { language: "markdown" },
          content: tableLines.join("\n"),
          children: [],
        });
        continue;
      }

      // Regular paragraph
      blocks.push({
        id: genId(),
        type: "paragraph",
        props: {
          textColor: "default",
          backgroundColor: "default",
          textAlignment: "left",
        },
        content: line.trim(),
        children: [],
      });
      i++;
    }

    return blocks;
  }

  getItemUrl(item: SyncedItem): string {
    return item.content_url || "";
  }

  /**
   * Create a GitHub issue (write action for AI).
   * Requires the `repo` scope on the token.
   */
  async createIssue(
    accessToken: string,
    params: {
      repo: string; // "owner/repo"
      title: string;
      body?: string;
      labels?: string[];
    },
  ): Promise<{ number: number; url: string; html_url: string }> {
    const repo = params.repo
      .replace(/^https?:\/\/github\.com\//, "")
      .replace(/\/$/, "");
    const body: Record<string, any> = { title: params.title };
    if (params.body) body.body = params.body;
    if (params.labels && params.labels.length > 0) body.labels = params.labels;

    const res = await fetch(`${this.API_BASE}/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        `GitHub create issue failed: ${data.message || res.statusText}`,
      );
    }
    return {
      number: data.number,
      url: data.html_url,
      html_url: data.html_url,
    };
  }
}
