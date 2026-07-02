const router = require('express').Router();
const Grade = require('../models/Grade');
const { protect, staffOrAbove } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const grades = await Grade.find().sort({ name: 1 });
    res.json({ success: true, data: grades });
  } catch (err) { next(err); }
});

router.get('/:name', async (req, res, next) => {
  try {
    const grade = await Grade.findOne({ name: req.params.name.toUpperCase() });
    if (!grade) return res.status(404).json({ success: false, message: 'Grade not found' });
    res.json({ success: true, data: grade });
  } catch (err) { next(err); }
});

router.post('/', protect, staffOrAbove, async (req, res, next) => {
  try {
    const grade = await Grade.create(req.body);
    res.status(201).json({ success: true, data: grade });
  } catch (err) { next(err); }
});

module.exports = router;
