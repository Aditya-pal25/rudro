const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  _singleton: { type: String, default: 'global', unique: true },

  // WhatsApp Support
  whatsappEnabled: { type: Boolean, default: false },
  whatsappNumber:  { type: String, default: '' },
  whatsappMessage: { type: String, default: 'Hello Rudroham Support, I need help.' },

  // Global Return Policy
  returnEnabled:       { type: Boolean, default: true },
  returnWindowDays:    { type: Number, default: 7, min: 0 },
  returnPolicy:        { type: String, default: 'Items must be unused and in original packaging.' },

  // Global Exchange Policy
  exchangeEnabled:     { type: Boolean, default: true },
  exchangeWindowDays:  { type: Number, default: 7, min: 0 },
  exchangePolicy:      { type: String, default: 'Size/color exchanges subject to availability.' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
