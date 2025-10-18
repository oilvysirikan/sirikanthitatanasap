const express = require('express');
const router = express.Router();

// Mock products data
let products = [
    {
        id: 1,
        shopify_product_id: 'gid://shopify/Product/123456',
        name: 'iPhone 15 Pro Max',
        description: 'สมาร์ทโฟนรุ่นท็อป พร้อมกล้อง 48MP และชิป A17 Pro',
        short_description: 'iPhone รุ่นใหม่ล่าสุด ประสิทธิภาพสูงสุด',
        price: 49900.00,
        compare_at_price: 52900.00,
        cost: 35000.00,
        sku: 'IPH15PM-256-BLU',
        barcode: '194253715610',
        stock: 25,
        weight: 0.221,
        image_url: 'https://cdn.shopify.com/iphone15pro.jpg',
        images: [
            'https://cdn.shopify.com/iphone15pro-1.jpg',
            'https://cdn.shopify.com/iphone15pro-2.jpg'
        ],
        category: 'มือถือ',
        subcategory: 'iPhone',
        brand: 'Apple',
        tags: ['smartphone', 'premium', 'apple', 'ios'],
        attributes: {
            color: 'Blue Titanium',
            storage: '256GB',
            screen_size: '6.7"',
            ram: '8GB'
        },
        is_active: true,
        is_featured: true,
        view_count: 1250,
        sales_count: 124,
        rating_average: 4.8,
        rating_count: 89,
        created_at: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        shopify_product_id: 'gid://shopify/Product/123457',
        name: 'MacBook Air M3',
        description: 'โน้ตบุ๊คสำหรับทำงาน น้ำหนักเบา ประสิทธิภาพสูงด้วยชิป M3',
        short_description: 'MacBook Air รุ่นใหม่ พลังแรง เบา',
        price: 42900.00,
        compare_at_price: 45900.00,
        cost: 30000.00,
        sku: 'MBA-M3-256-SLV',
        barcode: '194253715627',
        stock: 15,
        weight: 1.24,
        image_url: 'https://cdn.shopify.com/macbook-air-m3.jpg',
        images: [
            'https://cdn.shopify.com/macbook-air-m3-1.jpg',
            'https://cdn.shopify.com/macbook-air-m3-2.jpg'
        ],
        category: 'คอมพิวเตอร์',
        subcategory: 'MacBook',
        brand: 'Apple',
        tags: ['laptop', 'premium', 'apple', 'macos', 'm3'],
        attributes: {
            color: 'Silver',
            storage: '256GB SSD',
            screen_size: '13.6"',
            ram: '8GB',
            processor: 'Apple M3'
        },
        is_active: true,
        is_featured: true,
        view_count: 890,
        sales_count: 89,
        rating_average: 4.9,
        rating_count: 67,
        created_at: new Date(Date.now() - 1728000000).toISOString(), // 20 days ago
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        shopify_product_id: 'gid://shopify/Product/123458',
        name: 'AirPods Pro 2',
        description: 'หูฟังไร้สาย เสียงใส ตัดเสียงรบกวน พร้อม Spatial Audio',
        short_description: 'หูฟังไร้สาย คุณภาพเสียงเยี่ยม',
        price: 8990.00,
        compare_at_price: 9990.00,
        cost: 5000.00,
        sku: 'APP2-WHT',
        barcode: '194253715634',
        stock: 50,
        weight: 0.05,
        image_url: 'https://cdn.shopify.com/airpods-pro-2.jpg',
        images: [
            'https://cdn.shopify.com/airpods-pro-2-1.jpg',
            'https://cdn.shopify.com/airpods-pro-2-2.jpg'
        ],
        category: 'อุปกรณ์เสริม',
        subcategory: 'หูฟัง',
        brand: 'Apple',
        tags: ['headphones', 'wireless', 'apple', 'noise-canceling'],
        attributes: {
            color: 'White',
            type: 'In-ear',
            connectivity: 'Bluetooth 5.3',
            battery_life: '6 hours + 24 hours case'
        },
        is_active: true,
        is_featured: false,
        view_count: 2100,
        sales_count: 156,
        rating_average: 4.7,
        rating_count: 134,
        created_at: new Date(Date.now() - 1296000000).toISOString(), // 15 days ago
        updated_at: new Date().toISOString()
    },
    {
        id: 4,
        shopify_product_id: 'gid://shopify/Product/123459',
        name: 'Samsung Galaxy S24',
        description: 'สมาร์ทโฟนแอนดรอยด์ รุ่นใหม่ล่าสุด พร้อม AI ในตัว',
        short_description: 'Galaxy S24 พลัง AI ใหม่',
        price: 32900.00,
        compare_at_price: 35900.00,
        cost: 22000.00,
        sku: 'GS24-256-BLK',
        barcode: '8806094873566',
        stock: 30,
        weight: 0.167,
        image_url: 'https://cdn.shopify.com/galaxy-s24.jpg',
        images: [
            'https://cdn.shopify.com/galaxy-s24-1.jpg',
            'https://cdn.shopify.com/galaxy-s24-2.jpg'
        ],
        category: 'มือถือ',
        subcategory: 'Samsung',
        brand: 'Samsung',
        tags: ['smartphone', 'android', 'samsung', 'ai'],
        attributes: {
            color: 'Phantom Black',
            storage: '256GB',
            screen_size: '6.2"',
            ram: '8GB',
            processor: 'Snapdragon 8 Gen 3'
        },
        is_active: true,
        is_featured: false,
        view_count: 756,
        sales_count: 67,
        rating_average: 4.6,
        rating_count: 45,
        created_at: new Date(Date.now() - 864000000).toISOString(), // 10 days ago
        updated_at: new Date().toISOString()
    },
    {
        id: 5,
        shopify_product_id: 'gid://shopify/Product/123460',
        name: 'iPad Air',
        description: 'แท็บเล็ตสำหรับงานสร้างสรรค์ พร้อมชิป M2 และ Apple Pencil',
        short_description: 'iPad Air พลัง M2 สำหรับครีเอทีฟ',
        price: 21900.00,
        compare_at_price: 23900.00,
        cost: 15000.00,
        sku: 'IPA-M2-128-BLU',
        barcode: '194253715641',
        stock: 7,
        weight: 0.461,
        image_url: 'https://cdn.shopify.com/ipad-air.jpg',
        images: [
            'https://cdn.shopify.com/ipad-air-1.jpg',
            'https://cdn.shopify.com/ipad-air-2.jpg'
        ],
        category: 'แท็บเล็ต',
        subcategory: 'iPad',
        brand: 'Apple',
        tags: ['tablet', 'apple', 'creative', 'productivity'],
        attributes: {
            color: 'Sky Blue',
            storage: '128GB',
            screen_size: '10.9"',
            processor: 'Apple M2',
            connectivity: 'Wi-Fi + Cellular'
        },
        is_active: true,
        is_featured: true,
        view_count: 445,
        sales_count: 45,
        rating_average: 4.8,
        rating_count: 28,
        created_at: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
        updated_at: new Date().toISOString()
    }
];

