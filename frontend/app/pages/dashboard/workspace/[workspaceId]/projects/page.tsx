"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Grid3X3, List } from "lucide-react";
import ProjectCards from "../../../../../components/dashboard/ProjectCards";
import CreateProjectModal from "../../../../../components/dashboard/CreateProjectModal";
import { useUser } from "../../../../../lib/utils/useUser";
import ProjectService from "../../../../../lib/utils/projectService";
import WorkspaceService from "../../../../../lib/utils/workspaceService";
import ExportService from "../../../../../lib/utils/exportService";
import { useToast } from "../../../../../hooks/use-toast";
import BillingService from "../../../../../lib/utils/billingService";

type ViewMode = "grid" | "list";

export default function WorkspaceProjectsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renamingProject, setRenamingProject] = useState<any>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const { data: user, loading: userLoading } = useUser();
  const workspaceId = params.workspaceId as string;
  const [workspaceName, setWorkspaceName] = useState<string>("");

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) return;
      try {
        const data = await WorkspaceService.getWorkspace(workspaceId);
        if (data) {
          setWorkspaceName(data.name);
        }
      } catch (error) {
        console.error("Failed to fetch workspace name", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkspace();
  }, [workspaceId]);

  useEffect(() => {
    let isMounted = true;

    const loadSubscriptionData = async () => {
      if (!user) return;

      try {
        const subscription = await BillingService.getCurrentSubscription();
        if (isMounted) {
          setSubscriptionData(subscription);
        }
      } catch (error: any) {
        console.error("Failed to load subscription data:", error);
      }
    };

    loadSubscriptionData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    const loadProjects = async () => {
      if (!user || !workspaceId) return;

      setIsLoading(true);
      setError(null);

      try {
        const fetchArchived = activeFilter === "archived";
        const projectsData = await ProjectService.getUserProjectsInWorkspace(
          user.id,
          workspaceId,
          fetchArchived,
        );
        setProjects(projectsData);
      } catch (error: any) {
        console.error("Failed to load workspace projects:", error);
        if (error.message && error.message.includes("fetch")) {
          setError(
            "Unable to connect to the server. Please make sure the backend API is running.",
          );
        } else {
          setError("Failed to load spaces. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [user, workspaceId, activeFilter]);

  useEffect(() => {
    let filtered = projects;

    // Apply status filter
    if (activeFilter !== "all" && activeFilter !== "archived") {
      filtered = filtered.filter((project) => project.status === activeFilter);
    }

    setFilteredProjects(filtered);
  }, [projects, activeFilter]);

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleProjectCreate = async (newProject: any) => {
    try {
      // Add the workspace_id to the newly created project
      setProjects((prev: any[]) => [newProject, ...prev]);
      toast({
        title: "Success",
        description: "Space created successfully!",
      });
      return newProject;
    } catch (error: any) {
      console.error("Failed to create project:", error);
      toast({
        title: "Error",
        description: "Failed to create space. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleProjectClick = (project: any) => {
    router.push(`/editor/${project.id}`);
  };

  const handleRenameProject = (project: any) => {
    setRenamingProject(project);
    setNewProjectName(project.title);
  };

  const handleRenameConfirm = async () => {
    if (!renamingProject || !newProjectName.trim()) return;

    try {
      await ProjectService.updateProject(renamingProject.id, {
        title: newProjectName.trim(),
      });

      setProjects((prev) =>
        prev.map((p) =>
          p.id === renamingProject.id
            ? { ...p, title: newProjectName.trim() }
            : p,
        ),
      );

      setRenamingProject(null);
      setNewProjectName("");

      toast({
        title: "Success",
        description: "Space renamed successfully!",
      });
    } catch (error: any) {
      console.error("Failed to rename project:", error);
      toast({
        title: "Error",
        description: "Failed to rename space. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateProject = async (project: any) => {
    try {
      toast({
        title: "Duplicating Space",
        description: `Creating a copy of "${project.title}"...`,
      });

      const duplicateData = {
        ...project,
        title: `${project.title} (Copy)`,
        id: undefined,
      };

      const duplicatedProject =
        await ProjectService.createProject(duplicateData);
      setProjects((prev) => [duplicatedProject, ...prev]);

      toast({
        title: "Success",
        description: "Space duplicated successfully!",
      });
    } catch (error: any) {
      console.error("Failed to duplicate project:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate space. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportProject = async (project: any) => {
    try {
      toast({
        title: "Export Started",
        description: `Exporting "${project.title}"... This may take a moment.`,
      });

      const blob = await ExportService.exportProjectBlob(project.id, {
        format: "pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: `"${project.title}" has been exported successfully.`,
      });
    } catch (error: any) {
      console.error("Failed to export project:", error);
      toast({
        title: "Export Failed",
        description: `Failed to export "${project.title}". Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleArchiveProject = async (project: any) => {
    try {
      if (
        window.confirm(
          `Are you sure you want to archive "${project.title}"? You can restore it later from the archived spaces view.`,
        )
      ) {
        await ProjectService.updateProject(project.id, {
          status: "archived",
        });

        setProjects((prev) => prev.filter((p) => p.id !== project.id));

        toast({
          title: "Success",
          description: "Space archived successfully!",
        });
      }
    } catch (error: any) {
      console.error("Failed to archive project:", error);
      toast({
        title: "Error",
        description: "Failed to archive space. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreProject = async (project: any) => {
    try {
      if (
        window.confirm(
          `Are you sure you want to restore "${project.title}"? It will be moved back to your active spaces.`,
        )
      ) {
        // Update project status to draft to restore from archived
        await ProjectService.updateProject(project.id, {
          status: "draft",
        });

        // Remove from current list since it's now restored
        setProjects((prev) => prev.filter((p) => p.id !== project.id));

        toast({
          title: "Success",
          description: "Space restored successfully!",
        });
      }
    } catch (error: any) {
      console.error("Failed to restore project:", error);
      toast({
        title: "Error",
        description: "Failed to restore space. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (project: any) => {
    try {
      if (
        window.confirm(
          "Are you sure you want to delete this space? This action cannot be undone.",
        )
      ) {
        await ProjectService.deleteProject(project.id);
        setProjects((prev) => prev.filter((p) => p.id !== project.id));

        toast({
          title: "Success",
          description: "Space deleted successfully!",
        });
      }
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Error",
        description: "Failed to delete space. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProjectAction = async (action: string, project: any) => {
    console.log(`Project ${action}:`, project.id);

    try {
      switch (action) {
        case "open":
          handleProjectClick(project);
          break;
        case "rename":
          handleRenameProject(project);
          break;
        case "duplicate":
          handleDuplicateProject(project);
          break;
        case "export":
          handleExportProject(project);
          break;
        case "archive":
          handleArchiveProject(project);
          break;
        case "restore":
          handleRestoreProject(project);
          break;
        case "delete":
          handleDeleteProject(project);
          break;
        default:
          console.log("Unknown action:", action);
      }
    } catch (error: any) {
      console.error(`Failed to perform action ${action}:`, error);
      let errorMessage = "Failed to perform action. Please try again later.";
      if (error.message && error.message.includes("fetch")) {
        errorMessage =
          "Unable to connect to the server. Please make sure the backend API is running.";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const filterOptions = [
    { id: "all", label: "All" },
    { id: "draft", label: "Draft" },
    { id: "in-progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
    { id: "planning", label: "Planning" },
    { id: "archived", label: "Archived" },
  ];

  // Handle batch export
  const handleBatchExport = async () => {
    if (selectedProjects.length === 0) {
      toast({
        title: "No Spaces Selected",
        description: "Please select at least one space to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Batch Export Started",
        description: `Exporting ${selectedProjects.length} spaces... This may take a moment.`,
      });

      // Since batch export API might not exist, export projects individually
      for (const projectId of selectedProjects) {
        const project = projects.find((p) => p.id === projectId);
        if (project) {
          const blob = await ExportService.exportProjectBlob(projectId, {
            format: "pdf",
          });

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${project.title.replace(/\s+/g, "_")}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }

      toast({
        title: "Batch Export Complete",
        description: `${selectedProjects.length} spaces have been exported successfully.`,
      });

      setSelectedProjects([]);
    } catch (error: any) {
      console.error("Failed to batch export projects:", error);
      toast({
        title: "Batch Export Failed",
        description:
          error.message || "Failed to export spaces. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Select all projects
  const selectAllProjects = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map((p) => p.id));
    }
  };

  // Check if user has Researcher plan
  const isResearcherPlan =
    subscriptionData?.plan === "Researcher" ||
    subscriptionData?.plan?.name === "Researcher";

  if (userLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading spaces...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 flex items-center gap-2">
            {isLoading ? (
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            ) : (
              workspaceName
            )}{" "}
            Spaces
          </h1>
          <p className="text-muted-foreground mt-1">
            {projects.length === 0 && !isLoading
              ? "Ready to create your first space?"
              : `${projects.length} spaces in this workspace`}
          </p>
        </div>

        <div className="flex space-x-3">
          {/* Batch Export Button - only for Researcher plan */}
          {isResearcherPlan && projects.length > 0 && (
            <button
              onClick={handleBatchExport}
              disabled={selectedProjects.length === 0}
              className={`inline-flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${selectedProjects.length > 0
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}>
              <Plus className="w-5 h-5 mr-2" />
              Batch Export ({selectedProjects.length})
            </button>
          )}

          <button
            onClick={handleCreateProject}
            className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl">
            <Plus className="w-5 h-5 mr-2" />
            New Space
          </button>
        </div>
      </div>

      {/* Rename Modal */}
      {renamingProject && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border shadow-lg">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Rename Space
            </h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-background text-foreground"
              placeholder="Enter new space name"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleRenameConfirm();
                }
              }}
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setRenamingProject(null)}
                className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-md">
                Cancel
              </button>
              <button
                onClick={handleRenameConfirm}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {projects.length >= 0 && (
        <div className="flex items-center space-x-2 mb-6">
          {/* Select All Checkbox - only for Researcher plan */}
          {isResearcherPlan && (
            <div className="flex items-center mr-4">
              <input
                type="checkbox"
                id="select-all"
                checked={
                  selectedProjects.length === filteredProjects.length &&
                  filteredProjects.length > 0
                }
                onChange={selectAllProjects}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-200 rounded"
              />
              <label
                htmlFor="select-all"
                className="ml-2 text-sm text-foreground">
                Select All
              </label>
            </div>
          )}

          <span className="text-sm font-medium text-foreground mr-2">
            Filter:
          </span>
          {filterOptions.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${activeFilter === filter.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>
              {filter.label}
            </button>
          ))}

          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1 ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors duration-200 ${viewMode === "grid"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors duration-200 ${viewMode === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-destructive"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">
                Error loading data
              </h3>
              <div className="mt-2 text-sm text-destructive">
                <p>{error}</p>
                <p className="mt-2">Please make sure:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>The backend API server is running on port 3001</li>
                  <li>You have a stable internet connection</li>
                  <li>You are properly authenticated</li>
                </ul>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-destructive bg-destructive/10 hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive">
                  <svg
                    className="-ml-0.5 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Content */}
      <>
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-muted rounded-lg"></div>
                  <div className="w-6 h-6 bg-muted rounded"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                  <div className="h-2 bg-muted rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ProjectCards
            projects={filteredProjects}
            viewMode={viewMode as ViewMode}
            onProjectClick={handleProjectClick}
            onProjectAction={handleProjectAction}
            onCreateProject={handleCreateProject}
            selectedProjects={selectedProjects}
            onProjectSelect={(projectId: string) => {
              if (selectedProjects.includes(projectId)) {
                setSelectedProjects(
                  selectedProjects.filter((id: string) => id !== projectId),
                );
              } else {
                setSelectedProjects([...selectedProjects, projectId]);
              }
            }}
            isResearcherPlan={isResearcherPlan}
          />
        )}
      </>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
        }}
        onProjectCreate={handleProjectCreate}
        initialWorkspaceId={workspaceId}
      />
    </div>
  );
}
