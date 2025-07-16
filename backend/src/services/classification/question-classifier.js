/**
 * FrameSense Enhanced Question Classifier
 * Smart question type detection with service routing and cost estimation
 * 
 * MOMENT 1.2: Question Classification Engine (2 hours)
 * Supports easy extension for open source APIs
 */

// Question type definitions with extensible structure
const QUESTION_TYPES = {
  PURE_TEXT: {
    id: 'PURE_TEXT',
    patterns: [
      /what does (this|it) say/i,
      /read (the )?text/i,
      /transcribe/i,
      /extract text/i,
      /what is written/i,
      /what text/i,
      /can you read/i
    ],
    services: ['enhanced-ocr'],
    defaultModel: 'tesseract',
    fallback: 'google-vision-text',
    tier: 'free',
    estimatedCost: 0.001,
    responseTime: '1-3s',
    description: 'Text extraction and reading',
    capabilities: ['text-extraction', 'ocr']
  },
  
  COUNT_OBJECTS: {
    id: 'COUNT_OBJECTS',
    patterns: [
      /how many/i,
      /count/i,
      /number of/i,
      /quantity/i,
      /total.*(?:cars|people|objects|items)/i,
      /count.*(?:cars|people|objects|items)/i
    ],
    services: ['google-vision-objects'],
    defaultModel: 'google-vision',
    fallback: 'openai-vision',
    tier: 'pro',
    estimatedCost: 0.02,
    responseTime: '3-8s',
    description: 'Object counting and quantification',
    capabilities: ['object-detection', 'counting']
  },
  
  IDENTIFY_CELEBRITY: {
    id: 'IDENTIFY_CELEBRITY',
    patterns: [
      /who is (this|that)/i,
      /identify (person|actor|celebrity)/i,
      /name of (this )?person/i,
      /recognize (person|face)/i,
      /famous person/i,
      /celebrity/i,
      /actor/i,
      /actress/i
    ],
    services: ['google-vision-web'],
    defaultModel: 'google-vision',
    fallback: 'openai-vision',
    tier: 'premium',
    estimatedCost: 0.05,
    responseTime: '5-10s',
    description: 'Celebrity and public figure identification',
    capabilities: ['face-recognition', 'celebrity-id', 'web-search']
  },
  
  DESCRIBE_SCENE: {
    id: 'DESCRIBE_SCENE',
    patterns: [
      /what is happening/i,
      /describe (this )?image/i,
      /explain (what|this)/i,
      /what do you see/i,
      /analyze (this )?image/i,
      /tell me about/i,
      /what's in/i,
      /scene/i
    ],
    services: ['openai-vision'],
    defaultModel: 'gpt-4-vision',
    alternatives: ['gpt-3.5-vision'],
    tier: 'pro',
    estimatedCost: 0.03,
    responseTime: '8-15s',
    description: 'Comprehensive scene analysis and description',
    capabilities: ['scene-understanding', 'reasoning', 'description']
  },
  
  DETECT_OBJECTS: {
    id: 'DETECT_OBJECTS',
    patterns: [
      /what objects/i,
      /find/i,
      /detect/i,
      /locate/i,
      /identify objects/i,
      /what items/i,
      /objects in/i,
      /spot/i
    ],
    services: ['google-vision-objects'],
    defaultModel: 'google-vision',
    fallback: 'openai-vision',
    tier: 'pro',
    estimatedCost: 0.02,
    responseTime: '3-8s',
    description: 'Object detection and identification',
    capabilities: ['object-detection', 'localization']
  },
  
  DETECT_LOGOS: {
    id: 'DETECT_LOGOS',
    patterns: [
      /logo/i,
      /brand/i,
      /company/i,
      /trademark/i,
      /what brand/i,
      /identify brand/i
    ],
    services: ['google-vision-logos'],
    defaultModel: 'google-vision',
    fallback: 'openai-vision',
    tier: 'pro',
    estimatedCost: 0.025,
    responseTime: '4-8s',
    description: 'Brand and logo identification',
    capabilities: ['logo-detection', 'brand-recognition']
  },
  
  ANALYZE_DOCUMENT: {
    id: 'ANALYZE_DOCUMENT',
    patterns: [
      /document/i,
      /form/i,
      /invoice/i,
      /receipt/i,
      /paper/i,
      /analyze.*document/i,
      /extract.*information/i
    ],
    services: ['enhanced-ocr', 'google-vision-text'],
    defaultModel: 'google-vision',
    fallback: 'tesseract',
    tier: 'pro',
    estimatedCost: 0.015,
    responseTime: '3-6s',
    description: 'Document analysis and information extraction',
    capabilities: ['document-analysis', 'text-extraction', 'form-processing']
  },
  
  // [EXTENSIBLE] Easy to add new types for open source APIs
  CUSTOM_ANALYSIS: {
    id: 'CUSTOM_ANALYSIS',
    patterns: [/custom|special|advanced/i],
    services: ['open-source-api'], // Plugin placeholder
    defaultModel: 'auto-select',
    tier: 'premium',
    estimatedCost: 0.01,
    responseTime: '5-12s',
    description: 'Custom analysis using specialized models',
    capabilities: ['custom-models', 'specialized-analysis'],
    pluginReady: true
  }
};

/**
 * Question Classifier Class
 * Handles intelligent question classification and service routing
 */
class QuestionClassifier {
  constructor() {
    this.questionTypes = QUESTION_TYPES;
    this.fallbackType = QUESTION_TYPES.DESCRIBE_SCENE; // Default fallback
  }

