export class FallbackManager {
    constructor(cacheManager: any, tierAccess: any);
    cacheManager: any;
    tierAccess: any;
    SERVICE_RELIABILITY: {
        'enhanced-ocr': number;
        'google-vision-text': number;
        'google-vision-objects': number;
        'google-vision-web': number;
        'openai-gpt4-vision': number;
        'openai-gpt35-vision': number;
        'open-source-api': number;
    };
    FALLBACK_CHAINS: {
        PURE_TEXT: string[];
        COUNT_OBJECTS: string[];
        DETECT_OBJECTS: string[];
        DESCRIBE_SCENE: string[];
        IDENTIFY_CELEBRITY: string[];
        CUSTOM_ANALYSIS: string[];
    };
    FAILURE_HANDLERS: {
        timeout: {
            retryable: boolean;
            maxRetries: number;
            backoff: number;
        };
        rate_limit: {
            retryable: boolean;
            maxRetries: number;
            backoff: number;
        };
        auth_error: {
            retryable: boolean;
            skipSimilarServices: boolean;
        };
        service_down: {
            retryable: boolean;
            skipProvider: boolean;
        };
        invalid_request: {
            retryable: boolean;
            skipService: boolean;
        };
        quota_exceeded: {
            retryable: boolean;
            skipProvider: boolean;
        };
        unknown_error: {
            retryable: boolean;
            maxRetries: number;
            backoff: number;
        };
    };
    /**
     * Build fallback chain for a service and question type
     * @param {string} primaryService - The primary service to start with
     * @param {Object} questionType - The classified question type
     * @param {string} userTier - User's subscription tier
     * @returns {Array} Ordered array of fallback options
     */
    buildFallbackChain(primaryService: string, questionType: Object, userTier?: string): any[];
    /**
     * Execute fallback chain when primary service fails
     * @param {Array} fallbackChain - The fallback chain to execute
     * @param {Object} originalRequest - Original request data
     * @param {Error} primaryError - Error from primary service
     * @param {Object} executionContext - Service execution context
     * @returns {Object} Fallback execution result
     */
    executeFallback(fallbackChain: any[], originalRequest: Object, primaryError: Error, executionContext: Object): Object;
    /**
     * Handle cache-based fallback
     */
    handleCacheFallback(fallbackOption: any, originalRequest: any): Promise<{
        success: boolean;
        data: any;
    }>;
    /**
     * Handle error fallback with user-friendly response
     */
    handleErrorFallback(fallbackOption: any, originalRequest: any, lastError: any, attempts: any): {
        success: boolean;
        data: {
            text: string;
            confidence: number;
            has_text: boolean;
            error: boolean;
            errorType: string;
            userMessage: string;
            suggestedActions: string[];
            fallbackAttempts: any;
            canRetryLater: boolean;
        };
    };
    /**
     * Execute service-based fallback
     */
    executeServiceFallback(fallbackOption: any, originalRequest: any, executionContext: any): Promise<void>;
    /**
     * Check if user has access to a service
     */
    checkServiceAccess(service: any, userTier: any): Promise<any>;
    /**
     * Get service tier requirement
     */
    getServiceTier(service: any): any;
    /**
     * Get retry policy for service
     */
    getRetryPolicy(service: any): any;
    /**
     * Get emergency fallback chain
     */
    getEmergencyFallbackChain(questionType: any): {
        service: string;
        priority: number;
        tier: string;
        reliability: number;
        condition: string;
    }[];
    /**
     * Find similar cached results
     */
    findSimilarCachedResults(originalRequest: any): Promise<never[]>;
    /**
     * Analyze error type and characteristics
     */
    analyzeError(error: any): {
        type: string;
        retryable: boolean;
        userFriendly: string;
    };
    /**
     * Generate user-friendly error message
     */
    generateUserFriendlyMessage(errorInfo: any, attemptCount: any): string;
    /**
     * Get suggested actions for user
     */
    getSuggestedActions(errorInfo: any, originalRequest: any): string[];
    /**
     * Get suggested action for complete failure
     */
    getSuggestedAction(originalRequest: any, lastError: any): {
        message: string;
        actions: string[];
        canRetryLater: boolean;
        supportTicket: boolean;
    };
    /**
     * Generate image hash for similarity matching
     */
    generateImageHash(imageData: any): string;
    /**
     * Get fallback statistics
     */
    getFallbackStats(): {
        totalFallbacks: number;
        successRate: number;
        averageFallbackTime: number;
        commonFailures: string[];
        mostReliableServices: string[];
    };
    /**
     * Test fallback chain without execution
     */
    testFallbackChain(primaryService: any, questionType: any, userTier: any): Promise<{
        primaryService: any;
        questionType: any;
        userTier: any;
        fallbackChain: any[];
        totalOptions: number;
        estimatedReliability: number;
        accessibleServices: number;
    }>;
}
