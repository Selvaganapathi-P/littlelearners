const mongoose = require('mongoose');

function xpToLevel(xp) {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

const childSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  grade:  { type: String, enum: ['LKG', 'UKG'], required: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  avatar: { type: String, default: 'default' },

  // Legacy badges (kept for backward compat)
  badges: [{
    name: String,
    earnedAt: Date,
    videoFormat: String,
  }],

  // Streak
  streaks: {
    current:          { type: Number, default: 0 },
    longest:          { type: Number, default: 0 },
    lastActivityDate: Date,
  },

  // Gamification
  xp:    { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  level: { type: Number, default: 1 },

  // Activity history (replaces/extends watchHistory)
  watchHistory: [{
    lesson:          { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    watchedAt:       Date,
    completedPercent: Number,
  }],

  activityHistory: [{
    activity:    { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
    lesson:      { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    activityType: String,
    score:       Number, // 0-100
    xpEarned:    Number,
    coinsEarned: Number,
    completedAt: { type: Date, default: Date.now },
  }],

  // Earned achievements
  achievements: [{
    achievement: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' },
    earnedAt:    { type: Date, default: Date.now },
  }],

  parentUser: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
  pin:        { type: String, select: false },
}, { timestamps: true });

childSchema.index({ parentUser: 1 });
childSchema.index({ school: 1 });

// Auto-sync level from XP on save
childSchema.pre('save', function (next) {
  this.level = xpToLevel(this.xp);
  next();
});

module.exports = mongoose.model('Child', childSchema);
