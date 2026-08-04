"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import {
  Plug,
  RefreshCw,
  Unplug,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  GitBranch,
  ArrowRight,
  Globe,
} from "lucide-react";

// ---------- Types ----------

interface ToolInfo {
  tool_type: string;
  display_name: string;
  description: string;
  icon_url: string;
  connected: boolean;
}

interface ConnectionInfo {
  id: string;
  tool_type: string;
  display_name: string;
  tool_name: string;
  status: string;
  workspace_name: string;
  last_synced_at: string | null;
  content_count: number;
  connected_at: string;
}

interface IntegrationsResponse {
  success: boolean;
  connections: ConnectionInfo[];
  available: ToolInfo[];
}

interface SearchResult {
  id: string;
  source: string;
  source_label: string;
  content_type: string;
  title: string | null;
  content_text: string | null;
  content_url: string | null;
  author_name: string | null;
  channel_or_project: string | null;
  similarity: number;
  snippet?: string;
}

interface SearchResponse {
  success: boolean;
  query: string;
  total: number;
  results: SearchResult[];
  grouped_by_source: Record<string, SearchResult[]>;
  sources: Array<{ source: string; label: string; count: number }>;
}

// ---------- Tool Icons ----------

const TOOL_ICONS: Record<string, React.ReactNode> = {
  slack: (
    <img
      src="/assets/images/slack.png"
      alt="Slack"
      className="w-6 h-6 object-contain"
    />
  ),
  notion: (
    <img
      src="/assets/images/notion.png"
      alt="Notion"
      className="w-6 h-6 object-contain"
    />
  ),
  jira: (
    <img
      src="/assets/images/Atlassian-Jira.png"
      alt="Jira"
      className="w-6 h-6 object-contain"
    />
  ),
  github: (
    <img
      src="/assets/images/GitHub.png"
      alt="GitHub"
      className="w-6 h-6 object-contain"
    />
  ),
  github_app: (
    <img
      src="/assets/images/GitHub.png"
      alt="GitHub"
      className="w-6 h-6 object-contain"
    />
  ),
  figma: (
    <img
      src="/assets/images/figma.png"
      alt="Figma"
      className="w-6 h-6 object-contain"
    />
  ),
};

const TOOL_COLORS: Record<string, string> = {
  slack:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  notion:
    "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  jira: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  github:
    "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  github_app:
    "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  figma:
    "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800",
};

const SOURCE_LABELS: Record<string, string> = {
  internal: "Workspace",
  slack: "Slack",
  notion: "Notion",
  jira: "Jira",
  github: "GitHub (OAuth)",
  github_app: "GitHub (App)",
  figma: "Figma",
};

