require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const compression = require('compression');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

connectDB();

const app = express();
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' }, xXssProtection: true }));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  ...(process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173').split(','),
  ...(process.env.ADMIN_CLIENT_URLS || 'http://localhost:5174').split(','),
].map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

// ── Body limits (2mb max — not 10mb) ─────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── NoSQL injection protection ────────────────────────────────────────────────
app.use(mongoSanitize({ replaceWith: '_' }));

// ── HTTP Parameter Pollution protection ──────────────────────────────────────
app.use(hpp());

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
else app.use(morgan('combined'));

// ── Health checks (Placed before rate limiters so keep-alive pings never 429) ─
app.get('/', (req, res) => res.status(200).send('Rudroham API Live'));
app.get('/health', (req, res) => res.status(200).json({ status: 'OK', service: 'Rudroham API', ts: new Date().toISOString() }));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'OK', service: 'Rudroham Public API', ts: new Date().toISOString() }));

// ── Rate limiters ─────────────────────────────────────────────────────────────
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 150, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests. Please try again later.' } }));
app.use('/api/auth/login',      rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: 'Too many login attempts.' } }));
app.use('/api/auth/register',   rateLimit({ windowMs: 15 * 60 * 1000, max: 5,  message: { success: false, message: 'Too many registration attempts.' } }));
app.use('/api/auth/forgot',     rateLimit({ windowMs: 60 * 60 * 1000, max: 5,  message: { success: false, message: 'Too many password reset requests.' } }));

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), { maxAge: '7d', etag: true }));

// ── PUBLIC routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/reviews',  require('./routes/reviews'));
app.use('/api/coupons',  require('./routes/coupons'));
app.use('/api/payment',  require('./routes/payment'));
app.use('/api/upload',   require('./routes/upload'));

// ── ADMIN routes (Secured by JWT + admin role for single-instance hosting) ─────
const { protect, admin } = require('./middleware/auth');
app.use('/admin-api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true }));
app.use('/admin-api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { success: false, message: 'Too many admin login attempts.' } }));
app.use('/admin-api/auth', require('./routes/adminAuth'));
app.use('/admin-api/admin',    protect, admin, require('./routes/admin'));
app.use('/admin-api/products', protect, admin, require('./routes/products'));
app.use('/admin-api/orders',   protect, admin, require('./routes/orders'));
app.use('/admin-api/upload',   protect, admin, require('./routes/upload'));
app.use('/admin-api/coupons',  protect, admin, require('./routes/coupons'));
app.use('/admin-api/reviews',  protect, admin, require('./routes/reviews'));
app.use('/admin-api/users',    protect, admin, require('./routes/users'));
app.get('/admin-api/health', protect, admin, (req, res) => res.json({ status: 'OK', service: 'Rudroham Admin API', ts: new Date().toISOString() }));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🌐 Rudroham Public API → http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
process.on('unhandledRejection', err => { console.error(`Unhandled: ${err.message}`); server.close(() => process.exit(1)); });
process.on('uncaughtException',  err => { console.error(`Uncaught: ${err.message}`);  process.exit(1); });
