/**
 * 🔐 Authentication Middleware (Mock version for testing)
 * JWT token verification and user authorization
 */

const jwt = require('jsonwebtoken');

// Mock users for testing
const mockUsers = [
    {
        id: 1,
        uuid: 'user-123',
        email: 'admin@crm.com',
        name: 'Admin User',
        role: 'admin',
        permissions: ['all'],
        department: 'IT',
        isActive: true
    },
    {
        id: 2,
        uuid: 'user-456',
        email: 'sales@crm.com',
        name: 'Sales User',
        role: 'sales',
        permissions: ['customers.read', 'customers.write'],
        department: 'Sales',
        isActive: true
    }
];

/**
 * Mock authentication middleware for development
 */
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            // For development, allow requests without token but with default user
            req.user = mockUsers[0]; // Default to admin user
            return next();
        }
        
        // Extract token (format: "Bearer TOKEN")
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : authHeader;
        
        if (!token) {
            req.user = mockUsers[0];
            return next();
        }
        
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
            
            // Find user from mock data
            const user = mockUsers.find(u => u.id === decoded.userId);
            
            if (!user || !user.isActive) {
                return res.status(401).json({
                    error: 'Access denied',
                    message: 'User not found or inactive'
                });
            }
            
            // Attach user to request
            req.user = {
                id: user.id,
                uuid: user.uuid,
                email: user.email,
                name: user.name,
                role: user.role,
                permissions: user.permissions || [],
                department: user.department
            };
            
        } catch (jwtError) {
            // If JWT fails, use default user for development
            req.user = mockUsers[0];
        }
        
        next();
        
    } catch (error) {
        console.error('❌ Auth middleware error:', error);
        
        // For development, continue with default user
        req.user = mockUsers[0];
        next();
    }
};

/**
 * Check if user has required role
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Authentication required'
            });
        }
        
        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!allowedRoles.includes(userRole) && userRole !== 'admin') {
            return res.status(403).json({
                error: 'Access denied',
                message: `Required role: ${allowedRoles.join(' or ')}`
            });
        }
        
        next();
    };
};

/**
 * Check if user has specific permission
 */
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Authentication required'
            });
        }
        
        const userPermissions = req.user.permissions || [];
        
        // Admin role has all permissions
        if (req.user.role === 'admin' || userPermissions.includes('all')) {
            return next();
        }
        
        if (!userPermissions.includes(permission)) {
            return res.status(403).json({
                error: 'Access denied',
                message: `Required permission: ${permission}`
            });
        }
        
        next();
    };
};

/**
 * Optional authentication (for public endpoints that benefit from user context)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return next();
        }
        
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : authHeader;
        
        if (!token) {
            return next();
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
            const user = mockUsers.find(u => u.id === decoded.userId);
            
            if (user && user.isActive) {
                req.user = {
                    id: user.id,
                    uuid: user.uuid,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    permissions: user.permissions || [],
                    department: user.department
                };
            }
        } catch (jwtError) {
            // Ignore JWT errors for optional auth
        }
        
        next();
        
    } catch (error) {
        // Ignore auth errors for optional auth
        next();
    }
};

module.exports = auth;
