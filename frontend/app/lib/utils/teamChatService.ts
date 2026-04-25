import apiClient from "./apiClient";

export interface TeamChatMessage {
  id: string;
  workspace_id?: string;
  project_id?: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  };
  _count?: {
    replies: number;
  };
}

class TeamChatService {
  async getMessages(params: {
    workspaceId?: string;
    projectId?: string;
    parentId?: string;
  }) {
    const query = new URLSearchParams();
    if (params.workspaceId) query.append("workspaceId", params.workspaceId);
    if (params.projectId) query.append("projectId", params.projectId);
    if (params.parentId) query.append("parentId", params.parentId);

    const response = await apiClient.get(`/api/team-chat?${query.toString()}`);
    return response.messages as TeamChatMessage[];
  }

  async sendMessage(params: {
    content: string;
    workspaceId?: string;
    projectId?: string;
    parentId?: string;
  }) {
    const response = await apiClient.post("/api/team-chat", params);
    return response.message as TeamChatMessage;
  }

  async deleteMessage(messageId: string) {
    return await apiClient.delete(`/api/team-chat?id=${messageId}`, null);
  }
}

export default new TeamChatService();
