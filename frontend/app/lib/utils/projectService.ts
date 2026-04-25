import apiClient from "./apiClient";

export class ProjectService {
  // Get a specific project by ID
  static async getProjectById(projectId: string, userId?: string) {
    try {
      const url = userId
        ? `/api/projects/${projectId}?userId=${userId}`
        : `/api/projects/${projectId}`;

      const response = await apiClient.get(url);
      return response.project || response;
    } catch (error) {
      console.error("Error fetching project:", error);
      throw error;
    }
  }

  // Create a new project
  static async createProject(projectData: any) {
    try {
      const response = await apiClient.post("/api/projects", projectData);
      return response.project || response;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  // Update a project
  static async updateProject(projectId: string, updateData: Partial<any>) {
    try {
      const response = await apiClient.put(
        `/api/projects/${projectId}`,
        updateData
      );
      return response.project || response;
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }

  // Delete a project
  static async deleteProject(projectId: string) {
    try {
      const response = await apiClient.delete(`/api/projects/${projectId}`, {});
      return response;
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  }

  // Get all projects for a user
  static async getUserProjects(userId: string, archived: boolean = false) {
    try {
      const queryParams = new URLSearchParams({ userId });
      if (archived) {
        queryParams.append("archived", "true");
      }

      const response = await apiClient.get(
        `/api/projects?${queryParams.toString()}`
      );
      return response.projects || response;
    } catch (error) {
      console.error("Error fetching user projects:", error);
      throw error;
    }
  }

  // Get all projects for a user in a specific workspace
  static async getUserProjectsInWorkspace(
    userId: string,
    workspaceId: string,
    archived: boolean = false
  ) {
    try {
      const queryParams = new URLSearchParams({ userId });
      queryParams.append("workspaceId", workspaceId);
      if (archived) {
        queryParams.append("archived", "true");
      }

      const response = await apiClient.get(
        `/api/projects?${queryParams.toString()}`
      );
      return response.projects || response;
    } catch (error) {
      console.error("Error fetching user projects in workspace:", error);
      throw error;
    }
  }

  // Get all projects for a user that are not in any workspace (personal projects)
  static async getUserPersonalProjects(
    userId: string,
    archived: boolean = false
  ) {
    try {
      const queryParams = new URLSearchParams({ userId });
      queryParams.append("workspaceId", "null"); // null indicates personal projects
      if (archived) {
        queryParams.append("archived", "true");
      }

      const response = await apiClient.get(
        `/api/projects?${queryParams.toString()}`
      );
      return response.projects || response;
    } catch (error) {
      console.error("Error fetching user personal projects:", error);
      throw error;
    }
  }

  // Get document versions for a project
  static async getDocumentVersions(projectId: string) {
    try {
      const response = await apiClient.get(
        `/api/projects/${projectId}/document-versions`
      );
      return response.versions || response;
    } catch (error) {
      console.error("Error fetching document versions:", error);
      throw error;
    }
  }

  // Create a document version
  static async createDocumentVersion(
    projectId: string,
    content: any,
    wordCount: number
  ) {
    try {
      const response = await apiClient.post(
        `/api/projects/${projectId}/create-version`,
        {
          content,
          wordCount,
        }
      );
      return response.version || response;
    } catch (error) {
      console.error("Error creating document version:", error);
      throw error;
    }
  }

  // Get a specific document version - currently not supported by backend
  static async getDocumentVersion(projectId: string, versionId: string) {
    try {
      // Get all versions and find the specific one
      const allVersions = await this.getDocumentVersions(projectId);
      const specificVersion = allVersions.find((v: any) => v.id === versionId);

      if (!specificVersion) {
        throw new Error(`Version with ID ${versionId} not found`);
      }

      return specificVersion;
    } catch (error) {
      console.error("Error fetching document version:", error);
      throw error;
    }
  }

  // Get version schedules for a project
  static async getVersionSchedules(projectId: string) {
    try {
      const response = await apiClient.get(
        `/api/projects/${projectId}/version-schedules`
      );
      return response.schedules || response;
    } catch (error) {
      console.error("Error fetching version schedules:", error);
      throw error;
    }
  }

  // Create a version schedule
  static async createVersionSchedule(
    projectId: string,
    scheduleData: { frequency: string }
  ) {
    try {
      const response = await apiClient.post(
        `/api/projects/${projectId}/version-schedules`,
        scheduleData
      );
      return response.schedule || response;
    } catch (error) {
      console.error("Error creating version schedule:", error);
      throw error;
    }
  }

  // Update a version schedule
  static async updateVersionSchedule(
    projectId: string,
    scheduleId: string,
    updateData: { enabled?: boolean; frequency?: string }
  ) {
    try {
      const response = await apiClient.put(
        `/api/projects/${projectId}/version-schedules/${scheduleId}`,
        updateData
      );
      return response.schedule || response;
    } catch (error) {
      console.error("Error updating version schedule:", error);
      throw error;
    }
  }

  // Delete a version schedule
  static async deleteVersionSchedule(projectId: string, scheduleId: string) {
    try {
      const response = await apiClient.delete(
        `/api/projects/${projectId}/version-schedules/${scheduleId}`,
        {}
      );
      return response;
    } catch (error) {
      console.error("Error deleting version schedule:", error);
      throw error;
    }
  }

  // Get all projects for a user that are in a workspace (workspace projects)
  static async getUserWorkspaceProjects(
    userId: string,
    archived: boolean = false
  ) {
    try {
      const queryParams = new URLSearchParams({ userId });
      queryParams.append("workspaceId", "not-null"); // indicates projects that have a workspace

      if (archived) {
        queryParams.append("archived", "true");
      }

      const response = await apiClient.get(
        `/api/projects?${queryParams.toString()}`
      );
      return response.projects || response;
    } catch (error) {
      console.error("Error fetching user workspace projects:", error);
      throw error;
    }
  }
}

export default ProjectService;
