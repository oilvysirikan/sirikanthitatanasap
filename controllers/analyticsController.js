/**
 * 📊 Analytics Controller
 * Dashboard KPIs, trends, and insights
 */

const { query } = require('../config/database');

// Async handler utility
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================
// 📈 Dashboard KPIs
// ============================================

/**
 * Get main dashboard metrics
 * GET /api/analytics/dashboard
 */
exports.getDashboard = asyncHandler(async (req, res) => {
    // Total Customers with growth
    const customersQuery = `
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month,
            ROUND(
                CASE 
                    WHEN COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' 
                                         AND created_at < NOW() - INTERVAL '30 days') > 0
                    THEN (COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::DECIMAL / 
                          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' 
                                         AND created_at < NOW() - INTERVAL '30 days') - 1) * 100
                    ELSE 0
                END, 2
            ) as growth_percentage
        FROM customers
        WHERE is_active = true
    `;
    
    // Active Conversations
    const conversationsQuery = `
        SELECT 
            COUNT(*) as active_count,
            AVG(unread_count) as avg_unread,
            COUNT(*) FILTER (WHERE priority = 'high' OR priority = 'urgent') as high_priority_count
        FROM conversations
        WHERE status = 'active'
    `;
    
    // Sales & Revenue (Last 30 days)
    const salesQuery = `
        SELECT 
            COALESCE(COUNT(*), 0) as total_orders,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COALESCE(AVG(total_amount), 0) as avg_order_value,
            ROUND(
                CASE 
                    WHEN SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' 
                                                  AND created_at < NOW() - INTERVAL '30 days') > 0
                    THEN (SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::DECIMAL / 
                          SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' 
                                                  AND created_at < NOW() - INTERVAL '30 days') - 1) * 100
                    ELSE 0
                END, 2
            ) as revenue_growth
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
        AND status NOT IN ('cancelled', 'refunded')
    `;
    
    // Bot Performance
    const botQuery = `
        SELECT 
            COUNT(DISTINCT m.id) as total_bot_interactions,
            COUNT(DISTINCT m.id) FILTER (WHERE bi.intent_name IS NOT NULL) as successful_detections,
            ROUND(
                COUNT(DISTINCT m.id) FILTER (WHERE bi.intent_name IS NOT NULL)::DECIMAL / 
                NULLIF(COUNT(DISTINCT m.id), 0) * 100, 2
            ) as success_rate,
            ROUND(AVG(bi.confidence_score), 2) as avg_confidence
        FROM messages m
        LEFT JOIN bot_intents bi ON bi.message_id = m.id
        WHERE m.created_at >= NOW() - INTERVAL '7 days'
        AND m.sender_type = 'customer'
    `;
    
    // Response Time
    const responseTimeQuery = `
        WITH response_times AS (
            SELECT 
                c.id,
                EXTRACT(EPOCH FROM (
                    MIN(m2.created_at) - MAX(m1.created_at)
                )) as response_seconds
            FROM conversations c
            JOIN messages m1 ON m1.conversation_id = c.id AND m1.sender_type = 'customer'
            JOIN messages m2 ON m2.conversation_id = c.id AND m2.sender_type IN ('agent', 'bot')
                               AND m2.created_at > m1.created_at
            WHERE c.updated_at >= NOW() - INTERVAL '7 days'
            GROUP BY c.id, m1.created_at
        )
        SELECT 
            ROUND(AVG(response_seconds)) as avg_response_time,
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_seconds)) as median_response_time,
            COUNT(*) as total_responses
        FROM response_times
        WHERE response_seconds > 0 AND response_seconds < 86400
    `;
    
    try {
        const [customers, conversations, sales, bot, responseTime] = await Promise.all([
            query(customersQuery),
            query(conversationsQuery),
            query(salesQuery),
            query(botQuery),
            query(responseTimeQuery)
        ]);
        
        const dashboardData = {
            customers: {
                total: parseInt(customers.rows[0].total) || 0,
                newThisMonth: parseInt(customers.rows[0].new_this_month) || 0,
                growthPercentage: parseFloat(customers.rows[0].growth_percentage) || 0
            },
            conversations: {
                active: parseInt(conversations.rows[0].active_count) || 0,
                avgUnread: parseFloat(conversations.rows[0].avg_unread) || 0,
                highPriority: parseInt(conversations.rows[0].high_priority_count) || 0
            },
            sales: {
                totalOrders: parseInt(sales.rows[0].total_orders) || 0,
                totalRevenue: parseFloat(sales.rows[0].total_revenue) || 0,
                avgOrderValue: parseFloat(sales.rows[0].avg_order_value) || 0,
                revenueGrowth: parseFloat(sales.rows[0].revenue_growth) || 0
            },
            bot: {
                totalInteractions: parseInt(bot.rows[0].total_bot_interactions) || 0,
                successfulDetections: parseInt(bot.rows[0].successful_detections) || 0,
                successRate: parseFloat(bot.rows[0].success_rate) || 0,
                avgConfidence: parseFloat(bot.rows[0].avg_confidence) || 0
            },
            responseTime: {
                average: parseInt(responseTime.rows[0]?.avg_response_time) || 0,
                median: parseInt(responseTime.rows[0]?.median_response_time) || 0,
                totalResponses: parseInt(responseTime.rows[0]?.total_responses) || 0
            },
            lastUpdated: new Date().toISOString()
        };
        
        res.json(dashboardData);
        
    } catch (error) {
        console.error('❌ Dashboard analytics error:', error);
        res.status(500).json({
            error: 'Failed to fetch dashboard data',
            message: error.message
        });
    }
});

