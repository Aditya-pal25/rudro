const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/emailService');

// ── Send JWT token safely (never expose password) ─────────────────────────────
const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();
  const safe = {
    _id: user._id, name: user.name, email: user.email,
    phone: user.phone, role: user.role, avatar: user.avatar,
    addresses: user.addresses, wishlist: user.wishlist,
    totalOrders: user.totalOrders, emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
  res.status(statusCode).json({ success: true, token, user: safe });
};

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400); throw new Error('Name, email and password are required');
  }
  if (password.length < 6) { res.status(400); throw new Error('Password must be at least 6 characters'); }
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) { res.status(400); throw new Error('Email already registered. Please login.'); }
  const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password, phone });
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  sendToken(user, 201, res);
});

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error('Email and password are required'); }
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  // Generic message — don't reveal if email exists
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401); throw new Error('Invalid email or password');
  }
  if (!user.isActive) { res.status(401); throw new Error('Account deactivated. Contact support.'); }
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  sendToken(user, 200, res);
});

// ── Get Me ────────────────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('wishlist', 'name images price discountPrice');
  res.json({ success: true, user });
});

// ── Update Profile ────────────────────────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = {};
  if (req.body.name)   allowed.name   = req.body.name.replace(/[<>'"]/g, '').trim().slice(0, 50);
  if (req.body.phone)  allowed.phone  = req.body.phone;
  if (req.body.avatar) allowed.avatar = req.body.avatar;
  const user = await User.findByIdAndUpdate(req.user.id, allowed, { new: true, runValidators: true });
  res.json({ success: true, user });
});

// ── Change Password ───────────────────────────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) { res.status(400); throw new Error('Both passwords are required'); }
  if (newPassword.length < 6) { res.status(400); throw new Error('New password must be at least 6 characters'); }
  const user = await User.findById(req.user.id).select('+password');
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    res.status(400); throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res);
});

// ── Forgot Password — ✅ FIXED: token sent via email, NEVER in response ───────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) { res.status(400); throw new Error('Email is required'); }
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  // Always return success — don't reveal if email exists (prevent enumeration)
  if (!user) {
    return res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  // ✅ Send via email (not in response)
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  try {
    await sendOTPEmail(email, null, 'reset', user.name.split(' ')[0], resetUrl);
  } catch (e) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500); throw new Error('Email could not be sent. Try again later.');
  }
  res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
});

// ── Reset Password ────────────────────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) { res.status(400); throw new Error('Invalid or expired reset link'); }
  if (!req.body.password || req.body.password.length < 6) {
    res.status(400); throw new Error('Password must be at least 6 characters');
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
});

// ── Address management ────────────────────────────────────────────────────────
exports.addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user.addresses.length >= 5) { res.status(400); throw new Error('Maximum 5 addresses allowed'); }
  if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
  user.addresses.push(req.body);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

exports.updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const addr = user.addresses.id(req.params.addressId);
  if (!addr) { res.status(404); throw new Error('Address not found'); }
  if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
  Object.assign(addr, req.body);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

exports.deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

exports.toggleWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const productId = req.params.productId;
  const idx = user.wishlist.findIndex(id => id.toString() === productId);
  if (idx > -1) {
    user.wishlist.splice(idx, 1);
  } else {
    if (user.wishlist.length >= 50) { res.status(400); throw new Error('Wishlist limit reached (50 items)'); }
    user.wishlist.push(productId);
  }
  await user.save();
  res.json({ success: true, wishlist: user.wishlist, action: idx > -1 ? 'removed' : 'added' });
});

// ════════════════════════════════════════════════════════════════════════════════
// OTP AUTHENTICATION METHODS
// ════════════════════════════════════════════════════════════════════════════════
const OTP = require('../models/OTP');
const { generateOTP } = require('../utils/emailService');

