const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  teacherInfo: {
    socketId: {
      type: String,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  studentsCount: {
    peak: {
      type: Number,
      default: 0,
    },
    current: {
      type: Number,
      default: 0,
    },
  },
  pollsCreated: {
    type: Number,
    default: 0,
  },
  messagesCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  endedAt: {
    type: Date,
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    clientInfo: String,
  },
}, {
  timestamps: true,
});

// Virtual for session duration
sessionSchema.virtual('duration').get(function() {
  const endTime = this.endedAt || new Date();
  return Math.floor((endTime - this.createdAt) / 1000); // in seconds
});

// Index for efficient queries
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ isActive: 1, createdAt: -1 });
sessionSchema.index({ 'teacherInfo.socketId': 1 });

// Instance methods
sessionSchema.methods.endSession = function() {
  this.isActive = false;
  this.endedAt = new Date();
  return this.save();
};

sessionSchema.methods.updateStudentCount = function(count) {
  this.studentsCount.current = count;
  if (count > this.studentsCount.peak) {
    this.studentsCount.peak = count;
  }
  this.teacherInfo.lastSeen = new Date();
  return this.save();
};

sessionSchema.methods.incrementPollCount = function() {
  this.pollsCreated += 1;
  return this.save();
};

sessionSchema.methods.incrementMessageCount = function() {
  this.messagesCount += 1;
  return this.save();
};

// Static methods
sessionSchema.statics.findActiveSession = function() {
  return this.findOne({ isActive: true }).sort({ createdAt: -1 });
};

sessionSchema.statics.getSessionStats = function(sessionId) {
  return this.findOne({ sessionId }).lean();
};

module.exports = mongoose.model('Session', sessionSchema); 