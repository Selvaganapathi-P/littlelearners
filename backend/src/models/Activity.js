const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [String],
  correct: { type: Number, required: true }, // index of correct option
  emoji: String,
  explanation: String,
}, { _id: false });

const flashcardSchema = new mongoose.Schema({
  front: { type: String, required: true },
  back: { type: String, required: true },
  emoji: String,
  example: String,
}, { _id: false });

const matchPairSchema = new mongoose.Schema({
  word: { type: String, required: true },
  emoji: { type: String, required: true },
}, { _id: false });

const storyPageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  emoji: String,
  bg: String,
}, { _id: false });

const activitySchema = new mongoose.Schema({
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  type: {
    type: String,
    enum: ['quiz', 'flashcard', 'story', 'matching', 'phonics', 'fill_blank'],
    required: true,
  },
  title: String,
  grade: { type: String, enum: ['LKG', 'UKG'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  xpReward: { type: Number, default: 10 },
  coinsReward: { type: Number, default: 5 },
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
  // type-specific content stored as flexible Mixed
  content: {
    questions:  [questionSchema],   // quiz
    cards:      [flashcardSchema],  // flashcard
    pairs:      [matchPairSchema],  // matching
    pages:      [storyPageSchema],  // story
    words:      [String],           // phonics / fill_blank
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

activitySchema.index({ lesson: 1, type: 1 });
activitySchema.index({ grade: 1, status: 1 });

module.exports = mongoose.model('Activity', activitySchema);
