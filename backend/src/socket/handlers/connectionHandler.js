const studentService = require('../../services/studentService');
const redisService = require('../../services/redisService');
const logger = require('../../utils/logger');
const { SOCKET_EVENTS } = require('../../utils/constants');

class ConnectionHandler {
  
  async handleConnection(socket, io) {
    try {
      // Join main room
      socket.join('main_room');
      
      // Send current poll if active
      const currentPoll = await redisService.getActivePoll();
      if (currentPoll) {
        socket.emit(SOCKET_EVENTS.POLL_STARTED, currentPoll);
      }

      // Send connected students list
      const connectedStudents = await studentService.getConnectedStudents();
      socket.emit(SOCKET_EVENTS.STUDENTS_UPDATED, connectedStudents);

      logger.info(`Socket ${socket.id} connected and joined main room`);
      
    } catch (error) {
      logger.error('Error handling connection:', error);
    }
  }

  async handleDisconnection(socket, io, reason) {
    try {
      logger.info(`Socket ${socket.id} disconnected: ${reason}`);

      // Check if this was a student and remove them
      const student = await studentService.getStudentBySocketId(socket.id);
      if (student) {
        const result = await studentService.leaveSession(socket.id);
        
        // Broadcast updated student list
        io.to('main_room').emit(SOCKET_EVENTS.STUDENTS_UPDATED, result.connectedStudents);
        io.to('main_room').emit(SOCKET_EVENTS.STUDENT_LEFT, {
          student: result.removedStudent,
          connectedStudents: result.connectedStudents,
        });

        logger.info(`Student ${student.name} disconnected and removed`);
      }

      // Check if this was the teacher
      const teacherSession = await redisService.getTeacherSession();
      if (teacherSession && teacherSession.socketId === socket.id) {
        // Teacher disconnected - we might want to pause the session
        // For now, we'll just log it
        logger.warn('Teacher disconnected');
        
        // Optionally end active polls or pause session
        // await handleTeacherDisconnection(socket, io);
      }

    } catch (error) {
      logger.error('Error handling disconnection:', error);
    }
  }

  async handleTeacherDisconnection(socket, io) {
    try {
      // End any active polls
      const activePoll = await redisService.getActivePoll();
      if (activePoll) {
        // Auto-end the poll
        const pollService = require('../../services/pollService');
        await pollService.endPoll(activePoll.id, socket.id);
        
        io.to('main_room').emit(SOCKET_EVENTS.POLL_ENDED, {
          reason: 'Teacher disconnected',
        });
      }

      // Clear teacher session
      await redisService.clearTeacherSession();

    } catch (error) {
      logger.error('Error handling teacher disconnection:', error);
    }
  }
}

module.exports = new ConnectionHandler(); 