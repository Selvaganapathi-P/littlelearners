const router = require('express').Router();
const Activity = require('../models/Activity');
const Lesson = require('../models/Lesson');
const Child = require('../models/Child');
const Achievement = require('../models/Achievement');
const { protect, staffOrAbove } = require('../middleware/auth');

// ── Helpers ────────────────────────────────────────────────────────────────

function autoGenerateActivities(lesson) {
  const activities = [];
  const tags = lesson.tags || [];
  const title = lesson.title || 'Lesson';
  const fmt = lesson.videoFormat || 'sing_along';

  // ── Story (always generated from scriptText) ─────────────────────────────
  const script = lesson.scriptText || `Let's learn about ${title}! This is a fun ${fmt.replace(/_/g, ' ')} for ${lesson.grade} students.`;
  const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
  const chunkSize = 2;
  const pages = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    const text = sentences.slice(i, i + chunkSize).join(' ').trim();
    if (text.length > 5) pages.push({ text, emoji: ['🌟', '📚', '🎉', '🌈', '🎵', '🦋'][i % 6], bg: '#FFF9F0' });
  }
  if (pages.length) activities.push({ type: 'story', title: `📖 ${title} — Story`, content: { pages } });

  // ── Flashcards (from tags + format) ──────────────────────────────────────
  const FORMAT_CARDS = {
    phonics_song:  tags.map(t => ({ front: t.toUpperCase()[0], back: t, emoji: tagEmoji(t), example: `${t.toUpperCase()[0]} is for ${t}` })),
    number_song:   ['1','2','3','4','5','6','7','8','9','10'].map((n,i) => ({ front: n, back: numWords[i], emoji: numEmoji[i], example: `${numWords[i]} ${numEmoji[i].repeat(i+1)}` })),
    moral_story:   tags.map(t => ({ front: t, back: moralDesc(t), emoji: '💛', example: '' })),
  };
  const cards = FORMAT_CARDS[fmt] ||
    tags.slice(0, 8).map(t => ({ front: t, back: `${t} — from ${title}`, emoji: tagEmoji(t), example: '' }));
  if (cards.length) activities.push({ type: 'flashcard', title: `🃏 ${title} — Flashcards`, content: { cards } });

  // ── Quiz (3-5 questions from tags + title) ────────────────────────────────
  const questions = buildQuizQuestions(lesson, tags);
  if (questions.length) activities.push({ type: 'quiz', title: `❓ ${title} — Quiz`, content: { questions } });

  // ── Matching (pairs from tags) ────────────────────────────────────────────
  const pairs = tags.slice(0, 6).map(t => ({ word: t, emoji: tagEmoji(t) }));
  if (pairs.length >= 3) activities.push({ type: 'matching', title: `🎯 ${title} — Match It`, content: { pairs } });

  return activities;
}

function buildQuizQuestions(lesson, tags) {
  const qs = [];
  const title = lesson.title;
  const grade = lesson.grade;
  const fmt = lesson.videoFormat;

  if (fmt === 'phonics_song' && tags.length) {
    const letter = tags[0][0]?.toUpperCase();
    const word = tags[0];
    if (letter && word) {
      qs.push({ question: `What sound does the letter ${letter} make?`, options: [`${letter} as in ${word}`, 'Buh', 'Cuh', 'Duh'], correct: 0, emoji: tagEmoji(word), explanation: `${letter} makes the "${letter.toLowerCase()}" sound, as in ${word}!` });
      qs.push({ question: `Which word starts with ${letter}?`, options: [word, ...getWrongWords(word, tags)].slice(0, 4), correct: 0, emoji: '🔤' });
    }
  }
  if (fmt === 'number_song') {
    qs.push({ question: 'How many fingers do you have on one hand?', options: ['3', '5', '7', '4'], correct: 1, emoji: '✋', explanation: 'You have 5 fingers on each hand!' });
    qs.push({ question: 'What number comes after 3?', options: ['2', '5', '4', '6'], correct: 2, emoji: '🔢', explanation: 'After 3 comes 4!' });
  }
  if (fmt === 'moral_story') {
    qs.push({ question: `What is the main lesson of "${title}"?`, options: ['Being kind', 'Being greedy', 'Being rude', 'Not sharing'], correct: 0, emoji: '💛', explanation: 'Being kind and sharing makes everyone happy!' });
  }
  // Generic questions
  qs.push({ question: `This activity is for which class?`, options: ['LKG', 'UKG', 'Class 1', 'Class 2'], correct: grade === 'LKG' ? 0 : 1, emoji: '🏫', explanation: `This is a ${grade} activity!` });
  if (tags.length > 1) {
    qs.push({ question: `Which of these topics is covered?`, options: [tags[0], 'Space', 'Cooking', 'Cricket'], correct: 0, emoji: tagEmoji(tags[0]), explanation: `Yes! We learn about ${tags[0]} in this activity.` });
  }
  return qs.slice(0, 5);
}

