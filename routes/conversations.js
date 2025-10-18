/**
 * Conversation Routes
 */

const express = require('express');
const router = express.Router();

// Mock conversations
let conversations = [
    {
        id: 1,
        customer_id: 1,
        customer_name: 'สมชาย ใจดี',
        channel: 'line',
        status: 'active',
        last_message: 'สวัสดีครับ',
        unread_count: 2,
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        customer_id: 2,
        customer_name: 'สมหญิง รักดี',
        channel: 'facebook',
        status: 'active',
        last_message: 'สินค้ามีสต็อกไหมคะ',
        unread_count: 0,
        updated_at: new Date(Date.now() - 3600000).toISOString()
    }
];

// Mock messages
let messages = [
    {
        id: 1,
        conversation_id: 1,
        sender_type: 'customer',
        message_type: 'text',
        content: 'สวัสดีครับ',
        created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
        id: 2,
        conversation_id: 1,
        sender_type: 'agent',
        message_type: 'text',
        content: 'สวัสดีครับ มีอะไรให้ช่วยไหมครับ',
        created_at: new Date(Date.now() - 3600000).toISOString()
    }
];

// Get all conversations
router.get('/', (req, res) => {
    const { status } = req.query;
    
    let filtered = conversations;
    if (status && status !== '') {
        filtered = conversations.filter(c => c.status === status);
    }
    
    res.json({
        conversations: filtered,
        total: filtered.length,
        active_count: conversations.filter(c => c.status === 'active').length,
        closed_count: conversations.filter(c => c.status === 'closed').length
    });
});

// Get conversation by ID
router.get('/:id', (req, res) => {
    const conversation = conversations.find(c => c.id === parseInt(req.params.id));
    if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conversation);
});

// Get messages
router.get('/:id/messages', (req, res) => {
    const conversationMessages = messages.filter(
        m => m.conversation_id === parseInt(req.params.id)
    );
    res.json(conversationMessages);
});

// Send message
router.post('/:id/messages', (req, res) => {
    const newMessage = {
        id: messages.length + 1,
        conversation_id: parseInt(req.params.id),
        sender_type: req.body.sender_type || 'agent',
        message_type: req.body.message_type || 'text',
        content: req.body.content,
        created_at: new Date().toISOString()
    };
    
    messages.push(newMessage);
    res.status(201).json(newMessage);
});

// Close conversation
router.put('/:id/close', (req, res) => {
    const index = conversations.findIndex(c => c.id === parseInt(req.params.id));
    if (index === -1) {
        return res.status(404).json({ error: 'Conversation not found' });
    }
    
    conversations[index].status = 'closed';
    res.json(conversations[index]);
});

module.exports = router;
