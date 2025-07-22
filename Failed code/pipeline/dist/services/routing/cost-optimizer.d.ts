export class CostOptimizer {
    constructor(analyticsTracker: any, userService: any);
    analyticsTracker: any;
    userService: any;
    SERVICE_COSTS: {
        'enhanced-ocr': {
            base: number;
            perCharacter: number;
            quality: number;
            speed: number;
            provider: string;
        };
        'google-vision-text': {
            base: number;
            perCharacter: number;
            quality: number;
            speed: number;
            provider: string;
        };
        'google-vision-objects': {
            base: number;
            perObject: number;
            quality: number;
            speed: number;
            provider: string;
        };
        'google-vision-web': {
            base: number;
            perEntity: number;
            quality: number;
            speed: number;
            provider: string;
        };
        'openai-gpt4-vision': {
            base: number;
            perToken: number;
            quality: number;
            speed: number;
            provider: string;
        };
        'openai-gpt35-vision': {
            base: number;
            perToken: number;
            quality: number;
            speed: number;
            provider: string;
        };
    };
    QUALITY_THRESHOLDS: {
        high: number;
        medium: number;
        low: number;
    };
    BUDGET_CATEGORIES: {
        conservative: {
            daily: number;
            monthly: number;
        };
        moderate: {
            daily: number;
            monthly: number;
        };
        aggressive: {
            daily: number;
            monthly: number;
        };
    };
    /**
     * Optimize route based on cost-effectiveness
     * @param {Object} serviceConfig - Initial service configuration
     * @param {Object} userBudget - User's budget constraints
     * @returns {Object} Optimized routing configuration
     */
    optimizeRoute(serviceConfig: Object, userBudget?: Object): Object;
    /**
     * Get all possible routes for a service configuration
     */
    getAllPossibleRoutes(baseConfig: any): Promise<any[]>;
    /**
     * Score routes by cost-effectiveness
     */
    scoreRoutesByEffectiveness(routes: any, userBudget: any): Promise<any[]>;
    /**
     * Filter routes by budget constraints
     */
    filterByBudget(routes: any, userBudget: any): any;
    /**
     * Select optimal route from filtered options
     */
    selectOptimalRoute(routes: any, originalConfig: any): any;
    /**
     * Calculate budget fit score
     */
    calculateBudgetFit(estimatedCost: any, userBudget: any): Promise<number>;
    /**
     * Calculate quality trade-off between routes
     */
    calculateQualityTrade(originalRoute: any, optimizedRoute: any): {
        qualityDelta: number;
        qualityPercentage: number;
        acceptable: boolean;
    };
    /**
     * Generate unique route identifier
     */
    generateRouteId(route: any): string;
    /**
     * Get user's daily spending
     */
    getDailySpend(userId: any): Promise<any>;
    /**
     * Get user's monthly spending
     */
    getMonthlySpend(userId: any): Promise<any>;
    /**
     * Get cost optimization recommendations
     */
    getCostOptimizationRecommendations(userId: any): Promise<{
        type: string;
        message: string;
        potential_savings: number;
    }[]>;
    /**
     * Calculate projected monthly cost
     */
    calculateProjectedMonthlyCost(userId: any, currentUsagePattern: any): Promise<number>;
    /**
     * Set user budget preferences
     */
    setBudgetPreferences(userId: any, budgetPrefs: any): Promise<{
        daily: number;
        monthly: number;
        alertThreshold: number;
        autoOptimize: boolean;
    }>;
    /**
     * Check if user should receive budget alert
     */
    shouldAlertBudget(userId: any, requestCost: any): Promise<boolean>;
}
