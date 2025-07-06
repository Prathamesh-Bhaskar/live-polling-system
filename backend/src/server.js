require('dotenv').config();
const app = require('./app');
const { createServer } = require('http');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { setupSocket } = require('./socket/socketManager');
const logger = require('./utils/logger');

const PORT = process.env.PORT;

async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();
    
    // Create HTTP server
    const server = createServer(app);
    
    // Setup Socket.io
    setupSocket(server);
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🌐 CORS enabled for: ${process.env.CLIENT_URL}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();