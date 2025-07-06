const chatService = require('../../services/chatService');
const studentService = require('../../services/studentService');
const redisService = require('../../services/redisService');
const { SOCKET_EVENTS, USER_TYPES } = require('../../utils/constants');
const { createErrorResponse, createSuccessResponse } = require('../../utils/helpers');
const logger = require('../../utils/logger');

class ChatHandler {

  async handleSendMessage(socket, io, data, callback) {
    try {
      const { message, sender, senderType } = data;

      // Validation
      if (!message || !message.trim()) {
        if (callback) {
          callback(createErrorResponse('Message cannot be empty', 'EMPTY_MESSAGE'));
        }
        return;
      }

      if (!sender || !senderType) {
        if (callback) {
          callback(createErrorResponse('Sender information is required', 'INVALID_SENDER'));
        }
        return;
      }

      // Verify sender authorization
      let isAuthorized = false;
      
      if (senderType === USER_TYPES.TEACHER) {
        const teacherSession = await redisService.getTeacherSession();
        isAuthorized = teacherSession && teacherSession.socketId === socket.id;
      } else if (senderType === USER_TYPES.STUDENT) {
        const student = await studentService.getStudentBySocketId(socket.id);
        isAuthorized = student && student.name === sender;
      }

      if (!isAuthorized) {
        if (callback) {
          callback(createErrorResponse('Unauthorized to send message', 'UNAUTHORIZED'));
        }
        return;
      }

      // Send message
      const metadata = {
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
      };

      const result = await chatService.sendMessage({
        message: message.trim(),
        sender: sender.trim(),
        senderType,
        metadata,
      }, socket.id);

      // Broadcast message to all clients
      const messageData = {
        id: result.message._id.toString(),
        message: result.message.message,
        sender: result.message.sender,
        senderType: result.message.senderType,
        timestamp: result.message.createdAt,
      };

      io.to('main_room').emit(SOCKET_EVENTS.CHAT_MESSAGE, messageData);

      logger.info(`Chat message sent: ${sender} (${senderType}): ${message.substring(0, 50)}`);

      if (callback) {
        callback(createSuccessResponse({
          message: messageData,
        }, 'Message sent successfully'));
      }

    } catch (error) {
      logger.error('Error handling chat message:', error);
      if (callback) {
        callback(createErrorResponse(error.message || 'Failed to send message', 'CHAT_ERROR'));
      }
    }
  }

  async handleGetChatHistory(socket, io, data, callback) {
    try {
      const { limit = 50 } = data;

      const messages = await chatService.getCurrentSessionMessages(limit);

      if (callback) {
        callback(createSuccessResponse({
          messages,
          total: messages.length,
        }, 'Chat history retrieved successfully'));
      }

    } catch (error) {
      logger.error('Error getting chat history:', error);
      if (callback) {
        callback(createErrorResponse('Failed to get chat history', 'CHAT_HISTORY_ERROR'));
      }
    }
  }

  async handleDeleteMessage(socket, io, data, callback) {
    try {
      const { messageId } = data;

      if (!messageId) {
        if (callback) {
          callback(createErrorResponse('Message ID is required', 'INVALID_DATA'));
        }
        return;
      }

      // Determine user type
      let userType = USER_TYPES.STUDENT;
      const teacherSession = await redisService.getTeacherSession();
      if (teacherSession && teacherSession.socketId === socket.id) {
        userType = USER_TYPES.TEACHER;
      }

      // Delete message
      const result = await chatService.deleteMessage(messageId, socket.id, userType);

      // Broadcast message deletion
      io.to('main_room').emit('chat:message_deleted', {
        messageId,
        deletedBy: socket.id,
      });

      logger.info(`Message deleted: ${messageId} by ${socket.id}`);

      if (callback) {
        callback(createSuccessResponse({
          deletedMessage: result.deletedMessage,
        }, 'Message deleted successfully'));
      }

    } catch (error) {
      logger.error('Error deleting message:', error);
      if (callback) {
        callback(createErrorResponse(error.message || 'Failed to delete message', 'DELETE_MESSAGE_ERROR'));
      }
    }
  }
}

module.exports = new ChatHandler(); 