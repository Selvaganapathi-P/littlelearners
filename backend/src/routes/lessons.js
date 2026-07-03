const router = require('express').Router();
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const Child = require('../models/Child');
const { protect, staffOrAbove } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const { generateScript } = require('../services/scriptGenerator');

router.get('/', async (req, res, next) => {
  try {
    const { grade, format, subject, tags, status, title, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (grade) filter.grade = grade;
    if (format) filter.videoFormat = format;
    if (subject) filter.subject = subject;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (title) filter.title = { $regex: title, $options: 'i' };
    if (status && status !== 'all') filter.status = status;
    else if (status === 'all') filter.status = { $ne: 'archived' };
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

router.get('/tags', protect, staffOrAbove, async (req, res, next) => {
  try {
    const tags = await Lesson.distinct('tags');
    res.json({ success: true, data: tags.sort() });
  } catch (err) { next(err); }
});

router.get('/stats', protect, staffOrAbove, async (req, res, next) => {
  try {
    const [counts, topLessons] = await Promise.all([
      Lesson.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, views: { $sum: '$viewCount' } } }]),
      Lesson.find({ status: 'published' }).sort({ viewCount: -1 }).limit(5).select('title videoFormat grade viewCount'),
    ]);
    const byStatus = {};
    let totalViews = 0;
    for (const row of counts) {
      byStatus[row._id] = row.count;
      totalViews += row.views;
    }
    res.json({ success: true, data: { byStatus, totalViews, topLessons } });
  } catch (err) { next(err); }
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

    // Fire parent notifications async — do not block the response
    notifyParents(lesson).catch(err => console.error('Parent notify error:', err.message));
  } catch (err) { next(err); }
});

async function notifyParents(lesson) {
  const children = await Child.find({ grade: lesson.grade }).select('parentUser').lean();
  const parentIds = [...new Set(children.map(c => c.parentUser?.toString()).filter(Boolean))];
  if (!parentIds.length) return;
  const parents = await User.find({ _id: { $in: parentIds }, active: true }).select('name email').lean();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  for (const parent of parents) {
    await sendEmail({
      to: parent.email,
      subject: `New ${lesson.grade} video on LittleLearners! 🌟`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#FF6B9D;margin-bottom:4px;">New video for your little one! 🎬</h2>
          <p style="color:#374151;">Hi ${parent.name},</p>
          <p style="color:#6b7280;">A brand new <strong>${lesson.grade}</strong> video is now available on LittleLearners:</p>
          <div style="background:#fff5f8;border-left:4px solid #FF6B9D;padding:12px 16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;font-weight:bold;color:#111827;">${lesson.title}</p>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${frontendUrl}/dashboard?grade=${lesson.grade}"
              style="display:inline-block;padding:14px 28px;background:#FF6B9D;color:white;
                     border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">
              Watch Now →
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;"/>
          <p style="color:#d1d5db;font-size:12px;text-align:center;">LittleLearners — Joyful Learning for LKG & UKG</p>
        </div>
      `,
    }).catch(() => {});
  }
}

router.delete('/:id', protect, staffOrAbove, async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    res.json({ success: true, message: 'Lesson archived' });
  } catch (err) { next(err); }
});

// POST /lessons/bulk — bulk publish or archive selected lessons
router.post('/bulk', protect, staffOrAbove, async (req, res, next) => {
  try {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'ids required' });
    let update;
    if (action === 'publish') update = { status: 'published', publishedAt: new Date() };
    else if (action === 'archive') update = { status: 'archived' };
    else return res.status(400).json({ success: false, message: 'Invalid action' });
    const result = await Lesson.updateMany({ _id: { $in: ids } }, update);
    res.json({ success: true, modified: result.modifiedCount });
  } catch (err) { next(err); }
});

// POST /lessons/:id/clone — duplicate a lesson as a new draft
router.post('/:id/clone', protect, staffOrAbove, async (req, res, next) => {
  try {
    const original = await Lesson.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Lesson not found' });
    const clone = await Lesson.create({
      title: `${original.title} (Copy)`,
      grade: original.grade,
      subject: original.subject,
      videoFormat: original.videoFormat,
      scriptText: original.scriptText,
      tags: [...original.tags],
      status: 'draft',
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, data: clone });
  } catch (err) { next(err); }
});

// POST /lessons/:id/generate-script — AI script generation via OpenAI
router.post('/:id/generate-script', protect, staffOrAbove, async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('subject', 'name');
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    const scriptText = await generateScript({
      title: lesson.title,
      grade: lesson.grade,
      videoFormat: lesson.videoFormat,
      subject: lesson.subject?.name,
      tags: lesson.tags,
    });
    res.json({ success: true, data: { scriptText } });
  } catch (err) {
    if (err.message.includes('OPENAI_API_KEY')) {
      return res.status(503).json({ success: false, message: 'AI script generation is not configured on this server' });
    }
    next(err);
  }
});

// PATCH /lessons/:id/unpublish — revert published lesson back to ready
router.patch('/:id/unpublish', protect, staffOrAbove, async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { status: 'ready', $unset: { publishedAt: 1 } },
      { new: true }
    );
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
});

module.exports = router;
