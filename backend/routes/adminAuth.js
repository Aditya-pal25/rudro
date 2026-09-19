const router = require('express').Router();
const ctrl = require('../controllers/adminAuthController');
const { protect, admin } = require('../middleware/auth');

// Admin 2FA OTP routes
router.post('/login/send-otp', ctrl.sendOTP);
router.post('/login/verify-otp', ctrl.verifyOTP);
router.post('/resend-otp', ctrl.resendOTP);

// Direct login fallback & session check (protected)
router.post('/login', ctrl.login);
router.get('/me', protect, admin, ctrl.me);

module.exports = router;