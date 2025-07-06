const mongoose = require('mongoose');
const { POLL_STATUS } = require('../utils/constants');

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  options: [{
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  }],
  duration: {
    type: Number,
    default: 60,
    min: 10,
    max: 300,
  },
  status: {
    type: String,
    enum: Object.values(POLL_STATUS),
    default: POLL_STATUS.ACTIVE,
  },
  results: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  totalVotes: {
    type: Number,
    default: 0,
  },
  totalStudents: {
    type: Number,
    default: 0,
  },
  sessionId: {
    type: String,
    required: true,
  },
  teacherSocketId: {
    type: String,
    required: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for poll duration in human-readable format
pollSchema.virtual('durationFormatted').get(function() {
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
});

// Virtual for poll completion percentage
pollSchema.virtual('completionRate').get(function() {
  if (this.totalStudents === 0) return 0;
  return Math.round((this.totalVotes / this.totalStudents) * 100);
});

// Index for efficient queries
pollSchema.index({ sessionId: 1, createdAt: -1 });
pollSchema.index({ status: 1, createdAt: -1 });
pollSchema.index({ teacherSocketId: 1 });

// Pre-save middleware
pollSchema.pre('save', function(next) {
  if (this.isModified('options') && this.options.length < 2) {
    return next(new Error('Poll must have at least 2 options'));
  }
  next();
});

// Instance methods
pollSchema.methods.endPoll = function(finalResults) {
  this.status = POLL_STATUS.ENDED;
  this.endedAt = new Date();
  if (finalResults) {
    this.results = new Map(Object.entries(finalResults));
    this.totalVotes = Object.values(finalResults).reduce((sum, count) => sum + count, 0);
  }
  return this.save();
};

pollSchema.methods.addVote = function(option) {
  const currentCount = this.results.get(option) || 0;
  this.results.set(option, currentCount + 1);
  this.totalVotes += 1;
  return this.save();
};

// Static methods
pollSchema.statics.findActivePolls = function() {
  return this.find({ status: POLL_STATUS.ACTIVE }).sort({ createdAt: -1 });
};

pollSchema.statics.findBySessionId = function(sessionId) {
  return this.find({ sessionId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Poll', pollSchema); 