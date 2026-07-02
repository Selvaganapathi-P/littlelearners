const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  region: {
    type: String,
    default: 'IN',
  },
  city: String,
  state: String,
  contactEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    default: 'free',
  },
  active: { type: Boolean, default: true },
  gradeLevels: [{
    type: String,
    enum: ['LKG', 'UKG'],
  }],
  festivalCalendar: [{
    name: String,
    date: Date,
    region: String,
  }],
}, { timestamps: true });

module.exports = mongoose.model('School', schoolSchema);
