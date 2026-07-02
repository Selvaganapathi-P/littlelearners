const mongoose = require('mongoose');

const contentCalendarSuggestionSchema = new mongoose.Schema({
  weekOf: {
    type: Date,
    required: true,
  },
  region: {
    type: String,
    default: 'IN',
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
  },
  suggestedMix: [{
    videoFormat: {
      type: String,
      enum: [
        'sing_along', 'phonics_song', 'number_song', 'moral_story',
        'bedtime_story', 'action_dance', 'yoga_stretch', 'good_habits',
        'festival_special', 'point_and_learn', 'emotion_song',
        'original_song', 'recap_song', 'celebration_video', 'themed_compilation',
      ],
    },
    count: { type: Number, default: 1 },
    rationale: String,
  }],
  upcomingFestival: {
    name: String,
    date: Date,
    suggestedFormats: [String],
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'acted'],
    default: 'pending',
  },
}, { timestamps: true });

contentCalendarSuggestionSchema.index({ weekOf: 1, region: 1 });

module.exports = mongoose.model('ContentCalendarSuggestion', contentCalendarSuggestionSchema);
