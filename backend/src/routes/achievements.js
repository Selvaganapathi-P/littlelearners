const router = require('express').Router();
const Achievement = require('../models/Achievement');
const Child = require('../models/Child');
const { protect, staffOrAbove } = require('../middleware/auth');

// GET /api/achievements — list all achievements
router.get('/', async (req, res, next) => {
  try {
    const achievements = await Achievement.find().sort({ order: 1 });
    res.json({ success: true, data: achievements });
  } catch (err) { next(err); }
});

// GET /api/achievements/child/:childId — child's earned achievements with full details
router.get('/child/:childId', protect, async (req, res, next) => {
  try {
    const child = await Child.findById(req.params.childId)
      .populate('achievements.achievement');
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    const all = await Achievement.find().sort({ order: 1 });
    const earnedMap = new Map(
      child.achievements.map(a => [a.achievement._id?.toString() ?? a.achievement.toString(), a.earnedAt])
    );

    const data = all.map(ach => ({
      ...ach.toObject(),
      earned: earnedMap.has(ach._id.toString()),
      earnedAt: earnedMap.get(ach._id.toString()) ?? null,
    }));

    res.json({ success: true, data, stats: { xp: child.xp, coins: child.coins, level: child.level, streak: child.streaks.current } });
  } catch (err) { next(err); }
});

// POST /api/achievements/seed — seed defaults (admin only)
router.post('/seed', protect, staffOrAbove, async (req, res, next) => {
  try {
    await Achievement.seedDefaults();
    res.json({ success: true, message: 'Achievements seeded' });
  } catch (err) { next(err); }
});

module.exports = router;
