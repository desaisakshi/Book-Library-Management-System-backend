const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.'
      });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });

    // FIX: populate authorProfile for author users so controllers can access it
    if (user.role === 'author') {
      const { Author } = require('../models');
      user.authorProfile = await Author.findOne({ where: { user_id: user.id } });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Access denied. Required: ${roles.join(' or ')}` });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      if (user) req.user = user;
    } catch (_) { /* ignore */ }
  }
  next();
};

module.exports = { authenticate, authorize, optionalAuth };
