// AI Action Service
// Main service that coordinates intent parsing and action execution

import { AIIntentParser } from "./aiIntentParser";
import { AIActionExecutor } from "./aiActionExecutor";
import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";
import { randomUUID } from "crypto";
import {
  ParsedIntent,
  AIActionContext,
  ActionResult,
  ACTION_DEFINITIONS,
} from "./aiActionTypes";

export interface AIActionRequest {
  message: string;
  userId: string;
  sessionId?: string;
  pageContext?: string;
  pageDescription?: string;
  pageRoute?: string;
  pageSection?: string;
  entityId?: string;
  currentWorkspaceId?: string;
  currentProjectId?: string;
  userPreferences?: Record<string, any>;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  autoConfirm?: boolean; // Skip confirmation for this request
}

export interface AIActionResponse {
  type: "action" | "chat" | "confirmation_required" | "error";
  message: string;
  actionType?: string;
  actionId?: string;
  result?: ActionResult;
  data?: any;
  requiresConfirmation?: boolean;
  suggestedActions?: string[];
}

export class AIActionService {
  /**
   * Process a user message and execute the appropriate action
   */
  static async processMessage(
    request: AIActionRequest,
  ): Promise<AIActionResponse> {
    try {
      const context: AIActionContext = {
        userId: request.userId,
        sessionId: request.sessionId,
        pageContext: request.pageContext,
        pageDescription: request.pageDescription,
        pageRoute: request.pageRoute,
        pageSection: request.pageSection,
        entityId: request.entityId,
        currentWorkspaceId: request.currentWorkspaceId,
        currentProjectId: request.currentProjectId,
        userPreferences: request.userPreferences,
      };

      // Step 1: Parse the intent
      const intent = await AIIntentParser.parseIntent(
        request.message,
        context,
        request.conversationHistory || [],
      );

      // Step 2: If no intent detected OR intent is "chat" (general conversation), treat as general chat
      if (!intent || intent.actionType === "chat" || AIIntentParser.isGeneralChat(request.message)) {
        return this.handleGeneralChat(request, context);
      }

      // Step 3: Resolve entity references
      const resolvedIntent = await AIIntentParser.resolveEntityReferences(
        intent,
        context,
        prisma,
      );

      // Step 4: Execute the action
      const result = await AIActionExecutor.executeAction(
        resolvedIntent,
        context,
        request.autoConfirm || false,
      );

      // Step 5: Build response based on result
      if (result.data?.requiresConfirmation) {
        return {
          type: "confirmation_required",
          message: result.message,
          actionType: resolvedIntent.actionType,
          actionId: result.data.actionId,
          requiresConfirmation: true,
          data: {
            actionId: result.data.actionId,
            intent: resolvedIntent,
            confirmationMessage:
              AIIntentParser.buildActionConfirmationMessage(resolvedIntent),
          },
        };
      }

      // Step 6: Create a natural language response
      const responseMessage = await this.buildActionResponse(
        result,
        resolvedIntent,
        request,
      );

      return {
        type: result.success ? "action" : "error",
        message: responseMessage,
        actionType: resolvedIntent.actionType,
        result,
        data: result.data,
        suggestedActions: this.suggestNextActions(resolvedIntent, result),
      };
    } catch (error: any) {
      logger.error("AI Action Service error:", error);
      return {
        type: "error",
        message: `I encountered an error: ${error.message}. Please try again or rephrase your request.`,
      };
    }
  }

  /**
   * Confirm a pending action
   */
  static async confirmAction(
    actionId: string,
    userId: string,
  ): Promise<AIActionResponse> {
    try {
      const result = await AIActionExecutor.confirmAndExecute(actionId, userId);

      return {
        type: result.success ? "action" : "error",
        message: result.message,
        actionId,
        result,
        data: result.data,
      };
    } catch (error: any) {
      logger.error("Confirm action error:", error);
      return {
        type: "error",
        message: `Failed to confirm action: ${error.message}`,
        actionId,
      };
    }
  }

  /**
   * Cancel a pending action
   */
  static async cancelAction(actionId: string): Promise<AIActionResponse> {
    try {
      const result = await AIActionExecutor.cancelAction(actionId);
      return {
        type: "action",
        message: result.message,
        actionId,
      };
    } catch (error: any) {
      return {
        type: "error",
        message: `Failed to cancel: ${error.message}`,
        actionId,
      };
    }
  }

