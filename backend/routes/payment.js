const router = require('express').Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');

router.post('/razorpay/create', protect, asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || typeof amount !== 'number' || amount < 1 || amount > 500000) {
    res.status(400); throw new Error('Invalid payment amount');
  }
  const Razorpay = require('razorpay');
  const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  const order = await rzp.orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt: `rdh_${Date.now()}` });
  res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
}));

router.post('/razorpay/verify', protect, asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400); throw new Error('Missing payment fields');
  }
  const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');
  // ✅ Timing-safe comparison (prevents timing attacks)
  const sigBuf = Buffer.from(razorpay_signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    res.status(400); throw new Error('Payment verification failed');
  }
  res.json({ success: true, message: 'Payment verified' });
}));

module.exports = router;
