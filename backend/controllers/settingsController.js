const asyncHandler = require('express-async-handler');
const Settings = require('../models/Settings');

// Get or create singleton settings
const getOrCreate = async () => {
  let s = await Settings.findOne({ _singleton: 'global' });
  if (!s) s = await Settings.create({ _singleton: 'global' });
  return s;
};

// ── PUBLIC: get public settings (whatsapp + policies) ─
exports.getPublicSettings = asyncHandler(async (req, res) => {
  const s = await getOrCreate();
  res.json({
    success: true,
    settings: {
      whatsappEnabled: s.whatsappEnabled,
      whatsappNumber:  s.whatsappNumber,
      whatsappMessage: s.whatsappMessage,
      returnEnabled:   s.returnEnabled,
      returnWindowDays: s.returnWindowDays,
      returnPolicy:    s.returnPolicy,
      exchangeEnabled:    s.exchangeEnabled,
      exchangeWindowDays: s.exchangeWindowDays,
      exchangePolicy:     s.exchangePolicy,
    },
  });
});

// ── ADMIN: get all settings ───────────────────────────
exports.getSettings = asyncHandler(async (req, res) => {
  const s = await getOrCreate();
  res.json({ success: true, settings: s });
});

// ── ADMIN: update settings ────────────────────────────
exports.updateSettings = asyncHandler(async (req, res) => {
  const allowed = [
    'whatsappEnabled','whatsappNumber','whatsappMessage',
    'returnEnabled','returnWindowDays','returnPolicy',
    'exchangeEnabled','exchangeWindowDays','exchangePolicy',
  ];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  const s = await Settings.findOneAndUpdate(
    { _singleton: 'global' },
    updates,
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, settings: s });
});
