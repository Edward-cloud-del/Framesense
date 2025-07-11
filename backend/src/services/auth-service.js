import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, '../../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

class AuthService {
  async createUser(email, password, name) {
    try {
      // Read existing users
      const userData = await this.readUsers();
      
      // Check if user exists
      if (userData.users[email]) {
        throw new Error('User already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const user = {
        id: `user_${Date.now()}`,
        email,
        name,
        password: hashedPassword,
        tier: 'free',
        usage: { daily: 0, total: 0 },
        createdAt: new Date().toISOString(),
        stripeCustomerId: null
      };
      
      userData.users[email] = user;
      await this.writeUsers(userData);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      return { user: this.sanitizeUser(user), token };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async loginUser(email, password) {
    try {
      const userData = await this.readUsers();
      const user = userData.users[email];
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      return { user: this.sanitizeUser(user), token };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userData = await this.readUsers();
      const user = userData.users[decoded.email];
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getUserByEmail(email) {
    try {
      const userData = await this.readUsers();
      const user = userData.users[email];
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  async updateUser(email, updates) {
    try {
      const userData = await this.readUsers();
      const user = userData.users[email];
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Update user data
      Object.assign(user, updates);
      user.updatedAt = new Date().toISOString();
      
      userData.users[email] = user;
      await this.writeUsers(userData);
      
      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async readUsers() {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, create it
      const initialData = { users: {}, subscriptions: {} };
      await this.writeUsers(initialData);
      return initialData;
    }
  }

  async writeUsers(userData) {
    // Ensure data directory exists
    const dataDir = path.dirname(USERS_FILE);
    await fs.mkdir(dataDir, { recursive: true });
    
    await fs.writeFile(USERS_FILE, JSON.stringify(userData, null, 2));
  }

  sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

export default new AuthService(); 