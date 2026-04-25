import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";
import { SupabaseStorageService } from "./supabaseStorageService";
import { SubscriptionService } from "./subscriptionService";
import * as archiver from "archiver";
import { SecretsService } from "./secrets-service";

interface StorageInfo {
  used: number;
  limit: number;
  breakdown: {
    documents: number;
    exports: number;
    uploads: number;
    citations: number;
  };
}

interface CleanupResult {
  count: number;
  freedSpace: number;
}

interface StorageBreakdown {
  totalSize: number;
  breakdown: {
    documents: {
      size: number;
      count: number;
      details: Array<{
        id: string;
        title: string;
        wordCount: number;
        size: number;
        lastModified: string;
      }>;
    };
    citations: {
      size: number;
      count: number;
    };
    comments: {
      size: number;
      count: number;
    };
    versions: {
      size: number;
      count: number;
    };
    aiHistory: {
      size: number;
      count: number;
    };
    aiChatMessages: {
      size: number;
      count: number;
    };
    exports: {
      size: number;
      count: number;
      details: Array<{
        id: string;
        size: number;
        createdAt: string;
      }>;
    };
    backups: {
      size: number;
      count: number;
      details: Array<{
        id: string;
        size: number;
        createdAt: string;
      }>;
    };
  };
}

export class StorageService {
  // Get user's storage information using actual Supabase Storage usage
  static async getUserStorageInfo(userId: string): Promise<StorageInfo> {
    try {
      // Get user's storage limit from subscription
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          storage_limit: true,
          user_type: true,
          field_of_study: true,
        },
      });

      // Calculate actual storage usage from Supabase Storage
      const actualStorageUsed =
        await SupabaseStorageService.calculateUserStorageUsage(userId);

      // Get storage breakdown for different file types
      const breakdown = await this.getStorageBreakdownByType(userId);

      // Determine storage limit based on user type
      let storageLimit = user?.storage_limit || 0.1; // Default to 0.1GB if no limit set

      // For researchers, set storage limit to 100GB as requested
      if (
        user?.user_type === "researcher" ||
        user?.field_of_study?.toLowerCase().includes("research")
      ) {
        storageLimit = 100; // 100GB for researchers
      }

      return {
        used: actualStorageUsed,
        limit: storageLimit,
        breakdown,
      };
    } catch (error) {
      logger.error("Error getting user storage info:", error);
      throw error;
    }
  }

  // Get storage breakdown by file type
  static async getStorageBreakdownByType(
    userId: string,
  ): Promise<StorageInfo["breakdown"]> {
    try {
      // Get all files for the user from Supabase Storage
      const files = await SupabaseStorageService.listUserFiles(userId);

      // Initialize breakdown counters
      let documents = 0;
      let exports = 0;
      let uploads = 0;
      let citations = 0;

      // Categorize files based on their names/metadata
      for (const file of files) {
        const fileName = file.name.toLowerCase();
        const fileSizeGB = (file.metadata?.size || 0) / (1024 * 1024 * 1024);

        if (
          fileName.includes("export") ||
          fileName.includes(".pdf") ||
          fileName.includes(".docx")
        ) {
          exports += fileSizeGB;
        } else if (
          fileName.includes("document") ||
          fileName.includes("project")
        ) {
          documents += fileSizeGB;
        } else if (fileName.includes("citation")) {
          citations += fileSizeGB;
        } else {
          uploads += fileSizeGB;
        }
      }

      return {
        documents,
        exports,
        uploads,
        citations,
      };
    } catch (error) {
      logger.error("Error getting storage breakdown by type:", error);
      return {
        documents: 0,
        exports: 0,
        uploads: 0,
        citations: 0,
      };
    }
  }

  // Clean up old exports
  static async cleanupOldExports(userId: string): Promise<CleanupResult> {
    try {
      // Find old exports in the database (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldExports = await prisma.export.findMany({
        where: {
          user_id: userId,
          created_at: {
            lt: thirtyDaysAgo,
          },
        },
      });

      let freedSpace = 0;

      // Delete each export file from Supabase Storage
      for (const exportRecord of oldExports) {
        if (exportRecord.download_url) {
          // Extract file path from URL - this is a simplified approach
          const url = new URL(exportRecord.download_url);
          const filePath = url.pathname.substring(1); // Remove leading slash
          const deleted = await SupabaseStorageService.deleteFile(filePath);
          if (deleted) {
            freedSpace += (exportRecord.file_size || 0) / (1024 * 1024 * 1024); // Convert to GB
          }
        }
      }

      // Delete records from database
      await prisma.export.deleteMany({
        where: {
          user_id: userId,
          created_at: {
            lt: thirtyDaysAgo,
          },
        },
      });

      return {
        count: oldExports.length,
        freedSpace,
      };
    } catch (error) {
      logger.error("Error cleaning up old exports:", error);
      return {
        count: 0,
        freedSpace: 0,
      };
    }
  }

  // Clean up old drafts
  static async cleanupOldDrafts(userId: string): Promise<CleanupResult> {
    try {
      // Find old draft projects in the database (older than 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const oldDrafts = await prisma.project.findMany({
        where: {
          user_id: userId,
          status: "draft",
          updated_at: {
            lt: ninetyDaysAgo,
          },
        },
      });

      let freedSpace = 0;

      // For each draft, we need to delete associated export files from Supabase Storage
      // First, find all export records associated with these drafts
      const draftIds = oldDrafts.map((draft: any) => draft.id);

      if (draftIds.length > 0) {
        const exportRecords = await prisma.export.findMany({
          where: {
            project_id: {
              in: draftIds,
            },
          },
        });

        // Delete each export file from Supabase Storage
        for (const exportRecord of exportRecords) {
          if (exportRecord.download_url) {
            // Extract the file path from the download URL
            // The URL format is typically: https://<project>.supabase.co/storage/v1/object/public/uploads/<file_path>
            const urlParts = exportRecord.download_url.split("/uploads/");
            if (urlParts.length > 1) {
              const filePath = urlParts[1];
              const deleted = await SupabaseStorageService.deleteFile(filePath);
              if (deleted) {
                freedSpace += exportRecord.file_size / (1024 * 1024 * 1024); // Convert bytes to GB
              }
            }
          }
        }

        // Delete export records from database
        await prisma.export.deleteMany({
          where: {
            project_id: {
              in: draftIds,
            },
          },
        });
      }

      // Delete draft projects from database
      await prisma.project.deleteMany({
        where: {
          user_id: userId,
          status: "draft",
          updated_at: {
            lt: ninetyDaysAgo,
          },
        },
      });

      return {
        count: oldDrafts.length,
        freedSpace,
      };
    } catch (error) {
      logger.error("Error cleaning up old drafts:", error);
      return {
        count: 0,
        freedSpace: 0,
      };
    }
  }

  // Clean up old backups
  static async cleanupOldBackups(userId: string): Promise<CleanupResult> {
    try {
      // Find old backups in the database (older than 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const oldBackups = await prisma.backup.findMany({
        where: {
          user_id: userId,
          created_at: {
            lt: sevenDaysAgo,
          },
        },
      });

      let freedSpace = 0;

      // Delete each backup file from Supabase Storage
      for (const backup of oldBackups) {
        if (backup.storage_path) {
          const deleted = await SupabaseStorageService.deleteFile(
            backup.storage_path,
          );
          if (deleted) {
            freedSpace += (backup.size || 0) / (1024 * 1024 * 1024); // Convert to GB
          }
        }
      }

      // Delete records from database
      await prisma.backup.deleteMany({
        where: {
          user_id: userId,
          created_at: {
            lt: sevenDaysAgo,
          },
        },
      });

      return {
        count: oldBackups.length,
        freedSpace,
      };
    } catch (error) {
      logger.error("Error cleaning up old backups:", error);
      return {
        count: 0,
        freedSpace: 0,
      };
    }
  }

  // Clean up old document versions
  static async cleanupOldVersions(userId: string): Promise<CleanupResult> {
    try {
      // Find old document versions in the database (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldVersions = await prisma.documentVersion.findMany({
        where: {
          user_id: userId,
          created_at: {
            lt: thirtyDaysAgo,
          },
        },
      });

      let freedSpace = 0;

      // For each version, we need to delete associated files from Supabase Storage
      // Since document versions don't directly store file paths, we estimate based on content size
      // In a more advanced implementation, you might store file references in the version metadata
      for (const version of oldVersions) {
        // Estimate file size based on word count (rough approximation)
        // Average word size is about 6 characters + 1 space = 7 bytes
        // Add some overhead for document formatting
        const estimatedFileSize = (version.word_count || 0) * 7 * 1.5; // 1.5x overhead factor
        freedSpace += estimatedFileSize / (1024 * 1024 * 1024); // Convert to GB
      }

      // Delete records from database
      await prisma.documentVersion.deleteMany({
        where: {
          user_id: userId,
          created_at: {
            lt: thirtyDaysAgo,
          },
        },
      });

      return {
        count: oldVersions.length,
        freedSpace,
      };
    } catch (error) {
      logger.error("Error cleaning up old versions:", error);
      return {
        count: 0,
        freedSpace: 0,
      };
    }
  }

  // Helper method to collect user data for backup
  private static async collectUserData(userId: string): Promise<any> {
    try {
      // Collect projects
      const projects = await prisma.project.findMany({
        where: { user_id: userId },
        include: {
          citations: true,
          comments: true,
          collaborators: true,
        },
      });

      // Collect document versions
      const documentVersions = await prisma.documentVersion.findMany({
        where: { user_id: userId },
      });

      // Collect exports
      const exports = await prisma.export.findMany({
        where: { user_id: userId },
      });

      // Collect citations
      const citations = await prisma.citation.findMany({
        where: { project: { user_id: userId } },
      });

      // Collect user settings
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          full_name: true,
          email: true,
          institution: true,
          location: true,
          bio: true,
        },
      });

      return {
        user,
        projects,
        documentVersions,
        exports,
        citations,
        backupDate: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error collecting user data for backup:", error);
      throw error;
    }
  }

  // Helper method to create backup archive
  private static async createBackupArchive(userData: any): Promise<Buffer> {
    try {
      // Create a promise to handle the archiving process
      return new Promise<Buffer>((resolve, reject) => {
        // Create a buffer to store the archive
        const buffers: Buffer[] = [];
        const archive = archiver.default("zip", {
          zlib: { level: 9 }, // Sets the compression level
        });

        // Listen for all archive data to be written
        archive.on("data", (chunk: Buffer) => {
          buffers.push(chunk);
        });

        // Listen for errors
        archive.on("error", (err: Error) => {
          reject(err);
        });

        // Listen for when the archive is finalized
        archive.on("end", () => {
          const finalBuffer = Buffer.concat(buffers);
          resolve(finalBuffer);
        });

        // Append the user data as a JSON file
        const jsonString = JSON.stringify(userData, null, 2);
        archive.append(jsonString, { name: "backup-data.json" });

        // Finalize the archive (i.e., write everything to the buffer)
        archive.finalize();
      });
    } catch (error) {
      logger.error("Error creating backup archive:", error);
      throw error;
    }
  }

  // Analyze storage usage
  static async analyzeStorageUsage(userId: string): Promise<any> {
    try {
      // Get actual storage usage from Supabase Storage
      const actualUsage =
        await SupabaseStorageService.calculateUserStorageUsage(userId);

      // Get user's projects
      const projects = await prisma.project.findMany({
        where: {
          user_id: userId,
        },
        select: {
          id: true,
          title: true,
          word_count: true,
          updated_at: true,
          created_at: true,
        },
      });

      // Get recent exports
      const recentExports = await prisma.export.findMany({
        where: {
          user_id: userId,
        },
        orderBy: {
          created_at: "desc",
        },
        take: 10,
      });

      // Get AI usage
      const aiHistoryCount = await prisma.aIUsage.count({
        where: {
          user_id: userId,
        },
      });

      const aiChatMessagesCount = await prisma.aIChatMessage.count({
        where: {
          user_id: userId,
        },
      });

      // Find largest projects
      const largestProjects = projects
        .map((project: any) => ({
          id: project.id,
          title: project.title,
          wordCount: project.word_count || 0,
          size: (project.word_count || 0) * 0.000001, // Estimate size based on word count
          createdAt: project.created_at.toISOString(),
          updatedAt: project.updated_at.toISOString(),
        }))
        .sort((a: any, b: any) => b.size - a.size)
        .slice(0, 5);

      // Generate recommendations
      const recommendations: string[] = [];

      if (actualUsage > 0) {
        // Check if user is approaching storage limit
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { storage_limit: true },
        });

        const limit = user?.storage_limit || 0.1;
        const usagePercentage = (actualUsage / limit) * 100;

        if (usagePercentage > 80) {
          recommendations.push(
            "You're approaching your storage limit. Consider cleaning up old files.",
          );
        }

        if (
          largestProjects.length > 0 &&
          largestProjects[0].size > limit * 0.3
        ) {
          recommendations.push(
            `Your project "${largestProjects[0].title}" is using a large amount of storage.`,
          );
        }
      }

      return {
        currentUsage: {
          used: actualUsage,
          limit:
            (
              await prisma.user.findUnique({
                where: { id: userId },
                select: { storage_limit: true },
              })
            )?.storage_limit || 0.1,
          breakdown: await this.getStorageBreakdownByType(userId),
        },
        largestProjects,
        recentExports: recentExports.map((exportItem: any) => ({
          id: exportItem.id,
          fileName: exportItem.file_name,
          fileType: exportItem.file_type,
          size: (exportItem.file_size || 0) / (1024 * 1024 * 1024), // Convert to GB
          createdAt: exportItem.created_at.toISOString(),
        })),
        aiUsage: {
          historyItems: aiHistoryCount,
          chatMessages: aiChatMessagesCount,
        },
        recommendations,
      };
    } catch (error) {
      logger.error("Error analyzing storage usage:", error);
      throw error;
    }
  }

  // Get detailed storage breakdown
  static async getDetailedStorageBreakdown(
    userId: string,
  ): Promise<StorageBreakdown> {
    try {
      // Get storage breakdown from Supabase Storage
      const storageBreakdown =
        await SupabaseStorageService.getStorageBreakdown(userId);

      // Get user's projects for document details
      const projects = await prisma.project.findMany({
        where: {
          user_id: userId,
        },
        select: {
          id: true,
          title: true,
          word_count: true,
          updated_at: true,
        },
      });

      // Get citations count
      const citationsCount = await prisma.citation.count({
        where: {
          project: {
            user_id: userId,
          },
        },
      });

      // Get comments count
      const commentsCount = await prisma.comment.count({
        where: {
          project: {
            user_id: userId,
          },
        },
      });

      // Get document versions count
      const versionsCount = await prisma.documentVersion.count({
        where: {
          user_id: userId,
        },
      });

      // Get AI history count
      const aiHistoryCount = await prisma.aIUsage.count({
        where: {
          user_id: userId,
        },
      });

      // Get AI chat messages count
      const aiChatMessagesCount = await prisma.aIChatMessage.count({
        where: {
          user_id: userId,
        },
      });

      // Get exports for details
      const exports = await prisma.export.findMany({
        where: {
          user_id: userId,
        },
        select: {
          id: true,
          file_size: true,
          created_at: true,
        },
        orderBy: {
          created_at: "desc",
        },
        take: 50,
      });

      // Get backups for details
      const backups = await prisma.backup.findMany({
        where: {
          user_id: userId,
        },
        select: {
          id: true,
          size: true,
          created_at: true,
        },
        orderBy: {
          created_at: "desc",
        },
        take: 50,
      });

      return {
        totalSize: storageBreakdown.totalSize,
        breakdown: {
          documents: {
            size: storageBreakdown.files
              .filter(
                (file) =>
                  file.name.includes("document") ||
                  file.name.includes("project"),
              )
              .reduce((sum, file) => sum + file.size / (1024 * 1024 * 1024), 0),
            count: projects.length,
            details: projects.map((project: any) => ({
              id: project.id,
              title: project.title,
              wordCount: project.word_count || 0,
              size: (project.word_count || 0) * 0.000001, // Estimate size based on word count
              lastModified: project.updated_at.toISOString(),
            })),
          },
          citations: {
            size: 0.001 * citationsCount, // Estimate size
            count: citationsCount,
          },
          comments: {
            size: 0.0001 * commentsCount, // Estimate size
            count: commentsCount,
          },
          versions: {
            size: 0.001 * versionsCount, // Estimate size
            count: versionsCount,
          },
          aiHistory: {
            size: 0.0005 * aiHistoryCount, // Estimate size
            count: aiHistoryCount,
          },
          aiChatMessages: {
            size: 0.0001 * aiChatMessagesCount, // Estimate size
            count: aiChatMessagesCount,
          },
          exports: {
            size: storageBreakdown.files
              .filter(
                (file) =>
                  file.name.includes("export") ||
                  file.name.includes(".pdf") ||
                  file.name.includes(".docx"),
              )
              .reduce((sum, file) => sum + file.size / (1024 * 1024 * 1024), 0),
            count: exports.length,
            details: exports.map((exportItem: any) => ({
              id: exportItem.id,
              size: (exportItem.file_size || 0) / (1024 * 1024 * 1024), // Convert to GB
              createdAt: exportItem.created_at.toISOString(),
            })),
          },
          backups: {
            size: storageBreakdown.files
              .filter((file) => file.name.includes("backup"))
              .reduce((sum, file) => sum + file.size / (1024 * 1024 * 1024), 0),
            count: backups.length,
            details: backups.map((backup: any) => ({
              id: backup.id,
              size: (backup.size || 0) / (1024 * 1024 * 1024), // Convert to GB
              createdAt: backup.created_at.toISOString(),
            })),
          },
        },
      };
    } catch (error) {
      logger.error("Error getting detailed storage breakdown:", error);
      throw error;
    }
  }

  // Monitor storage thresholds
  static async monitorStorageThresholds(userId: string): Promise<void> {
    try {
      // Get user's current storage usage
      const storageInfo = await this.getUserStorageInfo(userId);

      // Get user's subscription info
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      const planId = subscription?.plan || "free";
      const storageLimit = storageInfo.limit;
      const usagePercentage = (storageInfo.used / storageLimit) * 100;

      // Check if user is approaching storage limits
      if (usagePercentage > 90) {
        logger.warn("User approaching storage limit", {
          userId,
          used: storageInfo.used,
          limit: storageLimit,
          percentage: usagePercentage,
        });

        // Send a notification to the user
        await this.sendStorageWarningNotification(
          userId,
          usagePercentage,
          storageInfo.used,
          storageLimit,
        );
      } else if (usagePercentage > 75) {
        logger.info("User approaching storage warning threshold", {
          userId,
          used: storageInfo.used,
          limit: storageLimit,
          percentage: usagePercentage,
        });
      }
    } catch (error) {
      logger.error("Error monitoring storage thresholds:", error);
      throw error;
    }
  }

  // Update user storage limit based on subscription
  static async updateUserStorageLimit(userId: string): Promise<void> {
    try {
      // Get user's current plan
      const planInfo = await SubscriptionService.getUserPlanInfo(userId);
      const newStorageLimit = planInfo.usage.storage.limit;

      // Update user's storage limit in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          storage_limit: newStorageLimit,
        },
      });

      logger.info("Updated user storage limit", {
        userId,
        newLimit: newStorageLimit,
      });
    } catch (error) {
      logger.error("Error updating user storage limit:", error);
      throw error;
    }
  }

  // Helper method to send storage warning notification
  private static async sendStorageWarningNotification(
    userId: string,
    usagePercentage: number,
    usedStorage: number,
    storageLimit: number,
  ): Promise<void> {
    try {
      // Import notification service dynamically to avoid circular dependencies
      const { createNotification } = await import("./notificationService");

      // Create a notification for the user using an existing notification type
      await createNotification(
        userId,
        "backup_available", // Using backup_available as it's related to storage
        "Storage Limit Approaching",
        `You are using ${usagePercentage.toFixed(1)}% of your storage limit (${usedStorage.toFixed(2)} GB / ${storageLimit} GB). Consider cleaning up old files or upgrading your plan.`,
        {
          usagePercentage,
          usedStorage,
          storageLimit,
        },
      );

      logger.info("Storage warning notification sent", {
        userId,
        usagePercentage,
        usedStorage,
        storageLimit,
      });
    } catch (error) {
      logger.error("Error sending storage warning notification:", error);
    }
  }
}
