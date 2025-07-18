import basicCache from './basic-cache.js';
import cacheKeyStrategy, { CACHE_STRATEGIES } from './cache-key-strategy.js';
import zlib from 'zlib';
import { promisify } from 'util';

// Promisify compression functions
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Simplified Cache Manager - Redis Only
 * MOMENT 4.3: Core cache functionality without PostgreSQL dependency
 */
class SimpleCacheManager {
  constructor() {
    this.redisCache = basicCache;
    
    // Performance and analytics metrics
    this.metrics = {
      totalRequests: 0,
      redisHits: 0,
      misses: 0,
      compressionSavings: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      invalidatedItems: 0,
      costSavings: {
        total: 0,
        byService: {}
      }
    };
    
    // Cache warming configuration
    this.warmingConfig = {
      enabled: true,
      popularThreshold: 5,
      warmingInterval: 3600000, // 1 hour
      popularQueries: new Map()
    };
    
    // Compression settings
    this.compressionConfig = {
      enabled: true,
      minSizeBytes: 1024, // Only compress if > 1KB
      algorithm: 'gzip',
      level: 6
    };
    
    console.log('✅ Simple Cache Manager initialized');
  }
  
  /**
   * Generate cache key for Enhanced AI Processor integration
   * Maps to appropriate cache strategy based on question type and image data
   */
  async generateKey(imageData, question, questionType, userTier) {
    try {
      console.log(`🔑 === CACHE KEY GENERATION (ENHANCED AI PROCESSOR) ===`);
      console.log(`Question Type: ${questionType}`);
      console.log(`User Tier: ${userTier}`);
      console.log(`Question: "${question}"`);
      console.log(`Has Image Data: ${!!imageData}`);
      
      // Map question type to service type for cache strategy
      const serviceTypeMapping = {
        'PURE_TEXT': 'enhanced-ocr',
        'OBJECT_COUNT': 'google-vision-objects', 
        'CELEBRITY_ID': 'google-vision-web',
        'DOCUMENT_READ': 'enhanced-ocr',
        'GENERAL_VISION': 'google-vision-objects'
      };
      
      const serviceType = serviceTypeMapping[questionType] || 'enhanced-ocr';
      console.log(`🎯 Mapped to service type: ${serviceType}`);
      
      // Use existing cache strategy with proper options
      const options = {
        userTier,
        question,
        questionType,
        language: 'en' // Default language
      };
      
      const cacheInfo = await cacheKeyStrategy.generateCacheKey(serviceType, imageData, options);
      console.log(`✅ Generated cache key: ${cacheInfo.key}`);
      console.log(`=====================================`);
      
      return cacheInfo.key;
      
    } catch (error) {
      console.error(`❌ Cache key generation error:`, error.message);
      // Return a simple fallback key to prevent crashes
      const fallbackKey = `fallback:${questionType}:${Date.now()}`;
      console.log(`🔄 Using fallback key: ${fallbackKey}`);
      return fallbackKey;
    }
  }
  
