// 💰 COST OPTIMIZATION ENGINE - DAY 3 IMPLEMENTATION
// =================================================
// Cost-aware routing and budget management system
// Optimizes AI service selection based on cost-effectiveness
class CostOptimizer {
    constructor(analyticsTracker, userService) {
        this.analyticsTracker = analyticsTracker;
        this.userService = userService;
        // Service cost database (per request)
        this.SERVICE_COSTS = {
            'enhanced-ocr': {
                base: 0.0,
                perCharacter: 0.0,
                quality: 0.7,
                speed: 0.8,
                provider: 'local'
            },
            'google-vision-text': {
                base: 0.0015,
                perCharacter: 0.000001,
                quality: 0.95,
                speed: 0.9,
                provider: 'google'
            },
            'google-vision-objects': {
                base: 0.006,
                perObject: 0.0001,
                quality: 0.9,
                speed: 0.85,
                provider: 'google'
            },
            'google-vision-web': {
                base: 0.0035,
                perEntity: 0.0005,
                quality: 0.95,
                speed: 0.8,
                provider: 'google'
            },
            'openai-gpt4-vision': {
                base: 0.04,
                perToken: 0.00003,
                quality: 0.98,
                speed: 0.6,
                provider: 'openai'
            },
            'openai-gpt35-vision': {
                base: 0.02,
                perToken: 0.000015,
                quality: 0.85,
                speed: 0.8,
                provider: 'openai'
            }
        };
        // Quality thresholds for cost optimization
        this.QUALITY_THRESHOLDS = {
            high: 0.9,
            medium: 0.75,
            low: 0.6
        };
        // Budget categories
        this.BUDGET_CATEGORIES = {
            conservative: { daily: 1.0, monthly: 25.0 },
            moderate: { daily: 5.0, monthly: 100.0 },
            aggressive: { daily: 20.0, monthly: 500.0 }
        };
    }
    /**
     * Optimize route based on cost-effectiveness
     * @param {Object} serviceConfig - Initial service configuration
     * @param {Object} userBudget - User's budget constraints
     * @returns {Object} Optimized routing configuration
     */
    async optimizeRoute(serviceConfig, userBudget = {}) {
        const startTime = Date.now();
        console.log(`💰 Cost Optimizer: Optimizing route for service ${serviceConfig.service}`);
        try {
            // Get all possible routes for this question type
            const alternativeRoutes = await this.getAllPossibleRoutes(serviceConfig);
            // Calculate cost-effectiveness scores
            const scoredRoutes = await this.scoreRoutesByEffectiveness(alternativeRoutes, userBudget);
            // Apply budget constraints
            const budgetFilteredRoutes = this.filterByBudget(scoredRoutes, userBudget);
            // Select optimal route
            const optimizedRoute = this.selectOptimalRoute(budgetFilteredRoutes, serviceConfig);
            // Add cost optimization metadata
            optimizedRoute.costOptimization = {
                originalCost: serviceConfig.estimatedCost,
                optimizedCost: optimizedRoute.estimatedCost,
                savings: serviceConfig.estimatedCost - optimizedRoute.estimatedCost,
                qualityTrade: this.calculateQualityTrade(serviceConfig, optimizedRoute),
                optimizationTime: Date.now() - startTime,
                alternativesConsidered: alternativeRoutes.length
            };
            console.log(`✅ Cost Optimizer: Completed in ${optimizedRoute.costOptimization.optimizationTime}ms`);
            console.log(`   Savings: $${optimizedRoute.costOptimization.savings.toFixed(4)}`);
            return optimizedRoute;
        }
        catch (error) {
            console.error('❌ Cost Optimizer: Optimization failed:', error);
            // Return original route if optimization fails
            return {
                ...serviceConfig,
                costOptimization: {
                    error: error.message,
                    fallback: true
                }
            };
        }
    }
    /**
     * Get all possible routes for a service configuration
     */
    async getAllPossibleRoutes(baseConfig) {
        const routes = [];
        // Add original route
        routes.push({
            ...baseConfig,
            routeType: 'original'
        });
        // Generate alternative routes based on question type
        const questionType = baseConfig.questionType || 'DESCRIBE_SCENE';
        switch (questionType) {
            case 'PURE_TEXT':
                routes.push({ ...baseConfig, service: 'enhanced-ocr', model: 'tesseract', estimatedCost: 0.0 }, { ...baseConfig, service: 'google-vision-text', model: 'google-vision', estimatedCost: 0.0015 });
                break;
            case 'COUNT_OBJECTS':
            case 'DETECT_OBJECTS':
                routes.push({ ...baseConfig, service: 'google-vision-objects', model: 'google-vision', estimatedCost: 0.006 }, { ...baseConfig, service: 'openai-gpt35-vision', model: 'gpt-3.5-vision', estimatedCost: 0.02 });
                break;
            case 'DESCRIBE_SCENE':
                routes.push({ ...baseConfig, service: 'openai-gpt35-vision', model: 'gpt-3.5-vision', estimatedCost: 0.02 }, { ...baseConfig, service: 'openai-gpt4-vision', model: 'gpt-4-vision', estimatedCost: 0.04 }, { ...baseConfig, service: 'google-vision-objects', model: 'google-vision', estimatedCost: 0.006 });
                break;
            case 'IDENTIFY_CELEBRITY':
                routes.push({ ...baseConfig, service: 'google-vision-web', model: 'google-vision', estimatedCost: 0.0035 }, { ...baseConfig, service: 'openai-gpt4-vision', model: 'gpt-4-vision', estimatedCost: 0.04 });
                break;
        }
        return routes.map(route => ({
            ...route,
            routeId: this.generateRouteId(route)
        }));
    }
    /**
     * Score routes by cost-effectiveness
     */
    async scoreRoutesByEffectiveness(routes, userBudget) {
        const scoredRoutes = [];
        // Check if this is for a free tier user (no budget or very low budget)
        const isFreeUser = !userBudget || (!userBudget.daily && !userBudget.monthly) ||
            (userBudget.daily && userBudget.daily < 1.0) ||
            (userBudget.monthly && userBudget.monthly < 10.0);
        for (const route of routes) {
            const serviceInfo = this.SERVICE_COSTS[route.service] || {};
            // Calculate quality score
            const qualityScore = serviceInfo.quality || 0.5;
            // Calculate speed score
            const speedScore = serviceInfo.speed || 0.5;
            // Calculate cost score (lower cost = higher score)
            const costScore = route.estimatedCost === 0 ? 1.0 : Math.max(0, 1 - (route.estimatedCost / 0.1));
            // Calculate budget fit score
            const budgetFitScore = await this.calculateBudgetFit(route.estimatedCost, userBudget);
            let effectivenessScore;
            if (isFreeUser) {
                // For free tier users: prioritize cost heavily, give massive bonus to $0 services
                if (route.estimatedCost === 0) {
                    // Free services get base score + huge bonus
                    effectivenessScore = (qualityScore * 0.2 +
                        costScore * 0.7 + // Much higher weight on cost
                        speedScore * 0.1 +
                        1.0 * 0.0 // Free bonus effectively built into costScore
                    ) + 0.5; // Extra bonus for free services
                }
                else {
                    // Paid services get heavily penalized for free tier
                    effectivenessScore = (qualityScore * 0.2 +
                        costScore * 0.7 +
                        speedScore * 0.1 +
                        budgetFitScore * 0.0) - 0.3; // Penalty for paid services on free tier
                }
            }
            else {
                // For paid tier users: balanced scoring
                effectivenessScore = (qualityScore * 0.4 +
                    costScore * 0.3 +
                    speedScore * 0.2 +
                    budgetFitScore * 0.1);
            }
            scoredRoutes.push({
                ...route,
                scores: {
                    quality: qualityScore,
                    cost: costScore,
                    speed: speedScore,
                    budgetFit: budgetFitScore,
                    effectiveness: effectivenessScore
                }
            });
        }
        // Sort by effectiveness score (highest first)
        return scoredRoutes.sort((a, b) => b.scores.effectiveness - a.scores.effectiveness);
    }
    /**
     * Filter routes by budget constraints
     */
    filterByBudget(routes, userBudget) {
        if (!userBudget || (!userBudget.daily && !userBudget.monthly)) {
            return routes;
        }
        return routes.filter(route => {
            // Check daily budget
            if (userBudget.daily && route.estimatedCost > userBudget.daily * 0.1) {
                return false; // Don't use more than 10% of daily budget on single request
            }
            // Check monthly budget
            if (userBudget.monthly && route.estimatedCost > userBudget.monthly * 0.01) {
                return false; // Don't use more than 1% of monthly budget on single request
            }
            return true;
        });
    }
    /**
     * Select optimal route from filtered options
     */
    selectOptimalRoute(routes, originalConfig) {
        if (routes.length === 0) {
            console.log('💰 Cost Optimizer: No budget-compatible routes, using original');
            return originalConfig;
        }
        // Return highest scoring route
        const optimal = routes[0];
        console.log(`💰 Cost Optimizer: Selected ${optimal.service} (score: ${optimal.scores.effectiveness.toFixed(3)})`);
        return optimal;
    }
    /**
     * Calculate budget fit score
     */
    async calculateBudgetFit(estimatedCost, userBudget) {
        if (!userBudget)
            return 0.5;
        let score = 1.0;
        // Check against daily budget
        if (userBudget.daily) {
            const dailyUsage = await this.getDailySpend(userBudget.userId);
            const remainingDaily = userBudget.daily - dailyUsage;
            const dailyImpact = estimatedCost / Math.max(remainingDaily, 0.01);
            score *= Math.max(0, 1 - dailyImpact);
        }
        // Check against monthly budget
        if (userBudget.monthly) {
            const monthlyUsage = await this.getMonthlySpend(userBudget.userId);
            const remainingMonthly = userBudget.monthly - monthlyUsage;
            const monthlyImpact = estimatedCost / Math.max(remainingMonthly, 0.01);
            score *= Math.max(0, 1 - monthlyImpact);
        }
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Calculate quality trade-off between routes
     */
    calculateQualityTrade(originalRoute, optimizedRoute) {
        const originalQuality = this.SERVICE_COSTS[originalRoute.service]?.quality || 0.5;
        const optimizedQuality = this.SERVICE_COSTS[optimizedRoute.service]?.quality || 0.5;
        return {
            qualityDelta: optimizedQuality - originalQuality,
            qualityPercentage: ((optimizedQuality / originalQuality) - 1) * 100,
            acceptable: Math.abs(optimizedQuality - originalQuality) < 0.2
        };
    }
    /**
     * Generate unique route identifier
     */
    generateRouteId(route) {
        return `${route.service}-${route.model}-${route.estimatedCost}`.replace(/\./g, '_');
    }
    /**
     * Get user's daily spending
     */
    async getDailySpend(userId) {
        try {
            if (this.analyticsTracker) {
                const today = new Date().toISOString().split('T')[0];
                const stats = await this.analyticsTracker.getUsageStats(userId, 'daily', today);
                return stats.totalCost || 0;
            }
            return 0;
        }
        catch (error) {
            console.warn('⚠️ Failed to get daily spend:', error);
            return 0;
        }
    }
    /**
     * Get user's monthly spending
     */
    async getMonthlySpend(userId) {
        try {
            if (this.analyticsTracker) {
                const thisMonth = new Date().toISOString().substring(0, 7);
                const stats = await this.analyticsTracker.getUsageStats(userId, 'monthly', thisMonth);
                return stats.totalCost || 0;
            }
            return 0;
        }
        catch (error) {
            console.warn('⚠️ Failed to get monthly spend:', error);
            return 0;
        }
    }
    /**
     * Get cost optimization recommendations
     */
    async getCostOptimizationRecommendations(userId) {
        try {
            const monthlyStats = await this.getMonthlySpend(userId);
            const dailyStats = await this.getDailySpend(userId);
            const recommendations = [];
            // High cost services usage
            if (monthlyStats > 50) {
                recommendations.push({
                    type: 'high_cost_usage',
                    message: 'Consider using more cost-effective alternatives for basic tasks',
                    potential_savings: monthlyStats * 0.3
                });
            }
            // Suggest batching
            if (dailyStats > 5) {
                recommendations.push({
                    type: 'batching',
                    message: 'Batch similar requests together to reduce per-request overhead',
                    potential_savings: dailyStats * 0.1
                });
            }
            // Suggest caching
            recommendations.push({
                type: 'caching',
                message: 'Enable aggressive caching to reduce repeated API calls',
                potential_savings: monthlyStats * 0.4
            });
            return recommendations;
        }
        catch (error) {
            console.error('❌ Failed to get cost recommendations:', error);
            return [];
        }
    }
    /**
     * Calculate projected monthly cost
     */
    async calculateProjectedMonthlyCost(userId, currentUsagePattern) {
        try {
            const dailyAverage = await this.getDailySpend(userId);
            const daysInMonth = new Date().getDate();
            const remainingDays = 30 - daysInMonth;
            return (dailyAverage * daysInMonth) + (dailyAverage * remainingDays);
        }
        catch (error) {
            console.warn('⚠️ Failed to calculate projected cost:', error);
            return 0;
        }
    }
    /**
     * Set user budget preferences
     */
    async setBudgetPreferences(userId, budgetPrefs) {
        try {
            const validatedPrefs = {
                daily: Math.max(0, budgetPrefs.daily || 0),
                monthly: Math.max(0, budgetPrefs.monthly || 0),
                alertThreshold: Math.min(1, Math.max(0, budgetPrefs.alertThreshold || 0.8)),
                autoOptimize: !!budgetPrefs.autoOptimize
            };
            if (this.userService) {
                await this.userService.updateUserPreferences(userId, { budget: validatedPrefs });
            }
            return validatedPrefs;
        }
        catch (error) {
            console.error('❌ Failed to set budget preferences:', error);
            throw error;
        }
    }
    /**
     * Check if user should receive budget alert
     */
    async shouldAlertBudget(userId, requestCost) {
        try {
            const user = await this.userService.getUserById(userId);
            const budgetPrefs = user?.preferences?.budget;
            if (!budgetPrefs)
                return false;
            const monthlySpend = await this.getMonthlySpend(userId);
            const projectedSpend = monthlySpend + requestCost;
            return projectedSpend >= (budgetPrefs.monthly * budgetPrefs.alertThreshold);
        }
        catch (error) {
            console.warn('⚠️ Failed to check budget alert:', error);
            return false;
        }
    }
}
export { CostOptimizer };
