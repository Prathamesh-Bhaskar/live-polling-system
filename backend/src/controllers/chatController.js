const chatService = require('../services/chatService');
const { createErrorResponse, createSuccessResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class ChatController {

  async getMessages(req, res) {
    try {
      const { limit = 50 } = req.query;
      const messages = await chatService.getCurrentSessionMessages(parseInt(limit));

      res.json(createSuccessResponse({
        messages,
        total: messages.length,
      }, 'Chat messages retrieved successfully'));

    } catch (error) {
      logger.error('Error getting chat messages:', error);
      res.status(500).json(createErrorResponse('Failed to retrieve chat messages', 'CHAT_FETCH_ERROR'));
    }
  }

  async sendMessage(req, res) {
    try {
      const { message, sender, senderType } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json(createErrorResponse('Message cannot be empty', 'EMPTY_MESSAGE'));
      }

      if (!sender || !senderType) {
        return res.status(400).json(createErrorResponse('Sender information is required', 'INVALID_SENDER'));
      }

      const metadata = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      };

      const result = await chatService.sendMessage({
        message: message.trim(),
        sender: sender.trim(),
        senderType,
        metadata,
      }, req.headers['x-socket-id'] || 'api');

      res.status(201).json(createSuccessResponse({
        message: result.message,
      }, 'Message sent successfully'));

    } catch (error) {
      logger.error('Error sending chat message:', error);
      res.status(500).json(createErrorResponse('Failed to send message', 'MESSAGE_SEND_ERROR'));
    }
  }

  async getChatStats(req, res) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json(createErrorResponse('Session ID is required', 'INVALID_SESSION'));
      }

      const stats = await chatService.getMessageStats(sessionId);

      res.json(createSuccessResponse({
        sessionId,
        stats,
      }, 'Chat statistics retrieved successfully'));

    } catch (error) {
      logger.error('Error getting chat stats:', error);
      res.status(500).json(createErrorResponse('Failed to retrieve chat statistics', 'CHAT_STATS_ERROR'));
    }
  }
}

module.exports = new ChatController(); 