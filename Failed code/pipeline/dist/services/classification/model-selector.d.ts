/**
 * Model Selector Class
 * Handles user model selection with tier-based access control
 */
export class ModelSelector {
    modelRegistry: {
        'gpt-4-vision': {
            id: string;
            name: string;
            provider: string;
            type: string;
            cost: string;
            speed: string;
            tier: string;
            useCase: string;
            apiEndpoint: string;
            capabilities: string[];
            costPerRequest: number;
            avgResponseTime: number;
            qualityScore: number;
            enabled: boolean;
        };
        'gpt-3.5-vision': {
            id: string;
            name: string;
            provider: string;
            type: string;
            cost: string;
            speed: string;
            tier: string;
            useCase: string;
            apiEndpoint: string;
            capabilities: string[];
            costPerRequest: number;
            avgResponseTime: number;
            qualityScore: number;
            enabled: boolean;
        };
        'google-vision': {
            id: string;
            name: string;
            provider: string;
            type: string;
            cost: string;
            speed: string;
            tier: string;
            useCase: string;
            apiEndpoint: string;
            capabilities: string[];
            costPerRequest: number;
            avgResponseTime: number;
            qualityScore: number;
            enabled: boolean;
        };
        'google-vision-web': {
            id: string;
            name: string;
            provider: string;
            type: string;
            cost: string;
            speed: string;
            tier: string;
            useCase: string;
            apiEndpoint: string;
            capabilities: string[];
            costPerRequest: number;
            avgResponseTime: number;
            qualityScore: number;
            enabled: boolean;
        };
        'enhanced-ocr': {
            id: string;
            name: string;
            provider: string;
            type: string;
            cost: string;
            speed: string;
            tier: string;
            useCase: string;
            apiEndpoint: string;
            capabilities: string[];
            costPerRequest: number;
            avgResponseTime: number;
            qualityScore: number;
            enabled: boolean;
        };
        tesseract: {
            id: string;
            name: string;
            provider: string;
            type: string;
            cost: string;
            speed: string;
            tier: string;
            useCase: string;
            apiEndpoint: string;
            capabilities: string[];
            costPerRequest: number;
            avgResponseTime: number;
            qualityScore: number;
            enabled: boolean;
        };
        'huggingface-blip2': {
            id: string;
            name: string;
            provider: string;
            type: string;
            cost: string;
            speed: string;
            tier: string;
            useCase: string;
            apiEndpoint: string;
            capabilities: string[];
            costPerRequest: number;
            avgResponseTime: number;
            qualityScore: number;
            enabled: boolean;
            pluginReady: boolean;
        };
        'huggingface-clip': {
            id: string;
            name: string;
            provider: string;
            type: string;
            cost: string;
            speed: string;
            tier: string;
            useCase: string;
            apiEndpoint: string;
            capabilities: string[];
            costPerRequest: number;
            avgResponseTime: number;
            qualityScore: number;
            enabled: boolean;
            pluginReady: boolean;
        };
        'ollama-llava': {
            id: string;
            name: string;
            provider: string;
            type: string;
            cost: string;
            speed: string;
            tier: string;
            useCase: string;
            apiEndpoint: string;
            capabilities: string[];
            costPerRequest: number;
            avgResponseTime: number;
            qualityScore: number;
            enabled: boolean;
            pluginReady: boolean;
        };
        'ollama-moondream': {
            id: string;
            name: string;
            provider: string;
            type: string;
            cost: string;
            speed: string;
            tier: string;
            useCase: string;
            apiEndpoint: string;
            capabilities: string[];
            costPerRequest: number;
            avgResponseTime: number;
            qualityScore: number;
            enabled: boolean;
            pluginReady: boolean;
        };
        'replicate-custom': {
            id: string;
            name: string;
            provider: string;
            type: string;
            cost: string;
            speed: string;
            tier: string;
            useCase: string;
            apiEndpoint: string;
            capabilities: string[];
            costPerRequest: number;
            avgResponseTime: number;
            qualityScore: number;
            enabled: boolean;
            pluginReady: boolean;
        };
    };
    tierPermissions: {
        free: {
            level: number;
            maxCostPerRequest: number;
            dailyRequestLimit: number;
            allowedProviders: string[];
            description: string;
        };
        premium: {
            level: number;
            maxCostPerRequest: number;
            dailyRequestLimit: number;
            allowedProviders: string[];
            description: string;
        };
        pro: {
            level: number;
            maxCostPerRequest: number;
            dailyRequestLimit: number;
            allowedProviders: string[];
            description: string;
        };
    };
    /**
     * Get available models for a user tier
     * @param {string} userTier - User's subscription tier (free/pro/premium)
     * @param {Array} requiredCapabilities - Optional capabilities filter
     * @returns {Array} Available models for the user
     */
    getAvailableModels(userTier: string, requiredCapabilities?: any[]): any[];
    /**
     * Select the best model for a question type and user preferences
     * @param {Object} questionType - Question type from classifier
     * @param {string} userTier - User's subscription tier
     * @param {string} userPreference - Optional user model preference
     * @param {Object} options - Additional selection options
     * @returns {Object} Selected model with routing information
     */
    selectModel(questionType: Object, userTier: string, userPreference?: string, options?: Object): Object;
    /**
     * Create model selection result
     * @param {Object} model - Selected model
     * @param {Object} questionType - Question type
     * @param {string} selectionReason - Why this model was selected
     * @returns {Object} Model selection result
     */
    createModelSelection(model: Object, questionType: Object, selectionReason: string): Object;
    /**
     * Get fallback model for a given model
     * @param {Object} primaryModel - Primary model that might fail
     * @param {Object} questionType - Question type
     * @returns {Object|null} Fallback model or null
     */
    getFallbackModel(primaryModel: Object, questionType: Object): Object | null;
    /**
     * Validate if user tier has access to a model
     * @param {Object} model - Model to check
     * @param {string} userTier - User's subscription tier
     * @returns {boolean} True if user has access
     */
    validateTierAccess(model: Object, userTier: string): boolean;
    /**
     * Get model capabilities that match question requirements
     * @param {Object} questionType - Question type with required capabilities
     * @returns {Array} Models sorted by capability match
     */
    getModelsByCapability(questionType: Object): any[];
    /**
     * Get cost estimate for using a model
     * @param {string} modelId - Model identifier
     * @param {number} expectedUsage - Expected monthly usage
     * @returns {Object} Cost breakdown
     */
    getCostEstimate(modelId: string, expectedUsage?: number): Object;
    /**
     * Calculate potential savings compared to premium model
     * @param {Object} model - Model to compare
     * @param {number} usage - Usage amount
     * @returns {Object} Savings information
     */
    calculateSavings(model: Object, usage: number): Object;
    /**
     * [PLUGIN SYSTEM] Register new model (for open source APIs)
     * @param {string} modelId - Unique model identifier
     * @param {Object} modelDefinition - Model definition
     */
    registerModel(modelId: string, modelDefinition: Object): void;
    /**
     * [PLUGIN SYSTEM] Enable/disable model
     * @param {string} modelId - Model to enable/disable
     * @param {boolean} enabled - Enable or disable
     */
    toggleModel(modelId: string, enabled: boolean): void;
    /**
     * Get performance statistics for all models
     * @returns {Object} Model performance data
     */
    getModelPerformanceStats(): Object;
    /**
     * Get detailed information about a specific model
     * @param {string} modelId - The ID of the model to get info for
     * @returns {Object|null} Model information object or null if not found
     */
    getModelInfo(modelId: string): Object | null;
}
