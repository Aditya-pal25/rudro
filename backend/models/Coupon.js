const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: String,
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  applicableCategories: [String],
}, { timestamps: true });

couponSchema.methods.isValid = function(orderAmount, userId) {
  if (!this.isActive) return { valid: false, message: 'Coupon is not active' };
  if (new Date() > this.endDate) return { valid: false, message: 'Coupon has expired' };
  if (new Date() < this.startDate) return { valid: false, message: 'Coupon is not yet valid' };
  if (orderAmount < this.minOrderAmount) return { valid: false, message: `Minimum order amount is ₹${this.minOrderAmount}` };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  const userUsed = this.usedBy.filter(u => u.toString() === userId.toString()).length;
  if (userUsed >= this.perUserLimit) return { valid: false, message: 'You have already used this coupon' };
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function(amount) {
  let discount = this.type === 'percentage' ? (amount * this.value) / 100 : this.value;
  if (this.maxDiscount) discount = Math.min(discount, this.maxDiscount);
  return Math.round(discount);
};

module.exports = mongoose.model('Coupon', couponSchema);
