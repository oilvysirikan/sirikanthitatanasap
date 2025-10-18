// Validation middleware for CRM API

const validateCustomer = (req, res, next) => {
    const { name, email, phone } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({
            status: 'error',
            message: 'Name and email are required',
            errors: {
                name: !name ? 'Name is required' : null,
                email: !email ? 'Email is required' : null
            }
        });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid email format',
            errors: {
                email: 'Please provide a valid email address'
            }
        });
    }
    
    next();
};

const validateMessage = (req, res, next) => {
    const { content, customerId } = req.body;
    
    if (!content || !customerId) {
        return res.status(400).json({
            status: 'error',
            message: 'Content and customer ID are required',
            errors: {
                content: !content ? 'Message content is required' : null,
                customerId: !customerId ? 'Customer ID is required' : null
            }
        });
    }
    
    next();
};

const validateProduct = (req, res, next) => {
    const { name, price } = req.body;
    
    if (!name || price === undefined) {
        return res.status(400).json({
            status: 'error',
            message: 'Name and price are required',
            errors: {
                name: !name ? 'Product name is required' : null,
                price: price === undefined ? 'Product price is required' : null
            }
        });
    }
    
    if (price < 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid price',
            errors: {
                price: 'Price must be a positive number'
            }
        });
    }
    
    next();
};

const validateLogin = (req, res, next) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Username and password are required',
            errors: {
                username: !username ? 'Username is required' : null,
                password: !password ? 'Password is required' : null
            }
        });
    }
    
    next();
};

module.exports = {
    validateCustomer,
    validateMessage,
    validateProduct,
    validateLogin
};