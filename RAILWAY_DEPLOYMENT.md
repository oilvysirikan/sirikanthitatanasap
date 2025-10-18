# 🚀 คู่มือ Deploy CRM Backend บน Railway.app

## 📋 ขั้นตอนที่ 1: เตรียม GitHub Repository

### 1.1 สร้าง GitHub Repository
1. ไปที่ https://github.com
2. คลิก "New repository" (ปุ่มสีเขียว)
3. ตั้งชื่อ: `crm-backend` หรือ `o2o-crm-backend`
4. เลือก **Public** (สำหรับ Railway Free)
5. ไม่ต้องเลือก Initialize with README (เรามีแล้ว)
6. คลิก "Create repository"

### 1.2 Push Code ไป GitHub
```bash
# เชื่อมต่อกับ GitHub repo ที่สร้าง
git remote add origin https://github.com/YOUR_USERNAME/crm-backend.git

# Push code ขึ้น GitHub
git branch -M main
git push -u origin main
```

## 🚄 ขั้นตอนที่ 2: Deploy บน Railway.app

### 2.1 สร้างบัญชี Railway
1. ไปที่ https://railway.app
2. คลิก "Login" 
3. เลือก "Sign in with GitHub"
4. Authorize Railway ให้เข้าถึง GitHub

### 2.2 สร้าง Project ใหม่
1. ใน Railway Dashboard คลิก "New Project"
2. เลือก "Deploy from GitHub repo"
3. เลือก repository: `crm-backend`
4. คลิก "Deploy Now"

Railway จะเริ่ม build และ deploy อัตโนมัติ (ใช้เวลา 2-3 นาที)

### 2.3 เพิ่ม Database Services

#### เพิ่ม PostgreSQL:
1. ใน Project dashboard คลิก "New"
2. เลือก "Database"
3. เลือก "Add PostgreSQL"
4. Railway จะสร้าง database ให้อัตโนมัติ

#### เพิ่ม Redis:
1. คลิก "New" อีกครั้ง
2. เลือก "Database"  
3. เลือก "Add Redis"
4. Railway จะสร้าง Redis instance ให้อัตโนมัติ

### 2.4 ตั้งค่า Environment Variables

คลิกที่ **Backend Service** → **Variables** และเพิ่ม:

```env
NODE_ENV=production
PORT=3000

# Database (Railway จะใส่ให้อัตโนมัติ)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Railway จะใส่ให้อัตโนมัติ)
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Secret (สร้างใหม่ - ต้องยาวกว่า 32 ตัวอักษร)
JWT_SECRET=your_super_secret_jwt_key_for_crm_system_2025

# Frontend URL (ใส่ domain ของคุณ)
FRONTEND_URL=https://crm.o2odesign.com

# Shopify (ถ้ามี - ใส่ทีหลังก็ได้)
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_STORE_DOMAIN=o2odesign.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token

# AI Services (Optional - ใส่ทีหลังก็ได้)
OPENAI_API_KEY=your_openai_api_key

# LINE Bot (Optional - ใส่ทีหลังก็ได้)
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
LINE_CHANNEL_SECRET=your_line_secret
```

### 2.5 Import Database Schema

#### วิธีที่ 1: ใช้ Railway CLI (แนะนำ)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Connect to project
railway link

# Import database schema
railway run psql $DATABASE_URL -f database/schema.sql
```

#### วิธีที่ 2: ใช้ Railway Dashboard
1. ไปที่ **PostgreSQL Service**
2. คลิก **Data** tab
3. คลิก **Query**
4. Copy-paste เนื้อหาจากไฟล์ `database/schema.sql`
5. คลิก **Execute**

### 2.6 รับ URL ของ Backend

หลัง deploy เสร็จแล้ว คุณจะได้ URL:
```
https://crm-backend-production-XXXX.up.railway.app
```

## ✅ ขั้นตอนที่ 3: ทดสอบ Backend

### 3.1 ทดสอบ Health Check
```bash
curl https://your-railway-app.up.railway.app/health
```

ผลที่ควรได้:
```json
{
  "status": "OK",
  "service": "CRM Backend API",
  "timestamp": "2025-10-18T...",
  "uptime": 12,
  "memory": {...},
  "version": "1.0.0",
  "environment": "production"
}
```

### 3.2 ทดสอบ API Documentation
```bash
curl https://your-railway-app.up.railway.app/api
```

### 3.3 ทดสอบ Database Connection
ใน Railway Dashboard → PostgreSQL → Data → Query:
```sql
SELECT * FROM users LIMIT 5;
```

## 🌐 ขั้นตอนที่ 4: Setup Custom Domain (Optional)

### 4.1 ใน Railway Dashboard
1. ไปที่ **Backend Service**
2. คลิก **Settings** tab
3. คลิก **Domains**
4. คลิก **Custom Domain**
5. ใส่: `api.crm.o2odesign.com`

### 4.2 ตั้งค่า DNS ใน SiteGround
1. Login SiteGround Site Tools
2. ไปที่ **Domain** → **DNS Zone Editor**
3. เพิ่ม CNAME Record:
   - **Type**: CNAME
   - **Name**: api.crm
   - **Value**: `crm-backend-production-XXXX.up.railway.app`
   - **TTL**: 300

## 📊 การติดตามและ Monitoring

### Logs
```bash
# ดู logs แบบ real-time
railway logs

