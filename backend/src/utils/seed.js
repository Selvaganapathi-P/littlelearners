require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Lesson = require('../models/Lesson');

const connectDB = require('../config/db');

const grades = [
  { name: 'LKG', label: 'Lower Kindergarten', ageRange: { min: 3.5, max: 4.5 }, description: 'Ages 3.5–4.5 years', colorTheme: { primary: '#FF6B9D', secondary: '#FFB347' } },
  { name: 'UKG', label: 'Upper Kindergarten', ageRange: { min: 4.5, max: 5.5 }, description: 'Ages 4.5–5.5 years', colorTheme: { primary: '#7C3AED', secondary: '#06B6D4' } },
];

const subjectDefs = [
  { name: 'Alphabets & Phonics', slug: 'phonics',       icon: '🔤', color: '#EF4444', grades: ['LKG', 'UKG'] },
  { name: 'Numbers & Math',      slug: 'numbers',       icon: '🔢', color: '#3B82F6', grades: ['LKG', 'UKG'] },
  { name: 'Rhymes',              slug: 'rhymes',        icon: '🎵', color: '#8B5CF6', grades: ['LKG', 'UKG'] },
  { name: 'Moral Stories',       slug: 'moral-stories', icon: '📖', color: '#10B981', grades: ['LKG', 'UKG'] },
  { name: 'EVS & General Awareness', slug: 'evs',       icon: '🌍', color: '#F59E0B', grades: ['LKG', 'UKG'] },
  { name: 'Movement & Wellbeing', slug: 'movement',     icon: '🧘', color: '#EC4899', grades: ['LKG', 'UKG'] },
];

