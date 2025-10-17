# 🚀 CRM Deployment Guide - Railway + SiteGround

## 📋 Step-by-Step Deployment

### 🎯 Step 1: เตรียม Backend สำหรับ Railway

#### 1.1 ตรวจสอบไฟล์ที่จำเป็น
```bash
cd backend

# ตรวจสอบว่ามีไฟล์ครบหรือไม่
ls -la
# ควรมี: server.js, package.json, railway.json, .env.example
```

#### 1.2 Push Backend to GitHub
```bash
# Initialize git (ถ้ายังไม่ได้ทำ)
git init
git add .
git commit -m "Initial CRM backend commit"

# สร้าง GitHub repository ใหม่
# ไปที่ https://github.com/new
# ชื่อ repo: crm-backend

# เพิ่ม remote และ push
git remote add origin https://github.com/YOUR_USERNAME/crm-backend.git
git branch -M main
git push -u origin main
```

### 🚄 Step 2: Deploy บน Railway.app

#### 2.1 สร้างบัญชี Railway
1. ไปที่ https://railway.app
2. คลิก "Login" → "GitHub" (Sign up with GitHub)
3. อนุญาต Railway access to GitHub

#### 2.2 Deploy Backend
1. คลิก "New Project"
2. เลือก "Deploy from GitHub repo"
3. เลือก repository: `crm-backend`
4. คลิก "Deploy Now"

#### 2.3 เพิ่ม Database Services
1. ในโปรเจค คลิก "+ New"
2. เลือก "Database" → "PostgreSQL"
3. คลิก "+ New" อีกครั้ง
4. เลือก "Database" → "Redis"

#### 2.4 ตั้งค่า Environment Variables
ไปที่ Backend Service → Variables → Raw Editor:

```env
NODE_ENV=production
PORT=3000

# Database (Railway สร้างให้อัตโนมัติ)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Secret (สร้าง secret key ความยาวอย่างน้อย 32 ตัวอักษร)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long_abc123

# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_STORE_DOMAIN=o2odesign.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token

# AI Services
OPENAI_API_KEY=your_openai_api_key_if_available

# Frontend URL
FRONTEND_URL=https://crm.o2odesign.com

# LINE Messaging (ถ้ามี)
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
LINE_CHANNEL_SECRET=your_line_secret
```

#### 2.5 รับ Backend URL
Railway จะให้ URL แบบนี้:
```
https://crm-backend-production-XXXX.up.railway.app
```

### 🗄️ Step 3: Setup Database Schema

#### 3.1 Connect to Railway PostgreSQL
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login และเลือก project
railway login
railway link

# เชื่อมต่อกับ database
railway connect Postgres
```

#### 3.2 Import Database Schema
```bash
# ใน Railway Postgres shell
\i database/schema.sql

# หรือใช้ psql จาก local
psql $DATABASE_URL -f database/schema.sql
```

### 🌐 Step 4: Deploy Frontend บน SiteGround

#### 4.1 Build Frontend
```bash
cd ../frontend/admin

# Install dependencies
npm install

# Build production
npm run build
# หรือ
gulp build
```

#### 4.2 อัพเดท API Configuration
แก้ไขไฟล์ `src/assets/js/api/api-client.js`:
```javascript
// เปลี่ยนจาก Railway URL โดยตรง เป็น PHP Proxy
const API_BASE_URL = '/api-proxy/api';
// หรือ
const API_BASE_URL = 'https://crm.o2odesign.com/api-proxy/api';
```

#### 4.3 Upload ไปยัง SiteGround

##### วิธีที่ 1: SSH (แนะนำ - GoGeek Plan)
```bash
# SSH เข้า SiteGround
ssh your_cpanel_username@your_domain.com

# สร้างโฟลเดอร์
cd public_html
mkdir crm
cd crm