  /**
   * Handle general chat messages (non-action)
   */
  private static async handleGeneralChat(
    request: AIActionRequest,
    context: AIActionContext,
  ): Promise<AIActionResponse> {
    // Use AIService directly for general chat, not UnifiedAIService's document QA
    const { AIService } = await import("./aiService");

    try {
      const result = await AIService.processChatMessage({
        sessionId: request.sessionId || `chat-${Date.now()}`,
        userId: request.userId,
        content: request.message,
        model: undefined, // Use default model
      });

      return {
        type: "chat",
        message: result.content,
        data: {
          tokensUsed: 0,
          modelUsed: "gemini-2.5-flash",
        },
      };
    } catch (error: any) {
      logger.error("AI chat error:", error);
      return {
        type: "error",
        message: `I encountered an error processing your request: ${error.message || "Unknown error"}. Please try again or check your API configuration.`,
      };
    }
  }

  /**
   * Build a natural language response for an action result
   */
  private static async buildActionResponse(
    result: ActionResult,
    intent: ParsedIntent,
    request: AIActionRequest,
  ): Promise<string> {
    if (!result.success) {
      return result.message;
    }

    // For successful actions, the executor already provides a good message
    // We can enhance it with context
    let message = result.message;

    // Add context-aware follow-up suggestions
    const actionDef = ACTION_DEFINITIONS[intent.actionType];
    if (actionDef) {
      // Add data summary for list actions
      if (intent.actionType.startsWith("list_") && result.data) {
        const count =
          result.data.count ||
          result.data[Object.keys(result.data)[0]]?.length ||
          0;
        if (count === 0) {
          message +=
            "\n\nYou don't have any items yet. Would you like me to create one?";
        }
      }

      // Add project context if available
      if (result.data?.project && intent.actionType.includes("project")) {
        message += `\n\nThe project is now ready for you to work on.`;
      }

      // Add task completion celebration
      if (intent.actionType === "complete_task") {
        message += " 🎉 Great job!";
      }
    }

    return message;
  }

  /**
   * Suggest next actions based on what was just done
   */
  private static suggestNextActions(
    intent: ParsedIntent,
    result: ActionResult,
  ): string[] {
    const suggestions: string[] = [];

    const suggestionMap: Record<string, string[]> = {
      create_workspace: [
        "Invite members to this workspace",
        "Create a project in this workspace",
        "Show me my workspaces",
      ],
      create_project: [
        "Open the project in editor",
        "Create tasks for this project",
        "Show me my projects",
      ],
      create_task: [
        "Create another task",
        "Show all tasks in this workspace",
        "Mark this task complete when done",
      ],
      complete_task: [
        "Create a new task",
        "Show my remaining tasks",
        "Archive completed tasks",
      ],
      list_projects: [
        "Create a new project",
        "Open a project",
        "Show my workspaces",
      ],
      list_workspaces: [
        "Create a new workspace",
        "Show projects in a workspace",
        "Invite someone to a workspace",
      ],
      open_project: [
        "Edit the document",
        "Create tasks for this project",
        "Summarize the document",
      ],
    };

    const specific = suggestionMap[intent.actionType];
    if (specific) {
      suggestions.push(...specific);
    }

    // Add general suggestions
    if (suggestions.length < 3) {
      suggestions.push("What else can you do?", "Show my dashboard");
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Get pending actions for a user
   */
  static async getPendingActions(userId: string) {
    return await AIActionExecutor.getPendingActions(userId);
  }

  /**
   * Get action history for a user
   */
  static async getActionHistory(userId: string, limit?: number) {
    return await AIActionExecutor.getActionHistory(userId, limit);
  }

  /**
   * Get available action types (for documentation/help)
   */
  static getAvailableActions() {
    return Object.entries(ACTION_DEFINITIONS).map(([type, def]) => ({
      type,
      category: def.category,
      description: def.description,
      requiresConfirmation: def.requiresConfirmation,
      parameters: def.parameters,
    }));
  }
}

export default AIActionService;
