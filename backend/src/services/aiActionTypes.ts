// AI Action System - Types and Action Definitions

export type ActionCategory = "create" | "read" | "update" | "delete" | "manage" | "navigate";
export type ActionStatus = "pending" | "confirmed" | "executing" | "completed" | "failed" | "cancelled";
export type TargetEntity = "workspace" | "project" | "task" | "user" | "member" | "label" | "view" | "document" | "notification" | "page";

export interface ParsedIntent {
  actionType: string;
  actionCategory: ActionCategory;
  targetEntity: TargetEntity;
  parameters: Record<string, any>;
  confidence: number;
  requiresConfirmation: boolean;
  suggestedResponse: string;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  message: string;
  affectedEntities: Array<{
    type: TargetEntity;
    id?: string;
    name?: string;
  }>;
}

export interface AIActionContext {
  userId: string;
  sessionId?: string;
  pageContext?: string;
  currentWorkspaceId?: string;
  currentProjectId?: string;
  userPreferences?: Record<string, any>;
}

// Action Definition Interface
export interface ActionDefinition {
  type: string;
  category: ActionCategory;
  targetEntity: TargetEntity;
  description: string;
  parameters: Array<{
    name: string;
    type: "string" | "number" | "boolean" | "array" | "object" | "date";
    required: boolean;
    description: string;
    enum?: string[];
  }>;
  requiresConfirmation: boolean;
  execute: (params: any, context: AIActionContext) => Promise<ActionResult>;
}

