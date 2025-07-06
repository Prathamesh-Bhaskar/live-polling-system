const { Server } = require('socket.io');
const { corsOptions } = require('../config/cors');
const { SOCKET_EVENTS } = require('../utils/constants');
const logger = require('../utils/logger');

// Import handlers
const teacherHandler = require('./handlers/teacherHandler');
const studentHandler = require('./handlers/studentHandler');
const chatHandler = require('./handlers/chatHandler');
const connectionHandler = require('./handlers/connectionHandler');

let io = null;

const setupSocket = (server) => {
  // Create Socket.io server
  io = new Server(server, {
    cors: corsOptions,
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Connection handling
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    logger.info(`New socket connection: ${socket.id}`);

    // Handle connection setup
    connectionHandler.handleConnection(socket, io);

    // Teacher events
    socket.on(SOCKET_EVENTS.TEACHER_JOIN, (data, callback) => {
      teacherHandler.handleTeacherJoin(socket, io, data, callback);
    });

    socket.on(SOCKET_EVENTS.TEACHER_CREATE_POLL, (data, callback) => {
      teacherHandler.handleCreatePoll(socket, io, data, callback);
    });

    socket.on(SOCKET_EVENTS.TEACHER_END_POLL, (data, callback) => {
      teacherHandler.handleEndPoll(socket, io, data, callback);
    });

    socket.on(SOCKET_EVENTS.TEACHER_KICK_STUDENT, (data, callback) => {
      teacherHandler.handleKickStudent(socket, io, data, callback);
    });

    socket.on(SOCKET_EVENTS.TEACHER_GET_HISTORY, (data, callback) => {
      teacherHandler.handleGetHistory(socket, io, data, callback);
    });

    // Student events
    socket.on(SOCKET_EVENTS.STUDENT_JOIN, (data, callback) => {
      studentHandler.handleStudentJoin(socket, io, data, callback);
    });

    socket.on(SOCKET_EVENTS.STUDENT_VOTE, (data, callback) => {
      studentHandler.handleStudentVote(socket, io, data, callback);
    });

    // Chat events
    socket.on(SOCKET_EVENTS.CHAT_SEND_MESSAGE, (data, callback) => {
      chatHandler.handleSendMessage(socket, io, data, callback);
    });

    // Disconnection
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      connectionHandler.handleDisconnection(socket, io, reason);
    });
  });

  logger.info('✅ Socket.io server configured');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  setupSocket,
  getIO,
}; 