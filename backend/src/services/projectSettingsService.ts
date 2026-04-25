import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

// Define the project settings data structure
export interface ProjectSettingsData {
  default_citation_style?: string;
  auto_save_enabled?: boolean;
  auto_backup_enabled?: boolean;
  backup_frequency_hours?: number;
  collaboration_notifications?: boolean;
  deadline_reminders?: boolean;
  word_count_goal?: number;
  daily_word_target?: number;
  export_format?: string;
  include_citations_in_export?: boolean;
  include_comments_in_export?: boolean;
}

export class ProjectSettingsService {
  // Get user's project settings
  static async getUserProjectSettings(userId: string) {
    try {
      logger.info("Getting user project settings", { userId });

      // Check if user has project settings
      let settings = await prisma.projectSettings.findUnique({
        where: { user_id: userId },
      });

      // If no settings exist, create default settings
      if (!settings) {
        settings = await prisma.projectSettings.create({
          data: {
            user_id: userId,
            default_citation_style: "apa",
            auto_save_enabled: true,
            auto_backup_enabled: true,
            backup_frequency_hours: 1,
            collaboration_notifications: true,
            deadline_reminders: true,
            word_count_goal: 0,
            daily_word_target: 500,
            export_format: "pdf",
            include_citations_in_export: true,
            include_comments_in_export: true,
          },
        });
      }

      logger.info("User project settings retrieved successfully", { userId });
      return settings;
    } catch (error) {
      logger.error("Error getting user project settings", { error, userId });
      throw new Error(
        `Failed to get user project settings: ${(error as Error).message}`
      );
    }
  }

  // Update user's project settings
  static async updateUserProjectSettings(
    userId: string,
    settingsData: ProjectSettingsData
  ) {
    try {
      logger.info("Updating user project settings", { userId, settingsData });

      // Update or create project settings for user
      const settings = await prisma.projectSettings.upsert({
        where: { user_id: userId },
        update: settingsData,
        create: {
          user_id: userId,
          ...settingsData,
        },
      });

      logger.info("User project settings updated successfully", { userId });
      return settings;
    } catch (error) {
      logger.error("Error updating user project settings", {
        error,
        userId,
        settingsData,
      });
      throw new Error(
        `Failed to update user project settings: ${(error as Error).message}`
      );
    }
  }

  // Reset user's project settings to defaults
  static async resetUserProjectSettings(userId: string) {
    try {
      logger.info("Resetting user project settings", { userId });

      // Delete existing settings
      await prisma.projectSettings.deleteMany({
        where: { user_id: userId },
      });

      // Create new default settings
      const settings = await prisma.projectSettings.create({
        data: {
          user_id: userId,
          default_citation_style: "apa",
          auto_save_enabled: true,
          auto_backup_enabled: true,
          backup_frequency_hours: 1,
          collaboration_notifications: true,
          deadline_reminders: true,
          word_count_goal: 0,
          daily_word_target: 500,
          export_format: "pdf",
          include_citations_in_export: true,
          include_comments_in_export: true,
        },
      });

      logger.info("User project settings reset successfully", { userId });
      return settings;
    } catch (error) {
      logger.error("Error resetting user project settings", { error, userId });
      throw new Error(
        `Failed to reset user project settings: ${(error as Error).message}`
      );
    }
  }
}
