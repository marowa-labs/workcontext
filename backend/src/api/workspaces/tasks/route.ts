import { Router } from "express";
import { WorkspaceTaskService } from "../../../services/workspaceTaskService";
import { TaskCommentService } from "../../../services/TaskCommentService";
import { TaskAttachmentService } from "../../../services/TaskAttachmentService";
import { TaskTimeTrackingService } from "../../../services/TaskTimeTrackingService";
import dependenciesRouter from "./dependencies-route";
import { authenticateExpressRequest } from "../../../middleware/auth";
import multer from "multer";
import prisma from "../../../lib/prisma";

const upload = multer();

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateExpressRequest);

// --- Template Routes ---

/**
 * Get all templates for a workspace
 */
router.get("/templates/all", async (req: any, res) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID is required" });
    }

    const templates = await WorkspaceTaskService.getTemplates(workspaceId);
    return res.json({ success: true, templates });
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Save a task as a template
 */
router.post("/templates/save", async (req: any, res) => {
  try {
    const { taskId, templateName, category } = req.body;
    if (!taskId || !templateName) {
      return res
        .status(400)
        .json({ error: "Task ID and Template Name are required" });
    }

    const template = await WorkspaceTaskService.saveAsTemplate(
      taskId,
      templateName,
      category,
    );
    return res.status(201).json({ success: true, template });
  } catch (error: any) {
    console.error("Error saving as template:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Create a task from a template
 */
router.post("/from-template", async (req: any, res) => {
  try {
    const { templateId, overrides } = req.body;
    const userId = req.user?.id;

    if (!templateId) {
      return res.status(400).json({ error: "Template ID is required" });
    }

    const task = await WorkspaceTaskService.createFromTemplate(
      templateId,
      userId,
      overrides,
    );
    return res.status(201).json({ success: true, task });
  } catch (error: any) {
    console.error("Error creating from template:", error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/workspaces/tasks - Fetch tasks
router.get("/", async (req: any, res) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    const includeTemplates = req.query.includeTemplates === "true";

    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID is required" });
    }

    const tasks = await WorkspaceTaskService.getTasks(
      workspaceId,
      includeTemplates,
    );

    res.status(200).json({ tasks });
  } catch (error: any) {
    console.error("Error in Workspace Task GET:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /api/workspaces/tasks/:taskId/clone - Clone a task
router.post("/:taskId/clone", async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const clonedTask = await WorkspaceTaskService.cloneTask(taskId, userId);

    res.status(201).json({ task: clonedTask });
  } catch (error: any) {
    console.error("Error cloning task:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});



// --- Bulk Operations ---

// PATCH /api/workspaces/tasks/bulk - Bulk update tasks
router.patch("/bulk", async (req: any, res) => {
  try {
    const { workspaceId, taskIds, ...updateData } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!workspaceId || !taskIds || !Array.isArray(taskIds)) {
      return res
        .status(400)
        .json({ error: "Workspace ID and taskIds array are required" });
    }

    const tasks = await WorkspaceTaskService.bulkUpdateTasks(
      workspaceId,
      taskIds,
      updateData,
    );

    res.status(200).json({ tasks });
  } catch (error: any) {
    console.error("Error in Workspace Task Bulk PATCH:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// DELETE /api/workspaces/tasks/bulk - Bulk delete tasks
router.delete("/bulk", async (req: any, res) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    const taskIds = JSON.parse(req.query.taskIds as string);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!workspaceId || !taskIds || !Array.isArray(taskIds)) {
      return res
        .status(400)
        .json({ error: "Workspace ID and taskIds array are required" });
    }

    await WorkspaceTaskService.bulkDeleteTasks(workspaceId, taskIds);

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error in Workspace Task Bulk DELETE:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// --- Comment Routes ---

// GET /api/workspaces/tasks/comments - Fetch comments for a task
router.get("/comments", async (req: any, res) => {
  try {
    const taskId = req.query.taskId as string;
    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }

    const comments = await TaskCommentService.getComments(taskId);
    res.status(200).json({ comments });
  } catch (error: any) {
    console.error("Error in Task Comment GET:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /api/workspaces/tasks/comments - Add a comment
router.post("/comments", async (req: any, res) => {
  try {
    const { taskId, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!taskId || !content) {
      return res
        .status(400)
        .json({ error: "Task ID and content are required" });
    }

    const comment = await TaskCommentService.addComment(
      taskId,
      userId,
      content,
    );
    res.status(201).json({ comment });
  } catch (error: any) {
    console.error("Error in Task Comment POST:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// DELETE /api/workspaces/tasks/comments/:id - Delete a comment
router.delete("/comments/:id", async (req: any, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await TaskCommentService.deleteComment(commentId, userId);
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error in Task Comment DELETE:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// --- Attachment Routes ---

// POST /api/workspaces/tasks/:taskId/attachments - Upload an attachment
router.post(
  "/:taskId/attachments",
  upload.single("file"),
  async (req: any, res) => {
    try {
      const { taskId } = req.params;
      const file = req.file;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const attachment = await TaskAttachmentService.uploadAttachment(
        taskId,
        userId,
        file.buffer,
        file.originalname,
        file.mimetype,
      );

      res.status(201).json({ attachment });
    } catch (error: any) {
      console.error("Error in Task Attachment POST:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  },
);

// DELETE /api/workspaces/tasks/attachments/:id - Delete an attachment
router.delete("/attachments/:id", async (req: any, res) => {
  try {
    const attachmentId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await TaskAttachmentService.deleteAttachment(attachmentId);
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error in Task Attachment DELETE:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// --- Recurring Task Routes ---

// GET /api/workspaces/tasks/:taskId/upcoming-instances - Get upcoming instances of a recurring task
router.get("/:taskId/upcoming-instances", async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const count = parseInt(req.query.count as string) || 10;

    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }

    const task = await prisma.workspaceTask.findUnique({
      where: { id: taskId },
    });

    if (
      !task ||
      !task.is_recurring ||
      !task.recurrence_pattern ||
      !task.due_date
    ) {
      return res.status(400).json({ error: "Task is not a recurring task" });
    }

    const RecurringTaskService =
      require("../../../services/RecurringTaskService").default;
    const occurrences = RecurringTaskService.getNextOccurrences(
      task.recurrence_pattern,
      task.due_date,
      count,
    );

    res.status(200).json({ occurrences });
  } catch (error: any) {
    console.error("Error fetching upcoming instances:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /api/workspaces/tasks/:taskId/skip-occurrence - Skip a specific occurrence
router.post("/:taskId/skip-occurrence", async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const { occurrenceDate } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!occurrenceDate) {
      return res.status(400).json({ error: "Occurrence date is required" });
    }

    // Create an exception instance with skipped status
    const skippedInstance = await prisma.workspaceTask.create({
      data: {
        workspace_id: req.body.workspaceId,
        creator_id: userId,
        title: "Skipped",
        status: "done", // Mark as done so it won't show in active tasks
        due_date: new Date(occurrenceDate),
        parent_recurring_task_id: taskId,
        is_recurrence_exception: true,
        original_due_date: new Date(occurrenceDate),
      },
    });

    res.status(201).json({ success: true, instance: skippedInstance });
  } catch (error: any) {
    console.error("Error skipping occurrence:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /api/workspaces/tasks/:taskId/generate-instances - Manually trigger instance generation
router.post("/:taskId/generate-instances", async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const weeksAhead = parseInt(req.body.weeksAhead as string) || 2;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const RecurringTaskService =
      require("../../../services/RecurringTaskService").default;
    const instances = await RecurringTaskService.generateTaskInstances(
      taskId,
      weeksAhead,
    );

    res
      .status(201)
      .json({ success: true, instancesCreated: instances.length, instances });
  } catch (error: any) {
    console.error("Error generating instances:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// GET /api/workspaces/tasks/by-project/:projectId - Get tasks for a specific project
router.get("/by-project/:projectId", async (req: any, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const tasks = await WorkspaceTaskService.getTasksByProject(projectId);

    res.status(200).json({ tasks });
  } catch (error: any) {
    console.error("Error fetching tasks by project:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// GET /api/workspaces/tasks/project-stats/:projectId - Get task statistics for a project
router.get("/project-stats/:projectId", async (req: any, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const stats = await WorkspaceTaskService.getProjectTaskStats(projectId);

    res.status(200).json(stats);
  } catch (error: any) {
    console.error("Error fetching project task stats:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// --- Dependency Routes ---
router.use("/:taskId/dependencies", dependenciesRouter);

// ============ TIME TRACKING ENDPOINTS ============

// POST /api/workspaces/tasks/:taskId/time/start - Start a timer
router.post("/:taskId/time/start", async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const { description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const entry = await TaskTimeTrackingService.startTimer(
      taskId,
      userId,
      description,
    );

    res.status(200).json(entry);
  } catch (error: any) {
    console.error("Error starting timer:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /api/workspaces/tasks/time/stop - Stop active timer
router.post("/time/stop/:entryId", async (req: any, res) => {
  try {
    const { entryId } = req.params;

    const entry = await TaskTimeTrackingService.stopTimer(entryId);

    res.status(200).json(entry);
  } catch (error: any) {
    console.error("Error stopping timer:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /api/workspaces/tasks/:taskId/time/log - Log manual time entry
router.post("/:taskId/time/log", async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const { start_time, end_time, duration, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const entry = await TaskTimeTrackingService.logTime(taskId, userId, {
      start_time: new Date(start_time),
      end_time: end_time ? new Date(end_time) : undefined,
      duration,
      description,
    });

    res.status(200).json(entry);
  } catch (error: any) {
    console.error("Error logging time:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// GET /api/workspaces/tasks/:taskId/time - Get time entries for a task
router.get("/:taskId/time", async (req: any, res) => {
  try {
    const { taskId } = req.params;

    const entries = await TaskTimeTrackingService.getTaskTimeEntries(taskId);

    res.status(200).json({ entries });
  } catch (error: any) {
    console.error("Error fetching time entries:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// GET /api/workspaces/tasks/time/active - Get user's active timer
router.get("/time/active", async (req: any, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const activeTimer = await TaskTimeTrackingService.getActiveTimer(userId);

    res.status(200).json({ activeTimer });
  } catch (error: any) {
    console.error("Error fetching active timer:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// GET /api/workspaces/tasks/:taskId/time/total - Get total time spent on task
router.get("/:taskId/time/total", async (req: any, res) => {
  try {
    const { taskId } = req.params;

    const totals = await TaskTimeTrackingService.getTotalTimeSpent(taskId);

    res.status(200).json(totals);
  } catch (error: any) {
    console.error("Error calculating total time:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// DELETE /api/workspaces/tasks/time/:entryId - Delete a time entry
router.delete("/time/:entryId", async (req: any, res) => {
  try {
    const { entryId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await TaskTimeTrackingService.deleteTimeEntry(entryId, userId);

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error deleting time entry:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// PATCH /api/workspaces/tasks/time/:entryId - Update a time entry
router.patch("/time/:entryId", async (req: any, res) => {
  try {
    const { entryId } = req.params;
    const { start_time, end_time, duration, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const entry = await TaskTimeTrackingService.updateTimeEntry(
      entryId,
      userId,
      {
        start_time: start_time ? new Date(start_time) : undefined,
        end_time: end_time ? new Date(end_time) : undefined,
        duration,
        description,
      },
    );

    res.status(200).json(entry);
  } catch (error: any) {
    console.error("Error updating time entry:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// GET /api/workspaces/tasks/:taskId - Fetch a single task
router.get("/:taskId", async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const task = await WorkspaceTaskService.getTaskById(taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ task });
  } catch (error: any) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /api/workspaces/tasks - Create a task
router.post("/", async (req: any, res) => {
  try {
    const { workspaceId, ...taskData } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID is required" });
    }

    const task = await WorkspaceTaskService.createTask(
      workspaceId,
      userId,
      taskData,
    );

    res.status(201).json({ task });
  } catch (error: any) {
    console.error("Error in Workspace Task POST:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// PATCH /api/workspaces/tasks - Update a task
router.patch("/", async (req: any, res) => {
  try {
    const { taskId, ...updateData } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }

    const task = await WorkspaceTaskService.updateTask(taskId, updateData);

    res.status(200).json({ task });
  } catch (error: any) {
    console.error("Error in Workspace Task PATCH:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// PATCH /api/workspaces/tasks/:taskId/custom-fields - Update task custom field values
router.patch("/:taskId/custom-fields", async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const { values } = req.body; // Record<field_id, value>

    if (!taskId || !values) {
      return res.status(400).json({ error: "Task ID and values are required" });
    }

    const task = await WorkspaceTaskService.updateTaskCustomFields(
      taskId,
      values,
    );
    res.status(200).json({ task });
  } catch (error: any) {
    console.error("Error updating task custom fields:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// DELETE /api/workspaces/tasks - Delete a task
router.delete("/", async (req: any, res) => {
  try {
    const taskId = req.query.id as string;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }

    await WorkspaceTaskService.deleteTask(taskId);

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error in Workspace Task DELETE:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
