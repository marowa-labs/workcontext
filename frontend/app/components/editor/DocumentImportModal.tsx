"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  FileText,
  Loader2,
  CheckCircle,
  HardDrive,
  Plug,
  Search,
  ExternalLink,
  MessageSquare,
  Ticket,
  GitPullRequest,
  Building2,
  Palette,
  ArrowLeft,
  FileCode,
} from "lucide-react";
import { supabase } from "../../lib/supabase/client";
import { importDocument } from "../../lib/utils/editorService";
import offlineService from "../../lib/utils/offlineService";

interface DocumentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (content: any) => void;
  accept?: string;
  validTypes?: string[];
  workspaceId?: string;
}

// ---------- Types for connected tools ----------

interface ConnectedTool {
  id: string;
  tool_type: string;
  tool_name: string;
  display_name: string;
  status: string;
  workspace_name: string;
  content_count: number;
}

interface ContentItem {
  id: string;
  external_id: string;
  tool_type: string;
  content_type: string;
  title: string | null;
  content_text: string | null;
  content_url: string | null;
  author_name: string | null;
  channel_or_project: string | null;
  last_synced_at: string | null;
}

interface BrowseResult {
  items: ContentItem[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
}

// ---------- Tool Icons ----------

const TOOL_ICONS: Record<string, React.ReactNode> = {
  slack: <MessageSquare className="w-5 h-5 text-purple-500" />,
  notion: <FileText className="w-5 h-5 text-gray-600" />,
  jira: <Ticket className="w-5 h-5 text-blue-500" />,
  github: <GitPullRequest className="w-5 h-5 text-gray-600" />,
  github_app: <Building2 className="w-5 h-5 text-gray-600" />,
  figma: <Palette className="w-5 h-5 text-pink-500" />,
};

// ---------- Component ----------

const DocumentImportModal: React.FC<DocumentImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  accept = ".txt,.doc,.docx,.pdf",
  validTypes = [
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pdf",
  ],
  workspaceId,
}) => {
  // Local file import state
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isImported, setIsImported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Connected tools state
  const [mode, setMode] = useState<"select" | "local" | "browse">("select");
  const [connectedTools, setConnectedTools] = useState<ConnectedTool[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ConnectedTool | null>(null);
  const [browseResult, setBrowseResult] = useState<BrowseResult | null>(null);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseSearch, setBrowseSearch] = useState("");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  // Get auth token helper
  const getAuthToken = async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  // Fetch connected tools on open
  useEffect(() => {
    if (!isOpen) {
      // Reset state when closing
      setMode("select");
      setFile(null);
      setSelectedTool(null);
      setBrowseResult(null);
      setSelectedContent(null);
      setError(null);
      setIsImported(false);
      setBrowseSearch("");
      return;
    }

    const fetchTools = async () => {
      setLoadingTools(true);
      try {
        const token = await getAuthToken();
        if (!token) return;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/integrations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success && data.connections) {
          setConnectedTools(
            data.connections.filter((c: ConnectedTool) => c.status === "active")
          );
        }
      } catch (err) {
        console.error("Failed to fetch connected tools:", err);
      } finally {
        setLoadingTools(false);
      }
    };

    fetchTools();
  }, [isOpen]);

  // Browse content when a tool is selected
  const browseContent = useCallback(
    async (tool: ConnectedTool, search?: string, cursor?: string) => {
      setBrowseLoading(true);
      setError(null);
      try {
        const token = await getAuthToken();
        if (!token) {
          setError("Not authenticated");
          return;
        }

        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (cursor) params.set("cursor", cursor);
        params.set("limit", "30");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/integrations/${tool.id}/browse?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data: BrowseResult & { success: boolean } = await res.json();
        if (data.success) {
          if (cursor && browseResult) {
            // Append to existing results
            setBrowseResult({
              ...data,
              items: [...browseResult.items, ...data.items],
            });
          } else {
            setBrowseResult(data);
          }
        }
      } catch {
        setError("Failed to load content");
      } finally {
        setBrowseLoading(false);
      }
    },
    [browseResult]
  );

  // Handle browse search
  useEffect(() => {
    if (selectedTool && mode === "browse") {
      const debounce = setTimeout(() => {
        browseContent(selectedTool, browseSearch || undefined);
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [browseSearch, selectedTool, mode]);

  // ---- Local file import ----

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (f: File) => {
    if (!validTypes.includes(f.type)) {
      setError(`Unsupported file type. Please upload a ${accept} file.`);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }
    setFile(f);
    setError(null);
    setIsImported(false);
  };

  const handleLocalImport = async () => {
    if (!file) {
      setError("Please select a file to import");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const content = await readFileAsBase64(file);
      const fileData = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        content: content,
        fileType: file.type,
        fileName: file.name,
        wordCount: 0,
        workspace_id: workspaceId || null,
      };

      const isOnline = navigator.onLine;

      if (isOnline) {
        const importedProject = await importDocument(fileData);
        onImport(importedProject);
      } else {
        await offlineService.createOfflineChange(
          "document_import",
          "temp-project-id",
          "import",
          fileData
        );
        onImport({ content: content });
      }

      setIsImported(true);
      setTimeout(() => {
        onClose();
        setFile(null);
        setIsImported(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error importing document:", err);
      setError(err.message || "Failed to import document. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const readFileAsBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const base64Content = content.split(",")[1] || content;
          resolve(base64Content);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(f);
    });
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // ---- Connected tool import ----

  const handleToolSelect = (tool: ConnectedTool) => {
    setSelectedTool(tool);
    setMode("browse");
    setSelectedContent(null);
    setBrowseSearch("");
    setError(null);
  };

  const handleContentImport = async (contentItem: ContentItem) => {
    setSelectedContent(contentItem);
    setIsImporting(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError("Not authenticated");
        setIsImporting(false);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/integrations/import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content_id: contentItem.id,
            workspace_id: workspaceId || undefined,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        // Create a project-like object for the parent component
        const importedProject = {
          id: data.projectId,
          title: data.title,
          description: `Imported from ${data.source_tool}`,
          status: "draft",
          source_tool: data.source_tool,
          source_url: data.source_url,
        };

        setIsImported(true);
        onImport(importedProject);

        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.message || "Failed to import content");
        setSelectedContent(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to import content");
      setSelectedContent(null);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  // ---------- Render ----------

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl border border-border max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode !== "select" && (
              <button
                onClick={() => {
                  if (mode === "browse") {
                    setMode("select");
                    setSelectedTool(null);
                    setBrowseResult(null);
                    setSelectedContent(null);
                  } else {
                    setMode("select");
                  }
                  setError(null);
                }}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-foreground">
              {mode === "select" && "Import Content"}
              {mode === "local" && "Import from File"}
              {mode === "browse" && `Import from ${selectedTool?.display_name || selectedTool?.tool_name}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* ---- SELECT MODE ---- */}
          {mode === "select" && (
            <div className="space-y-3">
              {/* Local file option */}
              <button
                onClick={() => setMode("local")}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <div className="p-3 rounded-xl bg-muted">
                  <HardDrive className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Local File</h3>
                  <p className="text-sm text-muted-foreground">
                    Import from a .docx, .pdf, or .txt file on your computer
                  </p>
                </div>
              </button>

              {/* Connected tools */}
              {loadingTools ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : connectedTools.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 py-2">
                    <Plug className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Connected Tools
                    </span>
                  </div>
                  {connectedTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool)}
                      className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                    >
                      <div className="p-3 rounded-xl bg-muted">
                        {TOOL_ICONS[tool.tool_type] || (
                          <Plug className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground">
                          {tool.display_name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {tool.workspace_name} — {tool.content_count.toLocaleString()} items
                        </p>
                      </div>
                      <FileCode className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No tools connected yet.{" "}
                  <a
                    href="/settings/integrations"
                    className="text-primary hover:underline"
                  >
                    Connect a tool
                  </a>{" "}
                  to import content.
                </div>
              )}
            </div>
          )}

          {/* ---- LOCAL FILE MODE ---- */}
          {mode === "local" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={triggerFileSelect}
                className="flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed border-border p-8 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <HardDrive className="h-10 w-10 text-muted-foreground mb-3" />
                <span className="text-sm font-medium text-foreground">
                  Click to select a file
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  .docx, .pdf, .txt — Max 5MB
                </span>
              </button>

              {file && (
                <div className="flex items-center justify-between rounded-md bg-muted p-3">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-foreground hover:text-foreground/70"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {isImported && (
                <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 p-3">
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-emerald-500" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      Document imported successfully!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- BROWSE MODE (connected tool) ---- */}
          {mode === "browse" && (
            <div className="space-y-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={browseSearch}
                  onChange={(e) => setBrowseSearch(e.target.value)}
                  placeholder={`Search ${selectedTool?.display_name || "content"}...`}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Content list */}
              {browseLoading && !browseResult ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : browseResult && browseResult.items.length > 0 ? (
                <div className="space-y-2">
                  {browseResult.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleContentImport(item)}
                      disabled={isImporting}
                      className="w-full text-left p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                              {item.content_type}
                            </span>
                            {item.channel_or_project && (
                              <span className="text-xs text-muted-foreground">
                                / {item.channel_or_project}
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-foreground truncate">
                            {item.title || "Untitled"}
                          </h4>
                          {item.content_text && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {item.content_text.slice(0, 200)}
                            </p>
                          )}
                          {item.author_name && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              by {item.author_name}
                            </p>
                          )}
                        </div>
                        {isImporting && selectedContent?.id === item.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0 mt-1" />
                        ) : (
                          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </button>
                  ))}

                  {/* Load more */}
                  {browseResult.hasMore && browseResult.nextCursor && (
                    <button
                      onClick={() =>
                        selectedTool &&
                        browseContent(selectedTool, browseSearch || undefined, browseResult.nextCursor!)
                      }
                      disabled={browseLoading}
                      className="w-full py-2 text-sm text-primary hover:underline disabled:opacity-50"
                    >
                      {browseLoading ? "Loading..." : "Load more"}
                    </button>
                  )}
                </div>
              ) : browseResult ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No content found{browseSearch ? ` for "${browseSearch}"` : ""}</p>
                  <p className="text-sm mt-1">
                    Try a different search or sync more content first.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-md bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          {mode === "local" && (
            <button
              type="button"
              onClick={handleLocalImport}
              disabled={!file || isImporting}
              className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import File"
              )}
            </button>
          )}
          {mode === "browse" && isImporting && selectedContent && (
            <div className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing {selectedContent.title || "content"}...
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
    </div>
  );
};

export default DocumentImportModal;
