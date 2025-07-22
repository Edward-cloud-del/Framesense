export namespace CACHE_STRATEGIES {
    namespace OCR_RESULTS {
        let keyPattern: string;
        let ttl: number;
        let compression: boolean;
        let storage: string;
        let category: string;
        let costImpact: string;
    }
    namespace GOOGLE_VISION_OBJECTS {
        let keyPattern_1: string;
        export { keyPattern_1 as keyPattern };
        let ttl_1: number;
        export { ttl_1 as ttl };
        let compression_1: boolean;
        export { compression_1 as compression };
        let storage_1: string;
        export { storage_1 as storage };
        let category_1: string;
        export { category_1 as category };
        let costImpact_1: string;
        export { costImpact_1 as costImpact };
    }
    namespace GOOGLE_VISION_TEXT {
        let keyPattern_2: string;
        export { keyPattern_2 as keyPattern };
        let ttl_2: number;
        export { ttl_2 as ttl };
        let compression_2: boolean;
        export { compression_2 as compression };
        let storage_2: string;
        export { storage_2 as storage };
        let category_2: string;
        export { category_2 as category };
        let costImpact_2: string;
        export { costImpact_2 as costImpact };
    }
    namespace GOOGLE_VISION_WEB {
        let keyPattern_3: string;
        export { keyPattern_3 as keyPattern };
        let ttl_3: number;
        export { ttl_3 as ttl };
        let compression_3: boolean;
        export { compression_3 as compression };
        let storage_3: string;
        export { storage_3 as storage };
        let category_3: string;
        export { category_3 as category };
        let costImpact_3: string;
        export { costImpact_3 as costImpact };
    }
    namespace GOOGLE_VISION_LOGO {
        let keyPattern_4: string;
        export { keyPattern_4 as keyPattern };
        let ttl_4: number;
        export { ttl_4 as ttl };
        let compression_4: boolean;
        export { compression_4 as compression };
        let storage_4: string;
        export { storage_4 as storage };
        let category_4: string;
        export { category_4 as category };
        let costImpact_4: string;
        export { costImpact_4 as costImpact };
    }
    namespace OPENAI_RESPONSES {
        let keyPattern_5: string;
        export { keyPattern_5 as keyPattern };
        let ttl_5: number;
        export { ttl_5 as ttl };
        let compression_5: boolean;
        export { compression_5 as compression };
        let storage_5: string;
        export { storage_5 as storage };
        let category_5: string;
        export { category_5 as category };
        let costImpact_5: string;
        export { costImpact_5 as costImpact };
    }
    namespace CELEBRITY_IDS {
        let keyPattern_6: string;
        export { keyPattern_6 as keyPattern };
        let ttl_6: number;
        export { ttl_6 as ttl };
        let compression_6: boolean;
        export { compression_6 as compression };
        let storage_6: string;
        export { storage_6 as storage };
        let category_6: string;
        export { category_6 as category };
        let costImpact_6: string;
        export { costImpact_6 as costImpact };
    }
    namespace ENHANCED_OCR {
        let keyPattern_7: string;
        export { keyPattern_7 as keyPattern };
        let ttl_7: number;
        export { ttl_7 as ttl };
        let compression_7: boolean;
        export { compression_7 as compression };
        let storage_7: string;
        export { storage_7 as storage };
        let category_7: string;
        export { category_7 as category };
        let costImpact_7: string;
        export { costImpact_7 as costImpact };
    }
    namespace OPEN_SOURCE_API {
        let keyPattern_8: string;
        export { keyPattern_8 as keyPattern };
        let ttl_8: number;
        export { ttl_8 as ttl };
        let compression_8: boolean;
        export { compression_8 as compression };
        let storage_8: string;
        export { storage_8 as storage };
        let category_8: string;
        export { category_8 as category };
        let costImpact_8: string;
        export { costImpact_8 as costImpact };
    }
}
export default cacheKeyStrategy;
declare const cacheKeyStrategy: CacheKeyStrategy;
/**
 * Cache Key Strategy Manager
 */
