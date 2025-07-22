export default responseOptimizer;
declare const responseOptimizer: ResponseOptimizer;
/**
 * Response Optimizer for Cache and Transmission
 * MOMENT 4.4: Token reduction, compression, format standardization, metadata stripping
 */
declare class ResponseOptimizer {
    encoders: Map<any, any>;
    strategies: {
        OPENAI_RESPONSES: {
            tokenOptimization: boolean;
            metadataStripping: string;
            formatStandardization: boolean;
            redundancyRemoval: boolean;
            compressionLevel: string;
        };
        GOOGLE_VISION_WEB: {
            tokenOptimization: boolean;
            metadataStripping: string;
            formatStandardization: boolean;
            redundancyRemoval: boolean;
            compressionLevel: string;
        };
        GOOGLE_VISION_OBJECTS: {
            tokenOptimization: boolean;
            metadataStripping: string;
            formatStandardization: boolean;
            redundancyRemoval: boolean;
            compressionLevel: string;
        };
        OCR_RESULTS: {
            tokenOptimization: boolean;
            metadataStripping: string;
            formatStandardization: boolean;
            redundancyRemoval: boolean;
            compressionLevel: string;
        };
        CELEBRITY_IDS: {
            tokenOptimization: boolean;
            metadataStripping: string;
            formatStandardization: boolean;
            redundancyRemoval: boolean;
            compressionLevel: string;
        };
    };
    tierOptimizations: {
        free: {
            detailLevel: string;
            maxResponseSize: number;
            stripSensitiveData: boolean;
            compressResponse: boolean;
        };
        pro: {
            detailLevel: string;
            maxResponseSize: number;
            stripSensitiveData: boolean;
            compressResponse: boolean;
        };
        premium: {
            detailLevel: string;
            maxResponseSize: number;
            stripSensitiveData: boolean;
            compressResponse: boolean;
        };
    };
    metrics: {
        totalOptimizations: number;
        tokensSaved: number;
        bytesSaved: number;
        compressionRatio: number;
        averageOptimizationTime: number;
        totalOptimizationTime: number;
        optimizationsByService: {};
    };
    /**
     * Get or create token encoder for specific model
     */
    getTokenEncoder(model?: string): any;
    /**
     * Calculate accurate token count for text
     */
    calculateTokens(text: any, model?: string): any;
    /**
     * Optimize response for cache storage
     */
    optimizeForCache(response: any, serviceType: any): {
        optimized: any;
        originalSize: number;
        optimizedSize: number;
        optimizationTime: number;
        strategy: any;
        error?: undefined;
    } | {
        optimized: any;
        originalSize: number;
        optimizedSize: number;
        optimizationTime: number;
        error: any;
        strategy?: undefined;
    };
    /**
     * Optimize response for transmission to user
     */
    optimizeForTransmission(response: any, userTier?: string, serviceType?: string): Promise<{
        optimized: any;
        compressed: {
            data: string;
            originalSize: number;
            compressedSize: number;
            compressionRatio: number;
            algorithm: string;
        } | null;
        originalSize: number;
        optimizedSize: number;
        compressionRatio: number;
        optimizationTime: number;
        tierConfig: any;
        error?: undefined;
    } | {
        optimized: any;
        compressed: null;
        optimizationTime: number;
        error: any;
        originalSize?: undefined;
        optimizedSize?: undefined;
        compressionRatio?: undefined;
        tierConfig?: undefined;
    }>;
    /**
     * Optimize token usage for OpenAI responses
     */
    optimizeTokens(response: any): any;
    /**
     * Remove redundant phrases from text
     */
    removeRedundantPhrases(text: any): any;
    /**
   * Strip metadata based on strategy level
   */
    stripMetadata(response: any, level: any): any;
    /**
     * Standardize response format across services
     */
    standardizeFormat(response: any, serviceType: any): {
        service: any;
        timestamp: number;
        data: null;
        metadata: {};
    };
    /**
     * Remove redundant data from response
     */
    removeRedundancy(response: any): any;
    /**
     * Remove duplicate web entities
     */
    removeDuplicateEntities(entities: any): any;
    /**
     * Remove duplicate text annotations
     */
    removeDuplicateTextAnnotations(annotations: any): any;
    /**
     * Adjust detail level based on user tier
     */
    adjustDetailLevel(response: any, detailLevel: any, serviceType: any): any;
    /**
     * Enforce response size limits
     */
    enforceSizeLimit(response: any, maxSize: any): any;
    /**
     * Strip sensitive data for lower tiers
     */
    stripSensitiveData(response: any): any;
    /**
     * Compress response for transmission
     */
    compressResponse(response: any): Promise<{
        data: string;
        originalSize: number;
        compressedSize: number;
        compressionRatio: number;
        algorithm: string;
    } | null>;
    /**
     * Update optimization metrics
     */
    updateMetrics(serviceType: any, original: any, optimized: any, optimizationTime: any): void;
    /**
     * Get optimization metrics
     */
    getMetrics(): {
        totalOptimizations: number;
        tokensSaved: number;
        bytesSaved: number;
        averageBytesSaved: number;
        averageOptimizationTime: number;
        optimizationsByService: {};
        compressionRatio: number;
    };
    /**
     * Health check for response optimizer
     */
    healthCheck(): {
        status: string;
        tokenEncodingWorking: boolean;
        encodersLoaded: number;
        metrics: {
            totalOptimizations: number;
            tokensSaved: number;
            bytesSaved: number;
            averageBytesSaved: number;
            averageOptimizationTime: number;
            optimizationsByService: {};
            compressionRatio: number;
        };
        error?: undefined;
    } | {
        status: string;
        error: any;
        metrics: {
            totalOptimizations: number;
            tokensSaved: number;
            bytesSaved: number;
            averageBytesSaved: number;
            averageOptimizationTime: number;
            optimizationsByService: {};
            compressionRatio: number;
        };
        tokenEncodingWorking?: undefined;
        encodersLoaded?: undefined;
    };
    /**
     * Clear metrics
     */
    clearMetrics(): void;
}
