const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['LKG', 'UKG'],
    required: true,
    unique: true,
  },
  label: {
    type: String,
    required: true,
  },
  ageRange: {
    min: Number,
    max: Number,
  },
  description: String,
  colorTheme: {
    primary: { type: String, default: '#FF6B9D' },
    secondary: { type: String, default: '#FFB347' },
  },
}, { timestamps: true });

module.exports = mongoose.model('Grade', gradeSchema);
