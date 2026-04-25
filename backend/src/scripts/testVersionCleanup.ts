import VersionCleanupService from "../services/versionCleanupService";
import logger from "../monitoring/logger";
import { prisma } from "../lib/prisma";

/**
 * Test script to manually trigger version cleanup for a specific user
 * This is useful for testing the implementation without waiting for the scheduled task
 */

async function testVersionCleanup(userId?: string) {
  try {
    logger.info("Starting manual version cleanup test");

    const versionCleanupService = VersionCleanupService.getInstance();

    if (userId) {
      // Test cleanup for a specific user
      logger.info(`Testing version cleanup for user: ${userId}`);
      const result = await versionCleanupService.cleanupUserVersions(userId);
      logger.info(`Cleanup result for user ${userId}:`, result);
    } else {
      // Test cleanup for all users
      logger.info("Testing version cleanup for all users");
      await versionCleanupService.cleanupAllUsersVersions();
      logger.info("Completed cleanup for all users");
    }
  } catch (error) {
    logger.error("Error during manual version cleanup test:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Get user ID from command line arguments if provided
const userId = process.argv[2];

testVersionCleanup(userId);
