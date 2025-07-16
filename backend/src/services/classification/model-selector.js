/**
 * FrameSense Enhanced Model Selector
 * User model choice system with tier-based access and open source API support
 * 
 * MOMENT 1.3: Model Selection Interface (1.5 hours)
 * Ready for future plugin integration
 */

// Model registry with extensible structure for future APIs
const MODEL_REGISTRY = {
  // OpenAI Models
  'gpt-4-vision': {
    id: 'gpt-4-vision',
    name: 'GPT-4 Vision (Best Quality)',
    provider: 'openai',
    type: 'vision-language',
    cost: 'high',
    speed: 'slow',
    tier: 'premium',
    useCase: 'Complex scene analysis and reasoning',
    apiEndpoint: 'openai-enhanced',
    capabilities: ['text', 'objects', 'scenes', 'reasoning', 'complex-analysis'],
    costPerRequest: 0.03,
    avgResponseTime: 12,
    qualityScore: 95,
    enabled: true
  },
  
  'gpt-3.5-vision': {
    id: 'gpt-3.5-vision',
    name: 'GPT-3.5 Vision (Balanced)',
    provider: 'openai',
    type: 'vision-language',
    cost: 'medium',
    speed: 'fast',
    tier: 'pro',
    useCase: 'General image analysis',
    apiEndpoint: 'openai-enhanced',
    capabilities: ['text', 'objects', 'basic-scenes'],
    costPerRequest: 0.015,
    avgResponseTime: 8,
    qualityScore: 80,
    enabled: true
  },
  
  // Google Vision Models
  'google-vision': {
    id: 'google-vision',
    name: 'Google Vision (Specialized)',
    provider: 'google',
    type: 'computer-vision',
    cost: 'medium',
    speed: 'fast',
    tier: 'pro',
    useCase: 'Object detection, celebrity ID, text extraction',
    apiEndpoint: 'google-vision',
    capabilities: ['objects', 'text', 'faces', 'web-entities', 'logos'],
    costPerRequest: 0.02,
    avgResponseTime: 6,
    qualityScore: 85,
    enabled: true
  },
  
  'google-vision-web': {
    id: 'google-vision-web',
    name: 'Google Vision Web (Celebrity ID)',
    provider: 'google',
    type: 'web-search-vision',
    cost: 'high',
    speed: 'medium',
    tier: 'premium',
    useCase: 'Celebrity identification and web search',
    apiEndpoint: 'google-vision',
    capabilities: ['celebrity-id', 'web-search', 'similar-images'],
    costPerRequest: 0.05,
    avgResponseTime: 10,
    qualityScore: 90,
    enabled: true
  },
  
  // OCR Models
  'enhanced-ocr': {
    id: 'enhanced-ocr',
    name: 'Enhanced OCR (Text Reading)',
    provider: 'hybrid',
    type: 'ocr',
    cost: 'low',
    speed: 'very-fast',
    tier: 'free',
    useCase: 'Text reading and extraction',
    apiEndpoint: 'enhanced-ocr',
    capabilities: ['text-extraction', 'multilingual'],
    costPerRequest: 0.001,
    avgResponseTime: 3,
    qualityScore: 75,
    enabled: true
  },
  
  'tesseract': {
    id: 'tesseract',
    name: 'Tesseract OCR (Basic)',
    provider: 'tesseract',
    type: 'ocr',
    cost: 'free',
    speed: 'fast',
    tier: 'free',
    useCase: 'Basic text extraction',
    apiEndpoint: 'enhanced-ocr',
    capabilities: ['text-extraction'],
    costPerRequest: 0,
    avgResponseTime: 2,
    qualityScore: 65,
    enabled: true
  },
  
  // [PLUGIN READY] Open Source Models - Future Integration
  'huggingface-blip2': {
    id: 'huggingface-blip2',
    name: 'BLIP-2 (Open Source Captioning)',
    provider: 'huggingface',
    type: 'vision-language',
    cost: 'very-low',
    speed: 'medium',
    tier: 'pro',
    useCase: 'Image captioning and basic scene understanding',
    apiEndpoint: 'open-source-apis/huggingface-api',
    capabilities: ['basic-scenes', 'captions', 'open-source'],
    costPerRequest: 0.005,
    avgResponseTime: 7,
    qualityScore: 70,
    enabled: false, // Will be enabled in MONTH 2
    pluginReady: true
  },
  
  'huggingface-clip': {
    id: 'huggingface-clip',
    name: 'CLIP (Image-Text Matching)',
    provider: 'huggingface',
    type: 'embedding',
    cost: 'very-low',
    speed: 'very-fast',
    tier: 'free',
    useCase: 'Image-text similarity and classification',
    apiEndpoint: 'open-source-apis/huggingface-api',
    capabilities: ['similarity', 'classification', 'open-source'],
    costPerRequest: 0.002,
    avgResponseTime: 3,
    qualityScore: 75,
    enabled: false,
    pluginReady: true
  },
  
  'ollama-llava': {
    id: 'ollama-llava',
    name: 'LLaVA (Local Privacy-First)',
    provider: 'ollama',
    type: 'vision-language',
    cost: 'free',
    speed: 'medium',
    tier: 'pro',
    useCase: 'Privacy-focused local analysis',
    apiEndpoint: 'open-source-apis/ollama-api',
    capabilities: ['text', 'basic-scenes', 'privacy-first', 'local'],
    costPerRequest: 0,
    avgResponseTime: 9,
    qualityScore: 72,
    enabled: false,
    pluginReady: true
  },
  
  'ollama-moondream': {
    id: 'ollama-moondream',
    name: 'Moondream (Lightweight Local)',
    provider: 'ollama',
    type: 'vision-language',
    cost: 'free',
    speed: 'fast',
    tier: 'free',
    useCase: 'Fast local image analysis',
    apiEndpoint: 'open-source-apis/ollama-api',
    capabilities: ['basic-scenes', 'lightweight', 'local'],
    costPerRequest: 0,
    avgResponseTime: 5,
    qualityScore: 60,
    enabled: false,
    pluginReady: true
  },
  
  'replicate-custom': {
    id: 'replicate-custom',
    name: 'Custom Replicate Models',
    provider: 'replicate',
    type: 'custom',
    cost: 'variable',
    speed: 'variable',
    tier: 'premium',
    useCase: 'Specialized custom models',
    apiEndpoint: 'open-source-apis/replicate-api',
    capabilities: ['custom-models', 'specialized'],
    costPerRequest: 0.02,
    avgResponseTime: 8,
    qualityScore: 80,
    enabled: false,
    pluginReady: true
  }
};

