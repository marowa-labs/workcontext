"use client";

import { useState, useEffect } from "react";
import { useUser } from "../../lib/utils/useUser";
import { useRouter } from "next/navigation";
import Button from "../auth/Button";
import { useForm } from "react-hook-form";
import FormInput from "../auth/FormInput";
import WorkspaceService from "../../lib/utils/workspaceService";
import { X, AlertCircle, Zap } from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreate: (project: any) => void;
  initialWorkspaceId?: string;
  showWorkspaceSelector?: boolean;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreate,
  initialWorkspaceId,
  showWorkspaceSelector = false,
}: CreateProjectModalProps) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    initialWorkspaceId || null,
  );

  // Load workspaces when the modal opens
  useEffect(() => {
    if (isOpen && user) {
      const fetchWorkspaces = async () => {
        try {
          const userWorkspaces = await WorkspaceService.getWorkspaces();
          setWorkspaces(userWorkspaces);

          if (showWorkspaceSelector) {
            // Set the workspace based on initialWorkspaceId if provided
            if (initialWorkspaceId) {
              // Verify the initial workspace exists in the user's workspaces
              const workspaceExists = userWorkspaces.some(
                (ws) => ws.id === initialWorkspaceId,
              );
              if (workspaceExists) {
                setSelectedWorkspace(initialWorkspaceId);
              } else {
                // If the initial workspace doesn't exist, set to null
                setSelectedWorkspace(null);
              }
            } else if (userWorkspaces.length > 0 && !selectedWorkspace) {
              // Otherwise, set the first workspace as default only if no workspace is currently selected
              setSelectedWorkspace(userWorkspaces[0].id);
            }
          } else {
            // When the workspace selector is not shown, keep the project personal
            setSelectedWorkspace(null);
          }
        } catch (err) {
          console.error("Error fetching workspaces:", err);
          // Don't show error to user as workspaces are optional
        }
      };
      fetchWorkspaces();
    }
  }, [
    isOpen,
    user,
    initialWorkspaceId,
    showWorkspaceSelector,
    selectedWorkspace,
  ]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      dueDate: "",
      description: "",
    },
    mode: "onChange", // Add this to enable real-time validation
  });

  const watchedFields = watch();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);

      // Reset form to default values when modal opens
      const defaultValues = {
        name: "",
        dueDate: "",
        description: "",
      };
      reset(defaultValues);
    }
  }, [isOpen, reset, user, userLoading]);

  interface FormData {
    name: string;
    dueDate: string;
    description: string;
    workspaceId?: string;
  }

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    if (!user) {
      setError("You must be logged in to create a project");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Creating project with user:", user?.id);

      // Prepare project data for API
      const projectData = {
        title: data.name,
        type: "document",
        due_date: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        description: data.description || null,
        status: "draft",
        word_count: 0,
        content: null,
        workspace_id: selectedWorkspace || null, // Include workspace ID if selected
      };

      // Create the project using ProjectService
      console.log("Calling ProjectService.createProject...");
      const ProjectService = (await import("../../lib/utils/projectService"))
        .default;
      const createdProject = await ProjectService.createProject(projectData);
      console.log("Project created successfully:", createdProject);

      // Only call onProjectCreate callback with the actual created project
      if (onProjectCreate) {
        onProjectCreate(createdProject);
      }

      onClose();
    } catch (err: any) {
      console.error("Project creation error:", err);

      if (err.message) {
        setError(`Error: ${err.message}`);
      } else if (err.toString().includes("Unauthorized")) {
        setError("Authentication failed. Please try signing out and back in.");
      } else if (err.toString().includes("NetworkError")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Failed to create project. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="bg-black/50 min-h-full">
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-background rounded-2xl shadow-xl border border-border w-full max-w-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 rounded-t-2xl bg-background text-foreground border-b border-border">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold">create new project</h2>
                  <Zap className="w-5 h-5" />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg transition-colors duration-200 text-foreground hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Form fields */}
                <div className="space-y-4">
                  <div>
                    <FormInput
                      label="Project Name"
                      error={errors.name?.message}
                      required
                      {...register("name", {
                        required: "Project name is required",
                      })}
                      type="text"
                      placeholder="Enter project name"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Give your project a meaningful name
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2 mt-1">
                      Due Date
                    </label>
                    <div className="relative">
                      <input
                        {...register("dueDate")}
                        type="date"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Set or change the due date for your project
                    </p>
                    {errors.dueDate && (
                      <p className="text-sm text-destructive flex items-center space-x-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.dueDate.message}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2 mt-1">
                      Description
                    </label>
                    <textarea
                      {...register("description")}
                      rows={3}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                      placeholder="Describe your project to help ai understand your needs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Add or modify the project description
                    </p>
                    {errors.description && (
                      <p className="text-sm text-destructive flex items-center space-x-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.description.message}</span>
                      </p>
                    )}
                  </div>

                  {showWorkspaceSelector && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-2 mt-1">
                        Workspace (optional)
                      </label>
                      <select
                        value={selectedWorkspace || ""}
                        onChange={(e) =>
                          setSelectedWorkspace(e.target.value || null)
                        }
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                      >
                        <option value="">None (Personal Project)</option>
                        {workspaces.map((workspace) => (
                          <option key={workspace.id} value={workspace.id}>
                            {workspace.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select a workspace to organize your project with your
                        team
                      </p>
                    </div>
                  )}
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-destructive">{error}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-6 border-t border-border">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors duration-200"
                  >
                    Cancel
                  </button>

                  <Button
                    type="submit"
                    loading={isLoading}
                    disabled={!isValid || isLoading || !watchedFields.name}
                  >
                    {isLoading ? "Creating..." : "Create project"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
