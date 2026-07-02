const router = require('express').Router();
const Lesson = require('../models/Lesson');
const { protect, staffOrAbove } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const { grade, format, subject, tags, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (grade) filter.grade = grade;
    if (format) filter.videoFormat = format;
    if (subject) filter.subject = subject;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (status) filter.status = status;
    else filter.status = 'published';

    const skip = (Number(page) - 1) * Number(limit);
    const [lessons, total] = await Promise.all([
      Lesson.find(filter).populate('subject', 'name icon color').sort({ publishedAt: -1 }).skip(skip).limit(Number(limit)),
      Lesson.countDocuments(filter),
    ]);
    res.json({ success: true, data: lessons, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
});

router.get('/formats', (req, res) => {
  res.json({ success: true, data: Lesson.VIDEO_FORMATS });
});

router.get('/:id', async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('subject', 'name icon color');
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    await Lesson.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
});

router.post('/', protect, staffOrAbove, async (req, res, next) => {
  try {
    const lesson = await Lesson.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, data: lesson });
  } catch (err) { next(err); }
});

router.put('/:id', protect, staffOrAbove, async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('subject', 'name icon color');
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
});

router.patch('/:id/publish', protect, staffOrAbove, async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { status: 'published', publishedAt: new Date() },
      { new: true }
    );
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, staffOrAbove, async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    res.json({ success: true, message: 'Lesson archived' });
  } catch (err) { next(err); }
});

module.exports = router;
