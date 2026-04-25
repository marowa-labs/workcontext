import {
  AppError,
  ErrorType,
  ErrorSeverity,
  ErrorHandlerService,
} from "./errorHandler";
import logger from "../../monitoring/logger";
import { metrics } from "../../monitoring/metrics";

// AI-specific error types
export enum AIErrorType {
  MODEL_NOT_AVAILABLE = "MODEL_NOT_AVAILABLE",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  CONTEXT_LENGTH_EXCEEDED = "CONTEXT_LENGTH_EXCEEDED",
  INVALID_REQUEST = "INVALID_REQUEST",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  CONTENT_POLICY_VIOLATION = "CONTENT_POLICY_VIOLATION",
}

// AI Error Handler Service
export class AIErrorHandlerService {
  // Handle AI service errors
  static handleAIError(
    error: any,
    userId?: string,
    context?: Record<string, any>
  ): AppError {
    logger.error("AI Service Error", {
      error: error.message,
      stack: error.stack,
      userId,
      ...context,
    });

    // Increment AI error counter
    metrics.incrementCounter("ai_errors_total");

    // Handle specific AI error types
    if (error.message && error.message.includes("quota exceeded")) {
      metrics.incrementCounter("ai_quota_exceeded_errors");
      return new AppError(
        "AI service quota exceeded. Please try again later or upgrade your plan for more usage.",
        ErrorType.AI_SERVICE_ERROR,
        ErrorSeverity.HIGH,
        429,
        true,
        { aiErrorType: AIErrorType.QUOTA_EXCEEDED, userId, ...context }
      );
    }

    if (error.message && error.message.includes("authentication failed")) {
      metrics.incrementCounter("ai_auth_errors");
      return new AppError(
        "AI service authentication failed. Please contact support.",
        ErrorType.AI_SERVICE_ERROR,
        ErrorSeverity.HIGH,
        401,
        true,
        { aiErrorType: AIErrorType.AUTHENTICATION_FAILED, userId, ...context }
      );
    }

    if (error.message && error.message.includes("rate limit")) {
      metrics.incrementCounter("ai_rate_limit_errors");
      return new AppError(
        "AI service rate limit exceeded. Please try again later.",
        ErrorType.AI_SERVICE_ERROR,
        ErrorSeverity.MEDIUM,
        429,
        true,
        { aiErrorType: AIErrorType.RATE_LIMIT_EXCEEDED, userId, ...context }
      );
    }

    if (error.message && error.message.includes("context length")) {
      metrics.incrementCounter("ai_context_length_errors");
      return new AppError(
        "Input too long for the AI model. Please reduce the content length and try again.",
        ErrorType.AI_SERVICE_ERROR,
        ErrorSeverity.MEDIUM,
        400,
        true,
        { aiErrorType: AIErrorType.CONTEXT_LENGTH_EXCEEDED, userId, ...context }
      );
    }

    if (error.message && error.message.includes("content policy")) {
      metrics.incrementCounter("ai_content_policy_errors");
      return new AppError(
        "Your request was rejected due to content policy violations. Please modify your input and try again.",
        ErrorType.AI_SERVICE_ERROR,
        ErrorSeverity.MEDIUM,
        400,
        true,
        {
          aiErrorType: AIErrorType.CONTENT_POLICY_VIOLATION,
          userId,
          ...context,
        }
      );
    }

    if (error.status === 429) {
      metrics.incrementCounter("ai_rate_limit_errors");
      return new AppError(
        "AI service is currently busy. Please try again later.",
        ErrorType.AI_SERVICE_ERROR,
        ErrorSeverity.MEDIUM,
        429,
        true,
        { aiErrorType: AIErrorType.RATE_LIMIT_EXCEEDED, userId, ...context }
      );
    }

    if (error.status === 401) {
      metrics.incrementCounter("ai_auth_errors");
      return new AppError(
        "AI service authentication failed. Please contact support.",
        ErrorType.AI_SERVICE_ERROR,
        ErrorSeverity.HIGH,
        401,
        true,
        { aiErrorType: AIErrorType.AUTHENTICATION_FAILED, userId, ...context }
      );
    }

    if (error.status === 400) {
      metrics.incrementCounter("ai_invalid_request_errors");
      return new AppError(
        "Invalid AI request. Please check your input and try again.",
        ErrorType.AI_SERVICE_ERROR,
        ErrorSeverity.MEDIUM,
        400,
        true,
        { aiErrorType: AIErrorType.INVALID_REQUEST, userId, ...context }
      );
    }

    // Generic AI error
    metrics.incrementCounter("ai_generic_errors");
    return new AppError(
      error.message || "Failed to process AI request",
      ErrorType.AI_SERVICE_ERROR,
      ErrorSeverity.HIGH,
      500,
      true,
      { userId, ...context }
    );
  }

  // Handle AI timeout errors
  static handleAITimeout(
    timeoutMs: number,
    userId?: string,
    context?: Record<string, any>
  ): AppError {
    logger.warn("AI Request Timeout", {
      timeoutMs,
      userId,
      ...context,
    });

    metrics.incrementCounter("ai_timeout_errors");

    return new AppError(
      `AI request timed out after ${timeoutMs}ms. Please try again.`,
      ErrorType.AI_SERVICE_ERROR,
      ErrorSeverity.MEDIUM,
      408,
      true,
      { aiErrorType: AIErrorType.TIMEOUT_ERROR, timeoutMs, userId, ...context }
    );
  }

  // Handle model not available errors
  static handleModelNotAvailable(
    model: string,
    userId?: string,
    context?: Record<string, any>
  ): AppError {
    logger.warn("AI Model Not Available", {
      model,
      userId,
      ...context,
    });

    metrics.incrementCounter("ai_model_not_available_errors");

    return new AppError(
      `The requested AI model "${model}" is not available. Please select a different model.`,
      ErrorType.AI_SERVICE_ERROR,
      ErrorSeverity.MEDIUM,
      400,
      true,
      {
        aiErrorType: AIErrorType.MODEL_NOT_AVAILABLE,
        model,
        userId,
        ...context,
      }
    );
  }

  // Log AI request performance metrics
  static logAIRequestMetrics(
    userId: string,
    model: string,
    action: string,
    responseTime: number,
    tokensUsed: number,
    success: boolean,
    errorMessage?: string
  ) {
    // Record timing metrics
    metrics.recordTiming("ai_request_duration", responseTime);

    // Record token usage
    metrics.incrementCounter("ai_tokens_total", tokensUsed);

    // Record request counts
    metrics.incrementCounter("ai_requests_total");
    if (success) {
      metrics.incrementCounter("ai_successful_requests");
    } else {
      metrics.incrementCounter("ai_failed_requests");
    }

    // Log detailed metrics
    logger.info("AI Request Metrics", {
      userId,
      model,
      action,
      responseTime,
      tokensUsed,
      success,
      errorMessage,
    });
  }

  // Log AI cost metrics
  static logAICostMetrics(
    userId: string,
    model: string,
    tokensUsed: number,
    cost: number,
    requestType: string
  ) {
    // Record cost metrics
    metrics.incrementCounter("ai_cost_total", cost);

    // Log cost details
    logger.info("AI Cost Metrics", {
      userId,
      model,
      tokensUsed,
      cost,
      requestType,
    });
  }
}

export default AIErrorHandlerService;
