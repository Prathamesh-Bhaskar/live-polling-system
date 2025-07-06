const logger = require('../utils/logger');

const allowedOrigins = (process.env.ALLOWED_ORIGINS)
  .split(',')
  .map(origin => origin.trim());

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    logger.warn(`CORS blocked origin: ${origin}`);
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// CORS error handler
const corsErrorHandler = (err, req, res, next) => {
  if (err.message.includes('CORS policy')) {
    logger.warn(`CORS error for ${req.method} ${req.path} from origin: ${req.get('Origin')}`);
    return res.status(403).json({
      success: false,
      error: {
        message: 'Cross-origin request blocked by CORS policy',
        code: 'CORS_ERROR',
        origin: req.get('Origin'),
      },
    });
  }
  next(err);
};

module.exports = {
  corsOptions,
  corsErrorHandler,
  allowedOrigins,
};
