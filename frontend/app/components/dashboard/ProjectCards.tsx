"use client";

import { useState } from "react";
import type { JSX } from "react";
import { useRouter } from "next/navigation";
// Ensure React namespace is available for JSX.Element type
import { format, formatDistanceToNow } from "date-fns";
import {
  MoreVertical,
  Calendar,
  Plus,
  Edit,
  Copy,
  Download,
  Archive,
  Trash2,
  Folder,
  CheckCircle,
  Circle,
  Hash,
  ExternalLink,
  Zap,
  FileText,
  MessageSquare,
  GitBranch,
  PenTool,
} from "lucide-react";
import blankDocumentIcon from "../../assets/icons/blank-document.png";
import documentPreviewIcon from "../../assets/icons/document-preview.png";

type ViewMode = "grid" | "list";

interface Project {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  word_count: number;
  due_date?: string;
  progress: number;
  created_at: string;
  updated_at: string;
  metadata?: {
    imported_from?: string;
    import_source_url?: string;
    source_tool?: string;
    source_url?: string;
    source_type?: string;       // "issue", "pr", "readme", "page", "figma_file", "message", etc.
    source_channel?: string;    // "#channel", "PROJ", "repo-name", "team/project"
    source_author?: string;     // author name from source tool
    source_status?: string;     // "open", "closed", "resolved", etc.
    source_number?: string;     // "#42", "PROJ-123", etc.
    source_branch?: string;     // branch name for GitHub
    source_file_path?: string;  // file path for GitHub/Figma
    source_page_count?: number; // pages for Figma/Notion
    source_component_count?: number; // components for Figma
    source_version?: string;    // version for Figma
    source_thumbnail?: string;  // thumbnail URL for Figma
    items_count?: number;       // number of child items in a collection
    child_items_count?: number; // alias for collections
    content_format?: string;    // "editor" or "blocks"
  } | null;
  collaborators?: Array<{
    id: string;
    user_id: string;
    permission: string;
    user?: {
      full_name?: string;
      email: string;
    };
  }>;
  workspace_id?: string | null;
  workspace?: {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
  } | null;
  // Add other fields as needed
}

