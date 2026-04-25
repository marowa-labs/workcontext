import { useState, useEffect } from "react";
import AIService from "../lib/utils/aiService";

export interface AIChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  role: "user" | "assistant";
  message_type: "text" | "image" | "file" | "suggestion";
  image_url?: string;
  file_url?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;

  // Research Co-Pilot fields
  citations?: any[]; // Array of citation objects
  sources?: any[]; // Array of paper sources
  confidence_score?: number; // AI confidence (0-1)
  mode?: "general" | "research" | "autocomplete"; // Chat mode
  context_used?: any; // Document context used
}

export interface AIChatSession {
  id: string;
  user_id: string;
  project_id?: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  is_active: boolean;
}

export const useAIChat = (projectId?: string) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [sessions, setSessions] = useState<AIChatSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions when component mounts
  useEffect(() => {
    fetchSessions();
  }, [projectId]);

  // Fetch messages when session changes
  useEffect(() => {
    if (sessionId) {
      fetchMessages(sessionId);
    }
  }, [sessionId]);

  // Fetch chat sessions
  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const fetchedSessions = await AIService.getChatSessions(projectId);
      setSessions(fetchedSessions);

      // If we have sessions and no current session, use the first one
      if (fetchedSessions.length > 0 && !sessionId) {
        setSessionId(fetchedSessions[0].id);
      }
    } catch (err: any) {
      setError("Failed to fetch chat sessions");
      console.error("Error fetching sessions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for a session
  const fetchMessages = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const fetchedMessages = await AIService.getChatMessages(sessionId);
      setMessages(fetchedMessages);
    } catch (err: any) {
      setError("Failed to fetch messages");
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new chat session
  const createSession = async (projectId?: string, title?: string) => {
    try {
      setIsLoading(true);
      const session = await AIService.createChatSession(projectId, title);
      setSessions((prev) => [session, ...prev]);
      setSessionId(session.id);
      setMessages([]);
      return session;
    } catch (err: any) {
      setError("Failed to create chat session");
      console.error("Error creating session:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (messageData: {
    sessionId: string;
    content: string;
    messageType?: string;
    imageUrl?: string;
    fileUrl?: string;
    metadata?: any;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      // Add user message to UI immediately
      const userMessage: AIChatMessage = {
        id: `temp-${Date.now()}`,
        session_id: messageData.sessionId,
        user_id: "", // Will be filled by backend
        content: messageData.content,
        role: "user",
        message_type:
          (messageData.messageType as
            | "text"
            | "image"
            | "file"
            | "suggestion") || "text",
        image_url: messageData.imageUrl,
        file_url: messageData.fileUrl,
        metadata: messageData.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Send message to backend
      const response = await AIService.sendChatMessage(messageData);

      // Update with actual messages from backend
      setMessages((prev) => {
        // Remove temporary message
        const filtered = prev.filter((msg) => msg.id !== userMessage.id);
        // Add actual messages
        return [...filtered, response.userMessage, response.aiMessage];
      });

      return response;
    } catch (err: any) {
      setError(err.message || "Failed to send message");
      console.error("Error sending message:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update session
  const updateSession = async (
    sessionId: string,
    updates: Partial<AIChatSession>,
  ) => {
    try {
      setIsLoading(true);
      const updatedSession = await AIService.updateChatSession(
        sessionId,
        updates,
      );

      // Update session in state
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? { ...session, ...updatedSession }
            : session,
        ),
      );

      return updatedSession;
    } catch (err: any) {
      setError("Failed to update session");
      console.error("Error updating session:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete session
  const deleteSession = async (sessionIdToDelete: string) => {
    try {
      setIsLoading(true);
      await AIService.deleteChatSession(sessionIdToDelete);

      // Remove session from state
      setSessions((prev) =>
        prev.filter((session) => session.id !== sessionIdToDelete),
      );

      // If we deleted the current session, clear it
      if (sessionIdToDelete === sessionId) {
        setSessionId(null);
        setMessages([]);
      }
    } catch (err: any) {
      setError("Failed to delete session");
      console.error("Error deleting session:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Insert content directly into editor
  const insertContentIntoEditor = async (
    content: string,
    position?: { start: number; end: number },
  ) => {
    try {
      // This function communicates with the editor component to insert content
      // at a specific position or at the current cursor position
      console.log("Inserting content into editor:", content, position);

      // Dispatch a custom event that the editor listens for
      // The editor component will handle the actual content insertion
      window.dispatchEvent(
        new CustomEvent("insert-ai-content", {
          detail: { content, position },
        }),
      );

      return true;
    } catch (err: any) {
      setError("Failed to insert content into editor");
      console.error("Error inserting content:", err);
      throw err;
    }
  };

  // Generate content and insert directly into editor
  const generateAndInsertContent = async (prompt: string, context?: any) => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate content using AI
      const generatedContent = await AIService.improveWriting(prompt, context);

      // Insert the generated content into the editor
      await insertContentIntoEditor(generatedContent.suggestion);

      return generatedContent;
    } catch (err: any) {
      setError(err.message || "Failed to generate and insert content");
      console.error("Error generating and inserting content:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    sessions,
    sessionId,
    isLoading,
    error,
    fetchSessions,
    fetchMessages,
    createSession,
    sendMessage,
    updateSession,
    deleteSession,
    insertContentIntoEditor,
    generateAndInsertContent,
  };
};
