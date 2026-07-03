const mongoose = require('mongoose');

const ensureFounder = async () => {
  try {
    const User = require('../models/User');
    const existing = await User.findOne({ role: 'founder' });
    if (!existing) {
      await User.create({
        name: 'LittleLearners Founder',
        email: 'selvaganapathims007@gmail.com',
        password: 'selvaganapathi',
        role: 'founder',
      });
      console.log('✓ Founder account auto-created');
    }
  } catch (err) {
    console.error('Founder auto-create failed:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await ensureFounder();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
