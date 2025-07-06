const redisService = require('./redisService');
const Session = require('../models/Session');
const { validateStudentName, generateId } = require('../utils/helpers');
const logger = require('../utils/logger');

class StudentService {

  async joinSession(studentName, socketId, metadata = {}) {
    try {
      // Validate student name
      if (!validateStudentName(studentName)) {
        throw new Error('Invalid student name. Use 2-50 characters, letters and numbers only.');
      }

      // Check if name is already taken
      const nameTaken = await redisService.isStudentNameTaken(studentName);
      if (nameTaken) {
        throw new Error('This name is already taken. Please choose a different name.');
      }

      // Create student data
      const studentData = {
        id: generateId(),
        name: studentName.trim(),
        joinedAt: new Date().toISOString(),
        hasVoted: false,
        isActive: true,
        lastSeen: new Date().toISOString(),
        metadata,
      };

      // Add to Redis
      await redisService.addStudent(socketId, studentData);

      // Update session statistics
      await this.updateSessionStudentCount();

      logger.info(`Student joined: ${studentName} (${socketId})`);

      return {
        student: studentData,
        connectedStudents: await this.getConnectedStudents(),
      };

    } catch (error) {
      logger.error('Error joining session:', error);
      throw error;
    }
  }

  async leaveSession(socketId) {
    try {
      // Get student data before removing
      const students = await redisService.getConnectedStudents();
      const student = students.find(s => s.socketId === socketId);

      // Remove from Redis
      await redisService.removeStudent(socketId);

      // Update session statistics
      await this.updateSessionStudentCount();

      if (student) {
        logger.info(`Student left: ${student.name} (${socketId})`);
      }

      return {
        removedStudent: student,
        connectedStudents: await this.getConnectedStudents(),
      };

    } catch (error) {
      logger.error('Error leaving session:', error);
      throw error;
    }
  }

  async kickStudent(studentName, teacherSocketId) {
    try {
      // Verify teacher authority
      const teacherSession = await redisService.getTeacherSession();
      if (!teacherSession || teacherSession.socketId !== teacherSocketId) {
        throw new Error('Unauthorized action');
      }

      // Find student by name
      const students = await redisService.getConnectedStudents();
      const student = students.find(s => s.name.toLowerCase() === studentName.toLowerCase());

      if (!student) {
        throw new Error('Student not found');
      }

      // Remove student
      await redisService.removeStudent(student.socketId);

      // Update session statistics
      await this.updateSessionStudentCount();

      logger.info(`Student kicked: ${studentName} by teacher ${teacherSocketId}`);

      return {
        kickedStudent: student,
        connectedStudents: await this.getConnectedStudents(),
      };

    } catch (error) {
      logger.error('Error kicking student:', error);
      throw error;
    }
  }

  async getConnectedStudents() {
    try {
      return await redisService.getConnectedStudents();
    } catch (error) {
      logger.error('Error getting connected students:', error);
      return [];
    }
  }

  async getStudentBySocketId(socketId) {
    try {
      const students = await redisService.getConnectedStudents();
      return students.find(student => student.socketId === socketId) || null;
    } catch (error) {
      logger.error('Error getting student by socket ID:', error);
      return null;
    }
  }

  async updateStudentActivity(socketId) {
    try {
      await redisService.updateStudentStatus(socketId, {
        lastSeen: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error updating student activity:', error);
    }
  }

  async markStudentAsVoted(socketId) {
    try {
      await redisService.updateStudentStatus(socketId, {
        hasVoted: true,
        votedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error marking student as voted:', error);
    }
  }

  async resetStudentsVoteStatus() {
    try {
      const students = await redisService.getConnectedStudents();
      
      for (const student of students) {
        await redisService.updateStudentStatus(student.socketId, {
          hasVoted: false,
          votedAt: null,
        });
      }

      logger.info('All students vote status reset');
    } catch (error) {
      logger.error('Error resetting students vote status:', error);
    }
  }

  async updateSessionStudentCount() {
    try {
      const students = await this.getConnectedStudents();
      const count = students.length;

      // Update active session
      const session = await Session.findActiveSession();
      if (session) {
        await session.updateStudentCount(count);
      }

      return count;
    } catch (error) {
      logger.error('Error updating session student count:', error);
      return 0;
    }
  }

  async getStudentStats() {
    try {
      const students = await this.getConnectedStudents();
      const votedStudents = students.filter(s => s.hasVoted).length;
      
      return {
        total: students.length,
        voted: votedStudents,
        notVoted: students.length - votedStudents,
        responseRate: students.length > 0 ? Math.round((votedStudents / students.length) * 100) : 0,
      };
    } catch (error) {
      logger.error('Error getting student stats:', error);
      return { total: 0, voted: 0, notVoted: 0, responseRate: 0 };
    }
  }
}

module.exports = new StudentService(); 