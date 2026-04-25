import { Router, type Router as ExpressRouter } from "express";
import { PrivacySettingsService } from "../../services/privacySettingsService";
import { ComplianceService } from "../../services/complianceService";

const router: ExpressRouter = Router();

// Get privacy settings for the authenticated user
router.get("/settings", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    const settings = await PrivacySettingsService.getSettings(userId);

    return res.json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching privacy settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch privacy settings",
    });
  }
});

// Update privacy settings for the authenticated user
router.post("/settings", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;
    const settings = req.body;

    const updatedSettings = await PrivacySettingsService.updateSettings(
      userId,
      settings,
    );

    return res.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update privacy settings",
    });
  }
});

// Export user data
router.get("/export", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const data = await ComplianceService.exportUserData(userId);

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error exporting data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export data",
    });
  }
});

// Request account deletion
router.post("/delete-request", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const result = await ComplianceService.requestAccountDeletion(userId);

    return res.json(result);
  } catch (error) {
    console.error("Error requesting deletion:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process request",
    });
  }
});

// Get audit logs
router.get("/audit-logs", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const logs = await ComplianceService.getAuditLogs(userId);

    return res.json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
});

export default router;
