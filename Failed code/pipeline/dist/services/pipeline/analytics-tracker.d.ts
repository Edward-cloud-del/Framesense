export default analyticsTracker;
declare const analyticsTracker: AnalyticsTracker;
/**
 * Comprehensive Analytics Tracker
 * MOMENT 4.5: Track usage, costs, performance, quality, and generate reports
 */
declare class AnalyticsTracker {
    analytics: {
        requests: {
            total: number;
            byService: {};
            byUser: {};
            byTier: {};
            byHour: {};
            byDay: {};
            successful: number;
            failed: number;
        };
        performance: {
            totalResponseTime: number;
            averageResponseTime: number;
            byService: {};
            slowestRequests: never[];
            fastestRequests: never[];
        };
        costs: {
            total: number;
            saved: number;
            byService: {};
            byUser: {};
            byTier: {};
            dailySpend: {};
            monthlySpend: {};
        };
        cache: {
            totalRequests: number;
            hits: number;
            misses: number;
            hitRate: number;
            byService: {};
            savings: {
                time: number;
                cost: number;
            };
        };
        quality: {
            averageConfidence: number;
            byService: {};
            userSatisfaction: {};
            errorTypes: {};
        };
        usage: {
            peakHours: {};
            popularServices: {};
            userPatterns: {};
            tierUtilization: {};
        };
    };
    serviceCosts: {
        OCR_RESULTS: number;
        ENHANCED_OCR: number;
        GOOGLE_VISION_TEXT: number;
        GOOGLE_VISION_OBJECTS: number;
        GOOGLE_VISION_WEB: number;
        GOOGLE_VISION_LOGO: number;
        CELEBRITY_IDS: number;
        OPENAI_RESPONSES: number;
        OPEN_SOURCE_API: number;
    };
    tierMultipliers: {
        free: number;
        pro: number;
        premium: number;
    };
    persistenceConfig: {
        enabled: boolean;
        interval: number;
        dataFile: string;
        backupInterval: number;
        maxBackups: number;
    };
    realtimeMetrics: {
        currentHourRequests: number;
        currentDayRequests: number;
        lastHourCosts: number;
        activeUsers: Set<any>;
        recentErrors: never[];
    };
    /**
     * Initialize analytics tracker
     */
    initialize(): Promise<void>;
    /**
     * Track a request with comprehensive metrics
     */
    trackRequest(requestData: any): Promise<{
        success: boolean;
        cost: number;
        cached: any;
        timestamp: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        timestamp: number;
        cost?: undefined;
        cached?: undefined;
    }>;
    /**
     * Track cache performance specifically
     */
    trackCachePerformance(cacheEvent: any): void;
    /**
     * Track errors for analysis
     */
    trackError(error: any, service: any, userId: any): void;
    /**
     * Categorize errors for better analysis
     */
    categorizeError(error: any): "validation_error" | "timeout" | "rate_limit" | "auth_error" | "unknown_error" | "not_found" | "network_error" | "token_error";
    /**
     * Track user satisfaction (can be called from feedback endpoints)
     */
    trackUserSatisfaction(userId: any, rating: any, feedback?: string, service?: null): void;
    /**
     * Track usage patterns for insights
     */
    trackUsagePatterns(userId: any, service: any, questionType: any, hour: any, day: any): void;
    /**
     * Calculate request cost based on service and tier
     */
    calculateRequestCost(service: any, userTier: any, cached?: boolean): number;
    /**
     * Generate comprehensive usage report
     */
    generateReport(userId?: null, timeRange?: string, breakdown?: string): {
        metadata: {
            generatedAt: string;
            timeRange: string;
            breakdown: string;
            userId: string;
        };
        summary: {
            totalRequests: any;
            totalCost: any;
            costSaved: number;
            averageResponseTime: number;
            cacheHitRate: number;
            successRate: number;
            activeUsers: number;
            topServices: {
                service: string;
                count: any;
                percentage: number;
            }[];
            recentErrors: never[];
        };
        details: {};
    } | {
        error: any;
        generatedAt: string;
    };
    /**
     * Generate summary statistics
     */
    generateSummary(userId: any, timeRange: any): {
        totalRequests: any;
        totalCost: any;
        costSaved: number;
        averageResponseTime: number;
        cacheHitRate: number;
        successRate: number;
        activeUsers: number;
        topServices: {
            service: string;
            count: any;
            percentage: number;
        }[];
        recentErrors: never[];
    };
    /**
     * Get top services by usage
     */
    getTopServices(limit?: number): {
        service: string;
        count: any;
        percentage: number;
    }[];
    /**
     * Generate service breakdown
     */
    generateServiceBreakdown(userId: any, timeRange: any): {};
    /**
     * Generate time breakdown
     */
    generateTimeBreakdown(userId: any, timeRange: any): {
        hourly: {};
        daily: {};
        peakHours: {};
    };
    /**
     * Generate cost breakdown
     */
    generateCostBreakdown(userId: any, timeRange: any): {
        totalCost: number;
        costSaved: number;
        byService: {};
        byTier: {};
        dailySpend: {};
        projectedMonthlyCost: number;
    };
    /**
     * Generate performance breakdown
     */
    generatePerformanceBreakdown(userId: any, timeRange: any): {
        overall: {
            averageResponseTime: number;
            totalRequests: number;
            successRate: number;
        };
        byService: {};
        cache: {
            hitRate: number;
            timeSaved: number;
            costSaved: number;
        };
        errors: {};
    };
    /**
     * Calculate projected monthly cost
     */
    calculateProjectedMonthlyCost(): number;
    /**
     * Get real-time metrics
     */
    getRealtimeMetrics(): {
        activeUsers: number;
        currentUtilization: number;
        systemHealth: number;
        currentHourRequests: number;
        currentDayRequests: number;
        lastHourCosts: number;
        recentErrors: never[];
    };
    /**
     * Calculate current system utilization
     */
    calculateCurrentUtilization(): number;
    /**
     * Calculate overall system health score
     */
    calculateSystemHealth(): number;
    /**
     * Start real-time tracking
     */
    startRealtimeTracking(): void;
    /**
     * Start data persistence
     */
    startPersistence(): void;
    /**
     * Save analytics data to file
     */
    saveAnalyticsData(): Promise<void>;
    /**
     * Load analytics data from file
     */
    loadAnalyticsData(): Promise<void>;
    /**
     * Create backup of analytics data
     */
    createBackup(): Promise<void>;
    /**
     * Get comprehensive analytics metrics
     */
    getMetrics(): {
        requests: {
            total: number;
            byService: {};
            byUser: {};
            byTier: {};
            byHour: {};
            byDay: {};
            successful: number;
            failed: number;
        };
        performance: {
            totalResponseTime: number;
            averageResponseTime: number;
            byService: {};
            slowestRequests: never[];
            fastestRequests: never[];
        };
        costs: {
            total: number;
            saved: number;
            byService: {};
            byUser: {};
            byTier: {};
            dailySpend: {};
            monthlySpend: {};
        };
        cache: {
            totalRequests: number;
            hits: number;
            misses: number;
            hitRate: number;
            byService: {};
            savings: {
                time: number;
                cost: number;
            };
        };
        quality: {
            averageConfidence: number;
            byService: {};
            userSatisfaction: {};
            errorTypes: {};
        };
        usage: {
            peakHours: {};
            popularServices: {};
            userPatterns: {};
            tierUtilization: {};
        };
        realtime: {
            activeUsers: number;
            currentUtilization: number;
            systemHealth: number;
            currentHourRequests: number;
            currentDayRequests: number;
            lastHourCosts: number;
            recentErrors: never[];
        };
    };
    /**
     * Health check for analytics tracker
     */
    healthCheck(): {
        status: string;
        dataIntegrity: boolean;
        persistenceEnabled: boolean;
        realtimeTracking: boolean;
        metrics: {
            totalRequests: number;
            totalCosts: number;
            systemHealth: number;
        };
    };
    /**
     * Clear all analytics data (for testing)
     */
    clearAllData(): void;
}
