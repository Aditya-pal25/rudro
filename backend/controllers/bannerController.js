const asyncHandler = require('express-async-handler');
const Banner = require('../models/Banner');

// ── PUBLIC: get active banners ────────────────────────
exports.getActiveBanners = asyncHandler(async (req, res) => {
  const now = new Date();
  const banners = await Banner.find({
    isActive: true,
    $or: [{ startDate: null }, { startDate: { $lte: now } }],
    $or: [{ endDate:   null }, { endDate:   { $gte: now } }],
  }).sort({ priority: -1 });
  res.json({ success: true, banners });
});

// ── ADMIN: get all banners ────────────────────────────
exports.getAllBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ priority: -1, createdAt: -1 });
  res.json({ success: true, banners });
});

// ── ADMIN: create banner ──────────────────────────────
exports.createBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);
  res.status(201).json({ success: true, banner });
});

// ── ADMIN: update banner ──────────────────────────────
exports.updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!banner) { res.status(404); throw new Error('Banner not found'); }
  res.json({ success: true, banner });
});

// ── ADMIN: delete banner ──────────────────────────────
exports.deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) { res.status(404); throw new Error('Banner not found'); }
  res.json({ success: true, message: 'Banner deleted' });
});

// ── ADMIN: toggle active ──────────────────────────────
exports.toggleBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) { res.status(404); throw new Error('Banner not found'); }
  banner.isActive = !banner.isActive;
  await banner.save();
  res.json({ success: true, banner });
});