function lessons(subjectMap, founderUser) {
  const ph = subjectMap['phonics'];
  const nu = subjectMap['numbers'];
  const rh = subjectMap['rhymes'];
  const mo = subjectMap['moral-stories'];
  const ev = subjectMap['evs'];
  const mv = subjectMap['movement'];
  const now = new Date();

  return [
    // ── LKG ─────────────────────────────────────────────────────────────
    {
      title: 'A for Apple — Phonics Song',
      grade: 'LKG', subject: ph._id, videoFormat: 'phonics_song',
      scriptText: 'A for Apple, a a apple!\nB for Ball, b b ball!\nC for Cat, c c cat!\nD for Dog, d d dog!\nE for Elephant, e e elephant!\nEvery letter has a sound, let\'s learn them all around!',
      tags: ['alphabet', 'phonics', 'a-to-e'],
      durationSeconds: 120, status: 'published', publishedAt: now, viewCount: 42, createdBy: founderUser._id,
    },
    {
      title: 'Twinkle Twinkle Little Star',
      grade: 'LKG', subject: rh._id, videoFormat: 'sing_along',
      scriptText: 'Twinkle twinkle little star,\nHow I wonder what you are!\nUp above the world so high,\nLike a diamond in the sky.\nTwinkle twinkle little star,\nHow I wonder what you are!',
      tags: ['stars', 'night', 'classic'],
      durationSeconds: 90, status: 'published', publishedAt: now, viewCount: 87, createdBy: founderUser._id,
    },
    {
      title: 'Count 1 to 10 with Fun!',
      grade: 'LKG', subject: nu._id, videoFormat: 'number_song',
      scriptText: 'One little finger, point it up!\nTwo little fingers, point them up!\nThree little fingers, point them up!\nAll the way to ten, clap clap clap!\n1-2-3-4-5, once I caught a fish alive!\n6-7-8-9-10, then I let it go again!',
      tags: ['counting', 'numbers', '1-to-10'],
      durationSeconds: 110, status: 'published', publishedAt: now, viewCount: 63, createdBy: founderUser._id,
    },
    {
      title: 'The Honest Woodcutter',
      grade: 'LKG', subject: mo._id, videoFormat: 'moral_story',
      scriptText: 'Once upon a time, a poor woodcutter dropped his axe in the river. He cried sadly. A kind fairy appeared and showed him a golden axe. "Is this yours?" she asked. "No," said the woodcutter honestly. She showed a silver axe. "No," he said again. Then she showed his old iron axe. "Yes! That is mine!" The fairy was pleased and gave him all three axes. Honesty is always rewarded!',
      tags: ['honesty', 'fairy', 'reward'],
      durationSeconds: 180, status: 'published', publishedAt: now, viewCount: 55, createdBy: founderUser._id,
    },
    {
      title: 'Morning Stretch & Yoga for Kids',
      grade: 'LKG', subject: mv._id, videoFormat: 'yoga_stretch',
      scriptText: 'Wake up little bodies, time to stretch!\nRaise your arms up high like a tree!\nBend down low like a frog!\nSit cross-legged and breathe in slowly...\nBreathe out and smile!\nNow flutter your arms like a butterfly!\nFeel calm, feel happy, feel wonderful!',
      tags: ['yoga', 'morning', 'calm', 'breathing'],
      durationSeconds: 150, status: 'published', publishedAt: now, viewCount: 31, createdBy: founderUser._id,
    },
    {
      title: 'Rain Rain Go Away',
      grade: 'LKG', subject: rh._id, videoFormat: 'sing_along',
      scriptText: 'Rain rain go away,\nCome again another day!\nLittle Johnny wants to play,\nRain rain go away!\n\nSun sun come out to shine,\nEverything will be just fine!\nChildren want to run and play,\nRain rain go away!',
      tags: ['rain', 'weather', 'classic', 'nature'],
      durationSeconds: 85, status: 'published', publishedAt: now, viewCount: 74, createdBy: founderUser._id,
    },

    // ── UKG ─────────────────────────────────────────────────────────────
    {
      title: 'Vowels Song — A E I O U',
      grade: 'UKG', subject: ph._id, videoFormat: 'phonics_song',
      scriptText: 'A E I O U, vowels are just a few!\nA is for Ant marching in a line,\nE is for Elephant so big and fine,\nI is for Igloo cold as ice,\nO is for Orange juicy and nice,\nU is for Umbrella keeping us dry,\nA E I O U — now you and I can fly!',
      tags: ['vowels', 'phonics', 'alphabet'],
      durationSeconds: 130, status: 'published', publishedAt: now, viewCount: 58, createdBy: founderUser._id,
    },
    {
      title: 'Addition Song: Adding is Fun!',
      grade: 'UKG', subject: nu._id, videoFormat: 'number_song',
      scriptText: '1 plus 1 equals 2, clap clap!\n2 plus 2 equals 4, hooray!\n3 plus 3 equals 6, yay yay!\n4 plus 4 equals 8, great!\n5 plus 5 equals 10, we\'re done!\nAdding numbers is so much fun!\nWhen you put things together you get more,\nMaths is something we all adore!',
      tags: ['addition', 'maths', 'numbers'],
      durationSeconds: 115, status: 'published', publishedAt: now, viewCount: 49, createdBy: founderUser._id,
    },
    {
      title: 'The Thirsty Crow',
      grade: 'UKG', subject: mo._id, videoFormat: 'moral_story',
      scriptText: 'On a hot summer day, a thirsty crow found a pot with a little water at the bottom. The crow could not reach the water with his beak. He thought and thought. Then he saw some pebbles! One by one, he dropped pebbles into the pot. The water rose higher and higher. Soon he could drink! Where there is a will, there is a way!',
      tags: ['crow', 'clever', 'patience', 'problem-solving'],
      durationSeconds: 165, status: 'published', publishedAt: now, viewCount: 91, createdBy: founderUser._id,
    },
    {
      title: 'Plants Need Sunshine & Water',
      grade: 'UKG', subject: ev._id, videoFormat: 'point_and_learn',
      scriptText: 'Look at this tiny seed. We plant it in the soil. We water it every day. The sun shines warm and bright. Day by day the seed wakes up. A tiny shoot peeks out! It grows leaves, then flowers. Plants need soil, water, and sunlight to grow — just like you need food, water, and love!',
      tags: ['plants', 'nature', 'evs', 'growing'],
      durationSeconds: 140, status: 'published', publishedAt: now, viewCount: 38, createdBy: founderUser._id,
    },
    {
      title: 'Wash Your Hands Song',
      grade: 'UKG', subject: mv._id, videoFormat: 'good_habits',
      scriptText: 'Wash your hands before you eat,\nWash your hands after the street!\nRub the soap between your fingers,\nMake sure no dirty germ lingers!\nRinse them well under the tap,\nDry them off — give them a clap!\nClean hands keep us healthy and bright,\nWashing hands is always right!',
      tags: ['hygiene', 'habits', 'health', 'handwashing'],
      durationSeconds: 95, status: 'published', publishedAt: now, viewCount: 67, createdBy: founderUser._id,
    },
    {
      title: 'Jungle Dance Party!',
      grade: 'UKG', subject: mv._id, videoFormat: 'action_dance',
      scriptText: 'Stomp like an elephant — STOMP STOMP STOMP!\nHop like a frog — HOP HOP HOP!\nSlither like a snake — SSSS SSSS SSSS!\nRoar like a lion — ROAR ROAR ROAR!\nSwing like a monkey — SWING SWING SWING!\nFlap like a parrot — FLAP FLAP FLAP!\nNow put it all together for the jungle dance party!',
      tags: ['animals', 'dance', 'movement', 'jungle'],
      durationSeconds: 135, status: 'published', publishedAt: now, viewCount: 112, createdBy: founderUser._id,
    },
  ];
}

async function seed() {
  await connectDB();
  console.log('Seeding database...');

  await Grade.deleteMany({});
  await Subject.deleteMany({});
  await User.deleteMany({ role: 'founder' });
  await Lesson.deleteMany({});

  await Grade.insertMany(grades);
  console.log('✓ Grades seeded (LKG, UKG)');

  const insertedSubjects = await Subject.insertMany(subjectDefs);
  console.log('✓ Subjects seeded (6 subjects)');

  const subjectMap = {};
  insertedSubjects.forEach(s => { subjectMap[s.slug] = s; });

  const founderUser = await User.create({
    name: 'LittleLearners Founder',
    email: 'selvaganapathims007@gmail.com',
    password: 'selvaganapathi',
    role: 'founder',
  });
  console.log('✓ Founder user created');

  const lessonDocs = lessons(subjectMap, founderUser);
  await Lesson.insertMany(lessonDocs);
  console.log(`✓ ${lessonDocs.length} sample lessons seeded (all published)`);

  console.log('\nSeed complete!');
  console.log('Login: selvaganapathims007@gmail.com / FounderPass2024!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
