import logger from "../../monitoring/logger";
import { metrics } from "../../monitoring/metrics";
import { SecretsService } from "../secrets-service";

// Define error types
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  CONFLICT_ERROR = "CONFLICT_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

// Define error severity levels
export enum ErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// Custom error class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    this.type = type;
    this.severity = severity;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date();

    // Ensure proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Error handler service
export class ErrorHandlerService {
  // Log error with appropriate level based on severity
  static logError(error: AppError | Error, context?: Record<string, any>) {
    const logData: Record<string, any> = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (error instanceof AppError) {
      logData.type = error.type;
      logData.severity = error.severity;
      logData.statusCode = error.statusCode;
      logData.isOperational = error.isOperational;
      logData.details = error.details;
    }

    // Log based on severity
    switch (logData.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error("CRITICAL ERROR", logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error("HIGH SEVERITY ERROR", logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn("MEDIUM SEVERITY ERROR", logData);
        break;
      case ErrorSeverity.LOW:
        logger.info("LOW SEVERITY ERROR", logData);
        break;
      default:
        logger.error("UNCLASSIFIED ERROR", logData);
    }

    // Increment error counter metrics
    metrics.incrementCounter("errors_total");
    if (error instanceof AppError) {
      metrics.incrementCounter(`errors_${error.type}_total`);
      metrics.incrementCounter(`errors_${error.severity}_severity_total`);
    }
  }

  // Handle HTTP errors and send appropriate response
  static handleHttpError(
    error: AppError | Error,
    req: any,
    res: any,
    next: any
  ) {
    // Log the error
    this.logError(error, {
      url: req.url,
      method: req.method,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
    });

    // If it's an AppError, use its properties
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          type: error.type,
          message: error.message,
          details: error.details,
        },
      });
    }

    // For unhandled errors, return generic response
    return res.status(500).json({
      success: false,
      error: {
        type: ErrorType.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
      },
    });
  }

  // Handle uncaught exceptions
  static handleUncaughtException(error: Error) {
    this.logError(error, { context: "UNCAUGHT_EXCEPTION" });

    // Increment critical error metric
    metrics.incrementCounter("uncaught_exceptions_total");

    // In production, you might want to gracefully shutdown
    // Using process.env as fallback since this is a critical error handler
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }

  // Handle unhandled promise rejections
  static handleUnhandledRejection(reason: any, promise: Promise<any>) {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    this.logError(error, {
      context: "UNHANDLED_REJECTION",
      promise: promise,
    });

    // Increment critical error metric
    metrics.incrementCounter("unhandled_rejections_total");

    // In production, you might want to gracefully shutdown
    // Using process.env as fallback since this is a critical error handler
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }

  // Create and throw a validation error
  static createValidationError(
    message: string,
    details?: Record<string, any>
  ): AppError {
    return new AppError(
      message,
      ErrorType.VALIDATION_ERROR,
      ErrorSeverity.MEDIUM,
      400,
      true,
      details
    );
  }

  // Create and throw an authentication error
  static createAuthenticationError(
    message: string = "Authentication required"
  ): AppError {
    return new AppError(
      message,
      ErrorType.AUTHENTICATION_ERROR,
      ErrorSeverity.HIGH,
      401,
      true
    );
  }

  // Create and throw an authorization error
  static createAuthorizationError(message: string = "Access denied"): AppError {
    return new AppError(
      message,
      ErrorType.AUTHORIZATION_ERROR,
      ErrorSeverity.HIGH,
      403,
      true
    );
  }

  // Create and throw a not found error
  static createNotFoundError(message: string = "Resource not found"): AppError {
    return new AppError(
      message,
      ErrorType.NOT_FOUND_ERROR,
      ErrorSeverity.LOW,
      404,
      true
    );
  }

  // Create and throw an AI service error
  static createAIServiceError(
    message: string,
    details?: Record<string, any>
  ): AppError {
    return new AppError(
      message,
      ErrorType.AI_SERVICE_ERROR,
      ErrorSeverity.HIGH,
      500,
      true,
      details
    );
  }

  // Create and throw a rate limit error
  static createRateLimitError(
    message: string = "Rate limit exceeded"
  ): AppError {
    return new AppError(
      message,
      ErrorType.RATE_LIMIT_ERROR,
      ErrorSeverity.MEDIUM,
      429,
      true
    );
  }
}

export default ErrorHandlerService;
