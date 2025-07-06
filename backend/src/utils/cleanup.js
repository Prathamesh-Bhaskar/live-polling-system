 // ===================================================================
const redisService = require('../services/redisService');
const timerService = require('../services/timerService');
const Session = require('../models/Session');
const { disconnectDatabase } = require('../config/database');
const { disconnectRedis } = require('../config/redis');
const logger = require('./logger');

class CleanupService {
  
  constructor() {
    this.isShuttingDown = false;
    this.cleanupInterval = null;
  }

  // Initialize periodic cleanup
  startPeriodicCleanup() {
    // Run cleanup every 10 minutes
    this.cleanupInterval = setInterval(async () => {
      await this.performRoutineCleanup();
    }, 10 * 60 * 1000);

    logger.info('Periodic cleanup service started');
  }

  // Stop periodic cleanup
  stopPeriodicCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Periodic cleanup service stopped');
    }
  }

  // Routine cleanup tasks
  async performRoutineCleanup() {
    try {
      logger.info('Performing routine cleanup...');

      // Clean up expired sessions
      await this.cleanupExpiredSessions();

      // Clean up inactive students (optional)
      await this.cleanupInactiveStudents();

      // Clean up old poll data
      await this.cleanupOldPollData();

      logger.info('Routine cleanup completed');

    } catch (error) {
      logger.error('Error during routine cleanup:', error);
    }
  }

  // Clean up expired sessions
  async cleanupExpiredSessions() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const expiredSessions = await Session.find({
        isActive: true,
        'teacherInfo.lastSeen': { $lt: oneHourAgo }
      });

      for (const session of expiredSessions) {
        await session.endSession();
        logger.info(`Expired session cleaned up: ${session.sessionId}`);
      }

      return expiredSessions.length;

    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  // Clean up inactive students
  async cleanupInactiveStudents() {
    try {
      const students = await redisService.getConnectedStudents();
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      let cleanedCount = 0;

      for (const student of students) {
        const lastSeen = new Date(student.lastSeen);
        if (lastSeen < tenMinutesAgo) {
          await redisService.removeStudent(student.socketId);
          cleanedCount++;
          logger.info(`Inactive student cleaned up: ${student.name}`);
        }
      }

      return cleanedCount;

    } catch (error) {
      logger.error('Error cleaning up inactive students:', error);
      return 0;
    }
  }

  // Clean up old poll data
  async cleanupOldPollData() {
    try {
      // Check for polls that should have ended but timer might have failed
      const activePoll = await redisService.getActivePoll();
      
      if (activePoll) {
        const pollAge = Date.now() - new Date(activePoll.startTime).getTime();
        const maxPollDuration = (activePoll.duration + 60) * 1000; // Poll duration + 1 minute grace

        if (pollAge > maxPollDuration) {
          // Force end the poll
          await redisService.clearActivePoll();
          timerService.stopTimer(activePoll.id);
          logger.warn(`Force-ended orphaned poll: ${activePoll.id}`);
          return 1;
        }
      }

      return 0;

    } catch (error) {
      logger.error('Error cleaning up old poll data:', error);
      return 0;
    }
  }

  // Emergency cleanup on shutdown
  async emergencyCleanup() {
    try {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      logger.info('Starting emergency cleanup...');

      // Stop all timers
      const stoppedTimers = timerService.stopAllTimers();
      logger.info(`Stopped ${stoppedTimers} active timers`);

      // Clear Redis data
      await redisService.cleanup();

      // End active sessions
      const activeSessions = await Session.find({ isActive: true });
      for (const session of activeSessions) {
        await session.endSession();
      }
      logger.info(`Ended ${activeSessions.length} active sessions`);

      // Stop periodic cleanup
      this.stopPeriodicCleanup();

      logger.info('Emergency cleanup completed');

    } catch (error) {
      logger.error('Error during emergency cleanup:', error);
    }
  }

  // Full shutdown cleanup
  async shutdown() {
    try {
      logger.info('Starting graceful shutdown...');

      // Emergency cleanup
      await this.emergencyCleanup();

      // Disconnect databases
      await disconnectRedis();
      await disconnectDatabase();

      logger.info('Graceful shutdown completed');

    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }

  // Setup signal handlers for graceful shutdown
  setupGracefulShutdown() {
    const signals = ['SIGTERM', 'SIGINT', 'SIGQUIT'];

    signals.forEach(signal => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, starting graceful shutdown...`);
        await this.shutdown();
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception:', error);
      await this.emergencyCleanup();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      await this.emergencyCleanup();
      process.exit(1);
    });

    logger.info('Graceful shutdown handlers registered');
  }
}

module.exports = new CleanupService();