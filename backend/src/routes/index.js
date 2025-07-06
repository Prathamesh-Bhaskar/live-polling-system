const express = require('express');
const pollRoutes = require('./api/polls');
const studentRoutes = require('./api/students');
const chatRoutes = require('./api/chat');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API info endpoint - put this BEFORE mounting other routes
router.get('/', (req, res) => {
  res.json({
    name: 'Live Polling System API',
    version: '1.0.0',
    description: 'Real-time polling system backend API',
    endpoints: {
      polls: '/api/polls',
      students: '/api/students',
      chat: '/api/chat',
      health: '/api/health',
    },
    socketEvents: {
      connection: 'ws://localhost:3001',
      documentation: 'See README.md for Socket.io events',
    },
  });
});

// Mount API routes
router.use('/polls', pollRoutes);
router.use('/students', studentRoutes);
router.use('/chat', chatRoutes);

// Fixed catch-all route - use this pattern instead of '*'
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    availableEndpoints: ['/api/polls', '/api/students', '/api/chat', '/api/health']
  });
});

module.exports = router;