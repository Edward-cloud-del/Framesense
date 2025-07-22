import crypto from 'crypto';
import imghash from 'imghash';
import sharp from 'sharp';
/**
 * Smart Cache Key Strategy Implementation
 * MOMENT 4.2: Intelligent cache key generation with perceptual hashing
 */
// Cache strategies per service type (from DAY 4 plan)
export const CACHE_STRATEGIES = {
    OCR_RESULTS: {
        keyPattern: 'ocr:{imageHash}:{lang}',
        ttl: 3600, // 1 hour
        compression: true,
        storage: 'redis',
        category: 'text-extraction',
        costImpact: 'low'
    },
    GOOGLE_VISION_OBJECTS: {
        keyPattern: 'gv:objects:{imageHash}',
        ttl: 21600, // 6 hours
        compression: true,
        storage: 'redis',
        category: 'object-detection',
        costImpact: 'medium'
    },
    GOOGLE_VISION_TEXT: {
        keyPattern: 'gv:text:{imageHash}:{lang}',
        ttl: 7200, // 2 hours
        compression: true,
        storage: 'redis',
        category: 'text-extraction',
        costImpact: 'low'
    },
    GOOGLE_VISION_WEB: {
        keyPattern: 'gv:web:{imageHash}',
        ttl: 604800, // 1 week - web entities change slowly
        compression: false,
        storage: 'postgres',
        category: 'web-detection',
        costImpact: 'medium'
    },
    GOOGLE_VISION_LOGO: {
        keyPattern: 'gv:logo:{imageHash}',
        ttl: 86400, // 24 hours
        compression: true,
        storage: 'redis',
        category: 'logo-detection',
        costImpact: 'low'
    },
    OPENAI_RESPONSES: {
        keyPattern: 'openai:{questionHash}:{imageHash}:{model}',
        ttl: 3600, // 1 hour - user questions are dynamic
        compression: true,
        storage: 'redis',
        category: 'ai-analysis',
        costImpact: 'high'
    },
    CELEBRITY_IDS: {
        keyPattern: 'celeb:{faceHash}',
        ttl: 2592000, // 30 days - celebrities don't change often
        compression: false,
        storage: 'postgres',
        category: 'celebrity-identification',
        costImpact: 'high'
    },
    ENHANCED_OCR: {
        keyPattern: 'eocr:{imageHash}:{method}:{lang}',
        ttl: 7200, // 2 hours
        compression: true,
        storage: 'redis',
        category: 'hybrid-ocr',
        costImpact: 'medium'
    },
    // Future open source APIs
    OPEN_SOURCE_API: {
        keyPattern: 'oss:{provider}:{model}:{imageHash}:{questionHash}',
        ttl: 1800, // 30 minutes - open source may be less stable
        compression: true,
        storage: 'redis',
        category: 'open-source',
        costImpact: 'low'
    }
};
/**
 * Cache Key Strategy Manager
 */
