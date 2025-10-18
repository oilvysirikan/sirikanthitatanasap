// Customer Controller for CRM API

const customers = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        company: 'ABC Corp',
        status: 'active',
        tags: ['vip', 'enterprise'],
        createdAt: '2024-01-15T10:30:00Z',
        lastContact: '2024-02-20T14:15:00Z',
        totalValue: 15000
    },
    {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1-555-0124',
        company: 'XYZ Inc',
        status: 'active',
        tags: ['new-customer'],
        createdAt: '2024-02-01T09:00:00Z',
        lastContact: '2024-02-22T11:30:00Z',
        totalValue: 8500
    },
    {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '+1-555-0125',
        company: 'Tech Solutions',
        status: 'inactive',
        tags: ['potential'],
        createdAt: '2024-01-10T15:45:00Z',
        lastContact: '2024-01-25T16:20:00Z',
        totalValue: 3200
    }
];

let nextId = 4;

const getAllCustomers = (req, res) => {
    const { search, status, tag, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    let filteredCustomers = [...customers];
    
    // Search filter
    if (search) {
        const searchLower = search.toLowerCase();
        filteredCustomers = filteredCustomers.filter(customer => 
            customer.name.toLowerCase().includes(searchLower) ||
            customer.email.toLowerCase().includes(searchLower) ||
            customer.company.toLowerCase().includes(searchLower)
        );
    }
    
    // Status filter
    if (status) {
        filteredCustomers = filteredCustomers.filter(customer => customer.status === status);
    }
    
    // Tag filter
    if (tag) {
        filteredCustomers = filteredCustomers.filter(customer => 
            customer.tags.includes(tag)
        );
    }
    
    // Sorting
    filteredCustomers.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (order === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    res.json({
        status: 'success',
        data: filteredCustomers,
        total: filteredCustomers.length,
        filters: { search, status, tag, sortBy, order }
    });
};

const getCustomerById = (req, res) => {
    const customerId = parseInt(req.params.id);
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) {
        return res.status(404).json({
            status: 'error',
            message: 'Customer not found'
        });
    }
    
    res.json({
        status: 'success',
        data: customer
    });
};

const createCustomer = (req, res) => {
    const { name, email, phone, company, tags = [] } = req.body;
    
    // Check if email already exists
    const existingCustomer = customers.find(c => c.email === email);
    if (existingCustomer) {
        return res.status(400).json({
            status: 'error',
            message: 'Customer with this email already exists'
        });
    }
    
    const newCustomer = {
        id: nextId++,
        name,
        email,
        phone: phone || '',
        company: company || '',
        status: 'active',
        tags: Array.isArray(tags) ? tags : [],
        createdAt: new Date().toISOString(),
        lastContact: new Date().toISOString(),
        totalValue: 0
    };
    
    customers.push(newCustomer);
    
    res.status(201).json({
        status: 'success',
        message: 'Customer created successfully',
        data: newCustomer
    });
};

const updateCustomer = (req, res) => {
    const customerId = parseInt(req.params.id);
    const customerIndex = customers.findIndex(c => c.id === customerId);
    
    if (customerIndex === -1) {
        return res.status(404).json({
            status: 'error',
            message: 'Customer not found'
        });
    }
    
    const { name, email, phone, company, status, tags } = req.body;
    
    // Check if email is being changed and already exists
    if (email && email !== customers[customerIndex].email) {
        const existingCustomer = customers.find(c => c.email === email);
        if (existingCustomer) {
            return res.status(400).json({
                status: 'error',
                message: 'Customer with this email already exists'
            });
        }
    }
    
    // Update customer
    customers[customerIndex] = {
        ...customers[customerIndex],
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(company !== undefined && { company }),
        ...(status && { status }),
        ...(tags && { tags: Array.isArray(tags) ? tags : [] }),
        lastContact: new Date().toISOString()
    };
    
    res.json({
        status: 'success',
        message: 'Customer updated successfully',
        data: customers[customerIndex]
    });
};

const deleteCustomer = (req, res) => {
    const customerId = parseInt(req.params.id);
    const customerIndex = customers.findIndex(c => c.id === customerId);
    
    if (customerIndex === -1) {
        return res.status(404).json({
            status: 'error',
            message: 'Customer not found'
        });
    }
    
    const deletedCustomer = customers.splice(customerIndex, 1)[0];
    
    res.json({
        status: 'success',
        message: 'Customer deleted successfully',
        data: deletedCustomer
    });
};

const getCustomerStats = (req, res) => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const inactiveCustomers = customers.filter(c => c.status === 'inactive').length;
    const totalValue = customers.reduce((sum, c) => sum + c.totalValue, 0);
    const averageValue = totalCustomers > 0 ? totalValue / totalCustomers : 0;
    
    // Recent customers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCustomers = customers.filter(c => 
        new Date(c.createdAt) >= thirtyDaysAgo
    ).length;
    
    res.json({
        status: 'success',
        data: {
            total: totalCustomers,
            active: activeCustomers,
            inactive: inactiveCustomers,
            recent: recentCustomers,
            totalValue,
            averageValue: Math.round(averageValue * 100) / 100
        }
    });
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerStats
};