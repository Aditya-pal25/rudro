const router = require('express').Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
router.get('/wishlist', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist', 'name images price discountPrice ratings slug');
  res.json({ success: true, wishlist: user.wishlist });
}));
module.exports = router;
