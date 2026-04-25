import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";
import { StorageService } from "../../services/storageService";

// Get storage information for a user
export async function GET_STORAGE(request: Request & { user?: any }) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User not authenticated",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get user's storage information using the new service
    const storageInfo = await StorageService.getUserStorageInfo(userId);

    return new Response(
      JSON.stringify({
        success: true,
        storageInfo,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error fetching storage info:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Clean up storage based on user options
export async function POST_CLEANUP(request: Request & { user?: any }) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User not authenticated",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await request.json();
    const { oldExports, oldDrafts, oldBackups, oldVersions } = body;

    let freedSpace = 0;
    const cleanupActions: string[] = [];

    // Clean up old exports
    if (oldExports) {
      logger.info("Cleaning up old exports for user", { userId });
      const exportCleanupResult =
        await StorageService.cleanupOldExports(userId);
      freedSpace += exportCleanupResult.freedSpace;
      cleanupActions.push(
        `Cleaned up ${exportCleanupResult.count} old exports`,
      );
    }

    // Clean up old drafts
    if (oldDrafts) {
      logger.info("Cleaning up old drafts for user", { userId });
      const draftCleanupResult = await StorageService.cleanupOldDrafts(userId);
      freedSpace += draftCleanupResult.freedSpace;
      cleanupActions.push(`Cleaned up ${draftCleanupResult.count} old drafts`);
    }

    // Clean up old backups
    if (oldBackups) {
      logger.info("Cleaning up old backups for user", { userId });
      const backupCleanupResult =
        await StorageService.cleanupOldBackups(userId);
      freedSpace += backupCleanupResult.freedSpace;
      cleanupActions.push(
        `Cleaned up ${backupCleanupResult.count} old backups`,
      );
    }

    // Clean up old document versions
    if (oldVersions) {
      logger.info("Cleaning up old document versions for user", { userId });
      const versionCleanupResult =
        await StorageService.cleanupOldVersions(userId);
      freedSpace += versionCleanupResult.freedSpace;
      cleanupActions.push(
        `Cleaned up ${versionCleanupResult.count} old versions`,
      );
    }

    // Update user's storage usage in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        storage_used: true,
      },
    });

    if (user) {
      const newStorageUsed = Math.max(0, (user.storage_used || 0) - freedSpace);
      await prisma.user.update({
        where: { id: userId },
        data: {
          storage_used: newStorageUsed,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Storage cleaned up successfully",
        freedSpace,
        actions: cleanupActions,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error cleaning up storage:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Analyze storage usage
export async function POST_ANALYZE(request: Request & { user?: any }) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User not authenticated",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Perform storage analysis
    const analysis = await StorageService.analyzeStorageUsage(userId);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error analyzing storage:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Get detailed storage breakdown
export async function GET_BREAKDOWN(request: Request & { user?: any }) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User not authenticated",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get detailed storage breakdown
    const breakdown = await StorageService.getDetailedStorageBreakdown(userId);

    return new Response(
      JSON.stringify({
        success: true,
        breakdown,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error getting storage breakdown:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Monitor storage thresholds
export async function POST_MONITOR(request: Request & { user?: any }) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User not authenticated",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Monitor storage thresholds
    await StorageService.monitorStorageThresholds(userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Storage thresholds monitored successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error monitoring storage thresholds:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
