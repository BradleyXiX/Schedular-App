import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for successful logins after some time
    return false;
  }
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

export const createScheduleLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 creates per minute
  message: 'Too many schedules created, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});
