import { supabase } from "../supabase/client";

// API base URL - adjust this to match your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class AIService {
  // Get authentication token with better error handling
  static async getAuthToken() {
    try {
      console.log("=== Getting Auth Token ===");

      // First, try to get the session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError);
        return null;
      }

      console.log("Session data:", JSON.stringify(sessionData, null, 2));

      if (!sessionData.session) {
        console.warn("No active session found");
        // Try to get user directly as a fallback
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        console.log("User data fallback:", { userData, userError });
        if (userData?.user?.id) {
          console.log(
            "User authenticated but no session, creating temporary token",
          );
          // Create a temporary token using the user ID and current timestamp
          // This is a more robust fallback for edge cases
          const tempToken = btoa(
            JSON.stringify({
              sub: userData.user.id,
              exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
              iat: Math.floor(Date.now() / 1000),
            }),
          );
          return tempToken;
        }
        return null;
      }

      // Validate that we have an access token
      if (!sessionData.session.access_token) {
        console.error("Session exists but missing access token");
        return null;
      }

      // Check if token is about to expire (within 5 minutes)
      const expirationTime = new Date(sessionData.session.expires_at * 1000);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      console.log("Token expiration check:", {
        expiresAt: sessionData.session.expires_at,
        expirationTime: expirationTime.toISOString(),
        now: now.toISOString(),
        fiveMinutesFromNow: fiveMinutesFromNow.toISOString(),
        isExpired: expirationTime < now,
        willExpireSoon: expirationTime < fiveMinutesFromNow,
      });

      if (expirationTime < fiveMinutesFromNow) {
        console.warn(
          "Token is about to expire or already expired, attempting to refresh",
        );
        // Try to refresh the session
        const { data: refreshedData, error: refreshError } =
          await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("Failed to refresh session:", refreshError);
          return null;
        }
        console.log(
          "Refreshed session data:",
          JSON.stringify(refreshedData, null, 2),
        );
        if (!refreshedData.session?.access_token) {
          console.error("Refreshed session missing access token");
          return null;
        }
        return refreshedData.session?.access_token;
      }

      console.log("Using existing token");
      return sessionData.session.access_token;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }

  // Process AI request
  /**
   * Process AI request
   * @param {string} action
   * @param {string} text
   * @param {string | null} [context=null]
   * @param {object} [preferences={}]
   * @param {boolean} [isAutomatic=false]
   */
  static async processAIRequest(
    action,
    text,
    context = null,
    preferences = {},
    isAutomatic = false,
  ) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/process`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          text,
          context,
          preferences,
          isAutomatic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("AI_LIMIT_REACHED");
        }
        throw new Error(data.message || "Failed to process AI request");
      }

      return data.result;
    } catch (error) {
      console.error("Error processing AI request:", error);
      throw error;
    }
  }

  // Grammar and style checking
  static async checkGrammar(text, model = "gemini-2.5-flash") {
    try {
      console.log("=== Starting Grammar Check ===");
      const token = await this.getAuthToken();
      console.log(
        "AIService: Token retrieved for grammar check:",
        token ? `${token.substring(0, 10)}...` : "NONE",
      );

      if (!token) {
        console.error("AIService: No authentication token available");
        throw new Error("Not authenticated - no valid token available");
      }

      // Validate input
      if (!text || text.trim().length === 0) {
        throw new Error("Text content is empty");
      }

      // Updated to use the correct endpoint
      const apiUrl = `${API_BASE_URL}/api/ai/grammar`;
      console.log("AIService: Making request to:", apiUrl);
      console.log("AIService: Request headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.substring(0, 10)}...`,
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model,
        }),
      });

      console.log("AIService: Grammar check response status:", response.status);
      console.log("AIService: Grammar check response headers:", [
        ...response.headers.entries(),
      ]);

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "AIService: Grammar check error response text:",
          errorText,
        );

        // Handle 404 errors specifically
        if (response.status === 404) {
          throw new Error(
            "Grammar checking service is not available. Please contact support.",
          );
        }

        throw new Error(
          `Grammar check failed with status ${response.status}: ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("AIService: Grammar check response data:", data);

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to check grammar (${response.status})`,
        );
      }

      console.log("AIService: Successfully checked grammar");
      return data;
    } catch (error) {
      console.error("Error checking grammar:", error);
      throw error;
    }
  }

  // Language check with structured JSON response
  static async checkLanguage(text) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/research/language-check`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to check language");
      }

      const data = await response.json();
      return data.suggestions;
    } catch (error) {
      console.error("Error in checkLanguage:", error);
      throw error;
    }
  }

  // Document summarization
  static async summarizeDocument(
    content,
    summaryType = "long_document",
    model = "gemini-2.5-flash",
  ) {
    try {
      const token = await this.getAuthToken();
      console.log(
        "AIService: Token retrieved for summarization:",
        token ? `${token.substring(0, 10)}...` : "NONE",
      );

      if (!token) {
        throw new Error("Not authenticated");
      }

      // Validate input
      if (!content || content.trim().length === 0) {
        throw new Error("Document content is empty");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/summarize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          summaryType,
          model,
        }),
      });

      console.log("AIService: Summarization response status:", response.status);

      const data = await response.json();
      console.log("AIService: Summarization response data:", data);

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to summarize document (${response.status})`,
        );
      }

      console.log("AIService: Successfully summarized document");
      return data;
    } catch (error) {
      console.error("Error summarizing document:", error);
      throw error;
    }
  }

  // Document Q&A
  static async askDocumentQuestion(
    documentContent,
    question,
    model = "gemini-2.5-flash",
  ) {
    try {
      const token = await this.getAuthToken();
      console.log(
        "AIService: Token retrieved for document Q&A:",
        token ? `${token.substring(0, 10)}...` : "NONE",
      );

      if (!token) {
        throw new Error("Not authenticated");
      }

      // Validate input
      if (!documentContent || documentContent.trim().length === 0) {
        throw new Error("Document content is empty");
      }

      if (!question || question.trim().length === 0) {
        throw new Error("Question is empty");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/document-qa`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentContent,
          question,
          model,
        }),
      });

      console.log("AIService: Document Q&A response status:", response.status);

      const data = await response.json();
      console.log("AIService: Document Q&A response data:", data);

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to answer question (${response.status})`,
        );
      }

      console.log("AIService: Successfully answered question");
      return data;
    } catch (error) {
      console.error("Error answering document question:", error);
      throw error;
    }
  }

  // Writing project assistance
  static async assistWithWritingProject(
    userRequest,
    projectDescription = "",
    action = "assist",
    projectType = "research_paper",
    researchTopic = "",
    model = "gemini-2.5-flash",
  ) {
    try {
      const token = await this.getAuthToken();
      console.log(
        "AIService: Token retrieved for writing project assistance:",
        token ? `${token.substring(0, 10)}...` : "NONE",
      );

      if (!token) {
        throw new Error("Not authenticated");
      }

      // Validate input
      if (!userRequest || userRequest.trim().length === 0) {
        throw new Error("User request is empty");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/writing-project`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userRequest,
          projectDescription,
          action,
          projectType,
          researchTopic,
          model,
        }),
      });

      console.log(
        "AIService: Writing project response status:",
        response.status,
      );

      const data = await response.json();
      console.log("AIService: Writing project response data:", data);

      if (!response.ok) {
        throw new Error(
          data.message ||
          `Failed to assist with writing project (${response.status})`,
        );
      }

      console.log("AIService: Successfully assisted with writing project");
      return data;
    } catch (error) {
      console.error("Error assisting with writing project:", error);
      throw error;
    }
  }

  // Get AI usage information
  static async getAIUsage() {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/usage`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch AI usage");
      }

      return data.usage;
    } catch (error) {
      console.error("Error fetching AI usage:", error);
      throw error;
    }
  }

  // Get AI usage history
  static async getAIUsageHistory() {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/usage/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch AI usage history");
      }

      return data.history;
    } catch (error) {
      console.error("Error fetching AI usage history:", error);
      throw error;
    }
  }

  // Get AI history with improved error handling and debugging
  static async getAIHistory() {
    try {
      console.log("=== Fetching AI History ===");
      const token = await this.getAuthToken();
      console.log(
        "Token retrieved:",
        token ? `Present, length: ${token.length}` : "Missing",
      );

      if (!token) {
        throw new Error("Not authenticated - no valid token available");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("AI History API Response:", {
        status: response.status,
        statusText: response.statusText,
        headers: [...response.headers.entries()],
      });

      // Log response headers for debugging
      console.log("Response headers:");
      response.headers.forEach((value, name) => {
        console.log(`  ${name}: ${value}`);
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("AI History API Error:", {
          status: response.status,
          statusText: response.statusText,
          data: data,
        });

        if (response.status === 401) {
          throw new Error("Authentication failed - please log in again");
        }

        throw new Error(
          data.message || `Failed to fetch AI history (${response.status})`,
        );
      }

      return data.history;
    } catch (error) {
      console.error("Error fetching AI history:", error);
      throw error;
    }
  }

  // Update favorite status of AI history item
  static async updateAIHistoryFavorite(itemId, isFavorite) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/history/favorite`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          isFavorite,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update favorite status");
      }

      return data;
    } catch (error) {
      console.error("Error updating favorite status:", error);
      throw error;
    }
  }

  // Delete AI history item
  static async deleteAIHistoryItem(itemId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/history`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete history item");
      }

      return data;
    } catch (error) {
      console.error("Error deleting history item:", error);
      throw error;
    }
  }

  // AI Chat Methods

  // Create a new chat session
  static async createChatSession(projectId, title) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/chat/session`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          title,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create chat session");
      }

      return data.session;
    } catch (error) {
      console.error("Error creating chat session:", error);
      throw error;
    }
  }

  // Get chat sessions
  static async getChatSessions(projectId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const url = new URL(`${API_BASE_URL}/api/ai/chat/sessions`);
      if (projectId) {
        url.searchParams.append("projectId", projectId);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch chat sessions");
      }

      return data.sessions;
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      throw error;
    }
  }

  // Get chat messages for a session
  static async getChatMessages(sessionId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/ai/chat/session/${sessionId}/messages`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch chat messages");
      }

      return data.messages;
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      throw error;
    }
  }

  // Send a chat message
  static async sendChatMessage(messageData) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Log message data for debugging
      console.log("Sending chat message with data:", messageData);

      const response = await fetch(`${API_BASE_URL}/api/ai/chat/message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("AI_LIMIT_REACHED");
        }
        throw new Error(data.message || "Failed to send chat message");
      }

      return data;
    } catch (error) {
      console.error("Error sending chat message:", error);
      throw error;
    }
  }

  // Send a chat message with streaming support
  static async sendChatMessageStream(messageData, onToken, onDone, onError) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Log message data for debugging
      console.log("Sending streaming chat message with data:", messageData);

      const response = await fetch(
        `${API_BASE_URL}/api/ai/chat/message/stream`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messageData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error("AI_LIMIT_REACHED");
        }
        throw new Error(errorData.message || "Failed to send chat message");
      }

      // Process the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullResponse = "";
      let aiMessage = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.token) {
                fullResponse += data.token;
                if (onToken) onToken(data.token);
              } else if (data.done) {
                aiMessage = data.aiMessage;
                if (onDone) onDone(aiMessage);
              } else if (data.error) {
                if (onError) onError(new Error(data.error));
                return;
              }
            } catch (parseError) {
              console.error("Error parsing streaming data:", parseError);
            }
          }
        }
      }

      return { fullResponse, aiMessage };
    } catch (error) {
      console.error("Error sending streaming chat message:", error);
      if (onError) onError(error);
      throw error;
    }
  }

  // Update chat session
  static async updateChatSession(sessionId, updates) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/chat/session`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          ...updates,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update chat session");
      }

      return data.session;
    } catch (error) {
      console.error("Error updating chat session:", error);
      throw error;
    }
  }

  // Delete chat session
  static async deleteChatSession(sessionId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/chat/session`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete chat session");
      }

      return data;
    } catch (error) {
      console.error("Error deleting chat session:", error);
      throw error;
    }
  }

  // Get all chat history (sessions with message counts)
  static async getAllChatHistory() {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/ai/chat/sessions/history`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch chat history");
      }

      return data.sessions;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      throw error;
    }
  }

  // AI Image Methods

  // Analyze an image
  static async analyzeImage(imageFile) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch(`${API_BASE_URL}/api/ai/image/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("AI_LIMIT_REACHED");
        }
        throw new Error(data.message || "Failed to analyze image");
      }

      return data;
    } catch (error) {
      console.error("Error analyzing image:", error);
      throw error;
    }
  }

  // Generate an image from a text prompt
  static async generateImage(prompt, projectId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/image/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          projectId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("AI_LIMIT_REACHED");
        }
        throw new Error(data.message || "Failed to generate image");
      }

      return data.image;
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  }

  // Get generated images
  static async getGeneratedImages(projectId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const url = new URL(`${API_BASE_URL}/api/ai/image`);
      if (projectId) {
        url.searchParams.append("projectId", projectId);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch images");
      }

      return data.images;
    } catch (error) {
      console.error("Error fetching images:", error);
      throw error;
    }
  }

  // Delete a generated image
  static async deleteGeneratedImage(imageId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/image`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete image");
      }

      return data;
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  }

  // AI Search Methods

  // Perform a web search
  static async webSearch(query, maxResults = 10) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/search/web`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          maxResults,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("AI_LIMIT_REACHED");
        }
        throw new Error(data.message || "Failed to perform web search");
      }

      return data.results;
    } catch (error) {
      console.error("Error performing web search:", error);
      throw error;
    }
  }

  // Perform a deep search
  static async deepSearch(query, sources) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/search/deep`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          sources,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("AI_LIMIT_REACHED");
        }
        throw new Error(data.message || "Failed to perform deep search");
      }

      return data.results;
    } catch (error) {
      console.error("Error performing deep search:", error);
      throw error;
    }
  }

  // Analyze search results
  static async analyzeSearchResults(query, results) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/search/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          results,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to analyze search results");
      }

      return data.analysis;
    } catch (error) {
      console.error("Error analyzing search results:", error);
      throw error;
    }
  }

  // AI actions
  static async improveWriting(text, context = null, preferences = {}) {
    return this.processAIRequest("improve_writing", text, context, preferences);
  }

  static async fixGrammar(
    text,
    context = null,
    preferences = {},
    isAutomatic = false,
  ) {
    return this.processAIRequest(
      "fix_grammar",
      text,
      context,
      preferences,
      isAutomatic,
    );
  }

  static async simplifyText(
    text,
    context = null,
    preferences = {},
    isAutomatic = false,
  ) {
    return this.processAIRequest(
      "simplify",
      text,
      context,
      preferences,
      isAutomatic,
    );
  }

  static async expandText(
    text,
    context = null,
    preferences = {},
    isAutomatic = false,
  ) {
    return this.processAIRequest(
      "expand",
      text,
      context,
      preferences,
      isAutomatic,
    );
  }

  static async academicTone(
    text,
    context = null,
    preferences = {},
    isAutomatic = false,
  ) {
    return this.processAIRequest(
      "academic_tone",
      text,
      context,
      preferences,
      isAutomatic,
    );
  }

  static async paraphraseText(
    text,
    context = null,
    preferences = {},
    isAutomatic = false,
  ) {
    return this.processAIRequest(
      "paraphrase",
      text,
      context,
      preferences,
      isAutomatic,
    );
  }

  static async continueWriting(
    text,
    context = null,
    preferences = {},
    isAutomatic = false,
  ) {
    return this.processAIRequest(
      "continue_writing",
      text,
      context,
      preferences,
      isAutomatic,
    );
  }

  // New AI features
  static async generateOutline(
    text,
    context = null,
    preferences = {},
    isAutomatic = false,
  ) {
    return this.processAIRequest(
      "generate_outline",
      text,
      context,
      preferences,
      isAutomatic,
    );
  }

  static async suggestSources(
    text,
    context = null,
    preferences = {},
    isAutomatic = false,
  ) {
    return this.processAIRequest(
      "suggest_sources",
      text,
      context,
      preferences,
      isAutomatic,
    );
  }

  static async generateCitations(
    text,
    context = null,
    preferences = {},
    isAutomatic = false,
  ) {
    return this.processAIRequest(
      "generate_citations",
      text,
      context,
      preferences,
      isAutomatic,
    );
  }

  static async researchTopic(
    text,
    context = null,
    preferences = {},
    isAutomatic = false,
  ) {
    return this.processAIRequest(
      "research_topic",
      text,
      context,
      preferences,
      isAutomatic,
    );
  }

  static async compareArguments(
    text,
    context = null,
    preferences = {},
    isAutomatic = false,
  ) {
    return this.processAIRequest(
      "compare_arguments",
      text,
      context,
      preferences,
      isAutomatic,
    );
  }

  // Defensibility/Claim Check
  /**
   * Check defensibility of a claim
   * @param {string} text
   * @param {string | null} [context=null]
   * @param {object} [preferences={}]
   * @param {boolean} [isAutomatic=false]
   */
  static async checkDefensibility(
    text,
    context = null,
    preferences = {},
    isAutomatic = false,
  ) {
    return this.processAIRequest(
      "defensibility_check",
      text,
      context,
      preferences,
      isAutomatic,
    );
  }

  // Get available AI models for the user
  static async getAvailableModels() {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/available-models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch available models");
      }

      return data;
    } catch (error) {
      console.error("Error fetching available models:", error);
      throw error;
    }
  }

  // Update user's preferred AI model
  static async updatePreferredModel(model) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/preferred-model`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update preferred model");
      }

      return data;
    } catch (error) {
      console.error("Error updating preferred model:", error);
      throw error;
    }
  }

  // Update user's AI preferences (all settings)
  static async updateAIPreferences(preferences) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferences }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update AI preferences");
      }

      return data;
    } catch (error) {
      console.error("Error updating AI preferences:", error);
      throw error;
    }
  }

  // Get user's AI preferences
  static async getAIPreferences() {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/preferences`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch AI preferences");
      }

      return data.preferences;
    } catch (error) {
      console.error("Error fetching AI preferences:", error);
      throw error;
    }
  }

  // Method to load AI settings (now from backend)
  static async loadAISettings() {
    try {
      return await this.getAIPreferences();
    } catch (error) {
      console.error("Error loading AI settings:", error);
      return null;
    }
  }

  // Method to save AI parameters (now to backend)
  static async updateAIParameters(params) {
    try {
      // Get current settings first
      const currentSettings = (await this.loadAISettings()) || {};
      const newSettings = { ...currentSettings, ...params };
      return await this.updateAIPreferences(newSettings);
    } catch (error) {
      console.error("Error updating AI parameters:", error);
      throw error;
    }
  }

  // Method to save privacy settings (now to backend)
  static async updatePrivacySettings(settings) {
    try {
      // Get current settings first
      const currentSettings = (await this.loadAISettings()) || {};
      const newSettings = { ...currentSettings, ...settings };
      return await this.updateAIPreferences(newSettings);
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      throw error;
    }
  }

  // Method to save behavior settings (now to backend)
  static async updateBehaviorSettings(settings) {
    try {
      // Get current settings first
      const currentSettings = (await this.loadAISettings()) || {};
      const newSettings = { ...currentSettings, ...settings };
      return await this.updateAIPreferences(newSettings);
    } catch (error) {
      console.error("Error updating behavior settings:", error);
      throw error;
    }
  }

  // AI Analytics Methods

  // Get AI analytics data
  static async getAIAnalytics() {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/analytics`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch AI analytics");
      }

      return data.data;
    } catch (error) {
      console.error("Error fetching AI analytics:", error);
      throw error;
    }
  }

  // Get AI performance metrics
  static async getPerformanceMetrics(days = 30) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/ai/analytics/performance?days=${days}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch performance metrics");
      }

      return data.data;
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      throw error;
    }
  }

  // Get AI cost tracking data
  static async getCostTracking(days = 30) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/ai/analytics/costs?days=${days}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch cost tracking data");
      }

      return data.data;
    } catch (error) {
      console.error("Error fetching cost tracking data:", error);
      throw error;
    }
  }

  // Get AI cost analysis
  static async getCostAnalysis(days = 30) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/ai/analytics/cost-analysis?days=${days}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch cost analysis");
      }

      return data.data;
    } catch (error) {
      console.error("Error fetching cost analysis:", error);
      throw error;
    }
  }

  // Get AI cost prediction
  static async getCostPrediction(days = 30) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/ai/analytics/cost-prediction?days=${days}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch cost prediction");
      }

      return data.data;
    } catch (error) {
      console.error("Error fetching cost prediction:", error);
      throw error;
    }
  }

  // Get cost efficiency recommendations
  static async getCostRecommendations() {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/ai/analytics/cost-recommendations`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch cost recommendations");
      }

      return data.data;
    } catch (error) {
      console.error("Error fetching cost recommendations:", error);
      throw error;
    }
  }

  // Reset AI analytics data (for testing)
  static async resetAIAnalytics() {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/analytics`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset AI analytics");
      }

      return data;
    } catch (error) {
      console.error("Error resetting AI analytics:", error);
      throw error;
    }
  }

  // Test authentication function
  static async testAuth() {
    try {
      console.log("=== Testing Authentication ===");

      // Get session directly
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      console.log("Direct session data:", sessionData);
      console.log("Direct session error:", sessionError);

      if (sessionError) {
        console.error("Session error:", sessionError);
        return { success: false, error: sessionError.message };
      }

      if (!sessionData.session) {
        console.log("No session found");
        return { success: false, error: "No active session" };
      }

      console.log(
        "Session access token:",
        sessionData.session.access_token ? "Present" : "Missing",
      );
      console.log("Session expires at:", sessionData.session.expires_at);

      // Test making a request with the token
      const response = await fetch(`${API_BASE_URL}/api/test-auth-ai`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Test Auth API Response:", {
        status: response.status,
        statusText: response.statusText,
      });

      const data = await response.json();
      return { success: response.ok, data, status: response.status };
    } catch (error) {
      console.error("Test auth error:", error);
      return { success: false, error: error.message };
    }
  }

  // Comprehensive authentication test
  static async testAuthComprehensive() {
    try {
      console.log("=== Comprehensive Auth Test ===");

      // 1. Get session directly
      console.log("1. Getting session directly...");
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      console.log("Session data:", JSON.stringify(sessionData, null, 2));
      console.log("Session error:", sessionError);

      if (sessionError) {
        console.error("Session error:", sessionError);
        return { success: false, error: sessionError.message };
      }

      if (!sessionData.session) {
        console.log("No session found");
        return { success: false, error: "No active session" };
      }

      // 2. Check token expiration
      console.log("2. Checking token expiration...");
      const expirationTime = new Date(sessionData.session.expires_at * 1000);
      const now = new Date();
      console.log("Token expiration:", {
        expiresAt: sessionData.session.expires_at,
        expirationTime: expirationTime.toISOString(),
        now: now.toISOString(),
        isExpired: expirationTime < now,
      });

      // 3. Test making a direct request with the token
      console.log("3. Testing direct API request...");
      const token = sessionData.session.access_token;
      console.log(
        "Using token:",
        token ? `Present, length: ${token.length}` : "Missing",
      );

      const response = await fetch(`${API_BASE_URL}/api/test-auth-ai`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Test Auth API Response:", {
        status: response.status,
        statusText: response.statusText,
      });

      const responseData = await response.json();
      console.log("Response data:", JSON.stringify(responseData, null, 2));

      // 4. Test making a direct request to the AI history endpoint
      console.log("4. Testing AI history API request...");
      const historyResponse = await fetch(`${API_BASE_URL}/api/ai/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("AI History API Response:", {
        status: historyResponse.status,
        statusText: historyResponse.statusText,
      });

      const historyData = await historyResponse.json();
      console.log(
        "History response data:",
        JSON.stringify(historyData, null, 2),
      );

      return {
        success: true,
        data: { sessionData, responseData, historyData },
      };
    } catch (error) {
      console.error("Test auth error:", error);
      return { success: false, error: error.message };
    }
  }

  // AI Autocomplete suggestion
  static async getAutocompleteSuggestion(
    textBeforeCursor,
    context = null,
    isAutomatic = true,
  ) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Validate input
      if (!textBeforeCursor || textBeforeCursor.trim().length === 0) {
        return "";
      }

      // Limit the text sent to the AI to prevent performance issues
      const maxLength = 1000;
      const trimmedText = textBeforeCursor.slice(-maxLength);

      const response = await fetch(`${API_BASE_URL}/api/ai/autocomplete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: trimmedText,
          context,
          isAutomatic,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("AI_LIMIT_REACHED");
        }
        throw new Error(
          `Failed to get autocomplete suggestion (${response.status})`,
        );
      }

      const data = await response.json();
      return data.suggestion || "";
    } catch (error) {
      console.error("Error getting autocomplete suggestion:", error);
      // Don't throw the error to avoid disrupting the user's writing flow
      return "";
    }
  }
}

export default AIService;
