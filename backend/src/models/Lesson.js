const mongoose = require('mongoose');

const VIDEO_FORMATS = [
  'sing_along',
  'phonics_song',
  'number_song',
  'moral_story',
  'bedtime_story',
  'action_dance',
  'yoga_stretch',
  'good_habits',
  'festival_special',
  'point_and_learn',
  'emotion_song',
  'original_song',
  'recap_song',
  'celebration_video',
  'themed_compilation',
];

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  grade: {
    type: String,
    enum: ['LKG', 'UKG'],
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  videoFormat: {
    type: String,
    enum: VIDEO_FORMATS,
    required: true,
  },
  videoUrl: String,
  thumbnailUrl: String,
  scriptText: String,
  durationSeconds: Number,
  tags: [{ type: String, lowercase: true, trim: true }],
  status: {
    type: String,
    enum: ['draft', 'generating', 'ready', 'published', 'archived'],
    default: 'draft',
  },
  festivalTag: String,
  region: String,
  publishedAt: Date,
  viewCount: { type: Number, default: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

lessonSchema.index({ grade: 1, videoFormat: 1 });
lessonSchema.index({ tags: 1 });
lessonSchema.index({ status: 1, publishedAt: -1 });

lessonSchema.statics.VIDEO_FORMATS = VIDEO_FORMATS;

module.exports = mongoose.model('Lesson', lessonSchema);
