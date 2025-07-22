import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../database/connection.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';
class UserService {
    async createUser(email, password, name) {
        console.log('🔍 Creating user:', email, name);
        console.log('🔍 Email length:', email.length);
        console.log('🔍 Name length:', name.length);
        console.log('🔍 Password length:', password.length);
        // Check if user exists
        const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
        console.log('🔍 Existing user check result:', existingUser.rows.length, 'rows');
        if (existingUser.rows.length > 0) {
            throw new Error('User already exists');
        }
        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);
        console.log('🔍 Password hash length:', passwordHash.length);
        // Determine tier based on email - NEVER CREATE FREE ACCOUNTS
        let tier = 'premium'; // Default to premium tier (no more free accounts)
        if (email.includes('pro-user') || email.includes('pro@') || email.includes('test.dev')) {
            tier = 'pro';
            console.log('🎯 AUTO-ASSIGNED PRO TIER for test user:', email);
        }
        else if (email.includes('premium') || email.includes('admin') || email.includes('celebrity') || email.includes('vision')) {
            tier = 'premium';
            console.log('🎯 AUTO-ASSIGNED PREMIUM TIER for test user:', email);
        }
        else {
            // Default all new accounts to premium for testing premium features
            tier = 'premium';
            console.log('🎯 AUTO-ASSIGNED PREMIUM TIER (default) for user:', email);
        }
        // Insert user with proper tier
        console.log('🔍 Attempting to insert user with email length:', email.length, 'name length:', name.length, 'tier:', tier);
        const result = await query(`INSERT INTO users (email, name, password_hash, tier) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, email, name, tier, subscription_status, stripe_customer_id, 
                       usage_daily, usage_total, created_at, updated_at`, [email, name, passwordHash, tier]);
        const user = result.rows[0];
        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        // Save session
        await this.saveSession(user.id, token);
        return { ...user, token };
    }
    async loginUser(email, password) {
        // Get user
        const result = await query(`SELECT id, email, name, password_hash, tier, subscription_status, 
                    stripe_customer_id, usage_daily, usage_total, created_at, updated_at
             FROM users WHERE email = $1`, [email]);
        if (result.rows.length === 0) {
            throw new Error('Invalid credentials');
        }
        const user = result.rows[0];
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }
        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        // Save session
        await this.saveSession(user.id, token);
        // Remove password_hash from response
        const { password_hash, ...userWithoutPassword } = user;
        return { ...userWithoutPassword, token };
    }
    async verifyToken(token) {
        try {
            // Verify JWT
            const decoded = jwt.verify(token, JWT_SECRET);
            // Check if session exists and is not expired
            const sessionResult = await query(`SELECT s.id FROM user_sessions s 
                 WHERE s.user_id = $1 AND s.expires_at > NOW()`, [decoded.userId]);
            if (sessionResult.rows.length === 0) {
                throw new Error('Session expired');
            }
            // Get fresh user data
            const userResult = await query(`SELECT id, email, name, tier, subscription_status, stripe_customer_id,
                        usage_daily, usage_total, created_at, updated_at
                 FROM users WHERE id = $1`, [decoded.userId]);
            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }
            return userResult.rows[0];
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    async updateUserTier(email, tier, subscriptionStatus) {
        const updates = ['tier = $2'];
        const params = [email, tier];
        if (subscriptionStatus) {
            updates.push('subscription_status = $3');
            params.push(subscriptionStatus);
        }
        await query(`UPDATE users SET ${updates.join(', ')} WHERE email = $1`, params);
    }
    async updateUserStripeCustomerId(email, stripeCustomerId) {
        await query('UPDATE users SET stripe_customer_id = $2 WHERE email = $1', [email, stripeCustomerId]);
    }
    async getUserByStripeCustomerId(stripeCustomerId) {
        const result = await query(`SELECT id, email, name, tier, subscription_status, stripe_customer_id,
                    usage_daily, usage_total, created_at, updated_at
             FROM users WHERE stripe_customer_id = $1`, [stripeCustomerId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    async getUserById(userId) {
        const result = await query(`SELECT id, email, name, tier, subscription_status, stripe_customer_id,
                    usage_daily, usage_total, created_at, updated_at
             FROM users WHERE id = $1`, [userId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    async getUserByEmail(email) {
        const result = await query(`SELECT id, email, name, tier, subscription_status, stripe_customer_id,
                    usage_daily, usage_total, created_at, updated_at
             FROM users WHERE email = $1`, [email]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    async saveSession(userId, token) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await query('INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [userId, tokenHash, expiresAt]);
    }
    async logoutUser(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            await query('DELETE FROM user_sessions WHERE user_id = $1', [decoded.userId]);
        }
        catch (error) {
            // Token might be invalid, but that's okay for logout
        }
    }
    async cleanupExpiredSessions() {
        await query('DELETE FROM user_sessions WHERE expires_at < NOW()');
    }
}
export default new UserService();
