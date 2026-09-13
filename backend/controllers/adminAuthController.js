const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');

const User = require('../models/User');

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const normalEmail = email.toLowerCase().trim();

  // Find the actual admin user from MongoDB
  const user = await User.findOne({
    email: normalEmail,
  }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }

  // Make absolutely sure this account is an administrator
  if (user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error('Admin account is deactivated');
  }

  const passwordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordValid) {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }

  // Use the same JWT generator as the User model.
  // This guarantees the token contains the ID
  // expected by middleware/auth.js.
  const token = user.getJwtToken();

  res.json({
    success: true,
    token,
    admin: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
    },
  });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    admin: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      avatar: req.user.avatar,
      emailVerified: req.user.emailVerified,
    },
  });
});