// ---------- Component ----------

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [available, setAvailable] = useState<ToolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingTool, setConnectingTool] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(
    null,
  );
  const [searching, setSearching] = useState(false);
  const [activeSourceFilter, setActiveSourceFilter] = useState<string | null>(
    null,
  );
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<
    Record<
      string,
      { status: string; items_synced: number; items_indexed: number }
    >
  >({});

  // Get auth token on mount
  useEffect(() => {
    const getToken = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setAuthToken(session?.access_token || null);
    };
    getToken();
  }, []);

  // Handle OAuth callback success/error
  useEffect(() => {
    const connected = searchParams.get("connected");
    const connId = searchParams.get("connection_id");
    const connError = searchParams.get("error");
    if (connected) {
      setSuccessMessage(
        `Successfully connected ${SOURCE_LABELS[connected] || connected}! Starting initial sync...`,
      );
      fetchIntegrations();
      // Auto-trigger sync for the new connection
      if (connId) {
        const triggerSync = async () => {
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;
            setSyncingId(connId);
            setSyncProgress((prev) => ({
              ...prev,
              [connId]: {
                status: "starting",
                items_synced: 0,
                items_indexed: 0,
              },
            }));
            await fetch(`/api/integrations/${connId}/sync`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });

            // Poll for completion
            let done = false;
            let attempts = 0;
            while (!done && attempts < 150) {
              await new Promise((r) => setTimeout(r, 2000));
              attempts++;
              try {
                const statusRes = await fetch(
                  `/api/integrations/${connId}/status`,
                  { headers: { Authorization: `Bearer ${token}` } },
                );
                const statusData = await statusRes.json();
                const log = statusData?.connection?.sync_logs?.[0];
                if (log) {
                  setSyncProgress((prev) => ({
                    ...prev,
                    [connId]: {
                      status: log.status,
                      items_synced: log.items_synced || 0,
                      items_indexed: log.items_indexed || 0,
                    },
                  }));
                  if (log.status === "completed" || log.status === "failed") {
                    done = true;
                  }
                }
              } catch {
                /* keep polling */
              }
            }
          } catch (err) {
            console.error("Auto-sync failed:", err);
          } finally {
            setSyncingId(null);
            setSyncProgress((prev) => {
              const next = { ...prev };
              delete next[connId];
              return next;
            });
            fetchIntegrations();
          }
        };
        triggerSync();
      }
      // Clean URL
      window.history.replaceState({}, "", "/settings/integrations");
    }
    if (connError) {
      setError(decodeURIComponent(connError));
      window.history.replaceState({}, "", "/settings/integrations");
    }
  }, [searchParams]);

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Not authenticated");
        return;
      }
      const res = await fetch("/api/integrations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: IntegrationsResponse = await res.json();
      if (data.success) {
        setConnections(data.connections);
        setAvailable(data.available);
      }
    } catch (err: any) {
      setError("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleConnect = async (toolType: string) => {
    try {
      setConnectingTool(toolType);
      setError(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Not authenticated");
        setConnectingTool(null);
        return;
      }
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tool_type: toolType }),
      });
      const data = await res.json();
      if (data.success && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        setError(data.message || "Failed to start connection");
        setConnectingTool(null);
      }
    } catch (err: any) {
      setError("Failed to initiate connection");
      setConnectingTool(null);
    }
  };

  const handleSync = async (connectionId: string) => {
    try {
      setSyncingId(connectionId);
      setError(null);
      setSyncProgress((prev) => ({
        ...prev,
        [connectionId]: {
          status: "starting",
          items_synced: 0,
          items_indexed: 0,
        },
      }));
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Not authenticated");
        setSyncingId(null);
        setSyncProgress((prev) => {
          const next = { ...prev };
          delete next[connectionId];
          return next;
        });
        return;
      }

      const res = await fetch(`/api/integrations/${connectionId}/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        // Poll for progress
        const pollSync = async () => {
          let done = false;
          let attempts = 0;
          while (!done && attempts < 150) {
            await new Promise((r) => setTimeout(r, 2000));
            attempts++;
            try {
              const statusRes = await fetch(
                `/api/integrations/${connectionId}/status`,
                { headers: { Authorization: `Bearer ${token}` } },
              );
              const statusData = await statusRes.json();
              const log = statusData?.connection?.sync_logs?.[0];
              if (log) {
                setSyncProgress((prev) => ({
                  ...prev,
                  [connectionId]: {
                    status: log.status,
                    items_synced: log.items_synced || 0,
                    items_indexed: log.items_indexed || 0,
                  },
                }));
                if (log.status === "completed") {
                  setSuccessMessage(
                    `Sync complete! ${log.items_synced} items synced, ${log.items_indexed} items embedded.`,
                  );
                  done = true;
                } else if (log.status === "failed") {
                  setError(log.error_message || "Sync failed");
                  done = true;
                }
              }
            } catch {
              // Network hiccup — keep polling
            }
          }
          setSyncingId(null);
          setSyncProgress((prev) => {
            const next = { ...prev };
            delete next[connectionId];
            return next;
          });
          fetchIntegrations();
        };
        pollSync();
      } else {
        setError(data.message || "Failed to start sync");
        setSyncingId(null);
        setSyncProgress((prev) => {
          const next = { ...prev };
          delete next[connectionId];
          return next;
        });
      }
    } catch {
      setError("Failed to start sync");
      setSyncingId(null);
      setSyncProgress((prev) => {
        const next = { ...prev };
        delete next[connectionId];
        return next;
      });
    }
  };

  // Tree browsing
  const [browsingConnectionId, setBrowsingConnectionId] = useState<
    string | null
  >(null);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeSearch, setTreeSearch] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [importingTreeId, setImportingTreeId] = useState<string | null>(null);

  const fetchTree = useCallback(
    async (connectionId: string) => {
      try {
        setTreeLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const params = new URLSearchParams();
        if (treeSearch) params.set("search", treeSearch);
        const res = await fetch(
          `/api/integrations/${connectionId}/tree?${params}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (data.success) {
          setTreeData(data.tree);
          // Auto-expand root nodes
          setExpandedNodes(new Set(data.tree.map((n: any) => n.id)));
        }
      } catch {
        setError("Failed to load tree");
      } finally {
        setTreeLoading(false);
      }
    },
    [treeSearch],
  );

  const handleBrowse = (connectionId: string) => {
    if (browsingConnectionId === connectionId) {
      setBrowsingConnectionId(null);
      setTreeData([]);
    } else {
      setBrowsingConnectionId(connectionId);
      fetchTree(connectionId);
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const handleImportTree = async (rootContentId: string) => {
    try {
      setImportingTreeId(rootContentId);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/integrations/import-tree`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ root_content_id: rootContentId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(
          `Imported "${data.title}" as a project (${data.source_tool}).`,
        );
      } else {
        setError(data.message || "Import failed");
      }
    } catch {
      setError("Import failed");
    } finally {
      setImportingTreeId(null);
    }
  };

  const handleImportSingleItem = async (contentId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/integrations/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content_item_id: contentId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Imported "${data.title}" as a project.`);
      } else {
        setError(data.message || "Import failed");
      }
    } catch {
      setError("Import failed");
    }
  };

  const handleReconnect = (conn: ConnectionInfo) => {
    // Trigger the same OAuth flow as initial connect — reuses the reconnect endpoint
    handleConnect(conn.tool_type);
  };

  const handleDisconnect = async (connectionId: string, toolName: string) => {
    if (
      !confirm(
        `Disconnect ${toolName}? Existing synced content will be preserved.`,
      )
    )
      return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Not authenticated");
        return;
      }
      const res = await fetch(`/api/integrations/${connectionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`${toolName} disconnected.`);
        fetchIntegrations();
      } else {
        setError(data.message || "Failed to disconnect");
      }
    } catch {
      setError("Failed to disconnect");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      setError(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Not authenticated");
        setSearching(false);
        return;
      }
      const res = await fetch(`/api/integrations/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          include_internal: true,
          limit: 30,
        }),
      });
      const data: SearchResponse = await res.json();
      if (data.success) {
        setSearchResults(data);
      } else {
        setError((data as any).message || "Search failed");
      }
    } catch {
      setError("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const filteredResults = searchResults?.results.filter(
    (r) => !activeSourceFilter || r.source === activeSourceFilter,
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Plug className="w-7 h-7" />
          Integrations
        </h1>
        <p className="mt-2 text-muted-foreground">
          Connect your team&apos;s tools to unlock cross-platform semantic
          search. Search once, find answers from everywhere.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400">
            {successMessage}
          </p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cross-Source Search */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Universal Search
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search across all connected tools and your workspace..."
            className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
        </div>

        {/* Source filters */}
        {searchResults && searchResults.sources.length > 1 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={() => setActiveSourceFilter(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                !activeSourceFilter
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              All ({searchResults.total})
            </button>
            {searchResults.sources.map((src) => (
              <button
                key={src.source}
                onClick={() =>
                  setActiveSourceFilter(
                    activeSourceFilter === src.source ? null : src.source,
                  )
                }
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeSourceFilter === src.source
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {src.label} ({src.count})
              </button>
            ))}
          </div>
        )}

        {/* Search results */}
        {filteredResults && filteredResults.length > 0 && (
          <div className="mt-6 space-y-3">
            {filteredResults.map((result) => (
              <a
                key={result.id}
                href={result.content_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-background border border-border rounded-lg hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          TOOL_COLORS[result.source] ||
                          "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {SOURCE_LABELS[result.source] || result.source}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {result.content_type}
                      </span>
                      {result.channel_or_project && (
                        <span className="text-xs text-muted-foreground">
                          / {result.channel_or_project}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {Math.round(result.similarity * 100)}% match
                      </span>
                    </div>
                    <h3 className="font-medium text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {result.title || "Untitled"}
                    </h3>
                    {result.snippet && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {result.snippet}
                      </p>
                    )}
                    {result.author_name && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        by {result.author_name}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 flex-shrink-0 mt-1" />
                </div>
              </a>
            ))}
          </div>
        )}

        {searchResults && filteredResults && filteredResults.length === 0 && (
          <p className="mt-6 text-center text-muted-foreground">
            No results found for &quot;{searchResults.query}&quot;
          </p>
        )}
      </div>

      {/* Connected Tools */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Connected Tools
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : connections.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Plug className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No tools connected yet. Connect your first tool below to start
              searching across your team&apos;s context.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <div key={conn.id}>
                <div
                  className={`bg-card border rounded-xl p-5 flex items-center gap-4 ${
                    conn.status === "active"
                      ? "border-green-200 dark:border-green-800"
                      : conn.status === "error"
                        ? "border-red-200 dark:border-red-800"
                        : "border-border"
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl ${TOOL_COLORS[conn.tool_type] || "bg-gray-100 text-gray-700"}`}
                  >
                    {TOOL_ICONS[conn.tool_type] || <Plug className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {conn.display_name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          conn.status === "active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : conn.status === "error"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {conn.status === "active" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                          </>
                        ) : conn.status === "error" ? (
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" /> Error
                          </>
                        ) : conn.status === "disconnected" ? (
                          <>
                            <Unplug className="w-3 h-3 mr-1" /> Disconnected
                          </>
                        ) : (
                          conn.status
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {conn.workspace_name && `${conn.workspace_name} · `}
                      {conn.content_count.toLocaleString()} items indexed
                      {conn.last_synced_at &&
                        ` · Last synced ${formatDate(conn.last_synced_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {syncingId === conn.id && syncProgress[conn.id] && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {syncProgress[conn.id].status === "pending" &&
                          "Queued…"}
                        {syncProgress[conn.id].status === "started" &&
                          `${syncProgress[conn.id].items_synced} synced…`}
                        {syncProgress[conn.id].status === "completed" &&
                          "Done!"}
                        {syncProgress[conn.id].status === "failed" && "Failed"}
                      </span>
                    )}
                    {conn.status === "disconnected" ? (
                      <button
                        onClick={() => handleReconnect(conn)}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Plug className="w-4 h-4" />
                        Reconnect
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleBrowse(conn.id)}
                          className={`p-2 rounded-lg transition-colors text-sm ${
                            browsingConnectionId === conn.id
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title="Browse content"
                        >
                          <Globe className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSync(conn.id)}
                          disabled={syncingId === conn.id}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                          title="Sync now"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${syncingId === conn.id ? "animate-spin" : ""}`}
                          />
                        </button>
                        <button
                          onClick={() =>
                            handleDisconnect(conn.id, conn.tool_name)
                          }
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Disconnect"
                        >
                          <Unplug className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tree Browse Panel */}
      {browsingConnectionId && (
        <div className="bg-card border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              Browse Content
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={treeSearch}
                onChange={(e) => setTreeSearch(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && fetchTree(browsingConnectionId)
                }
                placeholder="Search in this connection..."
                className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => fetchTree(browsingConnectionId)}
                disabled={treeLoading}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${treeLoading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={() => {
                  setBrowsingConnectionId(null);
                  setTreeData([]);
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {treeLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : treeData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No content found. Try syncing this connection first.
            </p>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {/* Import Entire Collection button */}
              {treeData.length === 1 && treeData[0].children?.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        Import entire collection ({treeData[0].children.length}{" "}
                        items)
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        Creates a single project with all content organized by
                        type
                      </p>
                    </div>
                    <button
                      onClick={() => handleImportTree(treeData[0].id)}
                      disabled={importingTreeId === treeData[0].id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {importingTreeId === treeData[0].id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      Import All
                    </button>
                  </div>
                </div>
              )}

              {/* Tree nodes */}
              {treeData.map((node: any) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                  onImport={handleImportSingleItem}
                  onImportTree={handleImportTree}
                  depth={0}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Available Tools */}
      {available.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Available Integrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((tool) => (
              <button
                key={tool.tool_type}
                onClick={() => handleConnect(tool.tool_type)}
                disabled={connectingTool === tool.tool_type}
                className="bg-card border border-border rounded-xl p-5 text-left hover:border-blue-300 dark:hover:border-blue-700 transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`p-2 rounded-lg ${TOOL_COLORS[tool.tool_type] || "bg-gray-100 text-gray-700"}`}
                  >
                    {TOOL_ICONS[tool.tool_type] || <Plug className="w-5 h-5" />}
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {tool.display_name}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {tool.description}
                </p>
                <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
                  {connectingTool === tool.tool_type ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  )}
                  {connectingTool === tool.tool_type
                    ? "Connecting..."
                    : "Connect"}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
        <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
          How it works
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>1. Connect your tools via OAuth — we request only read access</li>
          <li>
            2. We sync and index your content using AI embeddings for semantic
            understanding
          </li>
          <li>
            3. Search once across all tools — results are ranked by relevance
            with direct links to sources
          </li>
          <li>
            4. Import content into projects — Figma files render as live embeds,
            Notion pages as blocks
          </li>
          <li>
            5. To edit, click &quot;Edit in [Tool]&quot; — changes sync back
            when you re-sync
          </li>
          <li>
            6. Your data stays secure — tokens are encrypted, and we respect
            each tool&apos;s permissions
          </li>
        </ul>
      </div>
    </div>
  );
}

// ---------- Tree Node Component ----------

const CONTENT_TYPE_ICONS: Record<string, string> = {
  team: "🏢",
  repo: "📁",
  project: "📂",
  page: "📄",
  database: "🗄️",
  block: "🧩",
  issue: "🔴",
  pr: "🔵",
  readme: "📖",
  code_file: "💻",
  message: "💬",
  channel: "📢",
  thread: "🧵",
  figma_file: "🎨",
  figma_account_info: "👤",
  epic: "🎯",
  sprint: "🏃",
};

interface TreeNodeProps {
  node: any;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  onImport: (id: string) => void;
  onImportTree: (id: string) => void;
  depth: number;
}

function TreeNode({
  node,
  expandedNodes,
  toggleNode,
  onImport,
  onImportTree,
  depth,
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const icon = CONTENT_TYPE_ICONS[node.content_type] || "📄";

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted transition-colors group ${
          depth > 0 ? "ml-4" : ""
        }`}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={() => hasChildren && toggleNode(node.id)}
          className={`w-5 h-5 flex items-center justify-center text-xs ${
            hasChildren
              ? "text-muted-foreground hover:text-foreground cursor-pointer"
              : "text-transparent cursor-default"
          }`}
        >
          {hasChildren ? (isExpanded ? "▼" : "▶") : "•"}
        </button>

        {/* Icon */}
        <span className="text-sm flex-shrink-0">{icon}</span>

        {/* Title & metadata */}
        <div className="flex-1 min-w-0">
          {node.content_url ? (
            <a
              href={node.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 truncate block"
            >
              {node.title || "Untitled"}
            </a>
          ) : (
            <span className="text-sm font-medium text-foreground truncate block">
              {node.title || "Untitled"}
            </span>
          )}
          {node.author_name && (
            <span className="text-xs text-muted-foreground">
              by {node.author_name}
            </span>
          )}
        </div>

        {/* Children count badge */}
        {hasChildren && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {node.children.length}
          </span>
        )}

        {/* Import buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!hasChildren && (
            <button
              onClick={() => onImport(node.id)}
              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              title="Import as project"
            >
              Import
            </button>
          )}
          {hasChildren && (
            <button
              onClick={() => onImportTree(node.id)}
              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              title="Import entire folder as one project"
            >
              Import All
            </button>
          )}
          {node.content_url && (
            <a
              href={node.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-muted-foreground hover:text-foreground rounded"
              title="Open in source tool"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child: any) => (
            <TreeNode
              key={child.id}
              node={child}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              onImport={onImport}
              onImportTree={onImportTree}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
