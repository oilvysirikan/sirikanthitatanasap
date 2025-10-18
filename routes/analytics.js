/**
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();

// Dashboard KPIs
router.get('/dashboard', (req, res) => {
    res.json({
        totalCustomers: 1234,
        customerGrowth: 12,
        activeConversations: 45,
        totalSales: 125450,
        salesGrowth: 8,
        botResponseRate: 95
    });
});

// Sales trend
router.get('/sales', (req, res) => {
    const mockData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 10000) + 5000,
        orders: Math.floor(Math.random() * 50) + 10,
        avg_order_value: Math.floor(Math.random() * 1000) + 500
    }));
    res.json(mockData);
});

// Customer growth
router.get('/customers', (req, res) => {
    res.json({
        growth: Array.from({ length: 12 }, (_, i) => ({
            month: new Date(2024, i, 1).toISOString().split('T')[0].substring(0, 7),
            new_customers: Math.floor(Math.random() * 100) + 50,
            cumulative: (i + 1) * 100
        }))
    });
});

// Top products
router.get('/top-products', (req, res) => {
    res.json([
        { name: 'Product A', total_orders: 150, revenue: 45000 },
        { name: 'Product B', total_orders: 120, revenue: 36000 },
        { name: 'Product C', total_orders: 100, revenue: 30000 },
        { name: 'Product D', total_orders: 80, revenue: 24000 },
        { name: 'Product E', total_orders: 60, revenue: 18000 }
    ]);
});

// Customer segments
router.get('/customer-segments', (req, res) => {
    res.json([
        { segment: 'ลูกค้าใหม่', count: 300 },
        { segment: 'ลูกค้าปกติ', count: 500 },
        { segment: 'ลูกค้าประจำ', count: 350 },
        { segment: 'ไม่ Active', count: 84 }
    ]);
});

// Bot performance
router.get('/bot-performance', (req, res) => {
    res.json({
        intents: [
            { intent_name: 'สอบถามสินค้า', count: 450 },
            { intent_name: 'ตรวจสอบคำสั่งซื้อ', count: 320 },
            { intent_name: 'ติดต่อฝ่ายบริการ', count: 180 },
            { intent_name: 'สอบถามราคา', count: 150 },
            { intent_name: 'ขอใบเสร็จ', count: 100 }
        ]
    });
});

module.exports = router;
