import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

export interface TaskTrackingData {
  userId: string;
  action: string;
  serviceType: string;
  metadata?: any;
  quantity?: number;
  cost?: number;
  sessionToken?: string;
}

export class TaskTrackingService {
  /**
   * Track a user activity/task
   */
  static async trackTask(data: TaskTrackingData): Promise<void> {
    try {
      const {
        userId,
        action,
        serviceType,
        metadata,
        quantity = 1,
        cost,
        sessionToken,
      } = data;

      // Create the task tracking record
      await prisma.taskTracking.create({
        data: {
          user_id: userId,
          action,
          service_type: serviceType,
          metadata: metadata ? metadata : undefined,
          quantity,
          cost: cost || 0,
        },
      });

      logger.info(
        `Task tracked for user ${userId}: ${serviceType}.${action} x${quantity}`,
      );
    } catch (error) {
      logger.error("Error tracking task:", error);
      throw new Error("Failed to track task");
    }
  }

  /**
   * Get user's task history
   */
  static async getUserTaskHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    try {
      const tasks = await prisma.taskTracking.findMany({
        where: {
          user_id: userId,
        },
        orderBy: {
          created_at: "desc",
        },
        take: limit,
        skip: offset,
      });

      return tasks;
    } catch (error) {
      logger.error("Error getting user task history:", error);
      throw new Error("Failed to get task history");
    }
  }

  /**
   * Get user's task summary by service type
   */
  static async getUserTaskSummary(userId: string) {
    try {
      const summary = await prisma.taskTracking.groupBy({
        by: ["service_type", "action"],
        where: {
          user_id: userId,
        },
        _sum: {
          quantity: true,
          cost: true,
        },
        orderBy: {
          service_type: "asc",
        },
      });

      // Group by service type for easier consumption
      const groupedSummary: Record<string, any[]> = {};
      summary.forEach((item: any) => {
        const serviceType = item.service_type;
        if (!groupedSummary[serviceType]) {
          groupedSummary[serviceType] = [];
        }
        groupedSummary[serviceType].push({
          action: item.action,
          quantity: item._sum.quantity || 0,
          cost: item._sum.cost || 0,
        });
      });

      return groupedSummary;
    } catch (error) {
      logger.error("Error getting user task summary:", error);
      throw new Error("Failed to get task summary");
    }
  }

  /**
   * Track AI service usage
   */
  static async trackAIUsage(
    userId: string,
    action: string,
    quantity: number = 1,
    metadata?: any,
    sessionToken?: string,
  ) {
    return this.trackTask({
      userId,
      action,
      serviceType: "ai",
      quantity,
      metadata,
      sessionToken,
    });
  }

  /**
   * Track storage usage
   */
  static async trackStorageUsage(
    userId: string,
    gigabytes: number,
    sessionToken?: string,
  ) {
    return this.trackTask({
      userId,
      action: "storage",
      serviceType: "storage",
      quantity: gigabytes,
      metadata: { unit: "GB" },
      sessionToken,
    });
  }

  /**
   * Track plagiarism check usage
   */
  static async trackPlagiarismUsage(
    userId: string,
    quantity: number = 1,
    sessionToken?: string,
  ) {
    return this.trackTask({
      userId,
      action: "check",
      serviceType: "plagiarism",
      quantity,
      sessionToken,
    });
  }

  /**
   * Track collaboration usage
   */
  static async trackCollaborationUsage(
    userId: string,
    action: string,
    quantity: number = 1,
    metadata?: any,
    sessionToken?: string,
  ) {
    return this.trackTask({
      userId,
      action,
      serviceType: "collaboration",
      quantity,
      metadata,
      sessionToken,
    });
  }

  /**
   * Track editor usage
   */
  static async trackEditorUsage(
    userId: string,
    action: string,
    quantity: number = 1,
    metadata?: any,
    sessionToken?: string,
  ) {
    return this.trackTask({
      userId,
      action,
      serviceType: "editor",
      quantity,
      metadata,
      sessionToken,
    });
  }

  /**
   * Track citation usage
   */
  static async trackCitationUsage(
    userId: string,
    action: string,
    quantity: number = 1,
    metadata?: any,
    sessionToken?: string,
  ) {
    return this.trackTask({
      userId,
      action,
      serviceType: "citations",
      quantity,
      metadata,
      sessionToken,
    });
  }

  /**
   * Track document management usage
   */
  static async trackDocumentUsage(
    userId: string,
    action: string,
    quantity: number = 1,
    metadata?: any,
    sessionToken?: string,
  ) {
    return this.trackTask({
      userId,
      action,
      serviceType: "documents",
      quantity,
      metadata,
      sessionToken,
    });
  }

  /**
   * Track integration usage
   */
  static async trackIntegrationUsage(
    userId: string,
    action: string,
    quantity: number = 1,
    metadata?: any,
    sessionToken?: string,
  ) {
    return this.trackTask({
      userId,
      action,
      serviceType: "integrations",
      quantity,
      metadata,
      sessionToken,
    });
  }

  /**
   * Track export usage
   */
  static async trackExportUsage(
    userId: string,
    action: string,
    quantity: number = 1,
    metadata?: any,
    sessionToken?: string,
  ) {
    return this.trackTask({
      userId,
      action,
      serviceType: "export",
      quantity,
      metadata,
      sessionToken,
    });
  }
}

// Define the TaskTracking model in Prisma if it doesn't exist
// This is just for reference - the actual model needs to be added to schema.prisma
/*
model TaskTracking {
  id          String    @id @default(cuid())
  user_id     String
  action      String
  service_type String
  quantity    Int       @default(1)
  cost        Float     @default(0)
  metadata    Json?
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  
  user User @relation(fields: [user_id], references: [id])
  
  @@index([user_id])
  @@index([service_type])
  @@index([action])
  @@index([created_at])
}
*/
