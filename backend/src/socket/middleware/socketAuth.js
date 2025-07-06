 // src/socket/middleware/socketAuth.js - Socket authentication middleware
const redisService = require('../../services/redisService');
const studentService = require('../../services/studentService');
const { USER_TYPES } = require('../../utils/constants');
const { createErrorResponse } = require('../../utils/helpers');
const logger = require('../../utils/logger');

class SocketAuthMiddleware {

  /**
   * Authenticate socket connection on initial connection
   */
  async authenticateConnection(socket, next) {
    try {
      // For this polling system, we allow all connections initially
      // Authentication happens per event based on user type
      
      // Log connection details
      logger.info(`Socket connection attempt: ${socket.id}`, {
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        origin: socket.handshake.headers.origin
      });

      // Check if origin is allowed (basic CORS for sockets)
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
        .split(',')
        .map(origin => origin.trim());

      const origin = socket.handshake.headers.origin;
      if (origin && !allowedOrigins.includes(origin) && !allowedOrigins.includes('*')) {
        logger.warn(`Socket connection blocked from origin: ${origin}`);
        return next(new Error('Origin not allowed'));
      }

      // Store connection metadata
      socket.metadata = {
        connectedAt: new Date().toISOString(),
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        origin: socket.handshake.headers.origin,
      };

      next();

    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }

  /**
   * Authorize teacher-specific events
   */
  async authorizeTeacher(socket, eventData, next) {
    try {
      // Check if socket is registered as teacher
      const teacherSession = await redisService.getTeacherSession();
      
      if (!teacherSession || teacherSession.socketId !== socket.id) {
        logger.warn(`Unauthorized teacher action from socket: ${socket.id}`);
        return next(createErrorResponse(
          'Unauthorized: Teacher access required',
          'TEACHER_AUTH_REQUIRED'
        ));
      }

      // Update teacher's last seen timestamp
      await redisService.setTeacherSession({
        ...teacherSession,
        lastSeen: new Date().toISOString(),
      });

      next();

    } catch (error) {
      logger.error('Teacher authorization error:', error);
      next(createErrorResponse(
        'Authorization failed',
        'TEACHER_AUTH_ERROR'
      ));
    }
  }

  /**
   * Authorize student-specific events
   */
  async authorizeStudent(socket, eventData, next) {
    try {
      // Check if socket is registered as student
      const student = await studentService.getStudentBySocketId(socket.id);
      
      if (!student) {
        logger.warn(`Unauthorized student action from socket: ${socket.id}`);
        return next(createErrorResponse(
          'Unauthorized: Please join as a student first',
          'STUDENT_AUTH_REQUIRED'
        ));
      }

      // Update student activity
      await studentService.updateStudentActivity(socket.id);

      // Attach student info to socket for use in handlers
      socket.studentInfo = student;

      next();

    } catch (error) {
      logger.error('Student authorization error:', error);
      next(createErrorResponse(
        'Authorization failed',
        'STUDENT_AUTH_ERROR'
      ));
    }
  }

  /**
   * Authorize chat messages (both teacher and student)
   */
  async authorizeChat(socket, messageData, next) {
    try {
      const { sender, senderType } = messageData;

      if (!sender || !senderType) {
        return next(createErrorResponse(
          'Sender information required',
          'INVALID_SENDER'
        ));
      }

      let isAuthorized = false;

      if (senderType === USER_TYPES.TEACHER) {
        // Verify teacher authorization
        const teacherSession = await redisService.getTeacherSession();
        isAuthorized = teacherSession && teacherSession.socketId === socket.id;
        
        if (isAuthorized) {
          socket.userInfo = {
            type: USER_TYPES.TEACHER,
            name: 'Teacher',
            socketId: socket.id,
          };
        }

      } else if (senderType === USER_TYPES.STUDENT) {
        // Verify student authorization
        const student = await studentService.getStudentBySocketId(socket.id);
        isAuthorized = student && student.name === sender;
        
        if (isAuthorized) {
          socket.userInfo = {
            type: USER_TYPES.STUDENT,
            name: student.name,
            socketId: socket.id,
          };
        }
      }

      if (!isAuthorized) {
        logger.warn(`Unauthorized chat message from: ${socket.id} as ${senderType}`);
        return next(createErrorResponse(
          'Unauthorized to send message',
          'CHAT_AUTH_FAILED'
        ));
      }

      next();

    } catch (error) {
      logger.error('Chat authorization error:', error);
      next(createErrorResponse(
        'Chat authorization failed',
        'CHAT_AUTH_ERROR'
      ));
    }
  }

  /**
   * Rate limiting for socket events
   */
  createRateLimiter(maxEvents = 10, windowMs = 60000) {
    const clients = new Map();

    return (socket, eventData, next) => {
      const clientId = socket.id;
      const now = Date.now();

      // Clean old entries
      if (clients.has(clientId)) {
        const clientData = clients.get(clientId);
        clientData.events = clientData.events.filter(
          timestamp => now - timestamp < windowMs
        );
      }

      // Get or create client data
      const clientData = clients.get(clientId) || { events: [] };

      // Check rate limit
      if (clientData.events.length >= maxEvents) {
        logger.warn(`Rate limit exceeded for socket: ${socket.id}`);
        return next(createErrorResponse(
          'Rate limit exceeded',
          'RATE_LIMIT_EXCEEDED'
        ));
      }

      // Add current event
      clientData.events.push(now);
      clients.set(clientId, clientData);

      next();
    };
  }

  /**
   * Validate poll participation
   */
  async validatePollParticipation(socket, voteData, next) {
    try {
      const { pollId, studentName } = voteData;

      // Check if there's an active poll
      const activePoll = await redisService.getActivePoll();
      if (!activePoll || activePoll.id !== pollId) {
        return next(createErrorResponse(
          'No active poll found',
          'NO_ACTIVE_POLL'
        ));
      }

      // Verify student is authenticated
      const student = await studentService.getStudentBySocketId(socket.id);
      if (!student || student.name !== studentName) {
        return next(createErrorResponse(
          'Student authentication failed',
          'INVALID_STUDENT'
        ));
      }

      // Check if student already voted
      const hasVoted = await redisService.hasVoted(pollId, studentName);
      if (hasVoted) {
        return next(createErrorResponse(
          'You have already voted in this poll',
          'ALREADY_VOTED'
        ));
      }

      next();

    } catch (error) {
      logger.error('Poll participation validation error:', error);
      next(createErrorResponse(
        'Poll validation failed',
        'POLL_VALIDATION_ERROR'
      ));
    }
  }

  /**
   * Validate student name uniqueness
   */
  async validateStudentName(socket, joinData, next) {
    try {
      const { name } = joinData;

      if (!name || !name.trim()) {
        return next(createErrorResponse(
          'Student name is required',
          'NAME_REQUIRED'
        ));
      }

      // Validate name format
      const trimmedName = name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return next(createErrorResponse(
          'Name must be 2-50 characters long',
          'INVALID_NAME_LENGTH'
        ));
      }

      if (!/^[a-zA-Z0-9\s]+$/.test(trimmedName)) {
        return next(createErrorResponse(
          'Name can only contain letters, numbers, and spaces',
          'INVALID_NAME_FORMAT'
        ));
      }

      // Check if name is already taken
      const isNameTaken = await redisService.isStudentNameTaken(trimmedName);
      if (isNameTaken) {
        return next(createErrorResponse(
          'This name is already taken. Please choose a different name.',
          'NAME_TAKEN'
        ));
      }

      next();

    } catch (error) {
      logger.error('Student name validation error:', error);
      next(createErrorResponse(
        'Name validation failed',
        'NAME_VALIDATION_ERROR'
      ));
    }
  }

