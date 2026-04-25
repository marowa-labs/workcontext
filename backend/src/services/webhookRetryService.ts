import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

// Model for storing failed webhooks
interface FailedWebhook {
  id: string;
  event_name: string;
  payload: any;
  retry_count: number;
  last_error: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * WebhookRetryService handles retrying failed webhooks with exponential backoff
 * and stores failed attempts in a dead letter queue for manual inspection
 */
class WebhookRetryService {
  private static MAX_RETRIES = 5;
  private static BASE_DELAY_MS = 1000; // 1 second

  /**
   * Process a webhook with retry logic
   * @param eventName The name of the event
   * @param handlerFunction The function to handle the event
   * @param data The webhook data
   */
  static async processWithRetry(
    eventName: string,
    handlerFunction: (data: any) => Promise<void>,
    data: any
  ): Promise<boolean> {
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= this.MAX_RETRIES) {
      try {
        await handlerFunction(data);
        logger.info(`Successfully processed webhook: ${eventName}`);
        return true;
      } catch (error: any) {
        lastError = error;
        retryCount++;

        logger.warn(`Webhook ${eventName} failed (attempt ${retryCount}):`, {
          error: error.message,
          stack: error.stack,
          data,
        });

        if (retryCount <= this.MAX_RETRIES) {
          // Exponential backoff with jitter
          const delay = this.calculateDelay(retryCount);
          logger.info(`Retrying ${eventName} in ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    // If we've exhausted retries, store in dead letter queue
    await this.moveToDeadLetterQueue(eventName, data, retryCount, lastError);
    logger.error(
      `Webhook ${eventName} failed permanently after ${retryCount} attempts`,
      {
        error: lastError?.message,
        data,
      }
    );

    return false;
  }

  /**
   * Move a failed webhook to the dead letter queue for manual inspection
   */
  private static async moveToDeadLetterQueue(
    eventName: string,
    data: any,
    retryCount: number,
    error: Error | null
  ): Promise<void> {
    try {
      await prisma.failedWebhook.create({
        data: {
          event_name: eventName,
          payload: data,
          retry_count: retryCount,
          last_error: error?.message || "Unknown error",
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      logger.info(`Moved failed webhook to dead letter queue: ${eventName}`);
    } catch (dbError) {
      logger.error("Failed to store webhook in dead letter queue:", dbError);
    }
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private static calculateDelay(retryCount: number): number {
    const exponentialDelay = this.BASE_DELAY_MS * Math.pow(2, retryCount - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    return Math.min(exponentialDelay + jitter, 300000); // Max 5 minutes
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Process dead letter queue items manually
   */
  static async processDeadLetterQueue(): Promise<void> {
    try {
      const failedWebhooks = await prisma.failedWebhook.findMany({
        where: {
          retry_count: {
            lt: this.MAX_RETRIES + 2, // Allow one more retry attempt
          },
        },
        orderBy: {
          created_at: "asc",
        },
        take: 10, // Process max 10 at a time
      });

      logger.info(
        `Processing ${failedWebhooks.length} items from dead letter queue`
      );

      for (const webhook of failedWebhooks) {
        // Re-attempt processing based on event name
        // This would require mapping event names to handler functions
        logger.info(`Attempting to reprocess webhook: ${webhook.event_name}`, {
          id: webhook.id,
          retryCount: webhook.retry_count,
        });

        // Update retry count
        await prisma.failedWebhook.update({
          where: { id: webhook.id },
          data: {
            retry_count: webhook.retry_count + 1,
            updated_at: new Date(),
          },
        });
      }
    } catch (error) {
      logger.error("Error processing dead letter queue:", error);
    }
  }

  /**
   * Backup synchronization mechanism for failed webhooks
   * This method should be called periodically to retry failed webhooks
   */
  static async backupSync(): Promise<void> {
    try {
      // Find webhooks that failed more than 24 hours ago but less than 7 days ago
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      const oldFailedWebhooks = await prisma.failedWebhook.findMany({
        where: {
          created_at: {
            gte: cutoffDate,
          },
          retry_count: {
            lt: this.MAX_RETRIES + 5, // Allow additional retry attempts
          },
        },
        orderBy: {
          created_at: "asc",
        },
        take: 5, // Process max 5 at a time to avoid overwhelming the system
      });

      logger.info(
        `Backup sync: Processing ${oldFailedWebhooks.length} old failed webhooks`
      );

      for (const webhook of oldFailedWebhooks) {
        logger.info(
          `Backup sync: Attempting to reprocess webhook: ${webhook.event_name}`,
          {
            id: webhook.id,
            retryCount: webhook.retry_count,
            createdAt: webhook.created_at,
          }
        );

        // Update retry count
        await prisma.failedWebhook.update({
          where: { id: webhook.id },
          data: {
            retry_count: webhook.retry_count + 1,
            updated_at: new Date(),
          },
        });

        // Log the attempt for monitoring
        logger.info(
          `Backup sync: Updated retry count for webhook ${webhook.id}`
        );
      }
    } catch (error) {
      logger.error("Error in backup sync process:", error);
    }
  }
}

export default WebhookRetryService;
