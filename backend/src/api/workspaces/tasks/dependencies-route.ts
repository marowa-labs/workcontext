import { Router } from "express";
import TaskDependencyService from "../../../services/taskDependencyService";
import logger from "../../../monitoring/logger";

const router = Router({ mergeParams: true });

// POST /api/workspaces/:id/tasks/:taskId/dependencies - Add a dependency
router.post("/", async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const { dependsOnId } = req.body;

    if (!dependsOnId) {
      return res.status(400).json({ error: "dependsOnId is required" });
    }

    const dependency = await TaskDependencyService.addDependency(
      taskId,
      dependsOnId,
    );
    res.json(dependency);
  } catch (error: any) {
    logger.error("Error adding task dependency via API", error);
    res
      .status(400)
      .json({ error: error.message || "Failed to add dependency" });
  }
});

// DELETE /api/workspaces/:id/tasks/:taskId/dependencies/:dependsOnId - Remove a dependency
router.delete("/:dependsOnId", async (req: any, res) => {
  try {
    const { taskId, dependsOnId } = req.params;
    await TaskDependencyService.removeDependency(taskId, dependsOnId);
    res.json({ success: true });
  } catch (error: any) {
    logger.error("Error removing task dependency via API", error);
    res.status(500).json({ error: "Failed to remove dependency" });
  }
});

// GET /api/workspaces/:id/tasks/:taskId/dependencies - Get dependencies for a task
router.get("/", async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const dependencies = await TaskDependencyService.getDependencies(taskId);
    res.json(dependencies);
  } catch (error: any) {
    logger.error("Error fetching task dependencies via API", error);
    res.status(500).json({ error: "Failed to fetch dependencies" });
  }
});

export default router;
