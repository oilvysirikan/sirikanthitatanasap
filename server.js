/**
 * 🚀 CRM Backend Server
 * Node.js + Express + PostgreSQL + Redis + Socket.IO
 * 
 * Features:
 * - REST API for CRM operations
 * - Real-time messaging with Socket.IO
 * - JWT Authentication
 * - Rate limiting & Security
 * - Shopify integration
 * - AI Image generation
 * - LINE Messaging API
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
require('dotenv').config();

// Import configurations
const { initializeDatabase, closeDatabase } = require('./config/database');
const { connectRedis, closeRedis } = require('./config/redis');

const app = express();
const server = http.createServer(app);

// ============================================
// Socket.IO Setup for Real-time Features
// ============================================
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});

// Make io accessible in routes
app.set('socketio', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);
    
    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
        socket.join(`conversation_${conversationId}`);
        console.log(`👤 User joined conversation: ${conversationId}`);
    });
    
    // Handle new message
    socket.on('send_message', async (data) => {
        try {
            // Broadcast to conversation room
            io.to(`conversation_${data.conversationId}`).emit('new_message', data);
            console.log('💬 Message sent:', data.conversationId);
        } catch (error) {
            console.error('❌ Socket message error:', error);
            socket.emit('message_error', { error: 'Failed to send message' });
        }
    });
    
    socket.on('disconnect', () => {
        console.log('👤 User disconnected:', socket.id);
    });
});

// ============================================
// Middleware
// ============================================
app.use(compression()); // Gzip compression
app.use(helmet({
    contentSecurityPolicy: false, // Allow frontend to load resources
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:8080',
        'http://localhost:3000',
        'http://127.0.0.1:8080'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

// File upload middleware
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests',
        message: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// ============================================
// API Routes
// ============================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/products', require('./routes/products'));
app.use('/api/analytics', require('./routes/analytics'));

// Optional routes (can be added later)
// app.use('/api/orders', require('./routes/orders'));
// app.use('/api/images', require('./routes/images'));
// app.use('/api/bot', require('./routes/bot'));
// app.use('/api/notifications', require('./routes/notifications'));
// app.use('/api/webhooks', require('./routes/webhooks'));

// ============================================
// Health Check & API Documentation
// ============================================
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        service: 'CRM Backend API',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api', (req, res) => {
    res.json({
        name: '🚀 CRM Backend API',
        version: '1.0.0',
        description: 'Complete CRM system with real-time messaging',
        endpoints: {
            auth: '/api/auth/*',
            customers: '/api/customers/*',
            conversations: '/api/conversations/*',
            messages: '/api/messages/*',
            products: '/api/products/*',
            orders: '/api/orders/*',
            analytics: '/api/analytics/*',
            images: '/api/images/*',
            bot: '/api/bot/*',
            notifications: '/api/notifications/*',
            webhooks: '/api/webhooks/*'
        },
        features: [
            'JWT Authentication',
            'Real-time messaging (Socket.IO)',
            'Customer Management',
            'Product & Order sync with Shopify',
            'AI Image Generation',
            'LINE Messaging integration',
            'Analytics & Reports',
            'Chatbot with Intent Detection'
        ],
        documentation: 'https://github.com/your-repo/api-docs'
    });
});

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        suggestion: 'Check API documentation at /api'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    
    // Duplicate key error (PostgreSQL)
    if (err.code === '23505') {
        return res.status(400).json({
            error: 'Duplicate Entry',
            message: 'Resource already exists'
        });
    }
    
    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message,
            details: err.details || {}
        });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Authentication Error',
            message: 'Invalid token'
        });
    }
    
    // Default server error
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong' 
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 3000;

// Initialize connections
const startServer = async () => {
    try {
        // Initialize database
        await initializeDatabase();
        
        // Connect to Redis
        await connectRedis();
        
        // Start HTTP server
        server.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                  🚀 CRM Backend Server                   ║
    ║═══════════════════════════════════════════════════════════║
    ║  📡 Port: ${PORT}                                           ║
    ║  🌍 Environment: ${(process.env.NODE_ENV || 'development').padEnd(11)} ║
    ║  🕒 Started: ${new Date().toLocaleString('th-TH').padEnd(20)} ║
    ║  📊 API Docs: http://localhost:${PORT}/api                   ║
    ║  🔍 Health: http://localhost:${PORT}/health                  ║
    ║  💬 Socket.IO: Enabled for real-time messaging          ║
    ╚═══════════════════════════════════════════════════════════╝
    
    🎯 Ready to handle:
    ✅ Customer Management
    ✅ Real-time Conversations  
    ✅ Product & Order Sync
    ✅ Analytics & Reports
    ✅ AI Image Generation
    ✅ LINE Messaging
    ✅ Chatbot Integration
    `);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();
});

// ============================================
// Graceful Shutdown
// ============================================
const gracefulShutdown = async () => {
    console.log('🔄 Graceful shutdown initiated...');
    
    try {
        // Close server
        server.close(() => {
            console.log('✅ HTTP server closed');
        });
        
        // Close database connections
        await closeDatabase();
        
        // Close Redis connection
        await closeRedis();
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

module.exports = app;
