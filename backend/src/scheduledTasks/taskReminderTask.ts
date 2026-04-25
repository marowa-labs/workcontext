import { TaskReminderService } from "../services/TaskReminderService";
import logger from "../monitoring/logger";

/**
 * Task to check for task due dates and send reminders.
 * Runs every 15 minutes by default.
 */
export function scheduleTaskReminderTask() {
  try {
    logger.info("Initializing task reminder task...");

    // Run immediately on startup
    TaskReminderService.checkDueDates();

    // Schedule to run every 15 minutes
    setInterval(
      () => {
        logger.info("Running scheduled task reminder check...");
        TaskReminderService.checkDueDates();
      },
      15 * 60 * 1000,
    );

    logger.info("Task reminder task scheduled successfully (15m interval)");
  } catch (error) {
    logger.error("Error starting task reminder task:", error);
  }
}
