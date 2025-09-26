import { RATE_LIMIT_WINDOW, RATE_LIMIT_MAX_REQUESTS } from './config.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private userLimits = new Map<string, RateLimitEntry>();

  isRateLimited(userId: string): boolean {
    const now = Date.now();
    const entry = this.userLimits.get(userId);

    if (!entry) {
      // First request from this user
      this.userLimits.set(userId, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      });
      return false;
    }

    if (now > entry.resetTime) {
      // Reset window has passed
      this.userLimits.set(userId, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      });
      return false;
    }

    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
      return true;
    }

    // Increment count
    entry.count++;
    return false;
  }

  getTimeUntilReset(userId: string): number {
    const entry = this.userLimits.get(userId);
    if (!entry) return 0;
    
    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  // Clean up old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [userId, entry] of this.userLimits.entries()) {
      if (now > entry.resetTime) {
        this.userLimits.delete(userId);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Clean up old entries every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);
