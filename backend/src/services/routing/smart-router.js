// 🎯 SMART ROUTER SERVICE - DAY 3 IMPLEMENTATION
// ===============================================
// Intelligent routing system for AI services
// Routes based on question type, user preferences, tier access, and cost optimization

class SmartRouter {
  constructor(questionClassifier, modelSelector, tierAccess, costOptimizer, fallbackManager) {
    this.questionClassifier = questionClassifier;
    this.modelSelector = modelSelector;
    this.tierAccess = tierAccess;
    this.costOptimizer = costOptimizer;
    this.fallbackManager = fallbackManager;

    // Service registry mapping
    this.SERVICE_ENDPOINTS = {
      'enhanced-ocr': 'enhancedOCR',
      'google-vision-text': 'googleVision.detectText',
      'google-vision-objects': 'googleVision.detectObjects', 
      'google-vision-web': 'googleVision.detectCelebritiesAndWeb',
      'google-vision-logo': 'googleVision.detectObjects',
      'openai-vision': 'openaiEnhanced.analyzeImage',
      'openai-gpt4': 'openaiEnhanced.analyzeImage',
      'openai-gpt35': 'openaiEnhanced.analyzeImage',
      'open-source-api': 'openSourceAPI.process'
    };

    // Default routing configurations
    this.DEFAULT_ROUTES = {
      PURE_TEXT: {
        primary: 'enhanced-ocr',
        fallback: 'google-vision-text',
        model: 'tesseract',
        tier: 'free'
      },
      COUNT_OBJECTS: {
        primary: 'google-vision-objects',
        fallback: 'openai-vision',
        model: 'google-vision',
        tier: 'pro'
      },
      IDENTIFY_CELEBRITY: {
        primary: 'google-vision-web',
        fallback: 'openai-vision',
        model: 'google-vision',
        tier: 'premium'
      },
      DESCRIBE_SCENE: {
        primary: 'openai-vision',
        fallback: 'google-vision-objects',
        model: 'gpt-4-vision',
        tier: 'pro'
      },
      DETECT_OBJECTS: {
        primary: 'google-vision-objects',
        fallback: 'openai-vision', 
        model: 'google-vision',
        tier: 'pro'
      },
      CUSTOM_ANALYSIS: {
        primary: 'openai-vision',
        fallback: 'google-vision-web',
        model: 'gpt-4-vision',
        tier: 'premium'
      }
    };
  }

