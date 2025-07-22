/**
 * DAY 3 Integration Test Suite
 */
export class Day3ValidationTest {
    testResults: any[];
    /**
     * Setup mock services for testing
     */
    setupMockServices(): void;
    mockUserService: {
        getUserById: (userId: any) => Promise<{
            id: any;
            tier: string;
            preferences: {
                language: string;
            };
        }>;
        getDailyRequestCount: () => Promise<number>;
        getMonthlyRequestCount: () => Promise<number>;
        getMonthlyCost: () => Promise<number>;
    } | undefined;
    mockAnalyticsTracker: {
        getUsageStats: () => Promise<{
            requestCount: number;
            totalCost: number;
        }>;
        getActiveRequestCount: () => Promise<number>;
        trackRequest: () => Promise<boolean>;
    } | undefined;
    mockCacheManager: {
        get: () => Promise<null>;
        set: () => Promise<boolean>;
        generateKey: () => string;
    } | undefined;
    tierAccess: TierAccess | undefined;
    costOptimizer: CostOptimizer | undefined;
    fallbackManager: FallbackManager | undefined;
    questionClassifier: QuestionClassifier | undefined;
    modelSelector: ModelSelector | undefined;
    smartRouter: SmartRouter | undefined;
    /**
     * Run all validation tests
     */
    runAllTests(): Promise<{
        total: number;
        passed: number;
        failed: number;
        successRate: number;
        allPassed: boolean;
        results: any[];
    }>;
    /**
     * Test tier access validation
     */
    testTierAccessValidation(): Promise<void>;
    /**
     * Test cost optimizer routing
     */
    testCostOptimizerRouting(): Promise<void>;
    /**
     * Test fallback chain building
     */
    testFallbackChainBuilding(): Promise<void>;
    /**
     * Test smart router integration
     */
    testSmartRouterIntegration(): Promise<void>;
    /**
     * Test end-to-end flow
     */
    testEndToEndFlow(): Promise<void>;
    /**
     * Record test result
     */
    recordResult(testName: any, description: any, passed: any): void;
    /**
     * Print test results summary
     */
    printResults(): void;
    /**
     * Get test summary for external use
     */
    getTestSummary(): {
        total: number;
        passed: number;
        failed: number;
        successRate: number;
        allPassed: boolean;
        results: any[];
    };
}
import { TierAccess } from './index.js';
import { CostOptimizer } from './index.js';
import { FallbackManager } from './index.js';
import { QuestionClassifier } from '../classification/question-classifier.js';
import { ModelSelector } from '../classification/model-selector.js';
import { SmartRouter } from './index.js';