function getWrongWords(correct, tags) {
  const bank = ['ball', 'cat', 'dog', 'egg', 'fan', 'goat', 'hat', 'ice', 'jar', 'kite'];
  return bank.filter(w => w !== correct && !tags.includes(w)).slice(0, 3);
}

const numWords = ['One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'];
const numEmoji = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

function tagEmoji(tag) {
  const map = { apple:'🍎', ball:'⚽', cat:'🐱', dog:'🐶', egg:'🥚', fish:'🐟', goat:'🐐', hat:'🎩', ice:'🧊', jar:'🏺', kite:'🪁', lion:'🦁', moon:'🌙', nest:'🪺', owl:'🦉', parrot:'🦜', queen:'👑', rabbit:'🐰', sun:'☀️', tree:'🌳', umbrella:'☂️', van:'🚐', water:'💧', xmas:'🎄', yellow:'💛', zebra:'🦓', number:'🔢', phonics:'🔤', story:'📖', dance:'💃', yoga:'🧘', habit:'✨', festival:'🎉', emotion:'😊', rhyme:'🎵', song:'🎶' };
  const key = (tag || '').toLowerCase();
  return map[key] || '⭐';
}

function moralDesc(tag) {
  const map = { kindness:'Being kind makes others happy', sharing:'Sharing is caring', honesty:'Always tell the truth', respect:'Treat others as you want to be treated', patience:'Good things take time', gratitude:'Be thankful for what you have' };
  return map[(tag||'').toLowerCase()] || `Learning about ${tag}`;
}

// ── Routes ──────────────────────────────────────────────────────────────────

// GET /api/activities?lesson=:id  — get activities for a lesson (auto-generates if none)
router.get('/', async (req, res, next) => {
  try {
    const { lesson: lessonId, grade, type } = req.query;
    const filter = { status: 'published' };
    if (lessonId) filter.lesson = lessonId;
    if (grade) filter.grade = grade;
    if (type) filter.type = type;

    let activities = await Activity.find(filter).sort({ createdAt: 1 });

    // Auto-generate if lesson specified and no activities exist yet
    if (lessonId && activities.length === 0) {
      const lesson = await Lesson.findById(lessonId);
      if (lesson) {
        const generated = autoGenerateActivities(lesson);
        const docs = generated.map(a => ({ ...a, lesson: lesson._id, grade: lesson.grade, status: 'published' }));
        activities = await Activity.insertMany(docs);
      }
    }

    res.json({ success: true, data: activities });
  } catch (err) { next(err); }
});

// GET /api/activities/:id
router.get('/:id', async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json({ success: true, data: activity });
  } catch (err) { next(err); }
});

// POST /api/activities — create (staff+)
router.post('/', protect, staffOrAbove, async (req, res, next) => {
  try {
    const activity = await Activity.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: activity });
  } catch (err) { next(err); }
});

// PUT /api/activities/:id
router.put('/:id', protect, staffOrAbove, async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!activity) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: activity });
  } catch (err) { next(err); }
});

