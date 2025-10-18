<<<<<<< HEAD
# 🚀 CRM Backend API

> **ระบบ CRM Backend สำหรับการจัดการลูกค้า การสนทนา และการวิเคราะห์ข้อมูล**

## ✨ Features

### 🎯 Core Features
- **👥 Customer Management** - จัดการข้อมูลลูกค้าแบบครบครัน
- **💬 Real-time Messaging** - ระบบแชทแบบเรียลไทม์ด้วย Socket.IO
- **🛍️ Product & Order Sync** - เชื่อมต่อกับ Shopify อัตโนมัติ
- **📊 Analytics & Reports** - วิเคราะห์ข้อมูลและรายงานแบบละเอียด
- **🤖 AI Chatbot** - บอทตอบลูกค้าด้วย Intent Detection
- **🎨 AI Image Generation** - สร้างรูปภาพด้วย AI
- **📱 LINE & Facebook Integration** - เชื่อมต่อช่องทางการขาย

### 🔧 Technical Features
- **⚡ High Performance** - PostgreSQL + Redis + Bull Queue
- **🔐 Secure Authentication** - JWT tokens + Role-based access
- **📈 Scalable Architecture** - RESTful API design
- **⚠️ Error Handling** - Comprehensive error management
- **📝 Full Logging** - Activity tracking และ audit logs
- **🔍 Advanced Search** - Full-text search capabilities

## 🏗️ Project Structure

```
backend/
├── 📁 controllers/          # Business logic controllers
│   ├── analyticsController.js
│   ├── customerController.js
│   ├── conversationController.js
│   └── ...
├── 📁 routes/              # API routes
│   ├── analytics.js
│   ├── customers.js
│   ├── conversations.js
│   └── ...
├── 📁 middleware/          # Custom middleware
│   ├── auth.js
│   ├── validation.js
│   └── errorHandler.js
├── 📁 config/              # Configuration files
│   ├── database.js
│   └── redis.js
├── 📁 utils/               # Utility functions
├── 📁 services/            # External services
│   ├── shopifyService.js
│   ├── lineService.js
│   └── aiService.js
├── 📁 database/            # Database files
│   ├── schema.sql
│   ├── migrations/
│   └── seeds/
├── 📄 server.js            # Main server file
├── 📄 package.json
└── 📄 .env.example
```

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Required software
- Node.js 16+ 
- PostgreSQL 14+
- Redis 6+
- npm or yarn
```

### 2. Installation
```bash
# Clone และติดตั้ง dependencies
cd backend
npm install

# Copy environment file
cp .env.example .env
# แก้ไขค่าใน .env file
```

### 3. Database Setup
```bash
# สร้าง PostgreSQL database
createdb crm_database

# Run database schema
psql crm_database < database/schema.sql

# หรือใช้ npm script
npm run migrate
npm run seed
```

### 4. Start Development Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 5. Verify Installation
```bash
# Test API health
curl http://localhost:3000/health

# Test API documentation
curl http://localhost:3000/api
```

## 📊 API Endpoints

### 🔐 Authentication
```http
POST   /api/auth/login          # User login
POST   /api/auth/register       # User registration
POST   /api/auth/refresh        # Refresh JWT token
POST   /api/auth/logout         # User logout
GET    /api/auth/me            # Get current user
```

### 👥 Customers
```http
GET    /api/customers           # Get all customers
GET    /api/customers/:id       # Get customer by ID
POST   /api/customers           # Create new customer
PUT    /api/customers/:id       # Update customer
DELETE /api/customers/:id       # Delete customer
GET    /api/customers/:id/orders        # Get customer orders
GET    /api/customers/:id/conversations # Get customer conversations
```

### 💬 Conversations
```http
GET    /api/conversations       # Get all conversations
GET    /api/conversations/:id   # Get conversation by ID
POST   /api/conversations       # Create new conversation
PUT    /api/conversations/:id/close     # Close conversation
GET    /api/conversations/:id/messages  # Get messages
POST   /api/conversations/:id/messages # Send message
```

### 📊 Analytics
```http
GET    /api/analytics/dashboard         # Dashboard KPIs
GET    /api/analytics/sales            # Sales trends
GET    /api/analytics/customers        # Customer analytics
GET    /api/analytics/top-products     # Top products
GET    /api/analytics/bot-performance  # Bot performance
GET    /api/analytics/realtime         # Real-time data
```

### 🛍️ Products & Orders
```http
GET    /api/products            # Get all products
POST   /api/products/sync       # Sync with Shopify
GET    /api/orders              # Get all orders
GET    /api/orders/:id          # Get order by ID
```

### 🎨 AI Features
```http
POST   /api/images/generate     # Generate AI image
GET    /api/images/:id          # Get generated image
POST   /api/bot/train           # Train chatbot
POST   /api/bot/detect-intent   # Detect message intent
```

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:8080

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_database
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Authentication
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

# External APIs
SHOPIFY_API_KEY=your_shopify_key
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
OPENAI_API_KEY=your_openai_key
```

