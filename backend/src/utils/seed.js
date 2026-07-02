require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const Subject = require('../models/Subject');
const User = require('../models/User');

const connectDB = require('../config/db');

const grades = [
  { name: 'LKG', label: 'Lower Kindergarten', ageRange: { min: 3.5, max: 4.5 }, description: 'Ages 3.5–4.5 years', colorTheme: { primary: '#FF6B9D', secondary: '#FFB347' } },
  { name: 'UKG', label: 'Upper Kindergarten', ageRange: { min: 4.5, max: 5.5 }, description: 'Ages 4.5–5.5 years', colorTheme: { primary: '#7C3AED', secondary: '#06B6D4' } },
];

const subjects = [
  { name: 'Alphabets & Phonics', slug: 'phonics', icon: '🔤', color: '#EF4444', grades: ['LKG', 'UKG'] },
  { name: 'Numbers & Math', slug: 'numbers', icon: '🔢', color: '#3B82F6', grades: ['LKG', 'UKG'] },
  { name: 'Rhymes', slug: 'rhymes', icon: '🎵', color: '#8B5CF6', grades: ['LKG', 'UKG'] },
  { name: 'Moral Stories', slug: 'moral-stories', icon: '📖', color: '#10B981', grades: ['LKG', 'UKG'] },
  { name: 'EVS & General Awareness', slug: 'evs', icon: '🌍', color: '#F59E0B', grades: ['LKG', 'UKG'] },
  { name: 'Movement & Wellbeing', slug: 'movement', icon: '🧘', color: '#EC4899', grades: ['LKG', 'UKG'] },
];

async function seed() {
  await connectDB();
  console.log('Seeding database...');

  await Grade.deleteMany({});
  await Subject.deleteMany({});
  await User.deleteMany({ role: 'founder' });

  await Grade.insertMany(grades);
  console.log('✓ Grades seeded (LKG, UKG)');

  await Subject.insertMany(subjects);
  console.log('✓ Subjects seeded (6 subjects)');

  await User.create({
    name: 'LittleLearners Founder',
    email: 'selvaganapathims007@gmail.com',
    password: 'FounderPass2024!',
    role: 'founder',
  });
  console.log('✓ Founder user created');

  console.log('\nSeed complete. Change the founder password after first login!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
