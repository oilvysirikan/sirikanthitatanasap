const express = require('express');
const router = express.Router();

// Mock users for authentication
const users = [
    {
        id: 1,
        email: 'admin@crm.com',
        password: 'admin123', // In production, this should be hashed
        name: 'ผู้ดูแลระบบ',
        role: 'admin',
        department: 'IT',
        avatar_url: null,
        is_active: true,
        permissions: ['read', 'write', 'delete', 'admin']
    },
    {
        id: 2,
        email: 'agent1@crm.com',
        password: 'agent123',
        name: 'พนักงานขาย 1',
        role: 'agent',
        department: 'Sales',
        avatar_url: null,
        is_active: true,
        permissions: ['read', 'write']
    },
    {
        id: 3,
        email: 'agent2@crm.com',
        password: 'agent123',
        name: 'พนักงานขาย 2',
        role: 'agent',
        department: 'Support',
        avatar_url: null,
        is_active: true,
        permissions: ['read', 'write']
    }
];

// Mock JWT token generation (in production, use proper JWT library)
function generateToken(user) {
    return Buffer.from(JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    })).toString('base64');
}

// Mock JWT token verification
function verifyToken(token) {
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        if (decoded.exp < Date.now()) {
            return null; // Token expired
        }
        return decoded;
    } catch (error) {
        return null;
    }
}

// Login endpoint
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Email และ Password จำเป็นต้องระบุ'
        });
    }
    
    // Find user
    const user = users.find(u => u.email === email);
    
    if (!user) {
        return res.status(401).json({
            error: 'Authentication Error',
            message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        });
    }
    
    if (!user.is_active) {
        return res.status(401).json({
            error: 'Account Disabled',
            message: 'บัญชีของคุณถูกปิดใช้งาน'
        });
    }
    
    // Check password (in production, use bcrypt)
    if (user.password !== password) {
        return res.status(401).json({
            error: 'Authentication Error',
            message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Update last login
    user.last_login_at = new Date().toISOString();
    user.is_online = true;
    
    res.json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            avatar_url: user.avatar_url,
            permissions: user.permissions,
            last_login_at: user.last_login_at
        }
    });
});

// Logout endpoint
router.post('/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (decoded) {
            const user = users.find(u => u.id === decoded.userId);
            if (user) {
                user.is_online = false;
                user.last_activity_at = new Date().toISOString();
            }
        }
    }
    
    res.json({
        success: true,
        message: 'ออกจากระบบสำเร็จ'
    });
});

// Get current user profile
router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Authentication Required',
            message: 'กรุณาเข้าสู่ระบบ'
        });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({
            error: 'Invalid Token',
            message: 'Token ไม่ถูกต้องหรือหมดอายุ'
        });
    }
    
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user || !user.is_active) {
        return res.status(401).json({
            error: 'User Not Found',
            message: 'ไม่พบผู้ใช้หรือบัญชีถูกปิดใช้งาน'
        });
    }
    
    // Update last activity
    user.last_activity_at = new Date().toISOString();
    
    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar_url: user.avatar_url,
        permissions: user.permissions,
        is_online: user.is_online,
        last_login_at: user.last_login_at,
        last_activity_at: user.last_activity_at
    });
});

// Update profile
router.put('/profile', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Authentication Required',
            message: 'กรุณาเข้าสู่ระบบ'
        });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({
            error: 'Invalid Token',
            message: 'Token ไม่ถูกต้องหรือหมดอายุ'
        });
    }
    
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
        return res.status(404).json({
            error: 'User Not Found',
            message: 'ไม่พบผู้ใช้'
        });
    }
    
    const { name, phone, avatar_url } = req.body;
    
    // Update allowed fields only
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar_url) user.avatar_url = avatar_url;
    
    user.updated_at = new Date().toISOString();
    
    res.json({
        success: true,
        message: 'อัพเดทโปรไฟล์สำเร็จ',
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            department: user.department,
            avatar_url: user.avatar_url,
            updated_at: user.updated_at
        }
    });
});

// Change password
router.put('/password', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Authentication Required',
            message: 'กรุณาเข้าสู่ระบบ'
        });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({
            error: 'Invalid Token',
            message: 'Token ไม่ถูกต้องหรือหมดอายุ'
        });
    }
    
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'รหัสผ่านปัจจุบันและรหัสผ่านใหม่จำเป็นต้องระบุ'
        });
    }
    
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
        return res.status(404).json({
            error: 'User Not Found',
            message: 'ไม่พบผู้ใช้'
        });
    }
    
    // Check current password
    if (user.password !== current_password) {
        return res.status(400).json({
            error: 'Invalid Password',
            message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
        });
    }
    
    // Update password (in production, hash the password)
    user.password = new_password;
    user.updated_at = new Date().toISOString();
    
    res.json({
        success: true,
        message: 'เปลี่ยนรหัสผ่านสำเร็จ'
    });
});

// Get all users (admin only)
router.get('/users', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Authentication Required',
            message: 'กรุณาเข้าสู่ระบบ'
        });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({
            error: 'Invalid Token',
            message: 'Token ไม่ถูกต้องหรือหมดอายุ'
        });
    }
    
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user || user.role !== 'admin') {
        return res.status(403).json({
            error: 'Permission Denied',
            message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
        });
    }
    
    // Return users without passwords
    const safeUsers = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        is_active: u.is_active,
        is_online: u.is_online,
        last_login_at: u.last_login_at,
        last_activity_at: u.last_activity_at
    }));
    
    res.json(safeUsers);
});

// Verify token endpoint (for middleware)
router.get('/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ valid: false });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ valid: false });
    }
    
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user || !user.is_active) {
        return res.status(401).json({ valid: false });
    }
    
    res.json({ 
        valid: true, 
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            permissions: user.permissions
        }
    });
});

module.exports = router;