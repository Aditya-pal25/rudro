const asyncHandler = require('express-async-handler');
const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Settings = require('../models/Settings');

const getSettings = async () => {
  let s = await Settings.findOne({ _singleton: 'global' });
  if (!s) s = await Settings.create({ _singleton: 'global' });
  return s;
};

// ── Check if an order item is eligible ────────────────
const checkEligibility = async (order, itemIndex, type) => {
  const settings = await getSettings();
  const item = order.items[itemIndex];
  if (!item) return { eligible: false, reason: 'Item not found' };

  const policy = item.policy || {};

  if (type === 'RETURN') {
    if (!settings.returnEnabled)    return { eligible: false, reason: 'Returns are currently unavailable.' };
    if (!policy.returnable)         return { eligible: false, reason: 'This item is not eligible for return.' };
    const window = policy.returnWindow ?? settings.returnWindowDays;
    const daysSince = (Date.now() - new Date(order.createdAt)) / 86400000;
    if (daysSince > window)         return { eligible: false, reason: `The return period (${window} days) has expired.` };
  } else {
    if (!settings.exchangeEnabled)  return { eligible: false, reason: 'Exchanges are currently unavailable.' };
    if (!policy.exchangeable)       return { eligible: false, reason: 'This item is not eligible for exchange.' };
    const window = policy.exchangeWindow ?? settings.exchangeWindowDays;
    const daysSince = (Date.now() - new Date(order.createdAt)) / 86400000;
    if (daysSince > window)         return { eligible: false, reason: `The exchange period (${window} days) has expired.` };
  }

  if (order.status !== 'delivered') return { eligible: false, reason: 'Only delivered orders can be returned or exchanged.' };

  return { eligible: true };
};

// ── CUSTOMER: check eligibility ───────────────────────
exports.checkEligibility = asyncHandler(async (req, res) => {
  const { orderId, itemIndex, type } = req.query;
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) { res.status(404); throw new Error('Order not found'); }
  const result = await checkEligibility(order, Number(itemIndex), type);
  res.json({ success: true, ...result });
});

// ── CUSTOMER: create request ──────────────────────────
exports.createRequest = asyncHandler(async (req, res) => {
  const { orderId, itemIndex, type, reason, customerNote, images, requestedVariant } = req.body;
  if (!orderId || itemIndex === undefined || !type || !reason) {
    res.status(400); throw new Error('orderId, itemIndex, type, and reason are required');
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id }).populate('items.product');
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const idx = Number(itemIndex);
  const eligibility = await checkEligibility(order, idx, type);
  if (!eligibility.eligible) { res.status(400); throw new Error(eligibility.reason); }

  // Duplicate protection
  const existing = await ReturnRequest.findOne({
    order: orderId, orderItemIndex: idx,
    status: { $nin: ['COMPLETED','REJECTED','CANCELLED'] },
  });
  if (existing) { res.status(400); throw new Error('A request already exists for this item.'); }

  // Validate exchange variant
  if (type === 'EXCHANGE' && requestedVariant) {
    const prod = order.items[idx].product;
    if (prod) {
      const colorObj = prod.colors?.find(c => c.name === requestedVariant.color);
      if (!colorObj) { res.status(400); throw new Error('Requested color not available.'); }
      const sizeObj = colorObj.sizes?.find(s => s.size === requestedVariant.size);
      if (!sizeObj || sizeObj.stock < 1) { res.status(400); throw new Error('The requested variant is unavailable.'); }
    }
  }

  const item = order.items[idx];
  const request = await ReturnRequest.create({
    order: orderId,
    orderItemIndex: idx,
    user: req.user._id,
    type,
    reason,
    customerNote: customerNote || '',
    images: images || [],
    requestedVariant: requestedVariant || undefined,
    itemSnapshot: {
      productId:   item.product?._id || item.product,
      productName: item.name,
      image:       item.image,
      color:       item.color,
      size:        item.size,
      quantity:    item.quantity,
      price:       item.discountPrice || item.price,
    },
    statusHistory: [{ status: 'PENDING', note: 'Request submitted by customer' }],
  });

  res.status(201).json({ success: true, request });
});

// ── CUSTOMER: get my requests ─────────────────────────
exports.getMyRequests = asyncHandler(async (req, res) => {
  const requests = await ReturnRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, requests });
});

// ── CUSTOMER: cancel request ──────────────────────────
exports.cancelRequest = asyncHandler(async (req, res) => {
  const request = await ReturnRequest.findOne({ _id: req.params.id, user: req.user._id });
  if (!request) { res.status(404); throw new Error('Request not found'); }
  if (request.status !== 'PENDING') { res.status(400); throw new Error('Only pending requests can be cancelled.'); }
  request.status = 'CANCELLED';
  request.statusHistory.push({ status: 'CANCELLED', note: 'Cancelled by customer', updatedBy: req.user._id });
  await request.save();
  res.json({ success: true, request });
});

// ── ADMIN: get all requests ───────────────────────────
exports.adminGetAll = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type)   filter.type   = type;
  const skip = (Number(page) - 1) * Number(limit);
  const [requests, total] = await Promise.all([
    ReturnRequest.find(filter)
      .populate('user', 'name email phone')
      .populate('order', 'orderId createdAt pricing')
      .sort({ createdAt: -1 })
      .skip(skip).limit(Number(limit)),
    ReturnRequest.countDocuments(filter),
  ]);
  res.json({ success: true, requests, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// ── ADMIN: update status ──────────────────────────────
const VALID_TRANSITIONS = {
  PENDING:          ['APPROVED','REJECTED'],
  APPROVED:         ['PICKUP_SCHEDULED','CANCELLED'],
  PICKUP_SCHEDULED: ['PICKED_UP','CANCELLED'],
  PICKED_UP:        ['RECEIVED'],
  RECEIVED:         ['INSPECTED'],
  INSPECTED:        ['COMPLETED','REJECTED'],
};

exports.adminUpdateStatus = asyncHandler(async (req, res) => {
  const { status, adminNote, refundStatus, refundAmount } = req.body;
  const request = await ReturnRequest.findById(req.params.id);
  if (!request) { res.status(404); throw new Error('Request not found'); }

  const allowed = VALID_TRANSITIONS[request.status];
  if (!allowed || !allowed.includes(status)) {
    res.status(400); throw new Error(`Cannot transition from ${request.status} to ${status}`);
  }

  request.status = status;
  if (adminNote    !== undefined) request.adminNote    = adminNote;
  if (refundStatus !== undefined) request.refundStatus = refundStatus;
  if (refundAmount !== undefined) request.refundAmount = refundAmount;
  request.statusHistory.push({ status, note: adminNote || '', updatedBy: req.user._id });
  await request.save();
  res.json({ success: true, request });
});

// ── ADMIN: dashboard summary ──────────────────────────
exports.getDashboardSummary = asyncHandler(async (req, res) => {
  const [total, pending, returns, exchanges, recent] = await Promise.all([
    ReturnRequest.countDocuments(),
    ReturnRequest.countDocuments({ status: 'PENDING' }),
    ReturnRequest.countDocuments({ type: 'RETURN',   status: 'PENDING' }),
    ReturnRequest.countDocuments({ type: 'EXCHANGE', status: 'PENDING' }),
    ReturnRequest.find({ status: 'PENDING' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5),
  ]);
  res.json({ success: true, total, pending, returns, exchanges, recent });
});
