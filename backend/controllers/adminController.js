const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalRevenue, monthRevenue, lastMonthRevenue,
    totalOrders, todayOrders, monthOrders,
    totalUsers, newUsers,
    totalProducts, lowStockProducts,
    recentOrders, topProducts,
    revenueChart, orderChart
  ] = await Promise.all([
    Order.aggregate([{ $match: { 'payment.status': 'paid' } }, { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { 'payment.status': 'paid', createdAt: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
    Order.aggregate([{ $match: { 'payment.status': 'paid', createdAt: { $gte: lastMonth, $lte: lastMonthEnd } } }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ createdAt: { $gte: thisMonth } }),
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', createdAt: { $gte: thisMonth } }),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ totalStock: { $lt: 10 }, isActive: true }),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email').populate('items.product', 'name'),
    Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.discountPrice', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { name: '$product.name', image: { $arrayElemAt: ['$product.images.url', 0] }, totalSold: 1, revenue: 1 } },
    ]),
    // Revenue last 12 months
    Order.aggregate([
      { $match: { 'payment.status': 'paid', createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    // Orders last 7 days
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const mRev = monthRevenue[0]?.total || 0;
  const lRev = lastMonthRevenue[0]?.total || 0;
  const growth = lRev > 0 ? (((mRev - lRev) / lRev) * 100).toFixed(1) : 100;

  res.json({
    success: true,
    stats: {
      revenue: { total: totalRevenue[0]?.total || 0, month: mRev, growth: Number(growth) },
      orders: { total: totalOrders, today: todayOrders, month: monthOrders },
      users: { total: totalUsers, new: newUsers },
      products: { total: totalProducts, lowStock: lowStockProducts },
    },
    recentOrders,
    topProducts,
    revenueChart,
    orderChart,
  });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.keyword) filter.$or = [
    { name: { $regex: req.query.keyword, $options: 'i' } },
    { email: { $regex: req.query.keyword, $options: 'i' } },
  ];
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
});

exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role === 'admin') { res.status(400); throw new Error('Cannot deactivate admin'); }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, user });
});

exports.changeUserRole = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, user });
});

exports.getAnalytics = asyncHandler(async (req, res) => {
  const categoryStats = await Order.aggregate([
    { $unwind: '$items' },
    { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $group: { _id: '$product.category', count: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.discountPrice', '$items.quantity'] } } } },
    { $sort: { revenue: -1 } },
  ]);
  const sizeStats = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.size', count: { $sum: '$items.quantity' } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, categoryStats, sizeStats });
});
