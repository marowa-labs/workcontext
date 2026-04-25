import { CollaboratorPresenceService } from "../services/collaboratorPresenceService";
import logger from "../monitoring/logger";

// Function to clean up stale presence records
async function cleanupStalePresence() {
  try {
    logger.info("Starting cleanup of stale collaborator presence records");
    const deletedCount =
      await CollaboratorPresenceService.cleanupStalePresence(30); // Clean up records older than 30 minutes
    logger.info(
      `Cleaned up ${deletedCount} stale collaborator presence records`
    );
  } catch (error) {
    logger.error(
      "Error cleaning up stale collaborator presence records:",
      error
    );
  }
}

// Schedule the cleanup task to run every 15 minutes
function scheduleCleanupTask() {
  // Run immediately when the server starts
  cleanupStalePresence();

  // Schedule to run every 15 minutes
  setInterval(cleanupStalePresence, 15 * 60 * 1000); // 15 minutes

  logger.info(
    `Scheduled collaborator presence cleanup task to run every 15 minutes`
  );
}

export { scheduleCleanupTask };
