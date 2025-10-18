/**
 * CRM Backend Server - Minimal Working Version
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Server is running!'
    });
});

// API info
app.get('/api', (req, res) => {
    res.json({
        name: 'CRM Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            customers: '/api/customers',
            analytics: '/api/analytics'
        }
    });
});

// Routes (without auth for now)
app.use('/api/customers', require('./routes/customers'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/products', require('./routes/products'));

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        path: req.originalUrl
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`Server running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`API: http://localhost:${PORT}/api`);
    console.log('='.repeat(50));
});