// ── Register Step 1: Send OTP ─────────────────────────────────────────────────
exports.registerSendOTP = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name?.trim() || !email?.trim() || !password) { res.status(400); throw new Error('Name, email and password are required'); }
  if (password.length < 6) { res.status(400); throw new Error('Password must be at least 6 characters'); }
  if (!/^\S+@\S+\.\S+$/.test(email)) { res.status(400); throw new Error('Invalid email address'); }
  const normalEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalEmail });
  if (existing) { res.status(400); throw new Error('Email already registered. Please login.'); }
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);
  const otp = generateOTP();
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  await OTP.deleteMany({ email: normalEmail, type: 'register' });
  await OTP.create({ email: normalEmail, otp: hashedOTP, type: 'register', tempData: { name: name.replace(/[<>'"]/g,'').trim().slice(0,50), phone: phone?.slice(0,15)||'', password: hashedPassword }, expiresAt: new Date(Date.now() + 10*60*1000) });
  await sendOTPEmail(normalEmail, otp, 'register', name.split(' ')[0]);
  res.json({ success: true, message: `OTP sent to ${normalEmail}. Valid 10 minutes.`, email: normalEmail });
});

// ── Register Step 2: Verify OTP & Create Account ─────────────────────────────
exports.registerVerifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) { res.status(400); throw new Error('Email and OTP required'); }
  const normalEmail = email.toLowerCase().trim();
  const record = await OTP.findOne({ email: normalEmail, type: 'register' });
  if (!record || new Date() > record.expiresAt) { if (record) await OTP.deleteOne({ _id: record._id }); res.status(400); throw new Error('OTP expired. Request a new one.'); }
  record.attempts += 1;
  if (record.attempts > 5) { await OTP.deleteOne({ _id: record._id }); res.status(400); throw new Error('Too many wrong attempts. Request a new OTP.'); }
  await record.save();
  const hashedInput = crypto.createHash('sha256').update(otp.toString().trim()).digest('hex');
  if (hashedInput !== record.otp) { res.status(400); throw new Error(`Incorrect OTP. ${5 - record.attempts} attempt(s) remaining.`); }
  const { name, phone, password } = record.tempData;
  const user = new User({ name, email: normalEmail, phone: phone||undefined, emailVerified: true, lastLogin: new Date() });
  user.password = password;
  await user.save({ validateBeforeSave: false });
  await OTP.deleteOne({ _id: record._id });
  sendToken(user, 201, res);
});

// ── Login Step 1: Verify credentials & Send OTP ───────────────────────────────
exports.loginSendOTP = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password required');
  }

  const normalEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalEmail
  }).select('+password');

  console.log('LOGIN DEBUG:', {
    email: normalEmail,
    userFound: !!user,
    passwordProvided: !!password,
    hashExists: !!user?.password,
    hashPrefix: user?.password?.substring(0, 7),
    hashLength: user?.password?.length,
  });

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  console.log('PASSWORD MATCH:', passwordMatches);

  if (!passwordMatches) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error('Account deactivated. Contact support.');
  }

  const otp = generateOTP();

  const hashedOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  await OTP.deleteMany({
    email: normalEmail,
    type: 'login'
  });

  await OTP.create({
    email: normalEmail,
    otp: hashedOTP,
    type: 'login',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });

  await sendOTPEmail(
    normalEmail,
    otp,
    'login',
    user.name.split(' ')[0]
  );

  res.json({
    success: true,
    message: `OTP sent to ${normalEmail}. Valid 10 minutes.`,
    email: normalEmail
  });
});

// ── Login Step 2: Verify OTP & Issue Token ────────────────────────────────────
exports.loginVerifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) { res.status(400); throw new Error('Email and OTP required'); }
  const normalEmail = email.toLowerCase().trim();
  const record = await OTP.findOne({ email: normalEmail, type: 'login' });
  if (!record || new Date() > record.expiresAt) { if (record) await OTP.deleteOne({ _id: record._id }); res.status(400); throw new Error('OTP expired. Request a new one.'); }
  record.attempts += 1;
  if (record.attempts > 5) { await OTP.deleteOne({ _id: record._id }); res.status(400); throw new Error('Too many wrong attempts. Request a new OTP.'); }
  await record.save();
  const hashedInput = crypto.createHash('sha256').update(otp.toString().trim()).digest('hex');
  if (hashedInput !== record.otp) { res.status(400); throw new Error(`Incorrect OTP. ${5 - record.attempts} attempt(s) remaining.`); }
  const user = await User.findOne({ email: normalEmail });
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  await OTP.deleteOne({ _id: record._id });
  sendToken(user, 200, res);
});

// ── Resend OTP ────────────────────────────────────────────────────────────────
exports.resendOTP = asyncHandler(async (req, res) => {
  const { email, type } = req.body;
  if (!email || !['register','login'].includes(type)) { res.status(400); throw new Error('Valid email and type required'); }
  const normalEmail = email.toLowerCase().trim();
  const record = await OTP.findOne({ email: normalEmail, type });
  if (!record) { res.status(400); throw new Error('No pending OTP. Please start over.'); }
  const otp = generateOTP();
  record.otp = crypto.createHash('sha256').update(otp).digest('hex');
  record.attempts = 0;
  record.expiresAt = new Date(Date.now() + 10*60*1000);
  await record.save();
  const user = await User.findOne({ email: normalEmail });
  const name = user?.name?.split(' ')[0] || record.tempData?.name?.split(' ')[0] || '';
  await sendOTPEmail(normalEmail, otp, type, name);
  res.json({ success: true, message: `New OTP sent to ${normalEmail}` });
});
// ── Forgot Password — Step 1: Send OTP ───────────────────────────────────────

