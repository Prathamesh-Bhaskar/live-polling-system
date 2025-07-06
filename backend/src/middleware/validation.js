const { body, param, validationResult } = require('express-validator');
const { 
  MAX_QUESTION_LENGTH, 
  MAX_OPTION_LENGTH, 
  MAX_MESSAGE_LENGTH,
  MAX_STUDENT_NAME_LENGTH,
  MIN_POLL_OPTIONS,
  MAX_POLL_OPTIONS,
  USER_TYPES
} = require('../utils/constants');
const { createErrorResponse } = require('../utils/helpers');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json(createErrorResponse(
      'Validation failed',
      'VALIDATION_ERROR',
      errorMessages
    ));
  }
  next();
};

// Poll validation
const validatePollRequest = [
  body('question')
    .notEmpty()
    .withMessage('Question is required')
    .isLength({ max: MAX_QUESTION_LENGTH })
    .withMessage(`Question cannot exceed ${MAX_QUESTION_LENGTH} characters`)
    .trim(),
  
  body('options')
    .isArray({ min: MIN_POLL_OPTIONS, max: MAX_POLL_OPTIONS })
    .withMessage(`Must have ${MIN_POLL_OPTIONS}-${MAX_POLL_OPTIONS} options`)
    .custom((options) => {
      if (!Array.isArray(options)) return false;
      
      const validOptions = options.filter(option => 
        typeof option === 'string' && 
        option.trim().length > 0 && 
        option.trim().length <= MAX_OPTION_LENGTH
      );
      
      if (validOptions.length < MIN_POLL_OPTIONS) {
        throw new Error(`At least ${MIN_POLL_OPTIONS} valid options are required`);
      }
      
      return true;
    }),
  
  body('duration')
    .optional()
    .isInt({ min: 10, max: 300 })
    .withMessage('Duration must be between 10 and 300 seconds'),
  
  handleValidationErrors,
];

// Poll ID validation - Fixed to be more flexible with MongoDB ObjectId format
const validatePollId = [
  param('pollId')
    .notEmpty()
    .withMessage('Poll ID is required')
    .isLength({ min: 12, max: 24 })
    .withMessage('Invalid poll ID format')
    .matches(/^[a-fA-F0-9]{12,24}$/)
    .withMessage('Poll ID must be a valid MongoDB ObjectId'),
  
  handleValidationErrors,
];

// Student name validation
const validateStudentName = [
  body('name')
    .notEmpty()
    .withMessage('Student name is required')
    .isLength({ min: 2, max: MAX_STUDENT_NAME_LENGTH })
    .withMessage(`Name must be 2-${MAX_STUDENT_NAME_LENGTH} characters`)
    .matches(/^[a-zA-Z0-9\s]+$/)
    .withMessage('Name can only contain letters, numbers, and spaces')
    .trim(),
  
  handleValidationErrors,
];

// Chat message validation
const validateChatMessage = [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: MAX_MESSAGE_LENGTH })
    .withMessage(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`)
    .trim(),
  
  body('sender')
    .notEmpty()
    .withMessage('Sender is required')
    .isLength({ max: MAX_STUDENT_NAME_LENGTH })
    .withMessage(`Sender name cannot exceed ${MAX_STUDENT_NAME_LENGTH} characters`)
    .trim(),
  
  body('senderType')
    .notEmpty()
    .withMessage('Sender type is required')
    .isIn(Object.values(USER_TYPES))
    .withMessage('Invalid sender type'),
  
  handleValidationErrors,
];

// Vote validation
const validateVote = [
  body('pollId')
    .notEmpty()
    .withMessage('Poll ID is required')
    .isLength({ min: 12, max: 24 })
    .withMessage('Invalid poll ID format')
    .matches(/^[a-fA-F0-9]{12,24}$/)
    .withMessage('Poll ID must be a valid MongoDB ObjectId'),
  
  body('selectedOption')
    .notEmpty()
    .withMessage('Selected option is required')
    .isLength({ max: MAX_OPTION_LENGTH })
    .withMessage(`Option cannot exceed ${MAX_OPTION_LENGTH} characters`)
    .trim(),
  
  body('studentName')
    .notEmpty()
    .withMessage('Student name is required')
    .isLength({ max: MAX_STUDENT_NAME_LENGTH })
    .withMessage(`Student name cannot exceed ${MAX_STUDENT_NAME_LENGTH} characters`)
    .trim(),
  
  handleValidationErrors,
];

// Session validation - Fixed to be more flexible
const validateSessionId = [
  param('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Session ID must be 5-100 characters long')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Session ID can only contain letters, numbers, underscores, and hyphens'),
  
  handleValidationErrors,
];

module.exports = {
  validatePollRequest,
  validatePollId,
  validateStudentName,
  validateChatMessage,
  validateVote,
  validateSessionId,
  handleValidationErrors,
};