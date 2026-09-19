const asyncHandler = require('express-async-handler');

// ✅ Escape regex special chars to prevent ReDoS attacks
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const mongoose = require('mongoose');
const Product = require('../models/Product');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const buildQuery = (query) => {
  const q = { isActive: true };
  if (query.keyword) {
    // Use regex for flexible search (works without text index)
    q.$or = [
      { name: { $regex: escapeRegex(query.keyword), $options: 'i' } },
      { description: { $regex: escapeRegex(query.keyword), $options: 'i' } },
      { tags: { $regex: escapeRegex(query.keyword), $options: 'i' } },
    ];
  }
  if (query.category) q.category = { $in: query.category.split(',') };
  if (query.gender) q.gender = query.gender;
  if (query.minPrice || query.maxPrice) {
    q.price = {};
    if (query.minPrice) q.price.$gte = Number(query.minPrice);
    if (query.maxPrice) q.price.$lte = Number(query.maxPrice);
  }
  if (query.ratings) q.ratings = { $gte: Number(query.ratings) };
  if (query.isFeatured === 'true') q.isFeatured = true;
  if (query.isNew === 'true') q.isNewArrival = true;
  if (query.isBestSeller === 'true') q.isBestSeller = true;
  if (query.fabric) q.fabric = query.fabric;
  if (query.fit) q.fit = query.fit;
  if (query.size) q['colors.sizes.size'] = query.size;
  return q;
};

// Safely find product by either ObjectId OR slug
const findProductByIdOrSlug = (idOrSlug) => {
  if (mongoose.isValidObjectId(idOrSlug)) {
    // Could be ObjectId — search both _id and slug
    return Product.findOne({
      $or: [{ _id: idOrSlug }, { slug: idOrSlug }],
    });
  }
  // Not an ObjectId — must be a slug
  return Product.findOne({ slug: idOrSlug });
};

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────
exports.getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 12);
  const skip = (page - 1) * limit;

  const sortMap = {
    'price-asc':  { price: 1 },
    'price-desc': { price: -1 },
    'newest':     { createdAt: -1 },
    'popular':    { totalSold: -1 },
    'rating':     { ratings: -1 },
    'featured':   { isFeatured: -1, createdAt: -1 },
  };
  const sort = sortMap[req.query.sort] || sortMap['featured'];
  const filter = buildQuery(req.query);

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, products, total, page, pages: Math.ceil(total / limit), limit });
});

// ✅ FIX: Handle slug vs ObjectId safely
exports.getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let query;
  if (mongoose.isValidObjectId(id)) {
    query = { $or: [{ _id: id }, { slug: id }] };
  } else {
    query = { slug: id };
  }

  const product = await Product.findOne({ ...query, isActive: true })
    .populate({
      path: 'reviews',
      populate: { path: 'user', select: 'name avatar' },
      options: { limit: 10, sort: { createdAt: -1 } },
    });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

exports.getFeatured = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .sort({ createdAt: -1 }).limit(8);
  res.json({ success: true, products });
});

exports.getBestSellers = asyncHandler(async (req, res) => {
  const products = await Product.find({ isBestSeller: true, isActive: true })
    .sort({ totalSold: -1 }).limit(8);
  res.json({ success: true, products });
});

exports.getNewArrivals = asyncHandler(async (req, res) => {
  // Query active products flagged as new arrival
  const products = await Product.find({ isNewArrival: true, isActive: true })
    .sort({ createdAt: -1 }).limit(8);
  res.json({ success: true, products });
});

exports.getRelated = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let product;
  if (mongoose.isValidObjectId(id)) {
    product = await Product.findById(id);
  } else {
    product = await Product.findOne({ slug: id });
  }
  if (!product) return res.json({ success: true, products: [] });

  const products = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  }).limit(6);

  res.json({ success: true, products });
});

exports.searchProducts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json({ success: true, products: [] });

  const products = await Product.find({
    isActive: true,
    $or: [
      { name: { $regex: escapeRegex(q), $options: 'i' } },
      { tags: { $regex: escapeRegex(q), $options: 'i' } },
      { category: { $regex: escapeRegex(q), $options: 'i' } },
    ],
  }).limit(10).select('name price discountPrice images slug _id category');

  res.json({ success: true, products });
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
exports.getAllProductsAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 15);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.keyword) {
    filter.$or = [
      { name: { $regex: req.query.keyword, $options: 'i' } },
      { category: { $regex: req.query.keyword, $options: 'i' } },
    ];
  }
  if (req.query.category) filter.category = req.query.category;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, products, total, page, pages: Math.ceil(total / limit) });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

// ✅ FIX: findByIdAndUpdate skips pre-save hooks → manually recalculate totalStock & slug
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  // Merge updates onto the document so pre-save hooks run correctly
  Object.assign(product, req.body);

  // Manually recalculate totalStock since we're mutating
  if (req.body.colors) {
    product.totalStock = req.body.colors.reduce((total, color) =>
      total + (color.sizes || []).reduce((s, size) => s + (Number(size.stock) || 0), 0), 0);
  }

  // Recalculate discount percent
  if (product.price && product.discountPrice) {
    product.discountPercent = Math.round(((product.price - product.discountPrice) / product.price) * 100);
  } else {
    product.discountPercent = 0;
  }

  await product.save();
  res.json({ success: true, product });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Product removed' });
});

exports.updateStock = asyncHandler(async (req, res) => {
  const { colorName, size, stock } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const color = product.colors.find(c => c.name === colorName);
  if (color) {
    const sizeObj = color.sizes.find(s => s.size === size);
    if (sizeObj) sizeObj.stock = Number(stock);
  }

  // Recalculate totalStock
  product.totalStock = product.colors.reduce((total, c) =>
    total + c.sizes.reduce((s, sz) => s + (Number(sz.stock) || 0), 0), 0);

  await product.save();
  res.json({ success: true, product });
});
