import cron from "node-cron";
import prisma from "../lib/prisma";
import logger from "../monitoring/logger";
import RecurringTaskService from "../services/RecurringTaskService";

/**
 * Scheduled task to generate recurring task instances
 * Runs daily at 2 AM
 */
export const startRecurringTaskGeneration = () => {
  // Run daily at 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    logger.info("Starting recurring task instance generation...");

    try {
      // Get all workspaces with active recurring tasks
      const workspaces = await prisma.workspace.findMany({
        where: {
          tasks: {
            some: {
              is_recurring: true,
              parent_recurring_task_id: null, // Only parent tasks
            },
          },
        },
        select: { id: true, name: true },
      });

      logger.info(`Found ${workspaces.length} workspaces with recurring tasks`);

      let totalInstancesCreated = 0;

      for (const workspace of workspaces) {
        try {
          const results =
            await RecurringTaskService.generateInstancesForWorkspace(
              workspace.id,
              2, // Generate instances for next 2 weeks
            );

          const instancesCreated = results.reduce(
            (sum, r) => sum + (r.instancesCreated || 0),
            0,
          );
          totalInstancesCreated += instancesCreated;

          logger.info(
            `Workspace "${workspace.name}": Generated ${instancesCreated} task instances`,
          );
        } catch (err) {
          logger.error(
            `Failed to generate instances for workspace ${workspace.id}:`,
            err,
          );
        }
      }

      logger.info(
        `Recurring task generation complete. Total instances created: ${totalInstancesCreated}`,
      );

      // Clean up old completed instances (older than 90 days)
      try {
        const cleanedCount = await RecurringTaskService.cleanupOldInstances(90);
        logger.info(`Cleaned up ${cleanedCount} old completed task instances`);
      } catch (err) {
        logger.error("Failed to clean up old instances:", err);
      }
    } catch (error) {
      logger.error("Error in recurring task generation job:", error);
    }
  });

  logger.info(
    "Recurring task generation scheduler started (runs daily at 2 AM)",
  );
};
