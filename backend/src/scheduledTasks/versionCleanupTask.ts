import VersionCleanupService from "../services/versionCleanupService";
import logger from "../monitoring/logger";

// Function to clean up old document versions based on subscription plans
async function cleanupOldVersions() {
  try {
    logger.info(
      "Starting cleanup of old document versions based on subscription plans"
    );

    const versionCleanupService = VersionCleanupService.getInstance();
    await versionCleanupService.cleanupAllUsersVersions();

    logger.info("Completed cleanup of old document versions");
  } catch (error) {
    logger.error("Error cleaning up old document versions:", error);
  }
}

// Schedule the cleanup task to run daily at 2 AM (avoiding peak usage hours)
function scheduleVersionCleanupTask() {
  // Run immediately when the server starts (optional, for testing)
  // cleanupOldVersions();

  // Schedule to run daily at 2 AM
  const now = new Date();
  const nextRun = new Date();

  // Set to next 2 AM
  nextRun.setHours(2, 0, 0, 0);

  // If it's already past 2 AM today, set to tomorrow's 2 AM
  if (now.getHours() >= 2) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const timeUntilNextRun = nextRun.getTime() - now.getTime();

  setTimeout(() => {
    // Run the cleanup task
    cleanupOldVersions();

    // Set up interval to run daily
    setInterval(cleanupOldVersions, 24 * 60 * 60 * 1000); // 24 hours
  }, timeUntilNextRun);

  logger.info(
    `Scheduled version cleanup task to run daily at 2 AM. Next run in ${Math.round(timeUntilNextRun / (1000 * 60))} minutes`
  );
}

export { scheduleVersionCleanupTask }; // Export for main server integration