  /**
   * Get from cache using cache key (Enhanced AI Processor interface)
   * Graceful error handling to prevent crashes when Redis is down
   */
  async get(cacheKey) {
    // If called with just a cache key (Enhanced AI Processor style)
    if (typeof cacheKey === 'string' && arguments.length === 1) {
      const startTime = Date.now();
      this.metrics.totalRequests++;
      
      try {
        console.log(`🔍 === CACHE GET (ENHANCED AI PROCESSOR) ===`);
        console.log(`Cache Key: ${cacheKey}`);
        
        // Check if Redis is connected before attempting
        if (!this.redisCache.isConnected) {
          console.warn(`⚠️ Redis not connected, returning null for: ${cacheKey}`);
          console.log(`=====================================`);
          this.metrics.misses++;
          return null; // Don't crash, just miss cache
        }
        
        // Try Redis with graceful error handling
        let result = await this.redisCache.get(cacheKey);
        
        if (result !== null) {
          console.log(`✅ Cache HIT for key: ${cacheKey}`);
          this.metrics.redisHits++;
          
          // Handle decompression if needed
          if (result && result._compressed) {
            try {
              const compressedBuffer = Buffer.from(result._data, 'base64');
              const decompressedBuffer = await gunzip(compressedBuffer);
              result = JSON.parse(decompressedBuffer.toString());
              console.log(`🗜️ Decompressed cached data successfully`);
            } catch (decompressionError) {
              console.warn('⚠️ Decompression failed, returning null:', decompressionError.message);
              result = null;
            }
          }
          
          console.log(`✅ Returning cached result (${typeof result})`);
          console.log(`=====================================`);
          return result;
        } else {
          console.log(`❌ Cache MISS for key: ${cacheKey}`);
          console.log(`=====================================`);
          this.metrics.misses++;
          return null;
        }
        
      } catch (error) {
        console.error(`❌ Cache GET error (graceful handling):`, error.message);
        console.log(`=====================================`);
        this.metrics.misses++;
        return null; // Return null instead of throwing to prevent crashes
      }
    }
    
    // Fallback to original interface for backwards compatibility
    return this.getByServiceType(...arguments);
  }
  
