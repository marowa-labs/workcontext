/**
 * WorkspaceActivityService
 * Centralized service for creating notifications about workspace events.
 * Covers: task changes, editor activity, comments, document actions.
 */

import { prisma } from "../lib/prisma";
import { createNotification } from "./notificationService";
import { getNotificationServer } from "../lib/notificationServer";
import logger from "../monitoring/logger";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get all users who should be notified about events in a workspace:
 * workspace members + project collaborators + task assignees.
 */
async function getWorkspaceRecipients(
  workspaceId: string,
  excludeUserId?: string,
): Promise<string[]> {
  const recipients = new Set<string>();

  // Workspace members
  const members = await prisma.workspaceMember.findMany({
    where: { workspace_id: workspaceId },
    select: { user_id: true },
  });
  members.forEach((m: { user_id: string }) => recipients.add(m.user_id));

  // Workspace owner
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { owner_id: true },
  });
  if (workspace) recipients.add(workspace.owner_id);

  // Exclude the actor
  if (excludeUserId) recipients.delete(excludeUserId);

  return Array.from(recipients);
}

/**
 * Get recipients for a specific task: assignees + creator + workspace members.
 */
async function getTaskRecipients(
  taskId: string,
  excludeUserId?: string,
): Promise<string[]> {
  const recipients = new Set<string>();

  const task = await prisma.workspaceTask.findUnique({
    where: { id: taskId },
    include: {
      assignees: { select: { user_id: true } },
      creator: { select: { id: true } },
      workspace: { select: { owner_id: true } },
    },
  });

  if (!task) return [];

  task.assignees.forEach((a: { user_id: string }) => recipients.add(a.user_id));
  recipients.add(task.creator_id);
  recipients.add(task.workspace.owner_id);

  if (excludeUserId) recipients.delete(excludeUserId);

  return Array.from(recipients);
}

// ── Task Events ──────────────────────────────────────────────────────────────

export async function notifyTaskStatusChanged(
  taskId: string,
  oldStatus: string,
  newStatus: string,
  actorUserId: string,
) {
  try {
    const task = await prisma.workspaceTask.findUnique({
      where: { id: taskId },
      include: { workspace: { select: { name: true } } },
    });
    if (!task) return;

    const recipients = await getTaskRecipients(taskId, actorUserId);
    const statusLabels: Record<string, string> = {
      todo: "To Do",
      "in-progress": "In Progress",
      "in-review": "In Review",
      done: "Completed",
      blocked: "Blocked",
    };

    for (const userId of recipients) {
      await createNotification(
        userId,
        "task_status_changed",
        `Task Status Updated`,
        `"${task.title}" moved from "${statusLabels[oldStatus] || oldStatus}" to "${statusLabels[newStatus] || newStatus}"`,
        { taskId, workspaceId: task.workspace_id, oldStatus, newStatus },
      );
    }

    // Real-time broadcast
    const ns = getNotificationServer();
    ns.broadcastToChannel(`workspace:${task.workspace_id}`, {
      type: "TASK_STATUS_CHANGED",
      taskId,
      oldStatus,
      newStatus,
    });
  } catch (error) {
    logger.error("Error in notifyTaskStatusChanged:", error);
  }
}

export async function notifyTaskPriorityChanged(
  taskId: string,
  oldPriority: string,
  newPriority: string,
  actorUserId: string,
) {
  try {
    const task = await prisma.workspaceTask.findUnique({
      where: { id: taskId },
    });
    if (!task) return;

    const recipients = await getTaskRecipients(taskId, actorUserId);

    for (const userId of recipients) {
      await createNotification(
        userId,
        "task_priority_changed",
        `Task Priority Updated`,
        `"${task.title}" priority changed from "${oldPriority}" to "${newPriority}"`,
        { taskId, workspaceId: task.workspace_id, oldPriority, newPriority },
      );
    }

    const ns = getNotificationServer();
    ns.broadcastToChannel(`workspace:${task.workspace_id}`, {
      type: "TASK_PRIORITY_CHANGED",
      taskId,
      oldPriority,
      newPriority,
    });
  } catch (error) {
    logger.error("Error in notifyTaskPriorityChanged:", error);
  }
}

export async function notifyTaskCreated(taskId: string, actorUserId: string) {
  try {
    const task = await prisma.workspaceTask.findUnique({
      where: { id: taskId },
      include: { workspace: { select: { name: true } } },
    });
    if (!task) return;

    const recipients = await getTaskRecipients(taskId, actorUserId);

    for (const userId of recipients) {
      await createNotification(
        userId,
        "task_created",
        `New Task Created`,
        `"${task.title}" was created in ${task.workspace.name}`,
        { taskId, workspaceId: task.workspace_id },
      );
    }
  } catch (error) {
    logger.error("Error in notifyTaskCreated:", error);
  }
}