// Available Actions Registry
export const ACTION_DEFINITIONS: Record<string, Partial<ActionDefinition>> = {
  // Workspace Actions
  "create_workspace": {
    type: "create_workspace",
    category: "create",
    targetEntity: "workspace",
    description: "Create a new workspace",
    parameters: [
      { name: "name", type: "string", required: true, description: "Workspace name" },
      { name: "description", type: "string", required: false, description: "Workspace description" },
      { name: "icon", type: "string", required: false, description: "Workspace icon/emoji" },
    ],
    requiresConfirmation: true,
  },
  "update_workspace": {
    type: "update_workspace",
    category: "update",
    targetEntity: "workspace",
    description: "Update workspace details",
    parameters: [
      { name: "workspaceId", type: "string", required: true, description: "Workspace ID" },
      { name: "name", type: "string", required: false, description: "New workspace name" },
      { name: "description", type: "string", required: false, description: "New description" },
      { name: "icon", type: "string", required: false, description: "New icon" },
    ],
    requiresConfirmation: true,
  },
  "delete_workspace": {
    type: "delete_workspace",
    category: "delete",
    targetEntity: "workspace",
    description: "Delete a workspace",
    parameters: [
      { name: "workspaceId", type: "string", required: true, description: "Workspace ID to delete" },
    ],
    requiresConfirmation: true,
  },
  "invite_workspace_member": {
    type: "invite_workspace_member",
    category: "manage",
    targetEntity: "member",
    description: "Invite a member to a workspace",
    parameters: [
      { name: "workspaceId", type: "string", required: true, description: "Workspace ID" },
      { name: "email", type: "string", required: true, description: "Member email" },
      { name: "role", type: "string", required: false, description: "Member role", enum: ["admin", "editor", "viewer"] },
    ],
    requiresConfirmation: true,
  },

  // Project Actions
  "create_project": {
    type: "create_project",
    category: "create",
    targetEntity: "project",
    description: "Create a new project",
    parameters: [
      { name: "title", type: "string", required: true, description: "Project title" },
      { name: "type", type: "string", required: false, description: "Project type", enum: ["essay", "research_paper", "thesis", "dissertation", "article", "report", "other"] },
      { name: "description", type: "string", required: false, description: "Project description" },
      { name: "workspaceId", type: "string", required: false, description: "Optional workspace ID" },
      { name: "templateId", type: "string", required: false, description: "Optional template ID" },
    ],
    requiresConfirmation: true,
  },
  "update_project": {
    type: "update_project",
    category: "update",
    targetEntity: "project",
    description: "Update project details",
    parameters: [
      { name: "projectId", type: "string", required: true, description: "Project ID" },
      { name: "title", type: "string", required: false, description: "New title" },
      { name: "description", type: "string", required: false, description: "New description" },
      { name: "content", type: "object", required: false, description: "Project content (for editing document)" },
      { name: "status", type: "string", required: false, description: "Project status", enum: ["draft", "in_progress", "review", "completed", "archived"] },
    ],
    requiresConfirmation: true,
  },
  "delete_project": {
    type: "delete_project",
    category: "delete",
    targetEntity: "project",
    description: "Delete a project",
    parameters: [
      { name: "projectId", type: "string", required: true, description: "Project ID to delete" },
    ],
    requiresConfirmation: true,
  },
  "archive_project": {
    type: "archive_project",
    category: "update",
    targetEntity: "project",
    description: "Archive a project",
    parameters: [
      { name: "projectId", type: "string", required: true, description: "Project ID to archive" },
    ],
    requiresConfirmation: true,
  },

  // Task Actions
  "create_task": {
    type: "create_task",
    category: "create",
    targetEntity: "task",
    description: "Create a new task",
    parameters: [
      { name: "workspaceId", type: "string", required: true, description: "Workspace ID" },
      { name: "title", type: "string", required: true, description: "Task title" },
      { name: "description", type: "string", required: false, description: "Task description" },
      { name: "priority", type: "string", required: false, description: "Task priority", enum: ["low", "medium", "high"] },
      { name: "dueDate", type: "date", required: false, description: "Due date" },
      { name: "assigneeEmails", type: "array", required: false, description: "Array of assignee emails" },
      { name: "projectId", type: "string", required: false, description: "Linked project ID" },
    ],
    requiresConfirmation: false,
  },
  "update_task": {
    type: "update_task",
    category: "update",
    targetEntity: "task",
    description: "Update a task",
    parameters: [
      { name: "taskId", type: "string", required: true, description: "Task ID" },
      { name: "title", type: "string", required: false, description: "New title" },
      { name: "description", type: "string", required: false, description: "New description" },
      { name: "status", type: "string", required: false, description: "Task status" },
      { name: "priority", type: "string", required: false, description: "New priority" },
      { name: "dueDate", type: "date", required: false, description: "New due date" },
    ],
    requiresConfirmation: false,
  },
  "delete_task": {
    type: "delete_task",
    category: "delete",
    targetEntity: "task",
    description: "Delete a task",
    parameters: [
      { name: "taskId", type: "string", required: true, description: "Task ID to delete" },
    ],
    requiresConfirmation: true,
  },
  "complete_task": {
    type: "complete_task",
    category: "update",
    targetEntity: "task",
    description: "Mark a task as complete",
    parameters: [
      { name: "taskId", type: "string", required: true, description: "Task ID" },
    ],
    requiresConfirmation: false,
  },
  "create_subtask": {
    type: "create_subtask",
    category: "create",
    targetEntity: "task",
    description: "Create a subtask",
    parameters: [
      { name: "taskId", type: "string", required: true, description: "Parent task ID" },
      { name: "title", type: "string", required: true, description: "Subtask title" },
    ],
    requiresConfirmation: false,
  },

  // Label Actions
  "create_label": {
    type: "create_label",
    category: "create",
    targetEntity: "label",
    description: "Create a workspace label",
    parameters: [
      { name: "workspaceId", type: "string", required: true, description: "Workspace ID" },
      { name: "name", type: "string", required: true, description: "Label name" },
      { name: "color", type: "string", required: false, description: "Label color (hex)" },
    ],
    requiresConfirmation: false,
  },
  "assign_label": {
    type: "assign_label",
    category: "manage",
    targetEntity: "label",
    description: "Assign a label to a task",
    parameters: [
      { name: "taskId", type: "string", required: true, description: "Task ID" },
      { name: "labelId", type: "string", required: true, description: "Label ID" },
    ],
    requiresConfirmation: false,
  },

  // View Actions
  "create_view": {
    type: "create_view",
    category: "create",
    targetEntity: "view",
    description: "Create a workspace view",
    parameters: [
      { name: "workspaceId", type: "string", required: true, description: "Workspace ID" },
      { name: "name", type: "string", required: true, description: "View name" },
      { name: "filters", type: "object", required: false, description: "View filters" },
    ],
    requiresConfirmation: false,
  },

  // Read/Query Actions
  "list_workspaces": {
    type: "list_workspaces",
    category: "read",
    targetEntity: "workspace",
    description: "List all workspaces",
    parameters: [],
    requiresConfirmation: false,
  },
  "list_projects": {
    type: "list_projects",
    category: "read",
    targetEntity: "project",
    description: "List projects",
    parameters: [
      { name: "workspaceId", type: "string", required: false, description: "Filter by workspace" },
      { name: "archived", type: "boolean", required: false, description: "Include archived" },
    ],
    requiresConfirmation: false,
  },
  "list_tasks": {
    type: "list_tasks",
    category: "read",
    targetEntity: "task",
    description: "List tasks in a workspace",
    parameters: [
      { name: "workspaceId", type: "string", required: true, description: "Workspace ID" },
      { name: "status", type: "string", required: false, description: "Filter by status" },
      { name: "priority", type: "string", required: false, description: "Filter by priority" },
    ],
    requiresConfirmation: false,
  },
  "get_project_details": {
    type: "get_project_details",
    category: "read",
    targetEntity: "project",
    description: "Get detailed project information",
    parameters: [
      { name: "projectId", type: "string", required: true, description: "Project ID" },
    ],
    requiresConfirmation: false,
  },

  // Navigation Actions
  "navigate_to_page": {
    type: "navigate_to_page",
    category: "navigate",
    targetEntity: "page",
    description: "Navigate to a specific page",
    parameters: [
      { name: "page", type: "string", required: true, description: "Page name/path", enum: ["dashboard", "workspaces", "projects", "tasks", "editor", "settings", "profile"] },
      { name: "params", type: "object", required: false, description: "Page parameters (ID, etc.)" },
    ],
    requiresConfirmation: false,
  },
  "open_project": {
    type: "open_project",
    category: "navigate",
    targetEntity: "project",
    description: "Open a project in the editor",
    parameters: [
      { name: "projectId", type: "string", required: true, description: "Project ID" },
    ],
    requiresConfirmation: false,
  },

  // Document Editing Actions
  "edit_document": {
    type: "edit_document",
    category: "update",
    targetEntity: "document",
    description: "Edit document content",
    parameters: [
      { name: "projectId", type: "string", required: true, description: "Project ID" },
      { name: "instruction", type: "string", required: true, description: "Editing instruction (e.g., 'add introduction', 'fix grammar')" },
    ],
    requiresConfirmation: true,
  },
  "summarize_document": {
    type: "summarize_document",
    category: "read",
    targetEntity: "document",
    description: "Summarize document content",
    parameters: [
      { name: "projectId", type: "string", required: true, description: "Project ID" },
      { name: "style", type: "string", required: false, description: "Summary style", enum: ["brief", "detailed", "bullet_points", "executive"] },
    ],
    requiresConfirmation: false,
  },

  // Notification Actions
  "mark_notifications_read": {
    type: "mark_notifications_read",
    category: "update",
    targetEntity: "notification",
    description: "Mark notifications as read",
    parameters: [
      { name: "notificationIds", type: "array", required: false, description: "Specific notification IDs (omit for all)" },
    ],
    requiresConfirmation: false,
  },

  // Multi-step Actions
  "create_project_with_tasks": {
    type: "create_project_with_tasks",
    category: "create",
    targetEntity: "project",
    description: "Create a project with initial tasks",
    parameters: [
      { name: "title", type: "string", required: true, description: "Project title" },
      { name: "type", type: "string", required: false, description: "Project type" },
      { name: "tasks", type: "array", required: true, description: "Array of task titles to create" },
      { name: "workspaceId", type: "string", required: false, description: "Optional workspace ID" },
    ],
    requiresConfirmation: true,
  },
};

