/**
 * Slack Connector
 *
 * Implements OAuth2 with user tokens for reading messages, channels, and files.
 * Scopes: channels:history, channels:read, files:read, users:read, search:read
 *
 * API: https://api.slack.com/web
 * Rate Limits: Tier 3 — 50 requests/min for conversations.history, search.*
 * Pagination: Cursor-based (cursor param in conversations.list, conversations.history)
 */

import { ConnectorBase, ToolType, OAuthConfig, TokenResult, SyncedItem } from "./connectorBase";

export class SlackConnector extends ConnectorBase {
  readonly toolType: ToolType = "slack";
  readonly displayName = "Slack";
  readonly iconUrl = "https://cdn.brandfetch.io/id-wVCa7Wd/w/512/h/512/theme/dark/icon.jpeg";
  readonly description = "Search across Slack messages, channels, and files";

  readonly oauthConfig: OAuthConfig = {
    clientId: process.env.SLACK_CLIENT_ID || "",
    clientSecret: process.env.SLACK_CLIENT_SECRET || "",
    authorizationUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: [
      "channels:history",
      "channels:read",
      "files:read",
      "users:read",
      "search:read",
      "groups:history",
      "im:history",
      "mpim:history",
    ],
    extraAuthParams: {
      user_scope: "channels:history,channels:read,files:read,users:read,search:read,groups:history,im:history,mpim:history",
    },
  };

  private readonly API_BASE = "https://slack.com/api";

  async exchangeCode(code: string, redirectUri: string): Promise<TokenResult> {
    const res = await fetch(this.oauthConfig.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.oauthConfig.clientId,
        client_secret: this.oauthConfig.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(`Slack OAuth error: ${data.error}`);
    // Slack v2 returns access_token at top level for user tokens
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResult> {
    const res = await fetch(this.oauthConfig.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.oauthConfig.clientId,
        client_secret: this.oauthConfig.clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(`Slack token refresh failed: ${data.error}`);
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    };
  }

  async fetchWorkspaceInfo(accessToken: string) {
    const res = await fetch(`${this.API_BASE}/auth.test`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!data.ok) throw new Error(`Slack auth.test failed: ${data.error}`);

    // Also fetch team info
    const teamRes = await fetch(
      `${this.API_BASE}/team.info`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const teamData = await teamRes.json();

    return {
      workspace_external_id: data.team_id || data.team,
      workspace_external_name: teamData.ok ? teamData.team?.name : data.team,
      metadata: {
        team_name: teamData.ok ? teamData.team?.name : undefined,
        user_id: data.user_id,
        user: data.user,
        url: teamData.ok ? teamData.team?.url : undefined,
      },
    };
  }

  async fetchContent(
    accessToken: string,
    options: { since?: Date; pageSize?: number; cursor?: string }
  ): Promise<{ items: SyncedItem[]; nextCursor?: string; hasMore: boolean }> {
    const items: SyncedItem[] = [];
    const pageSize = options.pageSize || 100;

    // 1) Fetch channels list
    const channelParams: Record<string, string> = {
      types: "public_channel,private_channel",
      exclude_archived: "true",
      limit: "100",
    };
    if (options.cursor) channelParams.cursor = options.cursor;

    const channelsRes = await this.slackGet(
      `${this.API_BASE}/conversations.list`,
      accessToken,
      channelParams
    );
    const channels = channelsRes.channels || [];

    // 2) Fetch recent messages from each channel (last 7 days max for search:read)
    const since = options.since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oldest = Math.floor(since.getTime() / 1000).toString();

    for (const channel of channels.slice(0, 20)) { // Limit to 20 channels per sync
      try {
        const historyRes = await this.slackGet(
          `${this.API_BASE}/conversations.history`,
          accessToken,
          {
            channel: channel.id,
            oldest,
            limit: "50",
          }
        );

        for (const msg of historyRes.messages || []) {
          if (msg.subtype === "bot_message" || !msg.text) continue;
          const userId = msg.user;
          // Fetch user info for display name
          let authorName = "Unknown";
          try {
            if (userId) {
              const userRes = await this.slackGet(
                `${this.API_BASE}/users.info`,
                accessToken,
                { user: userId }
              );
              authorName = userRes.user?.real_name || userRes.user?.name || "Unknown";
            }
          } catch { /* skip */ }

          items.push({
            external_id: `${channel.id}_${msg.ts}`,
            content_type: "message",
            title: `#${channel.name} — ${authorName}`,
            content_text: msg.text,
            content_url: `https://slack.com/archives/${channel.id}/p${msg.ts}`,
            author_name: authorName,
            author_avatar: null,
            channel_or_project: `#${channel.name}`,
            metadata: {
              channel_id: channel.id,
              thread_ts: msg.thread_ts,
              ts: msg.ts,
              reactions: msg.reactions?.map((r: any) => r.name),
            },
          });
        }
      } catch {
        // Skip channels we don't have access to
        continue;
      }

      // Respect rate limits — Tier 3 = 50/min
      await this.sleep(1200);
    }

    // 3) Also search using Slack search API if available
    try {
      const searchRes = await this.slackGet(
        `${this.API_BASE}/search.messages`,
        accessToken,
        {
          query: "after:" + Math.floor(since.getTime() / 1000),
          count: "20",
          sort: "timestamp",
          sort_dir: "desc",
        }
      );

      for (const match of searchRes.messages?.matches || []) {
        items.push({
          external_id: `search_${match.channel?.id}_${match.ts}`,
          content_type: "message",
          title: `#${match.channel?.name} — ${match.username || "Unknown"}`,
          content_text: match.text,
          content_url: match.permalink,
          author_name: match.username || "Unknown",
          author_avatar: match.icons?.image_48 || null,
          channel_or_project: `#${match.channel?.name}`,
          metadata: { source: "search", score: match.score },
        });
      }
    } catch {
      // Search might not be available on all plans
    }

    return {
      items,
      nextCursor: channelsRes.response_metadata?.next_cursor || undefined,
      hasMore: !!channelsRes.response_metadata?.next_cursor,
    };
  }

  getItemUrl(item: SyncedItem): string {
    return item.content_url || "";
  }

  private async slackGet(url: string, token: string, params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    const fullUrl = qs ? `${url}?${qs}` : url;
    const res = await fetch(fullUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
