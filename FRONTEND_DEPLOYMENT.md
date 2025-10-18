# 🌐 คู่มือ Deploy Frontend บน SiteGround

## 📋 ขั้นตอนที่ 1: เตรียม Frontend

### 1.1 Build Frontend สำหรับ Production
```bash
# ไปที่ frontend directory
cd ../frontend/admin

# ติดตั้ง dependencies
npm install

# Build production
gulp build
# หรือถ้าไม่มี gulp
npm run build
```

### 1.2 แก้ไข API URL สำหรับ PHP Proxy
แก้ไขไฟล์ `src/assets/js/api/api-client.js`:
```javascript
// เปลี่ยนจาก Railway URL ตรงๆ
// const API_BASE_URL = 'https://your-railway-app.up.railway.app/api';

// เป็น PHP Proxy บน SiteGround
const API_BASE_URL = '/api-proxy/api';
// หรือ full URL
// const API_BASE_URL = 'https://crm.o2odesign.com/api-proxy/api';
```

### 1.3 Build ใหม่หลังแก้ไข
```bash
gulp build
```

## 📁 ขั้นตอนที่ 2: เตรียมไฟล์สำหรับ SiteGround

### 2.1 สร้างโครงสร้างไฟล์
```bash
# สร้าง deployment directory
mkdir -p siteground-deploy/crm
cd siteground-deploy/crm

# Copy frontend files
cp -r ../../frontend/admin/dist/* ./

# Copy PHP proxy
cp ../../backend/api-proxy.php ./api-proxy/index.php
```

### 2.2 สร้างไฟล์ .htaccess หลัก
สร้างไฟล์ `.htaccess` ใน root directory:
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

# Gzip Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
    ExpiresActive On
    
    # Images
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/ico "access plus 1 year"
    
    # CSS and JS
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    
    # Fonts
    ExpiresByType font/ttf "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    
    # Documents
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType application/json "access plus 1 hour"
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    # Prevent MIME type sniffing
    Header set X-Content-Type-Options "nosniff"
    
    # Prevent clickjacking
    Header set X-Frame-Options "SAMEORIGIN"
    
    # XSS Protection
    Header set X-XSS-Protection "1; mode=block"
    
    # Referrer Policy
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Content Security Policy (adjust as needed)
    Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
</IfModule>

# Protect sensitive files
<FilesMatch "\.(env|log|sql|md|git|htaccess|htpasswd)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Disable directory browsing
Options -Indexes

# File size limits
LimitRequestBody 52428800
```

### 2.3 สร้างไฟล์ .htaccess สำหรับ API Proxy
สร้าง `api-proxy/.htaccess`:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /crm/api-proxy/
    
    # Forward all requests to index.php
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>

# Enable error logging for debugging
php_flag log_errors On
php_value error_log /home/your_username/logs/php_errors.log

# Increase memory and execution time for API calls
php_value memory_limit 256M
php_value max_execution_time 60
php_value max_input_time 60

# File upload settings
php_value upload_max_filesize 20M
php_value post_max_size 25M
```

### 2.4 แก้ไข PHP Proxy ให้ใช้ Railway URL
แก้ไขไฟล์ `api-proxy/index.php`:
```php
// แก้ไข BACKEND_URL ให้เป็น Railway URL ที่ได้
define('BACKEND_URL', 'https://crm-backend-production-XXXX.up.railway.app');

// หรือถ้าใช้ custom domain
define('BACKEND_URL', 'https://api.crm.o2odesign.com');
```

## 🚀 ขั้นตอนที่ 3: Upload ไปยัง SiteGround

### วิธีที่ 1: SSH Upload (GoGeek Plan)
```bash
# Compress files
tar -czf crm-frontend.tar.gz -C siteground-deploy/crm .

# Upload via SCP
scp crm-frontend.tar.gz your_username@your_domain.com:~/

# SSH เข้า SiteGround
ssh your_username@your_domain.com

# Extract files
cd ~/public_html
mkdir -p crm
cd crm
tar -xzf ~/crm-frontend.tar.gz
rm ~/crm-frontend.tar.gz

# Set proper permissions
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod 644 .htaccess
chmod 644 api-proxy/.htaccess
```

### วิธีที่ 2: cPanel File Manager
1. Login SiteGround Site Tools
2. ไปที่ **File Manager**
3. เข้าไปที่ `public_html/`
4. สร้างโฟลเดอร์ `crm/`
5. Upload ไฟล์ทั้งหมดจาก `siteground-deploy/crm/`
6. Extract files (ถ้า upload เป็น zip)

### วิธีที่ 3: FTP Upload
```bash
# ใช้ lftp
lftp -u your_username ftp.your_domain.com
cd public_html
mkdir crm
cd crm
mirror -R siteground-deploy/crm/ ./
bye
```

## 🔧 ขั้นตอนที่ 4: ตั้งค่า SSL และ Domain

### 4.1 ตั้งค่า SSL Certificate
1. SiteGround Site Tools → **Security** → **SSL Manager**
2. เลือก **Let's Encrypt**
3. เลือก domain: `crm.o2odesign.com` (ถ้าใช้ subdomain)
4. คลิก **Install**
5. เปิด **HTTPS Enforce**

### 4.2 สร้าง Subdomain (Optional)
1. Site Tools → **Domain** → **Subdomains**
2. Subdomain: `crm`
3. Domain: `o2odesign.com`
4. Document Root: `/home/your_username/public_html/crm`
5. คลิก **Create**

