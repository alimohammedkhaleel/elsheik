import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/apiResponse';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipBuckets = new Map<string, RateLimitRecord>();

const MAX_BUCKETS_CAP = 10000;

function cleanupExpiredBuckets(now = Date.now()): void {
  for (const [key, record] of ipBuckets.entries()) {
    if (now > record.resetTime) {
      ipBuckets.delete(key);
    }
  }
}

// Cleanup stale rate limit records every 2 minutes
setInterval(() => {
  cleanupExpiredBuckets();
}, 2 * 60 * 1000).unref();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = 'تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً.',
    keyGenerator = (req: Request) =>
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown',
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip rate limiting in testing mode
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const key = `${req.baseUrl || ''}${req.path}:${keyGenerator(req)}`;
    const now = Date.now();

    const record = ipBuckets.get(key);

    if (!record || now > record.resetTime) {
      if (ipBuckets.size >= MAX_BUCKETS_CAP) {
        cleanupExpiredBuckets(now);
        if (ipBuckets.size >= MAX_BUCKETS_CAP) {
          const firstKey = ipBuckets.keys().next().value;
          if (firstKey) ipBuckets.delete(firstKey);
        }
      }
      ipBuckets.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', max - 1);
      res.setHeader('RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
      return next();
    }

    record.count += 1;
    const remaining = Math.max(0, max - record.count);
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      ResponseUtil.error(res, message, 429, 'RATE_LIMIT_EXCEEDED', {
        retryAfterSeconds: retryAfterSec,
      });
      return;
    }

    next();
  };
};

/**
 * Strict rate limiter for Authentication (Login / Register): 15 attempts per 15 minutes.
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'تم تجاوز عدد محاولات تسجيل الدخول المسموح بها، يرجى الانتظار قبل المحاولة مرة أخرى.',
});

/**
 * General API rate limiter: 600 requests per minute.
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 600,
  message: 'تم تجاوز معدل الطلبات المسموح به للـ API.',
});
