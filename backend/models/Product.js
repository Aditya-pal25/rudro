const mongoose = require('mongoose');
const slugify = require('slugify');

const sizeSchema = new mongoose.Schema({
  size:  { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
  stock: { type: Number, default: 0, min: 0 },
  sku:   String,
}, { _id: false });

const colorSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  hex:    { type: String, default: '#000000' },
  images: [{ url: String, publicId: String }],
  sizes:  [sizeSchema],
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: [100, 'Name cannot exceed 100 characters'] },
  slug: { type: String, unique: true, sparse: true },  // unique here is enough — no extra index below
  description:      { type: String, required: [true, 'Description is required'], maxlength: 2000 },
  shortDescription: { type: String, maxlength: 300 },
  price:            { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
  discountPrice:    { type: Number, min: 0 },
  discountPercent:  { type: Number, min: 0, max: 100, default: 0 },
  category: {
    type: String, required: true,
    enum: ['Oversized','Slim Fit','Graphic','Polo','Henley','Full Sleeve','Crop','Vintage','Drop Shoulder','Essential'],
  },
  gender:  { type: String, enum: ['Men','Women','Unisex'], default: 'Unisex' },
  fabric:  { type: String, enum: ['100% Cotton','Cotton Blend','Polyester','Organic Cotton','Linen Blend'], default: '100% Cotton' },
  fit:     { type: String, enum: ['Regular','Slim','Oversized','Relaxed'], default: 'Regular' },
  images:  [{ url: String, publicId: String, alt: String }],
  colors:  [colorSchema],
  totalStock:   { type: Number, default: 0, min: 0 },
  tags:         [String],
  isFeatured:   { type: Boolean, default: false },
  // ✅ FIX: 'isNew' is reserved by Mongoose — renamed to 'isNewArrival'
  isNewArrival: { type: Boolean, default: true },
  isBestSeller: { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  careInstructions: [String],
  ratings:    { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  totalSold:  { type: Number, default: 0 },
  weight:     { type: Number, default: 200 },
  metaTitle:       String,
  metaDescription: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  suppressReservedKeysWarning: true,
});

productSchema.virtual('reviews', {
  ref: 'Review', localField: '_id', foreignField: 'product',
});

productSchema.pre('save', function(next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = slugify(this.name || 'product', { lower: true, strict: true }) + '-' + Date.now();
  }
  if (this.price && this.discountPrice && this.discountPrice < this.price) {
    this.discountPercent = Math.round(((this.price - this.discountPrice) / this.price) * 100);
  } else {
    this.discountPercent = 0;
  }
  if (this.colors?.length > 0) {
    this.totalStock = this.colors.reduce((t, c) =>
      t + (c.sizes || []).reduce((s, sz) => s + (Number(sz.stock) || 0), 0), 0);
  }
  next();
});

// ✅ FIX: No duplicate slug index — it's already declared via unique:true above
productSchema.index({ name: 1, category: 1 });
productSchema.index({ price: 1, ratings: -1, createdAt: -1 });
// Compound indexes for high-traffic homepage & shop filters
productSchema.index({ isActive: 1, isFeatured: -1, createdAt: -1 });
productSchema.index({ isActive: 1, isNewArrival: -1, createdAt: -1 });
productSchema.index({ isActive: 1, isBestSeller: -1, totalSold: -1 });
productSchema.index({ isActive: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