// ============================================
// 📈 Sales Trends
// ============================================

/**
 * Get sales trend data
 * GET /api/analytics/sales?period=30days&group=daily
 */
exports.getSalesTrend = asyncHandler(async (req, res) => {
    const { period = '30days', group = 'daily' } = req.query;
    
    let days, dateFormat, groupBy;
    
    switch (period) {
        case '7days':
            days = 7;
            dateFormat = 'YYYY-MM-DD';
            groupBy = 'DATE(created_at)';
            break;
        case '30days':
            days = 30;
            dateFormat = 'YYYY-MM-DD';
            groupBy = 'DATE(created_at)';
            break;
        case '90days':
            days = 90;
            dateFormat = group === 'weekly' ? 'YYYY-"W"WW' : 'YYYY-MM-DD';
            groupBy = group === 'weekly' ? 'DATE_TRUNC(\'week\', created_at)' : 'DATE(created_at)';
            break;
        case '1year':
            days = 365;
            dateFormat = 'YYYY-MM';
            groupBy = 'DATE_TRUNC(\'month\', created_at)';
            break;
        default:
            days = 30;
            dateFormat = 'YYYY-MM-DD';
            groupBy = 'DATE(created_at)';
    }
    
    const queryText = `
        SELECT 
            TO_CHAR(${groupBy}, '${dateFormat}') as period,
            COUNT(*) as orders_count,
            COALESCE(SUM(total_amount), 0) as revenue,
            COALESCE(AVG(total_amount), 0) as avg_order_value,
            COUNT(DISTINCT customer_id) as unique_customers
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        AND status NOT IN ('cancelled', 'refunded')
        GROUP BY ${groupBy}
        ORDER BY ${groupBy}
    `;
    
    try {
        const result = await query(queryText);
        
        res.json({
            period,
            group,
            data: result.rows.map(row => ({
                period: row.period,
                ordersCount: parseInt(row.orders_count),
                revenue: parseFloat(row.revenue),
                avgOrderValue: parseFloat(row.avg_order_value),
                uniqueCustomers: parseInt(row.unique_customers)
            }))
        });
        
    } catch (error) {
        console.error('❌ Sales trend error:', error);
        res.status(500).json({
            error: 'Failed to fetch sales trend',
            message: error.message
        });
    }
});

// ============================================
// 👥 Customer Analytics
// ============================================

/**
 * Get customer analytics
 * GET /api/analytics/customers
 */
exports.getCustomerAnalytics = asyncHandler(async (req, res) => {
    const { period = '12months' } = req.query;
    const months = period === '12months' ? 12 : 6;
    
    // Customer growth over time
    const growthQuery = `
        SELECT 
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
            COUNT(*) as new_customers,
            SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as cumulative_customers
        FROM customers
        WHERE created_at >= NOW() - INTERVAL '${months} months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
    `;
    
    // Customer segments distribution
    const segmentsQuery = `
        SELECT 
            segment,
            COUNT(*) as count,
            ROUND(COUNT(*)::DECIMAL / SUM(COUNT(*)) OVER () * 100, 1) as percentage,
            ROUND(AVG(total_spent), 2) as avg_spent
        FROM customers
        WHERE is_active = true
        GROUP BY segment
        ORDER BY count DESC
    `;
    
    // Customer source distribution
    const sourcesQuery = `
        SELECT 
            source,
            COUNT(*) as count,
            ROUND(COUNT(*)::DECIMAL / SUM(COUNT(*)) OVER () * 100, 1) as percentage
        FROM customers
        WHERE is_active = true
        GROUP BY source
        ORDER BY count DESC
    `;
    
    try {
        const [growth, segments, sources] = await Promise.all([
            query(growthQuery),
            query(segmentsQuery),
            query(sourcesQuery)
        ]);
        
        res.json({
            growth: growth.rows.map(row => ({
                month: row.month,
                newCustomers: parseInt(row.new_customers),
                cumulativeCustomers: parseInt(row.cumulative_customers)
            })),
            segments: segments.rows.map(row => ({
                segment: row.segment,
                count: parseInt(row.count),
                percentage: parseFloat(row.percentage),
                avgSpent: parseFloat(row.avg_spent)
            })),
            sources: sources.rows.map(row => ({
                source: row.source,
                count: parseInt(row.count),
                percentage: parseFloat(row.percentage)
            }))
        });
        
    } catch (error) {
        console.error('❌ Customer analytics error:', error);
        res.status(500).json({
            error: 'Failed to fetch customer analytics',
            message: error.message
        });
    }
});

