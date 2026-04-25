import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

/**
 * IdempotencyService ensures that critical operations are only executed once
 * even if the same request is sent multiple times
 */
class IdempotencyService {
  /**
   * Process an operation with idempotency protection
   * @param idempotencyKey Unique key for this operation
   * @param operation Function to execute
   * @param ttl Time to live for the idempotency record in seconds (default: 24 hours)
   */
  static async processWithIdempotency<T>(
    idempotencyKey: string,
    operation: () => Promise<T>,
    ttl: number = 24 * 60 * 60 // 24 hours
  ): Promise<T> {
    // Check if this operation has already been processed
    const existingRecord = await prisma.idempotencyRecord.findUnique({
      where: { idempotency_key: idempotencyKey },
    });

    if (existingRecord) {
      // If the operation was already completed successfully, return the result
      if (existingRecord.status === "SUCCESS") {
        logger.info(
          `Idempotency key ${idempotencyKey} already processed successfully`
        );
        return JSON.parse(existingRecord.result || "{}");
      }

      // If the operation failed, we might want to retry depending on the error
      if (existingRecord.status === "FAILED") {
        const timeSinceLastAttempt =
          Date.now() - existingRecord.updated_at.getTime();
        // Retry if more than 5 minutes have passed since the last attempt
        if (timeSinceLastAttempt > 5 * 60 * 1000) {
          logger.info(
            `Retrying failed operation for idempotency key ${idempotencyKey}`
          );
        } else {
          logger.warn(
            `Operation for idempotency key ${idempotencyKey} recently failed, returning error`
          );
          throw new Error(
            existingRecord.error_message || "Operation previously failed"
          );
        }
      }
    }

    // Record that we're processing this operation
    await prisma.idempotencyRecord.upsert({
      where: { idempotency_key: idempotencyKey },
      update: {
        status: "PROCESSING",
        updated_at: new Date(),
      },
      create: {
        idempotency_key: idempotencyKey,
        status: "PROCESSING",
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + ttl * 1000),
      },
    });

    try {
      // Execute the operation
      const result = await operation();

      // Record success
      await prisma.idempotencyRecord.update({
        where: { idempotency_key: idempotencyKey },
        data: {
          status: "SUCCESS",
          result: JSON.stringify(result),
          updated_at: new Date(),
        },
      });

      return result;
    } catch (error: any) {
      // Record failure
      await prisma.idempotencyRecord.update({
        where: { idempotency_key: idempotencyKey },
        data: {
          status: "FAILED",
          error_message: error.message,
          updated_at: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Generate an idempotency key based on user ID and operation details
   */
  static generateKey(
    userId: string,
    operation: string,
    ...params: any[]
  ): string {
    const data = `${userId}:${operation}:${JSON.stringify(params)}`;
    return `idemp_${Buffer.from(data).toString("base64")}`;
  }

  /**
   * Clean up expired idempotency records
   */
  static async cleanupExpiredRecords(): Promise<void> {
    try {
      const deletedCount = await prisma.idempotencyRecord.deleteMany({
        where: {
          expires_at: {
            lt: new Date(),
          },
        },
      });

      logger.info(
        `Cleaned up ${deletedCount.count} expired idempotency records`
      );
    } catch (error) {
      logger.error("Error cleaning up expired idempotency records:", error);
    }
  }
}

export default IdempotencyService;
