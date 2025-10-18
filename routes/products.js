/**
 * Product Routes
 */

const express = require('express');
const router = express.Router();

// Mock products
let products = [
    {
        id: 1,
        name: 'Product A',
        price: 1000,
        stock: 50,
        category: 'electronics',
        image_url: 'https://via.placeholder.com/200'
    },
    {
        id: 2,
        name: 'Product B',
        price: 2000,
        stock: 30,
        category: 'fashion',
        image_url: 'https://via.placeholder.com/200'
    },
    {
        id: 3,
        name: 'Product C',
        price: 1500,
        stock: 0,
        category: 'electronics',
        image_url: 'https://via.placeholder.com/200'
    }
];

// Get all products
router.get('/', (req, res) => {
    const { page = 1, limit = 12, category, stock, search } = req.query;
    
    let filtered = [...products];
    
    if (category && category !== '') {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (stock && stock !== '') {
        if (stock === 'in_stock') {
            filtered = filtered.filter(p => p.stock > 10);
        } else if (stock === 'low_stock') {
            filtered = filtered.filter(p => p.stock > 0 && p.stock <= 10);
        } else if (stock === 'out_of_stock') {
            filtered = filtered.filter(p => p.stock === 0);
        }
    }
    
    if (search && search !== '') {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginated = filtered.slice(start, end);
    
    res.json({
        products: paginated,
        total: filtered.length,
        page: parseInt(page),
        pages: Math.ceil(filtered.length / limit)
    });
});

// Sync products (mock)
router.post('/sync', (req, res) => {
    res.json({
        success: true,
        synced: products.length,
        message: 'Products synced successfully'
    });
});

module.exports = router;
