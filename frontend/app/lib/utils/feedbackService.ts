import { apiClient } from "./apiClient";
// import { getAuthToken } from "./auth";

interface UserFeedback {
  id: string;
  user_id: string | null;
  type: string;
  category: string | null;
  priority: string;
  title: string;
  description: string;
  status: string;
  attachment_urls: string[];
  browser_info: string | null;
  os_info: string | null;
  screen_size: string | null;
  user_plan: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface FeedbackComment {
  id: string;
  feedback_id: string;
  user_id: string | null;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

class FeedbackService {
  // Create a new feedback item
  async createFeedback(feedbackData: {
    type: string;
    category?: string;
    priority?: string;
    title: string;
    description: string;
    attachment_urls?: string[];
    browser_info?: string;
    os_info?: string;
    screen_size?: string;
    user_plan?: string;
  }): Promise<UserFeedback> {
    // For feature requests, use the public endpoint to allow anonymous submissions
    if (feedbackData.type === "feature_request") {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/feedback/public`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(feedbackData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to submit feature request"
        );
      }

      const result = await response.json();
      return result.feedback;
    } else {
      // For other feedback types, use the authenticated endpoint
      const response = await apiClient.post("/api/feedback", feedbackData);
      return response.feedback;
    }
  }

  // Get feedback items for the current user
  async getUserFeedback(): Promise<UserFeedback[]> {
    const response = await apiClient.get("/api/feedback/my");
    return response.feedback;
  }

  // Get a specific feedback item by ID
  async getFeedbackById(id: string): Promise<UserFeedback> {
    const response = await apiClient.get(`/api/feedback/${id}`);
    return response.feedback;
  }

  // Add a comment to feedback
  async addFeedbackComment(
    feedbackId: string,
    commentData: {
      content: string;
      is_internal?: boolean;
    }
  ): Promise<FeedbackComment> {
    const response = await apiClient.post(
      `/api/feedback/${feedbackId}/comments`,
      commentData
    );
    return response.comment;
  }

  // Get comments for a feedback item
  async getFeedbackComments(feedbackId: string): Promise<FeedbackComment[]> {
    const response = await apiClient.get(
      `/api/feedback/${feedbackId}/comments`
    );
    return response.comments;
  }

  // Get feedback statistics
  async getFeedbackStats(): Promise<any> {
    const response = await apiClient.get("/api/feedback/stats/summary");
    return response.stats;
  }
}

const feedbackService = new FeedbackService();
export default feedbackService;
