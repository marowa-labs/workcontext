"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Link2,
  FileText,
  CheckSquare,
  Loader2,
  Inbox,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { getRelatedItems, type RelatedItem } from "../../lib/utils/relatedService";

interface RelatedItemsProps {
  projectId: string;
  workspaceId?: string | null;
  limit?: number;
}

/**
 * Related Items panel — shows semantically related workspace items
 * (projects, tasks) for the current document, powered by the unified
 * pgvector context layer on the backend.
 */
export function RelatedItems({
  projectId,
  workspaceId,
  limit = 8,
}: RelatedItemsProps) {
  const router = useRouter();
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getRelatedItems(projectId, workspaceId, limit)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load related items");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, workspaceId, limit]);

  const handleOpen = (item: RelatedItem) => {
    if (item.type === "task" && workspaceId) {
      router.push(`/dashboard/workspace/${workspaceId}/kanban`);
    } else if (item.type === "project") {
      router.push(`/dashboard/editor/${item.id}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3">
        <p className="text-xs text-gray-500">
          Semantically related items from across this workspace, ranked by
          similarity.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-sm text-red-500 px-1 py-4">{error}</div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm text-center px-2">
            <Inbox className="h-6 w-6 mb-2" />
            No related items found yet.
          </div>
        )}

        {!loading &&
          !error &&
          items.map((item) => {
            const Icon =
              item.type === "task" ? CheckSquare : FileText;
            const pct = Math.round((item.relevanceScore || 0) * 100);
            return (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => handleOpen(item)}
                className="w-full text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors p-3 group"
              >
                <div className="flex items-start gap-2">
                  <Icon className="h-4 w-4 mt-0.5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-xs text-gray-400 truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 tabular-nums">
                    {pct}%
                  </span>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}

export default RelatedItems;
