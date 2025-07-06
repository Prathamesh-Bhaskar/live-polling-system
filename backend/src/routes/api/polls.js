// src/routes/api/polls.js - Minimal version without validation
const express = require('express');
const pollController = require('../../controllers/pollController');

const router = express.Router();

// GET /api/polls - Get all polls
router.get('/', pollController.getAllPolls);

// GET /api/polls/current - Get current active poll
router.get('/current', pollController.getCurrentPoll);

// GET /api/polls/history - Get poll history
router.get('/history', pollController.getPollHistory);

// GET /api/polls/:pollId/results - Get poll results
router.get('/:pollId/results', pollController.getPollResults);

// GET /api/polls/:pollId - Get specific poll
router.get('/:pollId', pollController.getPollById);

module.exports = router;