class CacheKeyStrategy {
    constructor() {
        // Image hash cache to avoid recomputing hashes
        this.imageHashCache = new Map();
        this.questionHashCache = new Map();
        // Performance metrics
        this.metrics = {
            hashComputations: 0,
            cacheHits: 0,
            hashCacheHits: 0,
            averageHashTime: 0
        };
    }
    /**
     * Generate perceptual hash for image duplicate detection
     * Uses pHash algorithm for visual similarity detection
     */
    async generateImageHash(imageData, method = 'phash') {
        const startTime = Date.now();
        try {
            // Check cache first
            const quickHash = crypto.createHash('sha256')
                .update(imageData)
                .digest('hex')
                .substring(0, 16);
            if (this.imageHashCache.has(quickHash)) {
                this.metrics.hashCacheHits++;
                return this.imageHashCache.get(quickHash);
            }
            // Convert to buffer if needed
            let imageBuffer = imageData;
            if (typeof imageData === 'string') {
                // Handle base64 data URLs
                if (imageData.startsWith('data:image/')) {
                    const base64Data = imageData.split(',')[1];
                    imageBuffer = Buffer.from(base64Data, 'base64');
                }
                else {
                    imageBuffer = Buffer.from(imageData, 'base64');
                }
            }
            // Normalize image for consistent hashing
            const normalizedBuffer = await sharp(imageBuffer)
                .resize(256, 256, { fit: 'inside', withoutEnlargement: false })
                .grayscale()
                .normalize()
                .png()
                .toBuffer();
            // Generate perceptual hash
            let perceptualHash;
            switch (method) {
                case 'phash':
                    perceptualHash = await imghash.hash(normalizedBuffer, 16, 'hex');
                    break;
                case 'dhash':
                    perceptualHash = await imghash.hash(normalizedBuffer, 16, 'hex', 'dhash');
                    break;
                case 'ahash':
                    perceptualHash = await imghash.hash(normalizedBuffer, 16, 'hex', 'ahash');
                    break;
                default:
                    perceptualHash = await imghash.hash(normalizedBuffer, 16, 'hex');
            }
            // Cache the result
            this.imageHashCache.set(quickHash, perceptualHash);
            // Update metrics
            this.metrics.hashComputations++;
            const hashTime = Date.now() - startTime;
            this.metrics.averageHashTime =
                (this.metrics.averageHashTime * (this.metrics.hashComputations - 1) + hashTime)
                    / this.metrics.hashComputations;
            console.log(`🔍 Generated ${method} hash: ${perceptualHash} (${hashTime}ms)`);
            return perceptualHash;
        }
        catch (error) {
            console.error('❌ Image hash generation failed:', error.message);
            // Fallback to SHA-256 hash of the original data
            return crypto.createHash('sha256')
                .update(imageData)
                .digest('hex')
                .substring(0, 16);
        }
    }
    /**
     * Generate hash for question text
     */
    generateQuestionHash(questionText) {
        if (!questionText)
            return 'noq';
        // Check cache
        if (this.questionHashCache.has(questionText)) {
            return this.questionHashCache.get(questionText);
        }
        // Normalize question text for consistent hashing
        const normalizedQuestion = questionText
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .replace(/\s+/g, ' '); // Normalize whitespace
        const hash = crypto.createHash('sha256')
            .update(normalizedQuestion)
            .digest('hex')
            .substring(0, 12);
        // Cache the result
        this.questionHashCache.set(questionText, hash);
        return hash;
    }
    /**
     * Generate hash for face regions (celebrity identification)
     */
    async generateFaceHash(imageData, faceRegion = null) {
        try {
            let faceBuffer = imageData;
            // If face region is specified, crop to that area
            if (faceRegion && faceRegion.boundingBox) {
                const { left, top, width, height } = faceRegion.boundingBox;
                faceBuffer = await sharp(imageData)
                    .extract({
                    left: Math.max(0, Math.floor(left)),
                    top: Math.max(0, Math.floor(top)),
                    width: Math.floor(width),
                    height: Math.floor(height)
                })
                    .toBuffer();
            }
            // Generate specialized face hash
            return await this.generateImageHash(faceBuffer, 'phash');
        }
        catch (error) {
            console.error('❌ Face hash generation failed:', error.message);
            // Fallback to full image hash
            return await this.generateImageHash(imageData, 'phash');
        }
    }
    /**
     * Main cache key generation function
     */
    async generateCacheKey(serviceType, imageData, options = {}) {
        const strategy = CACHE_STRATEGIES[serviceType];
        if (!strategy) {
            throw new Error(`Unknown service type: ${serviceType}`);
        }
        const keyComponents = {};
        // Generate image hash based on service requirements
        if (strategy.keyPattern.includes('{imageHash}')) {
            keyComponents.imageHash = await this.generateImageHash(imageData);
        }
        // Generate question hash if needed
        if (strategy.keyPattern.includes('{questionHash}') && options.questionText) {
            keyComponents.questionHash = this.generateQuestionHash(options.questionText);
        }
        // Generate face hash for celebrity identification
        if (strategy.keyPattern.includes('{faceHash}')) {
            keyComponents.faceHash = await this.generateFaceHash(imageData, options.faceRegion);
        }
        // Add language code
        if (strategy.keyPattern.includes('{lang}')) {
            keyComponents.lang = options.language || 'en';
        }
        // Add model information
        if (strategy.keyPattern.includes('{model}')) {
            keyComponents.model = options.model || 'default';
        }
        // Add method for enhanced OCR
        if (strategy.keyPattern.includes('{method}')) {
            keyComponents.method = options.method || 'auto';
        }
        // Add provider for open source APIs
        if (strategy.keyPattern.includes('{provider}')) {
            keyComponents.provider = options.provider || 'unknown';
        }
        // Build the final cache key
        let cacheKey = strategy.keyPattern;
        for (const [placeholder, value] of Object.entries(keyComponents)) {
            cacheKey = cacheKey.replace(`{${placeholder}}`, value);
        }
        console.log(`🔑 Generated cache key: ${cacheKey} (TTL: ${strategy.ttl}s)`);
        return {
            key: cacheKey,
            ttl: strategy.ttl,
            compression: strategy.compression,
            storage: strategy.storage,
            category: strategy.category,
            costImpact: strategy.costImpact,
            strategy: serviceType
        };
    }
    /**
     * Generate cache key for specific service patterns
     */
    async generateOCRKey(imageData, language = 'en') {
        return await this.generateCacheKey('OCR_RESULTS', imageData, { language });
    }
    async generateGoogleVisionObjectsKey(imageData) {
        return await this.generateCacheKey('GOOGLE_VISION_OBJECTS', imageData);
    }
    async generateGoogleVisionTextKey(imageData, language = 'en') {
        return await this.generateCacheKey('GOOGLE_VISION_TEXT', imageData, { language });
    }
    async generateGoogleVisionWebKey(imageData) {
        return await this.generateCacheKey('GOOGLE_VISION_WEB', imageData);
    }
    async generateCelebrityKey(imageData, faceRegion = null) {
        return await this.generateCacheKey('CELEBRITY_IDS', imageData, { faceRegion });
    }
    async generateOpenAIKey(imageData, questionText, model = 'gpt-4-vision') {
        return await this.generateCacheKey('OPENAI_RESPONSES', imageData, {
            questionText,
            model
        });
    }
    async generateEnhancedOCRKey(imageData, method = 'auto', language = 'en') {
        return await this.generateCacheKey('ENHANCED_OCR', imageData, {
            method,
            language
        });
    }
    async generateOpenSourceKey(imageData, questionText, provider, model) {
        return await this.generateCacheKey('OPEN_SOURCE_API', imageData, {
            questionText,
            provider,
            model
        });
    }
    /**
     * Calculate cache similarity between two image hashes
     */
    calculateHashSimilarity(hash1, hash2) {
        if (hash1.length !== hash2.length)
            return 0;
        let differences = 0;
        for (let i = 0; i < hash1.length; i++) {
            if (hash1[i] !== hash2[i]) {
                differences++;
            }
        }
        // Return similarity percentage
        return ((hash1.length - differences) / hash1.length) * 100;
    }
    /**
     * Find similar cached images
     */
    async findSimilarCachedImages(imageHash, threshold = 85) {
        // This would query the cache for similar hashes
        // Implementation depends on cache storage (Redis patterns or DB queries)
        const pattern = imageHash.substring(0, 8) + '*';
        return { pattern, threshold };
    }
    /**
     * Get cache strategy for service type
     */
    getStrategy(serviceType) {
        return CACHE_STRATEGIES[serviceType] || null;
    }
    /**
     * Get all available strategies
     */
    getAllStrategies() {
        return CACHE_STRATEGIES;
    }
    /**
     * Validate cache key format
     */
    validateCacheKey(cacheKey) {
        // Basic validation for cache key format
        const keyParts = cacheKey.split(':');
        return keyParts.length >= 2 && keyParts[0].length > 0;
    }
    /**
     * Extract service type from cache key
     */
    extractServiceType(cacheKey) {
        const prefix = cacheKey.split(':')[0];
        const prefixMap = {
            'ocr': 'OCR_RESULTS',
            'gv': 'GOOGLE_VISION',
            'openai': 'OPENAI_RESPONSES',
            'celeb': 'CELEBRITY_IDS',
            'eocr': 'ENHANCED_OCR',
            'oss': 'OPEN_SOURCE_API'
        };
        return prefixMap[prefix] || 'UNKNOWN';
    }
    /**
     * Get cache performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            imageCacheSize: this.imageHashCache.size,
            questionCacheSize: this.questionHashCache.size,
            hashCacheHitRate: this.metrics.hashComputations > 0
                ? (this.metrics.hashCacheHits / this.metrics.hashComputations) * 100
                : 0
        };
    }
    /**
     * Clear internal caches
     */
    clearCaches() {
        this.imageHashCache.clear();
        this.questionHashCache.clear();
        console.log('🧹 Cleared cache key strategy internal caches');
    }
    /**
     * Get TTL recommendation based on cost impact
     */
    getTTLRecommendation(costImpact, category) {
        const recommendations = {
            'high': { min: 3600, max: 86400 }, // 1 hour to 1 day
            'medium': { min: 1800, max: 21600 }, // 30 min to 6 hours  
            'low': { min: 600, max: 7200 } // 10 min to 2 hours
        };
        const range = recommendations[costImpact] || recommendations['medium'];
        // Adjust based on category
        const categoryMultipliers = {
            'celebrity-identification': 10, // Cache celebrities longer
            'web-detection': 5, // Web entities change slowly
            'text-extraction': 2, // Text doesn't change much
            'ai-analysis': 1, // AI responses are more dynamic
            'object-detection': 3 // Objects are fairly stable
        };
        const multiplier = categoryMultipliers[category] || 1;
        return Math.min(range.max, range.min * multiplier);
    }
}
// Create and export singleton instance
const cacheKeyStrategy = new CacheKeyStrategy();
export default cacheKeyStrategy;
