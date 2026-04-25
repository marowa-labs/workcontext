/**
 * Circuit Breaker Service for LemonSqueezy API calls
 */

// Circuit breaker states
type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  timeout: number; // Time in ms before allowing test call in OPEN state
  successThreshold: number; // Number of successes in HALF_OPEN before closing
}

class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open and timeout hasn't expired
    if (this.state === "OPEN" && Date.now() < this.nextAttempt) {
      throw new Error("Circuit breaker is OPEN - service unavailable");
    }

    try {
      // Execute the operation
      const result = await operation();

      // If successful, reset failure count and potentially close circuit
      this.onSuccess();

      return result;
    } catch (error) {
      // If failed, increment failure count and potentially open circuit
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === "HALF_OPEN") {
      this.successCount++;

      // If we've reached the success threshold, close the circuit
      if (this.successCount >= this.config.successThreshold) {
        this.close();
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;

    // If we've reached the failure threshold, open the circuit
    if (this.failureCount >= this.config.failureThreshold) {
      this.open();
    }
  }

  private open(): void {
    this.state = "OPEN";
    this.nextAttempt = Date.now() + this.config.timeout;
    console.warn(
      `Circuit breaker opened. Will attempt to close in ${this.config.timeout}ms`
    );
  }

  private close(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    console.info("Circuit breaker closed");
  }

  public halfOpen(): void {
    this.state = "HALF_OPEN";
    this.successCount = 0;
    console.info("Circuit breaker moved to HALF_OPEN state");
  }

  // Get current state for monitoring
  public getState(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    nextAttempt: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.nextAttempt,
    };
  }
}

// Create a circuit breaker instance for LemonSqueezy API calls
const lemonSqueezyCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5, // Open circuit after 5 failures
  timeout: 60000, // Wait 60 seconds before trying again
  successThreshold: 3, // Need 3 successful calls to close circuit
});

export { CircuitBreaker, lemonSqueezyCircuitBreaker };