# Upload files (จาก local machine)
scp -r dist/* your_username@your_domain.com:~/public_html/crm/
```

##### วิธีที่ 2: File Manager (cPanel)
1. Login SiteGround Site Tools
2. ไปที่ "Website" → "File Manager"  
3. Navigate ไปที่ `public_html/`
4. สร้างโฟลเดอร์ `crm`
5. Upload ไฟล์ทั้งหมดจาก `dist/` folder
6. Extract files (ถ้า upload เป็น zip)

#### 4.4 สร้าง PHP API Proxy
สร้างโฟลเดอร์และไฟล์:
```
public_html/crm/api-proxy/index.php
```

Copy เนื้อหาจากไฟล์ `backend/api-proxy.php` และแก้ไข:
```php
// แก้ไข Backend URL ให้ตรงกับ Railway
define('BACKEND_URL', 'https://crm-backend-production-XXXX.up.railway.app');
```

#### 4.5 สร้าง .htaccess Files

สร้าง `public_html/crm/.htaccess`:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /crm/
    
    # API Proxy - Forward to PHP proxy  
    RewriteRule ^api-proxy/(.*)$ api-proxy/index.php [QSA,L]
    
    # SPA Routing - Frontend
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/crm/api-proxy/
    RewriteRule . /crm/index.html [L]
</IfModule>

# Performance optimizations
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year" 
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

สร้าง `public_html/crm/api-proxy/.htaccess`:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /crm/api-proxy/
    
    # Forward all requests to index.php
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>
```

### 🔒 Step 5: SSL Certificate

#### 5.1 ติดตั้ง Let's Encrypt SSL
1. Login SiteGround Site Tools
2. ไปที่ "Security" → "SSL Manager"
3. เลือกโดเมน: `crm.o2odesign.com` หรือ subdomain
4. เลือก "Let's Encrypt"
5. คลิก "Get" หรือ "Install"
6. เปิด "HTTPS Enforce"

### 🔧 Step 6: Performance Optimization

#### 6.1 Enable SiteGround Caching
1. Site Tools → "Speed" → "Caching"
2. เปิด "Dynamic Cache"
3. เปิด "Memcached" (ถ้ามี)

#### 6.2 Enable Cloudflare CDN  
1. Site Tools → "Speed" → "Cloudflare"
2. Enable Cloudflare CDN
3. เปิด Auto Minify (JS, CSS, HTML)

#### 6.3 Optimize PHP
1. Site Tools → "Dev" → "PHP Manager"  
2. เลือก PHP 8.2 (Ultrafast PHP)
3. เพิ่ม `memory_limit = 256M`

### ⚡ Step 7: Railway Free Tier Management

#### 7.1 Prevent Sleep (Railway Free Tier)
ตั้ง Cron Job บน SiteGround เพื่อ ping Railway ทุก 10 นาที:

1. Site Tools → "Dev" → "Cron Jobs"
2. เพิ่ม Cron Job:
```bash
*/10 * * * * curl -s https://crm-backend-production-XXXX.up.railway.app/health
```

### 🧪 Step 8: Testing

#### 8.1 Test Backend API
```bash
# Test health endpoint
curl https://crm-backend-production-XXXX.up.railway.app/health

# Test through proxy
curl https://crm.o2odesign.com/api-proxy/api/health
```

#### 8.2 Test Frontend
1. เปิด https://crm.o2odesign.com
2. ตรวจสอบ Developer Tools → Network tab
3. ดูว่า API calls ไปยัง `/api-proxy/api/*` หรือไม่
4. ทดสอบ login และ basic functionality

### 🔄 Step 9: Auto-Deployment Setup

#### 9.1 Backend Auto-Deploy (Railway)
Railway จะ auto-deploy เมื่อ push ไป GitHub:
```bash
cd backend
git add .
git commit -m "Update backend features"
git push origin main
# Railway จะ deploy อัตโนมัติภายใน 2-3 นาที
```

#### 9.2 Frontend Auto-Deploy Script
ใช้ script ที่เตรียมไว้:
```bash
cd backend
./deploy.sh
```

### 📊 Step 10: Monitoring & Maintenance

#### 10.1 Railway Monitoring
- Check Railway Dashboard: https://railway.app/dashboard
- Monitor resource usage (500MB PostgreSQL, 100MB Redis limit)
- Check deployment logs

#### 10.2 SiteGround Monitoring  
- Monitor disk space usage
- Check error logs in Site Tools
- Monitor website performance

### 🆘 Troubleshooting

#### Common Issues:

**1. CORS Errors**
- ตรวจสอบ `api-proxy.php` headers
- ตรวจสอบ Frontend URL ใน Railway environment

**2. Database Connection Error**
- ตรวจสอบ `DATABASE_URL` ใน Railway
- Run database schema: `psql $DATABASE_URL -f database/schema.sql`

**3. Railway Sleep (Free Tier)**
- ตรวจสอบ Cron Job ใน SiteGround
- พิจารณา upgrade เป็น Railway Pro ($5/month)

**4. PHP Proxy Not Working**
- ตรวจสอบ PHP error logs
- ตรวจสอบ `.htaccess` configuration
- ตรวจสอบ file permissions

### 💰 Cost Summary
- **SiteGround GoGeek**: $14.99-39.99/month (มีอยู่แล้ว)  
- **Railway Backend**: **FREE** (500 execution hours/month)
- **PostgreSQL**: **FREE** (500MB)
- **Redis**: **FREE** (100MB) 
- **SSL Certificate**: **FREE** (Let's Encrypt)
- **Domain**: **FREE** (subdomain)

**Total Additional Cost: $0** 🎉

### 🎉 Success!
ระบบ CRM จะพร้อมใช้งานที่:
- **Frontend**: https://crm.o2odesign.com
- **API Proxy**: https://crm.o2odesign.com/api-proxy/api  
- **Railway Backend**: https://crm-backend-production-XXXX.up.railway.app

> **Railway Free Tier ให้ 500 ชั่วโมงต่อเดือน ซึ่งเพียงพอสำหรับการใช้งานขนาดเล็กถึงกลาง!** 🚀
