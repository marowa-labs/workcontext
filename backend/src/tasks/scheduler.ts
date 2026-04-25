import { updateAllLeaderboards } from "./updateLeaderboard";
import logger from "../monitoring/logger";
import WebhookRetryService from "../services/webhookRetryService";

// Simple in-memory scheduler
class TaskScheduler {
  private static instance: TaskScheduler;
  private tasks: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): TaskScheduler {
    if (!TaskScheduler.instance) {
      TaskScheduler.instance = new TaskScheduler();
    }
    return TaskScheduler.instance;
  }

  // Schedule a task to run at a specific interval
  scheduleTask(name: string, task: () => Promise<void>, intervalMs: number) {
    // Clear existing task if it exists
    if (this.tasks.has(name)) {
      clearInterval(this.tasks.get(name)!);
    }

    // Schedule the task
    const intervalId = setInterval(async () => {
      try {
        logger.info(`Running scheduled task: ${name}`);
        await task();
      } catch (error) {
        logger.error(`Error in scheduled task ${name}:`, error);
      }
    }, intervalMs);

    // Store the interval ID
    this.tasks.set(name, intervalId);

    logger.info(`Scheduled task ${name} to run every ${intervalMs}ms`);
  }

  // Stop a scheduled task
  stopTask(name: string) {
    if (this.tasks.has(name)) {
      clearInterval(this.tasks.get(name)!);
      this.tasks.delete(name);
      logger.info(`Stopped scheduled task: ${name}`);
    }
  }

  // Stop all scheduled tasks
  stopAllTasks() {
    for (const [name, intervalId] of this.tasks.entries()) {
      clearInterval(intervalId);
      logger.info(`Stopped scheduled task: ${name}`);
    }
    this.tasks.clear();
  }
}

// Initialize the scheduler
const scheduler = TaskScheduler.getInstance();

// Schedule leaderboard updates every hour
scheduler.scheduleTask(
  "updateLeaderboards",
  updateAllLeaderboards,
  60 * 60 * 1000,
); // 1 hour

// Schedule backup sync for failed webhooks every hour
scheduler.scheduleTask(
  "backupSyncFailedWebhooks",
  WebhookRetryService.backupSync,
  60 * 60 * 1000,
); // 1 hour

// Export for use in other modules
export default scheduler;
