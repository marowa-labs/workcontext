import { PrismaClient } from "@prisma/client";
import logger from "../monitoring/logger";
// Import the adapter configuration
import { adapter } from "../prisma.config";
import { SecretsService } from "../services/secrets-service";

const globalForPrisma = global as unknown as {
  prisma: any;
};

// Prisma 7+ client configuration with adapter
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    errorFormat: "pretty",
  });

// Test database connection on initialization
if (!globalForPrisma.prisma) {
  // Add retry mechanism for database connection
  const connectWithRetry = async (maxRetries = 5, delay = 5000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        logger.info(
          `Attempting database connection (attempt ${i + 1}/${maxRetries})`,
        );
        await prisma.$connect();
        logger.info("✅ Database connection established");
        return;
      } catch (error: any) {
        logger.warn(`❌ Database connection attempt ${i + 1} failed`, {
          error,
        });
        if (i < maxRetries - 1) {
          logger.info(`Retrying in ${delay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          logger.error("❌ Failed to connect to database after all retries", {
            error,
          });
          // Don't throw here - let the app start and fail on first query if needed
        }
      }
    }
  };

  logger.info("Starting database connection process");
  connectWithRetry();
}

// @ts-ignore - TypeScript has issues with extended client type assignment
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Add graceful shutdown handler
process.on("beforeExit", async () => {
  logger.info("Closing database connections...");
  await prisma.$disconnect();
});

export default prisma;
