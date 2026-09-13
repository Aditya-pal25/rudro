const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true, maxlength: 100 },
  subtitle:     { type: String, trim: true, maxlength: 200 },
  description:  { type: String, trim: true, maxlength: 500 },
  image:        { url: String, publicId: String },
  desktopImage: { url: String, publicId: String },
  mobileImage:  { url: String, publicId: String },
  buttonText:   { type: String, default: 'Shop Now', maxlength: 50 },
  link:         { type: String, default: '/shop', maxlength: 500 },
  type: {
    type: String,
    enum: ['PROMOTION','ANNOUNCEMENT','NEW_COLLECTION','FESTIVAL','FREE_SHIPPING','CUSTOM'],
    default: 'PROMOTION',
  },
  isActive:  { type: Boolean, default: true },
  startDate: { type: Date },
  endDate:   { type: Date },
  priority:  { type: Number, default: 0 },
}, { timestamps: true });

// Index for active banner queries
bannerSchema.index({ isActive: 1, priority: -1 });

// Virtual: is the banner currently live?
bannerSchema.virtual('isLive').get(function() {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate   && now > this.endDate)   return false;
  return true;
});

bannerSchema.set('toJSON', { virtuals: true });
bannerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Banner', bannerSchema);