declare class CacheKeyStrategy {
    imageHashCache: Map<any, any>;
    questionHashCache: Map<any, any>;
    metrics: {
        hashComputations: number;
        cacheHits: number;
        hashCacheHits: number;
        averageHashTime: number;
    };
    /**
     * Generate perceptual hash for image duplicate detection
     * Uses pHash algorithm for visual similarity detection
     */
    generateImageHash(imageData: any, method?: string): Promise<any>;
    /**
     * Generate hash for question text
     */
    generateQuestionHash(questionText: any): any;
    /**
     * Generate hash for face regions (celebrity identification)
     */
    generateFaceHash(imageData: any, faceRegion?: null): Promise<any>;
    /**
     * Main cache key generation function
     */
    generateCacheKey(serviceType: any, imageData: any, options?: {}): Promise<{
        key: any;
        ttl: any;
        compression: any;
        storage: any;
        category: any;
        costImpact: any;
        strategy: any;
    }>;
    /**
     * Generate cache key for specific service patterns
     */
    generateOCRKey(imageData: any, language?: string): Promise<{
        key: any;
        ttl: any;
        compression: any;
        storage: any;
        category: any;
        costImpact: any;
        strategy: any;
    }>;
    generateGoogleVisionObjectsKey(imageData: any): Promise<{
        key: any;
        ttl: any;
        compression: any;
        storage: any;
        category: any;
        costImpact: any;
        strategy: any;
    }>;
    generateGoogleVisionTextKey(imageData: any, language?: string): Promise<{
        key: any;
        ttl: any;
        compression: any;
        storage: any;
        category: any;
        costImpact: any;
        strategy: any;
    }>;
    generateGoogleVisionWebKey(imageData: any): Promise<{
        key: any;
        ttl: any;
        compression: any;
        storage: any;
        category: any;
        costImpact: any;
        strategy: any;
    }>;
    generateCelebrityKey(imageData: any, faceRegion?: null): Promise<{
        key: any;
        ttl: any;
        compression: any;
        storage: any;
        category: any;
        costImpact: any;
        strategy: any;
    }>;
    generateOpenAIKey(imageData: any, questionText: any, model?: string): Promise<{
        key: any;
        ttl: any;
        compression: any;
        storage: any;
        category: any;
        costImpact: any;
        strategy: any;
    }>;
    generateEnhancedOCRKey(imageData: any, method?: string, language?: string): Promise<{
        key: any;
        ttl: any;
        compression: any;
        storage: any;
        category: any;
        costImpact: any;
        strategy: any;
    }>;
    generateOpenSourceKey(imageData: any, questionText: any, provider: any, model: any): Promise<{
        key: any;
        ttl: any;
        compression: any;
        storage: any;
        category: any;
        costImpact: any;
        strategy: any;
    }>;
    /**
     * Calculate cache similarity between two image hashes
     */
    calculateHashSimilarity(hash1: any, hash2: any): number;
    /**
     * Find similar cached images
     */
    findSimilarCachedImages(imageHash: any, threshold?: number): Promise<{
        pattern: string;
        threshold: number;
    }>;
    /**
     * Get cache strategy for service type
     */
    getStrategy(serviceType: any): any;
    /**
     * Get all available strategies
     */
    getAllStrategies(): {
        OCR_RESULTS: {
            keyPattern: string;
            ttl: number;
            compression: boolean;
            storage: string;
            category: string;
            costImpact: string;
        };
        GOOGLE_VISION_OBJECTS: {
            keyPattern: string;
            ttl: number;
            compression: boolean;
            storage: string;
            category: string;
            costImpact: string;
        };
        GOOGLE_VISION_TEXT: {
            keyPattern: string;
            ttl: number;
            compression: boolean;
            storage: string;
            category: string;
            costImpact: string;
        };
        GOOGLE_VISION_WEB: {
            keyPattern: string;
            ttl: number;
            compression: boolean;
            storage: string;
            category: string;
            costImpact: string;
        };
        GOOGLE_VISION_LOGO: {
            keyPattern: string;
            ttl: number;
            compression: boolean;
            storage: string;
            category: string;
            costImpact: string;
        };
        OPENAI_RESPONSES: {
            keyPattern: string;
            ttl: number;
            compression: boolean;
            storage: string;
            category: string;
            costImpact: string;
        };
        CELEBRITY_IDS: {
            keyPattern: string;
            ttl: number;
            compression: boolean;
            storage: string;
            category: string;
            costImpact: string;
        };
        ENHANCED_OCR: {
            keyPattern: string;
            ttl: number;
            compression: boolean;
            storage: string;
            category: string;
            costImpact: string;
        };
        OPEN_SOURCE_API: {
            keyPattern: string;
            ttl: number;
            compression: boolean;
            storage: string;
            category: string;
            costImpact: string;
        };
    };
    /**
     * Validate cache key format
     */
    validateCacheKey(cacheKey: any): boolean;
    /**
     * Extract service type from cache key
     */
    extractServiceType(cacheKey: any): any;
    /**
     * Get cache performance metrics
     */
    getMetrics(): {
        imageCacheSize: number;
        questionCacheSize: number;
        hashCacheHitRate: number;
        hashComputations: number;
        cacheHits: number;
        hashCacheHits: number;
        averageHashTime: number;
    };
    /**
     * Clear internal caches
     */
    clearCaches(): void;
    /**
     * Get TTL recommendation based on cost impact
     */
    getTTLRecommendation(costImpact: any, category: any): number;
}