# ดู logs จาก dashboard
Railway Dashboard → Backend Service → Deployments → View Logs
```

### Metrics
- Railway Dashboard → Backend Service → Metrics
- ดูได้: CPU, Memory, Network usage

### Health Monitoring
ตั้ง Cron Job เพื่อป้องกัน Free Tier Sleep:
```bash
# ใน SiteGround cPanel → Cron Jobs
*/10 * * * * curl -s https://your-railway-app.up.railway.app/health > /dev/null
```

## 🔄 การ Update และ Deploy ใหม่

### Auto-Deploy
Railway จะ deploy อัตโนมัติทุกครั้งที่ push to GitHub:
```bash
# แก้ไขโค้ด
git add .
git commit -m "Update: new features"
git push origin main

# Railway จะ deploy อัตโนมัติใน 1-2 นาที
```

### Manual Deploy
ใน Railway Dashboard → Backend Service → Deployments → "Redeploy"

## ⚠️ Troubleshooting

### ปัญหา: Build Failed
**สาเหตุ**: Dependencies หรือ Node.js version
**แก้ไข**:
1. ตรวจสอบ `package.json` engines
2. ตรวจสอบ `railway.json` configuration
3. ดู build logs ใน Railway Dashboard

### ปัญหา: Database Connection Error
**แก้ไข**:
1. ตรวจสอบ `DATABASE_URL` variable
2. Re-generate PostgreSQL credentials
3. Re-import database schema

### ปัญหา: App Sleeps (Free Tier)
**แก้ไข**:
1. Setup health check ping ทุก 10 นาที
2. หรือ upgrade เป็น Railway Pro ($5/month)

### ปัญหา: CORS Error
**แก้ไข**: ตั้งค่า `FRONTEND_URL` ให้ถูกต้องใน Railway variables

## 📋 Deployment Checklist

- [ ] ✅ GitHub repository created and code pushed
- [ ] ✅ Railway project created and connected to GitHub
- [ ] ✅ PostgreSQL database added and schema imported
- [ ] ✅ Redis cache added
- [ ] ✅ Environment variables configured
- [ ] ✅ Health check returns OK
- [ ] ✅ API documentation accessible
- [ ] ✅ Database queries work
- [ ] ✅ Custom domain setup (optional)
- [ ] ✅ Monitoring and alerts setup

## 🎉 เสร็จแล้ว!

คุณจะมี CRM Backend ที่:
- 🚀 **Auto-deploy** จาก GitHub
- 🗄️ **PostgreSQL** database พร้อม sample data
- 🔴 **Redis** cache สำหรับ performance
- 🔐 **JWT Authentication** พร้อมใช้
- 📊 **Analytics API** สำหรับ dashboard
- 💬 **Socket.IO** สำหรับ real-time chat
- 🌍 **Global CDN** โดย Railway

**Backend URL**: `https://your-railway-app.up.railway.app`

---

## 🔗 ขั้นตอนต่อไป

1. **[Setup Frontend บน SiteGround](./FRONTEND_DEPLOYMENT.md)**
2. **[Configure API Proxy](./API_PROXY_SETUP.md)**
3. **[Test Integration](./TESTING_GUIDE.md)**

**ต้องการความช่วยเหลือเพิ่มเติมไหมคะ?** 😊
