import { RecycleBinService } from "../services/recycleBinService";
import logger from "../monitoring/logger";

// Function to clean up expired items from the recycle bin
async function cleanupExpiredItems() {
  try {
    logger.info("Starting cleanup of expired recycle bin items");
    const deletedCount = await RecycleBinService.deleteExpiredItems();
    logger.info(`Cleaned up ${deletedCount} expired recycle bin items`);
  } catch (error) {
    logger.error("Error cleaning up expired recycle bin items:", error);
  }
}

// Schedule the cleanup task to run daily at midnight
function scheduleCleanupTask() {
  // Run immediately when the server starts
  cleanupExpiredItems();

  // Schedule to run daily at midnight (00:00)
  const now = new Date();
  const nextRun = new Date();
  nextRun.setHours(24, 0, 0, 0); // Next midnight
  const timeUntilNextRun = nextRun.getTime() - now.getTime();

  setTimeout(() => {
    // Run the cleanup task
    cleanupExpiredItems();

    // Set up interval to run daily
    setInterval(cleanupExpiredItems, 24 * 60 * 60 * 1000); // 24 hours
  }, timeUntilNextRun);

  logger.info(`Scheduled recycle bin cleanup task to run daily at midnight`);
}

export { scheduleCleanupTask };
