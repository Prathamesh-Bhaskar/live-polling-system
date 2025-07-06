const rateLimit = require('express-rate-limit');
const { createErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: createErrorResponse(
    'Too many API requests from this IP, please try again later.',
    'RATE_LIMIT_EXCEEDED'
  ),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(createErrorResponse(
      'Too many requests from this IP, please try again later.',
      'RATE_LIMIT_EXCEEDED'
    ));
  },
});

// Strict rate limiter for poll creation
const pollCreationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit to 10 poll creations per 5 minutes
  message: createErrorResponse(
    'Too many polls created from this IP, please try again later.',
    'POLL_CREATION_LIMIT'
  ),
  keyGenerator: (req) => {
    // Use teacher socket ID if available, fallback to IP
    return req.headers['x-teacher-socket-id'] || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`Poll creation rate limit exceeded for: ${req.headers['x-teacher-socket-id'] || req.ip}`);
    res.status(429).json(createErrorResponse(
      'Too many polls created, please wait before creating another poll.',
      'POLL_CREATION_LIMIT'
    ));
  },
});

// Chat message rate limiter
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit to 30 messages per minute
  message: createErrorResponse(
    'Too many chat messages sent, please slow down.',
    'CHAT_RATE_LIMIT'
  ),
  keyGenerator: (req) => {
    // Use socket ID if available, fallback to IP
    return req.headers['x-socket-id'] || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`Chat rate limit exceeded for: ${req.headers['x-socket-id'] || req.ip}`);
    res.status(429).json(createErrorResponse(
      'You are sending messages too quickly. Please slow down.',
      'CHAT_RATE_LIMIT'
    ));
  },
});

// Vote submission rate limiter
const voteLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 1, // Only 1 vote per 10 seconds per student
  message: createErrorResponse(
    'Please wait before submitting another vote.',
    'VOTE_RATE_LIMIT'
  ),
  keyGenerator: (req) => {
    // Use student name + socket ID for more specific limiting
    const studentName = req.body?.studentName || '';
    const socketId = req.headers['x-socket-id'] || '';
    return `${studentName}_${socketId}_${req.ip}`;
  },
  handler: (req, res) => {
    logger.warn(`Vote rate limit exceeded for student: ${req.body?.studentName || 'Unknown'}`);
    res.status(429).json(createErrorResponse(
      'Please wait before submitting another vote.',
      'VOTE_RATE_LIMIT'
    ));
  },
});

module.exports = {
  apiLimiter,
  pollCreationLimiter,
  chatLimiter,
  voteLimiter,
};