function getSourceToolInfo(metadata: Project["metadata"]): { tool: string; label: string; color: string; icon: string; url?: string } | null {
  const tool = metadata?.imported_from || metadata?.source_tool;
  if (!tool) return null;
  const url = metadata?.import_source_url || metadata?.source_url;
  const toolMap: Record<string, { label: string; color: string; icon: string }> = {
    slack: { label: "Slack", color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800", icon: "zap" },
    notion: { label: "Notion", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800", icon: "notion" },
    jira: { label: "Jira", color: "bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800", icon: "jira" },
    github: { label: "GitHub", color: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700", icon: "github" },
    github_app: { label: "GitHub", color: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700", icon: "github" },
    figma: { label: "Figma", color: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800", icon: "figma" },
  };
  const info = toolMap[tool];
  if (!info) return null;
  return { tool, label: info.label, color: info.color, icon: info.icon, url };
}

/** Source-specific content metadata display */
function SourceMetadata({ project }: { project: Project }) {
  const meta = project.metadata;
  if (!meta) return null;
  const tool = meta.imported_from || meta.source_tool;
  if (!tool) return null;

  const metaItems: Array<{ label: string; value: string; color?: string }> = [];

  switch (tool) {
    case "github":
    case "github_app":
      if (meta.source_type) {
        const typeColors: Record<string, string> = {
          issue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          pr: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          readme: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        };
        metaItems.push({
          label: meta.source_type.toUpperCase(),
          value: meta.source_number || "",
          color: typeColors[meta.source_type] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        });
      }
      if (meta.source_branch) metaItems.push({ label: "Branch", value: meta.source_branch });
      if (meta.source_file_path) metaItems.push({ label: "Path", value: meta.source_file_path });
      break;

    case "notion":
      if (meta.source_type) {
        const typeColors: Record<string, string> = {
          page: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          database: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        };
        metaItems.push({
          label: meta.source_type.charAt(0).toUpperCase() + meta.source_type.slice(1),
          value: "",
          color: typeColors[meta.source_type] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        });
      }
      if (meta.source_author) metaItems.push({ label: "Author", value: meta.source_author });
      break;

    case "jira":
      if (meta.source_number) {
        const statusColors: Record<string, string> = {
          open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          closed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          "in-progress": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        };
        metaItems.push({
          label: "Issue",
          value: meta.source_number,
          color: statusColors[meta.source_status || "open"],
        });
      }
      if (meta.source_channel) metaItems.push({ label: "Project", value: meta.source_channel });
      if (meta.source_author) metaItems.push({ label: "Assignee", value: meta.source_author });
      break;

    case "figma":
      if (meta.source_page_count) metaItems.push({ label: "Pages", value: String(meta.source_page_count) });
      if (meta.source_component_count) metaItems.push({ label: "Components", value: String(meta.source_component_count) });
      if (meta.source_version) metaItems.push({ label: "Version", value: meta.source_version });
      break;

    case "slack":
      if (meta.source_channel) metaItems.push({ label: "Channel", value: meta.source_channel });
      if (meta.source_author) metaItems.push({ label: "Author", value: meta.source_author });
      if (meta.source_type) metaItems.push({ label: "Type", value: meta.source_type });
      break;
  }

  if (metaItems.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {metaItems.map((item, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
            item.color || "bg-muted text-muted-foreground"
          }`}
        >
          {item.label && <span className="opacity-70">{item.label}:</span>}
          {item.value}
        </span>
      ))}
      {(meta.items_count || meta.child_items_count) && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
          <Folder className="h-2.5 w-2.5" />
          {meta.items_count || meta.child_items_count} items
        </span>
      )}
    </div>
  );
}

function SourceToolBadge({ source }: { source: { label: string; color: string; icon: string; url?: string } }) {
  const iconMap: Record<string, JSX.Element> = {
    zap: <Zap className="h-3 w-3" />,
    notion: <FileText className="h-3 w-3" />,
    jira: <GitBranch className="h-3 w-3" />,
    github: <GitBranch className="h-3 w-3" />,
    figma: <PenTool className="h-3 w-3" />,
  };
  const badge = (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${source.color}`}>
      {iconMap[source.icon] || <ExternalLink className="h-3 w-3" />}
      {source.label}
    </span>
  );
  if (source.url) {
    return (
      <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80" onClick={(e) => e.stopPropagation()}>
        {badge}
      </a>
    );
  }
  return badge;
}

interface ProjectCardsProps {
  projects?: Project[];
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onProjectClick?: (project: Project) => void;
  onProjectAction?: (action: string, project: Project) => void;
  onCreateProject?: () => void; // Add this new prop
  selectedProjects?: string[]; // For batch export
  onProjectSelect?: (projectId: string) => void; // For batch export
}

export default function ProjectCards({
  projects = [],
  viewMode = "grid",
  onProjectAction,
  onCreateProject, // Add this new prop
  selectedProjects = [], // For batch export
  onProjectSelect, // For batch export
}: Omit<ProjectCardsProps, "onViewModeChange">) {
  const router = useRouter();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [sortBy] = useState<"lastUpdated" | "name" | "dueDate" | "progress">(
    "lastUpdated",
  );
  const [searchQuery] = useState("");
  const [error] = useState<string | null>(null);

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    return (
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Sort projects based on sortBy state
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.title.localeCompare(b.title);
      case "dueDate":
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      case "progress":
        return b.progress - a.progress;
      case "lastUpdated":
      default:
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
    }
  });

  const currentProjects = sortedProjects;

  interface StatusConfig {
    label: string;
    classes: string;
  }

  interface StatusConfigMap {
    [key: string]: StatusConfig;
  }

  const getStatusBadge = (status: string): JSX.Element => {
    const statusConfig: StatusConfigMap = {
      "in-progress": {
        label: "In Progress",
        classes:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      },
      draft: {
        label: "Draft",
        classes:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      },
      completed: {
        label: "Completed",
        classes:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      },
    };

    const config: StatusConfig = statusConfig[status] || {
      label: status,
      classes: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.classes}`}
      >
        {config.label}
      </span>
    );
  };

  interface DueDateStatus {
    text: string;
    isOverdue: boolean;
    isSoon: boolean;
  }

  const getDueDateStatus = (dueDate?: string): DueDateStatus => {
    if (!dueDate) {
      return { text: "No due date", isOverdue: false, isSoon: false };
    }

    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) {
      return {
        text: `Overdue by ${Math.abs(diffDays)} days`,
        isOverdue: true,
        isSoon: false,
      };
    } else if (diffDays === 0) {
      return {
        text: "Due today",
        isOverdue: false,
        isSoon: true,
      };
    } else if (diffDays <= 3) {
      return {
        text: `Due in ${diffDays} days`,
        isOverdue: false,
        isSoon: true,
      };
    } else {
      return {
        text: `Due ${format(due, "MMM d")}`,
        isOverdue: false,
        isSoon: false,
      };
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress == null || isNaN(progress) || progress <= 0)
      return "bg-gray-300";
    if (progress < 30) return "bg-red-500";
    if (progress < 70) return "bg-purple-500";
    if (progress >= 100) return "bg-green-500";
    return "bg-amber-500";
  };

  // Determine effective status based on progress
  const getEffectiveStatus = (project: Project): string => {
    const progress = computeProgress(project.word_count);
    // If progress is 100%, always show as completed
    if (progress >= 100) return "completed";
    // Otherwise use the stored status
    return project.status;
  };

  // Compute progress from word_count — since projects don't have a stored progress field.
  // A document with 2000+ words is considered 100% complete.
  const computeProgress = (wordCount: number): number => {
    if (!wordCount || wordCount <= 0) return 0;
    return Math.min(100, Math.round((wordCount / 2000) * 100));
  };

  const formatLastUpdated = (dateString: string): string => {
    // Handle null, undefined, or empty date strings
    if (!dateString) {
      return "Never";
    }

    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // If no projects and there's an error, show error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div
          className="mx-auto h-12 w-12 text-red-500"
          role="img"
          aria-label="Error"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-foreground">
          Error loading projects
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // If no projects, show empty state
  if (currentProjects.length === 0 && !error) {
    return (
      <div className="text-center py-12">
        <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium text-foreground">
          No projects
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating a new project.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => onCreateProject && onCreateProject()}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
            New Project
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="bg-card rounded-xl border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Project
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider"
              >
                Stats
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider"
              >
                Progress
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider"
              >
                Last Updated
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {currentProjects.map((project) => {
              // const dueDateStatus = getDueDateStatus(project.due_date);

              return (
                <tr
                  key={project.id}
                  className="hover:bg-muted/50 cursor-pointer relative"
                  onClick={() => router.push(`/editor/${project.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {(() => {
                        const sourceInfo = getSourceToolInfo(project.metadata);
                        if (sourceInfo) {
                          const iconMap: Record<string, JSX.Element> = {
                            zap: <Zap className="h-5 w-5 text-purple-600" />,
                            notion: <FileText className="h-5 w-5 text-blue-600" />,
                            jira: <GitBranch className="h-5 w-5 text-blue-500" />,
                            github: <GitBranch className="h-5 w-5 text-gray-600" />,
                            figma: <PenTool className="h-5 w-5 text-pink-600" />,
                          };
                          const thumb = project.metadata?.source_thumbnail;
                          return (
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
                              {thumb && sourceInfo.tool === "figma" ? (
                                <img src={thumb} alt="Figma" className="w-full h-full object-cover" />
                              ) : (
                                iconMap[sourceInfo.icon] || <ExternalLink className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                          );
                        }
                        if (project.word_count > 0) {
                          return (
                            <div className="flex-shrink-0 h-10 w-10">
                              <img src={documentPreviewIcon.src} alt="Document with content" className="w-10 h-10 object-fill" />
                            </div>
                          );
                        }
                        return (
                          <div className="flex-shrink-0 h-10 w-10">
                            <img src={blankDocumentIcon.src} alt="Blank document" className="w-10 h-10 object-fill" />
                          </div>
                        );
                      })()}
                      <div className="ml-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-foreground">
                            {project.title}
                          </div>
                          {(() => {
                            const sourceInfo = getSourceToolInfo(project.metadata);
                            return sourceInfo ? <SourceToolBadge source={sourceInfo} /> : null;
                          })()}
                        </div>
                        {project.description ? (
                          <div className="text-sm text-muted-foreground truncate max-w-xs mt-1">
                            {project.description}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground truncate max-w-xs mt-1">
                            No description
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(getEffectiveStatus(project))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <div className="flex items-center space-x-4">
                      {(() => {
                        const isImported = !!(project.metadata?.imported_from || project.metadata?.source_tool);
                        if (isImported) {
                          const meta = project.metadata!;
                          const sourceUrl = meta.import_source_url || meta.source_url;
                          const tool = meta.imported_from || meta.source_tool;
                          const toolLabels: Record<string, string> = {
                            github: "GitHub", github_app: "GitHub", notion: "Notion",
                            jira: "Jira", figma: "Figma", slack: "Slack",
                          };
                          return (
                            <div className="flex items-center gap-2">
                              {meta.source_author && <span className="text-muted-foreground">{meta.source_author}</span>}
                              {sourceUrl && (
                                <a
                                  href={sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                                >
                                  Open in {toolLabels[tool || ""] || tool}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          );
                        }
                        return <span>{project.word_count} words</span>;
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(
                            computeProgress(project.word_count),
                          )}`}
                          style={{
                            width: `${computeProgress(project.word_count)}%`,
                          }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {computeProgress(project.word_count)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatLastUpdated(project.updated_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(
                            activeDropdown === project.id ? null : project.id,
                          );
                        }}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {activeDropdown === project.id && (
                        <div
                          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-popover text-popover-foreground focus:outline-none z-50 border border-border"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="py-1">
                            <button
                              onClick={() =>
                                onProjectAction &&
                                onProjectAction("open", project)
                              }
                              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                            >
                              <Edit className="mr-3 h-4 w-4" />
                              Open Editor
                            </button>
                            <button
                              onClick={() =>
                                onProjectAction &&
                                onProjectAction("rename", project)
                              }
                              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                            >
                              <Edit className="mr-3 h-4 w-4" />
                              Rename
                            </button>
                            <button
                              onClick={() =>
                                onProjectAction &&
                                onProjectAction("duplicate", project)
                              }
                              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                            >
                              <Copy className="mr-3 h-4 w-4" />
                              Duplicate
                            </button>
                            <div className="border-t border-border my-1"></div>
                            <button
                              onClick={() =>
                                onProjectAction &&
                                onProjectAction(
                                  project.status === "archived"
                                    ? "restore"
                                    : "archive",
                                  project,
                                )
                              }
                              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                            >
                              <Archive className="mr-3 h-4 w-4" />
                              {project.status === "archived"
                                ? "Restore Archived"
                                : "Archive"}
                            </button>
                            <button
                              onClick={() =>
                                onProjectAction &&
                                onProjectAction("delete", project)
                              }
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-muted"
                            >
                              <Trash2 className="mr-3 h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {currentProjects.map((project) => {
        const dueDateStatus = getDueDateStatus(project.due_date);

        return (
          <div
            key={project.id}
            className="bg-card rounded-xl border border-border hover:shadow-lg transition-shadow duration-200 relative"
          >
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(
                    activeDropdown === project.id ? null : project.id,
                  );
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {activeDropdown === project.id && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-popover text-popover-foreground focus:outline-none z-50 border border-border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    <button
                      onClick={() =>
                        onProjectAction && onProjectAction("open", project)
                      }
                      className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <Edit className="mr-3 h-4 w-4" />
                      Open Editor
                    </button>
                    <button
                      onClick={() =>
                        onProjectAction && onProjectAction("rename", project)
                      }
                      className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <Edit className="mr-3 h-4 w-4" />
                      Rename
                    </button>
                    <button
                      onClick={() =>
                        onProjectAction && onProjectAction("duplicate", project)
                      }
                      className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <Copy className="mr-3 h-4 w-4" />
                      Duplicate
                    </button>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={() =>
                        onProjectAction &&
                        onProjectAction(
                          project.status === "archived" ? "restore" : "archive",
                          project,
                        )
                      }
                      className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <Archive className="mr-3 h-4 w-4" />
                      {project.status === "archived"
                        ? "Restore Archived"
                        : "Archive"}
                    </button>{" "}
                    <button
                      onClick={() =>
                        onProjectAction && onProjectAction("delete", project)
                      }
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-muted"
                    >
                      <Trash2 className="mr-3 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Project selection checkbox */}
            {
              <div className="absolute top-3 left-3 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onProjectSelect && onProjectSelect(project.id);
                  }}
                  className="flex items-center justify-center h-5 w-5 rounded border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Select project ${project.title}`}
                >
                  {selectedProjects.includes(project.id) ? (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            }

            <div
              className="p-5 cursor-pointer pt-12"
              onClick={() => router.push(`/editor/${project.id}`)}
            >
              <div className="flex items-start justify-between">
                {(() => {
                  const sourceInfo = getSourceToolInfo(project.metadata);
                  if (sourceInfo) {
                    return (
                      <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
                        {(() => {
                          // Show Figma thumbnail if available
                          const thumb = project.metadata?.source_thumbnail;
                          if (thumb && sourceInfo.tool === "figma") {
                            return <img src={thumb} alt="Figma design" className="w-full h-full object-cover" />;
                          }
                          const iconMap: Record<string, JSX.Element> = {
                            zap: <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />,
                            notion: <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
                            jira: <GitBranch className="h-6 w-6 text-blue-500 dark:text-blue-400" />,
                            github: <GitBranch className="h-6 w-6 text-gray-600 dark:text-gray-400" />,
                            figma: <PenTool className="h-6 w-6 text-pink-600 dark:text-pink-400" />,
                          };
                          return iconMap[sourceInfo.icon] || <ExternalLink className="h-6 w-6 text-gray-500" />;
                        })()}
                      </div>
                    );
                  }
                  if (project.word_count > 0) {
                    return (
                      <div className="flex-shrink-0 h-12 w-12">
                        <img
                          src={documentPreviewIcon.src}
                          alt="Document with content"
                          className="w-12 h-12 object-fill"
                        />
                      </div>
                    );
                  }
                  return (
                    <div className="flex-shrink-0 h-12 w-12">
                      <img
                        src={blankDocumentIcon.src}
                        alt="Blank document"
                        className="w-12 h-12 object-fill"
                      />
                    </div>
                  );
                })()}
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground truncate">
                      {project.title}
                    </h3>
                    {(() => {
                      const sourceInfo = getSourceToolInfo(project.metadata);
                      return sourceInfo ? <SourceToolBadge source={sourceInfo} /> : null;
                    })()}
                  </div>
                  {/* Display workspace information if project belongs to a workspace */}
                  {project.workspace && (
                    <div className="mt-1 flex items-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <Hash className="h-3 w-3 mr-1" />
                        {project.workspace.name}
                      </span>
                    </div>
                  )}
                  {project.description ? (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {project.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      No description
                    </p>
                  )}
                  {/* Source-specific metadata */}
                  <SourceMetadata project={project} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {getStatusBadge(getEffectiveStatus(project))}
                {project.due_date && (
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      dueDateStatus.isOverdue
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : dueDateStatus.isSoon
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {dueDateStatus.text}
                  </span>
                )}
              </div>

              {/* Source-specific stats or generic word count */}
              {(() => {
                const isImported = !!(project.metadata?.imported_from || project.metadata?.source_tool);
                if (isImported) {
                  const meta = project.metadata!;
                  const sourceUrl = meta.import_source_url || meta.source_url;
                  const tool = meta.imported_from || meta.source_tool;
                  const toolLabels: Record<string, string> = {
                    github: "GitHub", github_app: "GitHub", notion: "Notion",
                    jira: "Jira", figma: "Figma", slack: "Slack",
                  };
                  return (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {meta.source_author && <span>{meta.source_author}</span>}
                        {meta.source_number && <span className="opacity-60">{meta.source_number}</span>}
                        {meta.source_channel && <span className="opacity-60">{meta.source_channel}</span>}
                      </div>
                      {sourceUrl && (
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          Open in {toolLabels[tool || ""] || tool}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  );
                }
                return (
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{project.word_count} words</span>
                    <span>{formatLastUpdated(project.updated_at)}</span>
                  </div>
                );
              })()}

              <div className="mt-3">
                <div className="flex items-center">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(
                        computeProgress(project.word_count),
                      )}`}
                      style={{
                        width: `${computeProgress(project.word_count)}%`,
                      }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {computeProgress(project.word_count)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