### Database Schema
- **users** - Admin และ Agent users
- **customers** - ข้อมูลลูกค้า
- **conversations** - การสนทนา
- **messages** - ข้อความในการสนทนา
- **products** - สินค้า (sync จาก Shopify)
- **orders** - คำสั่งซื้อ
- **bot_intents** - Intent ของ Chatbot
- **generated_images** - รูปภาพที่สร้างด้วย AI
- **notifications** - การแจ้งเตือน
- **activity_logs** - บันทึกกิจกรรม

## 🔌 Real-time Features

### Socket.IO Events
```javascript
// Client connects to conversation
socket.emit('join_conversation', conversationId);

// Send new message
socket.emit('send_message', {
    conversationId: 1,
    content: 'Hello!',
    messageType: 'text'
});

// Listen for new messages
socket.on('new_message', (message) => {
    console.log('New message:', message);
});

// Typing indicator
socket.emit('typing', { conversationId: 1 });
```

### WebHook Integration
```javascript
// Shopify order webhook
POST /api/webhooks/shopify/orders

// LINE messaging webhook  
POST /api/webhooks/line/messages

// Facebook messenger webhook
POST /api/webhooks/facebook/messages
```

## 🤖 AI & Automation

### Chatbot Intent Detection
```javascript
// Train bot with conversation data
POST /api/bot/train
{
    "conversations": [...]
}

// Detect intent from message
POST /api/bot/detect-intent
{
    "message": "ราคา iPhone 15 เท่าไหร่ครับ",
    "customerId": 123
}
```

### AI Image Generation
```javascript
// Generate product image
POST /api/images/generate
{
    "prompt": "iPhone 15 Pro สีทอง บนโต๊ะไม้",
    "style": "product_photography",
    "size": "1024x1024"
}
```

## 📊 Analytics Examples

### Dashboard KPIs Response
```json
{
    "customers": {
        "total": 1250,
        "newThisMonth": 95,
        "growthPercentage": 12.5
    },
    "conversations": {
        "active": 45,
        "avgUnread": 2.3,
        "highPriority": 8
    },
    "sales": {
        "totalOrders": 340,
        "totalRevenue": 892500.00,
        "avgOrderValue": 2625.00,
        "revenueGrowth": 8.7
    },
    "bot": {
        "totalInteractions": 1820,
        "successRate": 87.5,
        "avgConfidence": 0.92
    }
}
```

### Sales Trend Response
```json
{
    "period": "30days",
    "data": [
        {
            "period": "2025-10-01",
            "ordersCount": 12,
            "revenue": 28500.00,
            "avgOrderValue": 2375.00,
            "uniqueCustomers": 11
        }
    ]
}
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens** - Secure token-based authentication
- **Role-based Access** - Admin, Agent, Customer roles
- **Permission System** - Granular permissions
- **Rate Limiting** - API request limits
- **Input Validation** - Joi validation schemas
- **SQL Injection Protection** - Parameterized queries

### Security Headers
```javascript
// Helmet.js security headers
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Feature-Policy
```

## 🚀 Deployment

### Production Setup
```bash
# Environment
NODE_ENV=production
PORT=3000

# Database connection pooling
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000

# Redis for sessions & caching
REDIS_URL=redis://localhost:6379

# PM2 process manager
npm install -g pm2
pm2 start ecosystem.config.js
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name api.yourcrm.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🧪 Testing

### API Testing
```bash
# Run tests
npm test

# Test with coverage
npm run test:coverage

# Integration tests
npm run test:integration
```

### Manual Testing
```bash
# Use curl or Postman
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"admin123"}'
```

## 📚 Development

### Adding New Features
1. **Create Route** in `routes/`
2. **Add Controller** in `controllers/` 
3. **Update Database** schema if needed
4. **Add Middleware** validation
5. **Write Tests**
6. **Update Documentation**

### Code Style
- **ESLint** for code linting
- **Prettier** for code formatting  
- **JSDoc** for documentation
- **Conventional Commits** for git messages

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check database exists
psql -l | grep crm_database

# Reset database
dropdb crm_database
createdb crm_database
psql crm_database < database/schema.sql
```

#### Redis Connection Error
```bash
# Check Redis is running
redis-cli ping

# Start Redis
redis-server
```

#### JWT Token Issues
```bash
# Check JWT_SECRET is set
echo $JWT_SECRET

# Clear tokens and login again
# Check token expiration
```

### Performance Issues
```bash
# Monitor database queries
# Check slow query log
# Optimize database indexes
# Monitor memory usage
# Check Redis cache hit rates
```

## 📞 Support

### Documentation
- **API Docs**: `http://localhost:3000/api`
- **Health Check**: `http://localhost:3000/health`
- **Socket.IO Test**: Use browser dev tools

### Logging
```bash
# View logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log

# Database logs
tail -f /var/log/postgresql/postgresql.log
```

---

## 📝 License

MIT License - สามารถใช้งานได้อย่างอิสระ

## 👥 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

---

> **🎉 ระบบ CRM Backend พร้อมใช้งาน!** สร้างด้วย ❤️ สำหรับธุรกิจไทย
=======
# sirikanthitatanasap
>>>>>>> af3277efeb519cd18be0c993cad2ef084570ea06
