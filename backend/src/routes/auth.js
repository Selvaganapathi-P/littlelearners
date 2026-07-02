const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, founderOnly } = require('../middleware/auth');
const { sendPasswordReset } = require('../utils/email');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, school: user.school },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

router.post('/register', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, email, password, role, school } = req.body;
    const user = await User.create({ name, email, password, role, school });
    const token = signToken(user);
    res.status(201).json({ success: true, token, user: { id: user._id, name, email, role } });
  } catch (err) { next(err); }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email, active: true }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const token = signToken(user);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (err) { next(err); }
});

router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('school', 'name region');
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

router.get('/users', protect, founderOnly, async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

router.patch('/users/:id/toggle-active', protect, founderOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'founder') return res.status(403).json({ success: false, message: 'Cannot deactivate founder' });
    user.active = !user.active;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, data: { id: user._id, active: user.active } });
  } catch (err) { next(err); }
});

// POST /auth/forgot-password — generate reset token
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase(), active: true });
    // Always return success to prevent email enumeration
    if (!user) return res.json({ success: true, message: 'If that email exists, a reset link was sent.' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordReset({ name: user.name, email: user.email, resetUrl });
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    // In dev (no SMTP) still return resetUrl so we can test without email
    const isDev = process.env.NODE_ENV !== 'production' || !process.env.SMTP_USER;
    res.json({ success: true, message: 'Reset link sent to your email.', ...(isDev && { resetUrl }) });
  } catch (err) { next(err); }
});

// POST /auth/reset-password — verify token and set new password
router.post('/reset-password', [
  body('password').isLength({ min: 8 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    const { token, password } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Reset token is required' });

    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    const jwtToken = signToken(user);
    res.json({ success: true, message: 'Password reset successful', token: jwtToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

module.exports = router;
