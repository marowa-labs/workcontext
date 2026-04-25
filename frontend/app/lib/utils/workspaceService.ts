import { apiClient } from "./apiClient";

export interface WorkspaceMember {
  id: string;
  user_id: string;
  role: "admin" | "editor" | "viewer";
  joined_at: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  role?: string; // Current user's role
  members?: WorkspaceMember[];
  _count?: {
    projects: number;
    members: number;
  };
}

class WorkspaceService {
  /**
   * Get all workspaces for the current user
   */
  async getWorkspaces(): Promise<Workspace[]> {
    try {
      const response = await apiClient.get("/api/workspaces");
      return response;
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
      throw error;
    }
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(data: {
    name: string;
    description?: string;
    icon?: string;
  }): Promise<Workspace> {
    try {
      const response = await apiClient.post("/api/workspaces", data);
      return response;
    } catch (error) {
      console.error("Failed to create workspace:", error);
      throw error;
    }
  }

  /**
   * Get a specific workspace by ID
   */
  async getWorkspace(id: string): Promise<Workspace> {
    try {
      const response = await apiClient.get(`/api/workspaces/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch workspace ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update workspace name / description / icon
   */
  async updateWorkspace(
    id: string,
    data: { name?: string; description?: string; icon?: string },
  ): Promise<Workspace> {
    try {
      const response = await apiClient.patch(`/api/workspaces/${id}`, data);
      return response;
    } catch (error) {
      console.error("Failed to update workspace:", error);
      throw error;
    }
  }

  /**
   * Delete a workspace (owner only)
   */
  async deleteWorkspace(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/workspaces/${id}`, {
        params: {
          id,
        },
      });
    } catch (error) {
      console.error("Failed to delete workspace:", error);
      throw error;
    }
  }

  /**
   * Get full member list for a workspace
   */
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    try {
      const workspace = await this.getWorkspace(workspaceId);
      return workspace.members ?? [];
    } catch (error) {
      console.error("Failed to fetch workspace members:", error);
      throw error;
    }
  }

  /**
   * Invite a member to the workspace
   */
  async inviteMember(
    workspaceId: string,
    email: string,
    role: "admin" | "editor" | "viewer" = "viewer",
  ): Promise<WorkspaceMember> {
    try {
      const response = await apiClient.post(
        `/api/workspaces/${workspaceId}/invite`,
        {
          email,
          role,
        },
      );
      return response;
    } catch (error) {
      console.error("Failed to invite member:", error);
      throw error;
    }
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: "admin" | "editor" | "viewer",
  ): Promise<WorkspaceMember> {
    try {
      const response = await apiClient.patch(
        `/api/workspaces/${workspaceId}/members/${userId}`,
        { role },
      );
      return response;
    } catch (error) {
      console.error("Failed to update member role:", error);
      throw error;
    }
  }

  /**
   * Remove a member from the workspace
   */
  async removeMember(workspaceId: string, userId: string): Promise<void> {
    try {
      await apiClient.delete(
        `/api/workspaces/${workspaceId}/members/${userId}`,
        {
          params: {
            workspaceId,
            userId,
          },
        },
      );
    } catch (error) {
      console.error("Failed to remove member:", error);
      throw error;
    }
  }
}

export default new WorkspaceService();
