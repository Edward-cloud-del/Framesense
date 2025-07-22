export class TierAccess {
    constructor(userService: any, analyticsTracker: any);
    userService: any;
    analyticsTracker: any;
    TIER_PERMISSIONS: {
        free: {
            services: string[];
            questionTypes: string[];
            dailyLimit: number;
            monthlyLimit: number;
            features: string[];
            maxImageSize: number;
            maxConcurrentRequests: number;
            priority: string;
            cacheAccess: string;
            supportLevel: string;
        };
        premium: {
            services: string[];
            questionTypes: string[];
            dailyLimit: number;
            monthlyLimit: number;
            features: string[];
            maxImageSize: number;
            maxConcurrentRequests: number;
            priority: string;
            cacheAccess: string;
            supportLevel: string;
            costLimit: number;
        };
        pro: {
            services: string[];
            questionTypes: string[];
            dailyLimit: number;
            monthlyLimit: number;
            features: string[];
            maxImageSize: number;
            maxConcurrentRequests: number;
            priority: string;
            cacheAccess: string;
            supportLevel: string;
            costLimit: number;
        };
    };
    SERVICE_COSTS: {
        'enhanced-ocr': number;
        'google-vision-text': number;
        'google-vision-objects': number;
        'google-vision-web': number;
        'openai-vision': number;
        'gpt-4-vision': number;
        'gpt-3.5-vision': number;
    };
    QUESTION_TYPE_TIERS: {
        PURE_TEXT: string;
        COUNT_OBJECTS: string;
        DETECT_OBJECTS: string;
        DESCRIBE_SCENE: string;
        IDENTIFY_CELEBRITY: string;
        CUSTOM_ANALYSIS: string;
    };
    /**
     * Validate user access to a specific question type
     * @param {Object} questionType - The classified question type
     * @param {Object} userProfile - User profile with tier and usage data
     * @returns {Object} Access validation result
     */
    validateAccess(questionType: Object, userProfile: Object): Object;
    /**
     * Check if user tier can access required tier
     * CORRECTED HIERARCHY: pro > premium > free
     */
    canAccessTier(userTier: any, requiredTier: any): boolean;
    /**
     * Check if user tier can access lower tier features
     * CORRECTED HIERARCHY: pro > premium > free
     */
    canAccessLowerTier(userTier: any, targetTier: any): boolean;
    /**
     * Get services available for user's tier
     */
    getAvailableServices(userTier: any): any;
    /**
     * Get question types available for user's tier
     */
    getAvailableQuestionTypes(userTier: any): any;
    /**
     * Validate image size for user's tier
     */
    validateImageSize(userTier: any, imageSize: any): boolean;
    /**
     * Get user's daily usage
     */
    getDailyUsage(userId: any): Promise<any>;
    /**
     * Get user's monthly usage
     */
    getMonthlyUsage(userId: any): Promise<any>;
    /**
     * Get user's monthly cost
     */
    getMonthlyCost(userId: any): Promise<any>;
    /**
     * Get active concurrent requests count
     */
    getActiveRequestCount(userId: any): Promise<any>;
    /**
     * Create standardized access denied result
     */
    createAccessDeniedResult(reason: any, suggestedTier: any, message: any): {
        allowed: boolean;
        reason: any;
        suggestedTier: any;
        message: any;
        upgradeUrl: string;
        contactSupport: boolean;
    };
    /**
     * Track successful access for analytics
     */
    trackAccess(userId: any, questionType: any, service: any, cost?: number): Promise<void>;
    /**
     * Get tier upgrade recommendations
     */
    getTierUpgradeRecommendations(userProfile: any, deniedQuestionTypes?: any[]): {
        tier: string;
        benefits: string[];
        enabledQuestionTypes: string[];
        monthlyCost: number;
    }[];
    /**
     * Get user's current tier
     */
    getUserTier(userId: any): Promise<any>;
    /**
     * Get tier comparison data for UI
     */
    getTierComparison(): {
        free: {
            name: string;
            price: number;
            dailyLimit: number;
            features: string[];
            questionTypes: string[];
        };
        pro: {
            name: string;
            price: number;
            dailyLimit: number;
            features: string[];
            questionTypes: string[];
        };
        premium: {
            name: string;
            price: number;
            dailyLimit: number;
            features: string[];
            questionTypes: string[];
        };
    };
    /**
     * Check if user can be temporarily upgraded for emergency requests
     */
    canTemporaryUpgrade(userProfile: any, emergencyReason: any): {
        allowed: boolean;
        duration: string;
        limitations: string[];
    };
}