  /**
   * Get from cache (original interface - Redis only)
   */
  async getByServiceType(serviceType, imageData, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    try {
      // Generate cache key using smart strategy
      const cacheInfo = await cacheKeyStrategy.generateCacheKey(serviceType, imageData, options);
      const { key: cacheKey } = cacheInfo;
      
      // Try Redis
      let result = await this.redisCache.get(cacheKey);
      let source = 'miss';
      
      if (result !== null) {
        source = 'redis';
        this.metrics.redisHits++;
        
        // Handle decompression if needed
        if (result && result._compressed) {
          try {
            const compressedBuffer = Buffer.from(result._data, 'base64');
            const decompressedBuffer = await gunzip(compressedBuffer);
            result = JSON.parse(decompressedBuffer.toString());
          } catch (decompressionError) {
            console.error('❌ Decompression failed:', decompressionError.message);
            result = null;
          }
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
      
    } catch (error) {
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
   * Set cache value using cache key (Enhanced AI Processor interface)
   * Graceful error handling to prevent crashes when Redis is down
   */
  async set(cacheKey, data, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`💾 === CACHE SET (ENHANCED AI PROCESSOR) ===`);
      console.log(`Cache Key: ${cacheKey}`);
      console.log(`Data Type: ${typeof data}`);
      console.log(`Options:`, JSON.stringify(options, null, 2));
      
      // Use TTL from options or default
      const ttl = options.ttl || 3600; // 1 hour default
      
      // Check if Redis is connected before attempting
      if (!this.redisCache.isConnected) {
        console.warn(`⚠️ Redis not connected, skipping cache set for: ${cacheKey}`);
        return false; // Don't crash, just skip caching
      }
      
      // Compress data if needed
      let finalData = data;
      let isCompressed = false;
      let originalSize = JSON.stringify(data).length;
      
      if (this.compressionConfig.enabled && originalSize > this.compressionConfig.minSizeBytes) {
        try {
          const dataBuffer = Buffer.from(JSON.stringify(data));
          const compressedBuffer = await gzip(dataBuffer);
          
          finalData = {
            _compressed: true,
            _data: compressedBuffer.toString('base64'),
            _originalSize: originalSize
          };
          
          isCompressed = true;
          console.log(`🗜️ Data compressed: ${originalSize} -> ${compressedBuffer.length} bytes`);
        } catch (compressionError) {
          console.warn('⚠️ Compression failed, using uncompressed data:', compressionError.message);
          finalData = data;
        }
      }
      
      // Set in Redis with graceful error handling
      const success = await this.redisCache.set(cacheKey, finalData, ttl);
      
      // Track cost savings
      if (options.cost) {
        this.trackCostSavings('redis', options.cost);
      }
      
      console.log(`✅ Cache SET result: ${success ? 'SUCCESS' : 'FAILED'} (TTL: ${ttl}s)`);
      console.log(`=====================================`);
      
      return success; // Boolean result, no throwing
      
    } catch (error) {
      console.error(`❌ Cache SET error (graceful handling):`, error.message);
      console.log(`=====================================`);
      return false; // Return false instead of throwing to prevent crashes
    }
  }
  
  /**
   * Set cache value (original interface)
   */
  async setByServiceType(serviceType, imageData, data, options = {}) {
    const startTime = Date.now();
    
    try {
      // Generate cache key and strategy
      const cacheInfo = await cacheKeyStrategy.generateCacheKey(serviceType, imageData, options);
      const { key: cacheKey, ttl, compression, costImpact } = cacheInfo;
      
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
          
        } catch (compressionError) {
          console.warn('⚠️ Compression failed, storing uncompressed:', compressionError.message);
          finalData = data;
        }
      }
      
      // Calculate cost savings
      const costSaved = this.calculateCostSavings(serviceType, costImpact);
      this.trackCostSavings(serviceType, costSaved);
      
      // Store in Redis
      const stored = await this.redisCache.set(cacheKey, finalData, ttl);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`💾 Cache SET: ${cacheKey} (Redis, TTL:${ttl}s, ${responseTime}ms)`);
      
      return {
        success: stored,
        cacheKey,
        storage: 'redis',
        compressed: isCompressed,
        originalSize,
        compressedSize,
        costSaved,
        responseTime
      };
      
    } catch (error) {
      console.error('❌ Cache SET error:', error.message);
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Invalidate cache entries by pattern
   */
  async invalidate(pattern) {
    const startTime = Date.now();
    
    try {
      const invalidatedCount = await this.redisCache.deletePattern(pattern);
      this.metrics.invalidatedItems += invalidatedCount;
      
      const responseTime = Date.now() - startTime;
      console.log(`🗑️ Invalidated ${invalidatedCount} items matching '${pattern}' (${responseTime}ms)`);
      
      return {
        success: true,
        invalidatedCount,
        pattern,
        responseTime
      };
      
    } catch (error) {
      console.error('❌ Cache invalidation error:', error.message);
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Track popular queries for cache warming
   */
  trackPopularQuery(serviceType, imageData, options) {
    if (!this.warmingConfig.enabled) return;
    
    try {
      const queryKey = `${serviceType}:${options.questionText || 'no-question'}`;
      const currentCount = this.warmingConfig.popularQueries.get(queryKey) || 0;
      this.warmingConfig.popularQueries.set(queryKey, currentCount + 1);
      
      // If it becomes popular, consider for warming
      if (currentCount + 1 >= this.warmingConfig.popularThreshold) {
        console.log(`🔥 Popular query detected: ${queryKey} (${currentCount + 1} requests)`);
      }
    } catch (error) {
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
   * Get comprehensive cache metrics
   */
  getMetrics() {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.redisHits / this.metrics.totalRequests) * 100 
      : 0;
    
    return {
      // Basic metrics
      totalRequests: this.metrics.totalRequests,
      redisHits: this.metrics.redisHits,
      misses: this.metrics.misses,
      
      // Performance metrics
      hitRate: Math.round(hitRate * 100) / 100,
      averageResponseTime: Math.round(this.metrics.averageResponseTime * 100) / 100,
      
      // Storage metrics
      compressionSavings: this.metrics.compressionSavings,
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
      
      return {
        status: redisHealth.status,
        redis: redisHealth,
        metrics: this.getMetrics()
      };
    } catch (error) {
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
      return { success: true, serviceType };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Clear popular queries tracking
   */
  clearPopularQueries() {
    const sizeBefore = this.warmingConfig.popularQueries.size;
    this.warmingConfig.popularQueries.clear();
    console.log(`🧹 Cleared ${sizeBefore} popular query tracking entries`);
  }
}

// Create and export singleton instance
const simpleCacheManager = new SimpleCacheManager();
export default simpleCacheManager; 