// Intent patterns for quick matching
export const INTENT_PATTERNS: Array<{
  pattern: RegExp;
  actionType: string;
  extractParams: (match: RegExpMatchArray, message: string) => Record<string, any>;
}> = [
  {
    pattern: /create\s+(?:a\s+)?new\s+workspace\s+(?:called\s+)?["']?([^"']+)["']?/i,
    actionType: "create_workspace",
    extractParams: (match) => ({ name: match[1]?.trim() }),
  },
  {
    pattern: /create\s+(?:a\s+)?new\s+project\s+(?:called\s+)?["']?([^"']+)["']?/i,
    actionType: "create_project",
    extractParams: (match) => ({ title: match[1]?.trim() }),
  },
  {
    pattern: /create\s+(?:a\s+)?task\s+(?:called\s+)?["']?([^"']+)["']?(?:\s+in\s+(?:the\s+)?workspace)?/i,
    actionType: "create_task",
    extractParams: (match) => ({ title: match[1]?.trim() }),
  },
  {
    pattern: /delete\s+(?:the\s+)?(?:workspace|project|task)\s+["']?([^"']+)["']?/i,
    actionType: "delete_item",
    extractParams: (match, message) => {
      const entity = message.match(/workspace/) ? "workspace" : message.match(/project/) ? "project" : "task";
      return { targetEntity: entity, name: match[1]?.trim() };
    },
  },
  {
    pattern: /invite\s+["']?([^"']+)["']?\s+to\s+(?:the\s+)?workspace/i,
    actionType: "invite_workspace_member",
    extractParams: (match) => ({ email: match[1]?.trim() }),
  },
  {
    pattern: /show\s+(?:me\s+)?(?:all\s+)?(?:my\s+)?workspaces/i,
    actionType: "list_workspaces",
    extractParams: () => ({}),
  },
  {
    pattern: /show\s+(?:me\s+)?(?:all\s+)?(?:my\s+)?projects/i,
    actionType: "list_projects",
    extractParams: () => ({}),
  },
  {
    pattern: /open\s+(?:the\s+)?project\s+["']?([^"']+)["']?/i,
    actionType: "open_project",
    extractParams: (match) => ({ projectName: match[1]?.trim() }),
  },
  {
    pattern: /mark\s+(?:all\s+)?notifications?\s+(?:as\s+)?read/i,
    actionType: "mark_notifications_read",
    extractParams: () => ({}),
  },
  {
    pattern: /complete\s+(?:the\s+)?task\s+["']?([^"']+)["']?/i,
    actionType: "complete_task",
    extractParams: (match) => ({ taskName: match[1]?.trim() }),
  },
];
