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
  Folder, // Add missing Folder import
  CheckCircle,
  Circle,
  Hash,
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

interface ProjectCardsProps {
  projects?: Project[];
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onProjectClick?: (project: Project) => void;
  onProjectAction?: (action: string, project: Project) => void;
  onCreateProject?: () => void; // Add this new prop
  selectedProjects?: string[]; // For batch export
  onProjectSelect?: (projectId: string) => void; // For batch export
  isResearcherPlan?: boolean; // For batch export
}

export default function ProjectCards({
  projects = [],
  viewMode = "grid",
  onProjectAction,
  onCreateProject, // Add this new prop
  selectedProjects = [], // For batch export
  onProjectSelect, // For batch export
  isResearcherPlan = false, // For batch export
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
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.classes}`}>
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
    // Handle case where progress might be undefined or null
    if (progress == null || isNaN(progress)) return "bg-gray-500";
    if (progress <= 0) return "bg-red-500";
    if (progress <= 30) return "bg-red-500";
    if (progress <= 70) return "bg-purple-500";
    return "bg-green-500";
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
          aria-label="Error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
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
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor">
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
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
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
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Project
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                Stats
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                Progress
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
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
                  onClick={() => router.push(`/editor/${project.id}`)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {project.word_count > 0 ? (
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            src={documentPreviewIcon.src}
                            alt="Document with content"
                            className="w-10 h-10 object-fill"
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            src={blankDocumentIcon.src}
                            alt="Blank document"
                            className="w-10 h-10 object-fill"
                          />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground">
                          {project.title}
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
                    {getStatusBadge(project.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <div className="flex items-center space-x-4">
                      <span>{project.word_count} words</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(
                            project.progress,
                          )}`}
                          style={{ width: `${project.progress}%` }}></div>
                      </div>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {project.progress}%
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
                        className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted">
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {activeDropdown === project.id && (
                        <div
                          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-popover text-popover-foreground focus:outline-none z-50 border border-border"
                          onClick={(e) => e.stopPropagation()}>
                          <div className="py-1">
                            <button
                              onClick={() =>
                                router.push(`editor/${project.id}`)
                              }
                              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted">
                              <Edit className="mr-3 h-4 w-4" />
                              Open Editor
                            </button>
                            <button
                              onClick={() =>
                                onProjectAction &&
                                onProjectAction("rename", project)
                              }
                              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted">
                              <Edit className="mr-3 h-4 w-4" />
                              Rename
                            </button>
                            <button
                              onClick={() =>
                                onProjectAction &&
                                onProjectAction("duplicate", project)
                              }
                              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted">
                              <Copy className="mr-3 h-4 w-4" />
                              Duplicate
                            </button>
                            <button
                              onClick={() =>
                                onProjectAction &&
                                onProjectAction("export", project)
                              }
                              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted">
                              <Download className="mr-3 h-4 w-4" />
                              Export
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
                              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted">
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
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-muted">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {currentProjects.map((project) => {
        const dueDateStatus = getDueDateStatus(project.due_date);

        return (
          <div
            key={project.id}
            className="bg-card rounded-xl border border-border hover:shadow-lg transition-shadow duration-200 relative">
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(
                    activeDropdown === project.id ? null : project.id,
                  );
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted">
                <MoreVertical className="h-5 w-5" />
              </button>

              {activeDropdown === project.id && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-popover text-popover-foreground focus:outline-none z-50 border border-border"
                  onClick={(e) => e.stopPropagation()}>
                  <div className="py-1">
                    <button
                      onClick={() => router.push(`editor/${project.id}`)}
                      className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted">
                      <Edit className="mr-3 h-4 w-4" />
                      Open Editor
                    </button>
                    <button
                      onClick={() =>
                        onProjectAction && onProjectAction("rename", project)
                      }
                      className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted">
                      <Edit className="mr-3 h-4 w-4" />
                      Rename
                    </button>
                    <button
                      onClick={() =>
                        onProjectAction && onProjectAction("duplicate", project)
                      }
                      className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted">
                      <Copy className="mr-3 h-4 w-4" />
                      Duplicate
                    </button>
                    <button
                      onClick={() =>
                        onProjectAction && onProjectAction("export", project)
                      }
                      className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted">
                      <Download className="mr-3 h-4 w-4" />
                      Export
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
                      className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted">
                      <Archive className="mr-3 h-4 w-4" />
                      {project.status === "archived"
                        ? "Restore Archived"
                        : "Archive"}
                    </button>{" "}
                    <button
                      onClick={() =>
                        onProjectAction && onProjectAction("delete", project)
                      }
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-muted">
                      <Trash2 className="mr-3 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Project selection checkbox - only for Researcher plan */}
            {isResearcherPlan && (
              <div className="absolute top-3 left-3 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onProjectSelect && onProjectSelect(project.id);
                  }}
                  className="flex items-center justify-center h-5 w-5 rounded border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Select project ${project.title}`}>
                  {selectedProjects.includes(project.id) ? (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            )}

            <div
              className="p-5 cursor-pointer pt-12"
              onClick={() => router.push(`/editor/${project.id}`)}>
              <div className="flex items-start justify-between">
                {project.word_count > 0 ? (
                  <div className="flex-shrink-0 h-12 w-12">
                    <img
                      src={documentPreviewIcon.src}
                      alt="Document with content"
                      className="w-12 h-12 object-fill"
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 h-12 w-12">
                    <img
                      src={blankDocumentIcon.src}
                      alt="Blank document"
                      className="w-12 h-12 object-fill"
                    />
                  </div>
                )}
                <div className="ml-3 flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground truncate">
                    {project.title}
                  </h3>
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
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {getStatusBadge(project.status)}
                {project.due_date && (
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      dueDateStatus.isOverdue
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : dueDateStatus.isSoon
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-muted text-muted-foreground"
                    }`}>
                    <Calendar className="h-3 w-3 mr-1" />
                    {dueDateStatus.text}
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>{project.word_count} words</span>
                <span>{formatLastUpdated(project.updated_at)}</span>
              </div>

              <div className="mt-3">
                <div className="flex items-center">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(
                        project.progress,
                      )}`}
                      style={{ width: `${project.progress}%` }}></div>
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {project.progress}%
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
