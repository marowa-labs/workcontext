// AI Action Service - Frontend
// Handles AI action execution and confirmation flow

import apiClient from "./apiClient";

export interface AIActionRequest {
  message: string;
  sessionId?: string;
  pageContext?: string;
  currentWorkspaceId?: string;
  currentProjectId?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  autoConfirm?: boolean;
}

export interface AIActionResult {
  type: "action" | "chat" | "confirmation_required" | "error";
  message: string;
  actionType?: string;
  actionId?: string;
  result?: {
    success: boolean;
    data?: any;
    error?: string;
    message: string;
    affectedEntities: Array<{
      type: string;
      id?: string;
      name?: string;
    }>;
  };
  data?: any;
  requiresConfirmation?: boolean;
  suggestedActions?: string[];
}

export interface PendingAction {
  id: string;
  actionType: string;
  actionCategory: string;
  targetEntity: string;
  userIntent: string;
  parsedParams: Record<string, any>;
  confirmationMessage: string;
  createdAt: string;
}

export interface ActionHistoryItem {
  id: string;
  actionType: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  resultData?: any;
  errorMessage?: string;
}

/**
 * Send a message to the AI and process any resulting actions
 */
export async function sendAIActionRequest(request: AIActionRequest): Promise<AIActionResult> {
  try {
    const response = await apiClient.post("/api/ai/actions", request);
    return response;
  } catch (error: any) {
    console.error("AI Action request failed:", error);
    return {
      type: "error",
      message: error.message || "Failed to process your request. Please try again.",
    };
  }
}

/**
 * Confirm a pending action
 */
export async function confirmAIAction(actionId: string): Promise<AIActionResult> {
  try {
    const response = await apiClient.post("/api/ai/actions/confirm", { actionId });
    return response;
  } catch (error: any) {
    console.error("Confirm action failed:", error);
    return {
      type: "error",
      message: error.message || "Failed to confirm action.",
    };
  }
}

/**
 * Cancel a pending action
 */
export async function cancelAIAction(actionId: string): Promise<AIActionResult> {
  try {
    const response = await apiClient.post("/api/ai/actions/cancel", { actionId });
    return response;
  } catch (error: any) {
    console.error("Cancel action failed:", error);
    return {
      type: "error",
      message: error.message || "Failed to cancel action.",
    };
  }
}

/**
 * Get pending actions for the current user
 */
export async function getPendingActions(): Promise<PendingAction[]> {
  try {
    const response = await apiClient.get("/api/ai/actions?type=pending");
    return response.actions || [];
  } catch (error: any) {
    console.error("Get pending actions failed:", error);
    return [];
  }
}

/**
 * Get action history for the current user
 */
export async function getActionHistory(limit: number = 50): Promise<ActionHistoryItem[]> {
  try {
    const response = await apiClient.get(`/api/ai/actions?type=history&limit=${limit}`);
    return response.actions || [];
  } catch (error: any) {
    console.error("Get action history failed:", error);
    return [];
  }
}

/**
 * Handle navigation actions from AI
 */
export function handleAINavigation(data: any): { page: string; params?: Record<string, string> } | null {
  if (!data?.navigation) return null;
  
  return {
    page: data.navigation.page,
    params: data.navigation.params,
  };
}

/**
 * Format action type for display
 */
