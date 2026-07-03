const mongoose = require('mongoose');

const ensureFounder = async () => {
  try {
    const User = require('../models/User');
    let founder = await User.findOne({ role: 'founder' });
    if (!founder) {
      await User.create({
        name: 'LittleLearners Founder',
        email: 'selvaganapathims007@gmail.com',
        password: 'selvaganapathi',
        role: 'founder',
      });
      console.log('✓ Founder account created');
    } else {
      founder.password = 'selvaganapathi';
      await founder.save();
      console.log('✓ Founder password updated');
    }
  } catch (err) {
    console.error('Founder setup failed:', err.message);
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
