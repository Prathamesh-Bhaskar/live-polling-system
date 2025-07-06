// src/routes/api/chat.js - Minimal version without validation
const express = require('express');
const chatController = require('../../controllers/chatController');

const router = express.Router();

// GET /api/chat/messages - Get chat messages
router.get('/messages', chatController.getMessages);

// POST /api/chat/message - Send chat message
router.post('/message', chatController.sendMessage);

// GET /api/chat/stats/:sessionId - Get chat statistics
router.get('/stats/:sessionId', chatController.getChatStats);

module.exports = router;