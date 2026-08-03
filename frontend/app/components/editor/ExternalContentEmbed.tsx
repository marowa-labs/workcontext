"use client";

import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  RefreshCw,
  Maximize2,
  Minimize2,
  Loader2,
  AlertCircle,
  Palette,
  Code,
  FileText,
  MessageSquare,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

interface EmbedData {
  tool_type: string;
  content_type: string;
  title: string;
  source_url: string;
  edit_url: string;
  embed_type: "iframe" | "code" | "link";
  embed_url?: string;
  thumbnail_url?: string;
  pages?: string[];
  page_count?: number;
  component_count?: number;
  version?: string;
  last_modified?: string;
  raw_url?: string;
  view_url?: string;
  repo_name?: string;
  file_path?: string;
  branch?: string;
  content_text?: string;
  channel?: string;
  author?: string;
  project?: string;
  snippet?: string;
  last_synced_at?: string;
}

interface ExternalContentEmbedProps {
  contentId: string;
  className?: string;
}

const toolIcons: Record<string, React.ReactNode> = {
  figma: <Palette className="w-4 h-4" />,
  github: <Code className="w-4 h-4" />,
  notion: <FileText className="w-4 h-4" />,
  slack: <MessageSquare className="w-4 h-4" />,
  jira: <CheckCircle2 className="w-4 h-4" />,
};

const toolColors: Record<string, string> = {
  figma: "bg-pink-100 text-pink-700 border-pink-200",
  github: "bg-gray-100 text-gray-700 border-gray-200",
  notion: "bg-stone-100 text-stone-700 border-stone-200",
  slack: "bg-purple-100 text-purple-700 border-purple-200",
  jira: "bg-blue-100 text-blue-700 border-blue-200",
};

const toolBg: Record<string, string> = {
  figma: "bg-pink-50",
  github: "bg-gray-50",
  notion: "bg-stone-50",
  slack: "bg-purple-50",
  jira: "bg-blue-50",
};

export default function ExternalContentEmbed({
  contentId,
  className = "",
}: ExternalContentEmbedProps) {
  const [embedData, setEmbedData] = useState<EmbedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchEmbed = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/integrations/embed/${contentId}`);
      if (!res.ok) throw new Error("Failed to load embed");
      const data = await res.json();
      if (data.success) {
        setEmbedData(data.embed);
      } else {
        throw new Error(data.message || "Failed to load embed");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmbed();
  }, [contentId]);

  const handleSyncBack = async () => {
    try {
      setSyncing(true);
      // Find connection ID from the content item
      const connRes = await fetch("/api/integrations");
      const connData = await connRes.json();
      if (connData.success) {
        const conn = connData.connections?.find(
          (c: any) => c.tool_type === embedData?.tool_type
        );
        if (conn) {
          await fetch(`/api/integrations/${conn.id}/sync-back`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content_id: contentId }),
          });
          // Re-fetch embed data after sync
          setTimeout(fetchEmbed, 2000);
        }
      }
    } catch (err) {
      console.error("Sync-back failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyLink = async () => {
    if (embedData?.source_url) {
      await navigator.clipboard.writeText(embedData.source_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Loading embed...</span>
      </div>
    );
  }

  if (error || !embedData) {
    return (
      <div className={`flex items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200 ${className}`}>
        <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
        <span className="text-sm text-red-600">{error || "Failed to load embed"}</span>
      </div>
    );
  }

  const toolColor = toolColors[embedData.tool_type] || "bg-gray-100 text-gray-700 border-gray-200";
  const toolBgClass = toolBg[embedData.tool_type] || "bg-gray-50";
  const icon = toolIcons[embedData.tool_type] || <ExternalLink className="w-4 h-4" />;

  return (
    <div className={`rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className={`flex items-center justify-between px-3 py-2 ${toolBgClass} border-b border-gray-200`}>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${toolColor}`}>
            {icon}
            {embedData.tool_type.charAt(0).toUpperCase() + embedData.tool_type.slice(1)}
          </span>
          <span className="text-sm font-medium text-gray-800 truncate max-w-[300px]">
            {embedData.title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Sync button */}
          <button
            onClick={handleSyncBack}
            disabled={syncing}
            className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-white/60 disabled:opacity-50 transition-colors"
            title="Sync latest from source"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          </button>

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-colors"
            title="Copy source link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Expand/collapse for iframes */}
          {embedData.embed_type === "iframe" && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-colors"
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Edit in source */}
          <a
            href={embedData.edit_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors ml-1"
          >
            Edit in {embedData.tool_type.charAt(0).toUpperCase() + embedData.tool_type.slice(1)}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Content */}
      {embedData.embed_type === "iframe" && embedData.embed_url ? (
        <div className={`relative ${expanded ? "h-[600px]" : "h-[400px]"} transition-all`}>
          <iframe
            src={embedData.embed_url}
            className="w-full h-full border-0"
            allowFullScreen
            title={embedData.title}
          />
        </div>
      ) : embedData.embed_type === "code" && embedData.content_text ? (
        <div className="max-h-[400px] overflow-auto">
          <pre className="p-4 text-sm font-mono text-gray-800 bg-white whitespace-pre-wrap">
            {embedData.content_text}
          </pre>
        </div>
      ) : (
        <div className="p-4 bg-white">
          {embedData.thumbnail_url && (
            <img
              src={embedData.thumbnail_url}
              alt={embedData.title}
              className="w-full max-h-[300px] object-contain rounded mb-3"
            />
          )}
          {embedData.snippet && (
            <p className="text-sm text-gray-600 leading-relaxed">{embedData.snippet}</p>
          )}
          {!embedData.snippet && !embedData.thumbnail_url && (
            <p className="text-sm text-gray-400 italic">No preview available. Click &quot;View in {embedData.tool_type}&quot; to see the content.</p>
          )}
        </div>
      )}

      {/* Footer with metadata */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {embedData.channel && <span>#{embedData.channel}</span>}
          {embedData.author && <span>by {embedData.author}</span>}
          {embedData.repo_name && <span>{embedData.repo_name}</span>}
          {embedData.file_path && <span className="font-mono">{embedData.file_path}</span>}
          {embedData.page_count != null && <span>{embedData.page_count} pages</span>}
          {embedData.component_count != null && <span>{embedData.component_count} components</span>}
        </div>
        <div className="flex items-center gap-3">
          {embedData.version && <span>v{embedData.version}</span>}
          {embedData.last_synced_at && (
            <span>Synced {new Date(embedData.last_synced_at).toLocaleDateString()}</span>
          )}
          <a
            href={embedData.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View original
          </a>
        </div>
      </div>
    </div>
  );
}
