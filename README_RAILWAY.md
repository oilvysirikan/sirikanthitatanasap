# CRM Backend - Railway Deployment

> **Node.js + Express + PostgreSQL + Redis**  
> Complete CRM system backend for customer management, real-time messaging, and analytics.

## 🚀 Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/quickstart)

## ✨ Features

- 🔐 **JWT Authentication** - Secure user authentication
- 💬 **Real-time Messaging** - Socket.IO powered chat system  
- 👥 **Customer Management** - Complete CRUD operations
- 📊 **Analytics Dashboard** - KPIs, trends, and insights
- 🤖 **AI Integration** - Chatbot and image generation ready
- 🛍️ **Shopify Sync** - Product and order synchronization
- 📱 **Multi-channel** - LINE, Facebook Messenger integration
- 🗄️ **PostgreSQL** - Advanced database with full-text search
- 🔴 **Redis Caching** - High-performance caching layer

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Railway.app (Backend)         │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Node.js   │  │   PostgreSQL    │   │
│  │   Express   │  │   Database      │   │
│  │   Socket.IO │  │                 │   │
│  └─────────────┘  └─────────────────┘   │
│           │                             │
│  ┌─────────────────┐                    │
│  │     Redis       │                    │
│  │     Cache       │                    │
│  └─────────────────┘                    │
└─────────────────────────────────────────┘
```

## 📋 Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000

# Database (Railway auto-generates)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Railway auto-generates)  
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com

# Shopify Integration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token

# AI Services (Optional)
OPENAI_API_KEY=your_openai_api_key

# Messaging APIs (Optional)
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
LINE_CHANNEL_SECRET=your_line_secret
```

## 🗄️ Database Schema

The system includes 12+ tables:

- **users** - Admin and agent accounts
- **customers** - Customer information and segments  
- **conversations** - Chat conversations across channels
- **messages** - Individual messages with AI analysis
- **products** - Product catalog synced with Shopify
- **orders** - Order management and tracking
- **bot_intents** - Chatbot training data
- **generated_images** - AI-generated images
- **notifications** - System notifications
- **activity_logs** - Audit trail

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/register  
GET    /api/auth/me
```

### Customers  
```
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id
```

### Conversations & Messaging
```
GET    /api/conversations
POST   /api/conversations  
GET    /api/conversations/:id/messages
POST   /api/conversations/:id/messages
```

### Analytics
```
GET    /api/analytics/dashboard
GET    /api/analytics/sales
GET    /api/analytics/customers
GET    /api/analytics/top-products
```

**[Complete API Documentation →](./README.md)**

## 🚀 Deployment Steps

### 1. One-Click Deploy
Click the Railway button above or:

1. Fork this repository
2. Connect to Railway: https://railway.app
3. Deploy from GitHub
4. Add PostgreSQL + Redis services
5. Set environment variables
6. Deploy!

### 2. Manual Setup  

```bash
# Clone repository
git clone https://github.com/your-username/crm-backend.git
cd crm-backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run migrate

# Start development server  
npm run dev
```

### 3. Database Migration

After Railway deployment, run:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Connect to your project
railway login
railway link

# Import database schema
railway run psql $DATABASE_URL -f database/schema.sql
```

## 🔧 Railway Configuration

The repository includes:
- **`railway.json`** - Railway deployment configuration
- **`package.json`** - Optimized for Railway with proper engines
- **Database config** - Auto-detects Railway PostgreSQL and Redis
- **Environment handling** - Production-ready configuration

## 🎯 Performance

### Railway Free Tier Limits:
- ✅ **500 execution hours/month** (enough for small-medium usage)  
- ✅ **500MB PostgreSQL** database
- ✅ **100MB Redis** cache
- ✅ **100GB bandwidth/month**
- ⚠️ **Sleeps after 30min idle** (wakes in 1-2 seconds)

### Optimization Features:
- Connection pooling for PostgreSQL
- Redis caching for frequently accessed data  
- Efficient database indexes
- Graceful shutdown handling
- Error logging and monitoring

## 💬 Real-time Features

### Socket.IO Events:
```javascript
// Join conversation for real-time updates
socket.emit('join_conversation', conversationId);

// Send message
socket.emit('send_message', {
    conversationId: 1,
    content: 'Hello!',
    messageType: 'text'
});

// Listen for new messages  
socket.on('new_message', (message) => {
    console.log('New message:', message);
});
```

## 🔒 Security Features

- JWT token authentication with refresh tokens
- Rate limiting (100 requests per 15 minutes)
- CORS protection with configurable origins
- SQL injection protection via parameterized queries  
- Input validation using Joi schemas
- Security headers via Helmet.js
- Password hashing with bcrypt

## 📊 Monitoring

### Health Check
```bash
curl https://your-app.railway.app/health
```

### Logs
```bash
railway logs
```

## 🔄 Auto-Deployment

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update backend"  
git push origin main
# Railway deploys automatically
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test API endpoints
curl https://your-app.railway.app/api/health
```

## 🆘 Troubleshooting

### Common Issues:

**Database Connection Error:**
```bash
# Check DATABASE_URL is set
railway variables

# Re-run database migration
railway run psql $DATABASE_URL -f database/schema.sql
```

**Redis Connection Error:**
```bash  
# Verify Redis service is running
railway services
```

**App Sleeping (Free Tier):**
```bash
# Set up external ping service or upgrade to Pro
```

## 📚 Documentation

- **[Complete API Docs](./README.md)** - Detailed API documentation
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Step-by-step deployment
- **[Database Schema](./database/schema.sql)** - Complete database structure

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes  
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - feel free to use for your projects!

---

## 🎉 Ready to Deploy?

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/quickstart)

**Railway deployment takes ~2 minutes. Your CRM backend will be ready instantly!** 🚀
