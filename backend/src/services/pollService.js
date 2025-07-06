const Poll = require('../models/Poll');
const Session = require('../models/Session');
const redisService = require('./redisService');
const { generateId, generateSessionId, validatePollOptions } = require('../utils/helpers');
const { POLL_STATUS, MAX_POLL_DURATION, MIN_POLL_DURATION } = require('../utils/constants');
const logger = require('../utils/logger');

class PollService {
  
  async createPoll(pollData, teacherSocketId) {
    try {
      const { question, options, duration = 60, sessionId: providedSessionId } = pollData;

      // Validation
      if (!question || !question.trim()) {
        throw new Error('Question is required');
      }

      if (!validatePollOptions(options)) {
        throw new Error('Invalid poll options');
      }

      if (duration < MIN_POLL_DURATION || duration > MAX_POLL_DURATION) {
        throw new Error(`Duration must be between ${MIN_POLL_DURATION} and ${MAX_POLL_DURATION} seconds`);
      }

      // Check if there's an active poll
      const activePoll = await redisService.getActivePoll();
      if (activePoll) {
        throw new Error('There is already an active poll. End the current poll first.');
      }

      // Get or create session
      let session;
      if (providedSessionId) {
        session = await Session.findOne({ sessionId: providedSessionId });
      } else {
        session = await Session.findActiveSession();
      }
      if (!session) {
        session = new Session({
          sessionId: providedSessionId || generateSessionId(),
          teacherInfo: {
            socketId: teacherSocketId,
            joinedAt: new Date(),
          },
        });
        await session.save();
      }

      // Create poll in MongoDB
      const poll = new Poll({
        question: question.trim(),
        options: options.map(opt => opt.trim()),
        duration,
        sessionId: session.sessionId,
        teacherSocketId,
        status: POLL_STATUS.ACTIVE,
      });

      await poll.save();

      // Set up Redis for real-time tracking
      const pollRedisData = {
        id: poll._id.toString(),
        question: poll.question,
        options: poll.options,
        duration: poll.duration,
        startTime: poll.startedAt.toISOString(),
        teacherSocketId,
      };

      await redisService.setActivePoll(pollRedisData);
      await redisService.initializePollVotes(poll._id.toString(), poll.options);

      // Update session stats
      await session.incrementPollCount();

      logger.info(`Poll created: ${poll._id} by ${teacherSocketId}`);

      return {
        poll: poll.toObject(),
        sessionId: session.sessionId,
      };

    } catch (error) {
      logger.error('Error creating poll:', error);
      throw error;
    }
  }

  async endPoll(pollId, teacherSocketId) {
    try {
      // Get poll from database
      const poll = await Poll.findById(pollId);
      if (!poll) {
        throw new Error('Poll not found');
      }

      if (poll.teacherSocketId !== teacherSocketId) {
        throw new Error('Unauthorized to end this poll');
      }

      if (poll.status === POLL_STATUS.ENDED) {
        throw new Error('Poll already ended');
      }

      // Get final results from Redis
      const finalResults = await redisService.getPollResults(pollId);
      const totalVotes = Object.values(finalResults).reduce((sum, count) => sum + count, 0);

      // Update poll in database
      await poll.endPoll(finalResults);
      poll.totalVotes = totalVotes;
      await poll.save();

      // Get connected students count for statistics
      const connectedStudents = await redisService.getConnectedStudents();
      poll.totalStudents = connectedStudents.length;
      await poll.save();

      // Clear Redis data
      await redisService.clearActivePoll();
      await redisService.clearPollVotes(pollId);

      logger.info(`Poll ended: ${pollId}`);

      return {
        poll: poll.toObject(),
        finalResults,
        totalVotes,
        totalStudents: connectedStudents.length,
      };

    } catch (error) {
      logger.error('Error ending poll:', error);
      throw error;
    }
  }

  async getCurrentPoll() {
    try {
      const activePoll = await redisService.getActivePoll();
      if (!activePoll) {
        return null;
      }

      const liveResults = await redisService.getPollResults(activePoll.id);
      
      return {
        ...activePoll,
        results: liveResults,
      };
    } catch (error) {
      logger.error('Error getting current poll:', error);
      return null;
    }
  }

