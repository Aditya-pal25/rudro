const router = require('express').Router();
const { protect, admin } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
router.get('/product/:productId', asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1; const limit = 10;
  const reviews = await Review.find({ product: req.params.productId, isApproved: true })
    .populate('user', 'name avatar').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit);
  res.json({ success: true, reviews });
}));
router.post('/', protect, asyncHandler(async (req, res) => {
  const exists = await Review.findOne({ product: req.body.product, user: req.user._id });
  if (exists) { res.status(400); throw new Error('Already reviewed'); }
  const review = await Review.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, review });
}));
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Review deleted' });
}));
module.exports = router;