// Get all products
router.get('/', (req, res) => {
    const { page = 1, limit = 20, category, brand, is_active, search, sort_by = 'created_at', sort_order = 'desc' } = req.query;
    
    let filtered = products;
    
    // Apply filters
    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (brand) {
        filtered = filtered.filter(p => p.brand === brand);
    }
    
    if (is_active !== undefined) {
        filtered = filtered.filter(p => p.is_active === (is_active === 'true'));
    }
    
    if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.brand.toLowerCase().includes(searchLower) ||
            p.category.toLowerCase().includes(searchLower) ||
            p.sku.toLowerCase().includes(searchLower)
        );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
        let aValue = a[sort_by];
        let bValue = b[sort_by];
        
        if (sort_by === 'created_at' || sort_by === 'updated_at') {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
        }
        
        if (sort_order === 'desc') {
            return bValue > aValue ? 1 : -1;
        } else {
            return aValue > bValue ? 1 : -1;
        }
    });
    
    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginated = filtered.slice(start, end);
    
    res.json({
        products: paginated,
        total: filtered.length,
        page: parseInt(page),
        pages: Math.ceil(filtered.length / limit),
        filters: {
            categories: [...new Set(products.map(p => p.category))],
            brands: [...new Set(products.map(p => p.brand))]
        }
    });
});

// Get product by ID
router.get('/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
});

// Create product
router.post('/', (req, res) => {
    const newProduct = {
        id: products.length + 1,
        ...req.body,
        view_count: 0,
        sales_count: 0,
        rating_average: 0,
        rating_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// Update product
router.put('/:id', (req, res) => {
    const index = products.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    products[index] = {
        ...products[index],
        ...req.body,
        updated_at: new Date().toISOString()
    };
    
    res.json(products[index]);
});

// Delete product
router.delete('/:id', (req, res) => {
    const index = products.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    products.splice(index, 1);
    res.json({ success: true });
});

// Get product categories
router.get('/meta/categories', (req, res) => {
    const categories = [...new Set(products.map(p => p.category))];
    const categoryStats = categories.map(category => ({
        name: category,
        count: products.filter(p => p.category === category).length,
        active_count: products.filter(p => p.category === category && p.is_active).length
    }));
    
    res.json(categoryStats);
});

// Get product brands
router.get('/meta/brands', (req, res) => {
    const brands = [...new Set(products.map(p => p.brand))];
    const brandStats = brands.map(brand => ({
        name: brand,
        count: products.filter(p => p.brand === brand).length,
        active_count: products.filter(p => p.brand === brand && p.is_active).length
    }));
    
    res.json(brandStats);
});

// Get featured products
router.get('/featured/list', (req, res) => {
    const featuredProducts = products.filter(p => p.is_featured && p.is_active);
    res.json(featuredProducts);
});

// Get low stock products
router.get('/inventory/low-stock', (req, res) => {
    const threshold = parseInt(req.query.threshold) || 10;
    const lowStockProducts = products.filter(p => p.stock <= threshold && p.is_active);
    
    res.json({
        products: lowStockProducts,
        count: lowStockProducts.length,
        threshold
    });
});

// Sync with Shopify (mock)
router.post('/sync/shopify', (req, res) => {
    // Mock Shopify sync
    setTimeout(() => {
        res.json({
            success: true,
            synced_count: products.length,
            message: 'Products synced successfully from Shopify',
            timestamp: new Date().toISOString()
        });
    }, 2000); // Simulate API delay
});

// Update product stock
router.put('/:id/stock', (req, res) => {
    const { stock, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    switch (operation) {
        case 'add':
            product.stock += stock;
            break;
        case 'subtract':
            product.stock = Math.max(0, product.stock - stock);
            break;
        default:
            product.stock = stock;
    }
    
    product.updated_at = new Date().toISOString();
    
    res.json({
        success: true,
        product: {
            id: product.id,
            name: product.name,
            stock: product.stock
        }
    });
});

module.exports = router;