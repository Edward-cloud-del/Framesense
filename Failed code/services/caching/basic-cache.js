import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Redis Basic Cache Infrastructure
 * MOMENT 4.1: Redis Cache Setup with connection pooling, persistence, and monitoring
 */
class BasicCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    
    // Connection pool configuration
    this.poolConfig = {
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        connectTimeout: 5000,
        lazyConnect: true,
        reconnectStrategy: (retries) => {
          if (retries > this.maxRetries) {
            console.warn('⚠️ Redis: Max reconnection attempts reached, running without cache');
            return false;
          }
          // Less aggressive reconnection: 5s, 15s, 30s
          const delay = Math.min(retries * 5000, 30000);
          console.log(`🔄 Redis: Reconnecting in ${delay/1000}s... (attempt ${retries}/${this.maxRetries})`);
          return delay;
        }
      },
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DB || '0'),
      
      // Connection pooling settings
      isolationPoolOptions: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 5000,
        idleTimeoutMillis: 30000
      }
    };
    
    // Monitoring metrics
    this.metrics = {
      connections: 0,
      disconnections: 0,
      errors: 0,
      commands: 0,
      hits: 0,
      misses: 0,
      totalResponseTime: 0,
      lastError: null,
      startTime: Date.now()
    };
    
    this.initialize();
  }
  
  /**
   * Initialize Redis connection with error handling (non-blocking)
   */
  async initialize() {
    try {
      console.log('🔄 Initializing Redis cache connection...');
      
      this.client = createClient(this.poolConfig);
      
      // Connection event listeners for monitoring
      this.client.on('connect', () => {
        console.log('✅ Redis: Connection established');
        this.isConnected = true;
        this.metrics.connections++;
        this.connectionAttempts = 0;
      });
      
      this.client.on('disconnect', () => {
        console.log('⚠️ Redis: Connection lost');
        this.isConnected = false;
        this.metrics.disconnections++;
      });
      
      this.client.on('error', (error) => {
        // Only log the first few errors to avoid spam
        if (this.metrics.errors < 3) {
          console.warn('⚠️ Redis Error (running without cache):', error.message);
        }
        this.metrics.errors++;
        this.metrics.lastError = error.message;
        this.isConnected = false;
      });
      
      this.client.on('reconnecting', () => {
        // Reconnection logging is handled in reconnectStrategy
        this.connectionAttempts++;
      });
      
      this.client.on('ready', () => {
        console.log('🚀 Redis: Client ready for commands');
        this.configurePersistence();
      });
      
      // Connect to Redis (non-blocking)
      this.client.connect().catch(error => {
        console.warn('⚠️ Redis connection failed (running without cache):', error.message);
        this.isConnected = false;
        this.metrics.lastError = error.message;
      });
      
    } catch (error) {
      console.warn('⚠️ Redis initialization failed (running without cache):', error.message);
      this.metrics.errors++;
      this.metrics.lastError = error.message;
      this.isConnected = false;
    }
  }
  
  /**
   * Configure Redis persistence settings
   */
  async configurePersistence() {
    try {
      // Configure persistence settings for production
      if (process.env.NODE_ENV === 'production') {
        // RDB snapshots - save every 15 minutes if at least 1 key changed
        await this.client.configSet('save', '900 1');
        
        // AOF (Append Only File) for durability
        await this.client.configSet('appendonly', 'yes');
        await this.client.configSet('appendfsync', 'everysec');
        
        console.log('✅ Redis persistence configured for production');
      } else {
        console.log('ℹ️ Redis persistence: Development mode - minimal settings');
      }
      
      // Set memory policy for cache eviction
      await this.client.configSet('maxmemory-policy', 'allkeys-lru');
      
    } catch (error) {
      console.error('⚠️ Redis persistence configuration failed:', error.message);
    }
  }
  
  /**
   * Get value from cache with monitoring
   */
  async get(key) {
    if (!this.isConnected) {
      console.warn('⚠️ Redis not connected, returning null');
      return null;
    }
    
    const startTime = Date.now();
    
    try {
      this.metrics.commands++;
      const value = await this.client.get(key);
      
      const responseTime = Date.now() - startTime;
      this.metrics.totalResponseTime += responseTime;
      
      if (value !== null) {
        this.metrics.hits++;
        console.log(`🎯 Cache HIT for key: ${key} (${responseTime}ms)`);
        return JSON.parse(value);
      } else {
        this.metrics.misses++;
        console.log(`❌ Cache MISS for key: ${key} (${responseTime}ms)`);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Redis GET error for key ${key}:`, error.message);
      this.metrics.errors++;
      return null;
    }
  }
  
  /**
   * Set value in cache with TTL and monitoring
   */
  async set(key, value, ttlSeconds = 3600) {
    if (!this.isConnected) {
      console.warn('⚠️ Redis not connected, skipping cache set');
      return false;
    }
    
    const startTime = Date.now();
    
    try {
      this.metrics.commands++;
      const serializedValue = JSON.stringify(value);
      
      if (ttlSeconds > 0) {
        await this.client.setEx(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      
      const responseTime = Date.now() - startTime;
      this.metrics.totalResponseTime += responseTime;
      
      console.log(`✅ Cache SET for key: ${key} (TTL: ${ttlSeconds}s, ${responseTime}ms)`);
      return true;
      
    } catch (error) {
      console.error(`❌ Redis SET error for key ${key}:`, error.message);
      this.metrics.errors++;
      return false;
    }
  }
  
  /**
   * Delete key from cache
   */
  async del(key) {
    if (!this.isConnected) {
      console.warn('⚠️ Redis not connected, skipping cache delete');
      return false;
    }
    
    try {
      this.metrics.commands++;
      const result = await this.client.del(key);
      console.log(`🗑️ Cache DELETE for key: ${key} (deleted: ${result})`);
      return result > 0;
      
    } catch (error) {
      console.error(`❌ Redis DELETE error for key ${key}:`, error.message);
      this.metrics.errors++;
      return false;
    }
  }
  
  /**
   * Check if key exists in cache
   */
  async exists(key) {
    if (!this.isConnected) return false;
    
    try {
      this.metrics.commands++;
      const exists = await this.client.exists(key);
      return exists === 1;
      
    } catch (error) {
      console.error(`❌ Redis EXISTS error for key ${key}:`, error.message);
      this.metrics.errors++;
      return false;
    }
  }
  
  /**
   * Set TTL for existing key
   */
  async expire(key, ttlSeconds) {
    if (!this.isConnected) return false;
    
    try {
      this.metrics.commands++;
      const result = await this.client.expire(key, ttlSeconds);
      return result === 1;
      
    } catch (error) {
      console.error(`❌ Redis EXPIRE error for key ${key}:`, error.message);
      this.metrics.errors++;
      return false;
    }
  }
  
  /**
   * Get keys matching pattern
   */
  async keys(pattern) {
    if (!this.isConnected) return [];
    
    try {
      this.metrics.commands++;
      return await this.client.keys(pattern);
      
    } catch (error) {
      console.error(`❌ Redis KEYS error for pattern ${pattern}:`, error.message);
      this.metrics.errors++;
      return [];
    }
  }
  
  /**
   * Delete keys matching pattern
   */
  async deletePattern(pattern) {
    if (!this.isConnected) return 0;
    
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      
      this.metrics.commands++;
      const result = await this.client.del(keys);
      console.log(`🗑️ Cache DELETE PATTERN: ${pattern} (deleted: ${result} keys)`);
      return result;
      
    } catch (error) {
      console.error(`❌ Redis DELETE PATTERN error for ${pattern}:`, error.message);
      this.metrics.errors++;
      return 0;
    }
  }
  
  /**
   * Get cache performance metrics
   */
  getMetrics() {
    const uptime = (Date.now() - this.metrics.startTime) / 1000;
    const hitRate = this.metrics.hits + this.metrics.misses > 0 
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100 
      : 0;
    
    const avgResponseTime = this.metrics.commands > 0 
      ? this.metrics.totalResponseTime / this.metrics.commands 
      : 0;
    
    return {
      isConnected: this.isConnected,
      uptime: Math.round(uptime),
      commands: this.metrics.commands,
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      errors: this.metrics.errors,
      connections: this.metrics.connections,
      disconnections: this.metrics.disconnections,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      lastError: this.metrics.lastError
    };
  }
  
  /**
   * Health check for monitoring
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', reason: 'Not connected' };
      }
      
      const start = Date.now();
      await this.client.ping();
      const pingTime = Date.now() - start;
      
      const info = await this.client.info('memory');
      const usedMemory = info.match(/used_memory:(\d+)/)?.[1];
      
      return {
        status: 'healthy',
        pingTime,
        usedMemory: usedMemory ? parseInt(usedMemory) : null,
        metrics: this.getMetrics()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        reason: error.message,
        metrics: this.getMetrics()
      };
    }
  }
  
  /**
   * Graceful shutdown
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      console.log('🔄 Closing Redis connection...');
      await this.client.disconnect();
      console.log('✅ Redis connection closed');
    }
  }
  
  /**
   * Force reconnection
   */
  async reconnect() {
    console.log('🔄 Forcing Redis reconnection...');
    await this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.initialize();
  }
}

// Create and export singleton instance
const basicCache = new BasicCache();

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down Redis cache...');
  await basicCache.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down Redis cache...');
  await basicCache.disconnect();
  process.exit(0);
});

export default basicCache; 