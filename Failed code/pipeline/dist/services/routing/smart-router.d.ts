export class SmartRouter {
    constructor(questionClassifier: any, modelSelector: any, tierAccess: any, costOptimizer: any, fallbackManager: any);
    questionClassifier: any;
    modelSelector: any;
    tierAccess: any;
    costOptimizer: any;
    fallbackManager: any;
    SERVICE_ENDPOINTS: {
        'enhanced-ocr': string;
        'google-vision-text': string;
        'google-vision-objects': string;
        'google-vision-web': string;
        'google-vision-logo': string;
        'openai-vision': string;
        'openai-gpt4': string;
        'openai-gpt35': string;
        'open-source-api': string;
    };
    DEFAULT_ROUTES: {
        PURE_TEXT: {
            primary: string;
            fallback: string;
            model: string;
            tier: string;
        };
        COUNT_OBJECTS: {
            primary: string;
            fallback: string;
            model: string;
            tier: string;
        };
        IDENTIFY_CELEBRITY: {
            primary: string;
            fallback: string;
            model: string;
            tier: string;
        };
        DESCRIBE_SCENE: {
            primary: string;
            fallback: string;
            model: string;
            tier: string;
        };
        DETECT_OBJECTS: {
            primary: string;
            fallback: string;
            model: string;
            tier: string;
        };
        CUSTOM_ANALYSIS: {
            primary: string;
            fallback: string;
            model: string;
            tier: string;
        };
    };
    /**
     * Main routing entry point
     * @param {Object} questionType - Classified question type
     * @param {string} userModelChoice - User's preferred model (optional)
     * @param {Object} userProfile - User profile with tier, preferences, usage stats
     * @param {Object} options - Additional routing options
     * @returns {Object} Routing decision with service, model, parameters, fallback
     */
    routeRequest(questionType: Object, userModelChoice: string, userProfile: Object, options?: Object): Object;
    /**
     * Select the best model for the request
     */
    selectModel(questionType: any, userModelChoice: any, availableModels: any, userProfile: any): any;
    /**
     * Get service configuration for model and question type
     */
    getServiceConfiguration(questionType: any, selectedModel: any, userProfile: any): Promise<{
        service: any;
        model: any;
        parameters: {
            language: any;
            includeRegions: any;
            maxResults: any;
        };
        fallback: any;
        estimatedCost: any;
        estimatedTime: any;
        cacheOptions: any;
    }>;
    /**
     * Get appropriate Google Vision service based on question type
     */
    getGoogleVisionService(questionType: any): any;
    /**
     * Build service-specific parameters
     */
    buildServiceParameters(questionType: any, modelInfo: any, userProfile: any): {
        language: any;
        includeRegions: any;
        maxResults: any;
    };
    /**
     * Get cache options for service
     */
    getCacheOptions(service: any, questionType: any): any;
    /**
     * Prepare final route with validation and fallback
     */
    prepareFinalRoute(route: any, questionType: any, userProfile: any): Promise<any>;
    /**
     * Find best available model for user's tier
     */
    findBestModelForTier(questionType: any, availableModels: any, userProfile: any): any;
    /**
     * Get fallback route when access is denied
     */
    getFallbackRoute(questionType: any, userProfile: any, suggestedTier: any): {
        service: string;
        model: string;
        parameters: {
            language: any;
        };
        fallback: null;
        estimatedCost: number;
        estimatedTime: string;
        accessDenied: boolean;
        suggestedTier: any;
        message: string;
        cacheOptions: {
            ttl: number;
            compress: boolean;
        };
    };
    /**
     * Get error fallback route
     */
    getErrorFallback(questionType: any, userProfile: any, error: any): {
        service: string;
        model: string;
        parameters: {
            language: any;
        };
        fallback: null;
        estimatedCost: number;
        estimatedTime: string;
        error: boolean;
        errorMessage: any;
        cacheOptions: {
            ttl: number;
            compress: boolean;
        };
    };
    /**
     * Get routing statistics
     */
    getRoutingStats(timeRange?: string): Promise<{
        totalRoutes: number;
        serviceBreakdown: {};
        averageRoutingTime: number;
        fallbackRate: number;
        errorRate: number;
        costOptimizationSavings: number;
    }>;
    /**
     * Test routing decision without executing
     */
    dryRunRoute(questionType: any, userModelChoice: any, userProfile: any): Promise<{
        wouldRoute: Object;
        reasoning: {
            serviceChosen: any;
            modelChosen: any;
            reason: string;
            costConsideration: any;
            fallbackAvailable: boolean;
        };
        alternatives: {
            model: any;
            service: any;
            cost: any;
            time: any;
        }[];
    }>;
    /**
     * Explain routing decision for debugging
     */
    explainRoutingDecision(route: any): {
        serviceChosen: any;
        modelChosen: any;
        reason: string;
        costConsideration: any;
        fallbackAvailable: boolean;
    };
    /**
     * Get alternative routing options
     */
    getAlternativeRoutes(questionType: any, userProfile: any): Promise<{
        model: any;
        service: any;
        cost: any;
        time: any;
    }[]>;
}
