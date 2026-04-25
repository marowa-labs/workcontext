import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";
import { EditorService } from "./editorService";

// Version Scheduler Service
class VersionSchedulerService {
  private static instance: VersionSchedulerService;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60 * 1000; // Check every minute

  private constructor() {}

  static getInstance(): VersionSchedulerService {
    if (!VersionSchedulerService.instance) {
      VersionSchedulerService.instance = new VersionSchedulerService();
    }
    return VersionSchedulerService.instance;
  }

  // Start the scheduler
  start() {
    if (this.intervalId) {
      logger.info("Version scheduler is already running");
      return;
    }

    logger.info("Starting version scheduler");
    this.intervalId = setInterval(() => {
      this.processScheduledVersions().catch((error) => {
        logger.error("Error processing scheduled versions:", error);
      });
    }, this.CHECK_INTERVAL);
  }

  // Stop the scheduler
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("Stopped version scheduler");
    }
  }

  // Process scheduled versions that are due
  private async processScheduledVersions() {
    try {
      const now = new Date();

      // Find all enabled schedules that are due
      const dueSchedules = await prisma.versionSchedule.findMany({
        where: {
          enabled: true,
          next_run: {
            lte: now,
          },
        },
        include: {
          project: {
            include: {
              user: true,
            },
          },
        },
      });

      if (dueSchedules.length === 0) {
        return;
      }

      logger.info(`Processing ${dueSchedules.length} scheduled versions`);

      // Process each due schedule
      for (const schedule of dueSchedules) {
        try {
          await this.processSchedule(schedule);
        } catch (error) {
          logger.error(`Error processing schedule ${schedule.id}:`, error);
        }
      }

      // Process default (30-min) schedules for projects without explicit settings
      await this.processDefaultSchedules();
    } catch (error) {
      logger.error("Error in processScheduledVersions:", error);
    }
  }

  // Process default 30-minute versioning for projects without explicit schedules
  private async processDefaultSchedules() {
    try {
      const now = new Date();
      // Find projects updated in the last 12 hours that don't have explicit schedules
      const activeThreshold = new Date(now.getTime() - 12 * 60 * 60 * 1000);

      const projectsToProcess = await prisma.project.findMany({
        where: {
          updated_at: {
            gte: activeThreshold,
          },
          version_schedules: {
            none: {}, // No explicit schedules set
          },
        },
        include: {
          document_versions: {
            orderBy: {
              created_at: "desc",
            },
            take: 1,
          },
        },
      });

      if (projectsToProcess.length === 0) {
        return;
      }

      logger.info(
        `Checking default 1-hr versioning for ${projectsToProcess.length} active projects`,
      );

      for (const project of projectsToProcess) {
        try {
          const lastVersion = project.document_versions[0];
          const lastVersionAt = lastVersion
            ? new Date(lastVersion.created_at)
            : null;

          // Initial quick checks to avoid calling EditorService.shouldCreateNewVersion unnecessarily
          const hasChanges =
            !lastVersionAt || new Date(project.updated_at) > lastVersionAt;
          const isTimeDue =
            !lastVersionAt ||
            now.getTime() - lastVersionAt.getTime() >= 60 * 60 * 1000;

          if (!hasChanges || !isTimeDue) {
            continue;
          }

          // Double check with shouldCreateNewVersion (which does deeper content analysis)
          const shouldCreate = await EditorService.shouldCreateNewVersion(
            project.id,
            null,
            project.word_count,
            project.content,
          );

          if (shouldCreate) {
            logger.info(
              `Creating default 1-hr version for project ${project.id}`,
            );
            await EditorService.createDocumentVersion(
              project.id,
              project.user_id,
              project.content || {},
              project.word_count || 0,
            );
          }
        } catch (error) {
          logger.error(
            `Error processing default versioning for project ${project.id}:`,
            error,
          );
        }
      }
    } catch (error) {
      logger.error("Error in processDefaultSchedules:", error);
    }
  }

  // Process a single schedule
  private async processSchedule(schedule: any) {
    try {
      logger.info(
        `Processing version schedule ${schedule.id} for project ${schedule.project_id}`,
      );

      // Get the current project content
      const project = await prisma.project.findUnique({
        where: {
          id: schedule.project_id,
        },
        select: {
          content: true,
          word_count: true,
        },
      });

      if (!project) {
        throw new Error(`Project ${schedule.project_id} not found`);
      }

      // Create a document version with actual project content
      await EditorService.createDocumentVersion(
        schedule.project_id,
        schedule.project.user_id,
        project.content || {},
        project.word_count || 0,
      );

      // Update the next run time based on frequency
      const nextRunTime = this.calculateNextRunTime(
        new Date(),
        schedule.frequency,
      );

      await prisma.versionSchedule.update({
        where: {
          id: schedule.id,
        },
        data: {
          next_run: nextRunTime,
        },
      });

      logger.info(`Successfully processed version schedule ${schedule.id}`);
    } catch (error) {
      logger.error(`Error processing schedule ${schedule.id}:`, error);
      throw error;
    }
  }

  // Calculate next run time based on frequency
  private calculateNextRunTime(currentTime: Date, frequency: string): Date {
    const nextRunTime = new Date(currentTime);

    switch (frequency) {
      case "30min":
        nextRunTime.setMinutes(nextRunTime.getMinutes() + 30);
        break;
      case "hourly":
        nextRunTime.setHours(nextRunTime.getHours() + 1);
        break;
      case "daily":
        nextRunTime.setDate(nextRunTime.getDate() + 1);
        break;
      case "weekly":
        nextRunTime.setDate(nextRunTime.getDate() + 7);
        break;
      case "monthly":
        nextRunTime.setMonth(nextRunTime.getMonth() + 1);
        break;
      default:
        // Default to daily
        nextRunTime.setDate(nextRunTime.getDate() + 1);
    }

    return nextRunTime;
  }
}

export default VersionSchedulerService.getInstance();
