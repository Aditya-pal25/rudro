const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) { res.status(401); throw new Error('Not authorized. Please log in.'); }
  // Verify token safely inside try-catch
  try {
    const secret = process.env.JWT_SECRET || 'rudroham_dev_jwt_secret_fallback_key_12345';
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) { res.status(401); throw new Error('User not found.'); }
    if (!user.isActive) { res.status(401); throw new Error('Account deactivated. Contact support.'); }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      res.status(401); throw new Error('Invalid or expired token. Please log in again.');
    }
    throw err;
  }
});

exports.admin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  console.warn(`🚨 Unauthorized admin attempt: user ${req.user?._id} (${req.user?.email})`);
  res.status(403); throw new Error('Admin access required.');
};
