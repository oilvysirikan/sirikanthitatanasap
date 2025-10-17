/**
 * 📊 Analytics Routes
 * Dashboard KPIs, Sales trends, Customer analytics
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// ============================================
// 📈 Dashboard Analytics
// ============================================

// Get main dashboard KPIs
router.get('/dashboard', auth, analyticsController.getDashboard);

// Get sales trends
router.get('/sales', auth, analyticsController.getSalesTrend);

// Get revenue analytics
router.get('/revenue', auth, analyticsController.getRevenue);

// ============================================
// 👥 Customer Analytics
// ============================================

// Customer growth analytics
router.get('/customers', auth, analyticsController.getCustomerAnalytics);

// Customer segments distribution
router.get('/customer-segments', auth, analyticsController.getCustomerSegments);

// Customer lifetime value
router.get('/customer-ltv', auth, analyticsController.getCustomerLTV);

// ============================================
// 🛍️ Product Analytics
// ============================================

// Top selling products
router.get('/top-products', auth, analyticsController.getTopProducts);

// Product performance
router.get('/product-performance', auth, analyticsController.getProductPerformance);

// Category analytics
router.get('/categories', auth, analyticsController.getCategoryAnalytics);

// ============================================
// 💬 Conversation Analytics
// ============================================

// Conversation metrics
router.get('/conversations', auth, analyticsController.getConversationMetrics);

// Response time analytics
router.get('/response-times', auth, analyticsController.getResponseTimes);

// Channel performance
router.get('/channels', auth, analyticsController.getChannelAnalytics);

// ============================================
// 🤖 Bot Performance
// ============================================

// Bot analytics overview
router.get('/bot-performance', auth, analyticsController.getBotPerformance);

// Intent detection accuracy
router.get('/bot-intents', auth, analyticsController.getBotIntents);

// Bot training insights
router.get('/bot-training', auth, analyticsController.getBotTraining);

// ============================================
// 📊 Real-time Analytics
// ============================================

// Real-time dashboard data
router.get('/realtime', auth, analyticsController.getRealtimeData);

// Live activity feed
router.get('/activity', auth, analyticsController.getLiveActivity);

// ============================================
// 📈 Export & Reports
// ============================================

// Export analytics data
router.get('/export/:type', auth, analyticsController.exportData);

// Generate custom report
router.post('/reports', auth, analyticsController.generateReport);

module.exports = router;
