const router = require('express').Router();
const Subject = require('../models/Subject');
const { protect, staffOrAbove } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.grade) filter.grades = req.query.grade;
    const subjects = await Subject.find(filter).sort({ name: 1 });
    res.json({ success: true, data: subjects });
  } catch (err) { next(err); }
});

router.post('/', protect, staffOrAbove, async (req, res, next) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, data: subject });
  } catch (err) { next(err); }
});

router.put('/:id', protect, staffOrAbove, async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subject });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, staffOrAbove, async (req, res, next) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Subject deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
