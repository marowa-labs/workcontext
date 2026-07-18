// AI Intent Parser Service
// Parses user messages to understand what action they want to perform

import { UnifiedAIService } from "./unifiedAIService";
import logger from "../monitoring/logger";
import {
  ParsedIntent,
  AIActionContext,
  ACTION_DEFINITIONS,
  INTENT_PATTERNS,
  ActionCategory,
  TargetEntity,
} from "./aiActionTypes";

export class AIIntentParser {
  /**
   * Parse user intent from a message
   */
  static async parseIntent(
    message: string,
    context: AIActionContext,
    conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [],
  ): Promise<ParsedIntent | null> {
    try {
      // First, try pattern matching for quick results
      const patternMatch = this.tryPatternMatching(message);
      if (patternMatch && patternMatch.confidence > 0.8) {
        logger.info("Intent matched via pattern", {
          actionType: patternMatch.actionType,
        });
        return patternMatch;
      }

      // If no high-confidence pattern match, use AI parsing
      const aiParsed = await this.parseWithAI(
        message,
        context,
        conversationHistory,
      );

      // Merge pattern results with AI if both exist
      if (patternMatch && aiParsed) {
        // Use pattern for action type if confidence is high, AI for parameters
        if (patternMatch.confidence > 0.6) {
          aiParsed.actionType = patternMatch.actionType;
          aiParsed.actionCategory = patternMatch.actionCategory;
          aiParsed.targetEntity = patternMatch.targetEntity;
        }
      }

      return aiParsed || patternMatch;
    } catch (error: any) {
      logger.error("Error parsing intent:", error);
      return null;
    }
  }

