import basicCache from './basic-cache.js';
import cacheKeyStrategy, { CACHE_STRATEGIES } from './cache-key-strategy.js';
import pool, { query } from '../../database/connection.js';
import zlib from 'zlib';
import { promisify } from 'util';
// Promisify compression functions
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
/**
 * Comprehensive Cache Manager
 * MOMENT 4.3: Multi-layer cache with Redis + PostgreSQL, compression, and warming
 */
class CacheManager {
    constructor() {
        this.redisCache = basicCache;
        this.dbPool = pool;
        // Performance and analytics metrics
        this.metrics = {
            totalRequests: 0,
            redisHits: 0,
            postgresHits: 0,
            misses: 0,
            compressionSavings: 0,
            averageResponseTime: 0,
            totalResponseTime: 0,
            warmedCacheItems: 0,
            invalidatedItems: 0,
            storageUsage: {
                redis: 0,
                postgres: 0
            },
            costSavings: {
                total: 0,
                byService: {}
            }
        };
        // Cache warming configuration
        this.warmingConfig = {
            enabled: true,
            popularThreshold: 5, // Number of requests to consider popular
            warmingInterval: 3600000, // 1 hour
            maxWarmItems: 100,
            popularQueries: new Map()
        };
        // Compression settings
        this.compressionConfig = {
            enabled: true,
            minSizeBytes: 1024, // Only compress if > 1KB
            algorithm: 'gzip',
            level: 6 // Balanced compression/speed
        };
        this.initialize();
    }
    /**
     * Initialize cache manager
     */
    async initialize() {
        try {
            console.log('🔄 Initializing Cache Manager...');
            // Create cache tables if they don't exist
            await this.createCacheTables();
            // Start cache warming if enabled
            if (this.warmingConfig.enabled) {
                this.startCacheWarming();
            }
            // Set up cleanup intervals
            this.startCleanupTasks();
            console.log('✅ Cache Manager initialized successfully');
        }
        catch (error) {
            console.error('❌ Cache Manager initialization failed:', error.message);
        }
    }
    /**
     * Create PostgreSQL cache tables for persistent storage
     */
    async createCacheTables() {
        try {
            const createTableQuery = `
        CREATE TABLE IF NOT EXISTS cache_storage (
          cache_key VARCHAR(255) PRIMARY KEY,
          data BYTEA NOT NULL,
          compressed BOOLEAN DEFAULT FALSE,
          service_type VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          access_count INTEGER DEFAULT 1,
          last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          data_size INTEGER DEFAULT 0,
          cost_saved DECIMAL(10,4) DEFAULT 0
        );
        
        CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache_storage(expires_at);
        CREATE INDEX IF NOT EXISTS idx_cache_service_type ON cache_storage(service_type);
        CREATE INDEX IF NOT EXISTS idx_cache_last_accessed ON cache_storage(last_accessed);
      `;
            await query(createTableQuery);
            console.log('✅ Cache tables created/verified');
        }
        catch (error) {
            console.error('❌ Failed to create cache tables:', error.message);
        }
    }
    /**
     * Generate cache key for Enhanced AI Processor integration
     * Maps to appropriate cache strategy based on question type and image data
     */
    async generateKey(imageData, question, questionType, userTier) {
        try {
            console.log(`🔑 === CACHE KEY GENERATION ===`);
            console.log(`Question Type: ${questionType}`);
            console.log(`User Tier: ${userTier}`);
            console.log(`Question: ${question}`);
            console.log(`=============================`);
            // Map question types to cache strategies
            const serviceTypeMapping = {
                'PURE_TEXT': 'OCR_RESULTS',
                'COUNT_OBJECTS': 'GOOGLE_VISION_OBJECTS',
                'DETECT_OBJECTS': 'GOOGLE_VISION_OBJECTS',
                'IDENTIFY_CELEBRITY': 'GOOGLE_VISION_WEB',
                'DESCRIBE_SCENE': 'OPENAI_RESPONSES',
                'CUSTOM_ANALYSIS': 'OPENAI_RESPONSES'
            };
            const serviceType = serviceTypeMapping[questionType] || 'OPENAI_RESPONSES';
            console.log(`🎯 Mapped to service type: ${serviceType}`);
            // Use cache key strategy to generate the key
            let cacheKey;
            if (serviceType === 'OPENAI_RESPONSES') {
                cacheKey = await cacheKeyStrategy.generateOpenAIKey(imageData, question);
            }
            else {
                cacheKey = await cacheKeyStrategy.generateCacheKey(serviceType, imageData, {
                    language: 'en', // Default language
                    questionText: question,
                    userTier: userTier
                });
            }
            console.log(`✅ Generated cache key: ${cacheKey}`);
            return cacheKey;
        }
        catch (error) {
            console.error(`❌ Cache key generation failed:`, error.message);
            // Fallback to simple key
            return `fallback:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
        }
    }
    /**
     * Get from cache (multi-layer lookup)
     */
    async get(serviceType, imageData, options = {}) {
        const startTime = Date.now();
        this.metrics.totalRequests++;
        try {
            // Generate cache key using smart strategy
            const cacheInfo = await cacheKeyStrategy.generateCacheKey(serviceType, imageData, options);
            const { key: cacheKey, storage, compression } = cacheInfo;
            let result = null;
            let source = 'miss';
            // Try Redis first (faster lookup)
            result = await this.redisCache.get(cacheKey);
            if (result !== null) {
                source = 'redis';
                this.metrics.redisHits++;
                await this.updateAccessStats(cacheKey, 'redis');
            }
            // If not in Redis, try PostgreSQL for persistent storage
            if (result === null && storage === 'postgres') {
                result = await this.getFromPostgres(cacheKey);
                if (result !== null) {
                    source = 'postgres';
                    this.metrics.postgresHits++;
                    // Promote to Redis for faster future access
                    await this.promoteToRedis(cacheKey, result, cacheInfo);
                    await this.updateAccessStats(cacheKey, 'postgres');
                }
            }
            // Track cache miss
            if (result === null) {
                this.metrics.misses++;
                this.trackPopularQuery(serviceType, imageData, options);
            }
            // Update metrics
            const responseTime = Date.now() - startTime;
            this.updateResponseTimeMetrics(responseTime);
            console.log(`📊 Cache ${source.toUpperCase()}: ${cacheKey} (${responseTime}ms)`);
            return {
                data: result,
                cached: result !== null,
                source,
                responseTime,
                cacheKey
            };
        }
        catch (error) {
            console.error('❌ Cache GET error:', error.message);
            const responseTime = Date.now() - startTime;
            this.updateResponseTimeMetrics(responseTime);
            return {
                data: null,
                cached: false,
                source: 'error',
                responseTime,
                error: error.message
            };
        }
    }
    /**
     * Set cache value with intelligent storage selection
     */
    async set(serviceType, imageData, data, options = {}) {
        const startTime = Date.now();
        try {
            // Generate cache key and strategy
            const cacheInfo = await cacheKeyStrategy.generateCacheKey(serviceType, imageData, options);
            const { key: cacheKey, ttl, storage, compression, costImpact } = cacheInfo;
            // Compress data if needed
            let finalData = data;
            let isCompressed = false;
            let originalSize = JSON.stringify(data).length;
            let compressedSize = originalSize;
            if (compression && this.compressionConfig.enabled && originalSize > this.compressionConfig.minSizeBytes) {
                try {
                    const jsonString = JSON.stringify(data);
                    const compressedBuffer = await gzip(jsonString);
                    finalData = {
                        _compressed: true,
                        _algorithm: 'gzip',
                        _data: compressedBuffer.toString('base64')
                    };
                    compressedSize = compressedBuffer.length;
                    isCompressed = true;
                    const savingsPercent = ((originalSize - compressedSize) / originalSize) * 100;
                    this.metrics.compressionSavings += (originalSize - compressedSize);
                    console.log(`🗜️ Compressed cache data: ${originalSize} → ${compressedSize} bytes (${savingsPercent.toFixed(1)}% saved)`);
                }
                catch (compressionError) {
                    console.warn('⚠️ Compression failed, storing uncompressed:', compressionError.message);
                    finalData = data;
                }
            }
            // Calculate cost savings
            const costSaved = this.calculateCostSavings(serviceType, costImpact);
            this.trackCostSavings(serviceType, costSaved);
            // Store in appropriate storage layer
            let stored = false;
            if (storage === 'postgres') {
                // Store in PostgreSQL for persistent caching
                stored = await this.setInPostgres(cacheKey, finalData, {
                    serviceType,
                    ttl,
                    compressed: isCompressed,
                    dataSize: compressedSize,
                    costSaved
                });
                // Also cache in Redis for faster access (shorter TTL)
                const redisTTL = Math.min(ttl, 3600); // Max 1 hour in Redis
                await this.redisCache.set(cacheKey, finalData, redisTTL);
            }
            else {
                // Store in Redis
                stored = await this.redisCache.set(cacheKey, finalData, ttl);
            }
            const responseTime = Date.now() - startTime;
            console.log(`💾 Cache SET: ${cacheKey} (${storage}, TTL:${ttl}s, ${responseTime}ms)`);
            return {
                success: stored,
                cacheKey,
                storage,
                compressed: isCompressed,
                originalSize,
                compressedSize,
                costSaved,
                responseTime
            };
        }
        catch (error) {
            console.error('❌ Cache SET error:', error.message);
            return {
                success: false,
                error: error.message,
                responseTime: Date.now() - startTime
            };
        }
    }
    /**
     * Get from PostgreSQL with decompression
     */
    async getFromPostgres(cacheKey) {
        try {
            const postgresQuery = `
        SELECT data, compressed, expires_at 
        FROM cache_storage 
        WHERE cache_key = $1 AND expires_at > NOW()
      `;
            const result = await query(postgresQuery, [cacheKey]);
            if (result.rows.length === 0) {
                return null;
            }
            let data = result.rows[0].data;
            const isCompressed = result.rows[0].compressed;
            // Parse the data
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
            // Decompress if needed
            if (isCompressed && data._compressed) {
                try {
                    const compressedBuffer = Buffer.from(data._data, 'base64');
                    const decompressedBuffer = await gunzip(compressedBuffer);
                    data = JSON.parse(decompressedBuffer.toString());
                }
                catch (decompressionError) {
                    console.error('❌ Decompression failed:', decompressionError.message);
                    return null;
                }
            }
            return data;
        }
        catch (error) {
            console.error('❌ PostgreSQL cache GET error:', error.message);
            return null;
        }
    }
    /**
     * Set in PostgreSQL with compression tracking
     */
    async setInPostgres(cacheKey, data, metadata) {
        try {
            const expiresAt = new Date(Date.now() + (metadata.ttl * 1000));
            const insertQuery = `
        INSERT INTO cache_storage (
          cache_key, data, compressed, service_type, expires_at, data_size, cost_saved
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (cache_key) 
        DO UPDATE SET 
          data = $2, 
          compressed = $3, 
          expires_at = $5, 
          data_size = $6,
          cost_saved = $7,
          access_count = cache_storage.access_count + 1,
          last_accessed = CURRENT_TIMESTAMP
      `;
            await query(insertQuery, [
                cacheKey,
                JSON.stringify(data),
                metadata.compressed,
                metadata.serviceType,
                expiresAt,
                metadata.dataSize,
                metadata.costSaved
            ]);
            return true;
        }
        catch (error) {
            console.error('❌ PostgreSQL cache SET error:', error.message);
            return false;
        }
    }
    /**
     * Promote frequently accessed items from PostgreSQL to Redis
     */
    async promoteToRedis(cacheKey, data, cacheInfo) {
        try {
            const redisTTL = Math.min(cacheInfo.ttl, 3600); // Max 1 hour in Redis
            await this.redisCache.set(cacheKey, data, redisTTL);
            console.log(`⬆️ Promoted to Redis: ${cacheKey} (TTL: ${redisTTL}s)`);
        }
        catch (error) {
            console.warn('⚠️ Failed to promote to Redis:', error.message);
        }
    }
    /**
     * Invalidate cache entries by pattern
     */
    async invalidate(pattern) {
        const startTime = Date.now();
        let invalidatedCount = 0;
        try {
            // Invalidate from Redis
            const redisCount = await this.redisCache.deletePattern(pattern);
            invalidatedCount += redisCount;
            // Invalidate from PostgreSQL
            const postgresQuery = `
        DELETE FROM cache_storage 
        WHERE cache_key LIKE $1
      `;
            const postgresResult = await query(postgresQuery, [pattern.replace('*', '%')]);
            invalidatedCount += postgresResult.rowCount || 0;
            this.metrics.invalidatedItems += invalidatedCount;
            const responseTime = Date.now() - startTime;
            console.log(`🗑️ Invalidated ${invalidatedCount} items matching '${pattern}' (${responseTime}ms)`);
            return {
                success: true,
                invalidatedCount,
                pattern,
                responseTime
            };
        }
        catch (error) {
            console.error('❌ Cache invalidation error:', error.message);
            return {
                success: false,
                error: error.message,
                responseTime: Date.now() - startTime
            };
        }
    }
    /**
     * Update access statistics
     */
    async updateAccessStats(cacheKey, source) {
        if (source === 'postgres') {
            try {
                const updateQuery = `
          UPDATE cache_storage 
          SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP
          WHERE cache_key = $1
        `;
                await query(updateQuery, [cacheKey]);
            }
            catch (error) {
                console.warn('⚠️ Failed to update access stats:', error.message);
            }
        }
    }
    /**
     * Track popular queries for cache warming
     */
    trackPopularQuery(serviceType, imageData, options) {
        if (!this.warmingConfig.enabled)
            return;
        try {
            const queryKey = `${serviceType}:${options.questionText || 'no-question'}`;
            const currentCount = this.warmingConfig.popularQueries.get(queryKey) || 0;
            this.warmingConfig.popularQueries.set(queryKey, currentCount + 1);
            // If it becomes popular, consider for warming
            if (currentCount + 1 >= this.warmingConfig.popularThreshold) {
                console.log(`🔥 Popular query detected: ${queryKey} (${currentCount + 1} requests)`);
            }
        }
        catch (error) {
            console.warn('⚠️ Failed to track popular query:', error.message);
        }
    }
    /**
     * Calculate cost savings from cache hits
     */
    calculateCostSavings(serviceType, costImpact) {
        const costEstimates = {
            'high': 0.03, // OpenAI Vision, Celebrity ID
            'medium': 0.01, // Google Vision
            'low': 0.001 // OCR, simple operations
        };
        return costEstimates[costImpact] || 0.005;
    }
    /**
     * Track cost savings metrics
     */
    trackCostSavings(serviceType, costSaved) {
        this.metrics.costSavings.total += costSaved;
        if (!this.metrics.costSavings.byService[serviceType]) {
            this.metrics.costSavings.byService[serviceType] = 0;
        }
        this.metrics.costSavings.byService[serviceType] += costSaved;
    }
    /**
     * Update response time metrics
     */
    updateResponseTimeMetrics(responseTime) {
        this.metrics.totalResponseTime += responseTime;
        this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests;
    }
    /**
     * Start cache warming background process
     */
    startCacheWarming() {
        setInterval(() => {
            this.performCacheWarming();
        }, this.warmingConfig.warmingInterval);
        console.log(`🔥 Cache warming started (interval: ${this.warmingConfig.warmingInterval / 1000}s)`);
    }
    /**
     * Perform cache warming for popular queries
     */
    async performCacheWarming() {
        try {
            console.log('🔥 Starting cache warming cycle...');
            // Get most popular expired/missing cache entries from PostgreSQL
            const warmingQuery = `
        SELECT cache_key, service_type, access_count
        FROM cache_storage 
        WHERE expires_at < NOW() 
        ORDER BY access_count DESC 
        LIMIT $1
      `;
            const result = await query(warmingQuery, [this.warmingConfig.maxWarmItems]);
            if (result.rows.length > 0) {
                console.log(`🔥 Found ${result.rows.length} items for cache warming`);
                this.metrics.warmedCacheItems += result.rows.length;
            }
        }
        catch (error) {
            console.error('❌ Cache warming failed:', error.message);
        }
    }
    /**
     * Start cleanup background tasks
     */
    startCleanupTasks() {
        // Clean expired entries every hour
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 3600000);
        // Clean popular queries cache every 6 hours
        setInterval(() => {
            this.cleanupPopularQueries();
        }, 21600000);
        console.log('🧹 Cache cleanup tasks started');
    }
    /**
     * Clean up expired cache entries
     */
    async cleanupExpiredEntries() {
        try {
            const deleteQuery = `DELETE FROM cache_storage WHERE expires_at < NOW()`;
            const result = await query(deleteQuery);
            if (result.rowCount > 0) {
                console.log(`🧹 Cleaned up ${result.rowCount} expired cache entries`);
            }
        }
        catch (error) {
            console.error('❌ Cleanup failed:', error.message);
        }
    }
    /**
     * Clean up popular queries tracking
     */
    cleanupPopularQueries() {
        const sizeBefore = this.warmingConfig.popularQueries.size;
        this.warmingConfig.popularQueries.clear();
        console.log(`🧹 Cleared ${sizeBefore} popular query tracking entries`);
    }
    /**
     * Get comprehensive cache metrics
     */
    getMetrics() {
        const hitRate = this.metrics.totalRequests > 0
            ? ((this.metrics.redisHits + this.metrics.postgresHits) / this.metrics.totalRequests) * 100
            : 0;
        const redisHitRate = this.metrics.totalRequests > 0
            ? (this.metrics.redisHits / this.metrics.totalRequests) * 100
            : 0;
        const postgresHitRate = this.metrics.totalRequests > 0
            ? (this.metrics.postgresHits / this.metrics.totalRequests) * 100
            : 0;
        return {
            // Basic metrics
            totalRequests: this.metrics.totalRequests,
            redisHits: this.metrics.redisHits,
            postgresHits: this.metrics.postgresHits,
            misses: this.metrics.misses,
            // Performance metrics
            hitRate: Math.round(hitRate * 100) / 100,
            redisHitRate: Math.round(redisHitRate * 100) / 100,
            postgresHitRate: Math.round(postgresHitRate * 100) / 100,
            averageResponseTime: Math.round(this.metrics.averageResponseTime * 100) / 100,
            // Storage metrics
            compressionSavings: this.metrics.compressionSavings,
            warmedCacheItems: this.metrics.warmedCacheItems,
            invalidatedItems: this.metrics.invalidatedItems,
            // Cost metrics
            costSavings: this.metrics.costSavings,
            // Additional insights
            popularQueriesCount: this.warmingConfig.popularQueries.size,
            redisMetrics: this.redisCache.getMetrics(),
            cacheKeyMetrics: cacheKeyStrategy.getMetrics()
        };
    }
    /**
     * Health check for monitoring
     */
    async healthCheck() {
        try {
            const redisHealth = await this.redisCache.healthCheck();
            const postgresHealth = this.dbPool ? 'healthy' : 'unhealthy';
            return {
                status: redisHealth.status === 'healthy' && postgresHealth === 'healthy' ? 'healthy' : 'degraded',
                redis: redisHealth,
                postgres: { status: postgresHealth },
                metrics: this.getMetrics()
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                metrics: this.getMetrics()
            };
        }
    }
    /**
     * Force cache warming for specific service
     */
    async warmCache(serviceType, imageData, options = {}) {
        try {
            console.log(`🔥 Manual cache warming for ${serviceType}`);
            // This would trigger the actual service call to populate cache
            // Implementation depends on service integration
            return { success: true, serviceType };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
}
// Create and export singleton instance
const cacheManager = new CacheManager();
export default cacheManager;
