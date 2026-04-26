// AI Intent Parser Service
// Parses user messages to understand what action they want to perform

import { OpenAIService } from "./openaiService";
import { AnthropicService } from "./anthropicService";
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
  private static readonly PARSER_MODEL = "gpt-4o-mini";

  /**
   * Parse user intent from a message
   */
  static async parseIntent(
    message: string,
    context: AIActionContext,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
  ): Promise<ParsedIntent | null> {
    try {
      // First, try pattern matching for quick results
      const patternMatch = this.tryPatternMatching(message);
      if (patternMatch && patternMatch.confidence > 0.8) {
        logger.info("Intent matched via pattern", { actionType: patternMatch.actionType });
        return patternMatch;
      }

      // If no high-confidence pattern match, use AI parsing
      const aiParsed = await this.parseWithAI(message, context, conversationHistory);
      
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
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<ParsedIntent | null> {
    const systemPrompt = this.buildSystemPrompt(context);
    
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory.slice(-5), // Last 5 messages for context
      { role: "user" as const, content: message },
    ];

    try {
      const response = await OpenAIService.sendMessage(
        messages,
        this.PARSER_MODEL,
        1500,
        0.1 // Low temperature for consistent parsing
      );

      const parsed = this.extractJSONFromResponse(response.content);
      
      if (!parsed || !parsed.action_type) {
        return null;
      }

      const actionDef = ACTION_DEFINITIONS[parsed.action_type];

      return {
        actionType: parsed.action_type,
        actionCategory: (parsed.action_category || actionDef?.category || "read") as ActionCategory,
        targetEntity: (parsed.target_entity || actionDef?.targetEntity || "project") as TargetEntity,
        parameters: parsed.parameters || {},
        confidence: parsed.confidence || 0.7,
        requiresConfirmation: actionDef?.requiresConfirmation ?? true,
        suggestedResponse: parsed.suggested_response || `I'll help you with that.`,
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
        const params = def.parameters?.map(p => 
          `${p.name}(${p.type}${p.required ? '' : '?'})`
        ).join(', ') || 'none';
        return `- ${type}: ${def.description} [params: ${params}]`;
      })
      .join('\n');

    return `You are an AI intent parser for ScholarForge AI, an academic writing and project management platform.

Your task is to analyze user messages and extract what action they want to perform.

CURRENT CONTEXT:
- User ID: ${context.userId}
- Page: ${context.pageContext || 'unknown'}
- Current Workspace: ${context.currentWorkspaceId || 'none'}
- Current Project: ${context.currentProjectId || 'none'}

AVAILABLE ACTIONS:
${actionDescriptions}

INSTRUCTIONS:
1. Analyze the user's message to determine their intent
2. Extract relevant parameters from the message
3. Return a JSON response with this structure:
{
  "action_type": "one of the available action types",
  "action_category": "create|read|update|delete|manage|navigate",
  "target_entity": "workspace|project|task|user|member|label|view|document|notification|page",
  "parameters": { extracted parameter names and values },
  "confidence": 0.0-1.0,
  "suggested_response": "A natural response to the user explaining what you'll do"
}

4. If the user is asking a general question or the intent is unclear, set action_type to "chat" and provide a helpful response
5. For entity references by name (e.g., "the Research Paper project"), include the name in parameters for resolution
6. Consider the current context when interpreting relative references (e.g., "this workspace", "current project")

RULES:
- Be precise with parameter extraction
- Use current context IDs when user refers to "this" or "current" 
- Always include at least one parameter that identifies the target (name, id, etc.)
- If multiple entities match a name, indicate uncertainty in confidence
- For destructive actions (delete), confidence should be lower unless explicitly confirmed

Respond ONLY with valid JSON. No other text.`;
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
    prisma: any
  ): Promise<ParsedIntent> {
    const enhanced = { ...intent };
    const params = { ...intent.parameters };

    // Resolve workspace by name
    if (params.workspaceName && !params.workspaceId) {
      const workspace = await prisma.workspace.findFirst({
        where: {
          name: { contains: params.workspaceName, mode: 'insensitive' },
          OR: [
            { owner_id: context.userId },
            { members: { some: { user_id: context.userId } } }
          ]
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
          title: { contains: params.projectName, mode: 'insensitive' },
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
    const generalPatterns = [
      /^(hi|hello|hey|howdy|greetings)/i,
      /^(what|how|why|when|where|who|can you explain)/i,
      /^(thanks?|thank you)/i,
      /^(goodbye|bye|see you)/i,
      /\?$/,
    ];
    
    return generalPatterns.some(pattern => pattern.test(message.trim()));
  }

  /**
   * Build natural language response for an action
   */
  static buildActionConfirmationMessage(intent: ParsedIntent): string {
    const actionDef = ACTION_DEFINITIONS[intent.actionType];
    const entityName = intent.parameters.name || 
                      intent.parameters.title || 
                      intent.parameters.workspaceName ||
                      intent.parameters.projectName ||
                      'this item';

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

    return messages[intent.actionType] || 
           intent.suggestedResponse || 
           `I'll ${intent.actionType.replace(/_/g, ' ')} for you.`;
  }
}

export default AIIntentParser;
