const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');

// ─── Create Order ─────────────────────────────────────────────────────────────
exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, payment, couponCode } = req.body;

  if (!items || items.length === 0) {
    res.status(400); throw new Error('No items in order');
  }
  if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.addressLine1) {
    res.status(400); throw new Error('Shipping address is incomplete');
  }

  // ── Validate items & calculate subtotal ──────────────────────────────────
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      res.status(404); throw new Error(`Product not found: ${item.product}`);
    }

    const color = product.colors.find(c => c.name === item.color);
    if (!color) {
      res.status(400); throw new Error(`Color "${item.color}" not available for ${product.name}`);
    }

    const sizeObj = color.sizes.find(s => s.size === item.size);
    if (!sizeObj) {
      res.status(400); throw new Error(`Size "${item.size}" not available`);
    }
    if (sizeObj.stock < item.quantity) {
      res.status(400); throw new Error(`Insufficient stock for ${product.name} (${item.color} / ${item.size}). Available: ${sizeObj.stock}`);
    }

    const itemPrice = product.discountPrice || product.price;
    subtotal += itemPrice * item.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || '',
      color: item.color,
      size: item.size,
      price: product.price,
      discountPrice: product.discountPrice || product.price,
      quantity: item.quantity,
    });
  }

  // ── Apply coupon ──────────────────────────────────────────────────────────
  let couponDiscount = 0;
  let couponDoc = null;

  if (couponCode) {
    couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (couponDoc) {
      const validity = couponDoc.isValid(subtotal, req.user._id);
      if (!validity.valid) { res.status(400); throw new Error(validity.message); }
      couponDiscount = couponDoc.calculateDiscount(subtotal);
    }
  }

  // ── Calculate totals ──────────────────────────────────────────────────────
  const shippingCharge = subtotal >= 599 ? 0 : 79;
  const taxableAmount = subtotal - couponDiscount;
  const tax = Math.round(taxableAmount * 0.18);
  const total = taxableAmount + shippingCharge + tax;

  // ── Create order ──────────────────────────────────────────────────────────
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    pricing: { subtotal, discount: 0, couponDiscount, shippingCharge, tax, total },
    coupon: couponDoc?._id,
    couponCode: couponDoc ? couponCode.toUpperCase() : undefined,
    payment: {
      method: payment.method,
      status: payment.method === 'cod' ? 'pending' : 'pending',
    },
    statusHistory: [{
      status: 'placed',
      note: 'Order placed successfully',
      updatedBy: req.user._id,
    }],
  });

  // ── Deduct stock ──────────────────────────────────────────────────────────
  for (const item of items) {
    await Product.findOneAndUpdate(
      { _id: item.product, 'colors.name': item.color, 'colors.sizes.size': item.size },
      {
        $inc: {
          'colors.$[c].sizes.$[s].stock': -item.quantity,
          totalSold: item.quantity,
        },
      },
      {
        arrayFilters: [{ 'c.name': item.color }, { 's.size': item.size }],
        new: true,
      }
    ).then(async (p) => {
      if (p) {
        // Recalculate totalStock
        p.totalStock = p.colors.reduce((t, c) => t + c.sizes.reduce((s, sz) => s + sz.stock, 0), 0);
        await p.save();
      }
    }).catch(err => console.error('Stock deduction error:', err));
  }

  // ── Update coupon usage ───────────────────────────────────────────────────
  if (couponDoc) {
    couponDoc.usedCount += 1;
    couponDoc.usedBy.push(req.user._id);
    await couponDoc.save();
  }

  // ── Update user stats ─────────────────────────────────────────────────────
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalOrders: 1, totalSpent: total },
  });

  const populated = await Order.findById(order._id)
    .populate('items.product', 'name images slug');

  res.status(201).json({ success: true, order: populated });
});

// ─── My Orders ────────────────────────────────────────────────────────────────
exports.getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(20, Number(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'name images'),
    Order.countDocuments({ user: req.user._id }),
  ]);

  res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
});

// ─── Get Single Order ─────────────────────────────────────────────────────────
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('items.product', 'name images slug')
    .populate('user', 'name email');

  if (!order) { res.status(404); throw new Error('Order not found'); }

  // Only allow owner or admin
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized to view this order');
  }

  res.json({ success: true, order });
});

// ─── Cancel Order ─────────────────────────────────────────────────────────────
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.user.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }

  const cancellableStatuses = ['placed', 'confirmed', 'processing'];
  if (!cancellableStatuses.includes(order.status)) {
    res.status(400); throw new Error('Order cannot be cancelled at this stage');
  }

  order.status = 'cancelled';
  order.cancellationReason = req.body.reason || 'Cancelled by customer';
  order.statusHistory.push({ status: 'cancelled', note: req.body.reason, updatedBy: req.user._id });
  await order.save();

  // Restore stock
  for (const item of order.items) {
    await Product.findOneAndUpdate(
      { _id: item.product, 'colors.name': item.color, 'colors.sizes.size': item.size },
      { $inc: { 'colors.$[c].sizes.$[s].stock': item.quantity, totalSold: -item.quantity } },
      { arrayFilters: [{ 'c.name': item.color }, { 's.size': item.size }] }
    ).catch(err => console.error('Stock restore error:', err));
  }

  res.json({ success: true, order });
});

// ─── Return Request ───────────────────────────────────────────────────────────
exports.requestReturn = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.user.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
  if (order.status !== 'delivered') { res.status(400); throw new Error('Only delivered orders can be returned'); }

  const daysSince = (Date.now() - new Date(order.deliveredAt)) / (1000 * 60 * 60 * 24);
  if (daysSince > 7) { res.status(400); throw new Error('Return window of 7 days has passed'); }

  order.status = 'return_requested';
  order.returnReason = req.body.reason;
  order.statusHistory.push({ status: 'return_requested', note: req.body.reason, updatedBy: req.user._id });
  await order.save();
  res.json({ success: true, order });
});

// ─── ADMIN: Get All Orders ────────────────────────────────────────────────────
exports.getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.payment) filter['payment.status'] = req.query.payment;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images'),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
});

// ─── ADMIN: Update Order Status ───────────────────────────────────────────────
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber, carrier, estimatedDelivery } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  order.status = status;
  order.statusHistory.push({
    status,
    note: note || `Status updated to ${status}`,
    updatedBy: req.user._id,
  });

  if (trackingNumber) {
    order.tracking = { carrier, trackingNumber, estimatedDelivery };
  }
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    order.payment.status = order.payment.method === 'cod' ? 'paid' : order.payment.status;
  }
  if (status === 'confirmed' && order.payment.method !== 'cod') {
    order.payment.status = 'paid';
    order.payment.paidAt = new Date();
  }

  await order.save();
  res.json({ success: true, order });
});

// ─── ADMIN: Order Stats ───────────────────────────────────────────────────────
exports.getOrderStats = asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [totalRevenue, todayOrders, monthOrders, statusStats] = await Promise.all([
    Order.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ createdAt: { $gte: thisMonth } }),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.json({
    success: true,
    stats: {
      totalRevenue: totalRevenue[0]?.total || 0,
      todayOrders,
      monthOrders,
      statusStats,
    },
  });
});
