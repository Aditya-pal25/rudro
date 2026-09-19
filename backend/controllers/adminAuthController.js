const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');

const User = require('../models/User');

const crypto = require('crypto');
const OTP = require('../models/OTP');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

// ── Admin Login Step 1: Validate Credentials & Send OTP via Nodemailer ───────
exports.sendOTP = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const normalEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalEmail }).select('+password');

  if (!user || user.role !== 'admin') {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error('Admin account is deactivated');
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }

  const otp = generateOTP();
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  await OTP.deleteMany({ email: normalEmail, type: 'admin-login' });
  await OTP.create({
    email: normalEmail,
    otp: hashedOTP,
    type: 'admin-login',
    attempts: 0,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendOTPEmail(normalEmail, otp, 'login', user.name?.split(' ')[0] || 'Admin');

  res.json({
    success: true,
    message: `OTP sent to ${normalEmail}. Valid for 10 minutes.`,
    email: normalEmail,
  });
});

// ── Admin Login Step 2: Verify OTP & Issue Token ──────────────────────────────
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }

  const normalEmail = email.toLowerCase().trim();
  const record = await OTP.findOne({ email: normalEmail, type: 'admin-login' });

  if (!record || new Date() > record.expiresAt) {
    if (record) await OTP.deleteOne({ _id: record._id });
    res.status(400);
    throw new Error('OTP expired. Please request a new one.');
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    await OTP.deleteOne({ _id: record._id });
    res.status(400);
    throw new Error('Too many wrong attempts. Please request a new OTP.');
  }
  await record.save();

  const hashedInput = crypto.createHash('sha256').update(otp.toString().trim()).digest('hex');
  if (hashedInput !== record.otp) {
    res.status(400);
    throw new Error(`Incorrect OTP. ${5 - record.attempts} attempt(s) remaining.`);
  }

  const user = await User.findOne({ email: normalEmail });
  if (!user || user.role !== 'admin') {
    res.status(401);
    throw new Error('Admin access required');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  await OTP.deleteOne({ _id: record._id });

  const token = user.getJwtToken();
  const adminData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
  };

  res.json({
    success: true,
    token,
    admin: adminData,
    user: adminData,
  });
});

// ── Resend Admin OTP ──────────────────────────────────────────────────────────
exports.resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const normalEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalEmail, role: 'admin' });
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('Admin account not found or deactivated');
  }

  const otp = generateOTP();
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  await OTP.deleteMany({ email: normalEmail, type: 'admin-login' });
  await OTP.create({
    email: normalEmail,
    otp: hashedOTP,
    type: 'admin-login',
    attempts: 0,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendOTPEmail(normalEmail, otp, 'login', user.name?.split(' ')[0] || 'Admin');

  res.json({
    success: true,
    message: `New OTP sent to ${normalEmail}`,
  });
});

// ── Direct Login (Credentials fallback) ───────────────────────────────────────
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