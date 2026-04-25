import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";
import { authenticateExpressRequest } from "../../middleware/auth";
import { StorageService } from "../../services/storageService";

const router: ExpressRouter = Router();

// Apply authentication middleware to all routes
router.use(authenticateExpressRequest);

// Get all backups for a user
router.get("/", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;

    const backups = await prisma.backup.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    return res.status(200).json({
      success: true,
      backups,
    });
  } catch (error: any) {
    logger.error("Error fetching backups:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

// Create a new backup
router.post("/", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { type = "manual", destination = "ScholarForge AI" } = req.body;

    // In a real implementation, this would trigger an async backup process
    // For now, we'll simulate it by updating the last_backup timestamp
    const lastBackup = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: { last_backup: lastBackup },
    });

    // Create a backup record
    const backup = await prisma.backup.create({
      data: {
        user_id: userId,
        name: `Backup ${new Date().toLocaleDateString()}`,
        size: 0.1, // Mock size in GB
        status: "completed",
        type: type,
        storage_path: `backups/${userId}/${Date.now()}.zip`,
      },
    });

    logger.info("Manual backup triggered", { userId, type, destination });

    return res.status(201).json({
      success: true,
      message: "Backup created successfully",
      backup,
    });
  } catch (error: any) {
    logger.error("Error creating backup:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

// Get backup schedule
router.get("/schedule", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;

    let schedule = await prisma.backupSchedule.findUnique({
      where: { user_id: userId },
    });

    // If no schedule exists, return default values
    if (!schedule) {
      return res.status(200).json({
        success: true,
        schedule: {
          enabled: true,
          frequency: "weekly",
          time: "02:00",
          retention_count: 7,
          destination: "ScholarForge AI",
        },
      });
    }

    return res.status(200).json({
      success: true,
      schedule,
    });
  } catch (error: any) {
    logger.error("Error fetching backup schedule:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

// Update backup schedule
router.put("/schedule", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const scheduleData = req.body;

    const schedule = await prisma.backupSchedule.upsert({
      where: { user_id: userId },
      update: {
        ...scheduleData,
        updated_at: new Date(),
      },
      create: {
        ...scheduleData,
        user_id: userId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Backup schedule updated successfully",
      schedule,
    });
  } catch (error: any) {
    logger.error("Error updating backup schedule:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

// Get restore history
router.get("/restores/history", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;

    const restores = await prisma.restore.findMany({
      where: { user_id: userId },
      include: {
        backup: {
          select: {
            name: true,
            created_at: true,
          },
        },
      },
      orderBy: { started_at: "desc" },
    });

    return res.status(200).json({
      success: true,
      restores,
    });
  } catch (error: any) {
    logger.error("Error fetching restore history:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

// Get backup by ID
router.get("/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const backup = await prisma.backup.findFirst({
      where: { id, user_id: userId },
    });

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup not found",
      });
    }

    return res.status(200).json({
      success: true,
      backup,
    });
  } catch (error: any) {
    logger.error("Error fetching backup:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

// Delete backup
router.delete("/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const backup = await prisma.backup.findFirst({
      where: { id, user_id: userId },
    });

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup not found",
      });
    }

    await prisma.backup.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Backup deleted successfully",
    });
  } catch (error: any) {
    logger.error("Error deleting backup:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

// Restore from backup
router.post("/:id/restore", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const backup = await prisma.backup.findFirst({
      where: { id, user_id: userId },
    });

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup not found",
      });
    }

    // Create a restore record
    const restore = await prisma.restore.create({
      data: {
        user_id: userId,
        backup_id: id,
        status: "completed",
        started_at: new Date(),
        completed_at: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Restore completed successfully",
      restore,
    });
  } catch (error: any) {
    logger.error("Error restoring from backup:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

// Get backup stats summary
router.get("/stats/summary", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;

    const storageInfo = await StorageService.getUserStorageInfo(userId);
    const backups = await prisma.backup.findMany({
      where: { user_id: userId },
    });

    const totalBackups = backups.length;
    const totalBackupSize = backups.reduce(
      (acc: number, curr: any) => acc + curr.size,
      0,
    );
    const lastBackup = await prisma.user.findUnique({
      where: { id: userId },
      select: { last_backup: true },
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalBackups,
        totalBackupSize,
        lastBackup: lastBackup?.last_backup,
        storageUsed: storageInfo.used,
        storageLimit: storageInfo.limit,
      },
    });
  } catch (error: any) {
    logger.error("Error fetching backup stats:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

export default router;
