const ChatMessage = require('../models/ChatMessage');
const Session = require('../models/Session');
const redisService = require('./redisService');
const { sanitizeString } = require('../utils/helpers');
const { USER_TYPES, MAX_MESSAGE_LENGTH } = require('../utils/constants');
const logger = require('../utils/logger');

class ChatService {

  async sendMessage(messageData, socketId) {
    try {
      const { message, sender, senderType } = messageData;

      // Validation
      if (!message || !message.trim()) {
        throw new Error('Message cannot be empty');
      }

      if (message.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`);
      }

      if (!Object.values(USER_TYPES).includes(senderType)) {
        throw new Error('Invalid sender type');
      }

      // Get session ID
      let sessionId;
      if (senderType === USER_TYPES.TEACHER) {
        const teacherSession = await redisService.getTeacherSession();
        if (!teacherSession) {
          throw new Error('Teacher session not found');
        }
        sessionId = teacherSession.sessionId || 'default';
      } else {
        // For students, get session from active session
        const session = await Session.findActiveSession();
        sessionId = session ? session.sessionId : 'default';
      }

      // Create chat message
      const chatMessage = new ChatMessage({
        message: sanitizeString(message),
        sender: sanitizeString(sender),
        senderType,
        sessionId,
        socketId,
        metadata: messageData.metadata || {},
      });

      await chatMessage.save();

      // Update session message count
      const session = await Session.findOne({ sessionId });
      if (session) {
        await session.incrementMessageCount();
      }

      logger.info(`Chat message sent: ${sender} (${senderType})`);

      return {
        message: chatMessage.toObject(),
      };

    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessages(sessionId, limit = 50) {
    try {
      const messages = await ChatMessage.findBySessionId(sessionId, limit);
      
      // Reverse to get chronological order (oldest first)
      return messages.reverse().map(msg => ({
        ...msg,
        id: msg._id.toString(),
      }));

    } catch (error) {
      logger.error('Error getting messages:', error);
      return [];
    }
  }

  async getCurrentSessionMessages(limit = 50) {
    try {
      const session = await Session.findActiveSession();
      if (!session) {
        return [];
      }

      return await this.getMessages(session.sessionId, limit);
    } catch (error) {
      logger.error('Error getting current session messages:', error);
      return [];
    }
  }

  async deleteMessage(messageId, userSocketId, userType) {
    try {
      const message = await ChatMessage.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Authorization check
      const canDelete = 
        (userType === USER_TYPES.TEACHER) || // Teachers can delete any message
        (message.socketId === userSocketId); // Users can delete their own messages

      if (!canDelete) {
        throw new Error('Unauthorized to delete this message');
      }

      await message.softDelete();

      logger.info(`Message deleted: ${messageId} by ${userSocketId}`);

      return {
        deletedMessage: message.toObject(),
      };

    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  }

  async getMessageStats(sessionId) {
    try {
      const totalMessages = await ChatMessage.countBySessionId(sessionId);
      
      const messagesByType = await ChatMessage.aggregate([
        { $match: { sessionId, isDeleted: false } },
        { $group: { _id: '$senderType', count: { $sum: 1 } } }
      ]);

      const stats = {
        total: totalMessages,
        byType: {},
      };

      messagesByType.forEach(item => {
        stats.byType[item._id] = item.count;
      });

      return stats;
    } catch (error) {
      logger.error('Error getting message stats:', error);
      return { total: 0, byType: {} };
    }
  }
}

module.exports = new ChatService(); 