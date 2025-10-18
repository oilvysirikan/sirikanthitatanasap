const express = require('express');
const router = express.Router();

// Mock messages data (shared with conversations)
let messages = [
    {
        id: 1,
        conversation_id: 1,
        sender_type: 'customer',
        sender_id: 1,
        sender_name: 'สมชาย ใจดี',
        message_type: 'text',
        content: 'สวัสดีครับ อยากสอบถามราคา iPhone 15 Pro Max',
        attachments: [],
        intent_detected: 'product_inquiry',
        confidence_score: 0.95,
        sentiment: 'neutral',
        sentiment_score: 0.7,
        is_read: true,
        is_edited: false,
        created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
        id: 2,
        conversation_id: 1,
        sender_type: 'agent',
        sender_id: 2,
        sender_name: 'พนักงานขาย 1',
        message_type: 'text',
        content: 'สวัสดีครับ iPhone 15 Pro Max ราคา 49,900 บาท มีสีให้เลือก 4 สี คือ Natural Titanium, Blue Titanium, White Titanium และ Black Titanium',
        attachments: [],
        intent_detected: null,
        confidence_score: null,
        sentiment: 'positive',
        sentiment_score: 0.8,
        is_read: true,
        is_edited: false,
        created_at: new Date(Date.now() - 86100000).toISOString()
    },
    {
        id: 3,
        conversation_id: 1,
        sender_type: 'customer',
        sender_id: 1,
        sender_name: 'สมชาย ใจดี',
        message_type: 'text',
        content: 'มีของพร้อมส่งไหมครับ สีน้ำเงิน',
        attachments: [],
        intent_detected: 'stock_inquiry',
        confidence_score: 0.88,
        sentiment: 'neutral',
        sentiment_score: 0.6,
        is_read: false,
        is_edited: false,
        created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
        id: 4,
        conversation_id: 2,
        sender_type: 'customer',
        sender_id: 2,
        sender_name: 'สมหญิง รักดี',
        message_type: 'text',
        content: 'คุณคะ ของที่สั่งไปเมื่อไหร่จะได้รับ',
        attachments: [],
        intent_detected: 'delivery_inquiry',
        confidence_score: 0.92,
        sentiment: 'neutral',
        sentiment_score: 0.5,
        is_read: true,
        is_edited: false,
        created_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    },
    {
        id: 5,
        conversation_id: 2,
        sender_type: 'agent',
        sender_id: 2,
        sender_name: 'พนักงานขาย 1',
        message_type: 'text',
        content: 'ขออภัยค่ะ ตรวจสอบให้แล้วจะจัดส่งพรุ่งนี้ค่ะ หมายเลขพัสดุ TH1234567890',
        attachments: [],
        intent_detected: null,
        confidence_score: null,
        sentiment: 'positive',
        sentiment_score: 0.9,
        is_read: true,
        is_edited: false,
        created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    }
];

// Get all messages (with filtering)
router.get('/', (req, res) => {
    const { page = 1, limit = 50, conversation_id, sender_type, message_type, search } = req.query;
    
    let filtered = messages;
    
    // Apply filters
    if (conversation_id) {
        filtered = filtered.filter(m => m.conversation_id === parseInt(conversation_id));
    }
    
    if (sender_type) {
        filtered = filtered.filter(m => m.sender_type === sender_type);
    }
    
    if (message_type) {
        filtered = filtered.filter(m => m.message_type === message_type);
    }
    
    if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(m => 
            m.content.toLowerCase().includes(searchLower) ||
            m.sender_name.toLowerCase().includes(searchLower)
        );
    }
    
    // Sort by creation time (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginated = filtered.slice(start, end);
    
    res.json({
        messages: paginated,
        total: filtered.length,
        page: parseInt(page),
        pages: Math.ceil(filtered.length / limit)
    });
});

// Get message by ID
router.get('/:id', (req, res) => {
    const message = messages.find(m => m.id === parseInt(req.params.id));
    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }
    res.json(message);
});

// Create new message
router.post('/', (req, res) => {
    const {
        conversation_id,
        sender_type = 'agent',
        sender_id,
        sender_name,
        message_type = 'text',
        content,
        attachments = [],
        quoted_message_id
    } = req.body;
    
    if (!conversation_id || !content) {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'conversation_id และ content จำเป็นต้องระบุ'
        });
    }
    
    const newMessage = {
        id: messages.length + 1,
        conversation_id: parseInt(conversation_id),
        sender_type,
        sender_id,
        sender_name: sender_name || (sender_type === 'agent' ? 'พนักงานขาย' : 'ลูกค้า'),
        message_type,
        content,
        attachments,
        quoted_message_id: quoted_message_id || null,
        intent_detected: null,
        confidence_score: null,
        sentiment: 'neutral',
        sentiment_score: 0.5,
        is_read: false,
        is_edited: false,
        created_at: new Date().toISOString()
    };
    
    // Auto-detect intent for customer messages (mock)
    if (sender_type === 'customer') {
        const contentLower = content.toLowerCase();
        if (contentLower.includes('ราคา') || contentLower.includes('เท่าไหร่')) {
            newMessage.intent_detected = 'price_inquiry';
            newMessage.confidence_score = 0.85;
        } else if (contentLower.includes('มีของ') || contentLower.includes('stock') || contentLower.includes('เหลือ')) {
            newMessage.intent_detected = 'stock_inquiry';
            newMessage.confidence_score = 0.90;
        } else if (contentLower.includes('จัดส่ง') || contentLower.includes('ส่ง') || contentLower.includes('delivery')) {
            newMessage.intent_detected = 'delivery_inquiry';
            newMessage.confidence_score = 0.88;
        } else if (contentLower.includes('สั่งซื้อ') || contentLower.includes('ซื้อ') || contentLower.includes('order')) {
            newMessage.intent_detected = 'purchase_intent';
            newMessage.confidence_score = 0.92;
        }
    }
    
    messages.push(newMessage);
    
    res.status(201).json(newMessage);
});