export function formatActionType(actionType: string): string {
  const formatMap: Record<string, string> = {
    create_workspace: "Create Workspace",
    update_workspace: "Update Workspace",
    delete_workspace: "Delete Workspace",
    create_project: "Create Project",
    update_project: "Update Project",
    delete_project: "Delete Project",
    archive_project: "Archive Project",
    create_task: "Create Task",
    update_task: "Update Task",
    delete_task: "Delete Task",
    complete_task: "Complete Task",
    create_subtask: "Create Subtask",
    create_label: "Create Label",
    assign_label: "Assign Label",
    create_view: "Create View",
    list_workspaces: "List Workspaces",
    list_projects: "List Projects",
    list_tasks: "List Tasks",
    get_project_details: "Get Project Details",
    navigate_to_page: "Navigate",
    open_project: "Open Project",
    edit_document: "Edit Document",
    summarize_document: "Summarize",
    mark_notifications_read: "Mark Notifications Read",
    invite_workspace_member: "Invite Member",
    create_project_with_tasks: "Create Project with Tasks",
  };
  
  return formatMap[actionType] || actionType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get icon for action type
 */
export function getActionIcon(actionType: string): string {
  const iconMap: Record<string, string> = {
    create_workspace: "🏢",
    create_project: "📄",
    create_task: "✅",
    complete_task: "🎉",
    update_project: "✏️",
    update_task: "✏️",
    delete_project: "🗑️",
    delete_task: "🗑️",
    delete_workspace: "🗑️",
    archive_project: "📦",
    create_label: "🏷️",
    create_view: "👁️",
    list_workspaces: "📂",
    list_projects: "📑",
    list_tasks: "📋",
    open_project: "📖",
    edit_document: "📝",
    summarize_document: "📊",
    navigate_to_page: "🧭",
    invite_workspace_member: "👤",
  };
  
  return iconMap[actionType] || "🤖";
}

/**
 * Check if action requires destructive confirmation
 */
export function isDestructiveAction(actionType: string): boolean {
  const destructiveActions = [
    "delete_workspace",
    "delete_project",
    "delete_task",
    "archive_project",
  ];
  return destructiveActions.includes(actionType);
}

/**
 * Get confirmation button text
 */
export function getConfirmationButtonText(actionType: string): { confirm: string; cancel: string } {
  if (isDestructiveAction(actionType)) {
    return {
      confirm: actionType.includes("delete") ? "Delete" : "Archive",
      cancel: "Cancel",
    };
  }
  
  return {
    confirm: "Confirm",
    cancel: "Cancel",
  };
}

class AIActionService {
  private pendingConfirmation: AIActionResult | null = null;
  private confirmationCallbacks: {
    onConfirm?: (result: AIActionResult) => void;
    onCancel?: () => void;
  } = {};

  /**
   * Send a message and handle the complete flow including confirmations
   */
  async sendMessage(
    message: string,
    context: {
      pageContext?: string;
      currentWorkspaceId?: string;
      currentProjectId?: string;
      conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    },
    callbacks: {
      onConfirmationRequired?: (action: AIActionResult, confirm: () => void, cancel: () => void) => void;
      onResult?: (result: AIActionResult) => void;
      onError?: (error: string) => void;
      onNavigation?: (page: string, params?: Record<string, string>) => void;
      onCancel?: () => void;
    }
  ): Promise<AIActionResult | null> {
    try {
      // Send the request
      const result = await sendAIActionRequest({
        message,
        ...context,
      });

      // Handle confirmation required
      if (result.type === "confirmation_required" && result.requiresConfirmation) {
        this.pendingConfirmation = result;
        
        if (callbacks.onConfirmationRequired) {
          callbacks.onConfirmationRequired(
            result,
            async () => {
              // User confirmed
              const confirmedResult = await confirmAIAction(result.actionId!);
              this.pendingConfirmation = null;
              
              // Check for navigation in confirmed result
              this.handleNavigation(confirmedResult, callbacks.onNavigation);
              
              if (callbacks.onResult) {
                callbacks.onResult(confirmedResult);
              }
            },
            async () => {
              // User cancelled
              if (result.actionId) {
                await cancelAIAction(result.actionId);
              }
              this.pendingConfirmation = null;
              
              if (callbacks.onCancel) {
                callbacks.onCancel();
              }
            }
          );
        }
        
        return result;
      }

      // Handle navigation for immediate results
      this.handleNavigation(result, callbacks.onNavigation);

      // Handle regular result
      if (callbacks.onResult) {
        callbacks.onResult(result);
      }

      return result;
    } catch (error: any) {
      console.error("AI Action error:", error);
      if (callbacks.onError) {
        callbacks.onError(error.message || "An error occurred");
      }
      return null;
    }
  }

  /**
   * Handle navigation from action results
   */
  private handleNavigation(
    result: AIActionResult,
    onNavigation?: (page: string, params?: Record<string, string>) => void
  ): void {
    if (!onNavigation || !result.data?.navigation) return;

    const nav = result.data.navigation;
    onNavigation(nav.page, nav.params);
  }

  /**
   * Check if there's a pending confirmation
   */
  hasPendingConfirmation(): boolean {
    return this.pendingConfirmation !== null;
  }

  /**
   * Get the pending confirmation
   */
  getPendingConfirmation(): AIActionResult | null {
    return this.pendingConfirmation;
  }

  /**
   * Clear pending confirmation
   */
  clearPendingConfirmation(): void {
    this.pendingConfirmation = null;
  }
}

export const aiActionService = new AIActionService();
export default aiActionService;
