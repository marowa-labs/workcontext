import apiClient from "./apiClient";

export interface CollaborationLogEntry {
  id: string;
  sessionId: string;
  userId: string;
  eventType: string;
  targetSection: string | null;
  timestamp: string;
  metadata: any;
  user: { id: string; full_name: string | null; email: string };
}

export interface Comment {
  id: string;
  project_id: string;
  section_id: string | null;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  user: { id: string; full_name: string | null; email: string };
  replies?: Comment[];
}

const CollaborationService = {
  // ── Log ───────────────────────────────────────────────────────────────
  async logEvent(data: {
    sessionId: string;
    eventType: string;
    projectId: string;
    targetSection?: string;
    metadata?: any;
  }) {
    const res = await apiClient.post("/api/collaboration/log", data);
    return res;
  },

  async getLog(projectId: string, options?: { limit?: number; offset?: number }) {
    const params = new URLSearchParams({ projectId, ...options } as any);
    const res = await apiClient.get(`/api/collaboration/log?${params}`);
    return res;
  },

  // ── Comments ──────────────────────────────────────────────────────────
  async createComment(data: {
    projectId: string;
    content: string;
    sectionId?: string;
  }) {
    const res = await apiClient.post("/api/comments", data);
    return res;
  },

  async getComments(projectId: string, sectionId?: string) {
    const params = new URLSearchParams({ projectId });
    if (sectionId) params.set("sectionId", sectionId);
    const res = await apiClient.get(`/api/comments?${params}`);
    return res;
  },

  async addReply(commentId: string, content: string) {
    const res = await apiClient.post(`/api/comments/${commentId}/replies`, {
      content,
    });
    return res;
  },

  async updateComment(
    commentId: string,
    data: { content?: string; is_resolved?: boolean },
  ) {
    const res = await apiClient.patch(`/api/comments/${commentId}`, data);
    return res;
  },
};

export default CollaborationService;
