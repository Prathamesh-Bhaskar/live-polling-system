const logger = require('../utils/logger');
const { createErrorResponse } = require('../utils/helpers');

const errorHandler = (err, req, res, next) => {
  logger.error('Error caught by error handler:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message,
    }));

    return res.status(400).json(createErrorResponse(
      'Validation failed',
      'MONGOOSE_VALIDATION_ERROR',
      errors
    ));
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json(createErrorResponse(
      'Invalid ID format',
      'INVALID_ID'
    ));
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json(createErrorResponse(
      `${field} already exists`,
      'DUPLICATE_ENTRY'
    ));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(createErrorResponse(
      'Invalid token',
      'INVALID_TOKEN'
    ));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(createErrorResponse(
      'Token expired',
      'TOKEN_EXPIRED'
    ));
  }

  // Rate limit error
  if (err.status === 429) {
    return res.status(429).json(createErrorResponse(
      'Too many requests, please try again later',
      'RATE_LIMIT_EXCEEDED'
    ));
  }

  // Socket.io errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(createErrorResponse(
      'Invalid JSON format',
      'INVALID_JSON'
    ));
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json(createErrorResponse(
    message,
    code,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  ));
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json(createErrorResponse(
    `Route ${req.originalUrl} not found`,
    'ROUTE_NOT_FOUND'
  ));
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
}; 