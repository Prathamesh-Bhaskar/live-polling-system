const EventEmitter = require('events');
const logger = require('../utils/logger');

class TimerService extends EventEmitter {
  constructor() {
    super();
    this.activeTimers = new Map();
  }

  startTimer(pollId, duration, onTick, onComplete) {
    try {
      // Clear any existing timer for this poll
      this.stopTimer(pollId);

      let timeRemaining = duration;
      
      logger.info(`Timer started for poll ${pollId}: ${duration} seconds`);

      const timer = setInterval(() => {
        timeRemaining--;

        // Emit tick event
        if (onTick) {
          onTick(timeRemaining);
        }

        this.emit('tick', { pollId, timeRemaining });

        // Check if time is up
        if (timeRemaining <= 0) {
          this.stopTimer(pollId);
          
          if (onComplete) {
            onComplete();
          }

          this.emit('complete', { pollId });
          logger.info(`Timer completed for poll ${pollId}`);
        }
      }, 1000);

      // Store timer reference
      this.activeTimers.set(pollId, {
        timer,
        startTime: new Date(),
        duration,
        timeRemaining,
      });

      return timer;

    } catch (error) {
      logger.error('Error starting timer:', error);
      throw error;
    }
  }

  stopTimer(pollId) {
    try {
      const timerData = this.activeTimers.get(pollId);
      
      if (timerData) {
        clearInterval(timerData.timer);
        this.activeTimers.delete(pollId);
        
        this.emit('stopped', { pollId });
        logger.info(`Timer stopped for poll ${pollId}`);
        
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error stopping timer:', error);
      return false;
    }
  }

  getTimeRemaining(pollId) {
    try {
      const timerData = this.activeTimers.get(pollId);
      
      if (!timerData) {
        return 0;
      }

      const elapsed = Math.floor((new Date() - timerData.startTime) / 1000);
      const remaining = Math.max(0, timerData.duration - elapsed);
      
      return remaining;
    } catch (error) {
      logger.error('Error getting time remaining:', error);
      return 0;
    }
  }

  isTimerActive(pollId) {
    return this.activeTimers.has(pollId);
  }

  getAllActiveTimers() {
    const timers = {};
    
    this.activeTimers.forEach((timerData, pollId) => {
      timers[pollId] = {
        startTime: timerData.startTime,
        duration: timerData.duration,
        timeRemaining: this.getTimeRemaining(pollId),
      };
    });

    return timers;
  }

  stopAllTimers() {
    try {
      const pollIds = Array.from(this.activeTimers.keys());
      
      pollIds.forEach(pollId => {
        this.stopTimer(pollId);
      });

      logger.info(`Stopped ${pollIds.length} active timers`);
      
      return pollIds.length;
    } catch (error) {
      logger.error('Error stopping all timers:', error);
      return 0;
    }
  }

  // Get timer statistics
  getTimerStats() {
    return {
      activeTimers: this.activeTimers.size,
      timers: this.getAllActiveTimers(),
    };
  }
}

module.exports = new TimerService(); 