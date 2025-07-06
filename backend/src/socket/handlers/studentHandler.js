const studentService = require('../../services/studentService');
const pollService = require('../../services/pollService');
const redisService = require('../../services/redisService');
const { SOCKET_EVENTS } = require('../../utils/constants');
const { createErrorResponse, createSuccessResponse } = require('../../utils/helpers');
const logger = require('../../utils/logger');

class StudentHandler {

  async handleStudentJoin(socket, io, data, callback) {
    try {
      const { name } = data;

      if (!name || !name.trim()) {
        if (callback) {
          callback(createErrorResponse('Student name is required', 'INVALID_NAME'));
        }
        return;
      }

      // Join student to session
      const metadata = {
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
      };

      const result = await studentService.joinSession(name.trim(), socket.id, metadata);

      // Join main room
      socket.join('main_room');

      // Send current poll if active
      const currentPoll = await redisService.getActivePoll();
      if (currentPoll) {
        socket.emit(SOCKET_EVENTS.POLL_STARTED, currentPoll);
      }

      // Broadcast new student to everyone
      io.to('main_room').emit(SOCKET_EVENTS.STUDENTS_UPDATED, result.connectedStudents);
      io.to('main_room').emit(SOCKET_EVENTS.STUDENT_JOINED, {
        student: result.student,
        connectedStudents: result.connectedStudents,
      });

      logger.info(`Student joined: ${name} (${socket.id})`);

      if (callback) {
        callback(createSuccessResponse({
          student: result.student,
          connectedStudents: result.connectedStudents,
          currentPoll,
        }, 'Joined session successfully'));
      }

    } catch (error) {
      logger.error('Error handling student join:', error);
      if (callback) {
        callback(createErrorResponse(error.message || 'Failed to join session', 'STUDENT_JOIN_ERROR'));
      }
    }
  }

  async handleStudentVote(socket, io, data, callback) {
    try {
      const { pollId, selectedOption, studentName } = data;

      if (!pollId || !selectedOption || !studentName) {
        if (callback) {
          callback(createErrorResponse('Missing required data', 'INVALID_DATA'));
        }
        return;
      }

      // Submit vote
      const result = await pollService.submitVote(pollId, selectedOption, studentName, socket.id);

      // Mark student as voted
      await studentService.markStudentAsVoted(socket.id);

      // Broadcast updated results to everyone
      io.to('main_room').emit(SOCKET_EVENTS.POLL_RESULTS, {
        pollId,
        results: result.results,
        totalVotes: result.totalVotes,
        voterCount: result.voterCount,
        responseRate: result.responseRate,
      });

      // Update students list with vote status
      const connectedStudents = await studentService.getConnectedStudents();
      io.to('main_room').emit(SOCKET_EVENTS.STUDENTS_UPDATED, connectedStudents);

      logger.info(`Vote submitted: ${studentName} voted for "${selectedOption}" in poll ${pollId}`);

      if (callback) {
        callback(createSuccessResponse({
          vote: {
            pollId,
            selectedOption,
            studentName,
            submittedAt: new Date().toISOString(),
          },
          results: result,
        }, 'Vote submitted successfully'));
      }

    } catch (error) {
      logger.error('Error handling student vote:', error);
      if (callback) {
        callback(createErrorResponse(error.message || 'Failed to submit vote', 'VOTE_ERROR'));
      }
    }
  }

  async handleStudentActivity(socket, io, data) {
    try {
      // Update student's last seen timestamp
      await studentService.updateStudentActivity(socket.id);
    } catch (error) {
      logger.error('Error updating student activity:', error);
    }
  }
}

module.exports = new StudentHandler(); 