import { metrics } from "./metrics";
import logger from "./logger";
import { prisma } from "../lib/prisma";

// AI Performance Monitoring Class
class AIPerformanceMonitor {
  // Record AI request timing
  recordAIRequestTiming(model: string, action: string, duration: number) {
    metrics.recordTiming(`ai_request_duration_${model}_${action}`, duration);
    metrics.recordTiming(`ai_request_duration`, duration);
    metrics.incrementCounter(`ai_requests_total`);
    metrics.incrementCounter(`ai_requests_${model}_total`);
    metrics.incrementCounter(`ai_requests_${action}_total`);

    logger.info(`AI Request: ${model} ${action} - ${duration}ms`);
  }

  // Record AI token usage
  recordAITokenUsage(model: string, action: string, tokens: number) {
    metrics.incrementCounter(`ai_tokens_${model}_total`, tokens);
    metrics.incrementCounter(`ai_tokens_${action}_total`, tokens);
    metrics.incrementCounter(`ai_tokens_total`, tokens);

    // Set gauge for current token usage rate
    metrics.setGauge(`ai_current_tokens_per_second`, tokens);

    logger.info(`AI Tokens: ${model} ${action} - ${tokens} tokens`);
  }

  // Record AI cost
  recordAICost(model: string, action: string, cost: number) {
    metrics.incrementCounter(`ai_cost_${model}_total`, cost);
    metrics.incrementCounter(`ai_cost_${action}_total`, cost);
    metrics.incrementCounter(`ai_cost_total`, cost);

    // Set gauge for current cost rate
    metrics.setGauge(`ai_current_cost_per_hour`, cost);

    logger.info(`AI Cost: ${model} ${action} - $${cost.toFixed(6)}`);
  }

  // Record AI error
  recordAIError(model: string, action: string, errorType: string) {
    metrics.incrementCounter(`ai_errors_${model}_${errorType}_total`);
    metrics.incrementCounter(`ai_errors_${action}_${errorType}_total`);
    metrics.incrementCounter(`ai_errors_total`);

    logger.error(`AI Error: ${model} ${action} - ${errorType}`);
  }

  // Record AI success/failure
  recordAIResult(model: string, action: string, success: boolean) {
    if (success) {
      metrics.incrementCounter(`ai_success_${model}_total`);
      metrics.incrementCounter(`ai_success_${action}_total`);
      metrics.incrementCounter(`ai_success_total`);
    } else {
      metrics.incrementCounter(`ai_failure_${model}_total`);
      metrics.incrementCounter(`ai_failure_${action}_total`);
      metrics.incrementCounter(`ai_failure_total`);
    }
  }

  // Record AI model switch
  recordAIModelSwitch(fromModel: string, toModel: string) {
    metrics.incrementCounter(
      `ai_model_switches_${fromModel}_to_${toModel}_total`
    );
    metrics.incrementCounter(`ai_model_switches_total`);

    logger.info(`AI Model Switch: ${fromModel} -> ${toModel}`);
  }

  // Record AI cache hit/miss
  recordAICacheResult(hit: boolean) {
    if (hit) {
      metrics.incrementCounter(`ai_cache_hits_total`);
    } else {
      metrics.incrementCounter(`ai_cache_misses_total`);
    }
  }

  // Get AI performance summary
  async getAIPerformanceSummary(userId?: string) {
    const summary = metrics.getSummary();

    // Add AI-specific metrics
    const aiSummary: any = {
      requests: {
        total: summary.counters.ai_requests_total || 0,
        byModel: this.extractMetricsByPattern(
          summary.counters,
          "ai_requests_",
          "_total"
        ),
        byAction: this.extractMetricsByPattern(
          summary.counters,
          "ai_requests_",
          "_total",
          true
        ),
      },
      tokens: {
        total: summary.counters.ai_tokens_total || 0,
        byModel: this.extractMetricsByPattern(
          summary.counters,
          "ai_tokens_",
          "_total"
        ),
        byAction: this.extractMetricsByPattern(
          summary.counters,
          "ai_tokens_",
          "_total",
          true
        ),
      },
      costs: {
        total: summary.counters.ai_cost_total || 0,
        byModel: this.extractMetricsByPattern(
          summary.counters,
          "ai_cost_",
          "_total"
        ),
        byAction: this.extractMetricsByPattern(
          summary.counters,
          "ai_cost_",
          "_total",
          true
        ),
      },
      errors: {
        total: summary.counters.ai_errors_total || 0,
        byModel: this.extractMetricsByPattern(
          summary.counters,
          "ai_errors_",
          "_total"
        ),
      },
      success: {
        total: summary.counters.ai_success_total || 0,
        rate: summary.counters.ai_requests_total
          ? ((summary.counters.ai_success_total || 0) /
              summary.counters.ai_requests_total) *
            100
          : 0,
      },
      timings: this.extractTimingStats(summary.timings, "ai_request_duration"),
    };

    // If userId is provided, get user-specific analytics
    if (userId) {
      try {
        const userAnalytics = await prisma.aIAnalytics.findUnique({
          where: { user_id: userId },
        });

        if (userAnalytics) {
          aiSummary.user = {
            efficiencyScore: userAnalytics.efficiency_score || 0,
            featureAdoption: userAnalytics.feature_adoption_rate || 0,
            costEstimate: userAnalytics.cost_estimate || 0,
            totalRequests: userAnalytics.total_requests || 0,
          };
        }
      } catch (error) {
        logger.error("Error fetching user AI analytics:", error);
      }
    }

    return aiSummary;
  }

  // Extract metrics by pattern
  private extractMetricsByPattern(
    counters: any,
    prefix: string,
    suffix: string,
    skipModel = false
  ) {
    const result: any = {};

    for (const [key, value] of Object.entries(counters)) {
      if (key.startsWith(prefix) && key.endsWith(suffix)) {
        const metricName = key.substring(
          prefix.length,
          key.length - suffix.length
        );

        // Skip model metrics if requested (for action extraction)
        if (
          skipModel &&
          (metricName.includes("gpt") ||
            metricName.includes("claude") ||
            metricName.includes("gemini") ||
            metricName.includes("llama"))
        ) {
          continue;
        }

        result[metricName] = value;
      }
    }

    return result;
  }

  // Extract timing stats
  private extractTimingStats(timings: any, pattern: string) {
    const result: any = {};

    for (const [key, value] of Object.entries(timings)) {
      if (key.includes(pattern)) {
        result[key] = value;
      }
    }

    return result;
  }

  // Reset AI metrics
  resetAIMetrics() {
    // Reset counters
    const counters = metrics["counters"];
    for (const key of counters.keys()) {
      if (key.startsWith("ai_")) {
        counters.delete(key);
      }
    }

    // Reset timings
    const timings = metrics["metrics"];
    for (const key of timings.keys()) {
      if (key.startsWith("ai_")) {
        timings.delete(key);
      }
    }

    // Reset gauges
    const gauges = metrics["gauges"];
    for (const key of gauges.keys()) {
      if (key.startsWith("ai_")) {
        gauges.delete(key);
      }
    }

    logger.info("AI metrics reset");
  }
}

// Create and export singleton instance
export const aiPerformanceMonitor = new AIPerformanceMonitor();

export default aiPerformanceMonitor;