// ============================================
// 🛍️ Product Analytics
// ============================================

/**
 * Get top products
 * GET /api/analytics/top-products?limit=10&period=30days
 */
exports.getTopProducts = asyncHandler(async (req, res) => {
    const { limit = 10, period = '30days', sortBy = 'revenue' } = req.query;
    
    let days;
    switch (period) {
        case '7days':
            days = 7;
            break;
        case '30days':
            days = 30;
            break;
        case '90days':
            days = 90;
            break;
        default:
            days = 30;
    }
    
    let orderBy;
    switch (sortBy) {
        case 'quantity':
            orderBy = 'total_quantity DESC';
            break;
        case 'orders':
            orderBy = 'total_orders DESC';
            break;
        case 'revenue':
        default:
            orderBy = 'total_revenue DESC';
    }
    
    const queryText = `
        WITH product_sales AS (
            SELECT 
                jsonb_array_elements(items) as item
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '${days} days'
            AND status NOT IN ('cancelled', 'refunded')
        ),
        product_stats AS (
            SELECT 
                (item->>'product_id')::INTEGER as product_id,
                SUM((item->>'quantity')::INTEGER) as total_quantity,
                SUM((item->>'price')::DECIMAL * (item->>'quantity')::INTEGER) as total_revenue,
                COUNT(DISTINCT item) as total_orders
            FROM product_sales
            WHERE item->>'product_id' IS NOT NULL
            GROUP BY (item->>'product_id')::INTEGER
        )
        SELECT 
            p.id,
            p.name,
            p.price,
            p.image_url,
            p.category,
            p.sku,
            COALESCE(ps.total_quantity, 0) as total_quantity,
            COALESCE(ps.total_revenue, 0) as total_revenue,
            COALESCE(ps.total_orders, 0) as total_orders,
            ROUND(COALESCE(ps.total_revenue, 0) / NULLIF(ps.total_quantity, 0), 2) as avg_price_per_unit
        FROM products p
        LEFT JOIN product_stats ps ON ps.product_id = p.id
        WHERE p.is_active = true
        ORDER BY ${orderBy}
        LIMIT $1
    `;
    
    try {
        const result = await query(queryText, [limit]);
        
        res.json({
            period,
            sortBy,
            products: result.rows.map(row => ({
                id: row.id,
                name: row.name,
                price: parseFloat(row.price),
                imageUrl: row.image_url,
                category: row.category,
                sku: row.sku,
                totalQuantity: parseInt(row.total_quantity) || 0,
                totalRevenue: parseFloat(row.total_revenue) || 0,
                totalOrders: parseInt(row.total_orders) || 0,
                avgPricePerUnit: parseFloat(row.avg_price_per_unit) || 0
            }))
        });
        
    } catch (error) {
        console.error('❌ Top products error:', error);
        res.status(500).json({
            error: 'Failed to fetch top products',
            message: error.message
        });
    }
});

// ============================================
// 🤖 Bot Performance
// ============================================

/**
 * Get bot performance metrics
 * GET /api/analytics/bot-performance?period=7days
 */
