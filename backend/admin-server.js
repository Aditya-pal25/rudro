/**
 * RUDROHAM ADMIN SERVER
 * ──────────────────────────────────────────────────────
 * Runs on port 5001, bound to 127.0.0.1 ONLY.
 * NEVER expose this port to the internet.
 *
 * In production, access ONLY via:
 *   - SSH tunnel: ssh -L 5001:localhost:5001 user@your-server.com
 *   - Nginx with IP whitelist on admin.rudroham.com
 *   - VPN
 *
 * The public server (port 5000) has ZERO admin routes.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const compression = require('compression');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { protect, admin } = require('./middleware/auth');

connectDB();

const app = express();
app.set('trust proxy', 1);
app.use(helmet());

// ── IP whitelist — blocks unknown IPs in production ───────────────────────────
app.use((req, res, next) => {
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS
    ? process.env.ADMIN_ALLOWED_IPS.split(',').map(ip => ip.trim()).filter(Boolean)
    : [];
  if (process.env.NODE_ENV === 'production' && allowedIPs.length > 0) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    if (!allowedIPs.includes(ip)) {
      console.warn(`🚨 Admin blocked — IP: ${ip}`);
      return res.status(404).json({ message: 'Not found' });
    }
  }
  next();
});

// ── CORS — admin frontend only ────────────────────────────────────────────────
const adminOrigins = (process.env.ADMIN_CLIENT_URLS || 'http://localhost:5174')
  .split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || adminOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Admin CORS blocked'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(hpp());
app.use(compression());
app.use(morgan('dev'));

// ── Rate limiters ─────────────────────────────────────────────────────────────
app.use('/admin-api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true }));
app.use('/admin-api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { success: false, message: 'Too many admin login attempts.' } }));

// ── Auth routes (OTP login — no protect needed here yet) ─────────────────────
// app.use('/admin-api/auth', require('./routes/auth'));

app.use('/admin-api/auth', require('./routes/adminAuth'));

// ── All admin routes require JWT + admin role ─────────────────────────────────
app.use('/admin-api/admin',    protect, admin, require('./routes/admin'));
app.use('/admin-api/products', protect, admin, require('./routes/products'));
app.use('/admin-api/orders',   protect, admin, require('./routes/orders'));
app.use('/admin-api/upload',   protect, admin, require('./routes/upload'));
app.use('/admin-api/coupons',  protect, admin, require('./routes/coupons'));
app.use('/admin-api/reviews',  protect, admin, require('./routes/reviews'));
app.use('/admin-api/users',    protect, admin, require('./routes/users'));

app.get('/admin-api/health', protect, admin, (req, res) => {
  res.json({ status: 'OK', service: 'Rudroham Admin API', ts: new Date().toISOString() });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Not found' }));
app.use(errorHandler);

const ADMIN_PORT = process.env.ADMIN_PORT || 5001;
// 🔒 127.0.0.1 = localhost only, never reachable from internet
const server = app.listen(ADMIN_PORT, '127.0.0.1', () => {
  console.log(`\n🔐 Rudroham Admin API → http://127.0.0.1:${ADMIN_PORT} [LOCALHOST ONLY]`);
});
process.on('unhandledRejection', err => { console.error(`Admin: ${err.message}`); server.close(() => process.exit(1)); });
process.on('uncaughtException',  err => { console.error(`Admin: ${err.message}`); process.exit(1); });
