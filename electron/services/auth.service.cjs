const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../db/models/Admin.cjs');
const Store = require('electron-store');
const RateLimiter = require('../utils/rateLimiter.cjs');
const { logger: appLogger, createLogger } = require('../utils/logger.cjs');
const AuditLogger = require('../utils/auditLogger.cjs');

const store = new Store();
// Use a dedicated logger for Auth actions
const authLogger = createLogger('Auth'); // Auth‑specific logger
// Generic logger instance
const defaultLogger = appLogger;
const rateLimiter = new RateLimiter();

// Cleanup old rate limit records every 10 minutes
setInterval(() => rateLimiter.cleanup(), 10 * 60 * 1000);

// Cleanup old audit logs every 24 hours (keep last 90 days)
setInterval(() => AuditLogger.deleteOldLogs(90), 24 * 60 * 60 * 1000);

const JWT_SECRET = 'library-pro-session-secret-key-2024';

function generateToken(user) {
    return jwt.sign(
        { id: user.id || user._id.toString(), email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '8h' }
    );
}

async function registerAdmin(data) {
    const existing = await Admin.findOne({ email: data.email, is_deleted: 0 });
    if (existing) throw new Error('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await Admin.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: 'admin'
    });

    defaultLogger.info(`New admin registered: ${data.email}`);

    const token = generateToken(user);
    store.set('auth_token', token);

    return {
        user: {
            _id: user._id.toString(),
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
        },
        token
    };
}

async function loginAdmin(email, password) {
    try {
        // Check rate limiting
        if (rateLimiter.isBlocked(email)) {
            const blockedUntil = rateLimiter.getBlockedUntil(email);
            authLogger.warn(`Login attempt for blocked email: ${email}`);
            
            // Log failed login attempt in audit
            const user = await Admin.findOne({ email, is_deleted: 0 });
            if (user) {
                await AuditLogger.log({
                    adminId: user._id,
                    adminName: user.name,
                    action: 'LOGIN',
                    entityType: 'Auth',
                    status: 'FAILED',
                    errorMessage: 'Account temporarily locked due to multiple failed login attempts',
                    details: `Blocked until ${blockedUntil.toISOString()}`
                });
            }
            
            throw new Error(`Too many failed login attempts. Try again after ${blockedUntil.toLocaleTimeString()}`);
        }

        const user = await Admin.findOne({ email, is_deleted: 0 });
        if (!user) {
            rateLimiter.recordAttempt(email, false);
            const remaining = rateLimiter.getRemainingAttempts(email);
            authLogger.warn(`Failed login attempt (user not found): ${email}. Remaining: ${remaining}`);
            throw new Error('Invalid email or password');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            rateLimiter.recordAttempt(email, false);
            const remaining = rateLimiter.getRemainingAttempts(email);
            authLogger.warn(`Failed login attempt (wrong password): ${email}. Remaining: ${remaining}`);
            
            // Log failed login attempt
            await AuditLogger.log({
                adminId: user._id,
                adminName: user.name,
                action: 'LOGIN',
                entityType: 'Auth',
                status: 'FAILED',
                errorMessage: 'Invalid password',
                details: `Remaining attempts: ${remaining}`
            });
            
            throw new Error('Invalid email or password');
        }

        // Successful login
        rateLimiter.recordAttempt(email, true);
        // Clear any stale rate‑limit entry after successful login
        rateLimiter.clear(email);

        // Log successful login
        await AuditLogger.log({
            adminId: user._id,
            adminName: user.name,
            action: 'LOGIN',
            entityType: 'Auth',
            status: 'SUCCESS'
        });

        authLogger.info(`Successful login: ${email}`);

        const token = generateToken(user);
        store.set('auth_token', token);

        return {
            user: {
                _id: user._id.toString(),
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            },
            token
        };
    } catch (error) {
        defaultLogger.error(`Login failed: ${error.message}`);
        throw error;
    }
}

async function getCurrentUser() {
    const token = store.get('auth_token');
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await Admin.findOne({ _id: decoded.id, is_deleted: 0 });
        if (user) {
            return {
                _id: user._id.toString(),
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            };
        }
        return null;
    } catch (error) {
        store.delete('auth_token');
        return null;
    }
}

async function logout() {
    store.delete('auth_token');
}

async function changePassword(adminId, currentPassword, newPassword) {
    try {
        if (!adminId || !currentPassword || !newPassword) {
            throw new Error('All fields are required');
        }

        if (newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters');
        }

        const admin = await Admin.findOne({ _id: adminId, is_deleted: 0 });
        if (!admin) throw new Error('Admin not found');

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isValid) throw new Error('Current password is incorrect');

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await Admin.findByIdAndUpdate(adminId, { password: hashedPassword });
        defaultLogger.info(`Password changed for admin: ${admin.email}`);

        return { success: true, message: 'Password changed successfully' };
    } catch (error) {
        defaultLogger.error(`Password change failed: ${error.message}`);
        throw error;
    }
}

module.exports = { registerAdmin, loginAdmin, getCurrentUser, logout, changePassword };
