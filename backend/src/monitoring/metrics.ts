import logger from "./logger";

// Simple in-memory metrics storage
class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();

  // Record a timing metric
  recordTiming(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(value);

    // Keep only the last 1000 values to prevent memory issues
    if (metrics.length > 1000) {
      metrics.shift();
    }

    logger.info(`Timing metric recorded: ${name} = ${value}ms`);
  }

  // Increment a counter
  incrementCounter(name: string, value: number = 1) {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
    logger.info(`Counter incremented: ${name} = ${current + value}`);
  }

  // Set a gauge value
  setGauge(name: string, value: number) {
    this.gauges.set(name, value);
    logger.info(`Gauge set: ${name} = ${value}`);
  }

  // Get timing statistics
  getTimingStats(name: string) {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const sorted = [...metrics].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      count: sorted.length,
      avg,
      min,
      max,
      p50,
      p95,
      p99,
    };
  }

  // Get counter value
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  // Get gauge value
  getGauge(name: string): number {
    return this.gauges.get(name) || 0;
  }

  // Get all metrics summary
  getSummary() {
    const summary: any = {
      counters: {},
      gauges: {},
      timings: {},
    };

    // Add counters
    for (const [name, value] of this.counters.entries()) {
      summary.counters[name] = value;
    }

    // Add gauges
    for (const [name, value] of this.gauges.entries()) {
      summary.gauges[name] = value;
    }

    // Add timing stats
    for (const name of this.metrics.keys()) {
      summary.timings[name] = this.getTimingStats(name);
    }

    return summary;
  }

  // Reset all metrics
  reset() {
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
    logger.info("All metrics reset");
  }
}

// Create and export a singleton instance
export const metrics = new MetricsCollector();

// Middleware for Express to record HTTP request timings
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();

  // Record timing when response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    metrics.recordTiming(`http_request_duration`, duration);
    metrics.incrementCounter(`http_requests_total`);
    metrics.incrementCounter(`http_requests_${method.toLowerCase()}_total`);
    metrics.incrementCounter(`http_responses_${statusCode}_total`);

    logger.info(`HTTP ${method} ${route} ${statusCode} - ${duration}ms`);
  });

  next();
};

export default metrics;
