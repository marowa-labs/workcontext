import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

/**
 * SubscriptionMonitoringService handles monitoring and alerting for subscription events
 */
class SubscriptionMonitoringService {
  // Alert thresholds
  private static readonly ALERT_THRESHOLDS = {
    HIGH_FAILURE_RATE: 0.05, // 5% failure rate
    HIGH_RETRY_COUNT: 3, // More than 3 retries
    LONG_PROCESSING_TIME: 30000, // 30 seconds
  };

  /**
   * Log subscription event for monitoring
   */
  static async logEvent(
    eventType: string,
    userId: string,
    status: "success" | "failure" | "retry",
    metadata?: any,
    processingTime?: number
  ): Promise<void> {
    try {
      await prisma.subscriptionEventLog.create({
        data: {
          event_type: eventType,
          user_id: userId,
          status,
          metadata: metadata ? JSON.stringify(metadata) : null,
          processing_time_ms: processingTime,
          created_at: new Date(),
        },
      });

      // Check if we need to send alerts
      await this.checkAndSendAlerts(eventType, status, processingTime);
    } catch (error) {
      logger.error("Error logging subscription event:", error);
    }
  }

  /**
   * Check metrics and send alerts if thresholds are exceeded
   */
  private static async checkAndSendAlerts(
    eventType: string,
    status: string,
    processingTime?: number
  ): Promise<void> {
    try {
      // Check for high failure rates
      if (status === "failure") {
        const failureRate = await this.calculateFailureRate(eventType);
        if (failureRate > this.ALERT_THRESHOLDS.HIGH_FAILURE_RATE) {
          await this.sendAlert(
            "HIGH_FAILURE_RATE",
            `High failure rate detected for ${eventType}: ${failureRate.toFixed(2)}%`,
            { eventType, failureRate }
          );
        }
      }

      // Check for long processing times
      if (
        processingTime &&
        processingTime > this.ALERT_THRESHOLDS.LONG_PROCESSING_TIME
      ) {
        await this.sendAlert(
          "LONG_PROCESSING_TIME",
          `Long processing time detected for ${eventType}: ${processingTime}ms`,
          { eventType, processingTime }
        );
      }
    } catch (error) {
      logger.error("Error checking alerts:", error);
    }
  }

  /**
   * Calculate failure rate for a specific event type
   */
  private static async calculateFailureRate(
    eventType: string
  ): Promise<number> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const [failures, total] = await Promise.all([
        prisma.subscriptionEventLog.count({
          where: {
            event_type: eventType,
            status: "failure",
            created_at: {
              gte: oneHourAgo,
            },
          },
        }),
        prisma.subscriptionEventLog.count({
          where: {
            event_type: eventType,
            created_at: {
              gte: oneHourAgo,
            },
          },
        }),
      ]);

      return total > 0 ? failures / total : 0;
    } catch (error) {
      logger.error("Error calculating failure rate:", error);
      return 0;
    }
  }

  /**
   * Send alert to monitoring system
   */
  private static async sendAlert(
    alertType: string,
    message: string,
    data?: any
  ): Promise<void> {
    try {
      // Log the alert
      logger.warn(`[SUBSCRIPTION_ALERT] ${alertType}: ${message}`, data);

      // In a production system, this would integrate with an alerting system like:
      // - Slack notifications
      // - PagerDuty alerts
      // - Email notifications
      // - Datadog/Sentry alerts

      // For now, we'll just log it
      await prisma.alertLog.create({
        data: {
          alert_type: alertType,
          message,
          data: data ? JSON.stringify(data) : null,
          severity: "warning",
          created_at: new Date(),
        },
      });
    } catch (error) {
      logger.error("Error sending alert:", error);
    }
  }

  /**
   * Get recent subscription events for monitoring dashboard
   */
  static async getRecentEvents(limit: number = 100): Promise<any[]> {
    try {
      const events = await prisma.subscriptionEventLog.findMany({
        take: limit,
        orderBy: {
          created_at: "desc",
        },
      });

      return events.map((event: any) => ({
        ...event,
        metadata: event.metadata ? JSON.parse(event.metadata) : null,
      }));
    } catch (error) {
      logger.error("Error fetching recent subscription events:", error);
      return [];
    }
  }

  /**
   * Get subscription metrics for monitoring dashboard
   */
  static async getMetrics(): Promise<any> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get event counts by type and status for the last hour
      const hourlyEvents = await prisma.subscriptionEventLog.groupBy({
        by: ["event_type", "status"],
        where: {
          created_at: {
            gte: oneHourAgo,
          },
        },
        _count: {
          _all: true,
        },
      });

      // Get average processing times
      const avgProcessingTimes = await prisma.subscriptionEventLog.groupBy({
        by: ["event_type"],
        where: {
          processing_time_ms: {
            not: null,
          },
          created_at: {
            gte: twentyFourHoursAgo,
          },
        },
        _avg: {
          processing_time_ms: true,
        },
      });

      // Get subscription statistics
      const subscriptionStats = await prisma.subscription.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      });

      return {
        hourlyEvents,
        avgProcessingTimes,
        subscriptionStats,
      };
    } catch (error) {
      logger.error("Error fetching subscription metrics:", error);
      return {};
    }
  }

  /**
   * Clean up old event logs
   */
  static async cleanupOldLogs(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date(
        Date.now() - daysToKeep * 24 * 60 * 60 * 1000
      );

      const deletedCount = await prisma.subscriptionEventLog.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(
        `Cleaned up ${deletedCount.count} old subscription event logs`
      );
    } catch (error) {
      logger.error("Error cleaning up old subscription event logs:", error);
    }
  }
}

export default SubscriptionMonitoringService;
