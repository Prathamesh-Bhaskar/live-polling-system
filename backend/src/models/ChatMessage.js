const mongoose = require('mongoose');
const { USER_TYPES } = require('../utils/constants');

const chatMessageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  sender: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  senderType: {
    type: String,
    required: true,
    enum: Object.values(USER_TYPES),
  },
  sessionId: {
    type: String,
    required: true,
  },
  socketId: {
    type: String,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
chatMessageSchema.index({ sessionId: 1, createdAt: -1 });
chatMessageSchema.index({ senderType: 1, createdAt: -1 });
chatMessageSchema.index({ isDeleted: 1 });

// Virtual for time ago
chatMessageSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
});

// Instance methods
chatMessageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

// Static methods
chatMessageSchema.statics.findBySessionId = function(sessionId, limit = 50) {
  return this.find({ 
    sessionId, 
    isDeleted: false 
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .lean();
};

chatMessageSchema.statics.countBySessionId = function(sessionId) {
  return this.countDocuments({ 
    sessionId, 
    isDeleted: false 
  });
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema); 