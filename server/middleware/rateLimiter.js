/**
 * middleware/rateLimiter.js – Express Rate Limiting
 * Protects the API from abuse and DDoS attacks.
 */

const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter: 100 requests per 15 minutes per IP.
 * Applied to all /api/* routes.
 */
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,    // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  skip: (req) => process.env.NODE_ENV === 'test', // Skip in test environment
});

/**
 * Auth rate limiter: 10 requests per 15 minutes per IP.
 * Applied to login/signup routes to prevent brute-force attacks.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * GitHub API rate limiter: 30 requests per minute per IP.
 * GitHub has its own rate limits; this prevents our backend from hammering it.
 */
const githubRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many GitHub data requests. Please wait a minute.',
  },
});

module.exports = { globalRateLimiter, authRateLimiter, githubRateLimiter };
