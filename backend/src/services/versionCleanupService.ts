import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";
import { SubscriptionService } from "./subscriptionService";

// Version Cleanup Service
class VersionCleanupService {
  private static instance: VersionCleanupService;

  private constructor() {}

  static getInstance(): VersionCleanupService {
    if (!VersionCleanupService.instance) {
      VersionCleanupService.instance = new VersionCleanupService();
    }
    return VersionCleanupService.instance;
  }

  /**
   * Clean up old document versions based on user's subscription plan
   * @param userId The user ID to clean up versions for
   */
  async cleanupUserVersions(
    userId: string
  ): Promise<{ count: number; freedSpace: number }> {
    try {
      logger.info(`Starting version cleanup for user: ${userId}`);

      // Get user's subscription info to determine retention policy
      const subscriptionInfo =
        await SubscriptionService.getUserPlanInfo(userId);
      const planId = subscriptionInfo.plan.id;

      // Determine retention period based on plan
      let retentionDays: number;
      switch (planId) {
        case "free":
          retentionDays = 7; // 7 days for free plan
          break;
        case "onetime":
          retentionDays = 30; // 30 days for one-time plan
          break;
        case "student":
          retentionDays = 30; // 30 days for student plan
          break;
        case "researcher":
        // case "institutional":
          retentionDays = -1; // Unlimited for paid plans
          break;
        default:
          retentionDays = 7; // Default to 7 days
      }

      // If unlimited retention, no need to clean up
      if (retentionDays === -1) {
        logger.info(
          `User ${userId} has unlimited version retention, skipping cleanup`
        );
        return { count: 0, freedSpace: 0 };
      }

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      logger.info(
        `Cleaning up versions older than ${retentionDays} days (before ${cutoffDate.toISOString()}) for user ${userId}`
      );

      // Get all projects for this user
      const userProjects = await prisma.project.findMany({
        where: {
          user_id: userId,
        },
        select: {
          id: true,
        },
      });

      let totalDeleted = 0;
      let totalFreedSpace = 0;

      // Process each project
      for (const project of userProjects) {
        // For each project, keep only versions newer than cutoff date
        // But always keep at least the original version (first version)
        const versionsToDelete = await prisma.documentVersion.findMany({
          where: {
            project_id: project.id,
            created_at: {
              lt: cutoffDate,
            },
            version: {
              gt: 1, // Always keep the first version (version 1)
            },
          },
          orderBy: {
            version: "asc", // Delete oldest versions first
          },
        });

        if (versionsToDelete.length > 0) {
          logger.info(
            `Found ${versionsToDelete.length} versions to delete for project ${project.id}`
          );

          // Estimate freed space
          let freedSpace = 0;
          for (const version of versionsToDelete) {
            // Estimate file size based on word count (rough approximation)
            // Average word size is about 6 characters + 1 space = 7 bytes
            // Add some overhead for document formatting
            const estimatedFileSize = (version.word_count || 0) * 7 * 1.5; // 1.5x overhead factor
            freedSpace += estimatedFileSize / (1024 * 1024 * 1024); // Convert to GB
          }

          // Delete the versions from database
          await prisma.documentVersion.deleteMany({
            where: {
              id: {
                in: versionsToDelete.map((v: { id: string }) => v.id),
              },
            },
          });

          totalDeleted += versionsToDelete.length;
          totalFreedSpace += freedSpace;

          logger.info(
            `Deleted ${versionsToDelete.length} versions for project ${project.id}, freed ~${freedSpace.toFixed(4)} GB`
          );
        }
      }

      logger.info(
        `Completed version cleanup for user ${userId}: deleted ${totalDeleted} versions, freed ~${totalFreedSpace.toFixed(4)} GB`
      );

      return {
        count: totalDeleted,
        freedSpace: totalFreedSpace,
      };
    } catch (error) {
      logger.error(`Error during version cleanup for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old versions for all users
   */
  async cleanupAllUsersVersions(): Promise<void> {
    try {
      logger.info("Starting cleanup for all users");

      // Get all users who have document versions
      const usersWithVersions = await prisma.documentVersion.groupBy({
        by: ["user_id"],
        _count: {
          id: true,
        },
        having: {
          id: {
            _count: {
              gt: 0,
            },
          },
        },
      });

      logger.info(
        `Found ${usersWithVersions.length} users with document versions`
      );

      let totalDeleted = 0;
      let totalUsersProcessed = 0;

      // Process each user
      for (const userGroup of usersWithVersions) {
        try {
          const result = await this.cleanupUserVersions(userGroup.user_id);
          totalDeleted += result.count;
          totalUsersProcessed++;

          // Log progress every 10 users
          if (totalUsersProcessed % 10 === 0) {
            logger.info(
              `Processed ${totalUsersProcessed}/${usersWithVersions.length} users, deleted ${totalDeleted} versions so far`
            );
          }
        } catch (error) {
          logger.error(
            `Error cleaning up versions for user ${userGroup.user_id}:`,
            error
          );
          // Continue with other users
        }
      }

      logger.info(
        `Completed cleanup for all users: processed ${totalUsersProcessed} users, deleted ${totalDeleted} versions`
      );
    } catch (error) {
      logger.error("Error during cleanup for all users:", error);
      throw error;
    }
  }
}

export default VersionCleanupService;