  /**
   * Main routing entry point
   * @param {Object} questionType - Classified question type
   * @param {string} userModelChoice - User's preferred model (optional)
   * @param {Object} userProfile - User profile with tier, preferences, usage stats
   * @param {Object} options - Additional routing options
   * @returns {Object} Routing decision with service, model, parameters, fallback
   */
  async routeRequest(questionType, userModelChoice, userProfile, options = {}) {
    const startTime = Date.now();
    console.log(`🎯 === SMART ROUTER DEBUG ===`);
    console.log(`Question Type: ${questionType.id}`);
    console.log(`User Tier: ${userProfile.tier}`);
    console.log(`User Model Choice: ${userModelChoice || 'none'}`);
    console.log(`User Profile:`, {
      id: userProfile.id,
      email: userProfile.email,
      tier: userProfile.tier,
      subscription_status: userProfile.subscription_status
    });
    console.log(`============================`);

    try {
      // 1. Validate tier access for question type
      console.log(`🔒 Checking tier access for question type: ${questionType.id}`);
      const accessCheck = await this.tierAccess.validateAccess(questionType, userProfile);
      console.log(`🔍 Access Check Result:`, {
        allowed: accessCheck.allowed,
        reason: accessCheck.reason || 'none',
        suggestedTier: accessCheck.suggestedTier || 'none'
      });
      
      if (!accessCheck.allowed) {
        console.error(`🚫 TIER ACCESS DENIED: ${accessCheck.reason}`);
        console.error(`   Question Type: ${questionType.id}`);
        console.error(`   User Tier: ${userProfile.tier}`);
        console.error(`   Suggested Tier: ${accessCheck.suggestedTier}`);
        return this.getFallbackRoute(questionType, userProfile, accessCheck.suggestedTier);
      }
      
      console.log(`✅ TIER ACCESS GRANTED: Proceeding with routing`);

      // 2. Get available models for user's tier
      console.log(`🔍 Getting available models for tier: ${userProfile.tier}`);
      const availableModels = await this.modelSelector.getAvailableModels(userProfile.tier);
      console.log(`📋 Available Models:`, availableModels.map(m => `${m.id} (${m.tier})`));
      
      // 3. Determine model choice (user preference or default)
      console.log(`🎯 Selecting model...`);
      const selectedModel = this.selectModel(questionType, userModelChoice, availableModels, userProfile);
      console.log(`✅ Selected Model: ${selectedModel}`);
      
      // 4. Get service configuration for selected model
      const serviceConfig = await this.getServiceConfiguration(questionType, selectedModel, userProfile);

      // 5. Apply cost optimization if enabled
      let optimizedRoute = serviceConfig;
      if (userProfile.costOptimization && this.costOptimizer) {
        optimizedRoute = await this.costOptimizer.optimizeRoute(serviceConfig, userProfile.budget);
      }

      // 6. Validate service availability and prepare fallback
      const finalRoute = await this.prepareFinalRoute(optimizedRoute, questionType, userProfile);

      // 7. Add routing metadata
      finalRoute.metadata = {
        routingTime: Date.now() - startTime,
        accessTier: userProfile.tier,
        userChoice: !!userModelChoice,
        optimized: userProfile.costOptimization,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Smart Router: Route prepared in ${finalRoute.metadata.routingTime}ms`);
      console.log(`   Service: ${finalRoute.service}, Model: ${finalRoute.model}, Cost: $${finalRoute.estimatedCost}`);

      return finalRoute;

    } catch (error) {
      console.error('❌ Smart Router: Routing error:', error);
      return this.getErrorFallback(questionType, userProfile, error);
    }
  }

  /**
   * Select the best model for the request
   */
  selectModel(questionType, userModelChoice, availableModels, userProfile) {
    // If user specified a model preference and it's available
    if (userModelChoice && availableModels.find(m => m.id === userModelChoice)) {
      console.log(`👤 Smart Router: Using user preference: ${userModelChoice}`);
      return userModelChoice;
    }

    // Use default model for question type
    const defaultRoute = this.DEFAULT_ROUTES[questionType.id];
    if (defaultRoute) {
      const defaultModel = defaultRoute.model;
      
      // Check if default model is available for user's tier
      if (availableModels.find(m => m.id === defaultModel)) {
        console.log(`🎯 Smart Router: Using default model: ${defaultModel}`);
        return defaultModel;
      }
    }

    // Fallback to best available model for tier
    const bestModel = this.findBestModelForTier(questionType, availableModels, userProfile);
    console.log(`🔄 Smart Router: Using best available model: ${bestModel}`);
    return bestModel;
  }

  /**
   * Get service configuration for model and question type
   */
  async getServiceConfiguration(questionType, selectedModel, userProfile) {
    const modelInfo = await this.modelSelector.getModelInfo(selectedModel);
    const defaultRoute = this.DEFAULT_ROUTES[questionType.id];

    // Determine primary service based on model
    let primaryService;
    if (modelInfo.provider === 'google') {
      primaryService = this.getGoogleVisionService(questionType.id);
    } else if (modelInfo.provider === 'openai') {
      primaryService = 'openai-vision';
    } else if (modelInfo.provider === 'hybrid') {
      primaryService = 'enhanced-ocr';
    } else {
      primaryService = 'open-source-api';
    }

    // Build service configuration
    return {
      service: primaryService,
      model: selectedModel,
      parameters: this.buildServiceParameters(questionType, modelInfo, userProfile),
      fallback: defaultRoute?.fallback || 'enhanced-ocr',
      estimatedCost: modelInfo.estimatedCost || 0.01,
      estimatedTime: modelInfo.responseTime || '5s',
      cacheOptions: this.getCacheOptions(primaryService, questionType)
    };
  }

  /**
   * Get appropriate Google Vision service based on question type
   */
  getGoogleVisionService(questionType) {
    const googleServiceMap = {
      'PURE_TEXT': 'google-vision-text',
      'COUNT_OBJECTS': 'google-vision-objects',
      'IDENTIFY_CELEBRITY': 'google-vision-web',
      'DETECT_OBJECTS': 'google-vision-objects',
      'CUSTOM_ANALYSIS': 'google-vision-web'
    };
    
    return googleServiceMap[questionType] || 'google-vision-objects';
  }

  /**
   * Build service-specific parameters
   */
  buildServiceParameters(questionType, modelInfo, userProfile) {
    const baseParams = {
      language: userProfile.language || 'en',
      includeRegions: questionType.needsRegions || false,
      maxResults: questionType.maxResults || 10
    };

    // Add service-specific parameters
    if (modelInfo.provider === 'google') {
      baseParams.confidenceThreshold = 0.8;
      baseParams.maxResults = questionType.id === 'COUNT_OBJECTS' ? 50 : 10;
    }

    if (modelInfo.provider === 'openai') {
      baseParams.maxTokens = questionType.complexity === 'high' ? 500 : 150;
      baseParams.temperature = 0.1; // Low temperature for factual analysis
    }

    return baseParams;
  }

  /**
   * Get cache options for service
   */
  getCacheOptions(service, questionType) {
    const cacheStrategies = {
      'enhanced-ocr': { ttl: 3600, compress: true },
      'google-vision-text': { ttl: 3600, compress: true },
      'google-vision-objects': { ttl: 21600, compress: true },
      'google-vision-web': { ttl: 604800, compress: false },
      'openai-vision': { ttl: 3600, compress: true }
    };

    return cacheStrategies[service] || { ttl: 3600, compress: true };
  }

  /**
   * Prepare final route with validation and fallback
   */
  async prepareFinalRoute(route, questionType, userProfile) {
    // Validate service endpoint exists
    if (!this.SERVICE_ENDPOINTS[route.service]) {
      console.log(`⚠️ Smart Router: Service ${route.service} not found, using fallback`);
      route.service = route.fallback;
    }

    // Add fallback chain
    route.fallbackChain = await this.fallbackManager.buildFallbackChain(
      route.service,
      questionType,
      userProfile.tier
    );

    // Add routing flags
    route.flags = {
      requiresAuth: true,
      trackUsage: true,
      billable: route.estimatedCost > 0,
      cacheable: true
    };

    return route;
  }

  /**
   * Find best available model for user's tier
   */
  findBestModelForTier(questionType, availableModels, userProfile) {
    // Sort models by quality and tier compatibility
    const compatibleModels = availableModels.filter(model => {
      return model.tier === userProfile.tier || 
             this.tierAccess.canAccessLowerTier(userProfile.tier, model.tier);
    });

    if (compatibleModels.length === 0) {
      return 'enhanced-ocr'; // Ultimate fallback
    }

    // Find best model for question type
    const questionCapabilities = questionType.requiredCapabilities || [];
    
    const scoredModels = compatibleModels.map(model => {
      let score = 0;
      
      // Capability match score
      const capabilityMatch = questionCapabilities.filter(cap => 
        model.capabilities.includes(cap)
      ).length;
      score += capabilityMatch * 10;
      
      // Quality score
      const qualityScore = { 'high': 3, 'medium': 2, 'low': 1 }[model.quality] || 1;
      score += qualityScore;
      
      // Speed preference (faster is better for some question types)
      if (questionType.preferFast && model.speed === 'fast') {
        score += 2;
      }

      return { model, score };
    });

    // Return highest scoring model
    scoredModels.sort((a, b) => b.score - a.score);
    return scoredModels[0].model.id;
  }

  /**
   * Get fallback route when access is denied
   */
  getFallbackRoute(questionType, userProfile, suggestedTier) {
    return {
      service: 'enhanced-ocr',
      model: 'tesseract',
      parameters: { language: userProfile.language || 'en' },
      fallback: null,
      estimatedCost: 0.0,
      estimatedTime: '3-5s',
      accessDenied: true,
      suggestedTier: suggestedTier,
      message: `This feature requires ${suggestedTier} tier. Falling back to basic OCR.`,
      cacheOptions: { ttl: 1800, compress: true }
    };
  }

  /**
   * Get error fallback route
   */
  getErrorFallback(questionType, userProfile, error) {
    return {
      service: 'enhanced-ocr',
      model: 'tesseract',
      parameters: { language: userProfile.language || 'en' },
      fallback: null,
      estimatedCost: 0.0,
      estimatedTime: '3-5s',
      error: true,
      errorMessage: error.message,
      cacheOptions: { ttl: 300, compress: true } // Short cache for errors
    };
  }

  /**
   * Get routing statistics
   */
  async getRoutingStats(timeRange = '24h') {
    return {
      totalRoutes: 0, // Would track in analytics
      serviceBreakdown: {},
      averageRoutingTime: 0,
      fallbackRate: 0,
      errorRate: 0,
      costOptimizationSavings: 0
    };
  }

  /**
   * Test routing decision without executing
   */
  async dryRunRoute(questionType, userModelChoice, userProfile) {
    console.log('🧪 Smart Router: Dry run mode - no actual routing');
    
    const route = await this.routeRequest(questionType, userModelChoice, userProfile);
    route.dryRun = true;
    
    return {
      wouldRoute: route,
      reasoning: this.explainRoutingDecision(route),
      alternatives: await this.getAlternativeRoutes(questionType, userProfile)
    };
  }

  /**
   * Explain routing decision for debugging
   */
  explainRoutingDecision(route) {
    return {
      serviceChosen: route.service,
      modelChosen: route.model,
      reason: `Selected based on question type ${route.questionType} and user tier ${route.metadata?.accessTier}`,
      costConsideration: route.estimatedCost,
      fallbackAvailable: !!route.fallback
    };
  }

  /**
   * Get alternative routing options
   */
  async getAlternativeRoutes(questionType, userProfile) {
    const alternatives = [];
    
    // Try different models available to user
    const availableModels = await this.modelSelector.getAvailableModels(userProfile.tier);
    
    for (const model of availableModels.slice(0, 3)) { // Top 3 alternatives
      try {
        const altRoute = await this.getServiceConfiguration(questionType, model.id, userProfile);
        alternatives.push({
          model: model.id,
          service: altRoute.service,
          cost: altRoute.estimatedCost,
          time: altRoute.estimatedTime
        });
      } catch (error) {
        // Skip invalid alternatives
      }
    }

    return alternatives;
  }
}

export { SmartRouter }; 