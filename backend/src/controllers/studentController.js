const studentService = require('../services/studentService');
const { createErrorResponse, createSuccessResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class StudentController {

  async getConnectedStudents(req, res) {
    try {
      const students = await studentService.getConnectedStudents();

      res.json(createSuccessResponse({
        students,
        total: students.length,
      }, 'Connected students retrieved successfully'));

    } catch (error) {
      logger.error('Error getting connected students:', error);
      res.status(500).json(createErrorResponse('Failed to retrieve students', 'STUDENTS_FETCH_ERROR'));
    }
  }

  async getStudentStats(req, res) {
    try {
      const stats = await studentService.getStudentStats();

      res.json(createSuccessResponse({
        stats,
      }, 'Student statistics retrieved successfully'));

    } catch (error) {
      logger.error('Error getting student stats:', error);
      res.status(500).json(createErrorResponse('Failed to retrieve student statistics', 'STATS_FETCH_ERROR'));
    }
  }

  async validateStudentName(req, res) {
    try {
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json(createErrorResponse('Student name is required', 'INVALID_NAME'));
      }

      const isValid = studentService.validateStudentName ? 
        studentService.validateStudentName(name) : 
        require('../utils/helpers').validateStudentName(name);

      if (!isValid) {
        return res.status(400).json(createErrorResponse(
          'Invalid student name. Use 2-50 characters, letters and numbers only.', 
          'INVALID_NAME_FORMAT'
        ));
      }

      const isTaken = await studentService.getConnectedStudents().then(students => 
        students.some(student => student.name.toLowerCase() === name.toLowerCase())
      );

      if (isTaken) {
        return res.status(409).json(createErrorResponse(
          'This name is already taken. Please choose a different name.', 
          'NAME_TAKEN'
        ));
      }

      res.json(createSuccessResponse({
        name: name.trim(),
        isValid: true,
        isAvailable: true,
      }, 'Student name is valid and available'));

    } catch (error) {
      logger.error('Error validating student name:', error);
      res.status(500).json(createErrorResponse('Failed to validate student name', 'VALIDATION_ERROR'));
    }
  }
}

module.exports = new StudentController(); 