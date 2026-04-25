import VersionSchedulerService from "../services/versionSchedulerService";
import logger from "../monitoring/logger";

/**
 * Task to initialize and start the version scheduler
 * This checks for due version schedules every minute
 */
export function scheduleVersionSchedulingTask() {
  try {
    logger.info("Initializing version scheduling task...");

    // Start the scheduler service
    // It has its own internal interval of 60 seconds
    VersionSchedulerService.start();

    logger.info("Version scheduling task started successfully");
  } catch (error) {
    logger.error("Error starting version scheduling task:", error);
  }
}
