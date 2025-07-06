const { getRedisClient } = require('../config/redis');
const { REDIS_KEYS, SESSION_TIMEOUT } = require('../utils/constants');
const { safeJSONParse, safeJSONStringify } = require('../utils/helpers');
const logger = require('../utils/logger');

class RedisService {
  constructor() {
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      this.client = getRedisClient();
    }
    return this.client;
  }

  // Active Poll Management
  async setActivePoll(pollData) {
    try {
      const client = this.getClient();
      await client.setEx(
        REDIS_KEYS.ACTIVE_POLL, 
        SESSION_TIMEOUT, 
        safeJSONStringify(pollData)
      );
      logger.info(`Active poll set: ${pollData.id}`);
    } catch (error) {
      logger.error('Error setting active poll:', error);
      throw error;
    }
  }

  async getActivePoll() {
    try {
      const client = this.getClient();
      const pollData = await client.get(REDIS_KEYS.ACTIVE_POLL);
      return safeJSONParse(pollData);
    } catch (error) {
      logger.error('Error getting active poll:', error);
      return null;
    }
  }

  async clearActivePoll() {
    try {
      const client = this.getClient();
      await client.del(REDIS_KEYS.ACTIVE_POLL);
      logger.info('Active poll cleared');
    } catch (error) {
      logger.error('Error clearing active poll:', error);
    }
  }

  // Vote Management
  async initializePollVotes(pollId, options) {
    try {
      const client = this.getClient();
      const voteKey = `${REDIS_KEYS.POLL_VOTES}:${pollId}`;
      
      // Initialize all options to 0
      const pipeline = client.multi();
      options.forEach(option => {
        pipeline.hSet(voteKey, option, '0');
      });
      pipeline.expire(voteKey, SESSION_TIMEOUT);
      
      await pipeline.exec();
      logger.info(`Poll votes initialized for: ${pollId}`);
    } catch (error) {
      logger.error('Error initializing poll votes:', error);
      throw error;
    }
  }

  async incrementVote(pollId, option) {
    try {
      const client = this.getClient();
      const voteKey = `${REDIS_KEYS.POLL_VOTES}:${pollId}`;
      const newCount = await client.hIncrBy(voteKey, option, 1);
      return newCount;
    } catch (error) {
      logger.error('Error incrementing vote:', error);
      throw error;
    }
  }

  async getPollResults(pollId) {
    try {
      const client = this.getClient();
      const voteKey = `${REDIS_KEYS.POLL_VOTES}:${pollId}`;
      const results = await client.hGetAll(voteKey);
      
      // Convert string values to numbers
      const numericResults = {};
      Object.keys(results).forEach(key => {
        numericResults[key] = parseInt(results[key]) || 0;
      });
      
      return numericResults;
    } catch (error) {
      logger.error('Error getting poll results:', error);
      return {};
    }
  }

  async clearPollVotes(pollId) {
    try {
      const client = this.getClient();
      const voteKey = `${REDIS_KEYS.POLL_VOTES}:${pollId}`;
      const votersKey = `${REDIS_KEYS.POLL_VOTERS}:${pollId}`;
      
      await Promise.all([
        client.del(voteKey),
        client.del(votersKey)
      ]);
      
      logger.info(`Poll votes cleared for: ${pollId}`);
    } catch (error) {
      logger.error('Error clearing poll votes:', error);
    }
  }

  // Voter Tracking
  async addVoter(pollId, studentName) {
    try {
      const client = this.getClient();
      const votersKey = `${REDIS_KEYS.POLL_VOTERS}:${pollId}`;
      await client.sAdd(votersKey, studentName);
      await client.expire(votersKey, SESSION_TIMEOUT);
    } catch (error) {
      logger.error('Error adding voter:', error);
      throw error;
    }
  }

  async hasVoted(pollId, studentName) {
    try {
      const client = this.getClient();
      const votersKey = `${REDIS_KEYS.POLL_VOTERS}:${pollId}`;
      return await client.sIsMember(votersKey, studentName);
    } catch (error) {
      logger.error('Error checking if voted:', error);
      return false;
    }
  }

  async getVoterCount(pollId) {
    try {
      const client = this.getClient();
      const votersKey = `${REDIS_KEYS.POLL_VOTERS}:${pollId}`;
      return await client.sCard(votersKey);
    } catch (error) {
      logger.error('Error getting voter count:', error);
      return 0;
    }
  }

  // Student Management
  async addStudent(socketId, studentData) {
    try {
      const client = this.getClient();
      await client.hSet(
        REDIS_KEYS.CONNECTED_STUDENTS, 
        socketId, 
        safeJSONStringify(studentData)
      );
      logger.info(`Student added: ${studentData.name} (${socketId})`);
    } catch (error) {
      logger.error('Error adding student:', error);
      throw error;
    }
  }

  async removeStudent(socketId) {
    try {
      const client = this.getClient();
      const studentData = await client.hGet(REDIS_KEYS.CONNECTED_STUDENTS, socketId);
      await client.hDel(REDIS_KEYS.CONNECTED_STUDENTS, socketId);
      
      if (studentData) {
        const student = safeJSONParse(studentData);
        logger.info(`Student removed: ${student?.name || 'Unknown'} (${socketId})`);
      }
    } catch (error) {
      logger.error('Error removing student:', error);
    }
  }

  async getConnectedStudents() {
    try {
      const client = this.getClient();
      const studentsData = await client.hGetAll(REDIS_KEYS.CONNECTED_STUDENTS);
      
      const students = [];
      Object.keys(studentsData).forEach(socketId => {
        const student = safeJSONParse(studentsData[socketId]);
        if (student) {
          students.push({ ...student, socketId });
        }
      });
      
      return students;
    } catch (error) {
      logger.error('Error getting connected students:', error);
      return [];
    }
  }

  async isStudentNameTaken(name) {
    try {
      const students = await this.getConnectedStudents();
      return students.some(student => student.name.toLowerCase() === name.toLowerCase());
    } catch (error) {
      logger.error('Error checking student name:', error);
      return false;
    }
  }

  async updateStudentStatus(socketId, updates) {
    try {
      const client = this.getClient();
      const studentData = await client.hGet(REDIS_KEYS.CONNECTED_STUDENTS, socketId);
      
      if (studentData) {
        const student = safeJSONParse(studentData);
        const updatedStudent = { ...student, ...updates, lastSeen: new Date().toISOString() };
        
        await client.hSet(
          REDIS_KEYS.CONNECTED_STUDENTS,
          socketId,
          safeJSONStringify(updatedStudent)
        );
      }
    } catch (error) {
      logger.error('Error updating student status:', error);
    }
  }

  // Teacher Session Management
  async setTeacherSession(sessionData) {
    try {
      const client = this.getClient();
      await client.setEx(
        REDIS_KEYS.TEACHER_SESSION,
        SESSION_TIMEOUT,
        safeJSONStringify(sessionData)
      );
      logger.info(`Teacher session set: ${sessionData.socketId}`);
    } catch (error) {
      logger.error('Error setting teacher session:', error);
      throw error;
    }
  }

  async getTeacherSession() {
    try {
      const client = this.getClient();
      const sessionData = await client.get(REDIS_KEYS.TEACHER_SESSION);
      return safeJSONParse(sessionData);
    } catch (error) {
      logger.error('Error getting teacher session:', error);
      return null;
    }
  }

  async clearTeacherSession() {
    try {
      const client = this.getClient();
      await client.del(REDIS_KEYS.TEACHER_SESSION);
      logger.info('Teacher session cleared');
    } catch (error) {
      logger.error('Error clearing teacher session:', error);
    }
  }

  // General cleanup
  async cleanup() {
    try {
      const client = this.getClient();
      const keys = await client.keys('poll_*');
      if (keys.length > 0) {
        await client.del(keys);
      }
      
      await Promise.all([
        client.del(REDIS_KEYS.ACTIVE_POLL),
        client.del(REDIS_KEYS.CONNECTED_STUDENTS),
        client.del(REDIS_KEYS.TEACHER_SESSION)
      ]);
      
      logger.info('Redis cleanup completed');
    } catch (error) {
      logger.error('Error during Redis cleanup:', error);
    }
  }
}

module.exports = new RedisService();