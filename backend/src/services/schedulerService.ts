import WebhookRetryService from "./webhookRetryService";
import logger from "../monitoring/logger";

/**
 * SchedulerService handles periodic tasks for the application
 */

class SchedulerService {
  private static instance: SchedulerService;
  private intervals: NodeJS.Timeout[] = [];

  private constructor() {}

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * Start all scheduled tasks
   */
  start(): void {
    logger.info("Starting scheduler service");

    // Run backup sync every hour
    const backupSyncInterval = setInterval(
      () => {
        this.runBackupSync();
      },
      60 * 60 * 1000
    ); // 1 hour

    this.intervals.push(backupSyncInterval);

    // Run cleanup of old failed webhooks daily
    const cleanupInterval = setInterval(
      () => {
        this.cleanupOldFailedWebhooks();
      },
      24 * 60 * 60 * 1000
    ); // 24 hours

    this.intervals.push(cleanupInterval);

    logger.info("Scheduler service started with 2 tasks");
  }

  /**
   * Stop all scheduled tasks
   */
  stop(): void {
    logger.info("Stopping scheduler service");

    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });

    this.intervals = [];
    logger.info("Scheduler service stopped");
  }

  /**
   * Run backup sync for failed webhooks
   */
  private async runBackupSync(): Promise<void> {
    try {
      logger.info("Running backup sync for failed webhooks");
      await WebhookRetryService.backupSync();
      logger.info("Backup sync completed");
    } catch (error) {
      logger.error("Error running backup sync:", error);
    }
  }

  /**
   * Cleanup old failed webhooks (older than 30 days)
   */
  private async cleanupOldFailedWebhooks(): Promise<void> {
    try {
      logger.info("Cleaning up old failed webhooks");

      // Import prisma here to avoid circular dependencies
      const { prisma } = await import("../lib/prisma");

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const result = await prisma.failedWebhook.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${result.count} old failed webhooks`);
    } catch (error) {
      logger.error("Error cleaning up old failed webhooks:", error);
    }
  }

  /**
   * Run backup sync manually (for testing or manual triggering)
   */
  async runBackupSyncManually(): Promise<void> {
    await this.runBackupSync();
  }

  /**
   * Run cleanup manually (for testing or manual triggering)
   */
  async runCleanupManually(): Promise<void> {
    await this.cleanupOldFailedWebhooks();
  }
}

export default SchedulerService;
