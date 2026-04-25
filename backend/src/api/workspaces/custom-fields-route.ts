import { Router } from "express";
import { WorkspaceTaskService } from "../../services/workspaceTaskService";
import logger from "../../monitoring/logger";

const router = Router({ mergeParams: true });

/**
 * Get custom field definitions for a workspace
 */
router.get("/", async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID is required" });
    }

    const fields =
      await WorkspaceTaskService.getCustomFieldDefinitions(workspaceId);
    return res.json({ success: true, fields });
  } catch (error: any) {
    logger.error("Error fetching custom field definitions:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Create a custom field definition
 */
router.post("/", async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, type, options } = req.body;

    if (!workspaceId || !name || !type) {
      return res
        .status(400)
        .json({ error: "Workspace ID, name, and type are required" });
    }

    const field = await WorkspaceTaskService.createCustomFieldDefinition(
      workspaceId,
      {
        name,
        type,
        options,
      },
    );
    return res.status(201).json({ success: true, field });
  } catch (error: any) {
    logger.error("Error creating custom field definition:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Delete a custom field definition
 */
router.delete("/definitions/:fieldId", async (req: any, res) => {
  try {
    const { fieldId } = req.params;
    if (!fieldId) {
      return res.status(400).json({ error: "Field ID is required" });
    }

    await WorkspaceTaskService.deleteCustomFieldDefinition(fieldId);
    return res.json({ success: true });
  } catch (error: any) {
    logger.error("Error deleting custom field definition:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