  async getLiveResults(pollId) {
    try {
      const results = await redisService.getPollResults(pollId);
      const voterCount = await redisService.getVoterCount(pollId);
      const connectedStudents = await redisService.getConnectedStudents();

      return {
        results,
        totalVotes: Object.values(results).reduce((sum, count) => sum + count, 0),
        voterCount,
        connectedStudents: connectedStudents.length,
        responseRate: connectedStudents.length > 0 
          ? Math.round((voterCount / connectedStudents.length) * 100) 
          : 0,
      };
    } catch (error) {
      logger.error('Error getting live results:', error);
      return { results: {}, totalVotes: 0, voterCount: 0, connectedStudents: 0, responseRate: 0 };
    }
  }

  async submitVote(pollId, option, studentName, socketId) {
    try {
      // Check if poll exists and is active
      const activePoll = await redisService.getActivePoll();
      if (!activePoll || activePoll.id !== pollId) {
        throw new Error('No active poll found');
      }

      // Check if student has already voted
      const hasVoted = await redisService.hasVoted(pollId, studentName);
      if (hasVoted) {
        throw new Error('Student has already voted');
      }

      // Validate option
      if (!activePoll.options.includes(option)) {
        throw new Error('Invalid option selected');
      }

      // Record vote
      await redisService.addVoter(pollId, studentName);
      await redisService.incrementVote(pollId, option);
      
      // Update student status in Redis
      await redisService.updateStudentStatus(socketId, { 
        hasVoted: true, 
        votedAt: new Date().toISOString() 
      });

      logger.info(`Vote submitted: ${studentName} voted for "${option}" in poll ${pollId}`);

      // Return updated results
      return await this.getLiveResults(pollId);

    } catch (error) {
      logger.error('Error submitting vote:', error);
      throw error;
    }
  }

  async getPollHistory(teacherSocketId, limit = 10) {
    try {
      logger.info(`[getPollHistory] teacherSocketId: ${teacherSocketId}`);
      // Get teacher's session
      const session = await Session.findOne({
        'teacherInfo.socketId': teacherSocketId,
        isActive: true,
      });
      logger.info(`[getPollHistory] session found: ${!!session} sessionId: ${session ? session.sessionId : 'none'}`);
      if (!session) {
        logger.info('[getPollHistory] No active session found for teacher. Returning empty history.');
        return [];
      }
      // Get polls from this session
      const polls = await Poll.findBySessionId(session.sessionId)
        .limit(limit)
        .lean();
      logger.info(`[getPollHistory] Polls found: ${polls.length}`);
      return polls.map(poll => ({
        ...poll,
        id: poll._id.toString(),
        results: Array.isArray(poll.results)
          ? Object.fromEntries(poll.results)
          : (poll.results || {}),
      }));
    } catch (error) {
      logger.error('Error getting poll history:', error);
      return [];
    }
  }

  async getAllPolls(limit = 50) {
    try {
      const polls = await Poll.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return polls.map(poll => ({
        ...poll,
        id: poll._id.toString(),
        results: Array.isArray(poll.results)
          ? Object.fromEntries(poll.results)
          : (poll.results || {}),
      }));

    } catch (error) {
      logger.error('Error getting all polls:', error);
      return [];
    }
  }

  async getSessionStats(sessionId) {
    try {
      const session = await Session.getSessionStats(sessionId);
      const polls = await Poll.findBySessionId(sessionId);
      
      const totalVotes = polls.reduce((sum, poll) => sum + poll.totalVotes, 0);
      const avgResponseRate = polls.length > 0 
        ? polls.reduce((sum, poll) => sum + poll.completionRate, 0) / polls.length 
        : 0;

      return {
        session,
        pollCount: polls.length,
        totalVotes,
        avgResponseRate: Math.round(avgResponseRate),
      };

    } catch (error) {
      logger.error('Error getting session stats:', error);
      return null;
    }
  }

  async getPollHistoryBySessionId(sessionId, limit = 10) {
    try {
      const polls = await Poll.findBySessionId(sessionId)
        .limit(limit)
        .lean();
      return polls.map(poll => ({
        ...poll,
        id: poll._id.toString(),
        results: Array.isArray(poll.results)
          ? Object.fromEntries(poll.results)
          : (poll.results || {}),
      }));
    } catch (error) {
      logger.error('Error getting poll history by sessionId:', error);
      return [];
    }
  }
}

module.exports = new PollService(); 