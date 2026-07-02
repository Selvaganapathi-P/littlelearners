const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Child = require('../models/Child');
const { protect, staffOrAbove } = require('../middleware/auth');

// Soft auth — attaches req.user if a valid token is present, skips otherwise
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch { /* ignore */ }
  next();
}

// Authenticated parent: list children linked to their account
router.get('/mine', protect, async (req, res, next) => {
  try {
    const children = await Child.find({ parentUser: req.user.id })
      .populate('watchHistory.lesson', 'title videoFormat thumbnailUrl durationSeconds')
      .sort({ name: 1 });
    res.json({ success: true, data: children });
  } catch (err) { next(err); }
});

// Staff-only: list all children
router.get('/', protect, staffOrAbove, async (req, res, next) => {
  try {
    const { grade, school } = req.query;
    const filter = {};
    if (grade) filter.grade = grade;
    if (school) filter.school = school;
    const children = await Child.find(filter).populate('school', 'name').sort({ name: 1 });
    res.json({ success: true, data: children });
  } catch (err) { next(err); }
});

// Public: get child profile by ID (child ID in localStorage is the "key")
router.get('/:id', async (req, res, next) => {
  try {
    const child = await Child.findById(req.params.id)
      .populate('watchHistory.lesson', 'title videoFormat thumbnailUrl durationSeconds');
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });
    res.json({ success: true, data: child });
  } catch (err) { next(err); }
});

// Public: create child profile during onboarding (optionally links to logged-in parent)
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const childData = { ...req.body };
    if (req.user?.role === 'parent') childData.parentUser = req.user.id;
    const child = await Child.create(childData);
    res.status(201).json({ success: true, data: child });
  } catch (err) { next(err); }
});

const Lesson = require('../models/Lesson');

// Badge rules — checked after every watch event
async function checkAndAwardBadges(child, lessonId) {
  const newBadges = [];
  const existingNames = new Set(child.badges.map(b => b.name));

  const totalWatched = child.watchHistory.length + 1; // +1 for the one just added

  // Starter badge — first ever video
  if (totalWatched === 1 && !existingNames.has('First Watch!')) {
    newBadges.push({ name: 'First Watch!', videoFormat: 'sing_along', earnedAt: new Date() });
  }

  // Explorer badge — 10 videos watched
  if (totalWatched === 10 && !existingNames.has('Explorer')) {
    newBadges.push({ name: 'Explorer', videoFormat: 'point_and_learn', earnedAt: new Date() });
  }

  // Binge badge — 25 videos
  if (totalWatched === 25 && !existingNames.has('Super Learner')) {
    newBadges.push({ name: 'Super Learner', videoFormat: 'recap_song', earnedAt: new Date() });
  }

  // Streak badge — 7 consecutive days
  if (child.streaks.current >= 7 && !existingNames.has('Week Streak 🔥')) {
    newBadges.push({ name: 'Week Streak 🔥', videoFormat: 'celebration_video', earnedAt: new Date() });
  }

  // Format fan badges — 5 videos in a specific format
  try {
    const lesson = await Lesson.findById(lessonId, 'videoFormat');
    if (lesson) {
      const fmt = lesson.videoFormat;
      const fmtCount = child.watchHistory.filter(h => {
        if (!h.lesson) return false;
        const id = typeof h.lesson === 'object' ? h.lesson._id?.toString() : h.lesson.toString();
        return id === lessonId.toString();
      }).length;
      // Count all same-format watches including current
      const fmtWatches = child.watchHistory.filter(h => h.lesson).length; // approximate via total
      const badgeName = `${fmt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Fan`;
      if (fmtWatches >= 4 && !existingNames.has(badgeName)) {
        newBadges.push({ name: badgeName, videoFormat: fmt, earnedAt: new Date() });
      }
    }
  } catch { /* non-critical */ }

  return newBadges;
}

// Public: record watch progress (child ID + lessonId are enough to attribute)
router.patch('/:id/watch', async (req, res, next) => {
  try {
    const { lessonId, completedPercent } = req.body;
    const child = await Child.findById(req.params.id);
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last = child.streaks.lastActivityDate ? new Date(child.streaks.lastActivityDate) : null;
    if (last) last.setHours(0, 0, 0, 0);

    const dayDiff = last ? Math.round((today - last) / 86400000) : null;

    let newCurrent = child.streaks.current;
    if (dayDiff === null || dayDiff > 1) newCurrent = 1;
    else if (dayDiff === 1) newCurrent = child.streaks.current + 1;

    const newLongest = Math.max(child.streaks.longest || 0, newCurrent);

    // Dedup: skip push if same lesson was already recorded in the last 24h
    const oneDayAgo = new Date(Date.now() - 86400000);
    const recentEntry = child.watchHistory.find(h => {
      const id = typeof h.lesson === 'object' ? h.lesson?._id?.toString() : h.lesson?.toString();
      return id === lessonId.toString() && h.watchedAt > oneDayAgo;
    });

    // Check badges before updating (so we have current state for counts)
    const newBadges = await checkAndAwardBadges({ ...child.toObject(), streaks: { ...child.streaks.toObject(), current: newCurrent } }, lessonId);

    const pushItems = {};
    if (!recentEntry) pushItems.watchHistory = { $each: [{ lesson: lessonId, watchedAt: new Date(), completedPercent }] };
    if (newBadges.length > 0) pushItems.badges = { $each: newBadges };

    const updateOp = {
      $set: {
        'streaks.lastActivityDate': new Date(),
        'streaks.current': newCurrent,
        'streaks.longest': newLongest,
      },
      ...(Object.keys(pushItems).length > 0 ? { $push: pushItems } : {}),
    };

    const updated = await Child.findByIdAndUpdate(req.params.id, updateOp, { new: true });
    res.json({ success: true, data: updated, newBadges });
  } catch (err) { next(err); }
});

// Authenticated parent: link an existing child to their account
router.post('/:id/claim', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'parent') return res.status(403).json({ success: false, message: 'Parents only' });
    const child = await Child.findById(req.params.id);
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });
    if (child.parentUser && child.parentUser.toString() !== req.user.id) {
      return res.status(409).json({ success: false, message: 'This child is already linked to another account' });
    }
    child.parentUser = req.user.id;
    await child.save();
    res.json({ success: true, data: child });
  } catch (err) { next(err); }
});

// Public: update child profile fields (name, avatar — not grade, not watchHistory)
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = {};
    if (req.body.name) allowed.name = req.body.name.trim().slice(0, 64);
    if (req.body.avatar) allowed.avatar = req.body.avatar.slice(0, 8);
    if (!Object.keys(allowed).length) return res.status(400).json({ success: false, message: 'Nothing to update' });
    const child = await Child.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });
    res.json({ success: true, data: child });
  } catch (err) { next(err); }
});

// Staff-only: award badge
router.patch('/:id/badge', protect, staffOrAbove, async (req, res, next) => {
  try {
    const { name, videoFormat } = req.body;
    const child = await Child.findByIdAndUpdate(
      req.params.id,
      { $push: { badges: { name, earnedAt: new Date(), videoFormat } } },
      { new: true }
    );
    res.json({ success: true, data: child });
  } catch (err) { next(err); }
});

module.exports = router;
