import ProjectService from "./projectService";

// Version Scheduler Utility
class VersionScheduler {
  constructor() {
    // Remove client-side scheduling since we're using backend scheduling
  }

  // Schedule automatic version creation - now uses backend API
  async scheduleVersionCreation(projectId, frequency) {
    try {
      console.log(
        "VersionScheduler: Scheduling version creation for project:",
        projectId,
        frequency
      );

      // Use the ProjectService to create a version schedule via backend API
      const schedule = await ProjectService.createVersionSchedule(projectId, {
        frequency,
      });

      console.log(
        `VersionScheduler: Scheduled version creation for project ${projectId}`
      );

      return {
        success: true,
        message: `Version creation scheduled for project ${projectId}`,
        schedule: schedule,
      };
    } catch (error) {
      console.error(
        "VersionScheduler: Error scheduling version creation:",
        error
      );
      throw error;
    }
  }

  // Cancel scheduled version creation - now uses backend API
  async cancelScheduledVersionCreation(projectId) {
    try {
      // First, we need to get the existing schedules to find the schedule ID to delete
      const schedules = await ProjectService.getVersionSchedules(projectId);

      if (schedules && schedules.length > 0) {
        // Delete the first (and typically only) schedule
        const scheduleId = schedules[0].id;
        await ProjectService.deleteVersionSchedule(scheduleId);

        console.log(
          `VersionScheduler: Cancelled scheduled version creation for project ${projectId}`
        );

        return {
          success: true,
          message: `Cancelled scheduled version creation for project ${projectId}`,
        };
      } else {
        return {
          success: false,
          message: `No scheduled version creation found for project ${projectId}`,
        };
      }
    } catch (error) {
      console.error(
        "VersionScheduler: Error cancelling scheduled version creation:",
        error
      );
      throw error;
    }
  }

  // Get all scheduled tasks for a project
  async getScheduledTasks(projectId) {
    try {
      const schedules = await ProjectService.getVersionSchedules(projectId);
      return schedules || [];
    } catch (error) {
      console.error("VersionScheduler: Error getting scheduled tasks:", error);
      return [];
    }
  }

  // Get interval in milliseconds based on frequency
  getIntervalMs(frequency) {
    switch (frequency) {
      case "30min":
        return 30 * 60 * 1000; // 30 minutes
      case "hourly":
        return 60 * 60 * 1000; // 1 hour
      case "daily":
        return 24 * 60 * 60 * 1000; // 1 day
      case "weekly":
        return 7 * 24 * 60 * 60 * 1000; // 1 week
      case "monthly":
        return 30 * 24 * 60 * 60 * 1000; // ~1 month
      default:
        return 30 * 60 * 1000; // Default to 30 minutes
    }
  }

  // Get next run time for a project
  async getNextRunTime(projectId) {
    try {
      const schedules = await this.getScheduledTasks(projectId);
      if (schedules && schedules.length > 0) {
        return schedules[0].next_run ? new Date(schedules[0].next_run) : null;
      }
      return null;
    } catch (error) {
      console.error("VersionScheduler: Error getting next run time:", error);
      return null;
    }
  }

  // Get schedule frequency for a project
  async getScheduleFrequency(projectId) {
    try {
      const schedules = await this.getScheduledTasks(projectId);
      if (schedules && schedules.length > 0) {
        return schedules[0].frequency;
      }
      return null;
    } catch (error) {
      console.error(
        "VersionScheduler: Error getting schedule frequency:",
        error
      );
      return null;
    }
  }
}

// Export singleton instance
const versionScheduler = new VersionScheduler();
export default versionScheduler;
