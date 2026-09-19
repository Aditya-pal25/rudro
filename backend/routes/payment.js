const router = require('express').Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Order = require('../models/Order');

// Helper: check if real Razorpay keys are configured
const isRazorpayConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(
    keyId &&
    !keyId.includes('xxxx') &&
    keySecret &&
    !keySecret.includes('your_razorpay')
  );
};

// ── Step 1: Create Razorpay Order ─────────────────────────────────────────────
router.post('/razorpay/create', protect, asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || typeof amount !== 'number' || amount < 1 || amount > 500000) {
    res.status(400);
    throw new Error('Invalid payment amount');
  }

  // If real test or live keys are configured in .env:
  if (isRazorpayConfigured()) {
    const Razorpay = require('razorpay');
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await rzp.orders.create({
      amount: Math.round(amount * 100), // amount in paise
      currency: 'INR',
      receipt: `rdh_${Date.now()}`,
    });
    return res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  }

  // Dev simulation mode (when developer hasn't added test keys to .env yet)
  if (process.env.NODE_ENV !== 'production') {
    const mockOrder = {
      id: `order_mock_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rdh_mock_${Date.now()}`,
    };
    return res.json({
      success: true,
      isMock: true,
      order: mockOrder,
      key: 'rzp_test_mock_simulated',
    });
  }

  res.status(500);
  throw new Error('Razorpay keys are not configured in environment variables');
}));

// ── Step 2: Verify Payment & Confirm Order (Server-Side Atomic Update) ────────
router.post('/razorpay/verify', protect, asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!orderId || !razorpay_order_id || !razorpay_payment_id) {
    res.status(400);
    throw new Error('Missing required payment fields');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to confirm this order');
  }

  // ── Cryptographic Signature Verification ──
  if (isRazorpayConfigured()) {
    if (!razorpay_signature) {
      res.status(400);
      throw new Error('Payment signature is missing');
    }

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    // Timing-safe comparison prevents side-channel timing attacks
    const sigBuf = Buffer.from(razorpay_signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      res.status(400);
      throw new Error('Payment verification failed. Invalid signature.');
    }
  } else if (process.env.NODE_ENV !== 'production') {
    // Dev mock mode: allow testing without real keys
    console.log(`🧪 [DEV MOCK PAYMENT] Order ${orderId} verified successfully via simulated payment`);
  } else {
    res.status(500);
    throw new Error('Razorpay is not configured');
  }

  // ── Atomically Update Order Status in MongoDB ──
  order.payment.status = 'paid';
  order.payment.paidAt = new Date();
  order.payment.razorpayOrderId = razorpay_order_id;
  order.payment.razorpayPaymentId = razorpay_payment_id;
  order.payment.razorpaySignature = razorpay_signature || 'simulated_sig';
  order.status = 'confirmed';
  order.statusHistory.push({
    status: 'confirmed',
    note: `Payment verified via Razorpay (${razorpay_payment_id})`,
    updatedBy: req.user._id,
  });

  await order.save();

  res.json({
    success: true,
    message: 'Payment verified and order confirmed successfully',
    order,
  });
}));

// ── Step 3: Record Payment Failure / Cancel ──────────────────────────────────
router.post('/razorpay/failed', protect, asyncHandler(async (req, res) => {
  const { orderId, reason } = req.body;
  if (!orderId) {
    res.status(400);
    throw new Error('Order ID is required');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  order.payment.status = 'failed';
  order.statusHistory.push({
    status: order.status,
    note: `Payment failed: ${reason || 'Payment cancelled or dismissed by customer'}`,
    updatedBy: req.user._id,
  });

  await order.save();

  res.json({
    success: true,
    message: 'Order marked as payment failed',
    order,
  });
}));

module.exports = router;
