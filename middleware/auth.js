/**
 * 🔐 Authentication Middleware
 * JWT token verification and user authorization
 */

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Verify JWT token and authenticate user
 */
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'No token provided'
            });
        }
        
        // Extract token (format: "Bearer TOKEN")
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : authHeader;
        
        if (!token) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Invalid token format'
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const userQuery = `
            SELECT 
                id, uuid, email, name, role, 
                is_active, permissions, department,
                avatar_url, last_login_at
            FROM users 
            WHERE id = $1 AND is_active = true
        `;
        
        const result = await query(userQuery, [decoded.userId]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'User not found or inactive'
            });
        }
        
        const user = result.rows[0];
        
        // Update last activity
        await query(
            'UPDATE users SET last_activity_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        // Attach user to request
        req.user = {
            id: user.id,
            uuid: user.uuid,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions || [],
            department: user.department,
            avatarUrl: user.avatar_url,
            lastLoginAt: user.last_login_at
        };
        
        next();
        
    } catch (error) {
        console.error('❌ Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Token expired'
            });
        }
        
        res.status(500).json({
            error: 'Authentication error',
            message: 'Internal server error'
        });
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
        
        if (!allowedRoles.includes(userRole)) {
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
        if (req.user.role === 'admin') {
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
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const userQuery = `
            SELECT 
                id, uuid, email, name, role, 
                is_active, permissions, department
            FROM users 
            WHERE id = $1 AND is_active = true
        `;
        
        const result = await query(userQuery, [decoded.userId]);
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
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
        
        next();
        
    } catch (error) {
        // Ignore auth errors for optional auth
        next();
    }
};

module.exports = {
    auth,
    requireRole,
    requirePermission,
    optionalAuth
};
