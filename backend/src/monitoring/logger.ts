import * as dotenv from "dotenv";
import { createLogger, format, transports } from "winston";

// Load environment variables for initial setup
dotenv.config();

// Create Winston logger with fallback values
const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  defaultMeta: { service: "ScholarForge AI" },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new transports.File({ filename: "logs/error.log", level: "error" }),

    // Write all logs to `combined.log`
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  );
}

export default logger;