  /**
   * Security middleware to prevent malicious data
   */
  sanitizeEventData(socket, eventData, next) {
    try {
      // Basic XSS protection
      const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/javascript:/gi, '')
                  .replace(/on\w+=/gi, '');
      };

      // Recursively sanitize object
      const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) {
          return typeof obj === 'string' ? sanitizeString(obj) : obj;
        }

        if (Array.isArray(obj)) {
          return obj.map(sanitizeObject);
        }

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      };

      // Sanitize the event data
      const sanitizedData = sanitizeObject(eventData);
      
      // Replace original data with sanitized version
      Object.keys(eventData).forEach(key => delete eventData[key]);
      Object.assign(eventData, sanitizedData);

      next();

    } catch (error) {
      logger.error('Data sanitization error:', error);
      next(createErrorResponse(
        'Data validation failed',
        'DATA_SANITIZATION_ERROR'
      ));
    }
  }

  /**
   * Log socket events for monitoring
   */
  logSocketEvent(eventName) {
    return (socket, eventData, next) => {
      logger.info(`Socket event: ${eventName}`, {
        socketId: socket.id,
        ip: socket.handshake.address,
        eventData: eventName.includes('vote') ? 'REDACTED' : eventData,
        timestamp: new Date().toISOString(),
      });

      next();
    };
  }

  /**
   * Create middleware chain for specific events
   */
  createMiddlewareChain(...middlewares) {
    return async (socket, eventData, callback) => {
      let index = 0;

      const next = (error) => {
        if (error) {
          logger.error(`Middleware chain failed at index ${index}:`, error);
          if (callback && typeof callback === 'function') {
            callback(error);
          }
          return;
        }

        if (index >= middlewares.length) {
          // All middleware passed, continue to event handler
          return;
        }

        const middleware = middlewares[index++];
        try {
          middleware(socket, eventData, next);
        } catch (err) {
          next(err);
        }
      };

      next();
    };
  }
}

module.exports = new SocketAuthMiddleware();