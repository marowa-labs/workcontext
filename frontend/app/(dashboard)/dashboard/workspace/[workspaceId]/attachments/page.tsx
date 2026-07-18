"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Search,
  FileText,
  FileImage,
  File,
  FileArchive,
  FileSpreadsheet,
  Download,
  Loader2,
  X,
  Paperclip,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "../../../../../lib/supabase/client";
import { cn } from "../../../../../lib/utils";

interface Attachment {
  id: string;
  task_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  task?: { id: string; title: string; status: string };
}

interface AttachmentResponse {
  attachments: Attachment[];
  total: number;
  page: number;
  limit: number;
  fileTypes: string[];
}

const FILE_TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  "image/png": FileImage,
  "image/jpeg": FileImage,
  "image/webp": FileImage,
  "image/gif": FileImage,
  "image/svg+xml": FileImage,
  "application/pdf": FileText,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    File,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    FileSpreadsheet,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    FileSpreadsheet,
  "application/zip": FileArchive,
  "application/x-rar-compressed": FileArchive,
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileTypeLabel(fileType: string): string {
  if (fileType.startsWith("image/")) return "Image";
  if (fileType.includes("pdf")) return "PDF";
  if (fileType.includes("document") || fileType.includes("word")) return "Doc";
  if (fileType.includes("spreadsheet") || fileType.includes("excel"))
    return "Sheet";
  if (fileType.includes("presentation") || fileType.includes("powerpoint"))
    return "Slides";
  if (
    fileType.includes("zip") ||
    fileType.includes("rar") ||
    fileType.includes("archive")
  )
    return "Archive";
  return "File";
}

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-500/10 text-slate-500",
  "in-progress": "bg-blue-500/10 text-blue-500",
  "in-review": "bg-violet-500/10 text-violet-500",
  done: "bg-emerald-500/10 text-emerald-500",
};

export default function WorkspaceAttachmentsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [total, setTotal] = useState(0);
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchAttachments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const sp = new URLSearchParams();
      if (searchQuery) sp.set("search", searchQuery);
      if (activeTypeFilter) sp.set("type", activeTypeFilter);
      sp.set("page", String(page));
      sp.set("limit", String(limit));

      const res = await fetch(
        `/api/workspaces/${workspaceId}/attachments?${sp.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Failed to fetch attachments");
      const data: AttachmentResponse = await res.json();
      setAttachments(data.attachments);
      setTotal(data.total);
      setFileTypes(data.fileTypes || []);
    } catch (err: any) {
      setError(err.message || "Failed to load attachments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [workspaceId, page, activeTypeFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchAttachments();
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-8 py-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Paperclip className="w-6 h-6 text-blue-500" />
          Attachments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} file{total !== 1 ? "s" : ""} uploaded across workspace tasks
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search attachments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-background text-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          {fileTypes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTypeFilter(null)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full transition-colors",
                  !activeTypeFilter
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                All
              </button>
              {fileTypes.map((ft) => (
                <button
                  key={ft}
                  onClick={() =>
                    setActiveTypeFilter(ft === activeTypeFilter ? null : ft)
                  }
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full transition-colors",
                    ft === activeTypeFilter
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {getFileTypeLabel(ft)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : attachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Paperclip className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No attachments found
            </p>
            <p className="text-sm mt-1">
              Files uploaded to tasks will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {attachments.map((att) => {
              const Icon = FILE_TYPE_ICONS[att.file_type] || File;
              const fileTypeLabel = getFileTypeLabel(att.file_type);
              return (
                <div
                  key={att.id}
                  onClick={() =>
                    router.push(
                      `/dashboard/workspace/${workspaceId}/attachments/${att.id}`,
                    )
                  }
                  className="group bg-background border border-border rounded-xl p-4 hover:shadow-md hover:border-blue-500/30 transition-all cursor-pointer"
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center mb-3",
                      att.file_type.startsWith("image/")
                        ? "bg-green-500/10 text-green-500"
                        : att.file_type.includes("pdf")
                          ? "bg-red-500/10 text-red-500"
                          : "bg-blue-500/10 text-blue-500",
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-medium text-sm text-foreground truncate mb-1 group-hover:text-blue-500 transition-colors">
                    {att.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="px-1.5 py-0.5 bg-muted rounded">
                      {fileTypeLabel}
                    </span>
                    <span>{formatSize(att.file_size)}</span>
                  </div>
                  {att.task && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                          STATUS_COLORS[att.task.status] ||
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {att.task.status}
                      </span>
                      <span className="text-muted-foreground truncate">
                        {att.task.title}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(att.created_at), "MMM d, yyyy")}
                    </span>
                    <a
                      href={att.file_url}
                      download={att.name}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
