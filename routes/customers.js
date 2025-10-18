/**
 * Customer Routes - Simplified without auth
 */

const express = require('express');
const router = express.Router();

// Mock data
let customers = [
    {
        id: 1,
        name: 'สมชาย ใจดี',
        email: 'somchai@example.com',
        phone: '0812345678',
        channel: 'line',
        segment: 'active',
        total_orders: 15,
        total_spent: 45000,
        last_contact_at: new Date().toISOString()
    },
    {
        id: 2,
        name: 'สมหญิง รักดี',
        email: 'somying@example.com',
        phone: '0823456789',
        channel: 'facebook',
        segment: 'loyal',
        total_orders: 25,
        total_spent: 75000,
        last_contact_at: new Date().toISOString()
    },
    {
        id: 3,
        name: 'ทดสอบ ระบบ',
        email: 'test@example.com',
        phone: '0834567890',
        channel: 'web',
        segment: 'new',
        total_orders: 0,
        total_spent: 0,
        last_contact_at: new Date().toISOString()
    }
];

// Get all customers
router.get('/', (req, res) => {
    try {
        const { page = 1, limit = 20, segment, channel, search } = req.query;
        
        let filtered = [...customers];
        
        // Filter by segment
        if (segment && segment !== '') {
            filtered = filtered.filter(c => c.segment === segment);
        }
        
        // Filter by channel
        if (channel && channel !== '') {
            filtered = filtered.filter(c => c.channel === channel);
        }
        
        // Search
        if (search && search !== '') {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(c => 
                c.name.toLowerCase().includes(searchLower) || 
                c.email.toLowerCase().includes(searchLower) || 
                c.phone.includes(search)
            );
        }
        
        // Pagination
        const start = (page - 1) * limit;
        const end = start + parseInt(limit);
        const paginated = filtered.slice(start, end);
        
        res.json({
            customers: paginated,
            total: filtered.length,
            page: parseInt(page),
            pages: Math.ceil(filtered.length / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get customer by ID
router.get('/:id', (req, res) => {
    try {
        const customer = customers.find(c => c.id === parseInt(req.params.id));
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create customer
router.post('/', (req, res) => {
    try {
        const newCustomer = {
            id: customers.length + 1,
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            channel: req.body.channel || 'web',
            segment: 'new',
            total_orders: 0,
            total_spent: 0,
            last_contact_at: new Date().toISOString()
        };
        
        customers.push(newCustomer);
        res.status(201).json(newCustomer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update customer
router.put('/:id', (req, res) => {
    try {
        const index = customers.findIndex(c => c.id === parseInt(req.params.id));
        if (index === -1) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        customers[index] = { 
            ...customers[index], 
            ...req.body,
            id: customers[index].id // Keep original ID
        };
        
        res.json(customers[index]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete customer
router.delete('/:id', (req, res) => {
    try {
        const index = customers.findIndex(c => c.id === parseInt(req.params.id));
        if (index === -1) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        customers.splice(index, 1);
        res.json({ success: true, message: 'Customer deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
