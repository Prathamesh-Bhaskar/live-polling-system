const pollService = require('../services/pollService');
const { createErrorResponse, createSuccessResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class PollController {

  async getAllPolls(req, res) {
    try {
      const { limit = 50 } = req.query;
      const polls = await pollService.getAllPolls(parseInt(limit));

      res.json(createSuccessResponse({
        polls,
        total: polls.length,
      }, 'Polls retrieved successfully'));

    } catch (error) {
      logger.error('Error getting all polls:', error);
      res.status(500).json(createErrorResponse('Failed to retrieve polls', 'POLLS_FETCH_ERROR'));
    }
  }

  async getCurrentPoll(req, res) {
    try {
      const currentPoll = await pollService.getCurrentPoll();

      if (!currentPoll) {
        return res.status(404).json(createErrorResponse('No active poll found', 'NO_ACTIVE_POLL'));
      }

      res.json(createSuccessResponse({
        poll: currentPoll,
      }, 'Current poll retrieved successfully'));

    } catch (error) {
      logger.error('Error getting current poll:', error);
      res.status(500).json(createErrorResponse('Failed to retrieve current poll', 'CURRENT_POLL_ERROR'));
    }
  }

  async getPollById(req, res) {
    try {
      const { pollId } = req.params;

      // This would require a new service method to get poll by ID
      // For now, we'll return the current poll if it matches
      const currentPoll = await pollService.getCurrentPoll();
      
      if (currentPoll && currentPoll.id === pollId) {
        res.json(createSuccessResponse({
          poll: currentPoll,
        }, 'Poll retrieved successfully'));
      } else {
        res.status(404).json(createErrorResponse('Poll not found', 'POLL_NOT_FOUND'));
      }

    } catch (error) {
      logger.error('Error getting poll by ID:', error);
      res.status(500).json(createErrorResponse('Failed to retrieve poll', 'POLL_FETCH_ERROR'));
    }
  }

  async getPollResults(req, res) {
    try {
      const { pollId } = req.params;
      const results = await pollService.getLiveResults(pollId);

      res.json(createSuccessResponse({
        pollId,
        results: results.results,
        totalVotes: results.totalVotes,
        voterCount: results.voterCount,
        connectedStudents: results.connectedStudents,
        responseRate: results.responseRate,
      }, 'Poll results retrieved successfully'));

    } catch (error) {
      logger.error('Error getting poll results:', error);
      res.status(500).json(createErrorResponse('Failed to retrieve poll results', 'RESULTS_FETCH_ERROR'));
    }
  }

  async getPollHistory(req, res) {
    try {
      const { limit = 10 } = req.query;
      // This would need teacher authentication in a real app
      const teacherSocketId = req.headers['x-teacher-socket-id'];

      if (!teacherSocketId) {
        return res.status(401).json(createErrorResponse('Teacher authentication required', 'AUTH_REQUIRED'));
      }

      const pollHistory = await pollService.getPollHistory(teacherSocketId, parseInt(limit));

      res.json(createSuccessResponse({
        polls: pollHistory,
        total: pollHistory.length,
      }, 'Poll history retrieved successfully'));

    } catch (error) {
      logger.error('Error getting poll history:', error);
      res.status(500).json(createErrorResponse('Failed to retrieve poll history', 'HISTORY_FETCH_ERROR'));
    }
  }
}

module.exports = new PollController(); 