## ⚡ ขั้นตอนที่ 5: เปิดใช้ Performance Features

### 5.1 Enable SiteGround Caching
1. Site Tools → **Speed** → **Caching**
2. เปิด **Dynamic Cache**
3. เปิด **Memcached** (ถ้ามี)

### 5.2 Enable SuperCacher
1. Site Tools → **Speed** → **SuperCacher**
2. เปิด **Static Cache**
3. เปิด **Dynamic Cache**
4. ตั้งค่า **Cache Timeout**: 1 hour

### 5.3 Enable CDN (Cloudflare)
1. Site Tools → **Speed** → **Cloudflare**
2. เปิด Cloudflare
3. เปิด **Auto Minify**: JS, CSS, HTML
4. เปิด **Brotli Compression**

### 5.4 PHP Optimization
1. Site Tools → **Dev** → **PHP Manager**
2. เลือก **PHP 8.2** (Fast CGI)
3. แก้ไขการตั้งค่า:
   ```
   memory_limit = 256M
   max_execution_time = 60
   upload_max_filesize = 20M
   post_max_size = 25M
   ```

## 🧪 ขั้นตอนที่ 6: ทดสอบระบบ

### 6.1 ทดสอบ Frontend
```bash
# เข้าใช้งาน
https://crm.o2odesign.com
# หรือ
https://o2odesign.com/crm/
```

### 6.2 ทดสอบ API Proxy
```bash
# Health check ผ่าน proxy
curl https://crm.o2odesign.com/api-proxy/api/health

# API documentation
curl https://crm.o2odesign.com/api-proxy/api
```

### 6.3 ทดสอบ Frontend Features
- [ ] หน้าแรกโหลดได้
- [ ] SPA routing ทำงาน (refresh หน้าไหนก็ได้)
- [ ] API calls ผ่าน proxy สำเร็จ
- [ ] Static files โหลดได้ (CSS, JS, images)
- [ ] ไม่มี CORS errors ใน browser console

## 🔄 ขั้นตอนที่ 7: Setup Auto-Deploy (Optional)

### 7.1 สร้าง Deploy Script บน SiteGround
```bash
# SSH เข้า SiteGround
ssh your_username@your_domain.com

# สร้าง deploy script
cat > ~/deploy-frontend.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying CRM Frontend..."

# Backup current version
if [ -d "~/public_html/crm" ]; then
    mv ~/public_html/crm ~/public_html/crm.backup.$(date +%Y%m%d_%H%M%S)
fi

# Download and extract new version
cd ~
wget https://github.com/YOUR_USERNAME/crm-frontend/archive/main.zip
unzip main.zip
mv crm-frontend-main/dist ~/public_html/crm

# Set permissions
chmod -R 755 ~/public_html/crm
find ~/public_html/crm -name "*.html" -exec chmod 644 {} \;
find ~/public_html/crm -name "*.css" -exec chmod 644 {} \;
find ~/public_html/crm -name "*.js" -exec chmod 644 {} \;

# Cleanup
rm -rf ~/crm-frontend-main ~/main.zip

echo "✅ Frontend deployed successfully!"
EOF

chmod +x ~/deploy-frontend.sh
```

### 7.2 Git Webhook (Advanced)
Setup webhook ใน GitHub ให้เรียก SiteGround script เมื่อมี push

## 📊 การติดตาม Performance

### SiteGround Analytics
- Site Tools → **Statistics** → **Visitors**
- ดู: Page views, Bandwidth usage, Response times

### Google PageSpeed Insights
```
https://pagespeed.web.dev/
```
ทดสอบด้วย URL: `https://crm.o2odesign.com`

### GTmetrix
```
https://gtmetrix.com/
```

## ⚠️ Troubleshooting

### ปัญหา: 500 Internal Server Error
**แก้ไข**:
1. ตรวจสอบ `.htaccess` syntax
2. ดู error logs ใน cPanel
3. ตรวจสอบ file permissions

### ปัญหา: API Proxy ไม่ทำงาน
**แก้ไข**:
1. ตรวจสอบ `api-proxy/index.php` ถูกต้อง
2. ตรวจสอบ Railway URL ใน `BACKEND_URL`
3. ดู PHP error logs

### ปัญหา: Static Files ไม่โหลด
**แก้ไข**:
1. ตรวจสอบ file paths ใน HTML
2. ตรวจสอบ .htaccess caching rules
3. Clear browser cache

## 📋 Frontend Deployment Checklist

- [ ] ✅ Frontend built successfully
- [ ] ✅ API URLs updated to use PHP proxy
- [ ] ✅ Files uploaded to SiteGround
- [ ] ✅ .htaccess files created
- [ ] ✅ PHP proxy configured with Railway URL
- [ ] ✅ SSL certificate installed
- [ ] ✅ Performance optimizations enabled
- [ ] ✅ Frontend loads successfully
- [ ] ✅ API proxy works
- [ ] ✅ SPA routing works
- [ ] ✅ No CORS errors

## 🎉 เสร็จแล้ว!

Frontend ของคุณพร้อมใช้งานแล้วที่:
- **🌐 Main URL**: https://crm.o2odesign.com
- **🔌 API Proxy**: https://crm.o2odesign.com/api-proxy/api

---

**ขั้นตอนต่อไป**: [ทดสอบ Integration ระหว่าง Frontend และ Backend](./INTEGRATION_TESTING.md)
