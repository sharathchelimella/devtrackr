/**
 * utils/asyncHandler.js – Async Route Handler Wrapper
 * Eliminates repetitive try/catch in every controller by wrapping async functions.
 */

/**
 * Wraps an async Express handler to forward errors to the global error handler.
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
