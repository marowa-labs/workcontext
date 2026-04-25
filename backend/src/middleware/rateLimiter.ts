import { Request, Response, NextFunction } from "express";

// Simple in-memory store for rate limiting
// In production, you would use Redis or another distributed store
const rateLimitStore: Record<string, { count: number; resetTime: number }> = {};

// Rate limiter middleware
export function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id || req.ip;
    const key = `${userId}:${req.path}`;
    const now = Date.now();

    // Clean up expired entries
    Object.keys(rateLimitStore).forEach((k) => {
      if (rateLimitStore[k].resetTime < now) {
        delete rateLimitStore[k];
      }
    });

    // Initialize or update the rate limit entry
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      if (rateLimitStore[key].resetTime < now) {
        // Reset window
        rateLimitStore[key] = {
          count: 1,
          resetTime: now + windowMs,
        };
      } else {
        // Increment count
        rateLimitStore[key].count++;
      }
    }

    const currentCount = rateLimitStore[key].count;
    const resetTime = rateLimitStore[key].resetTime;

    // Check if limit is exceeded
    if (currentCount > maxRequests) {
      res.status(429).json({
        success: false,
        message: "Too many requests, please try again later.",
        retryAfter: Math.ceil((resetTime - now) / 1000),
      });
      return;
    }

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - currentCount);
    res.setHeader("X-RateLimit-Reset", new Date(resetTime).toISOString());

    next();
  };
}

// Specific rate limiters for different operations
export const ssoConfigRateLimiter = createRateLimiter(10, 60 * 1000); // 10 requests per minute
export const securityConfigRateLimiter = createRateLimiter(5, 60 * 1000); // 5 requests per minute
export const adminOperationRateLimiter = createRateLimiter(100, 60 * 1000); // 100 requests per minute
