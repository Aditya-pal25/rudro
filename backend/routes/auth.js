const router = require('express').Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

// ── OTP Auth routes ───────────────────────────────────────────────────────────
router.post('/register/send-otp',   ctrl.registerSendOTP);
router.post('/register/verify-otp', ctrl.registerVerifyOTP);
router.post('/login/send-otp',      ctrl.loginSendOTP);
router.post('/login/verify-otp',    ctrl.loginVerifyOTP);
router.post('/resend-otp',          ctrl.resendOTP);

// ── Forgot Password OTP routes ───────────────────────────────────────────────

router.post('/forgot-password/send-otp', ctrl.forgotPasswordSendOTP);

router.post('/forgot-password/verify-otp', ctrl.forgotPasswordVerifyOTP);

router.post('/forgot-password/reset', ctrl.forgotPasswordReset);

// ── Legacy direct login (kept for admin seeder compatibility) ─────────────────
router.post('/login',    ctrl.login);
router.post('/register', ctrl.register);

// ── Protected profile routes ──────────────────────────────────────────────────
router.get('/me',                    protect, ctrl.getMe);
router.put('/profile',               protect, ctrl.updateProfile);
router.put('/password',              protect, ctrl.changePassword);
router.post('/forgot-password',      ctrl.forgotPassword);
router.put('/reset-password/:token', ctrl.resetPassword);
router.post('/address',              protect, ctrl.addAddress);
router.put('/address/:addressId',    protect, ctrl.updateAddress);
router.delete('/address/:addressId', protect, ctrl.deleteAddress);
router.put('/wishlist/:productId',   protect, ctrl.toggleWishlist);

module.exports = router;
