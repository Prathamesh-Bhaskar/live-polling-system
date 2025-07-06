const { v4: uuidv4 } = require('uuid');

/**
 * Generate unique ID
 */
const generateId = () => {
  return uuidv4();
};

/**
 * Generate session ID
 */
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Validate poll options
 */
const validatePollOptions = (options) => {
  if (!Array.isArray(options)) return false;
  if (options.length < 2 || options.length > 6) return false;
  
  const validOptions = options.filter(opt => 
    typeof opt === 'string' && opt.trim().length > 0 && opt.trim().length <= 100
  );
  
  return validOptions.length >= 2;
};

/**
 * Calculate percentage
 */
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Format timestamp
 */
const formatTimestamp = (date = new Date()) => {
  return date.toISOString();
};

/**
 * Parse duration string to seconds
 */
const parseDuration = (duration) => {
  if (typeof duration === 'number') return duration;
  if (typeof duration === 'string') {
    const parsed = parseInt(duration);
    return isNaN(parsed) ? 60 : parsed;
  }
  return 60;
};

/**
 * Validate student name
 */
const validateStudentName = (name) => {
  if (typeof name !== 'string') return false;
  const cleaned = name.trim();
  return cleaned.length >= 2 && cleaned.length <= 50 && /^[a-zA-Z0-9\s]+$/.test(cleaned);
};

/**
 * Create error response
 */
const createErrorResponse = (message, code = 'GENERAL_ERROR', details = null) => {
  return {
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: formatTimestamp(),
    },
  };
};

/**
 * Create success response
 */
const createSuccessResponse = (data = null, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: formatTimestamp(),
  };
};

/**
 * Delay function for testing/simulation
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Safe JSON parse
 */
const safeJSONParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Safe JSON stringify
 */
const safeJSONStringify = (obj, defaultValue = '{}') => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    return defaultValue;
  }
};

module.exports = {
  generateId,
  generateSessionId,
  sanitizeString,
  validatePollOptions,
  calculatePercentage,
  formatTimestamp,
  parseDuration,
  validateStudentName,
  createErrorResponse,
  createSuccessResponse,
  delay,
  safeJSONParse,
  safeJSONStringify,
}; 