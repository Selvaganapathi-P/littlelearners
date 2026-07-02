const router = require('express').Router();
const Child = require('../models/Child');
const { protect, staffOrAbove } = require('../middleware/auth');

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

router.get('/:id', protect, async (req, res, next) => {
  try {
    const child = await Child.findById(req.params.id).populate('watchHistory.lesson', 'title videoFormat thumbnailUrl');
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });
    res.json({ success: true, data: child });
  } catch (err) { next(err); }
});

router.post('/', protect, staffOrAbove, async (req, res, next) => {
  try {
    const child = await Child.create(req.body);
    res.status(201).json({ success: true, data: child });
  } catch (err) { next(err); }
});

router.patch('/:id/watch', protect, async (req, res, next) => {
  try {
    const { lessonId, completedPercent } = req.body;
    const child = await Child.findByIdAndUpdate(
      req.params.id,
      {
        $push: { watchHistory: { lesson: lessonId, watchedAt: new Date(), completedPercent } },
        'streaks.lastActivityDate': new Date(),
        $inc: { 'streaks.current': 1 },
      },
      { new: true }
    );
    res.json({ success: true, data: child });
  } catch (err) { next(err); }
});

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
