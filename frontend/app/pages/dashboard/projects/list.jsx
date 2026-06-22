"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Grid3X3, List } from "lucide-react";
import ProjectCards from "../../../components/dashboard/ProjectCards";
import CreateProjectModal from "../../../components/dashboard/CreateProjectModal";
import { ExportModal } from "../../../components/editor/export-modal";
import { useUser } from "../../../lib/utils/useUser";
import ProjectService from "../../../lib/utils/projectService";
import ExportService from "../../../lib/utils/exportService";
import { useToast } from "../../../hooks/use-toast";


export default function ProjectsListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [renamingProject, setRenamingProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [exportingProject, setExportingProject] = useState(null);

  const [selectedProjects, setSelectedProjects] = useState([]);
  const [archivedProjects, setArchivedProjects] = useState([]);
  const { data: user, loading: userLoading } = useUser();

  // Load projects — active or archived based on filter
  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setError(null);

        if (activeFilter === "archived") {
          // Load archived projects
          const archivedRes = await ProjectService.getUserPersonalProjects(user.id, false, true);
          const archivedList = archivedRes?.projects || archivedRes || [];
          if (isMounted) {
            setArchivedProjects(Array.isArray(archivedList) ? archivedList : []);
          }
        } else {
          // Load active (non-archived) projects
          const personalProjects = await ProjectService.getUserPersonalProjects(user.id, false);
          if (isMounted) {
            setProjects(personalProjects || []);
          }
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
        if (isMounted) {
          setError("Failed to load projects. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, [user?.id, activeFilter]);

  // Filter projects by status (client-side, except "archived" which is loaded separately)
  useEffect(() => {
    if (activeFilter === "archived") {
      setFilteredProjects(archivedProjects);
      return;
    }

    let filtered = [...projects];

    // Apply status filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((project) => project.status === activeFilter);
    }

    setFilteredProjects(filtered);
  }, [projects, activeFilter, archivedProjects]);

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleProjectCreate = async (newProject) => {
    try {
      // Add the workProject_id to the newly created project
      setProjects((prev) => [newProject, ...prev]);
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
      return newProject;
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleProjectClick = (project) => {
    router.push(`/editor/${project.id}`);
  };

  const handleRenameProject = (project) => {
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
        description: "Project renamed successfully!",
      });
    } catch (error) {
      console.error("Failed to rename project:", error);
      toast({
        title: "Error",
        description: "Failed to rename project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateProject = async (project) => {
    try {
      toast({
        title: "Duplicating Project",
        description: `Creating a copy of "${project.title}"...`,
      });

      const duplicatedProject = await ProjectService.createProject({
        title: `${project.title} (Copy)`,
        description: project.description,
        type: project.type || "document",
        content: project.content,
        citation_style: project.citation_style,
      });
      setProjects((prev) => [duplicatedProject, ...prev]);

      toast({
        title: "Success",
        description: "Project duplicated successfully!",
      });
    } catch (error) {
      console.error("Failed to duplicate project:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportProject = async (project) => {
    // Open the export modal for format selection
    setExportingProject(project);
  };

  const handleArchiveProject = async (project) => {
    try {
      if (
        window.confirm(
          `Are you sure you want to archive "${project.title}"? You can restore it later from the archived Projects view.`,
        )
      ) {
        await ProjectService.updateProject(project.id, {
          status: "archived",
        });

        setProjects((prev) => prev.filter((p) => p.id !== project.id));

        toast({
          title: "Success",
          description: "Project archived successfully!",
        });
      }
    } catch (error) {
      console.error("Failed to archive project:", error);
      toast({
        title: "Error",
        description: "Failed to archive Project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreProject = async (project) => {
    try {
      if (
        window.confirm(
          `Are you sure you want to restore "${project.title}"? It will be moved back to your active Projects.`,
        )
      ) {
        await ProjectService.updateProject(project.id, {
          status: "draft",
        });

        // Remove from archived list (we're on the Archived tab)
        setArchivedProjects((prev) => prev.filter((p) => p.id !== project.id));

        toast({
          title: "Success",
          description: "Project restored successfully!",
        });
      }
    } catch (error) {
      console.error("Failed to restore project:", error);
      toast({
        title: "Error",
        description: "Failed to restore Project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (project) => {
    try {
      if (
        window.confirm(
          "Are you sure you want to delete this Project? This action cannot be undone.",
        )
      ) {
        await ProjectService.deleteProject(project.id);
        // Remove from both arrays
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
        setArchivedProjects((prev) => prev.filter((p) => p.id !== project.id));

        toast({
          title: "Success",
          description: "Project deleted successfully!",
        });
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Error",
        description: "Failed to delete Project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProjectAction = async (action, project) => {
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
    } catch (error) {
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
        title: "No Projects Selected",
        description: "Please select at least one Project to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Batch Export Started",
        description: `Exporting ${selectedProjects.length} Projects... This may take a moment.`,
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
        description: `${selectedProjects.length} Projects have been exported successfully.`,
      });

      setSelectedProjects([]);
    } catch (error) {
      console.error("Failed to batch export projects:", error);
      toast({
        title: "Batch Export Failed",
        description:
          error.message || "Failed to export Projects. Please try again.",
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

  if (userLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Projects...</p>
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
            My Personal Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            {projects.length === 0 && !isLoading
              ? "Ready to create your first personal project?"
              : `${projects.length} personal project${projects.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex gap-x-3">
          {/* Batch Export Button */}
          {projects.length > 0 && (
            <button
              onClick={handleBatchExport}
              disabled={selectedProjects.length === 0}
              className={`inline-flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${selectedProjects.length > 0
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
            >
              <Plus className="w-5 h-5 mr-2" />
              Batch Export ({selectedProjects.length})
            </button>
          )}

          <button
            onClick={handleCreateProject}
            className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </button>
        </div>
      </div>

      {/* Rename Modal */}
      {renamingProject && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border shadow-lg">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Rename Project
            </h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-background text-foreground"
              placeholder="Enter new Project name"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleRenameConfirm();
                }
              }}
            />
            <div className="mt-4 flex justify-end gap-x-3">
              <button
                onClick={() => setRenamingProject(null)}
                className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameConfirm}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {projects.length >= 0 && (
        <div className="flex items-center gap-x-2 mb-6">
          {/* Select All Checkbox */}
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
              className="ml-2 text-sm text-foreground"
            >
              Select All
            </label>
          </div>

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
                }`}
            >
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
                }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors duration-200 ${viewMode === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
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
                fill="currentColor"
              >
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
                <ul className="list-disc list-inside mt-1 Project-y-1">
                  <li>The backend API server is running on port 3001</li>
                  <li>You have a stable internet connection</li>
                  <li>You are properly authenticated</li>
                </ul>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-destructive bg-destructive/10 hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
                >
                  <svg
                    className="-ml-0.5 mr-2 h-4 w-4"
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
                className="bg-card rounded-xl border border-border p-6 animate-pulse"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-muted rounded-lg"></div>
                  <div className="w-6 h-6 bg-muted rounded"></div>
                </div>
                <div className="gap-y-3">
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
            viewMode={viewMode}
            onProjectClick={handleProjectClick}
            onProjectAction={handleProjectAction}
            onCreateProject={handleCreateProject}
            selectedProjects={selectedProjects}
            onProjectSelect={(projectId) => {
              if (selectedProjects.includes(projectId)) {
                setSelectedProjects(
                  selectedProjects.filter((id) => id !== projectId),
                );
              } else {
                setSelectedProjects([...selectedProjects, projectId]);
              }
            }}
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
      />

      {/* Export Modal */}
      {exportingProject && (
        <ExportModal
          isOpen={!!exportingProject}
          onClose={() => setExportingProject(null)}
          editor={null}
          documentTitle={exportingProject.title || "Untitled"}
          projectId={exportingProject.id}
        />
      )}
    </div>
  );
}
