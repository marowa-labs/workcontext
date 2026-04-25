import { Router } from "express";
import { WorkspaceViewService } from "../../services/workspaceViewService";
import logger from "../../monitoring/logger";

const router = Router({ mergeParams: true });

// GET /api/workspaces/:workspaceId/views - Get all saved views
router.get("/", async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const views = await WorkspaceViewService.getViews(workspaceId);
    res.json(views);
  } catch (error) {
    logger.error("Error in GET /views:", error);
    res.status(500).json({ error: "Failed to fetch views" });
  }
});

// POST /api/workspaces/:workspaceId/views - Create a saved view
router.post("/", async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, filters } = req.body;

    if (!name) {
      return res.status(400).json({ error: "View name is required" });
    }

    const view = await WorkspaceViewService.createView(
      workspaceId,
      name,
      filters,
    );
    res.status(201).json(view);
  } catch (error) {
    logger.error("Error in POST /views:", error);
    res.status(500).json({ error: "Failed to create view" });
  }
});

// PATCH /api/workspaces/:workspaceId/views/:viewId - Update a saved view
router.patch("/:viewId", async (req: any, res) => {
  try {
    const { viewId } = req.params;
    const { name, filters } = req.body;

    const view = await WorkspaceViewService.updateView(viewId, name, filters);
    res.json(view);
  } catch (error) {
    logger.error("Error in PATCH /views/:viewId:", error);
    res.status(500).json({ error: "Failed to update view" });
  }
});

// DELETE /api/workspaces/:workspaceId/views/:viewId - Delete a saved view
router.delete("/:viewId", async (req: any, res) => {
  try {
    const { viewId } = req.params;
    await WorkspaceViewService.deleteView(viewId);
    res.status(204).end();
  } catch (error) {
    logger.error("Error in DELETE /views/:viewId:", error);
    res.status(500).json({ error: "Failed to delete view" });
  }
});

export default router;
