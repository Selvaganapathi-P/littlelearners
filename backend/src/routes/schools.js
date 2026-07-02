const router = require('express').Router();
const School = require('../models/School');
const { protect, staffOrAbove, founderOnly } = require('../middleware/auth');

router.get('/', protect, founderOnly, async (req, res, next) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 });
    res.json({ success: true, data: schools });
  } catch (err) { next(err); }
});

router.get('/:id', protect, staffOrAbove, async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    res.json({ success: true, data: school });
  } catch (err) { next(err); }
});

router.post('/', protect, founderOnly, async (req, res, next) => {
  try {
    const school = await School.create(req.body);
    res.status(201).json({ success: true, data: school });
  } catch (err) { next(err); }
});

router.put('/:id', protect, founderOnly, async (req, res, next) => {
  try {
    const allowed = {};
    const fields = ['name', 'contactEmail', 'city', 'state', 'plan', 'region', 'gradeLevels'];
    for (const f of fields) if (req.body[f] !== undefined) allowed[f] = req.body[f];
    const school = await School.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    res.json({ success: true, data: school });
  } catch (err) { next(err); }
});

router.patch('/:id/toggle-active', protect, founderOnly, async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    school.active = !school.active;
    await school.save();
    res.json({ success: true, data: { id: school._id, active: school.active } });
  } catch (err) { next(err); }
});

module.exports = router;