// Update message (edit)
router.put('/:id', (req, res) => {
    const { content, attachments } = req.body;
    const message = messages.find(m => m.id === parseInt(req.params.id));
    
    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }
    
    if (content) {
        message.content = content;
        message.is_edited = true;
        message.edited_at = new Date().toISOString();
    }
    
    if (attachments) {
        message.attachments = attachments;
    }
    
    res.json(message);
});

// Delete message
router.delete('/:id', (req, res) => {
    const index = messages.findIndex(m => m.id === parseInt(req.params.id));
    if (index === -1) {
        return res.status(404).json({ error: 'Message not found' });
    }
    
    messages.splice(index, 1);
    res.json({ success: true });
});

// Mark message as read
router.put('/:id/read', (req, res) => {
    const message = messages.find(m => m.id === parseInt(req.params.id));
    
    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }
    
    message.is_read = true;
    res.json({ success: true });
});

// Mark multiple messages as read
router.put('/bulk/read', (req, res) => {
    const { message_ids, conversation_id } = req.body;
    
    let updated = 0;
    
    if (message_ids && Array.isArray(message_ids)) {
        // Mark specific messages as read
        messages.forEach(message => {
            if (message_ids.includes(message.id)) {
                message.is_read = true;
                updated++;
            }
        });
    } else if (conversation_id) {
        // Mark all messages in conversation as read
        messages.forEach(message => {
            if (message.conversation_id === parseInt(conversation_id)) {
                message.is_read = true;
                updated++;
            }
        });
    }
    
    res.json({ 
        success: true, 
        updated_count: updated 
    });
});

// Get message statistics
router.get('/stats/overview', (req, res) => {
    const stats = {
        total_messages: messages.length,
        unread_messages: messages.filter(m => !m.is_read).length,
        by_type: {
            text: messages.filter(m => m.message_type === 'text').length,
            image: messages.filter(m => m.message_type === 'image').length,
            file: messages.filter(m => m.message_type === 'file').length,
            product: messages.filter(m => m.message_type === 'product').length
        },
        by_sender: {
            customer: messages.filter(m => m.sender_type === 'customer').length,
            agent: messages.filter(m => m.sender_type === 'agent').length,
            bot: messages.filter(m => m.sender_type === 'bot').length,
            system: messages.filter(m => m.sender_type === 'system').length
        },
        intents: {
            detected: messages.filter(m => m.intent_detected).length,
            by_intent: messages.reduce((acc, m) => {
                if (m.intent_detected) {
                    acc[m.intent_detected] = (acc[m.intent_detected] || 0) + 1;
                }
                return acc;
            }, {})
        },
        sentiment: {
            positive: messages.filter(m => m.sentiment === 'positive').length,
            neutral: messages.filter(m => m.sentiment === 'neutral').length,
            negative: messages.filter(m => m.sentiment === 'negative').length,
            average_score: messages.reduce((sum, m) => sum + (m.sentiment_score || 0), 0) / messages.length
        }
    };
    
    res.json(stats);
});

// Search messages
router.get('/search/:query', (req, res) => {
    const query = req.params.query.toLowerCase();
    const { page = 1, limit = 20 } = req.query;
    
    const searchResults = messages.filter(message => 
        message.content.toLowerCase().includes(query) ||
        message.sender_name.toLowerCase().includes(query) ||
        (message.intent_detected && message.intent_detected.toLowerCase().includes(query))
    );
    
    // Sort by relevance (exact matches first, then by date)
    searchResults.sort((a, b) => {
        const aExact = a.content.toLowerCase().includes(query) ? 1 : 0;
        const bExact = b.content.toLowerCase().includes(query) ? 1 : 0;
        
        if (aExact !== bExact) {
            return bExact - aExact;
        }
        
        return new Date(b.created_at) - new Date(a.created_at);
    });
    
    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginated = searchResults.slice(start, end);
    
    res.json({
        query,
        messages: paginated,
        total: searchResults.length,
        page: parseInt(page),
        pages: Math.ceil(searchResults.length / limit)
    });
});

module.exports = router;