// Tier definitions with access control
const TIER_PERMISSIONS = {
  free: {
    level: 0,
    maxCostPerRequest: 0.005,
    dailyRequestLimit: 50,
    allowedProviders: ['tesseract', 'hybrid', 'ollama'],
    description: 'Basic AI analysis'
  },
  pro: {
    level: 1,
    maxCostPerRequest: 0.03,
    dailyRequestLimit: 200,
    allowedProviders: ['tesseract', 'hybrid', 'google', 'openai', 'huggingface', 'ollama'],
    description: 'Advanced AI analysis'
  },
  premium: {
    level: 2,
    maxCostPerRequest: 0.1,
    dailyRequestLimit: 1000,
    allowedProviders: ['all'],
    description: 'Premium AI analysis with all features'
  }
};

/**
 * Model Selector Class
 * Handles user model selection with tier-based access control
 */
class ModelSelector {
  constructor() {
    this.modelRegistry = MODEL_REGISTRY;
    this.tierPermissions = TIER_PERMISSIONS;
  }

  /**
   * Get available models for a user tier
   * @param {string} userTier - User's subscription tier (free/pro/premium)
   * @param {Array} requiredCapabilities - Optional capabilities filter
   * @returns {Array} Available models for the user
   */
  getAvailableModels(userTier, requiredCapabilities = []) {
    const tierInfo = this.tierPermissions[userTier] || this.tierPermissions.free;
    
    return Object.values(this.modelRegistry).filter(model => {
      // Check if model is enabled
      if (!model.enabled) return false;
      
      // Check tier access
      if (!this.validateTierAccess(model, userTier)) return false;
      
      // Check cost limits
      if (model.costPerRequest > tierInfo.maxCostPerRequest) return false;
      
      // Check capabilities if specified
      if (requiredCapabilities.length > 0) {
        const hasCapabilities = requiredCapabilities.every(cap => 
          model.capabilities.includes(cap)
        );
        if (!hasCapabilities) return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by quality score descending, then by cost ascending
      if (b.qualityScore !== a.qualityScore) {
        return b.qualityScore - a.qualityScore;
      }
      return a.costPerRequest - b.costPerRequest;
    });
  }

  /**
   * Select the best model for a question type and user preferences
   * @param {Object} questionType - Question type from classifier
   * @param {string} userTier - User's subscription tier
   * @param {string} userPreference - Optional user model preference
   * @param {Object} options - Additional selection options
   * @returns {Object} Selected model with routing information
   */
  selectModel(questionType, userTier, userPreference = null, options = {}) {
    const availableModels = this.getAvailableModels(userTier, questionType.capabilities);
    
    if (availableModels.length === 0) {
      throw new Error(`No available models for tier ${userTier} with required capabilities`);
    }
    
    let selectedModel;
    
    // If user has a preference and it's available, use it
    if (userPreference) {
      selectedModel = availableModels.find(model => model.id === userPreference);
      if (selectedModel) {
        return this.createModelSelection(selectedModel, questionType, 'user-preference');
      }
    }
    
    // Use default model from question type if available
    const defaultModel = availableModels.find(model => 
      model.id === questionType.defaultModel || 
      model.apiEndpoint.includes(questionType.defaultModel)
    );
    
    if (defaultModel) {
      return this.createModelSelection(defaultModel, questionType, 'question-type-default');
    }
    
    // Smart selection based on options
    if (options.prioritize === 'cost') {
      selectedModel = availableModels.sort((a, b) => a.costPerRequest - b.costPerRequest)[0];
    } else if (options.prioritize === 'speed') {
      selectedModel = availableModels.sort((a, b) => a.avgResponseTime - b.avgResponseTime)[0];
    } else if (options.prioritize === 'quality') {
      selectedModel = availableModels.sort((a, b) => b.qualityScore - a.qualityScore)[0];
    } else {
      // Default: balanced selection (quality/cost ratio)
      selectedModel = availableModels.sort((a, b) => {
        const ratioA = a.qualityScore / (a.costPerRequest * 100 + 1);
        const ratioB = b.qualityScore / (b.costPerRequest * 100 + 1);
        return ratioB - ratioA;
      })[0];
    }
    
    return this.createModelSelection(selectedModel, questionType, 'smart-selection');
  }

  /**
   * Create model selection result
   * @param {Object} model - Selected model
   * @param {Object} questionType - Question type
   * @param {string} selectionReason - Why this model was selected
   * @returns {Object} Model selection result
   */
  createModelSelection(model, questionType, selectionReason) {
    return {
      model: model,
      service: model.apiEndpoint,
      routing: {
        modelId: model.id,
        provider: model.provider,
        endpoint: model.apiEndpoint,
        capabilities: model.capabilities
      },
      estimates: {
        cost: model.costPerRequest,
        responseTime: model.avgResponseTime,
        quality: model.qualityScore
      },
      selectionReason: selectionReason,
      fallback: this.getFallbackModel(model, questionType)
    };
  }

  /**
   * Get fallback model for a given model
   * @param {Object} primaryModel - Primary model that might fail
   * @param {Object} questionType - Question type
   * @returns {Object|null} Fallback model or null
   */
  getFallbackModel(primaryModel, questionType) {
    // Don't fallback to the same model
    const availableModels = Object.values(this.modelRegistry)
      .filter(model => 
        model.enabled && 
        model.id !== primaryModel.id &&
        model.capabilities.some(cap => primaryModel.capabilities.includes(cap))
      )
      .sort((a, b) => b.qualityScore - a.qualityScore);
    
    return availableModels[0] || null;
  }

  /**
   * Validate if user tier has access to a model
   * @param {Object} model - Model to check
   * @param {string} userTier - User's subscription tier
   * @returns {boolean} True if user has access
   */
  validateTierAccess(model, userTier) {
    const tierInfo = this.tierPermissions[userTier] || this.tierPermissions.free;
    const modelTierInfo = this.tierPermissions[model.tier] || this.tierPermissions.free;
    
    // Check tier level
    if (tierInfo.level < modelTierInfo.level) return false;
    
    // Check provider access
    if (tierInfo.allowedProviders.includes('all')) return true;
    
    return tierInfo.allowedProviders.includes(model.provider);
  }

  /**
   * Get model capabilities that match question requirements
   * @param {Object} questionType - Question type with required capabilities
   * @returns {Array} Models sorted by capability match
   */
  getModelsByCapability(questionType) {
    const requiredCaps = questionType.capabilities || [];
    
    return Object.values(this.modelRegistry)
      .filter(model => model.enabled)
      .map(model => {
        const matchingCaps = model.capabilities.filter(cap => 
          requiredCaps.includes(cap)
        );
        return {
          ...model,
          capabilityMatch: matchingCaps.length / requiredCaps.length,
          matchingCapabilities: matchingCaps
        };
      })
      .filter(model => model.capabilityMatch > 0)
      .sort((a, b) => b.capabilityMatch - a.capabilityMatch);
  }

  /**
   * Get cost estimate for using a model
   * @param {string} modelId - Model identifier
   * @param {number} expectedUsage - Expected monthly usage
   * @returns {Object} Cost breakdown
   */
  getCostEstimate(modelId, expectedUsage = 100) {
    const model = this.modelRegistry[modelId];
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    const monthlyCost = model.costPerRequest * expectedUsage;
    
    return {
      modelId: model.id,
      modelName: model.name,
      costPerRequest: model.costPerRequest,
      expectedUsage: expectedUsage,
      monthlyCost: monthlyCost,
      costCategory: model.cost,
      savings: this.calculateSavings(model, expectedUsage)
    };
  }

  /**
   * Calculate potential savings compared to premium model
   * @param {Object} model - Model to compare
   * @param {number} usage - Usage amount
   * @returns {Object} Savings information
   */
  calculateSavings(model, usage) {
    const premiumModel = Object.values(this.modelRegistry)
      .find(m => m.id === 'gpt-4-vision');
    
    if (!premiumModel || model.id === premiumModel.id) {
      return { amount: 0, percentage: 0 };
    }
    
    const modelCost = model.costPerRequest * usage;
    const premiumCost = premiumModel.costPerRequest * usage;
    const savings = premiumCost - modelCost;
    const percentage = (savings / premiumCost) * 100;
    
    return {
      amount: Math.max(0, savings),
      percentage: Math.max(0, percentage)
    };
  }

  /**
   * [PLUGIN SYSTEM] Register new model (for open source APIs)
   * @param {string} modelId - Unique model identifier
   * @param {Object} modelDefinition - Model definition
   */
  registerModel(modelId, modelDefinition) {
    if (this.modelRegistry[modelId]) {
      throw new Error(`Model ${modelId} already exists`);
    }
    
    // Validate required fields
    const requiredFields = ['name', 'provider', 'type', 'tier', 'useCase', 'apiEndpoint', 'capabilities'];
    for (const field of requiredFields) {
      if (!modelDefinition[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    this.modelRegistry[modelId] = {
      id: modelId,
      enabled: true,
      ...modelDefinition
    };
  }

  /**
   * [PLUGIN SYSTEM] Enable/disable model
   * @param {string} modelId - Model to enable/disable
   * @param {boolean} enabled - Enable or disable
   */
  toggleModel(modelId, enabled) {
    if (this.modelRegistry[modelId]) {
      this.modelRegistry[modelId].enabled = enabled;
    }
  }

  /**
   * Get performance statistics for all models
   * @returns {Object} Model performance data
   */
  getModelPerformanceStats() {
    return Object.values(this.modelRegistry)
      .filter(model => model.enabled)
      .map(model => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        qualityScore: model.qualityScore,
        avgResponseTime: model.avgResponseTime,
        costPerRequest: model.costPerRequest,
        tier: model.tier,
        capabilities: model.capabilities.length
      }))
      .sort((a, b) => b.qualityScore - a.qualityScore);
  }

  /**
   * Get detailed information about a specific model
   * @param {string} modelId - The ID of the model to get info for
   * @returns {Object|null} Model information object or null if not found
   */
  async getModelInfo(modelId) {
    const model = this.modelRegistry[modelId];
    
    if (!model) {
      console.warn(`⚠️ Model not found: ${modelId}`);
      return null;
    }

    if (!model.enabled) {
      console.warn(`⚠️ Model disabled: ${modelId}`);
      return null;
    }

    return {
      id: model.id,
      name: model.name,
      provider: model.provider,
      type: model.type,
      tier: model.tier,
      useCase: model.useCase,
      capabilities: model.capabilities,
      estimatedCost: model.costPerRequest,
      responseTime: `${model.avgResponseTime}s`,
      qualityScore: model.qualityScore,
      speed: model.speed,
      cost: model.cost,
      apiEndpoint: model.apiEndpoint,
      enabled: model.enabled
    };
  }
}

export { ModelSelector }; 