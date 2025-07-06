// src/routes/api/students.js - Minimal version without validation
const express = require('express');
const studentController = require('../../controllers/studentController');

const router = express.Router();

// GET /api/students - Get connected students
router.get('/', studentController.getConnectedStudents);

// GET /api/students/stats - Get student statistics
router.get('/stats', studentController.getStudentStats);

// POST /api/students/validate-name - Validate student name
router.post('/validate-name', studentController.validateStudentName);

module.exports = router;