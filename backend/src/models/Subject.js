const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  icon: String,
  color: String,
  grades: [{
    type: String,
    enum: ['LKG', 'UKG'],
  }],
  description: String,
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
