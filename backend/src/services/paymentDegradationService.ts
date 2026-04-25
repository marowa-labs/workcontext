import logger from "../monitoring/logger";
import { lemonSqueezyCircuitBreaker } from "./circuitBreakerService";

/**
 * PaymentDegradationService handles graceful degradation when payment services are unavailable
 */

class PaymentDegradationService {
  private static instance: PaymentDegradationService;
  private isPaymentServiceDegraded: boolean = false;
  private degradationStartTime: Date | null = null;
  private degradationReason: string | null = null;

  private constructor() {}

  static getInstance(): PaymentDegradationService {
    if (!PaymentDegradationService.instance) {
      PaymentDegradationService.instance = new PaymentDegradationService();
    }
    return PaymentDegradationService.instance;
  }

  /**
   * Check if payment service is currently degraded
   */
  isDegraded(): boolean {
    return this.isPaymentServiceDegraded;
  }

  /**
   * Get degradation information
   */
  getDegradationInfo(): {
    isDegraded: boolean;
    startTime: Date | null;
    reason: string | null;
    durationMs: number | null;
  } {
    return {
      isDegraded: this.isPaymentServiceDegraded,
      startTime: this.degradationStartTime,
      reason: this.degradationReason,
      durationMs: this.degradationStartTime
        ? Date.now() - this.degradationStartTime.getTime()
        : null,
    };
  }

  /**
   * Report payment service failure and potentially trigger degradation
   */
  reportPaymentServiceFailure(error: Error, context: string): void {
    logger.warn("Payment service failure reported", {
      error: error.message,
      context,
      stack: error.stack,
    });

    // Check circuit breaker state
    const circuitState = lemonSqueezyCircuitBreaker.getState();

    // If circuit breaker is OPEN, we're in degraded mode
    if (circuitState.state === "OPEN") {
      if (!this.isPaymentServiceDegraded) {
        this.isPaymentServiceDegraded = true;
        this.degradationStartTime = new Date();
        this.degradationReason = `Circuit breaker OPEN due to: ${error.message}`;
        logger.error("Payment service degradation activated", {
          reason: this.degradationReason,
          startTime: this.degradationStartTime,
        });

        // Send alert about degradation
        this.sendDegradationAlert();
      }
    }
  }

  /**
   * Report payment service recovery
   */
  reportPaymentServiceRecovery(context: string): void {
    if (this.isPaymentServiceDegraded) {
      const duration = this.degradationStartTime
        ? Date.now() - this.degradationStartTime.getTime()
        : null;

      logger.info("Payment service recovery detected", {
        context,
        degradationDurationMs: duration,
      });

      // Reset degradation state
      this.isPaymentServiceDegraded = false;
      this.degradationStartTime = null;
      this.degradationReason = null;

      // Send recovery notification
      this.sendRecoveryNotification(duration);
    }
  }

  /**
   * Send alert when payment service enters degraded mode
   */
  private sendDegradationAlert(): void {
    // In a production system, this would integrate with:
    // - Slack notifications
    // - PagerDuty alerts
    // - Email notifications
    // - Datadog/Sentry alerts

    logger.error(
      "[PAYMENT_SERVICE_DEGRADED] Payment processing is currently degraded. " +
        "Users may experience issues with subscription management and checkout."
    );
  }

  /**
   * Send notification when payment service recovers
   */
  private sendRecoveryNotification(degradationDurationMs: number | null): void {
    logger.info(
      "[PAYMENT_SERVICE_RECOVERED] Payment processing service has recovered. " +
        `Degradation lasted ${degradationDurationMs ? degradationDurationMs + "ms" : "unknown duration"}.`
    );
  }

  /**
   * Provide fallback response for checkout requests during degradation
   */
  getCheckoutFallbackResponse(): {
    success: boolean;
    message: string;
    estimatedRecoveryTime?: string;
    alternativeOptions?: string[];
  } {
    const circuitState = lemonSqueezyCircuitBreaker.getState();
    const recoveryTime = circuitState.nextAttempt
      ? new Date(circuitState.nextAttempt).toISOString()
      : "unknown";

    return {
      success: false,
      message:
        "Payment processing is temporarily unavailable due to high demand. Please try again in a few minutes.",
      estimatedRecoveryTime: recoveryTime,
      alternativeOptions: [
        "Try again in a few minutes",
        "Contact support for assistance",
        "Check system status page for updates",
      ],
    };
  }

  /**
   * Provide fallback response for subscription management during degradation
   */
  getSubscriptionManagementFallbackResponse(): {
    success: boolean;
    message: string;
    canViewExistingSubscriptions: boolean;
  } {
    return {
      success: true,
      message:
        "Subscription management is temporarily limited. You can view your existing subscriptions but cannot make changes.",
      canViewExistingSubscriptions: true,
    };
  }

  /**
   * Execute a payment operation with graceful degradation handling
   */
  async executeWithDegradationHandling<T>(
    operation: () => Promise<T>,
    fallbackResult: T,
    context: string
  ): Promise<T> {
    try {
      const result = await operation();
      this.reportPaymentServiceRecovery(context);
      return result;
    } catch (error: any) {
      this.reportPaymentServiceFailure(error, context);
      logger.warn(
        `Returning fallback result for ${context} due to payment service degradation`
      );
      return fallbackResult;
    }
  }
}

export default PaymentDegradationService;