exports.getBotPerformance = asyncHandler(async (req, res) => {
    const { period = '7days' } = req.query;
    
    let days;
    switch (period) {
        case '24hours':
            days = 1;
            break;
        case '7days':
            days = 7;
            break;
        case '30days':
            days = 30;
            break;
        default:
            days = 7;
    }
    
    // Overall bot metrics
    const overviewQuery = `
        SELECT 
            COUNT(DISTINCT m.id) as total_interactions,
            COUNT(DISTINCT bi.id) as successful_detections,
            COUNT(DISTINCT c.id) as conversations_handled,
            ROUND(AVG(bi.confidence_score), 2) as avg_confidence,
            ROUND(
                COUNT(DISTINCT bi.id)::DECIMAL / NULLIF(COUNT(DISTINCT m.id), 0) * 100, 2
            ) as success_rate
        FROM messages m
        LEFT JOIN bot_intents bi ON bi.message_id = m.id
        LEFT JOIN conversations c ON c.id = m.conversation_id
        WHERE m.created_at >= NOW() - INTERVAL '${days} days'
        AND m.sender_type = 'customer'
    `;
    
    // Top intents
    const intentsQuery = `
        SELECT 
            bi.intent_name,
            COUNT(*) as count,
            ROUND(AVG(bi.confidence_score), 2) as avg_confidence,
            COUNT(DISTINCT bi.conversation_id) as unique_conversations
        FROM bot_intents bi
        JOIN messages m ON m.id = bi.message_id
        WHERE m.created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY bi.intent_name
        ORDER BY count DESC
        LIMIT 10
    `;
    
    // Bot performance over time
    const timelineQuery = `
        SELECT 
            DATE(m.created_at) as date,
            COUNT(DISTINCT m.id) as interactions,
            COUNT(DISTINCT bi.id) as detections,
            ROUND(AVG(bi.confidence_score), 2) as avg_confidence
        FROM messages m
        LEFT JOIN bot_intents bi ON bi.message_id = m.id
        WHERE m.created_at >= NOW() - INTERVAL '${days} days'
        AND m.sender_type = 'customer'
        GROUP BY DATE(m.created_at)
        ORDER BY date
    `;
    
    try {
        const [overview, intents, timeline] = await Promise.all([
            query(overviewQuery),
            query(intentsQuery),
            query(timelineQuery)
        ]);
        
        res.json({
            period,
            overview: {
                totalInteractions: parseInt(overview.rows[0].total_interactions) || 0,
                successfulDetections: parseInt(overview.rows[0].successful_detections) || 0,
                conversationsHandled: parseInt(overview.rows[0].conversations_handled) || 0,
                avgConfidence: parseFloat(overview.rows[0].avg_confidence) || 0,
                successRate: parseFloat(overview.rows[0].success_rate) || 0
            },
            topIntents: intents.rows.map(row => ({
                intentName: row.intent_name,
                count: parseInt(row.count),
                avgConfidence: parseFloat(row.avg_confidence),
                uniqueConversations: parseInt(row.unique_conversations)
            })),
            timeline: timeline.rows.map(row => ({
                date: row.date,
                interactions: parseInt(row.interactions) || 0,
                detections: parseInt(row.detections) || 0,
                avgConfidence: parseFloat(row.avg_confidence) || 0
            }))
        });
        
    } catch (error) {
        console.error('❌ Bot performance error:', error);
        res.status(500).json({
            error: 'Failed to fetch bot performance',
            message: error.message
        });
    }
});

// ============================================
// ⏱️ Real-time Data
// ============================================

/**
 * Get real-time dashboard data
 * GET /api/analytics/realtime
 */
exports.getRealtimeData = asyncHandler(async (req, res) => {
    // Current active users (agents online)
    const activeAgentsQuery = `
        SELECT COUNT(*) as count
        FROM users
        WHERE is_online = true 
        AND role IN ('agent', 'admin')
        AND is_active = true
    `;
    
    // Recent activities (last 5 minutes)
    const recentActivityQuery = `
        SELECT 
            'message' as type,
            COUNT(*) as count
        FROM messages
        WHERE created_at >= NOW() - INTERVAL '5 minutes'
        
        UNION ALL
        
        SELECT 
            'conversation' as type,
            COUNT(*) as count
        FROM conversations
        WHERE created_at >= NOW() - INTERVAL '5 minutes'
        
        UNION ALL
        
        SELECT 
            'order' as type,
            COUNT(*) as count
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '5 minutes'
    `;
    
    // Queue statistics
    const queueStatsQuery = `
        SELECT 
            COUNT(*) FILTER (WHERE status = 'pending' AND agent_id IS NULL) as pending_conversations,
            COUNT(*) FILTER (WHERE status = 'active' AND unread_count > 0) as unread_conversations,
            COUNT(*) FILTER (WHERE priority IN ('high', 'urgent')) as priority_conversations
        FROM conversations
        WHERE status IN ('active', 'pending')
    `;
    
    try {
        const [activeAgents, recentActivity, queueStats] = await Promise.all([
            query(activeAgentsQuery),
            query(recentActivityQuery),
            query(queueStatsQuery)
        ]);
        
        const activityMap = {};
        recentActivity.rows.forEach(row => {
            activityMap[row.type] = parseInt(row.count) || 0;
        });
        
        res.json({
            timestamp: new Date().toISOString(),
            activeAgents: parseInt(activeAgents.rows[0].count) || 0,
            recentActivity: {
                messages: activityMap.message || 0,
                conversations: activityMap.conversation || 0,
                orders: activityMap.order || 0
            },
            queue: {
                pending: parseInt(queueStats.rows[0].pending_conversations) || 0,
                unread: parseInt(queueStats.rows[0].unread_conversations) || 0,
                priority: parseInt(queueStats.rows[0].priority_conversations) || 0
            }
        });
        
    } catch (error) {
        console.error('❌ Realtime data error:', error);
        res.status(500).json({
            error: 'Failed to fetch realtime data',
            message: error.message
        });
    }
});

module.exports = exports;
