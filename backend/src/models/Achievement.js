const mongoose = require('mongoose');

const DEFAULT_ACHIEVEMENTS = [
  // Streak badges
  { name: 'First Step',       icon: '👣', description: 'Complete your first activity',           type: 'badge',       metric: 'activities_done',    value: 1,   xpReward: 20  },
  { name: 'On Fire!',         icon: '🔥', description: 'Reach a 3-day streak',                  type: 'badge',       metric: 'streak_days',         value: 3,   xpReward: 30  },
  { name: 'Week Warrior',     icon: '⚡', description: 'Reach a 7-day streak',                  type: 'trophy',      metric: 'streak_days',         value: 7,   xpReward: 75  },
  { name: 'Super Streak',     icon: '🌟', description: 'Reach a 14-day streak',                 type: 'trophy',      metric: 'streak_days',         value: 14,  xpReward: 150 },
  // Activity milestones
  { name: 'Quiz Starter',     icon: '❓', description: 'Complete 5 quizzes',                    type: 'badge',       metric: 'quizzes_done',        value: 5,   xpReward: 25  },
  { name: 'Quiz Champion',    icon: '🏆', description: 'Complete 20 quizzes',                   type: 'trophy',      metric: 'quizzes_done',        value: 20,  xpReward: 100 },
  { name: 'Perfect Score',    icon: '💯', description: 'Score 100% on a quiz',                  type: 'badge',       metric: 'quiz_perfect',        value: 1,   xpReward: 50  },
  { name: 'Flashcard Fan',    icon: '🃏', description: 'Complete 10 flashcard sets',            type: 'badge',       metric: 'flashcards_done',     value: 10,  xpReward: 30  },
  { name: 'Story Lover',      icon: '📖', description: 'Read 5 stories',                        type: 'badge',       metric: 'stories_read',        value: 5,   xpReward: 25  },
  { name: 'Match Master',     icon: '🎯', description: 'Complete 10 matching games',            type: 'badge',       metric: 'matching_done',       value: 10,  xpReward: 30  },
  // XP milestones
  { name: 'Rising Star',      icon: '⭐', description: 'Earn 100 XP',                          type: 'badge',       metric: 'xp_earned',           value: 100,  xpReward: 0  },
  { name: 'Star Learner',     icon: '🌠', description: 'Earn 500 XP',                          type: 'trophy',      metric: 'xp_earned',           value: 500,  xpReward: 0  },
  { name: 'Galaxy Brain',     icon: '🧠', description: 'Earn 1000 XP',                         type: 'trophy',      metric: 'xp_earned',           value: 1000, xpReward: 0  },
  // Subject certificates
  { name: 'Alphabet Pro',     icon: '🔤', description: 'Complete all Phonics activities',       type: 'certificate', metric: 'subject_phonics',     value: 5,   xpReward: 100 },
  { name: 'Number Ninja',     icon: '🔢', description: 'Complete all Number activities',        type: 'certificate', metric: 'subject_numbers',     value: 5,   xpReward: 100 },
  { name: 'Story Teller',     icon: '📚', description: 'Complete all Story activities',         type: 'certificate', metric: 'subject_stories',     value: 5,   xpReward: 100 },
];

const achievementSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  icon:        { type: String, default: '🏅' },
  description: String,
  type:        { type: String, enum: ['badge', 'trophy', 'certificate'], default: 'badge' },
  metric:      { type: String, required: true },
  value:       { type: Number, required: true },
  xpReward:    { type: Number, default: 0 },
  order:       { type: Number, default: 0 },
}, { timestamps: true });

achievementSchema.statics.seedDefaults = async function () {
  for (let i = 0; i < DEFAULT_ACHIEVEMENTS.items?.length ?? DEFAULT_ACHIEVEMENTS.length; i++) {
    const a = DEFAULT_ACHIEVEMENTS[i];
    await this.findOneAndUpdate({ name: a.name }, { ...a, order: i }, { upsert: true, new: true });
  }
};

// Simpler seed — just upsert each
achievementSchema.statics.seedDefaults = async function () {
  for (let i = 0; i < DEFAULT_ACHIEVEMENTS.length; i++) {
    const a = DEFAULT_ACHIEVEMENTS[i];
    await this.findOneAndUpdate({ name: a.name }, { ...a, order: i }, { upsert: true });
  }
  console.log('[Achievements] Default achievements seeded');
};

module.exports = mongoose.model('Achievement', achievementSchema);
