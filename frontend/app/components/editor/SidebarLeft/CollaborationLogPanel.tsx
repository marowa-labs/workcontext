"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Users, User, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import CollaborationService, {
  CollaborationLogEntry,
} from "../../../lib/utils/collaborationService";

interface CollaborationLogPanelProps {
  projectId: string;
  onClose?: () => void;
}

export function CollaborationLogPanel({
  projectId,
  onClose,
}: CollaborationLogPanelProps) {
  const [logs, setLogs] = useState<CollaborationLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await CollaborationService.getLog(projectId, { limit: 100 });
      setLogs(res.logs || []);
    } catch (err: any) {
      setError(err.message || "Failed to load collaboration log");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString();
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "view":
      case "open":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "edit":
      case "typing":
      case "insert":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "cursor_move":
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "view":
        return "opened the document";
      case "edit":
        return "edited content";
      case "typing":
        return "is typing";
      case "cursor_move":
        return "moved cursor";
      case "insert":
        return "inserted content";
      default:
        return type;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-600" />
          <span className="font-semibold text-sm">Collaboration Log</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={fetchLog}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <span className="text-lg leading-none">&times;</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && logs.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 m-3 rounded-md">
            {error}
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Users className="h-8 w-8 mb-2" />
            <p className="text-sm">No activity yet</p>
          </div>
        )}

        {logs.length > 0 && (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getEventIcon(log.eventType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {log.user?.full_name || log.user?.email || "Unknown"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {getEventLabel(log.eventType)}
                  </p>
                  {log.targetSection && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      Section: {log.targetSection}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
