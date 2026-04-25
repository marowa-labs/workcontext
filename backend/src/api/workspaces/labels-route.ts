import { Router } from "express";
import { LabelService } from "../../services/LabelService";

const router = Router();

// GET /api/workspaces/:id/labels - Get labels for a workspace
router.get("/:id/labels", async (req: any, res) => {
  try {
    const { id } = req.params;
    const labels = await LabelService.getWorkspaceLabels(id);
    res.json({ labels });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/workspaces/:id/labels - Create a label
router.post("/:id/labels", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const label = await LabelService.createLabel(id, name, color);
    res.status(201).json({ label });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/workspaces/labels/:labelId - Update a label
router.patch("/labels/:labelId", async (req: any, res) => {
  try {
    const { labelId } = req.params;
    const { name, color } = req.body;

    const label = await LabelService.updateLabel(labelId, { name, color });
    res.json({ label });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/workspaces/labels/:labelId - Delete a label
router.delete("/labels/:labelId", async (req: any, res) => {
  try {
    const { labelId } = req.params;
    await LabelService.deleteLabel(labelId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/workspaces/tasks/:taskId/labels/:labelId - Add label to task
router.post("/tasks/:taskId/labels/:labelId", async (req: any, res) => {
  try {
    const { taskId, labelId } = req.params;
    const task = await LabelService.addLabelToTask(taskId, labelId);
    res.json({ task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/workspaces/tasks/:taskId/labels/:labelId - Remove label from task
router.delete("/tasks/:taskId/labels/:labelId", async (req: any, res) => {
  try {
    const { taskId, labelId } = req.params;
    const task = await LabelService.removeLabelFromTask(taskId, labelId);
    res.json({ task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