// DELETE /api/activities/:id
router.delete('/:id', protect, staffOrAbove, async (req, res, next) => {
  try {
    await Activity.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/activities/:id/submit — child submits answers, earns XP/coins
router.post('/:id/submit', protect, async (req, res, next) => {
  try {
    const { childId, answers } = req.body; // answers: array of chosen option indexes for quiz
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    // Calculate score for quiz; other types auto-complete
    let score = 100;
    let perfectQuiz = false;
    if (activity.type === 'quiz' && answers && activity.content.questions.length) {
      const correct = answers.filter((a, i) => a === activity.content.questions[i]?.correct).length;
      score = Math.round((correct / activity.content.questions.length) * 100);
      perfectQuiz = score === 100;
    }

    const xpEarned = Math.round(activity.xpReward * (score / 100));
    const coinsEarned = Math.round(activity.coinsReward * (score / 100));

    // Update streak
    const today = new Date(); today.setHours(0,0,0,0);
    const last = child.streaks.lastActivityDate ? new Date(child.streaks.lastActivityDate) : null;
    if (last) { last.setHours(0,0,0,0); }
    const dayDiff = last ? Math.floor((today - last) / 86400000) : null;
    if (dayDiff === 1) {
      child.streaks.current += 1;
      if (child.streaks.current > child.streaks.longest) child.streaks.longest = child.streaks.current;
    } else if (dayDiff === null || dayDiff > 1) {
      child.streaks.current = 1;
    }
    child.streaks.lastActivityDate = new Date();

    // Add XP, coins, log activity
    child.xp += xpEarned;
    child.coins += coinsEarned;
    child.activityHistory.push({ activity: activity._id, lesson: activity.lesson, activityType: activity.type, score, xpEarned, coinsEarned });

    // Check and award achievements
    const allAchievements = await Achievement.find();
    const earnedIds = new Set(child.achievements.map(a => a.achievement.toString()));
    const newlyEarned = [];

    for (const ach of allAchievements) {
      if (earnedIds.has(ach._id.toString())) continue;
      const met = await checkAchievement(ach, child, { perfectQuiz, activityType: activity.type });
      if (met) {
        child.achievements.push({ achievement: ach._id, earnedAt: new Date() });
        child.xp += ach.xpReward;
        newlyEarned.push({ name: ach.name, icon: ach.icon, type: ach.type });
      }
    }

    await child.save();
    res.json({ success: true, data: { score, xpEarned, coinsEarned, streak: child.streaks.current, level: child.level, newAchievements: newlyEarned } });
  } catch (err) { next(err); }
});

async function checkAchievement(ach, child, context) {
  const hist = child.activityHistory || [];
  switch (ach.metric) {
    case 'activities_done':    return hist.length >= ach.value;
    case 'streak_days':        return child.streaks.current >= ach.value;
    case 'quizzes_done':       return hist.filter(h => h.activityType === 'quiz').length >= ach.value;
    case 'quiz_perfect':       return context.perfectQuiz;
    case 'flashcards_done':    return hist.filter(h => h.activityType === 'flashcard').length >= ach.value;
    case 'stories_read':       return hist.filter(h => h.activityType === 'story').length >= ach.value;
    case 'matching_done':      return hist.filter(h => h.activityType === 'matching').length >= ach.value;
    case 'xp_earned':          return child.xp >= ach.value;
    default:                   return false;
  }
}

// POST /api/activities/lesson/:lessonId/regenerate — force re-generate activities
router.post('/lesson/:lessonId/regenerate', protect, staffOrAbove, async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    await Activity.deleteMany({ lesson: lesson._id });
    const generated = autoGenerateActivities(lesson);
    const docs = generated.map(a => ({ ...a, lesson: lesson._id, grade: lesson.grade, status: 'published' }));
    const activities = await Activity.insertMany(docs);
    res.json({ success: true, data: activities, message: `Generated ${activities.length} activities` });
  } catch (err) { next(err); }
});

module.exports = router;