export async function notifyTaskDeleted(
  taskId: string,
  taskTitle: string,
  workspaceId: string,
  actorUserId: string,
) {
  try {
    const recipients = await getWorkspaceRecipients(workspaceId, actorUserId);

    for (const userId of recipients) {
      await createNotification(
        userId,
        "task_deleted",
        `Task Deleted`,
        `"${taskTitle}" was deleted from the workspace`,
        { taskId, workspaceId },
      );
    }
  } catch (error) {
    logger.error("Error in notifyTaskDeleted:", error);
  }
}

export async function notifyTaskCompleted(taskId: string, actorUserId: string) {
  try {
    const task = await prisma.workspaceTask.findUnique({
      where: { id: taskId },
      include: { workspace: { select: { name: true } } },
    });
    if (!task) return;

    const recipients = await getTaskRecipients(taskId, actorUserId);

    for (const userId of recipients) {
      await createNotification(
        userId,
        "task_completed",
        `🎉 Task Completed`,
        `"${task.title}" has been marked as done in ${task.workspace.name}`,
        { taskId, workspaceId: task.workspace_id },
      );
    }

    const ns = getNotificationServer();
    ns.broadcastToChannel(`workspace:${task.workspace_id}`, {
      type: "TASK_COMPLETED",
      taskId,
    });
  } catch (error) {
    logger.error("Error in notifyTaskCompleted:", error);
  }
}

// ── Editor / Document Events ─────────────────────────────────────────────────

export async function notifyEditorActive(
  projectId: string,
  userId: string,
  documentTitle: string,
) {
  try {
    // Throttle: only send once per 5 minutes per user per project
    const cacheKey = `editor_active:${userId}:${projectId}`;
    const lastSent = editorActivityCache.get(cacheKey);
    if (lastSent && Date.now() - lastSent < 5 * 60 * 1000) return;
    editorActivityCache.set(cacheKey, Date.now());

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        collaborators: { select: { user_id: true } },
        user: { select: { id: true } },
      },
    });
    if (!project) return;

    const recipients = new Set<string>();
    project.collaborators.forEach((c: { user_id: string }) =>
      recipients.add(c.user_id),
    );
    recipients.add(project.user_id);
    recipients.delete(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { full_name: true, email: true },
    });
    const userName = user?.full_name || user?.email || "Someone";

    for (const recipientId of recipients) {
      await createNotification(
        recipientId,
        "editor_active",
        `Active Editing`,
        `${userName} is currently editing "${documentTitle}"`,
        { projectId, workspaceId: project.workspace_id },
      );
    }
  } catch (error) {
    logger.error("Error in notifyEditorActive:", error);
  }
}

export async function notifyDocumentEdited(
  projectId: string,
  userId: string,
  documentTitle: string,
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        collaborators: { select: { user_id: true } },
        user: { select: { id: true } },
      },
    });
    if (!project) return;

    const recipients = new Set<string>();
    project.collaborators.forEach((c: { user_id: string }) =>
      recipients.add(c.user_id),
    );
    recipients.add(project.user_id);
    recipients.delete(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { full_name: true, email: true },
    });
    const userName = user?.full_name || user?.email || "Someone";

    for (const recipientId of recipients) {
      await createNotification(
        recipientId,
        "document_edited",
        `Document Updated`,
        `${userName} made changes to "${documentTitle}"`,
        { projectId, workspaceId: project.workspace_id },
      );
    }
  } catch (error) {
    logger.error("Error in notifyDocumentEdited:", error);
  }
}

// ── Generic Workspace Activity ───────────────────────────────────────────────

export async function notifyWorkspaceActivity(
  workspaceId: string,
  actorUserId: string,
  action: string,
  description: string,
  data?: Record<string, any>,
) {
  try {
    const recipients = await getWorkspaceRecipients(workspaceId, actorUserId);

    for (const userId of recipients) {
      await createNotification(
        userId,
        "workspace_activity",
        action,
        description,
        { workspaceId, ...data },
      );
    }
  } catch (error) {
    logger.error("Error in notifyWorkspaceActivity:", error);
  }
}

// ── Throttle Cache ───────────────────────────────────────────────────────────

const editorActivityCache = new Map<string, number>();