exports.forgotPasswordSendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const normalEmail = email.toLowerCase().trim();

  if (!/^\S+@\S+\.\S+$/.test(normalEmail)) {
    res.status(400);
    throw new Error('Invalid email address');
  }

  const user = await User.findOne({
    email: normalEmail
  });

  // Do not reveal whether an account exists.
  if (!user) {
    return res.json({
      success: true,
      message: 'If that email is registered, a password reset OTP has been sent.'
    });
  }

  if (!user.isActive) {
    return res.json({
      success: true,
      message: 'If that email is registered, a password reset OTP has been sent.'
    });
  }

  const otp = generateOTP();

  const hashedOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  // Remove any previous reset OTP.
  await OTP.deleteMany({
    email: normalEmail,
    type: 'forgot-password'
  });

  await OTP.create({
    email: normalEmail,
    otp: hashedOTP,
    type: 'forgot-password',
    attempts: 0,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    resetVerified: false,
    resetTokenHash: null,
    resetTokenExpire: null
  });

  try {
    await sendOTPEmail(
      normalEmail,
      otp,
      'reset',
      user.name?.split(' ')[0] || ''
    );
  } catch (error) {
    await OTP.deleteMany({
      email: normalEmail,
      type: 'forgot-password'
    });

    console.error('FORGOT PASSWORD EMAIL ERROR:', error);

    res.status(500);
    throw new Error('Unable to send reset OTP. Please try again later.');
  }

  res.json({
    success: true,
    message: 'If that email is registered, a password reset OTP has been sent.'
  });
});


// ── Forgot Password — Step 2: Verify OTP ─────────────────────────────────────

exports.forgotPasswordVerifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }

  const normalEmail = email.toLowerCase().trim();

  const record = await OTP.findOne({
    email: normalEmail,
    type: 'forgot-password'
  });

  if (!record) {
    res.status(400);
    throw new Error('OTP expired or not found. Request a new OTP.');
  }

  if (new Date() > record.expiresAt) {
    await OTP.deleteOne({ _id: record._id });

    res.status(400);
    throw new Error('OTP expired. Request a new OTP.');
  }

  if (record.attempts >= 5) {
    await OTP.deleteOne({ _id: record._id });

    res.status(400);
    throw new Error('Too many wrong attempts. Request a new OTP.');
  }

  const hashedInput = crypto
    .createHash('sha256')
    .update(otp.toString().trim())
    .digest('hex');

  record.attempts += 1;

  if (hashedInput !== record.otp) {
    await record.save();

    res.status(400);
    throw new Error(
      `Incorrect OTP. ${5 - record.attempts} attempt(s) remaining.`
    );
  }

  // OTP is correct.
  // Generate a short-lived authorization token for password reset.
  const resetToken = crypto.randomBytes(32).toString('hex');

  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  record.resetTokenHash = resetTokenHash;
  record.resetTokenExpire = new Date(Date.now() + 10 * 60 * 1000);
  record.resetVerified = true;
  record.expiresAt = record.resetTokenExpire;

  // Prevent the OTP from being used again.
  record.otp = crypto.randomBytes(32).toString('hex');

  await record.save();

  res.json({
    success: true,
    message: 'OTP verified. You can now create a new password.',
    resetToken
  });
});


// ── Forgot Password — Step 3: Reset Password ─────────────────────────────────

exports.forgotPasswordReset = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    confirmPassword,
    resetToken
  } = req.body;

  if (!email || !password || !confirmPassword || !resetToken) {
    res.status(400);
    throw new Error(
      'Email, password, confirm password and reset token are required'
    );
  }

  const normalEmail = email.toLowerCase().trim();

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const record = await OTP.findOne({
    email: normalEmail,
    type: 'forgot-password',
    resetTokenHash,
    resetVerified: true,
    resetTokenExpire: {
      $gt: new Date()
    }
  });

  if (!record) {
    res.status(400);
    throw new Error(
      'Password reset authorization is invalid or expired. Please start again.'
    );
  }

  const user = await User.findOne({
    email: normalEmail
  }).select('+password');

  if (!user) {
    // Should normally be impossible after successful OTP verification.
    await OTP.deleteOne({ _id: record._id });

    res.status(400);
    throw new Error('Unable to reset password. Please start again.');
  }

  if (!user.isActive) {
    await OTP.deleteOne({ _id: record._id });

    res.status(400);
    throw new Error('Account is deactivated. Contact support.');
  }

  // Hash the new password explicitly.
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Direct update prevents the User pre-save hook from hashing
  // the already-hashed password a second time.
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        password: hashedPassword
      }
    },
    {
      runValidators: false
    }
  );

  // Delete the reset authorization immediately.
  // This makes the reset token single-use.
  await OTP.deleteOne({
    _id: record._id
  });

  res.json({
    success: true,
    message: 'Password changed successfully. You can now login.'
  });
});