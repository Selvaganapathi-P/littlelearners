const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  grade: {
    type: String,
    enum: ['LKG', 'UKG'],
    required: true,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
  },
  avatar: {
    type: String,
    default: 'default',
  },
  badges: [{
    name: String,
    earnedAt: Date,
    videoFormat: String,
  }],
  streaks: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActivityDate: Date,
  },
  watchHistory: [{
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    watchedAt: Date,
    completedPercent: Number,
  }],
  parentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
  },
  pin: {
    type: String,
    select: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Child', childSchema);