  /**
   * Try pattern matching for common intents
   */
  private static tryPatternMatching(message: string): ParsedIntent | null {
    for (const { pattern, actionType, extractParams } of INTENT_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const params = extractParams(match, message);
        const actionDef = ACTION_DEFINITIONS[actionType];

        if (actionDef) {
          return {
            actionType,
            actionCategory: actionDef.category as ActionCategory,
            targetEntity: actionDef.targetEntity as TargetEntity,
            parameters: params,
            confidence: 0.85,
            requiresConfirmation: actionDef.requiresConfirmation ?? true,
            suggestedResponse: `I'll ${actionType.replace(/_/g, " ")} for you.`,
          };
        }
      }
    }
    return null;
  }

  /**
   * Parse intent using AI
   */
  private static async parseWithAI(
    message: string,
    context: AIActionContext,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  ): Promise<ParsedIntent | null> {
    const systemPrompt = this.buildSystemPrompt(context);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory.slice(-5), // Last 5 messages for context
      { role: "user" as const, content: message },
    ];

    try {
      // Build a single prompt from the messages array for UnifiedAIService
      const prompt = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n\n");

      const response = await UnifiedAIService.processAIRequest({
        userId: context.userId,
        capability: "document_qa",
        content: prompt,
        options: { preferredModel: context.userPreferences?.preferredModel },
      });

      const parsed = this.extractJSONFromResponse(response.result);

      if (!parsed || !parsed.action_type) {
        return null;
      }

      const actionDef = ACTION_DEFINITIONS[parsed.action_type];

      // If action type doesn't exist in definitions, treat as general chat
      if (!actionDef) {
        logger.warn(
          `Unknown action type returned by AI: ${parsed.action_type}`,
        );
        return null;
      }

      return {
        actionType: parsed.action_type,
        actionCategory: (parsed.action_category ||
          actionDef.category ||
          "read") as ActionCategory,
        targetEntity: (parsed.target_entity ||
          actionDef.targetEntity ||
          "project") as TargetEntity,
        parameters: parsed.parameters || {},
        confidence: parsed.confidence || 0.7,
        requiresConfirmation: actionDef.requiresConfirmation ?? true,
        suggestedResponse:
          parsed.suggested_response || `I'll help you with that.`,
      };
    } catch (error: any) {
      logger.error("AI parsing error:", error);
      return null;
    }
  }

  /**
   * Build system prompt for intent parsing
   */
  private static buildSystemPrompt(context: AIActionContext): string {
    const actionDescriptions = Object.entries(ACTION_DEFINITIONS)
      .map(([type, def]) => {
        const params =
          def.parameters
            ?.map((p) => `${p.name}(${p.type}${p.required ? "" : "?"})`)
            .join(", ") || "none";
        return `- ${type}: ${def.description} [params: ${params}]`;
      })
      .join("\n");

    return `You are WorkContext - a helpful academic assistant. You can help with platform actions (creating workspaces, projects, tasks) AND engage in general conversation not always limited in this
    platform.

CURRENT CONTEXT:
- User ID: ${context.userId}
- Current Page: ${context.pageContext || "unknown"}
- Page Description: ${context.pageDescription || "unknown location"}
- Route: ${context.pageRoute || "unknown"}
- Section: ${context.pageSection || "main"}
- Entity ID: ${context.entityId || "none"}
- Current Workspace: ${context.currentWorkspaceId || "none"}
- Current Project: ${context.currentProjectId || "none"}

YOUR ROLE:
1. You can CREATE, READ, UPDATE, DELETE platform items - workspaces, projects, tasks, documents
2. You NAVIGATE users anywhere in the platform
3. You answer questions about ANYTHING - platform-related or general topics
4. You engage in casual conversation, brainstorming, and general discussion
5. Users interact with WorkContext THROUGH YOU

IMPORTANT - GENERAL CHAT IS WELCOME:
- If the user wants to chat casually, discuss ideas, ask general questions, or just talk — respond as "chat"
- If the user asks about topics unrelated to WorkContext (science, philosophy, advice, etc.) — respond as "chat"
- If the user says things like "let's chat", "just talking", "no specific task", "regular discussion" — respond as "chat"
- Only use action types when the user explicitly wants to CREATE, MODIFY, DELETE, or NAVIGATE to something
- When in doubt, prefer "chat" over forcing an action

AVAILABLE ACTIONS (only use when explicitly requested):
${actionDescriptions}

RESPONSE FORMAT - Return valid JSON:
{
  "action_type": "action type or 'chat' for general conversation",
  "action_category": "create|read|update|delete|manage|navigate",
  "target_entity": "workspace|project|task|user|member|label|view|document|notification|page",
  "parameters": { extracted parameters },
  "confidence": 0.0-1.0,
  "suggested_response": "Natural, conversational response"
}

INSTRUCTIONS:
1. If the message is a general question, casual chat, or discussion — set action_type to "chat"
2. Only use specific action types when the user clearly wants to perform that action
3. For "this", "current", "here" - use the context IDs provided above
4. Always respond conversationally like a helpful AI companion, not a robot
5. When answering about location, be specific and descriptive
6. It's OK to just chat! Not everything needs to be an action.

Respond ONLY with valid JSON.`;
  }

  /**
   * Extract JSON from AI response
   */
  private static extractJSONFromResponse(content: string): any {
    try {
      // Try to find JSON object in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // Try parsing the whole content
      return JSON.parse(content);
    } catch (error) {
      logger.error("Failed to parse JSON from response:", content);
      return null;
    }
  }

  /**
   * Enhance intent with entity resolution
   * This looks up entities by name if ID wasn't provided
   */
  static async resolveEntityReferences(
    intent: ParsedIntent,
    context: AIActionContext,
    prisma: any,
  ): Promise<ParsedIntent> {
    const enhanced = { ...intent };
    const params = { ...intent.parameters };

    // Resolve workspace by name
    if (params.workspaceName && !params.workspaceId) {
      const workspace = await prisma.workspace.findFirst({
        where: {
          name: { contains: params.workspaceName, mode: "insensitive" },
          OR: [
            { owner_id: context.userId },
            { members: { some: { user_id: context.userId } } },
          ],
        },
      });
      if (workspace) {
        params.workspaceId = workspace.id;
        params.resolvedWorkspaceName = workspace.name;
      }
    }

    // Resolve project by name
    if (params.projectName && !params.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          title: { contains: params.projectName, mode: "insensitive" },
          user_id: context.userId,
        },
      });
      if (project) {
        params.projectId = project.id;
        params.resolvedProjectTitle = project.title;
      }
    }

    // Use current context as fallback
    if (!params.workspaceId && context.currentWorkspaceId) {
      params.workspaceId = context.currentWorkspaceId;
    }
    if (!params.projectId && context.currentProjectId) {
      params.projectId = context.currentProjectId;
    }

    enhanced.parameters = params;
    return enhanced;
  }

  /**
   * Check if message is a general chat message (not an action)
   */
  static isGeneralChat(message: string): boolean {
    const trimmed = message.trim();
    const generalPatterns = [
      /^(hi|hello|hey|howdy|greetings)/i,
      /^(what|how|why|when|where|who|can you explain|can we|can i|could you|would you)/i,
      /^(thanks?|thank you)/i,
      /^(goodbye|bye|see you)/i,
      /\?$/,
      /(just chatting|just a chat|regular discussion|general chat|talk about|discuss with me|need your help|can we talk|can we chat|let.s talk|let.s chat)/i,
      /(not about|don.t need to create|don.t want to make|no project|no workspace|nothing specific|just wondering|just asking)/i,
    ];

    // If message is short and doesn't contain action keywords, treat as general chat
    const actionKeywords =
      /(create|delete|update|edit|add|remove|open|close|complete|assign|invite|archive|list|show|find|search|navigate|go to|make|build|start|launch|send|share|export|import|upload|download|rename|move|copy|merge|split|convert|transform|generate|write|draft|compose|submit|approve|reject|review|check|verify|validate|fix|repair|restore|reset|refresh|reload|revert|undo|redo|schedule|remind|notify|message|email|call|meet|join|leave|follow|unfollow|like|comment|rate|bookmark|tag|label|filter|sort|group|organize|manage|configure|setup|install|enable|disable|activate|deactivate|lock|unlock|publish|unpublish|hide|display|expand|collapse|minimize|maximize|zoom|scroll|click|select|deselect|drag|drop|resize|rotate|flip|undo|redo)/i;
    if (trimmed.length < 80 && !actionKeywords.test(trimmed)) {
      return true;
    }

    return generalPatterns.some((pattern) => pattern.test(trimmed));
  }

  /**
   * Build natural language response for an action
   */
  static buildActionConfirmationMessage(intent: ParsedIntent): string {
    const actionDef = ACTION_DEFINITIONS[intent.actionType];
    const entityName =
      intent.parameters.name ||
      intent.parameters.title ||
      intent.parameters.workspaceName ||
      intent.parameters.projectName ||
      "this item";

    const messages: Record<string, string> = {
      create_workspace: `I'll create a new workspace called "${entityName}".`,
      create_project: `I'll create a new project titled "${entityName}".`,
      create_task: `I'll create a task called "${entityName}".`,
      update_workspace: `I'll update the workspace "${entityName}".`,
      update_project: `I'll update the project "${entityName}".`,
      delete_workspace: `I'll delete the workspace "${entityName}". This action cannot be undone.`,
      delete_project: `I'll delete the project "${entityName}". This action cannot be undone.`,
      delete_task: `I'll delete the task "${entityName}".`,
      archive_project: `I'll archive the project "${entityName}".`,
      invite_workspace_member: `I'll invite ${intent.parameters.email} to the workspace.`,
      complete_task: `I'll mark the task "${entityName}" as complete.`,
      open_project: `I'll open the project "${entityName}" for you.`,
      navigate_to_page: `I'll take you to the ${intent.parameters.page} page.`,
      edit_document: `I'll help you edit the document based on your instructions.`,
      list_workspaces: `I'll show you all your workspaces.`,
      list_projects: `I'll show you all your projects.`,
      list_tasks: `I'll show you your tasks.`,
    };

    return (
      messages[intent.actionType] ||
      intent.suggestedResponse ||
      `I'll ${intent.actionType.replace(/_/g, " ")} for you.`
    );
  }
}

export default AIIntentParser;

