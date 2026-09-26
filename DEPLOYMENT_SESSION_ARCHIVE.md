# Rudroham Production Deployment & Session Archive

**Date**: September 22, 2026  
**Project**: Rudroham E-Commerce (Frontend, Admin, Backend)  
**Production Domains**:  
- **Storefront**: [https://rudroham.in](https://rudroham.in)  
- **Backend API**: [https://rodroham.onrender.com](https://rodroham.onrender.com)  
- **Database**: MongoDB Atlas M0 Cluster (`rudroham` database)

---

## 1. Executive Summary & Timeline

This document archives the entire end-to-end production deployment session for Rudroham, detailing every obstacle encountered, its root cause, and the exact resolution implemented.

```mermaid
flowchart LR
    subgraph ClientLayer ["Client Layer"]
        A["Storefront (rudroham.in - Vercel)"]
        B["Admin Panel (Vercel / Subdomain)"]
    end
    subgraph ComputeLayer ["Compute Layer"]
        C["Backend API (rodroham.onrender.com - Render)"]
    end
    subgraph DataLayer ["Data & Storage"]
        D[("MongoDB Atlas M0")]
        E["Cloudinary (Media CDN)"]
    end

    A -->|/api/*| C
    B -->|/admin-api/*| C
    C --> D
    C --> E
```

---

## 2. Project Architecture & Components Analyzed

### Backend ([`backend/server.js`](file:///d:/rudroham-final/backend/server.js))
- **Tech**: Node.js, Express 4, Mongoose 8.
- **Unified Architecture**: Serves both public customer endpoints (`/api/*`) and protected management endpoints (`/admin-api/*`) with rate limiting and JWT auth.
- **Reverse Proxy**: Configured with `app.set('trust proxy', 1)` for Render.
- **Health Check**: Available at `/health` and `/api/health`.

### Frontend ([`frontend/`](file:///d:/rudroham-final/frontend))
- **Tech**: React 18, Vite 5, TailwindCSS, Zustand, React Router v6.
- **API Client**: Uses `VITE_API_URL` to target `https://rodroham.onrender.com/api`.
- **SPA Routing**: Apache `.htaccess` in `frontend/public/.htaccess` routes deep links to `index.html`.

### Admin Dashboard ([`admin/`](file:///d:/rudroham-final/admin))
- **Tech**: React 18, Vite 5, TailwindCSS, React Router v6.
- **API Client**: Uses `VITE_API_URL` to target `https://rodroham.onrender.com/admin-api`.
- **Image Uploader**: Direct multipart integration with Cloudinary via `/admin-api/upload`.

---

## 3. Issues Diagnosed & Solutions Applied

### 1. Database Migration: Local to Cloud (MongoDB Atlas)
- **Context**: The project was configured with local `mongodb://127.0.0.1:27017/rudroham`. Render free containers do not host MongoDB.
- **Resolution**:
  - Set up free MongoDB Atlas M0 cluster in Mumbai (`ap-south-1`).
  - Added Network Access `0.0.0.0/0` (required for Render's dynamic outgoing IPs).
  - Clarified that `mongoose` already bundles the MongoDB driver (no separate `npm i mongodb` package needed).
  - Updated [`backend/.env`](file:///d:/rudroham-final/backend/.env) with the Atlas URI and executed the seeder:
    ```text
    ✅ MongoDB Connected: ac-gkdt6d1-shard-00-00.ohpcfst.mongodb.net
    ✅ Admin created: adityapal116@gmail.com
    ✅ 8 products seeded
    ✅ 3 coupons seeded
    ```

### 2. Port Conflict: `EADDRINUSE: :::5000`
- **Root Cause**: An orphaned Node process (PID `19152`) was holding port 5000 in the background.
- **Resolution**: Forcefully terminated PID `19152` using `taskkill /F /PID 19152` to release the port.

### 3. Local Development CORS Port Drift
- **Root Cause**: Vite reassigned ports (5175 for frontend, 5176 for admin) because older dev servers were running. Backend CORS rejected port 5176 with `Error: Not allowed by CORS`.
- **Resolution**:
  - Terminated orphaned Vite processes (PID 632, 28808).
  - Surgically updated [`backend/server.js`](file:///d:/rudroham-final/backend/server.js) so that in non-production environments (`NODE_ENV !== 'production'`), any `localhost` origin is dynamically accepted.

### 4. Git Security & Secrets Protection
- **Critical Catch**: Sanitized [`backend/.env.example`](file:///d:/rudroham-final/backend/.env.example) before committing to GitHub so that the live MongoDB database password and Gmail App Password were never leaked to Git. Sensitive credentials remain exclusively in local `.env` and Render dashboard.

### 5. Domain vs. Hosting Clarification
- **Context**: The user purchased the domain `rudroham.in` on Hostinger, but not a Web Hosting plan (no cPanel / `public_html`).
- **Resolution**: Recommended deploying the frontend to **Vercel** for free (global CDN, automatic SSL), and pointing Hostinger's DNS records to Vercel.

### 6. Vercel Configuration Warning
- **Context**: Vercel flagged `VITE_API_URL` with *"Remove the public framework prefix to keep this value private."*
- **Resolution**: Set variable type to **Config / Plaintext**, as client-side Vite builds require `VITE_` variables in browser bundles.

### 7. Dual A-Record Conflict on Hostinger
- **Root Cause**: Hostinger had two `A` records for `rudroham.in`:
  - `216.198.79.1` (Vercel)
  - `2.57.91.91` (Old Hostinger parked page)
  This caused half of all browser connections to fail with `ECONNRESET` / site cannot be reached.
- **Resolution**: Deleted the `2.57.91.91` record from Hostinger DNS. Vercel immediately validated the domain and issued an SSL certificate (HTTP 200 OK).

### 8. Production CORS Lockdown for `rudroham.in`
- **Root Cause**: Render backend returned HTTP 500 (`Not allowed by CORS`) for requests from `https://rudroham.in`.
- **Resolution**:
  - Updated [`backend/server.js`](file:///d:/rudroham-final/backend/server.js) to explicitly allow:
    - `https://rudroham.in`, `https://www.rudroham.in`, `https://admin.rudroham.in`
    - Regex pattern `/^https?:\/\/([a-zA-Z0-9-]+\.)*rudroham\.in$/` (covers all subdomains)
    - Regex pattern `/^https?:\/\/.*\.vercel\.app$/` (covers Vercel previews)
  - Added full CORS headers and `OPTIONS` preflight support.
  - Committed (`e610e2e`) and pushed to `main`.
  - Render auto-deployed. Verified live:
    ```text
    STATUS: 200 OK
    ALLOW_ORIGIN: https://rudroham.in
    TOTAL PRODUCTS: 8
    ```

---

## 4. Key Production Configuration Reference

### Render Environment Variables
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://rudrohamin_db_user:KiSceVyB9w6gqYkB@cluster0.ohpcfst.mongodb.net/rudroham?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=<your_64_char_secret>
JWT_EXPIRE=7d
CLIENT_URLS=https://rudroham.in,https://www.rudroham.in
ADMIN_CLIENT_URLS=https://admin.rudroham.in
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=rudroham.in@gmail.com
EMAIL_PASS=hjhmyuaaqrhskzzd
CLOUDINARY_CLOUD_NAME=Rudroham
CLOUDINARY_API_KEY=921499781743753
CLOUDINARY_API_SECRET=LahPEPY_zEOkw7MxV6KfuBj-eA8
```

### Vercel Environment Variables
- **Frontend**: `VITE_API_URL` = `https://rodroham.onrender.com/api`
- **Admin**: `VITE_API_URL` = `https://rodroham.onrender.com/admin-api`

---

## 5. Verification Checkpoints Completed
- [x] MongoDB Atlas M0 cluster provisioned and seeded with 8 products + Admin user.
- [x] Backend live on Render: `https://rodroham.onrender.com/health` (HTTP 200).
- [x] Storefront live on Vercel with custom domain: `https://rudroham.in` (HTTP 200, SSL Active).
- [x] Hostinger DNS configured with single A-record `216.198.79.1` (TTL 14400).
- [x] CORS verified: Requests from `https://rudroham.in` return `Access-Control-Allow-Origin: https://rudroham.in` and 200 OK.
