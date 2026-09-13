# 🔥 RUDROHAM — Premium T-Shirt E-Commerce

Production-ready MERN stack with separated admin server, OTP 2FA, and enterprise security.

---

## 🏗️ Architecture

```
rudroham-final/
├── backend/          → Public API (port 5000)
│   └── admin-server.js  → Admin API (port 5001, 127.0.0.1 only)
├── frontend/         → Customer store (port 5173)
└── admin/            → Admin panel (port 5174)
```

## ⚡ Setup

### 1. Configure .env
```bash
cd backend
# .env is already created — fill in your values:
# - MONGO_URI (local MongoDB)
# - JWT_SECRET (generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# - EMAIL_USER + EMAIL_PASS (Gmail App Password)
# - RAZORPAY keys
```

### 2. Install & Seed
```powershell
cd backend
npm install
npm run seed
```

### 3. Start All 4 Servers (4 terminals)

```powershell
# Terminal 1 — Public API
cd backend && npm run dev

# Terminal 2 — Admin API (separate, localhost only)
cd backend && npm run dev:admin

# Terminal 3 — Customer Store
cd frontend && npm install && npm run dev

# Terminal 4 — Admin Panel
cd admin && npm install && npm run dev
```

## 🔗 URLs

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Customer Store |
| http://localhost:5174/login | Admin Panel |
| http://localhost:5000/api/health | Public API health |

## 🔐 Admin Login
- Email: `admin@rudroham.com`
- Password: `Admin@123`
- **Change both before going live!**

## 🎟️ Coupons
| Code | Discount |
|------|----------|
| WELCOME20 | 20% off (min ₹500) |
| RUDROHAM100 | ₹100 off (min ₹799) |
| SAVE15 | 15% off (min ₹1499) |

## 🛡️ Security Features
- Admin on separate port 5001, bound to 127.0.0.1 only
- OTP 2FA for all logins (SHA-256 hashed, 10-min expiry)
- NoSQL injection protection (express-mongo-sanitize)
- HTTP Parameter Pollution protection (hpp)
- ReDoS-safe regex in search
- Timing-safe payment signature verification
- Rate limiting: 10 logins / 5 OTPs per 15 min
- No admin routes on public server
- Production errors never leak stack traces

## 🚀 Before Going Live
```
☐ Change ADMIN_EMAIL + ADMIN_PASSWORD in .env → run npm run seed
☐ Set JWT_SECRET to 64 random chars
☐ Switch Razorpay test → live keys
☐ Set NODE_ENV=production
☐ Block port 5001 on firewall (ufw deny 5001)
☐ Use HTTPS with SSL certificate
☐ Set ADMIN_ALLOWED_IPS to your IP
```