  /**
   * Classify a question and return the most appropriate question type
   * @param {string} questionText - The user's question
   * @returns {Object} Question type object with routing information
   */
  classifyQuestion(questionText) {
    if (!questionText || typeof questionText !== 'string') {
      throw new Error('Invalid question text provided');
    }

    const normalizedQuestion = questionText.toLowerCase().trim();
    
    // Score each question type based on pattern matches
    const scores = {};
    
    for (const [typeId, questionType] of Object.entries(this.questionTypes)) {
      scores[typeId] = this.calculateScore(normalizedQuestion, questionType);
    }
    
    // Find the highest scoring type
    const bestMatch = Object.entries(scores).reduce((best, [typeId, score]) => {
      return score > best.score ? { typeId, score } : best;
    }, { typeId: null, score: 0 });
    
    // If no good match found (score < 0.5), use fallback
    if (bestMatch.score < 0.5) {
      return {
        ...this.fallbackType,
        confidence: 0.3,
        reasoning: 'No clear pattern match, using scene description fallback'
      };
    }
    
    const selectedType = this.questionTypes[bestMatch.typeId];
    
    return {
      ...selectedType,
      confidence: Math.min(bestMatch.score, 1.0),
      reasoning: `Matched patterns for ${selectedType.description.toLowerCase()}`
    };
  }

  /**
   * Calculate pattern match score for a question type
   * @param {string} question - Normalized question text
   * @param {Object} questionType - Question type definition
   * @returns {number} Score between 0 and 1
   */
  calculateScore(question, questionType) {
    let score = 0;
    let maxScore = questionType.patterns.length;
    
    for (const pattern of questionType.patterns) {
      if (pattern.test(question)) {
        score += 1;
        // Give extra weight to longer, more specific patterns
        const patternSpecificity = pattern.source.length / 20;
        score += Math.min(patternSpecificity, 0.5);
      }
    }
    
    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Get question type by ID
   * @param {string} typeId - Question type identifier
   * @returns {Object|null} Question type or null if not found
   */
  getQuestionType(typeId) {
    return this.questionTypes[typeId] || null;
  }

  /**
   * Get service requirements for a question type
   * @param {Object} questionType - Question type object
   * @returns {Object} Service requirements
   */
  getServiceRequirements(questionType) {
    return {
      services: questionType.services,
      defaultModel: questionType.defaultModel,
      fallback: questionType.fallback,
      alternatives: questionType.alternatives || [],
      tier: questionType.tier,
      estimatedCost: questionType.estimatedCost,
      responseTime: questionType.responseTime,
      capabilities: questionType.capabilities
    };
  }

  /**
   * Validate if user tier has access to question type
   * @param {Object} questionType - Question type object
   * @param {string} userTier - User's subscription tier (free/pro/premium)
   * @returns {boolean} True if user has access
   */
  validateTierAccess(questionType, userTier) {
    const tierHierarchy = {
      'free': 0,
      'pro': 1,
      'premium': 2
    };
    
    const requiredLevel = tierHierarchy[questionType.tier] || 0;
    const userLevel = tierHierarchy[userTier] || 0;
    
    return userLevel >= requiredLevel;
  }

  /**
   * Get available question types for a user tier
   * @param {string} userTier - User's subscription tier
   * @returns {Array} Available question types
   */
  getAvailableQuestionTypes(userTier) {
    return Object.values(this.questionTypes).filter(
      questionType => this.validateTierAccess(questionType, userTier)
    );
  }

  /**
   * Get cost estimate for analyzing a question type
   * @param {Object} questionType - Question type object
   * @param {string} selectedModel - Optional model override
   * @returns {number} Estimated cost in USD
   */
  getCostEstimate(questionType, selectedModel = null) {
    let baseCost = questionType.estimatedCost;
    
    // Adjust cost based on selected model
    if (selectedModel) {
      const modelMultipliers = {
        'gpt-4-vision': 2.0,
        'gpt-3.5-vision': 1.0,
        'google-vision': 1.2,
        'tesseract': 0.1
      };
      
      const multiplier = modelMultipliers[selectedModel] || 1.0;
      baseCost *= multiplier;
    }
    
    return Math.round(baseCost * 1000) / 1000; // Round to 3 decimal places
  }

  /**
   * Get all supported capabilities across all question types
   * @returns {Array} Unique list of capabilities
   */
  getAllCapabilities() {
    const capabilities = new Set();
    
    Object.values(this.questionTypes).forEach(questionType => {
      questionType.capabilities.forEach(cap => capabilities.add(cap));
    });
    
    return Array.from(capabilities).sort();
  }

  /**
   * Find question types that support specific capabilities
   * @param {Array} requiredCapabilities - List of required capabilities
   * @returns {Array} Question types that support all required capabilities
   */
  findByCapabilities(requiredCapabilities) {
    return Object.values(this.questionTypes).filter(questionType => {
      return requiredCapabilities.every(cap => 
        questionType.capabilities.includes(cap)
      );
    });
  }

  /**
   * [FUTURE] Register new question type (for plugin system)
   * @param {string} typeId - Unique type identifier
   * @param {Object} questionTypeDefinition - Question type definition
   */
  registerQuestionType(typeId, questionTypeDefinition) {
    if (this.questionTypes[typeId]) {
      throw new Error(`Question type ${typeId} already exists`);
    }
    
    // Validate required fields
    const requiredFields = ['patterns', 'services', 'defaultModel', 'tier', 'estimatedCost'];
    for (const field of requiredFields) {
      if (!questionTypeDefinition[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    this.questionTypes[typeId] = {
      id: typeId,
      ...questionTypeDefinition
    };
  }
}

export { QuestionClassifier }; 