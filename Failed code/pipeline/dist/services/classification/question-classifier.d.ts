/**
 * Question Classifier Class
 * Handles intelligent question classification and service routing
 */
export class QuestionClassifier {
    questionTypes: {
        PURE_TEXT: {
            id: string;
            patterns: RegExp[];
            services: string[];
            defaultModel: string;
            fallback: string;
            tier: string;
            estimatedCost: number;
            responseTime: string;
            description: string;
            capabilities: string[];
        };
        COUNT_OBJECTS: {
            id: string;
            patterns: RegExp[];
            services: string[];
            defaultModel: string;
            fallback: string;
            tier: string;
            estimatedCost: number;
            responseTime: string;
            description: string;
            capabilities: string[];
        };
        IDENTIFY_CELEBRITY: {
            id: string;
            patterns: RegExp[];
            services: string[];
            defaultModel: string;
            fallback: string;
            tier: string;
            estimatedCost: number;
            responseTime: string;
            description: string;
            capabilities: string[];
        };
        DESCRIBE_SCENE: {
            id: string;
            patterns: RegExp[];
            services: string[];
            defaultModel: string;
            alternatives: string[];
            tier: string;
            estimatedCost: number;
            responseTime: string;
            description: string;
            capabilities: string[];
        };
        DETECT_OBJECTS: {
            id: string;
            patterns: RegExp[];
            services: string[];
            defaultModel: string;
            fallback: string;
            tier: string;
            estimatedCost: number;
            responseTime: string;
            description: string;
            capabilities: string[];
        };
        DETECT_LOGOS: {
            id: string;
            patterns: RegExp[];
            services: string[];
            defaultModel: string;
            fallback: string;
            tier: string;
            estimatedCost: number;
            responseTime: string;
            description: string;
            capabilities: string[];
        };
        ANALYZE_DOCUMENT: {
            id: string;
            patterns: RegExp[];
            services: string[];
            defaultModel: string;
            fallback: string;
            tier: string;
            estimatedCost: number;
            responseTime: string;
            description: string;
            capabilities: string[];
        };
        CUSTOM_ANALYSIS: {
            id: string;
            patterns: RegExp[];
            services: string[];
            defaultModel: string;
            tier: string;
            estimatedCost: number;
            responseTime: string;
            description: string;
            capabilities: string[];
            pluginReady: boolean;
        };
    };
    fallbackType: {
        id: string;
        patterns: RegExp[];
        services: string[];
        defaultModel: string;
        fallback: string;
        tier: string;
        estimatedCost: number;
        responseTime: string;
        description: string;
        capabilities: string[];
    };
    /**
     * Classify a question and return the most appropriate question type
     * @param {string} questionText - The user's question
     * @returns {Object} Question type object with routing information
     */
    classifyQuestion(questionText: string): Object;
    /**
     * Calculate pattern match score for a question type
     * @param {string} question - Normalized question text
     * @param {Object} questionType - Question type definition
     * @returns {number} Score between 0 and 1
     */
    calculateScore(question: string, questionType: Object): number;
    /**
     * Get question type by ID
     * @param {string} typeId - Question type identifier
     * @returns {Object|null} Question type or null if not found
     */
    getQuestionType(typeId: string): Object | null;
    /**
     * Get service requirements for a question type
     * @param {Object} questionType - Question type object
     * @returns {Object} Service requirements
     */
    getServiceRequirements(questionType: Object): Object;
    /**
     * Validate if user tier has access to question type
     * @param {Object} questionType - Question type object
     * @param {string} userTier - User's subscription tier (free/pro/premium)
     * @returns {boolean} True if user has access
     */
    validateTierAccess(questionType: Object, userTier: string): boolean;
    /**
     * Get available question types for a user tier
     * @param {string} userTier - User's subscription tier
     * @returns {Array} Available question types
     */
    getAvailableQuestionTypes(userTier: string): any[];
    /**
     * Get cost estimate for analyzing a question type
     * @param {Object} questionType - Question type object
     * @param {string} selectedModel - Optional model override
     * @returns {number} Estimated cost in USD
     */
    getCostEstimate(questionType: Object, selectedModel?: string): number;
    /**
     * Get all supported capabilities across all question types
     * @returns {Array} Unique list of capabilities
     */
    getAllCapabilities(): any[];
    /**
     * Find question types that support specific capabilities
     * @param {Array} requiredCapabilities - List of required capabilities
     * @returns {Array} Question types that support all required capabilities
     */
    findByCapabilities(requiredCapabilities: any[]): any[];
    /**
     * [FUTURE] Register new question type (for plugin system)
     * @param {string} typeId - Unique type identifier
     * @param {Object} questionTypeDefinition - Question type definition
     */
    registerQuestionType(typeId: string, questionTypeDefinition: Object): void;
}
