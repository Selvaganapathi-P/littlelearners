const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const founderOnly = (req, res, next) => {
  if (req.user?.role !== 'founder') {
    return res.status(403).json({ success: false, message: 'Founder access only' });
  }
  next();
};

const staffOrAbove = (req, res, next) => {
  if (!['staff', 'admin', 'founder'].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Staff access required' });
  }
  next();
};

module.exports = { protect, founderOnly, staffOrAbove };
